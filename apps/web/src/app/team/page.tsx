import { auth } from "@teamsster/auth";
import { Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getLeaguesForUser } from "@/lib/league";
import { getTeamsForLeague } from "@/lib/team";

export default async function TeamPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/");
  }

  const leagues = await getLeaguesForUser(session.user.id);
  const leaguesWithTeams = await Promise.all(
    leagues.map(async (league) => ({
      ...league,
      teams: await getTeamsForLeague(session.user.id, league.id),
    })),
  );

  const totalTeams = leaguesWithTeams.reduce(
    (sum, l) => sum + l.teams.length,
    0,
  );

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Teams
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          All your teams
        </h1>
        <p className="text-sm text-slate-500">
          {totalTeams === 0
            ? "You don't have any teams yet. Create one from a league dashboard."
            : `${totalTeams} team${totalTeams === 1 ? "" : "s"} across ${leagues.length} league${leagues.length === 1 ? "" : "s"}.`}
        </p>
      </Card>

      {leaguesWithTeams.map((league) => (
        <Card className="grid gap-4" key={league.id}>
          <div className="flex items-center justify-between gap-3">
            <Link
              className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600 hover:underline"
              href={`/league/${league.id}`}
            >
              {league.name}
            </Link>
            <span className="text-xs text-slate-400">{league.timezone}</span>
          </div>

          {league.teams.length === 0 ? (
            <p className="text-sm text-slate-500">
              No teams in this league yet.
            </p>
          ) : (
            <ul className="grid gap-3">
              {league.teams.map((team) => (
                <li key={team.id}>
                  <Link
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                    href={`/league/${league.id}/team/${team.id}`}
                  >
                    <Users className="h-5 w-5 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{team.name}</p>
                      <p className="text-sm text-slate-500">{team.timezone}</p>
                    </div>
                    <span className="text-xs font-medium text-sky-600">
                      Open →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
