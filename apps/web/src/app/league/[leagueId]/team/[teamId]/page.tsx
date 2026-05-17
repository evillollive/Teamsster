import { auth } from "@teamsster/auth";
import { Settings } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTeamEventsForTeamAsViewer } from "@/lib/event";
import { getLeagueDetail } from "@/lib/league";
import { getPlayersForTeam } from "@/lib/player";
import { getTeamDetail } from "@/lib/team";

export default async function TeamDetailPage({
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

  const teamEvents = session?.user
    ? await getTeamEventsForTeamAsViewer(
        session.user.id,
        leagueId,
        teamId,
      ).catch(() => [])
    : [];

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          <Link className="hover:underline" href={`/league/${leagueId}`}>
            {league.name}
          </Link>
          {" · Team"}
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {team.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{team.timezone}</p>
          </div>
          {session?.user ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/league/${leagueId}/team/${teamId}/settings`}>
                <Settings className="mr-1 h-4 w-4" />
                Settings
              </Link>
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Roster
            </p>
            {session?.user ? (
              <Link
                className="text-xs font-medium text-sky-600 hover:underline"
                href={`/league/${leagueId}/team/${teamId}/roster`}
              >
                Manage →
              </Link>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {players.length === 0
              ? "No active players yet. Add your first player to start building the roster."
              : `${players.length} active player${players.length === 1 ? "" : "s"} on this team.`}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Members
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Manage team member roles and invitations from team settings.
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Events
            </p>
            {session?.user ? (
              <Link
                className="text-xs font-medium text-sky-600 hover:underline"
                href={`/events?leagueId=${leagueId}&teamId=${teamId}`}
              >
                Manage →
              </Link>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Schedule games and practices with recurrence options in the events
            workspace.
          </p>
        </Card>
      </div>

      <Card className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Team event agenda</h2>
          {session?.user ? (
            <Link
              className="text-xs font-medium text-sky-600 hover:underline"
              href={`/events?leagueId=${leagueId}&teamId=${teamId}`}
            >
              Open events workspace →
            </Link>
          ) : null}
        </div>
        {!session?.user ? (
          <p className="text-sm text-slate-600">
            Sign in to view upcoming team events.
          </p>
        ) : teamEvents.length === 0 ? (
          <p className="text-sm text-slate-600">
            No upcoming events yet for this team.
          </p>
        ) : (
          <ul className="grid gap-2">
            {teamEvents.slice(0, 6).map((event) => (
              <li
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                key={event.id}
              >
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-slate-600">
                  {event.startsAt.toLocaleString()} · {event.eventType}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
