import { buildPersonalLeagueSlug } from "@teamsster/db";
import { describe, expect, it } from "vitest";

import {
  accountSettingsSchema,
  hasEnabledNotificationChannel,
  onboardingSchema,
  parseNotificationPreferencesFromFormData,
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
  it("accepts per-channel notification preference combinations", () => {
    const parsed = accountSettingsSchema.parse({
      displayName: "Manager Maya",
      notificationPreferences: {
        ANNOUNCEMENT: { email: false, inApp: true, push: false },
        ASSIGNMENT: { email: true, inApp: true, push: true },
        EVENT_REMINDER: { email: true, inApp: true, push: true },
        MESSAGE: { email: true, inApp: true, push: true },
        REGISTRATION_DEADLINE: { email: true, inApp: true, push: false },
        VOLUNTEER_REMINDER: { email: true, inApp: true, push: true },
        WEEKLY_DIGEST: { email: true, inApp: true, push: false },
      },
      timezone: "UTC",
    });

    expect(parsed.notificationPreferences.WEEKLY_DIGEST.email).toBe(true);
  });

  it("parses notification preferences from form data", () => {
    const formData = new FormData();
    formData.set("notification-ANNOUNCEMENT-email", "on");
    formData.set("notification-ANNOUNCEMENT-inApp", "on");
    formData.set("notification-EVENT_REMINDER-email", "on");
    formData.set("notification-EVENT_REMINDER-inApp", "on");
    formData.set("notification-EVENT_REMINDER-push", "on");
    formData.set("notification-MESSAGE-email", "on");
    formData.set("notification-MESSAGE-inApp", "on");
    formData.set("notification-MESSAGE-push", "on");
    formData.set("notification-VOLUNTEER_REMINDER-email", "on");
    formData.set("notification-VOLUNTEER_REMINDER-inApp", "on");
    formData.set("notification-VOLUNTEER_REMINDER-push", "on");
    formData.set("notification-ASSIGNMENT-email", "on");
    formData.set("notification-ASSIGNMENT-inApp", "on");
    formData.set("notification-ASSIGNMENT-push", "on");
    formData.set("notification-REGISTRATION_DEADLINE-email", "on");
    formData.set("notification-REGISTRATION_DEADLINE-inApp", "on");

    const parsed = parseNotificationPreferencesFromFormData(formData);

    expect(parsed.ANNOUNCEMENT.email).toBe(true);
    expect(parsed.ANNOUNCEMENT.push).toBe(false);
    expect(parsed.WEEKLY_DIGEST.inApp).toBe(false);
  });

  it("detects whether any notification channel is enabled", () => {
    expect(
      hasEnabledNotificationChannel({
        email: false,
        inApp: false,
        push: false,
      }),
    ).toBe(false);
    expect(
      hasEnabledNotificationChannel({ email: false, inApp: true, push: false }),
    ).toBe(true);
  });

  it("builds unique-ish personal league slugs with bounded length", () => {
    const slug = buildPersonalLeagueSlug("Casey Family Personal League");

    expect(slug).toMatch(/^casey-family-personal-league-[a-f0-9]{12}$/);
    expect(slug.length).toBeLessThanOrEqual(64);
  });
});
