import { auth } from "@teamsster/auth";
import { ClipboardList, Plus, Settings, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLeagueDetail } from "@/lib/league";
import { getLeagueMemberWorkspaceForUser } from "@/lib/membership";
import { getTeamsForLeague } from "@/lib/team";

export default async function LeagueDashboardPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const [session, league, teams] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getLeagueDetail(leagueId),
    getTeamsForLeague(leagueId),
  ]);

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
    </div>
  );
}
