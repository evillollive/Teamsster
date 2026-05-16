import { describe, expect, it } from "vitest";

import {
  accountSettingsSchema,
  onboardingSchema,
  shouldProvisionPersonalLeague,
} from "@/lib/account";

describe("account onboarding", () => {
  it("creates personal leagues when invitation token is missing", () => {
    expect(shouldProvisionPersonalLeague(undefined)).toBe(true);
    expect(shouldProvisionPersonalLeague("")).toBe(true);
    expect(shouldProvisionPersonalLeague("   ")).toBe(true);
  });

  it("skips personal league provisioning for invitation flows", () => {
    expect(shouldProvisionPersonalLeague("invite_token_123")).toBe(false);
  });

  it("normalizes onboarding defaults", () => {
    const parsed = onboardingSchema.parse({
      displayName: "  Coach Casey  ",
      timezone: "America/New_York",
    });

    expect(parsed.displayName).toBe("Coach Casey");
    expect(parsed.timezone).toBe("America/New_York");
  });
});

describe("account settings validation", () => {
  it("accepts notification preference combinations", () => {
    const parsed = accountSettingsSchema.parse({
      displayName: "Manager Maya",
      notificationPreferences: {
        emailAnnouncements: false,
        eventReminders: true,
        weeklyDigest: true,
      },
      timezone: "UTC",
    });

    expect(parsed.notificationPreferences.weeklyDigest).toBe(true);
  });
});
