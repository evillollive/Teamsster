import { describe, expect, it } from "vitest";

import { deleteEventRsvpSchema, upsertEventRsvpSchema } from "@/lib/rsvp";

const eventId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const leagueId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
const teamId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

describe("upsertEventRsvpSchema", () => {
  it("accepts a YES response with no note", () => {
    const parsed = upsertEventRsvpSchema.parse({
      eventId,
      leagueId,
      status: "YES",
      teamId,
    });
    expect(parsed.status).toBe("YES");
    expect(parsed.note).toBeUndefined();
  });

  it("accepts a MAYBE response with a note", () => {
    const parsed = upsertEventRsvpSchema.parse({
      eventId,
      leagueId,
      note: "  Running late  ",
      status: "MAYBE",
      teamId,
    });
    expect(parsed.status).toBe("MAYBE");
    expect(parsed.note).toBe("Running late");
  });

  it("accepts a NO response", () => {
    const parsed = upsertEventRsvpSchema.parse({
      eventId,
      leagueId,
      status: "NO",
      teamId,
    });
    expect(parsed.status).toBe("NO");
  });

  it("coerces an empty note to undefined", () => {
    const parsed = upsertEventRsvpSchema.parse({
      eventId,
      leagueId,
      note: "   ",
      status: "YES",
      teamId,
    });
    expect(parsed.note).toBeUndefined();
  });

  it("rejects an invalid status", () => {
    expect(() =>
      upsertEventRsvpSchema.parse({
        eventId,
        leagueId,
        status: "ATTENDING",
        teamId,
      }),
    ).toThrow();
  });

  it("rejects a note that exceeds 280 characters", () => {
    expect(() =>
      upsertEventRsvpSchema.parse({
        eventId,
        leagueId,
        note: "x".repeat(281),
        status: "YES",
        teamId,
      }),
    ).toThrow();
  });

  it("rejects a non-UUID eventId", () => {
    expect(() =>
      upsertEventRsvpSchema.parse({
        eventId: "not-a-uuid",
        leagueId,
        status: "YES",
        teamId,
      }),
    ).toThrow();
  });
});

describe("deleteEventRsvpSchema", () => {
  it("accepts valid UUIDs", () => {
    const parsed = deleteEventRsvpSchema.parse({ eventId, leagueId, teamId });
    expect(parsed.eventId).toBe(eventId);
  });

  it("rejects a non-UUID eventId", () => {
    expect(() =>
      deleteEventRsvpSchema.parse({
        eventId: "bad",
        leagueId,
        teamId,
      }),
    ).toThrow();
  });
});
