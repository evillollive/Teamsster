import { auth } from "@teamsster/auth";
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
  const [session, league, team] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getLeagueDetail(leagueId),
    getTeamDetail(teamId),
  ]);

  if (!league || !team || team.leagueId !== leagueId) {
    notFound();
  }

  async function updateTeamAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to update a team.");
    }

    const currentTeam = await getTeamDetail(teamId);
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
