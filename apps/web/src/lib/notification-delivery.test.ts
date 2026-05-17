import { describe, expect, it } from "vitest";

import { logNotificationDeliverySchema } from "@/lib/notification-delivery";

describe("notification delivery schema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("accepts valid digest delivery payloads", () => {
    const parsed = logNotificationDeliverySchema.parse({
      kind: "WEEKLY_DIGEST",
      leagueId,
      recipient: "coach@example.com",
      templateBody: "Digest body",
      templateSubject: "Weekly digest",
    });

    expect(parsed.status).toBe("SENT");
    expect(parsed.kind).toBe("WEEKLY_DIGEST");
  });

  it("accepts valid reminder delivery payloads", () => {
    const parsed = logNotificationDeliverySchema.parse({
      kind: "EVENT_REMINDER",
      leagueId,
      recipient: "family@example.com",
      status: "QUEUED",
      teamId,
      templateBody: "Reminder body",
      templateSubject: "Reminder subject",
    });

    expect(parsed.teamId).toBe(teamId);
    expect(parsed.status).toBe("QUEUED");
  });

  it("rejects invalid recipients", () => {
    expect(() =>
      logNotificationDeliverySchema.parse({
        kind: "EVENT_REMINDER",
        leagueId,
        recipient: "not-an-email",
        templateBody: "Reminder body",
        templateSubject: "Reminder subject",
      }),
    ).toThrow();
  });
});
