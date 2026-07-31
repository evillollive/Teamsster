import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const getUserIdByAuthUserId = vi.fn();
const registerDeviceToken = vi.fn();

vi.mock("@teamsster/auth", () => ({
  auth: { api: { getSession: () => getSession() } },
}));

vi.mock("@teamsster/db", () => ({
  getDeviceTokensForUser: vi.fn(),
  getUserIdByAuthUserId: () => getUserIdByAuthUserId(),
  registerDeviceToken: (...args: unknown[]) => registerDeviceToken(...args),
  unregisterDeviceToken: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

import { POST } from "@/app/api/v1/push-tokens/route";

function makeRequest() {
  return new Request("http://localhost/api/v1/push-tokens", {
    method: "POST",
    body: JSON.stringify({ token: "abc", platform: "web" }),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("push-tokens POST rate limiting", () => {
  beforeEach(() => {
    getSession.mockReset();
    getUserIdByAuthUserId.mockReset();
    registerDeviceToken.mockReset();
    getSession.mockResolvedValue({ user: { id: "auth-user" } });
    getUserIdByAuthUserId.mockResolvedValue("user-1");
    registerDeviceToken.mockResolvedValue("token-row-id");
  });

  it("allows up to the configured attempts then returns 429", async () => {
    // 5 allowed attempts (PUSH_TOKEN_RATE_LIMIT.maxAttempts)
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest());
      expect(res.status).toBe(201);
    }

    const blocked = await POST(makeRequest());
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    // The DB write should not have been attempted on the blocked request.
    expect(registerDeviceToken).toHaveBeenCalledTimes(5);
  });

  it("returns 401 when unauthenticated", async () => {
    getSession.mockResolvedValue(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });
});
