import { auth } from "@teamsster/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAccountSettings,
  parseInvitationToken,
  parseNotificationPreferencesFromFormData,
  runOnboardingForAuthenticatedUser,
  saveAccountSettings,
} from "@/lib/account";

function getString(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

async function runOnboardingAction(formData: FormData) {
  "use server";

  const currentSession = await getCurrentSession();
  if (!currentSession?.user) {
    throw new Error("You must be signed in to run onboarding.");
  }

  await runOnboardingForAuthenticatedUser({
    authUserId: currentSession.user.id,
    displayName: getString(formData, "displayName") || currentSession.user.name,
    email: currentSession.user.email,
    invitationToken: parseInvitationToken(formData),
    timezone: getString(formData, "timezone") || "UTC",
  });

  revalidatePath("/account");
}

async function saveSettingsAction(formData: FormData) {
  "use server";

  const currentSession = await getCurrentSession();
  if (!currentSession?.user) {
    throw new Error("You must be signed in to update settings.");
  }

  await saveAccountSettings({
    authUserId: currentSession.user.id,
    displayName: getString(formData, "displayName") || currentSession.user.name,
    notificationPreferences: parseNotificationPreferencesFromFormData(formData),
    timezone: getString(formData, "timezone") || "UTC",
  });

  revalidatePath("/account");
}

export default async function AccountPage() {
  const currentSession = await getCurrentSession();
  const accountSettings = currentSession?.user
    ? await getAccountSettings(currentSession.user.id)
    : null;

  const displayName =
    accountSettings?.displayName ?? currentSession?.user?.name ?? "";
  const timezone = accountSettings?.timezone ?? "UTC";
  const notifications = accountSettings?.notificationPreferences ?? {
    emailAnnouncements: true,
    eventReminders: true,
    weeklyDigest: false,
  };

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Profile and onboarding
        </h1>
        <p className="text-sm text-slate-600">
          Teamsster now provisions a Personal League automatically for newly
          created accounts unless an invitation token is used.
        </p>
        {!currentSession?.user ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sign in through Better Auth first, then return to manage your
            account settings.
          </p>
        ) : null}
      </Card>

      <Card className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Onboarding controls</h2>
          <p className="text-sm text-slate-600">
            Re-run onboarding to provision profile records and a Personal League
            for signed-in users.
          </p>
        </div>
        <form action={runOnboardingAction} className="grid gap-4">
          <FormField htmlFor="onboarding-display-name" label="Display name">
            <Input
              defaultValue={displayName}
              id="onboarding-display-name"
              name="displayName"
              placeholder="Coach Casey"
            />
          </FormField>
          <FormField htmlFor="onboarding-timezone" label="Timezone">
            <Input
              defaultValue={timezone}
              id="onboarding-timezone"
              name="timezone"
              placeholder="America/Los_Angeles"
            />
          </FormField>
          <FormField
            description="Optional: if set, Personal League auto-creation is skipped."
            htmlFor="invitation-token"
            label="Invitation token"
          >
            <Input
              id="invitation-token"
              name="invitationToken"
              placeholder="invite_abc123"
            />
          </FormField>
          <div>
            <Button disabled={!currentSession?.user} type="submit">
              Run onboarding
            </Button>
          </div>
        </form>
      </Card>

      <Card className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Account settings</h2>
          <p className="text-sm text-slate-600">
            Update your profile name, timezone, and email notification
            preferences.
          </p>
        </div>
        <form action={saveSettingsAction} className="grid gap-4">
          <FormField htmlFor="settings-display-name" label="Display name">
            <Input
              defaultValue={displayName}
              id="settings-display-name"
              name="displayName"
              placeholder="Coach Casey"
            />
          </FormField>
          <FormField htmlFor="settings-timezone" label="Timezone">
            <Input
              defaultValue={timezone}
              id="settings-timezone"
              name="timezone"
              placeholder="UTC"
            />
          </FormField>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium text-slate-700">
              Notification preferences
            </legend>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                defaultChecked={notifications.emailAnnouncements}
                name="emailAnnouncements"
                type="checkbox"
              />
              League and team announcements
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                defaultChecked={notifications.eventReminders}
                name="eventReminders"
                type="checkbox"
              />
              Event reminders
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                defaultChecked={notifications.weeklyDigest}
                name="weeklyDigest"
                type="checkbox"
              />
              Weekly digest
            </label>
          </fieldset>
          <div>
            <Button disabled={!currentSession?.user} type="submit">
              Save settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
