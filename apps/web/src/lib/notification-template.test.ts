import { describe, expect, it } from "vitest";

import {
  buildEventReminderTemplate,
  buildWeeklyDigestTemplate,
} from "@/lib/notification-template";

describe("buildWeeklyDigestTemplate", () => {
  it("builds digest with announcements", () => {
    const template = buildWeeklyDigestTemplate({
      announcements: [
        {
          body: "Bring your warmups and water bottles.",
          publishedAt: new Date("2026-05-10T17:00:00.000Z"),
          teamName: "Falcons",
          title: "Practice moved to field 2",
        },
      ],
      generatedAt: new Date("2026-05-17T12:00:00.000Z"),
      leagueName: "Spring League",
    });

    expect(template.subject).toContain("Spring League weekly digest");
    expect(template.body).toContain("Practice moved to field 2");
    expect(template.body).toContain("Team: Falcons");
  });

  it("builds digest fallback when announcements are empty", () => {
    const template = buildWeeklyDigestTemplate({
      announcements: [],
      generatedAt: new Date("2026-05-17T12:00:00.000Z"),
      leagueName: "Spring League",
    });

    expect(template.body).toContain("No new announcements were published");
  });
});

describe("buildEventReminderTemplate", () => {
  it("builds reminder template body and subject", () => {
    const template = buildEventReminderTemplate({
      leagueName: "Spring League",
      reminder: {
        eventId: "ef2c85d2-1ed8-4c20-9440-58f5dbfd98d0",
        leagueId: "0afe7f02-62f7-4c3c-9378-8d7bc858de4f",
        reminderAt: new Date("2026-05-18T08:00:00.000Z"),
        rsvpStatus: "YES",
        startsAt: new Date("2026-05-19T08:00:00.000Z"),
        teamId: "4a6e47f8-761b-4b10-8f4f-c14c9e8e7655",
        teamName: "Falcons",
        timezone: "UTC",
        title: "Away Game vs Lions",
      },
    });

    expect(template.subject).toContain("Away Game vs Lions");
    expect(template.body).toContain("Team: Falcons");
    expect(template.body).toContain("RSVP status: YES");
  });
});
