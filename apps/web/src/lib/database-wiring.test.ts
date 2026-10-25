// @vitest-environment node

import { auth } from "@teamsster/auth";
import { db, pool, provisionUserOnboarding, users } from "@teamsster/db";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// Never use configured credentials, even if a transport spy is accidentally removed.
vi.hoisted(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@127.0.0.1:1/wiring_test");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  vi.stubEnv(
    "BETTER_AUTH_SECRET",
    "wiring-test-only-secret-not-for-production",
  );
  vi.stubEnv("AUTH_SMTP_URL", undefined);
  vi.stubEnv("AUTH_EMAIL_FROM", "Wiring test <noreply@example.test>");
});

// Exercise the actual driver, adapter, and schema. Only the pg transport is
// stubbed: these are wiring regressions, not proof of PostgreSQL persistence.
const query =
  vi.fn<
    (
      config: { text: string },
      values: unknown[],
    ) => Promise<{
      rows: unknown[][];
      rowCount: number;
    }>
  >();
const release = vi.fn();
const profileId = "00000000-0000-4000-8000-000000000001";
const leagueId = "00000000-0000-4000-8000-000000000002";

function statements() {
  return query.mock.calls.map(([config]) => config.text);
}

beforeEach(() => {
  query.mockReset().mockResolvedValue({ rows: [], rowCount: 0 });
  release.mockReset();
  vi.spyOn(pool, "connect").mockImplementation(async () => ({
    query,
    release,
  }));
  vi.spyOn(pool, "query").mockImplementation(() => {
    throw new Error("Unexpected query outside the checked-out transaction.");
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await pool.end();
  vi.unstubAllEnvs();
});

describe("Node Postgres transaction wiring", () => {
  it("commits schema-aware writes on one checked-out connection", async () => {
    query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [[profileId]], rowCount: 1 });

    const result = await db.transaction(async (tx) => {
      return tx
        .insert(users)
        .values({ email: "profile@example.test" })
        .returning({ id: users.id });
    });

    expect(db.$client).toBe(pool);
    expect(result).toEqual([{ id: profileId }]);
    expect(statements()).toEqual([
      "begin",
      expect.stringContaining('insert into "users"'),
      "commit",
    ]);
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(pool.query).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it.each([
    false,
    true,
  ])("keeps profile, Personal League, and membership in one transaction (failure: %s)", async (failMembership) => {
    const failure = new Error("Membership write failed");
    query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Existing profile
      .mockResolvedValueOnce({ rows: [[profileId]], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // Existing ownership
      .mockResolvedValueOnce({ rows: [[leagueId]], rowCount: 1 });
    if (failMembership) {
      query.mockRejectedValueOnce(failure);
    }

    const operation = provisionUserOnboarding({
      authUserId: "auth-user-test",
      displayName: "Test Coach",
      email: "coach@example.test",
    });
    if (failMembership) {
      await expect(operation).rejects.toMatchObject({ cause: failure });
    } else {
      await expect(operation).resolves.toEqual({
        createdPersonalLeague: true,
        userId: profileId,
        leagueId,
      });
    }

    expect(statements()).toEqual([
      "begin",
      expect.stringContaining('from "users"'),
      expect.stringContaining('insert into "users"'),
      expect.stringContaining('from "league_members"'),
      expect.stringContaining('insert into "leagues"'),
      expect.stringContaining('insert into "league_members"'),
      failMembership ? "rollback" : "commit",
    ]);
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(pool.query).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
  });
});

describe("Better Auth Drizzle wiring", () => {
  it.each([
    ["user", "username", "testcoach", "username"],
    ["session", "userId", "auth-user-test", "user_id"],
    ["account", "providerId", "credential", "provider_id"],
    ["verification", "identifier", "coach@example.test", "identifier"],
  ])("queries the auth %s table with mapped columns", async (model, field, value, column) => {
    const transport = vi.mocked(pool.query).mockImplementation(async () => ({
      rows: [],
      rowCount: 0,
      command: "SELECT",
      oid: 0,
      fields: [],
    }));
    const { adapter } = await auth.$context;

    await expect(
      adapter.findOne({ model, where: [{ field, value }] }),
    ).resolves.toBeNull();

    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(`from "${model}"`),
      }),
      [value],
    );
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining(`"${model}"."${column}"`),
      }),
      expect.any(Array),
    );
  });

  it("maps auth user writes and returned dates without touching app profiles", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const transport = vi.mocked(pool.query).mockImplementation(async () => ({
      rows: [
        [
          "auth-user-test",
          "Test Coach",
          "coach@example.test",
          false,
          null,
          "testcoach",
          "TestCoach",
          now.toISOString(),
          now.toISOString(),
        ],
      ],
      rowCount: 1,
      command: "INSERT",
      oid: 0,
      fields: [],
    }));
    const { adapter } = await auth.$context;

    const created = await adapter.create({
      model: "user",
      data: {
        name: "Test Coach",
        email: "coach@example.test",
        emailVerified: false,
        username: "testcoach",
        displayUsername: "TestCoach",
        createdAt: now,
        updatedAt: now,
      },
    });

    expect(created).toMatchObject({
      id: "auth-user-test",
      emailVerified: false,
      username: "testcoach",
      displayUsername: "TestCoach",
      createdAt: now,
      updatedAt: now,
    });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('insert into "user"'),
      }),
      expect.arrayContaining(["testcoach", "TestCoach"]),
    );
  });

  it("uses a real driver transaction for adapter rollback", async () => {
    const { adapter } = await auth.$context;
    const failure = new Error("Abort auth mutation");

    await expect(
      adapter.transaction(async (tx) => {
        await tx.delete({
          model: "session",
          where: [{ field: "userId", value: "auth-user-test" }],
        });
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(statements()).toEqual([
      "begin",
      expect.stringContaining('delete from "session"'),
      "rollback",
    ]);
    expect(pool.connect).toHaveBeenCalledTimes(1);
    expect(pool.query).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
  });
});
