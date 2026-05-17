import { describe, expect, it } from "vitest";

import { createTeamEventSchema, updateTeamEventSchema } from "@/lib/event";

describe("createTeamEventSchema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("accepts a valid one-time event payload", () => {
    const parsed = createTeamEventSchema.parse({
      description: " Season opener ",
      endsAt: "2026-06-01T19:00:00.000Z",
      eventType: "GAME",
      leagueId,
      location: " Main Field ",
      recurrenceFrequency: "NONE",
      recurrenceInterval: 4,
      startsAt: "2026-06-01T18:00:00.000Z",
      teamId,
      timezone: "America/Chicago",
      title: "  Opening Match ",
    });

    expect(parsed.title).toBe("Opening Match");
    expect(parsed.description).toBe("Season opener");
    expect(parsed.location).toBe("Main Field");
    expect(parsed.recurrenceInterval).toBe(4);
  });

  it("accepts recurring events with recurrence end date", () => {
    const parsed = createTeamEventSchema.parse({
      endsAt: "2026-06-01T19:00:00.000Z",
      eventType: "PRACTICE",
      leagueId,
      recurrenceFrequency: "WEEKLY",
      recurrenceInterval: 1,
      recurrenceUntil: "2026-08-01T00:00:00.000Z",
      startsAt: "2026-06-01T18:00:00.000Z",
      teamId,
      timezone: "UTC",
      title: "Training",
    });

    expect(parsed.recurrenceFrequency).toBe("WEEKLY");
    expect(parsed.recurrenceUntil).toBe("2026-08-01T00:00:00.000Z");
  });

  it("rejects events where end is before start", () => {
    expect(() =>
      createTeamEventSchema.parse({
        endsAt: "2026-06-01T18:00:00.000Z",
        leagueId,
        startsAt: "2026-06-01T19:00:00.000Z",
        teamId,
        timezone: "UTC",
        title: "Bad event",
      }),
    ).toThrow("Event end time must be after start time.");
  });

  it("rejects recurrence end dates before the event start", () => {
    expect(() =>
      createTeamEventSchema.parse({
        endsAt: "2026-06-01T19:00:00.000Z",
        leagueId,
        recurrenceFrequency: "WEEKLY",
        recurrenceUntil: "2026-05-01T00:00:00.000Z",
        startsAt: "2026-06-01T18:00:00.000Z",
        teamId,
        timezone: "UTC",
        title: "Bad recurrence",
      }),
    ).toThrow("Recurrence end date must be on or after the event start.");
  });
});

describe("updateTeamEventSchema", () => {
  it("requires a valid event id", () => {
    expect(() =>
      updateTeamEventSchema.parse({
        endsAt: "2026-06-01T19:00:00.000Z",
        eventId: "bad-id",
        leagueId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        startsAt: "2026-06-01T18:00:00.000Z",
        teamId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        timezone: "UTC",
        title: "Practice",
      }),
    ).toThrow();
  });
});
