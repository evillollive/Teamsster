import { buildTeamSlug } from "@teamsster/db";
import { describe, expect, it } from "vitest";

import { createTeamSchema, updateTeamSchema } from "@/lib/team";

describe("buildTeamSlug", () => {
  it("generates a lowercase slug with a short suffix", () => {
    const slug = buildTeamSlug("Red Rockets");
    expect(slug).toMatch(/^red-rockets-[a-f0-9]{8}$/);
  });

  it("strips special characters", () => {
    const slug = buildTeamSlug("U12 #1 Tigers!");
    expect(slug).toMatch(/^u12-1-tigers-[a-f0-9]{8}$/);
  });

  it("falls back to 'team' for blank names", () => {
    const slug = buildTeamSlug("   ");
    expect(slug).toMatch(/^team-[a-f0-9]{8}$/);
  });

  it("caps the base at 48 characters before the suffix", () => {
    const slug = buildTeamSlug("a".repeat(80));
    const base = slug.slice(0, slug.lastIndexOf("-"));
    expect(base.length).toBeLessThanOrEqual(48);
  });

  it("produces unique slugs for the same name", () => {
    const a = buildTeamSlug("Wolves");
    const b = buildTeamSlug("Wolves");
    expect(a).not.toBe(b);
  });
});

describe("createTeamSchema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  it("accepts a valid team", () => {
    const parsed = createTeamSchema.parse({
      leagueId,
      name: "  Red Rockets  ",
      timezone: "America/Chicago",
    });
    expect(parsed.name).toBe("Red Rockets");
    expect(parsed.timezone).toBe("America/Chicago");
    expect(parsed.leagueId).toBe(leagueId);
  });

  it("rejects an empty name", () => {
    expect(() =>
      createTeamSchema.parse({ leagueId, name: "  ", timezone: "UTC" }),
    ).toThrow();
  });

  it("rejects a name longer than 120 characters", () => {
    expect(() =>
      createTeamSchema.parse({
        leagueId,
        name: "x".repeat(121),
        timezone: "UTC",
      }),
    ).toThrow();
  });

  it("defaults timezone to UTC when omitted", () => {
    const parsed = createTeamSchema.parse({ leagueId, name: "Tigers" });
    expect(parsed.timezone).toBe("UTC");
  });

  it("rejects a non-UUID leagueId", () => {
    expect(() =>
      createTeamSchema.parse({
        leagueId: "not-a-uuid",
        name: "Tigers",
        timezone: "UTC",
      }),
    ).toThrow();
  });
});

describe("updateTeamSchema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("accepts valid update fields", () => {
    const parsed = updateTeamSchema.parse({
      teamId,
      leagueId,
      name: "Blue Wolves",
      timezone: "Europe/London",
    });
    expect(parsed.teamId).toBe(teamId);
    expect(parsed.leagueId).toBe(leagueId);
    expect(parsed.name).toBe("Blue Wolves");
  });

  it("rejects a non-UUID teamId", () => {
    expect(() =>
      updateTeamSchema.parse({
        teamId: "not-a-uuid",
        leagueId,
        name: "Good Name",
        timezone: "UTC",
      }),
    ).toThrow();
  });

  it("rejects a non-UUID leagueId", () => {
    expect(() =>
      updateTeamSchema.parse({
        teamId,
        leagueId: "not-a-uuid",
        name: "Good Name",
        timezone: "UTC",
      }),
    ).toThrow();
  });
});
