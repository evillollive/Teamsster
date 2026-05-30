import { describe, expect, it } from "vitest";

import {
  getReminderDispatchTime,
  isReminderDue,
  isReminderWindowValid,
  LEAD_TIME_PRESETS,
} from "@/lib/scheduled-delivery";

describe("LEAD_TIME_PRESETS", () => {
  it("defines expected presets", () => {
    expect(LEAD_TIME_PRESETS["15m"]).toBe(15);
    expect(LEAD_TIME_PRESETS["1h"]).toBe(60);
    expect(LEAD_TIME_PRESETS["2h"]).toBe(120);
    expect(LEAD_TIME_PRESETS["1d"]).toBe(1440);
    expect(LEAD_TIME_PRESETS["2d"]).toBe(2880);
  });
});

describe("isReminderDue", () => {
  const eventStart = new Date("2026-06-01T14:00:00Z");

  it("returns true when reminder time has passed", () => {
    const now = new Date("2026-06-01T13:30:00Z");
    expect(isReminderDue(eventStart, 60, now)).toBe(true);
  });

  it("returns true when exactly at reminder time", () => {
    const now = new Date("2026-06-01T13:00:00Z");
    expect(isReminderDue(eventStart, 60, now)).toBe(true);
  });

  it("returns false when before reminder time", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    expect(isReminderDue(eventStart, 60, now)).toBe(false);
  });

  it("handles 1-day lead time", () => {
    const now = new Date("2026-05-31T14:00:00Z");
    expect(isReminderDue(eventStart, LEAD_TIME_PRESETS["1d"], now)).toBe(true);
  });
});

describe("getReminderDispatchTime", () => {
  it("subtracts lead time from event start", () => {
    const eventStart = new Date("2026-06-01T14:00:00Z");
    const result = getReminderDispatchTime(eventStart, 60);
    expect(result.toISOString()).toBe("2026-06-01T13:00:00.000Z");
  });

  it("handles multi-day offsets", () => {
    const eventStart = new Date("2026-06-05T10:00:00Z");
    const result = getReminderDispatchTime(eventStart, LEAD_TIME_PRESETS["2d"]);
    expect(result.toISOString()).toBe("2026-06-03T10:00:00.000Z");
  });
});

describe("isReminderWindowValid", () => {
  it("returns true when event is in the future", () => {
    const future = new Date(Date.now() + 3600_000);
    expect(isReminderWindowValid(future)).toBe(true);
  });

  it("returns false when event has passed", () => {
    const past = new Date(Date.now() - 3600_000);
    expect(isReminderWindowValid(past)).toBe(false);
  });
});
