import { describe, expect, it } from "vitest";

import {
  archiveAnnouncementSchema,
  createAnnouncementSchema,
} from "@/lib/announcement";

describe("announcement schemas", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("accepts a valid league announcement payload", () => {
    const parsed = createAnnouncementSchema.parse({
      body: "  Rain delay: fields are closed tonight. ",
      leagueId,
      title: "  Weather update ",
    });

    expect(parsed.title).toBe("Weather update");
    expect(parsed.body).toBe("Rain delay: fields are closed tonight.");
    expect(parsed.teamId).toBeUndefined();
  });

  it("accepts a valid team announcement payload", () => {
    const parsed = createAnnouncementSchema.parse({
      body: "Bring your jersey and water bottle.",
      leagueId,
      teamId,
      title: "Practice checklist",
    });

    expect(parsed.teamId).toBe(teamId);
  });

  it("rejects blank announcement content", () => {
    expect(() =>
      createAnnouncementSchema.parse({
        body: "   ",
        leagueId,
        title: "Update",
      }),
    ).toThrow();
  });

  it("validates archive payload ids", () => {
    expect(() =>
      archiveAnnouncementSchema.parse({
        announcementId: "bad-id",
        leagueId,
      }),
    ).toThrow();
  });
});
