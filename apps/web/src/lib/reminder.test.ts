import { describe, expect, it } from "vitest";

import { getDefaultReminderOffsetMinutes } from "@/lib/reminder";

describe("getDefaultReminderOffsetMinutes", () => {
  it("returns 24h for YES", () => {
    expect(getDefaultReminderOffsetMinutes("YES")).toBe(1440);
  });

  it("returns 2h for MAYBE", () => {
    expect(getDefaultReminderOffsetMinutes("MAYBE")).toBe(120);
  });

  it("returns null for NO", () => {
    expect(getDefaultReminderOffsetMinutes("NO")).toBeNull();
  });
});
