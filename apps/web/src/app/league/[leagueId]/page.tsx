import { auth } from "@teamsster/auth";
import { ClipboardList, Plus, Settings, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLeagueEventsForLeagueAsViewer } from "@/lib/event";
import { getLeagueDetail } from "@/lib/league";
import { getLeagueMemberWorkspaceForUser } from "@/lib/membership";
import { getTeamsForLeague } from "@/lib/team";

export default async function LeagueDashboardPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  let league: Awaited<ReturnType<typeof getLeagueDetail>> = null;
  let teams: Awaited<ReturnType<typeof getTeamsForLeague>> = [];

  if (session?.user) {
    [league, teams] = await Promise.all([
      getLeagueDetail(session.user.id, leagueId),
      getTeamsForLeague(session.user.id, leagueId),
    ]);
  }

  if (!league) {
    notFound();
  }

  const memberWorkspace = session?.user
    ? await getLeagueMemberWorkspaceForUser(session.user.id, leagueId).catch(
        (err: unknown) => {
          // Expected for non-admin members who lack permission to view the workspace.
          if (!(err instanceof Error) || !err.message.includes("permission")) {
            console.error(
              `[league-dashboard] failed to load member workspace for league ${leagueId}:`,
              err,
            );
          }
          return null;
        },
      )
    : null;

  const memberCount = memberWorkspace?.members.length ?? 0;
  const leagueEvents = session?.user
    ? await getLeagueEventsForLeagueAsViewer(session.user.id, leagueId).catch(
        () => [],
      )
    : [];

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          League
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {league.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{league.timezone}</p>
          </div>
          {session?.user ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/league/${leagueId}/settings`}>
                <Settings className="mr-1 h-4 w-4" />
                Settings
              </Link>
            </Button>
          ) : null}
        </div>
      </Card>

      {session?.user && teams.length === 0 ? (
        <Card className="grid gap-4 border-sky-100 bg-sky-50/60">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
              Getting started
            </p>
            <h2 className="text-lg font-semibold">Your first setup steps</h2>
            <p className="text-sm text-slate-600">
              Teamsster created your league. Start with the first team, then add
              staff and move into rosters and events.
            </p>
          </div>
          <ol className="grid gap-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-sky-700 shadow-sm">
                1
              </span>
              <span>Create your first team so the league has a place to grow.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-sky-700 shadow-sm">
                2
              </span>
              <span>
                Invite staff or board members once the team exists and the
                roster can take shape.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-sky-700 shadow-sm">
                3
              </span>
              <span>Use events and rosters after the first team is in place.</span>
            </li>
          </ol>
          <div>
            <Button asChild size="sm">
              <Link href={`/league/${leagueId}/team/new`}>Create your first team</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Teams
          </p>
          {session?.user ? (
            <Button asChild size="sm">
              <Link href={`/league/${leagueId}/team/new`}>
                <Plus className="mr-1 h-4 w-4" />
                New team
              </Link>
            </Button>
          ) : null}
        </div>

        {teams.length === 0 ? (
          <div className="grid place-items-center gap-3 py-8 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-600">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">No teams yet</p>
              <p className="mt-1 text-sm text-slate-500">
                {session?.user
                  ? "Add your first team to start organizing players and schedules."
                  : "Sign in to manage teams."}
              </p>
            </div>
            {session?.user ? (
              <Button asChild size="sm">
                <Link href={`/league/${leagueId}/team/new`}>Add a team</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-3">
            {teams.map((team) => (
              <li key={team.id}>
                <Link
                  className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                  href={`/league/${leagueId}/team/${team.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{team.name}</p>
                      <p className="text-sm text-slate-500">{team.timezone}</p>
                    </div>
                    <span className="text-xs font-medium text-sky-600">
                      Manage →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Members
              </p>
            </div>
            {session?.user ? (
              <Link
                className="text-xs font-medium text-sky-600 hover:underline"
                href={`/league/${leagueId}/settings`}
              >
                Manage →
              </Link>
            ) : null}
          </div>
          {memberWorkspace ? (
            <p className="text-sm text-slate-600">
              {memberCount === 0
                ? "No members yet. Invite staff and volunteers from league settings."
                : `${memberCount} member${memberCount === 1 ? "" : "s"}.`}
              {memberWorkspace.invitations.length > 0
                ? ` ${memberWorkspace.invitations.length} pending invitation${memberWorkspace.invitations.length === 1 ? "" : "s"}.`
                : ""}
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              Manage member roles and invitations from league settings.
            </p>
          )}
        </Card>

        {session?.user ? (
          <Card className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Audit log
                </p>
              </div>
              <Link
                className="text-xs font-medium text-sky-600 hover:underline"
                href={`/league/${leagueId}/audit`}
              >
                View →
              </Link>
            </div>
            <p className="text-sm text-slate-600">
              Review recent administrative actions for this league.
            </p>
          </Card>
        ) : null}
      </div>

      <Card className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">League event agenda</h2>
          {session?.user ? (
            <Link
              className="text-xs font-medium text-sky-600 hover:underline"
              href="/events"
            >
              Open events workspace →
            </Link>
          ) : null}
        </div>
        {!session?.user ? (
          <p className="text-sm text-slate-600">
            Sign in to view league-wide upcoming events.
          </p>
        ) : leagueEvents.length === 0 ? (
          <p className="text-sm text-slate-600">
            No upcoming events yet across league teams.
          </p>
        ) : (
          <ul className="grid gap-2">
            {leagueEvents.slice(0, 8).map((event) => (
              <li
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                key={event.id}
              >
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-slate-600">
                  {event.teamName} · {event.startsAt.toLocaleString()} ·{" "}
                  {event.eventType}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
