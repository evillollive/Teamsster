import {
  deleteUserAccount,
  getUserSettingsByAuthUserId,
  type NotificationPreferences,
  provisionUserOnboarding,
  shouldCreatePersonalLeague,
  upsertUserSettings,
} from "@teamsster/db";
import { z } from "zod";

export const timezoneSchema = z.string().trim().min(1).max(100).default("UTC");

export const onboardingSchema = z.object({
  displayName: z.string().trim().max(120).optional(),
  invitationToken: z.string().trim().max(120).optional(),
  timezone: timezoneSchema,
});

export const notificationPreferencesSchema = z.object({
  emailAnnouncements: z.boolean().default(true),
  eventReminders: z.boolean().default(true),
  weeklyDigest: z.boolean().default(false),
});

export const accountSettingsSchema = z.object({
  displayName: z.string().trim().max(120).optional(),
  notificationPreferences: notificationPreferencesSchema,
  timezone: timezoneSchema,
});

export function parseNotificationPreferencesFromFormData(formData: FormData) {
  return notificationPreferencesSchema.parse({
    emailAnnouncements: formData.get("emailAnnouncements") === "on",
    eventReminders: formData.get("eventReminders") === "on",
    weeklyDigest: formData.get("weeklyDigest") === "on",
  });
}

export function parseInvitationToken(formData: FormData) {
  const raw = formData.get("invitationToken");
  if (typeof raw !== "string") {
    return "";
  }

  return raw.trim();
}

export async function runOnboardingForAuthenticatedUser(input: {
  authUserId: string;
  displayName?: string | null;
  email: string;
  invitationToken?: string;
  timezone?: string;
}) {
  const parsed = onboardingSchema.parse({
    displayName: input.displayName ?? undefined,
    invitationToken: input.invitationToken,
    timezone: input.timezone ?? "UTC",
  });

  return provisionUserOnboarding({
    authUserId: input.authUserId,
    displayName: parsed.displayName,
    email: input.email,
    invitationToken: parsed.invitationToken,
    timezone: parsed.timezone,
  });
}

export async function saveAccountSettings(input: {
  authUserId: string;
  displayName?: string | null;
  notificationPreferences: NotificationPreferences;
  timezone: string;
}) {
  const parsed = accountSettingsSchema.parse({
    displayName: input.displayName ?? undefined,
    notificationPreferences: input.notificationPreferences,
    timezone: input.timezone,
  });

  await upsertUserSettings({
    authUserId: input.authUserId,
    displayName: parsed.displayName,
    notificationPreferences: parsed.notificationPreferences,
    timezone: parsed.timezone,
  });
}

export async function getAccountSettings(authUserId: string) {
  return getUserSettingsByAuthUserId(authUserId);
}

export function shouldProvisionPersonalLeague(invitationToken?: string) {
  return shouldCreatePersonalLeague(invitationToken);
}

export async function deleteAccountForUser(authUserId: string) {
  return deleteUserAccount(authUserId);
}
