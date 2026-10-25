import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { SMTPServer } from "smtp-server";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const databaseName = `teamsster_integration_${randomUUID().replaceAll("-", "")}`;
const origin = "http://127.0.0.1:3000";
const password = "Local-integration-password-123!";
const mail: string[] = [];
let clientNumber = 0;
let admin: Pool | undefined;
let reader: Pool | undefined;
let databaseCreated = false;
let smtp: SMTPServer | undefined;
let storage: typeof import("@teamsster/db") | undefined;
let auth: typeof import("@teamsster/auth")["auth"];

function runMigrations() {
  execFileSync("pnpm", ["db:migrate"], {
    cwd: fileURLToPath(new URL("../../../../", import.meta.url)),
    env: process.env,
    timeout: 25_000,
    stdio: "pipe",
  });
}

async function request(
  path: string,
  body?: Record<string, unknown>,
  cookie?: string,
) {
  return auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        origin,
        "x-forwarded-for": `192.0.2.${clientNumber}`,
        ...(body ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

function cookies(response: Response) {
  const result = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  expect(result).toContain("better-auth.session_token=");
  return result;
}

async function signup(email: string, username: string) {
  const response = await request("/sign-up/email", {
    email,
    username,
    name: "Integration Coach",
    password,
  });
  expect(response.status, await response.clone().text()).toBe(200);
  const result = await response.json();
  expect(result.token).toBeNull();
  expect(result.user.emailVerified).toBe(false);
  const userId: unknown = result.user.id;
  if (typeof userId !== "string")
    throw new Error("Signup returned no user ID.");
  return userId;
}

async function verifyLatestEmail() {
  const message = mail.at(-1)?.replace(/=\r\n/g, "").replace(/=3D/g, "=");
  expect(message).toBeDefined();
  const link = message?.match(
    /http:\/\/127\.0\.0\.1:3000\/api\/auth\/verify-email\?token=[A-Za-z0-9._-]+/,
  )?.[0];
  if (!link)
    throw new Error("Verification email contained no verification link.");
  const response = await auth.handler(
    new Request(link, {
      headers: { "x-forwarded-for": `192.0.2.${clientNumber}` },
    }),
  );
  expect(response.status, await response.clone().text()).toBe(200);
  return cookies(response);
}

beforeAll(async () => {
  const target = process.env.TEST_DATABASE_URL;
  if (!target) {
    throw new Error(
      "TEST_DATABASE_URL must point to a local PostgreSQL server with CREATEDB permission.",
    );
  }
  const url = new URL(target);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.search
  ) {
    throw new Error(
      "Integration tests require a loopback PostgreSQL URL without query overrides.",
    );
  }
  admin = new Pool({
    connectionString: target,
    connectionTimeoutMillis: 5_000,
  });
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  databaseCreated = true;
  url.pathname = `/${databaseName}`;

  smtp = new SMTPServer({
    disabledCommands: ["AUTH", "STARTTLS"],
    authOptional: true,
    logger: false,
    onData(stream, _session, done) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("error", done);
      stream.on("end", () => {
        mail.push(Buffer.concat(chunks).toString("utf8"));
        done();
      });
    },
  });
  const server = smtp;
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.server.address();
  if (!address || typeof address === "string") {
    throw new Error("SMTP capture server did not bind a TCP port.");
  }
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("DATABASE_URL", url.toString());
  vi.stubEnv("BETTER_AUTH_URL", origin);
  vi.stubEnv(
    "BETTER_AUTH_SECRET",
    "local-integration-secret-not-for-production",
  );
  vi.stubEnv("AUTH_EMAIL_FROM", "Teamsster tests <noreply@example.test>");
  vi.stubEnv("AUTH_SMTP_URL", `smtp://127.0.0.1:${address.port}`);
  runMigrations();
  storage = await import("@teamsster/db");
  ({ auth } = await import("@teamsster/auth"));
  reader = new Pool({
    connectionString: url.toString(),
    connectionTimeoutMillis: 5_000,
  });
});

beforeEach(() => {
  // Independent synthetic clients retain the real per-client rate limiter.
  clientNumber += 1;
});

afterAll(async () => {
  try {
    await storage?.pool.end();
    await reader?.end();
    if (databaseCreated) {
      await admin?.query(`DROP DATABASE "${databaseName}"`);
    }
  } finally {
    await admin?.end();
    if (smtp) {
      const server = smtp;
      await new Promise<void>((resolve) => server.close(resolve));
    }
    vi.unstubAllEnvs();
  }
});

