import {
  doTimesOverlap,
  hasConflict,
  isValidTimeFormat,
  isValidTimeRange,
  planWeatherCancellation,
} from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("doTimesOverlap", () => {
  it("detects overlapping windows", () => {
    expect(doTimesOverlap("09:00", "11:00", "10:00", "12:00")).toBe(true);
  });

  it("detects contained windows", () => {
    expect(doTimesOverlap("09:00", "17:00", "10:00", "12:00")).toBe(true);
  });

  it("allows adjacent windows (no overlap)", () => {
    expect(doTimesOverlap("09:00", "11:00", "11:00", "13:00")).toBe(false);
  });

  it("detects no overlap for separate windows", () => {
    expect(doTimesOverlap("09:00", "10:00", "14:00", "16:00")).toBe(false);
  });

  it("handles exact same window", () => {
    expect(doTimesOverlap("09:00", "11:00", "09:00", "11:00")).toBe(true);
  });
});

describe("hasConflict", () => {
  const existing = [
    {
      id: "1",
      fieldId: "f1",
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "11:00",
      isRecurring: true,
      effectiveDate: null,
    },
    {
      id: "2",
      fieldId: "f1",
      dayOfWeek: "Wednesday",
      startTime: "14:00",
      endTime: "16:00",
      isRecurring: true,
      effectiveDate: null,
    },
  ];

  it("detects conflict on same day with overlapping time", () => {
    expect(
      hasConflict(existing, {
        dayOfWeek: "Monday",
        startTime: "10:00",
        endTime: "12:00",
      }),
    ).toBe(true);
  });

  it("allows booking on different day", () => {
    expect(
      hasConflict(existing, {
        dayOfWeek: "Tuesday",
        startTime: "09:00",
        endTime: "11:00",
      }),
    ).toBe(false);
  });

  it("allows non-overlapping time on same day", () => {
    expect(
      hasConflict(existing, {
        dayOfWeek: "Monday",
        startTime: "12:00",
        endTime: "14:00",
      }),
    ).toBe(false);
  });

  it("returns false for empty existing windows", () => {
    expect(
      hasConflict([], {
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "11:00",
      }),
    ).toBe(false);
  });
});

describe("isValidTimeFormat", () => {
  it("accepts valid 24-hour times", () => {
    expect(isValidTimeFormat("00:00")).toBe(true);
    expect(isValidTimeFormat("09:30")).toBe(true);
    expect(isValidTimeFormat("14:00")).toBe(true);
    expect(isValidTimeFormat("23:59")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidTimeFormat("24:00")).toBe(false);
    expect(isValidTimeFormat("9:30")).toBe(false);
    expect(isValidTimeFormat("14:60")).toBe(false);
    expect(isValidTimeFormat("abc")).toBe(false);
    expect(isValidTimeFormat("")).toBe(false);
  });
});

describe("isValidTimeRange", () => {
  it("accepts valid ranges", () => {
    expect(isValidTimeRange("09:00", "11:00")).toBe(true);
    expect(isValidTimeRange("00:00", "23:59")).toBe(true);
  });

  it("rejects inverted ranges", () => {
    expect(isValidTimeRange("11:00", "09:00")).toBe(false);
  });

  it("rejects equal times", () => {
    expect(isValidTimeRange("09:00", "09:00")).toBe(false);
  });
});

describe("planWeatherCancellation", () => {
  it("returns cancellation plan structure", () => {
    const result = planWeatherCancellation({
      venueId: "v1",
      venueName: "Main Park",
      startDate: "2026-06-01",
      endDate: "2026-06-01",
    });
    expect(result.venueId).toBe("v1");
    expect(result.venueName).toBe("Main Park");
    expect(result.cancelledCount).toBe(0);
  });
});
