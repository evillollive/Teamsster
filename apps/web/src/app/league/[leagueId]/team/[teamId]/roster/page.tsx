import { auth } from "@teamsster/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLeagueDetail } from "@/lib/league";
import {
  archivePlayerForUser,
  createPlayerForUser,
  getPlayersForTeam,
  updatePlayerForUser,
} from "@/lib/player";
import { getTeamDetail } from "@/lib/team";

export default async function TeamRosterPage({
  params,
}: {
  params: Promise<{ leagueId: string; teamId: string }>;
}) {
  const { leagueId, teamId } = await params;
  const [session, league, team, players] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getLeagueDetail(leagueId),
    getTeamDetail(teamId),
    getPlayersForTeam(leagueId, teamId),
  ]);

  if (!league || !team || team.leagueId !== leagueId) {
    notFound();
  }
  const activeTeam = team;

  async function createPlayerAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to create players.");
    }

    await createPlayerForUser(currentSession.user.id, {
      firstName: (formData.get("firstName") as string | null) ?? "",
      jerseyNumber:
        (formData.get("jerseyNumber") as string | null) ?? undefined,
      lastName: (formData.get("lastName") as string | null) ?? "",
      leagueId,
      preferredName:
        (formData.get("preferredName") as string | null) ?? undefined,
      teamId,
      timezone:
        (formData.get("timezone") as string | null)?.trim() ||
        activeTeam.timezone,
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/roster`);
  }

  async function updatePlayerAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to update players.");
    }

    await updatePlayerForUser(currentSession.user.id, {
      firstName: (formData.get("firstName") as string | null) ?? "",
      jerseyNumber:
        (formData.get("jerseyNumber") as string | null) ?? undefined,
      lastName: (formData.get("lastName") as string | null) ?? "",
      leagueId,
      playerId: (formData.get("playerId") as string | null) ?? "",
      preferredName:
        (formData.get("preferredName") as string | null) ?? undefined,
      teamId,
      timezone:
        (formData.get("timezone") as string | null)?.trim() ||
        activeTeam.timezone,
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/roster`);
  }

  async function archivePlayerAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to archive players.");
    }

    const playerId = (formData.get("playerId") as string | null) ?? "";
    await archivePlayerForUser(
      currentSession.user.id,
      playerId,
      leagueId,
      teamId,
    );

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/roster`);
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
            {activeTeam.name}
          </Link>
          {" · Roster"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Manage roster</h1>
        <p className="text-sm text-slate-600">
          Create, update, and archive players for this team. Archiving is a soft
          delete and keeps historical records intact.
        </p>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">Add player</h2>
        <form action={createPlayerAction} className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="player-first-name" label="First name">
            <Input
              autoComplete="given-name"
              id="player-first-name"
              maxLength={120}
              name="firstName"
              required
            />
          </FormField>
          <FormField htmlFor="player-last-name" label="Last name">
            <Input
              autoComplete="family-name"
              id="player-last-name"
              maxLength={120}
              name="lastName"
              required
            />
          </FormField>
          <FormField htmlFor="player-preferred-name" label="Preferred name">
            <Input
              id="player-preferred-name"
              maxLength={120}
              name="preferredName"
              placeholder="Optional nickname"
            />
          </FormField>
          <FormField htmlFor="player-jersey-number" label="Jersey number">
            <Input
              id="player-jersey-number"
              maxLength={20}
              name="jerseyNumber"
              placeholder="Optional"
            />
          </FormField>
          <FormField
            className="sm:col-span-2"
            htmlFor="player-timezone"
            label="Timezone"
          >
            <Input
              defaultValue={activeTeam.timezone}
              id="player-timezone"
              maxLength={100}
              name="timezone"
              placeholder={activeTeam.timezone}
            />
          </FormField>
          <div className="sm:col-span-2">
            <Button disabled={!session?.user} type="submit">
              Add player
            </Button>
          </div>
        </form>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">Active players</h2>

        {players.length === 0 ? (
          <p className="text-sm text-slate-500">
            No active players yet. Add the first player above.
          </p>
        ) : (
          <ul className="grid gap-4">
            {players.map((player) => (
              <li
                className="rounded-2xl border border-slate-200 p-4"
                key={player.id}
              >
                <div className="grid gap-3">
                  <form
                    action={updatePlayerAction}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <input name="playerId" type="hidden" value={player.id} />
                    <FormField
                      htmlFor={`player-first-name-${player.id}`}
                      label="First name"
                    >
                      <Input
                        defaultValue={player.firstName}
                        id={`player-first-name-${player.id}`}
                        maxLength={120}
                        name="firstName"
                        required
                      />
                    </FormField>
                    <FormField
                      htmlFor={`player-last-name-${player.id}`}
                      label="Last name"
                    >
                      <Input
                        defaultValue={player.lastName}
                        id={`player-last-name-${player.id}`}
                        maxLength={120}
                        name="lastName"
                        required
                      />
                    </FormField>
                    <FormField
                      htmlFor={`player-preferred-name-${player.id}`}
                      label="Preferred name"
                    >
                      <Input
                        defaultValue={player.preferredName ?? ""}
                        id={`player-preferred-name-${player.id}`}
                        maxLength={120}
                        name="preferredName"
                        placeholder="Optional nickname"
                      />
                    </FormField>
                    <FormField
                      htmlFor={`player-jersey-number-${player.id}`}
                      label="Jersey number"
                    >
                      <Input
                        defaultValue={player.jerseyNumber ?? ""}
                        id={`player-jersey-number-${player.id}`}
                        maxLength={20}
                        name="jerseyNumber"
                        placeholder="Optional"
                      />
                    </FormField>
                    <FormField
                      className="sm:col-span-2"
                      htmlFor={`player-timezone-${player.id}`}
                      label="Timezone"
                    >
                      <Input
                        defaultValue={player.timezone}
                        id={`player-timezone-${player.id}`}
                        maxLength={100}
                        name="timezone"
                      />
                    </FormField>
                    <div className="sm:col-span-2">
                      <Button disabled={!session?.user} size="sm" type="submit">
                        Save player
                      </Button>
                    </div>
                  </form>

                  <form action={archivePlayerAction}>
                    <input name="playerId" type="hidden" value={player.id} />
                    <Button
                      disabled={!session?.user}
                      size="sm"
                      type="submit"
                      variant="ghost"
                    >
                      Archive player
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
