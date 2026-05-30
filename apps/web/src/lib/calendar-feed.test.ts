import { describe, expect, it } from "vitest";

import {
  buildFeedUrl,
  generateICalEvent,
  generateICalFeed,
} from "@/lib/calendar-feed";

describe("buildFeedUrl", () => {
  it("constructs full feed URL from token and base", () => {
    const url = buildFeedUrl("abc123", "https://teamsster.app");
    expect(url).toBe("https://teamsster.app/api/calendar/abc123.ics");
  });

  it("works with localhost", () => {
    const url = buildFeedUrl("token", "http://localhost:3000");
    expect(url).toBe("http://localhost:3000/api/calendar/token.ics");
  });
});

describe("generateICalEvent", () => {
  const event = {
    uid: "event-1@teamsster",
    title: "Practice",
    startTime: new Date("2026-06-01T17:00:00Z"),
    endTime: new Date("2026-06-01T18:30:00Z"),
  };

  it("generates valid VEVENT block", () => {
    const ical = generateICalEvent(event);
    expect(ical).toContain("BEGIN:VEVENT");
    expect(ical).toContain("END:VEVENT");
    expect(ical).toContain("UID:event-1@teamsster");
    expect(ical).toContain("SUMMARY:Practice");
  });

  it("includes start and end times", () => {
    const ical = generateICalEvent(event);
    expect(ical).toContain("DTSTART:20260601T170000Z");
    expect(ical).toContain("DTEND:20260601T183000Z");
  });

  it("includes optional location", () => {
    const ical = generateICalEvent({ ...event, location: "Main Field" });
    expect(ical).toContain("LOCATION:Main Field");
  });

  it("includes optional description", () => {
    const ical = generateICalEvent({ ...event, description: "Bring gear" });
    expect(ical).toContain("DESCRIPTION:Bring gear");
  });

  it("escapes special characters in title", () => {
    const ical = generateICalEvent({
      ...event,
      title: "Game; Home, vs Away",
    });
    expect(ical).toContain("SUMMARY:Game\\; Home\\, vs Away");
  });
});

describe("generateICalFeed", () => {
  it("wraps events in VCALENDAR", () => {
    const feed = generateICalFeed([
      {
        uid: "e1@t",
        title: "Event 1",
        startTime: new Date("2026-06-01T10:00:00Z"),
        endTime: new Date("2026-06-01T11:00:00Z"),
      },
    ]);
    expect(feed).toContain("BEGIN:VCALENDAR");
    expect(feed).toContain("END:VCALENDAR");
    expect(feed).toContain("PRODID:-//Teamsster//Calendar Feed//EN");
    expect(feed).toContain("BEGIN:VEVENT");
  });

  it("includes multiple events", () => {
    const feed = generateICalFeed([
      {
        uid: "e1@t",
        title: "Event 1",
        startTime: new Date("2026-06-01T10:00:00Z"),
        endTime: new Date("2026-06-01T11:00:00Z"),
      },
      {
        uid: "e2@t",
        title: "Event 2",
        startTime: new Date("2026-06-02T10:00:00Z"),
        endTime: new Date("2026-06-02T11:00:00Z"),
      },
    ]);
    expect(feed.match(/BEGIN:VEVENT/g)?.length).toBe(2);
  });

  it("handles empty event list", () => {
    const feed = generateICalFeed([]);
    expect(feed).toContain("BEGIN:VCALENDAR");
    expect(feed).toContain("END:VCALENDAR");
    expect(feed).not.toContain("BEGIN:VEVENT");
  });
});
