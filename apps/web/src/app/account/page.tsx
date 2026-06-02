import { auth } from "@teamsster/auth";
import {
  defaultNotificationPreferences,
  getMinorGuardians,
  isMinorPlaceholderEmail,
  notificationEventTypeValues,
} from "@teamsster/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  deleteAccountForUser,
  getAccountSettings,
  notificationChannelLabels,
  notificationPreferenceLabels,
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

  const existingSettings = await getAccountSettings(currentSession.user.id);
  const isMinorAccount = isMinorPlaceholderEmail(currentSession.user.email);

  await saveAccountSettings({
    authUserId: currentSession.user.id,
    displayName: getString(formData, "displayName") || currentSession.user.name,
    notificationPreferences: isMinorAccount
      ? (existingSettings?.notificationPreferences ??
        defaultNotificationPreferences)
      : parseNotificationPreferencesFromFormData(formData),
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

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ invitationToken?: string; onboarding?: string }>;
}) {
  const currentSession = await getCurrentSession();
  const query = searchParams ? await searchParams : {};
  const accountSettings = currentSession?.user
    ? await getAccountSettings(currentSession.user.id)
    : null;

  const displayName =
    accountSettings?.displayName ?? currentSession?.user?.name ?? "";
  const timezone = accountSettings?.timezone ?? "UTC";
  const notifications =
    accountSettings?.notificationPreferences ?? defaultNotificationPreferences;

  // Detect minor account: placeholder email means this is a username-only minor.
  const userEmail = currentSession?.user?.email ?? "";
  const isMinorUser = isMinorPlaceholderEmail(userEmail);
  const showOnboardingShell =
    Boolean(currentSession?.user) &&
    !isMinorUser &&
    (!accountSettings || query.onboarding === "1");
  const invitationToken = query.invitationToken ?? "";

  // For minor accounts, resolve and display linked guardians.
  let guardians: Awaited<ReturnType<typeof getMinorGuardians>> = [];
  if (isMinorUser && currentSession?.user) {
    const { getUserIdByAuthUserId } = await import("@teamsster/db");
    const appUserId = await getUserIdByAuthUserId(currentSession.user.id);
    if (appUserId) {
      guardians = await getMinorGuardians(appUserId);
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isMinorUser
            ? "Your profile"
            : showOnboardingShell
              ? "Finish your setup"
              : "Profile and settings"}
        </h1>
        {isMinorUser ? (
          <p className="text-sm text-slate-600">
            Your account is managed by a parent or guardian. Some settings
            aren&apos;t available for minor accounts.
          </p>
        ) : (
          <div className="grid gap-2">
            <p className="text-sm text-slate-600">
              {showOnboardingShell
                ? "Teamsster will create your profile and a Personal League unless you paste an invitation token instead."
                : "Teamsster provisions a Personal League automatically for newly created accounts unless an invitation token is used."}
            </p>
            {!showOnboardingShell && accountSettings ? (
              <div>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/account?onboarding=1">
                    Reopen guided onboarding
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        )}
        {!currentSession?.user ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sign in through Better Auth first, then return to manage your
            account settings.
          </p>
        ) : null}
      </Card>

      {/* Guardian info for minor accounts */}
      {isMinorUser && guardians.length > 0 ? (
        <Card className="grid gap-3">
          <h2 className="text-lg font-semibold">Your guardians</h2>
          <p className="text-sm text-slate-600">
            These people manage your account and receive notifications on your
            behalf.
          </p>
          <ul aria-label="Linked guardians" className="grid gap-2">
            {guardians.map((g) => (
              <li
                className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 text-sm"
                key={g.linkId}
              >
                <span className="font-medium text-slate-900">
                  {g.displayName ?? "Guardian"}
                </span>
                {g.relationship ? (
                  <span className="text-slate-500">({g.relationship})</span>
                ) : null}
                {g.isPrimary ? (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                    Primary
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {!isMinorUser && showOnboardingShell ? (
        <Card className="grid gap-5">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
              Guided onboarding
            </p>
            <h2 className="text-lg font-semibold">
              Set up your account and first league
            </h2>
            <p className="text-sm text-slate-600">
              Teamsster will provision your profile, timezone, and first league
              in one pass. If you&apos;re joining an invited league, paste the
              invitation token and we&apos;ll skip Personal League creation.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
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
                description="Optional. Paste an invitation token if you're joining an existing league. Leave it blank to create your Personal League."
                htmlFor="invitation-token"
                label="Invitation token"
              >
                <Input
                  id="invitation-token"
                  name="invitationToken"
                  defaultValue={invitationToken}
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
                  I confirm that I am at least 18 years old or have parental or
                  guardian consent to use this service. I understand that player
                  records for minors are managed by authorized adults only.
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <Button disabled={!currentSession?.user} type="submit">
                  Finish setup and continue
                </Button>
              </div>
            </form>

            <div className="grid gap-4 rounded-2xl bg-sky-50 p-4 text-sm text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900">
                  What happens next
                </h3>
                <p className="mt-1 text-slate-600">
                  This first pass gets you to a real league dashboard quickly,
                  then you can add teams, members, and events.
                </p>
              </div>
              <ol className="grid gap-3">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-sky-700 shadow-sm">
                    1
                  </span>
                  <span>Confirm your display name and timezone.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-sky-700 shadow-sm">
                    2
                  </span>
                  <span>
                    Decide whether to create a Personal League or join with an
                    invitation token.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-sky-700 shadow-sm">
                    3
                  </span>
                  <span>
                    Continue into league setup or the invited dashboard.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </Card>
      ) : null}

      {isMinorUser ||
      (!isMinorUser && accountSettings && !showOnboardingShell) ? (
        <Card className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {isMinorUser ? "Profile settings" : "Account settings"}
            </h2>
            <p className="text-sm text-slate-600">
              {isMinorUser
                ? "Update your display name and timezone."
                : "Update your profile name, timezone, and notification channels."}
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
            {/* Notification preferences: hidden for minors (routed to guardians) */}
            {!isMinorUser && notifications ? (
              <fieldset className="grid gap-4">
                <legend className="text-sm font-medium text-slate-700">
                  Notification preferences
                </legend>
                <p className="text-sm text-slate-600">
                  Choose which channels Teamsster can use for each notification
                  type.
                </p>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full border-collapse text-sm">
                    <caption className="sr-only">
                      Notification preference matrix by event type and channel
                    </caption>
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-medium" scope="col">
                          Notification type
                        </th>
                        {Object.entries(notificationChannelLabels).map(
                          ([channel, label]) => (
                            <th
                              className="px-4 py-3 text-center font-medium"
                              key={channel}
                              scope="col"
                            >
                              {label}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {notificationEventTypeValues.map((eventType) => {
                        const preference = notifications[eventType];
                        const details = notificationPreferenceLabels[eventType];

                        return (
                          <tr
                            className="border-t border-slate-200 align-top"
                            key={eventType}
                          >
                            <th
                              className="px-4 py-3 text-left font-medium"
                              scope="row"
                            >
                              <div>{details.label}</div>
                              <p className="mt-1 text-xs font-normal text-slate-500">
                                {details.description}
                              </p>
                            </th>
                            {Object.entries(notificationChannelLabels).map(
                              ([channel, label]) => (
                                <td
                                  className="px-4 py-3 text-center"
                                  key={channel}
                                >
                                  <label className="inline-flex items-center justify-center">
                                    <input
                                      aria-label={`${details.label} via ${label}`}
                                      defaultChecked={
                                        preference[
                                          channel as keyof typeof preference
                                        ]
                                      }
                                      name={`notification-${eventType}-${channel}`}
                                      type="checkbox"
                                    />
                                  </label>
                                </td>
                              ),
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </fieldset>
            ) : (
              <p className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-800">
                Email notifications for your account are sent to your
                guardian(s) automatically.
              </p>
            )}
            <div>
              <Button disabled={!currentSession?.user} type="submit">
                Save settings
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {currentSession?.user &&
      (isMinorUser ||
        (!isMinorUser && accountSettings && !showOnboardingShell)) ? (
        <Card className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold">Change password</h2>
            <p className="text-sm text-slate-600">
              Update your account password. You&apos;ll need to enter your
              current password for verification.
            </p>
          </div>
          <form action={changePasswordAction} className="grid gap-4">
            <FormField htmlFor="current-password" label="Current password">
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
            <FormField htmlFor="confirm-password" label="Confirm new password">
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

      {/* Danger zone: don't show for minor accounts */}
      {currentSession?.user &&
      !isMinorUser &&
      accountSettings &&
      !showOnboardingShell ? (
        <Card className="grid gap-4 border-rose-200 bg-rose-50">
          <div>
            <h2 className="text-lg font-semibold text-rose-900">Danger zone</h2>
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

      {/* Guardian dashboard link for standard accounts */}
      {currentSession?.user && !isMinorUser ? (
        <Card className="grid gap-2">
          <h2 className="text-lg font-semibold">Minor accounts</h2>
          <p className="text-sm text-slate-600">
            Create and manage accounts for children in your care.
          </p>
          <div>
            <a
              className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              href="/account/guardians"
            >
              Manage minor accounts
            </a>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
