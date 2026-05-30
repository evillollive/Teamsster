import { auth } from "@teamsster/auth";
import {
  createMinorAccount,
  getGuardianMinors,
  getMinorGuardians,
  isMinorAccount,
  linkGuardianToMinor,
  unlinkGuardianFromMinor,
} from "@teamsster/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createMinorAccountSchema } from "@/lib/guardian";

function getString(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function getCurrentUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/sign-in");
  }

  // Look up the app-level user ID from authUserId.
  const { getUserIdByAuthUserId } = await import("@teamsster/db");
  const userId = await getUserIdByAuthUserId(session.user.id);
  if (!userId) {
    redirect("/account");
  }

  return { authUserId: session.user.id, userId };
}

async function createMinorAction(formData: FormData) {
  "use server";

  const { userId } = await getCurrentUserId();
  const isMinor = await isMinorAccount(userId);
  if (isMinor) {
    throw new Error("Minor accounts can't create other minor accounts.");
  }

  const input = createMinorAccountSchema.parse({
    displayName: getString(formData, "displayName"),
    dateOfBirth: getString(formData, "dateOfBirth") || undefined,
    username: getString(formData, "username"),
    password: getString(formData, "password"),
  });

  await createMinorAccount({
    guardianUserId: userId,
    displayName: input.displayName,
    dateOfBirth: input.dateOfBirth,
    actorUserId: userId,
  });

  revalidatePath("/account/guardians");
}

async function linkGuardianAction(formData: FormData) {
  "use server";

  const { userId } = await getCurrentUserId();
  const minorUserId = getString(formData, "minorUserId");
  const guardianUserId = getString(formData, "guardianUserId");

  if (!minorUserId || !guardianUserId) {
    throw new Error("Both minor and guardian IDs are required.");
  }

  await linkGuardianToMinor({
    guardianUserId,
    minorUserId,
    relationship: getString(formData, "relationship") || undefined,
    actorUserId: userId,
  });

  revalidatePath("/account/guardians");
}

async function unlinkGuardianAction(formData: FormData) {
  "use server";

  const { userId } = await getCurrentUserId();
  const minorUserId = getString(formData, "minorUserId");
  const guardianUserId = getString(formData, "guardianUserId");

  if (!minorUserId || !guardianUserId) {
    throw new Error("Both minor and guardian IDs are required.");
  }

  await unlinkGuardianFromMinor({
    guardianUserId,
    minorUserId,
    actorUserId: userId,
  });

  revalidatePath("/account/guardians");
}

export default async function GuardianDashboardPage() {
  const { userId } = await getCurrentUserId();

  // Check if the current user is a minor (shouldn't see this page).
  const isMinor = await isMinorAccount(userId);
  if (isMinor) {
    redirect("/account");
  }

  const linkedMinors = await getGuardianMinors(userId);

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Guardian Dashboard
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Manage minor accounts
        </h1>
        <p className="text-sm text-slate-600">
          Create and manage accounts for minors in your care. Each minor
          gets their own username and password for signing in.
        </p>
      </Card>

      {/* Linked minors list */}
      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">Your linked minors</h2>
        {linkedMinors.length === 0 ? (
          <p className="text-sm text-slate-500">
            You don&apos;t have any linked minor accounts yet. Create one below.
          </p>
        ) : (
          <ul aria-label="Linked minor accounts" className="grid gap-3">
            {linkedMinors.map((minor) => (
              <li
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                key={minor.linkId}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {minor.displayName ?? "Unnamed"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {minor.relationship
                      ? `Relationship: ${minor.relationship}`
                      : "No relationship specified"}
                    {minor.isPrimary ? " (Primary)" : ""}
                  </p>
                  {minor.dateOfBirth ? (
                    <p className="text-xs text-slate-400">
                      DOB: {minor.dateOfBirth}
                    </p>
                  ) : null}
                </div>
                <form action={unlinkGuardianAction}>
                  <input
                    name="minorUserId"
                    type="hidden"
                    value={minor.minorUserId}
                  />
                  <input
                    name="guardianUserId"
                    type="hidden"
                    value={userId}
                  />
                  <Button
                    className="text-xs"
                    size="sm"
                    type="submit"
                    variant="ghost"
                  >
                    Remove link
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Create minor account form */}
      <Card className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Create a minor account</h2>
          <p className="text-sm text-slate-600">
            Set up a username and password so your child can sign in on their
            own. You&apos;ll be linked as their primary guardian.
          </p>
        </div>
        <form
          action={createMinorAction}
          aria-label="Create minor account"
          className="grid gap-4"
        >
          <FormField htmlFor="minor-display-name" label="Display name">
            <Input
              id="minor-display-name"
              maxLength={120}
              name="displayName"
              placeholder="Alex Jr"
              required
            />
          </FormField>
          <FormField htmlFor="minor-username" label="Username">
            <Input
              aria-describedby="minor-username-hint"
              autoComplete="off"
              id="minor-username"
              maxLength={30}
              minLength={3}
              name="username"
              pattern="[a-zA-Z0-9_.]+"
              placeholder="alex_jr"
              required
            />
            <span
              className="text-xs font-normal text-slate-500"
              id="minor-username-hint"
            >
              3 to 30 characters. Letters, numbers, underscores, and dots only.
            </span>
          </FormField>
          <FormField htmlFor="minor-password" label="Password">
            <Input
              autoComplete="new-password"
              id="minor-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </FormField>
          <FormField
            description="Optional. Used for age-group eligibility checks."
            htmlFor="minor-dob"
            label="Date of birth"
          >
            <Input id="minor-dob" name="dateOfBirth" type="date" />
          </FormField>
          <div>
            <Button type="submit">Create minor account</Button>
          </div>
        </form>
      </Card>

      {/* Link existing guardian */}
      <Card className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Link another guardian</h2>
          <p className="text-sm text-slate-600">
            Add a co-parent or additional guardian to an existing minor account.
          </p>
        </div>
        <form
          action={linkGuardianAction}
          aria-label="Link guardian to minor"
          className="grid gap-4"
        >
          <FormField htmlFor="link-minor-id" label="Minor account ID">
            <Input
              id="link-minor-id"
              name="minorUserId"
              placeholder="UUID of the minor account"
              required
            />
          </FormField>
          <FormField htmlFor="link-guardian-id" label="Guardian account ID">
            <Input
              id="link-guardian-id"
              name="guardianUserId"
              placeholder="UUID of the guardian account"
              required
            />
          </FormField>
          <FormField
            description="Optional. For example: parent, grandparent, coach."
            htmlFor="link-relationship"
            label="Relationship"
          >
            <Input
              id="link-relationship"
              maxLength={100}
              name="relationship"
            />
          </FormField>
          <div>
            <Button type="submit" variant="secondary">
              Link guardian
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
