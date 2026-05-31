import {
  calculateRetentionCutoff,
  canMinorSendDm,
  FLAG_RATE_LIMIT,
  getMinorRestrictionLabel,
  isMuteDurationValid,
} from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("canMinorSendDm", () => {
  it("allows unrestricted DMs", () => {
    expect(canMinorSendDm("unrestricted", false)).toBe(true);
  });

  it("allows approved contacts when policy requires it", () => {
    expect(canMinorSendDm("approved_contacts_only", true)).toBe(true);
    expect(canMinorSendDm("approved_contacts_only", false)).toBe(false);
  });

  it("blocks DMs with no_dm policy", () => {
    expect(canMinorSendDm("no_dm", true)).toBe(false);
    expect(canMinorSendDm("no_dm", false)).toBe(false);
  });

  it("blocks DMs with team_threads_only policy", () => {
    expect(canMinorSendDm("team_threads_only", true)).toBe(false);
  });

  it("defaults to blocking on unknown policy", () => {
    expect(canMinorSendDm("unknown_value", true)).toBe(false);
  });
});

describe("getMinorRestrictionLabel", () => {
  it("returns labels for known restrictions", () => {
    expect(getMinorRestrictionLabel("team_threads_only")).toContain(
      "team group threads",
    );
    expect(getMinorRestrictionLabel("no_dm")).toContain("cannot send");
    expect(getMinorRestrictionLabel("approved_contacts_only")).toContain(
      "approved contacts",
    );
    expect(getMinorRestrictionLabel("unrestricted")).toContain(
      "No restrictions",
    );
  });

  it("returns fallback for unknown restriction", () => {
    expect(getMinorRestrictionLabel("invalid")).toBe("Unknown restriction");
  });
});

describe("isMuteDurationValid", () => {
  it("returns true for null (permanent mute)", () => {
    expect(isMuteDurationValid(null)).toBe(true);
  });

  it("returns true for future expiry", () => {
    const future = new Date(Date.now() + 3600_000);
    expect(isMuteDurationValid(future)).toBe(true);
  });

  it("returns false for past expiry", () => {
    const past = new Date(Date.now() - 3600_000);
    expect(isMuteDurationValid(past)).toBe(false);
  });
});

describe("calculateRetentionCutoff", () => {
  it("returns null for null retention", () => {
    expect(calculateRetentionCutoff(null)).toBeNull();
  });

  it("returns null for invalid retention", () => {
    expect(calculateRetentionCutoff("abc")).toBeNull();
    expect(calculateRetentionCutoff("0")).toBeNull();
    expect(calculateRetentionCutoff("-5")).toBeNull();
  });

  it("returns correct cutoff date", () => {
    const cutoff = calculateRetentionCutoff("30");
    expect(cutoff).toBeInstanceOf(Date);
    const expectedMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs((cutoff as Date).getTime() - expectedMs)).toBeLessThan(
      5000,
    );
  });

  it("handles 1-day retention", () => {
    const cutoff = calculateRetentionCutoff("1");
    expect(cutoff).toBeInstanceOf(Date);
    const expectedMs = Date.now() - 24 * 60 * 60 * 1000;
    expect(Math.abs((cutoff as Date).getTime() - expectedMs)).toBeLessThan(
      5000,
    );
  });
});

describe("FLAG_RATE_LIMIT", () => {
  it("defines reasonable limits", () => {
    expect(FLAG_RATE_LIMIT.maxFlagsPerHour).toBe(10);
    expect(FLAG_RATE_LIMIT.windowMs).toBe(3600000);
  });
});
