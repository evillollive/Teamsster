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
import { getLeagueDetail } from "@/lib/league";
import {
  assignTeamRoleForUser,
  assignTeamRoleTemplateForUser,
  getTeamMemberWorkspaceForUser,
  inviteTeamMemberForUser,
  removeTeamRoleForUser,
  revokeTeamInvitationForUser,
} from "@/lib/membership";
import {
  archiveTeamForUser,
  getTeamDetail,
  updateTeamForUser,
} from "@/lib/team";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ leagueId: string; teamId: string }>;
}) {
  const { leagueId, teamId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  let league: Awaited<ReturnType<typeof getLeagueDetail>> = null;
  let team: Awaited<ReturnType<typeof getTeamDetail>> = null;

  if (session?.user) {
    [league, team] = await Promise.all([
      getLeagueDetail(session.user.id, leagueId),
      getTeamDetail(session.user.id, teamId),
    ]);
  }

  if (!league || !team || team.leagueId !== leagueId) {
    notFound();
  }

  const memberWorkspace = session?.user
    ? await getTeamMemberWorkspaceForUser(session.user.id, leagueId, teamId)
    : { invitations: [], members: [], roleTemplates: [] };

  async function updateTeamAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to update a team.");
    }

    const currentTeam = await getTeamDetail(currentSession.user.id, teamId);
    if (!currentTeam) {
      throw new Error("Team not found.");
    }

    const name =
      (formData.get("name") as string | null)?.trim() || currentTeam.name;
    const timezone =
      (formData.get("timezone") as string | null)?.trim() ||
      currentTeam.timezone;

    await updateTeamForUser(currentSession.user.id, {
      teamId,
      leagueId,
      name,
      timezone,
    });

    revalidatePath(`/league/${leagueId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/settings`);
    redirect(`/league/${leagueId}/team/${teamId}`);
  }

  async function archiveTeamAction() {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to archive a team.");
    }

    await archiveTeamForUser(currentSession.user.id, teamId, leagueId);

    revalidatePath(`/league/${leagueId}`);
    redirect(`/league/${leagueId}`);
  }

  async function assignTeamRoleAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to assign team roles.");
    }

    await assignTeamRoleForUser(currentSession.user.id, {
      email: (formData.get("email") as string | null) ?? "",
      leagueId,
      role: (formData.get("role") as string | null) ?? "GUEST",
      teamId,
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/settings`);
  }

  async function inviteTeamMemberAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to invite team members.");
    }

    await inviteTeamMemberForUser(currentSession.user.id, {
      email: (formData.get("email") as string | null) ?? "",
      leagueId,
      role: (formData.get("role") as string | null) ?? "GUEST",
      teamId,
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}/settings`);
  }

  async function revokeInvitationAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to revoke team invitations.");
    }

    await revokeTeamInvitationForUser(currentSession.user.id, {
      invitationId: (formData.get("invitationId") as string | null) ?? "",
      leagueId,
      teamId,
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}/settings`);
  }

  async function removeTeamMemberRoleAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to remove team member roles.");
    }

    await removeTeamRoleForUser(currentSession.user.id, {
      leagueId,
      role: (formData.get("role") as string | null) ?? "",
      teamId,
      userId: (formData.get("userId") as string | null) ?? "",
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}/settings`);
  }

  async function assignRoleTemplateAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to assign role templates.");
    }

    await assignTeamRoleTemplateForUser(currentSession.user.id, {
      email: (formData.get("email") as string | null) ?? "",
      leagueId,
      teamId,
      templateId: (formData.get("templateId") as string | null) ?? "",
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/settings`);
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          <Link className="hover:underline" href={`/league/${leagueId}`}>
            {league.name}
          </Link>
          {" · "}
          <Link
            className="hover:underline"
            href={`/league/${leagueId}/team/${teamId}`}
          >
            {team.name}
          </Link>
          {" · Team settings"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
        <p className="text-sm text-slate-600">
          Update team details or archive this team.
        </p>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">Team details</h2>
        <form action={updateTeamAction} className="grid gap-4">
          <FormField htmlFor="team-name" label="Team name">
            <Input
              defaultValue={team.name}
              id="team-name"
              maxLength={120}
              name="name"
              required
            />
          </FormField>
          <FormField
            description="e.g. America/Chicago"
            htmlFor="team-timezone"
            label="Timezone"
          >
            <Input
              defaultValue={team.timezone}
              id="team-timezone"
              name="timezone"
            />
          </FormField>
          <div className="flex items-center gap-3">
            <Button disabled={!session?.user} type="submit">
              Save changes
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/league/${leagueId}/team/${teamId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>

      <Card className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Members and invitations</h2>
          <p className="text-sm text-slate-600">
            Manage team staff/member roles and send role-based invitations.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form action={assignTeamRoleAction} className="grid gap-3">
            <p className="text-sm font-semibold">Assign role to team member</p>
            <FormField htmlFor="team-assign-email" label="Member email">
              <Input
                id="team-assign-email"
                name="email"
                placeholder="assistant@example.com"
                required
                type="email"
              />
            </FormField>
            <FormField htmlFor="team-assign-role" label="Role">
              <select
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                defaultValue="COACH"
                id="team-assign-role"
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

          <form action={inviteTeamMemberAction} className="grid gap-3">
            <p className="text-sm font-semibold">Invite new team member</p>
            <FormField htmlFor="team-invite-email" label="Invitee email">
              <Input
                id="team-invite-email"
                name="email"
                placeholder="volunteer@example.com"
                required
                type="email"
              />
            </FormField>
            <FormField
              htmlFor="team-invite-role"
              label="Role to grant on accept"
            >
              <select
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                defaultValue="GUEST"
                id="team-invite-role"
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

        <form action={assignRoleTemplateAction} className="grid gap-3">
          <p className="text-sm font-semibold">Apply role template</p>
          <div className="grid gap-3 lg:grid-cols-2">
            <FormField htmlFor="team-template-email" label="Member email">
              <Input
                id="team-template-email"
                name="email"
                placeholder="assistant@example.com"
                required
                type="email"
              />
            </FormField>
            <FormField htmlFor="team-template-id" label="Template">
              <select
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                defaultValue=""
                id="team-template-id"
                name="templateId"
                required
              >
                <option disabled value="">
                  Select template
                </option>
                {memberWorkspace.roleTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label} ({template.roles.join(", ")})
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div>
            <Button
              disabled={
                !session?.user || memberWorkspace.roleTemplates.length === 0
              }
              type="submit"
              variant="secondary"
            >
              Apply template
            </Button>
          </div>
          {memberWorkspace.roleTemplates.length === 0 ? (
            <p className="text-xs text-slate-500">
              No templates available yet. Create templates in league settings.
            </p>
          ) : null}
        </form>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-2">
            <p className="text-sm font-semibold">Current team members</p>
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
                          action={removeTeamMemberRoleAction}
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
                            aria-label={`Remove ${role} role`}
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

      <Card className="grid gap-4 border-rose-100 bg-rose-50">
        <div>
          <h2 className="text-lg font-semibold text-rose-700">Danger zone</h2>
          <p className="mt-1 text-sm text-rose-600">
            Archiving removes this team from active views. This action cannot be
            undone from the UI.
          </p>
        </div>
        <form action={archiveTeamAction}>
          <Button disabled={!session?.user} type="submit" variant="secondary">
            Archive team
          </Button>
        </form>
      </Card>
    </div>
  );
}
