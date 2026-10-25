import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getActiveUserAuthIds = vi.fn();
const getEventRemindersForUser = vi.fn();

vi.mock("@teamsster/db", () => ({
  getActiveUserAuthIds: () => getActiveUserAuthIds(),
}));

vi.mock("@/lib/reminder", () => ({
  getEventRemindersForUser: (...args: unknown[]) =>
    getEventRemindersForUser(...args),
}));

import { GET } from "@/app/api/cron/reminders/route";

function makeRequest(authorization = "Bearer test-secret") {
  return new Request("http://localhost/api/cron/reminders", {
    headers: { authorization },
  }) as unknown as Parameters<typeof GET>[0];
}

describe("reminders cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-secret");
    getActiveUserAuthIds.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("processes active users concurrently within a batch", async () => {
    const started: string[] = [];
    const resolvers = new Map<string, (value: { due: unknown[] }) => void>();

    getActiveUserAuthIds.mockResolvedValue(["auth-user-1", "auth-user-2"]);
    getEventRemindersForUser.mockImplementation(
      (authUserId: string) =>
        new Promise((resolve) => {
          started.push(authUserId);
          resolvers.set(authUserId, resolve);
        }),
    );

    const responsePromise = GET(makeRequest());
    await vi.waitFor(() => {
      expect(started).toEqual(["auth-user-1", "auth-user-2"]);
    });

    resolvers.get("auth-user-1")?.({ due: [{ id: "reminder-1" }] });
    resolvers.get("auth-user-2")?.({
      due: [{ id: "reminder-2" }, { id: "reminder-3" }],
    });

    const response = await responsePromise;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      processed: 2,
      remindersFound: 3,
    });
  });

  it("requires the cron authorization header", async () => {
    const response = await GET(makeRequest("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(getActiveUserAuthIds).not.toHaveBeenCalled();
  });
});
