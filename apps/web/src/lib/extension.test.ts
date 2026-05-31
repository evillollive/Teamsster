import {
  API_RATE_LIMITS,
  calculateGoalDifference,
  calculatePoints,
  clearAllHooks,
  createEmptyStanding,
  DOMAIN_EVENTS,
  fireHooks,
  formatAmount,
  getRegisteredHooks,
  getRegisteredModules,
  isValidAmount,
  isValidApiKeyFormat,
  registerHook,
  registerModule,
  sortStandings,
  unregisterHook,
  updateStandingFromScore,
  validateApiAuth,
  verifyWebhookSignature,
} from "@teamsster/db";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  clearAllHooks();
});

describe("hook system", () => {
  it("registers and fires hooks", async () => {
    let called = false;
    registerHook("test-module", "event.created", async () => {
      called = true;
    });

    await fireHooks({
      event: "event.created",
      timestamp: new Date(),
      leagueId: "l1",
      data: {},
    });

    expect(called).toBe(true);
  });

  it("only fires hooks for the matching event", async () => {
    let eventCreatedCalled = false;
    let eventCancelledCalled = false;

    registerHook("mod", "event.created", async () => {
      eventCreatedCalled = true;
    });
    registerHook("mod", "event.cancelled", async () => {
      eventCancelledCalled = true;
    });

    await fireHooks({
      event: "event.created",
      timestamp: new Date(),
      leagueId: "l1",
      data: {},
    });

    expect(eventCreatedCalled).toBe(true);
    expect(eventCancelledCalled).toBe(false);
  });

  it("unregisters hooks by ID", async () => {
    let called = false;
    const hookId = registerHook("mod", "event.created", async () => {
      called = true;
    });

    unregisterHook(hookId);

    await fireHooks({
      event: "event.created",
      timestamp: new Date(),
      leagueId: "l1",
      data: {},
    });

    expect(called).toBe(false);
  });

  it("lists registered hooks", () => {
    registerHook("mod-a", "event.created", async () => {});
    registerHook("mod-b", "score.published", async () => {});

    const hooks = getRegisteredHooks();
    expect(hooks.length).toBe(2);
    expect(hooks[0].moduleId).toBe("mod-a");
    expect(hooks[1].event).toBe("score.published");
  });

  it("handles errors in individual hooks without blocking others", async () => {
    let secondCalled = false;

    registerHook("mod", "event.created", async () => {
      throw new Error("Hook error");
    });
    registerHook("mod", "event.created", async () => {
      secondCalled = true;
    });

    await fireHooks({
      event: "event.created",
      timestamp: new Date(),
      leagueId: "l1",
      data: {},
    });

    expect(secondCalled).toBe(true);
  });
});

describe("module registration", () => {
  it("registers a module", () => {
    registerModule({
      id: "test-mod",
      name: "Test Module",
      version: "1.0.0",
      description: "A test module.",
      hooks: [],
    });

    const modules = getRegisteredModules();
    expect(modules.some((m) => m.id === "test-mod")).toBe(true);
  });
});

describe("DOMAIN_EVENTS", () => {
  it("defines all expected event types", () => {
    expect(DOMAIN_EVENTS).toContain("event.created");
    expect(DOMAIN_EVENTS).toContain("score.published");
    expect(DOMAIN_EVENTS).toContain("registration.submitted");
    expect(DOMAIN_EVENTS).toContain("volunteer.signup");
    expect(DOMAIN_EVENTS).toContain("membership.role_changed");
  });
});

