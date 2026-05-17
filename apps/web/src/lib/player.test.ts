import { describe, expect, it } from "vitest";

import {
  createPlayerContactSchema,
  createPlayerSchema,
  updatePlayerSchema,
} from "@/lib/player";

describe("createPlayerSchema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("accepts a valid player payload", () => {
    const parsed = createPlayerSchema.parse({
      firstName: "  Sam  ",
      eligibilityNotes: " Waiver signed ",
      eligibilityStatus: "ELIGIBLE",
      jerseyNumber: " 17 ",
      lastName: "Rivera",
      leagueId,
      profileNotes: " Left-footed ",
      profilePrimaryPosition: " Midfielder ",
      profilePronouns: " they/them ",
      preferredName: " Sammy ",
      teamId,
      timezone: "America/Chicago",
    });

    expect(parsed.firstName).toBe("Sam");
    expect(parsed.lastName).toBe("Rivera");
    expect(parsed.preferredName).toBe("Sammy");
    expect(parsed.jerseyNumber).toBe("17");
    expect(parsed.eligibilityStatus).toBe("ELIGIBLE");
    expect(parsed.eligibilityNotes).toBe("Waiver signed");
    expect(parsed.profilePronouns).toBe("they/them");
    expect(parsed.profilePrimaryPosition).toBe("Midfielder");
    expect(parsed.profileNotes).toBe("Left-footed");
  });

  it("defaults timezone to UTC when omitted", () => {
    const parsed = createPlayerSchema.parse({
      firstName: "Alex",
      lastName: "Kim",
      leagueId,
      teamId,
    });

    expect(parsed.timezone).toBe("UTC");
  });

  it("rejects empty first or last names", () => {
    expect(() =>
      createPlayerSchema.parse({
        firstName: " ",
        lastName: "Kim",
        leagueId,
        teamId,
      }),
    ).toThrow();

    expect(() =>
      createPlayerSchema.parse({
        firstName: "Alex",
        lastName: " ",
        leagueId,
        teamId,
      }),
    ).toThrow();
  });
});

describe("updatePlayerSchema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
  const playerId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

  it("accepts valid update fields", () => {
    const parsed = updatePlayerSchema.parse({
      firstName: "Jordan",
      eligibilityStatus: "INELIGIBLE",
      jerseyNumber: "9",
      lastName: "Mills",
      leagueId,
      playerId,
      profilePronouns: "",
      preferredName: "",
      teamId,
      timezone: "Europe/London",
    });

    expect(parsed.playerId).toBe(playerId);
    expect(parsed.preferredName).toBeUndefined();
    expect(parsed.jerseyNumber).toBe("9");
    expect(parsed.eligibilityStatus).toBe("INELIGIBLE");
    expect(parsed.profilePronouns).toBeUndefined();
  });

  it("rejects invalid ids", () => {
    expect(() =>
      updatePlayerSchema.parse({
        firstName: "Jordan",
        lastName: "Mills",
        leagueId: "bad-id",
        playerId,
        teamId,
      }),
    ).toThrow();

    expect(() =>
      updatePlayerSchema.parse({
        firstName: "Jordan",
        lastName: "Mills",
        leagueId,
        playerId: "bad-id",
        teamId,
      }),
    ).toThrow();

    expect(() =>
      updatePlayerSchema.parse({
        firstName: "Jordan",
        lastName: "Mills",
        leagueId,
        playerId,
        teamId: "bad-id",
      }),
    ).toThrow();
  });
});

describe("createPlayerContactSchema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
  const playerId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

  it("accepts valid contact payload", () => {
    const parsed = createPlayerContactSchema.parse({
      email: " guardian@example.com ",
      firstName: "  Riley ",
      isPrimary: true,
      lastName: "Jordan",
      leagueId,
      playerId,
      relationship: " Parent ",
      teamId,
    });

    expect(parsed.firstName).toBe("Riley");
    expect(parsed.relationship).toBe("Parent");
    expect(parsed.email).toBe("guardian@example.com");
    expect(parsed.isPrimary).toBe(true);
  });

  it("requires at least one contact method", () => {
    expect(() =>
      createPlayerContactSchema.parse({
        firstName: "Riley",
        lastName: "Jordan",
        leagueId,
        playerId,
        relationship: "Parent",
        teamId,
      }),
    ).toThrow("Provide at least one contact method.");
  });
});
