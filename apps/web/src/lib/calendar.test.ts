import { describe, expect, it } from "vitest";

import { buildTeamEventsIcs } from "@/lib/calendar";

describe("buildTeamEventsIcs", () => {
  it("renders recurrence and timezone metadata", () => {
    const ics = buildTeamEventsIcs({
      calendarName: "Sharks Schedule",
      events: [
        {
          id: "event-1",
          title: "Weekly Practice",
          description: "Bring water",
          location: "Main Field",
          startsAt: "2026-06-01T18:00:00.000Z",
          endsAt: "2026-06-01T19:00:00.000Z",
          timezone: "America/Chicago",
          recurrenceRule: {
            frequency: "WEEKLY",
            interval: 1,
            until: "2026-07-01T00:00:00.000Z",
          },
        },
      ],
      generatedAt: new Date("2026-05-01T00:00:00.000Z"),
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Weekly Practice");
    expect(ics).toContain("X-TEAMSSTER-TIMEZONE:America/Chicago");
    expect(ics).toContain(
      "RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=20260701T000000Z",
    );
  });

  it("omits recurrence when frequency is NONE", () => {
    const ics = buildTeamEventsIcs({
      calendarName: "One-off",
      events: [
        {
          id: "event-2",
          title: "Season Opener",
          description: null,
          location: null,
          startsAt: "2026-06-01T18:00:00.000Z",
          endsAt: "2026-06-01T20:00:00.000Z",
          timezone: "UTC",
          recurrenceRule: {
            frequency: "NONE",
            interval: 1,
          },
        },
      ],
      generatedAt: new Date("2026-05-01T00:00:00.000Z"),
    });

    expect(ics).not.toContain("RRULE:");
  });
});
