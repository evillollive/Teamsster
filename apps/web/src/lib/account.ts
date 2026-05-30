import {
  defaultNotificationPreferences,
  deleteUserAccount,
  getUserSettingsByAuthUserId,
  type NotificationChannelPreference,
  type NotificationEventType,
  type NotificationPreferences,
  normalizeNotificationPreferences,
  notificationEventTypeValues,
  provisionUserOnboarding,
  shouldCreatePersonalLeague,
  upsertUserSettings,
} from "@teamsster/db";
import { z } from "zod";

const notificationChannels = ["email", "inApp", "push"] as const;
type NotificationChannelKey = (typeof notificationChannels)[number];

export const notificationPreferenceLabels: Record<
  NotificationEventType,
  { description: string; label: string }
> = {
  ANNOUNCEMENT: {
    description: "League and team announcements",
    label: "Announcements",
  },
  ASSIGNMENT: {
    description: "Assignments and volunteer responsibilities",
    label: "Assignments",
  },
  EVENT_REMINDER: {
    description: "Upcoming games, practices, and RSVP reminders",
    label: "Event reminders",
  },
  MESSAGE: {
    description: "Direct and threaded message activity",
    label: "Messages",
  },
  REGISTRATION_DEADLINE: {
    description: "Registration and paperwork deadlines",
    label: "Registration deadlines",
  },
  VOLUNTEER_REMINDER: {
    description: "Volunteer shift reminders and follow-ups",
    label: "Volunteer reminders",
  },
  WEEKLY_DIGEST: {
    description: "Weekly summary rollups",
    label: "Weekly digest",
  },
};

export const notificationChannelLabels: Record<NotificationChannelKey, string> =
  {
    email: "Email",
    inApp: "In-app",
    push: "Push",
  };

export const timezoneSchema = z.string().trim().min(1).max(100).default("UTC");

export const onboardingSchema = z.object({
  displayName: z.string().trim().max(120).optional(),
  invitationToken: z.string().trim().max(120).optional(),
  timezone: timezoneSchema,
});

const notificationChannelPreferenceSchema = z.object({
  email: z.boolean(),
  inApp: z.boolean(),
  push: z.boolean(),
});

export const notificationPreferencesSchema = z.object({
  ANNOUNCEMENT: notificationChannelPreferenceSchema,
  ASSIGNMENT: notificationChannelPreferenceSchema,
  EVENT_REMINDER: notificationChannelPreferenceSchema,
  MESSAGE: notificationChannelPreferenceSchema,
  REGISTRATION_DEADLINE: notificationChannelPreferenceSchema,
  VOLUNTEER_REMINDER: notificationChannelPreferenceSchema,
  WEEKLY_DIGEST: notificationChannelPreferenceSchema,
});

export const accountSettingsSchema = z.object({
  displayName: z.string().trim().max(120).optional(),
  notificationPreferences: notificationPreferencesSchema,
  timezone: timezoneSchema,
});

export function parseNotificationPreferencesFromFormData(formData: FormData) {
  const nextPreferences = normalizeNotificationPreferences(
    defaultNotificationPreferences,
  );

  for (const eventType of notificationEventTypeValues) {
    for (const channel of notificationChannels) {
      nextPreferences[eventType][channel] =
        formData.get(`notification-${eventType}-${channel}`) === "on";
    }
  }

  return notificationPreferencesSchema.parse(nextPreferences);
}

export function hasEnabledNotificationChannel(
  preference?: NotificationChannelPreference | null,
) {
  return Boolean(preference?.email || preference?.inApp || preference?.push);
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
    notificationPreferences: normalizeNotificationPreferences(
      input.notificationPreferences,
    ),
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
