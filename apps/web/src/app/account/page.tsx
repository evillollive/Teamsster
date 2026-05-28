import { auth } from "@teamsster/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteAccountForUser,
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

async function deleteAccountAction() {
  "use server";

  const currentSession = await getCurrentSession();
  if (!currentSession?.user) {
    throw new Error("You must be signed in to delete your account.");
  }

  await deleteAccountForUser(currentSession.user.id);
  redirect("/");
}

async function changePasswordAction(formData: FormData) {
  "use server";

  const currentSession = await getCurrentSession();
  if (!currentSession?.user) {
    throw new Error("You must be signed in to change your password.");
  }

  const currentPassword = getString(formData, "currentPassword");
  const newPassword = getString(formData, "newPassword");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!currentPassword || !newPassword) {
    throw new Error("Both current and new passwords are required.");
  }

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirmation do not match.");
  }

  await auth.api.changePassword({
    body: { currentPassword, newPassword },
    headers: await headers(),
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
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              className="mt-0.5"
              name="ageConfirmation"
              required
              type="checkbox"
            />
            <span>
              I confirm that I am at least 18 years old or have parental/guardian
              consent to use this service. I understand that player records for
              minors are managed by authorized adults only.
            </span>
          </label>
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

      {currentSession?.user ? (
        <Card className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold">Change password</h2>
            <p className="text-sm text-slate-600">
              Update your account password. You&apos;ll need to enter your
              current password for verification.
            </p>
          </div>
          <form action={changePasswordAction} className="grid gap-4">
            <FormField
              htmlFor="current-password"
              label="Current password"
            >
              <Input
                autoComplete="current-password"
                id="current-password"
                name="currentPassword"
                required
                type="password"
              />
            </FormField>
            <FormField htmlFor="new-password" label="New password">
              <Input
                autoComplete="new-password"
                id="new-password"
                minLength={8}
                name="newPassword"
                required
                type="password"
              />
            </FormField>
            <FormField
              htmlFor="confirm-password"
              label="Confirm new password"
            >
              <Input
                autoComplete="new-password"
                id="confirm-password"
                minLength={8}
                name="confirmPassword"
                required
                type="password"
              />
            </FormField>
            <div>
              <Button type="submit">Change password</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {currentSession?.user ? (
        <Card className="grid gap-4 border-rose-200 bg-rose-50">
          <div>
            <h2 className="text-lg font-semibold text-rose-900">
              Danger zone
            </h2>
            <p className="text-sm text-rose-800">
              Permanently delete your account and remove yourself from all
              leagues and teams. This action cannot be undone.
            </p>
          </div>
          <form action={deleteAccountAction}>
            <input name="confirm" type="hidden" value="delete" />
            <Button
              className="bg-rose-600 text-white hover:bg-rose-700"
              type="submit"
            >
              Delete my account
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
