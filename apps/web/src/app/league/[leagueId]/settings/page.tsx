import { auth } from "@teamsster/auth";
import { roleValues } from "@teamsster/db/schema";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  archiveLeagueForUser,
  getLeagueDetail,
  updateLeagueForUser,
} from "@/lib/league";
import {
  assignLeagueRoleForUser,
  getLeagueMemberWorkspaceForUser,
  inviteLeagueMemberForUser,
  removeLeagueRoleForUser,
  revokeLeagueInvitationForUser,
} from "@/lib/membership";
export default async function LeagueSettingsPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const [session, league] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getLeagueDetail(leagueId),
  ]);

  if (!league) {
    notFound();
  }

  const memberWorkspace = session?.user
    ? await getLeagueMemberWorkspaceForUser(session.user.id, leagueId)
    : { invitations: [], members: [] };

  async function updateLeagueAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to update a league.");
    }

    const currentLeague = await getLeagueDetail(leagueId);
    if (!currentLeague) {
      throw new Error("League not found.");
    }

    const name =
      (formData.get("name") as string | null)?.trim() || currentLeague.name;
    const timezone =
      (formData.get("timezone") as string | null)?.trim() ||
      currentLeague.timezone;

    await updateLeagueForUser(currentSession.user.id, {
      leagueId,
      name,
      timezone,
    });

    revalidatePath(`/league/${leagueId}`);
    revalidatePath(`/league/${leagueId}/settings`);
    redirect(`/league/${leagueId}`);
  }

  async function archiveLeagueAction() {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to archive a league.");
    }

    await archiveLeagueForUser(currentSession.user.id, leagueId);

    revalidatePath("/league");
    redirect("/league");
  }

  async function assignMemberRoleAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to assign member roles.");
    }

    await assignLeagueRoleForUser(currentSession.user.id, {
      email: (formData.get("email") as string | null) ?? "",
      leagueId,
      role: (formData.get("role") as string | null) ?? "GUEST",
    });

    revalidatePath(`/league/${leagueId}`);
    revalidatePath(`/league/${leagueId}/settings`);
  }

  async function inviteMemberAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to send invitations.");
    }

    await inviteLeagueMemberForUser(currentSession.user.id, {
      email: (formData.get("email") as string | null) ?? "",
      leagueId,
      role: (formData.get("role") as string | null) ?? "GUEST",
    });

    revalidatePath(`/league/${leagueId}/settings`);
  }

  async function revokeInvitationAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to revoke invitations.");
    }

    await revokeLeagueInvitationForUser(currentSession.user.id, {
      invitationId: (formData.get("invitationId") as string | null) ?? "",
      leagueId,
    });

    revalidatePath(`/league/${leagueId}/settings`);
  }

  async function removeMemberRoleAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to remove member roles.");
    }

    await removeLeagueRoleForUser(currentSession.user.id, {
      leagueId,
      role: (formData.get("role") as string | null) ?? "",
      userId: (formData.get("userId") as string | null) ?? "",
    });

    revalidatePath(`/league/${leagueId}/settings`);
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          League settings
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{league.name}</h1>
        <p className="text-sm text-slate-600">
          Update league details or archive this league.
        </p>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">League details</h2>
        <form action={updateLeagueAction} className="grid gap-4">
          <FormField htmlFor="league-name" label="League name">
            <Input
              defaultValue={league.name}
              id="league-name"
              maxLength={120}
              name="name"
              required
            />
          </FormField>
          <FormField
            description="e.g. America/Chicago"
            htmlFor="league-timezone"
            label="Timezone"
          >
            <Input
              defaultValue={league.timezone}
              id="league-timezone"
              name="timezone"
            />
          </FormField>
          <div className="flex items-center gap-3">
            <Button disabled={!session?.user} type="submit">
              Save changes
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/league/${leagueId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>

      <Card className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Members and invitations</h2>
          <p className="text-sm text-slate-600">
            Assign roles for existing users or invite new members by email.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form action={assignMemberRoleAction} className="grid gap-3">
            <p className="text-sm font-semibold">Assign role to member</p>
            <FormField htmlFor="assign-email" label="Member email">
              <Input
                id="assign-email"
                name="email"
                placeholder="coach@example.com"
                required
                type="email"
              />
            </FormField>
            <FormField htmlFor="assign-role" label="Role">
              <select
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                defaultValue="COACH"
                id="assign-role"
                name="role"
              >
                {roleValues.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </FormField>
            <div>
              <Button disabled={!session?.user} type="submit">
                Save role
              </Button>
            </div>
          </form>

          <form action={inviteMemberAction} className="grid gap-3">
            <p className="text-sm font-semibold">Invite new member</p>
            <FormField htmlFor="invite-email" label="Invitee email">
              <Input
                id="invite-email"
                name="email"
                placeholder="manager@example.com"
                required
                type="email"
              />
            </FormField>
            <FormField htmlFor="invite-role" label="Role to grant on accept">
              <select
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                defaultValue="GUEST"
                id="invite-role"
                name="role"
              >
                {roleValues.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </FormField>
            <div>
              <Button
                disabled={!session?.user}
                type="submit"
                variant="secondary"
              >
                Send invite
              </Button>
            </div>
          </form>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2">
            <p className="text-sm font-semibold">Current members</p>
            {memberWorkspace.members.length === 0 ? (
              <p className="text-sm text-slate-500">No members found.</p>
            ) : (
              <ul className="grid gap-2">
                {memberWorkspace.members.map((member) => (
                  <li
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    key={member.userId}
                  >
                    <p className="mb-1 text-slate-700">{member.email}</p>
                    <div className="flex flex-wrap gap-1">
                      {member.roles.map((role) => (
                        <form
                          action={removeMemberRoleAction}
                          className="inline-flex"
                          key={role}
                        >
                          <input
                            name="userId"
                            type="hidden"
                            value={member.userId}
                          />
                          <input name="role" type="hidden" value={role} />
                          <button
                            className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 transition hover:bg-rose-100 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!session?.user}
                            title={`Remove ${role}`}
                            type="submit"
                          >
                            {role}
                            <span aria-hidden="true">×</span>
                          </button>
                        </form>
                      ))}
                      {member.roles.length === 0 && (
                        <span className="text-xs text-slate-400">
                          No roles assigned
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-semibold">Pending invitations</p>
            {memberWorkspace.invitations.length === 0 ? (
              <p className="text-sm text-slate-500">No pending invitations.</p>
            ) : (
              <ul className="grid gap-2">
                {memberWorkspace.invitations.map((invite) => (
                  <li
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    key={invite.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-slate-700">{invite.email}</p>
                        <p className="text-xs text-slate-500">
                          {invite.role} · Expires{" "}
                          {invite.expiresAt.toLocaleDateString()}
                        </p>
                      </div>
                      <form action={revokeInvitationAction}>
                        <input
                          name="invitationId"
                          type="hidden"
                          value={invite.id}
                        />
                        <Button
                          disabled={!session?.user}
                          size="sm"
                          type="submit"
                          variant="ghost"
                        >
                          Revoke
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      <Card className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Audit log
        </p>
        <p className="text-sm text-slate-600">
          Review recent administrative actions for this league.
        </p>
        <div>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/league/${leagueId}/audit`}>View audit log</Link>
          </Button>
        </div>
      </Card>

      <Card className="grid gap-4 border-rose-100 bg-rose-50">
        <div>
          <h2 className="text-lg font-semibold text-rose-700">Danger zone</h2>
          <p className="mt-1 text-sm text-rose-600">
            Archiving removes this league and all its teams from active views.
            This action cannot be undone from the UI.
          </p>
        </div>
        <form action={archiveLeagueAction}>
          <Button disabled={!session?.user} type="submit" variant="secondary">
            Archive league
          </Button>
        </form>
      </Card>
    </div>
  );
}