describe.sequential("real PostgreSQL and Better Auth integration", () => {
  it("applies all migrations on an empty database and safely reruns them", async () => {
    const before = await reader?.query(
      "SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations",
    );
    expect(before?.rows[0].count).toBe(19);
    runMigrations();
    const after = await reader?.query(
      "SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations",
    );
    expect(after?.rows[0].count).toBe(19);
  });

  it("signs up, verifies actual SMTP mail, logs in by email/username, and revokes sessions", async () => {
    const email = "auth@example.test";
    const userId = await signup(email, "auth_coach");
    const persisted = await reader?.query(
      `SELECT u.email_verified, a.provider_id, p.id AS profile_id, m.roles::text[] AS roles
       FROM "user" u JOIN account a ON a.user_id = u.id
       JOIN users p ON p.auth_user_id = u.id
       JOIN league_members m ON m.user_id = p.id WHERE u.id = $1`,
      [userId],
    );
    expect(persisted?.rows).toHaveLength(1);
    expect(persisted?.rows[0]).toMatchObject({
      email_verified: false,
      provider_id: "credential",
      roles: ["OWNER"],
    });
    expect((await request("/sign-in/email", { email, password })).status).toBe(
      403,
    );
    const verifiedCookie = await verifyLatestEmail();
    const verifiedSession = await request(
      "/get-session",
      undefined,
      verifiedCookie,
    );
    expect((await verifiedSession.json()).user.id).toBe(userId);
    const invalid = await request("/sign-in/email", {
      email,
      password: "Wrong-password-123!",
    });
    expect(invalid.status).toBe(401);

    for (const [path, body] of [
      ["/sign-in/email", { email, password }],
      ["/sign-in/username", { username: "auth_coach", password }],
    ] as const) {
      const signedIn = await request(path, body);
      expect(signedIn.status, await signedIn.clone().text()).toBe(200);
      const cookie = cookies(signedIn);
      const session = await request("/get-session", undefined, cookie);
      expect((await session.json()).user.id).toBe(userId);
      expect((await request("/sign-out", {}, cookie)).status).toBe(200);
      expect(
        await (await request("/get-session", undefined, cookie)).json(),
      ).toBeNull();
    }
  });

  it("persists league/team/event writes and denies an outsider without side effects", async () => {
    const userId = await signup("owner@example.test", "owner_coach");
    await verifyLatestEmail();
    const { createLeagueForUser, getLeaguesForUser } = await import(
      "@/lib/league"
    );
    const { createTeamForUser } = await import("@/lib/team");
    const { createTeamEventForUser, getTeamEventsForTeamAsViewer } =
      await import("@/lib/event");
    const { leagueId } = await createLeagueForUser(userId, {
      name: "Integration League",
      timezone: "America/New_York",
    });
    const { teamId } = await createTeamForUser(userId, {
      leagueId,
      name: "Integration Team",
      timezone: "America/New_York",
    });
    const event = {
      leagueId,
      teamId,
      eventType: "PRACTICE" as const,
      title: "Integration Practice",
      description: undefined,
      location: undefined,
      startsAt: new Date("2026-11-01T15:00:00Z"),
      endsAt: new Date("2026-11-01T16:00:00Z"),
      timezone: "America/New_York",
      recurrenceFrequency: "NONE" as const,
      recurrenceInterval: 1,
      recurrenceUntil: undefined,
    };
    await createTeamEventForUser(userId, event);
    expect(await getLeaguesForUser(userId)).toHaveLength(2);
    expect(
      await getTeamEventsForTeamAsViewer(userId, leagueId, teamId),
    ).toEqual([expect.objectContaining({ title: event.title })]);
    const persisted = await reader?.query(
      "SELECT title FROM team_events WHERE league_id = $1 AND team_id = $2",
      [leagueId, teamId],
    );
    expect(persisted?.rows).toEqual([{ title: event.title }]);
    const audit = await reader?.query(
      "SELECT action FROM audit_logs WHERE league_id = $1 ORDER BY action",
      [leagueId],
    );
    expect(audit?.rows.map((row) => row.action)).toEqual([
      "league.create",
      "team.create",
      "team_event.create",
    ]);

    const outsider = await signup("outsider@example.test", "outsider_coach");
    await expect(createTeamEventForUser(outsider, event)).rejects.toThrow(
      "not a member",
    );
    expect(
      (await reader?.query("SELECT count(*)::int AS count FROM team_events"))
        ?.rows[0].count,
    ).toBe(1);
  });

  it("rolls back actual PostgreSQL writes after a constraint failure", async () => {
    if (!storage) throw new Error("Database setup failed.");
    const { db, users } = storage;
    await expect(
      db.transaction(async (tx) => {
        await tx.insert(users).values({ email: "rollback@example.test" });
        await tx.insert(users).values({ email: "rollback@example.test" });
      }),
    ).rejects.toMatchObject({ cause: { code: "23505" } });
    const rows = await reader?.query("SELECT id FROM users WHERE email = $1", [
      "rollback@example.test",
    ]);
    expect(rows?.rows).toEqual([]);
  });

  it("does not persist a team when its audit write fails", async () => {
    const userId = await signup("audit@example.test", "audit_coach");
    const { getLeaguesForUser } = await import("@/lib/league");
    const { createTeamForUser } = await import("@/lib/team");
    const [league] = await getLeaguesForUser(userId);
    await reader?.query(`
      CREATE FUNCTION reject_test_team_audit() RETURNS trigger AS $$
      BEGIN
        IF NEW.action = 'team.create'
          AND NEW.metadata->>'name' = 'Rollback Team' THEN
          RAISE EXCEPTION 'Intentional integration audit failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER reject_test_team_audit BEFORE INSERT ON audit_logs
        FOR EACH ROW EXECUTE FUNCTION reject_test_team_audit();
    `);
    try {
      await expect(
        createTeamForUser(userId, {
          leagueId: league.id,
          name: "Rollback Team",
          timezone: "UTC",
        }),
      ).rejects.toMatchObject({ cause: { code: "P0001" } });
      expect(
        (
          await reader?.query("SELECT id FROM teams WHERE name = $1", [
            "Rollback Team",
          ])
        )?.rows,
      ).toEqual([]);
    } finally {
      await reader?.query(
        "DROP TRIGGER reject_test_team_audit ON audit_logs; DROP FUNCTION reject_test_team_audit();",
      );
    }
  });

  it("rolls back the real auth adapter transaction", async () => {
    const { adapter } = await auth.$context;
    const failure = new Error("Abort verification write");
    await expect(
      adapter.transaction(async (tx) => {
        await tx.create({
          model: "verification",
          data: {
            identifier: "rollback-verification",
            value: "local-test-token",
            expiresAt: new Date(Date.now() + 60_000),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(
      (
        await reader?.query(
          "SELECT id FROM verification WHERE identifier = $1",
          ["rollback-verification"],
        )
      )?.rows,
    ).toEqual([]);
  });
});
