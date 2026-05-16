import { buildLeagueSlug } from "@teamsster/db";
import { describe, expect, it } from "vitest";

import { createLeagueSchema, updateLeagueSchema } from "@/lib/league";

describe("buildLeagueSlug", () => {
  it("generates a lowercase slug with a short suffix", () => {
    const slug = buildLeagueSlug("Spring Soccer League");
    expect(slug).toMatch(/^spring-soccer-league-[a-f0-9]{8}$/);
  });

  it("strips special characters", () => {
    const slug = buildLeagueSlug("Casey's #1 League!");
    expect(slug).toMatch(/^casey-s-1-league-[a-f0-9]{8}$/);
  });

  it("falls back to 'league' for blank names", () => {
    const slug = buildLeagueSlug("   ");
    expect(slug).toMatch(/^league-[a-f0-9]{8}$/);
  });

  it("caps the base at 48 characters before the suffix", () => {
    const slug = buildLeagueSlug("a".repeat(80));
    const base = slug.slice(0, slug.lastIndexOf("-"));
    expect(base.length).toBeLessThanOrEqual(48);
  });

  it("produces unique slugs for the same name", () => {
    const a = buildLeagueSlug("Rockets");
    const b = buildLeagueSlug("Rockets");
    expect(a).not.toBe(b);
  });
});

describe("createLeagueSchema", () => {
  it("accepts a valid league", () => {
    const parsed = createLeagueSchema.parse({
      name: "  Spring League  ",
      timezone: "America/Chicago",
    });
    expect(parsed.name).toBe("Spring League");
    expect(parsed.timezone).toBe("America/Chicago");
  });

  it("rejects an empty name", () => {
    expect(() =>
      createLeagueSchema.parse({ name: "  ", timezone: "UTC" }),
    ).toThrow();
  });

  it("rejects a name longer than 120 characters", () => {
    expect(() =>
      createLeagueSchema.parse({ name: "x".repeat(121), timezone: "UTC" }),
    ).toThrow();
  });

  it("defaults timezone to UTC when omitted", () => {
    const parsed = createLeagueSchema.parse({ name: "Rockets" });
    expect(parsed.timezone).toBe("UTC");
  });
});

describe("updateLeagueSchema", () => {
  it("accepts valid update fields", () => {
    const id = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const parsed = updateLeagueSchema.parse({
      leagueId: id,
      name: "Autumn League",
      timezone: "Europe/London",
    });
    expect(parsed.leagueId).toBe(id);
    expect(parsed.name).toBe("Autumn League");
  });

  it("rejects a non-UUID leagueId", () => {
    expect(() =>
      updateLeagueSchema.parse({
        leagueId: "not-a-uuid",
        name: "Good Name",
        timezone: "UTC",
      }),
    ).toThrow();
  });
});