describe("API auth validation", () => {
  it("rejects missing auth header", () => {
    const result = validateApiAuth({});
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Missing");
  });

  it("rejects non-Bearer auth", () => {
    const result = validateApiAuth({ authorization: "Basic abc123" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Bearer");
  });

  it("rejects short tokens", () => {
    const result = validateApiAuth({ authorization: "Bearer short" });
    expect(result.valid).toBe(false);
  });

  it("accepts valid Bearer token", () => {
    const result = validateApiAuth({
      authorization: "Bearer " + "a".repeat(64),
    });
    expect(result.valid).toBe(true);
  });
});

describe("isValidApiKeyFormat", () => {
  it("accepts 64-char hex string", () => {
    expect(isValidApiKeyFormat("a".repeat(64))).toBe(true);
    expect(isValidApiKeyFormat("abcdef0123456789".repeat(4))).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidApiKeyFormat("short")).toBe(false);
    expect(isValidApiKeyFormat("G".repeat(64))).toBe(false);
    expect(isValidApiKeyFormat("")).toBe(false);
  });
});

describe("API_RATE_LIMITS", () => {
  it("defines limits", () => {
    expect(API_RATE_LIMITS.requestsPerMinute).toBe(60);
    expect(API_RATE_LIMITS.requestsPerHour).toBe(1000);
    expect(API_RATE_LIMITS.burstLimit).toBe(10);
  });
});

// ── Proof module tests ───────────────────────────────────────────────────────

describe("payments proof module", () => {
  it("validates payment amounts", () => {
    expect(isValidAmount(1000)).toBe(true);
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-100)).toBe(false);
    expect(isValidAmount(1_000_000)).toBe(false);
    expect(isValidAmount(Number.NaN)).toBe(false);
    expect(isValidAmount(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("formats amounts with currency symbols", () => {
    expect(formatAmount(1500, "usd")).toBe("$15.00");
    expect(formatAmount(2050, "eur")).toBe("€20.50");
    expect(formatAmount(999, "gbp")).toBe("£9.99");
    expect(formatAmount(500, "cad")).toBe("CAD 5.00");
  });

  it("validates webhook signatures (format check)", () => {
    expect(verifyWebhookSignature("payload", "a".repeat(32), "secret")).toBe(
      true,
    );
    expect(verifyWebhookSignature("payload", "short", "secret")).toBe(false);
    expect(verifyWebhookSignature("", "sig", "secret")).toBe(false);
  });
});

describe("stats proof module", () => {
  it("calculates points (3 for win, 1 for tie)", () => {
    expect(calculatePoints(5, 2)).toBe(17);
    expect(calculatePoints(0, 0)).toBe(0);
    expect(calculatePoints(10, 0)).toBe(30);
  });

  it("calculates goal difference", () => {
    expect(calculateGoalDifference(15, 8)).toBe(7);
    expect(calculateGoalDifference(5, 10)).toBe(-5);
    expect(calculateGoalDifference(0, 0)).toBe(0);
  });

  it("creates empty standing", () => {
    const standing = createEmptyStanding("t1", "Eagles");
    expect(standing.wins).toBe(0);
    expect(standing.points).toBe(0);
    expect(standing.teamName).toBe("Eagles");
  });

  it("updates standing from a win", () => {
    const standing = createEmptyStanding("t1", "Eagles");
    const updated = updateStandingFromScore(standing, 3, 1);
    expect(updated.wins).toBe(1);
    expect(updated.goalsFor).toBe(3);
    expect(updated.goalsAgainst).toBe(1);
    expect(updated.points).toBe(3);
  });

  it("updates standing from a tie", () => {
    const standing = createEmptyStanding("t1", "Eagles");
    const updated = updateStandingFromScore(standing, 2, 2);
    expect(updated.ties).toBe(1);
    expect(updated.points).toBe(1);
  });

  it("updates standing from a loss", () => {
    const standing = createEmptyStanding("t1", "Eagles");
    const updated = updateStandingFromScore(standing, 0, 3);
    expect(updated.losses).toBe(1);
    expect(updated.points).toBe(0);
  });

  it("sorts standings by points, then goal difference, then goals for", () => {
    const standings = [
      {
        ...createEmptyStanding("t1", "A"),
        points: 6,
        goalsFor: 10,
        goalsAgainst: 5,
      },
      {
        ...createEmptyStanding("t2", "B"),
        points: 9,
        goalsFor: 8,
        goalsAgainst: 3,
      },
      {
        ...createEmptyStanding("t3", "C"),
        points: 6,
        goalsFor: 12,
        goalsAgainst: 5,
      },
    ];
    const sorted = sortStandings(standings);
    expect(sorted[0].teamName).toBe("B");
    expect(sorted[1].teamName).toBe("C");
    expect(sorted[2].teamName).toBe("A");
  });
});
