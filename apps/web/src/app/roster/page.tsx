import { auth } from "@teamsster/auth";
import { ShieldCheck } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getLeaguesForUser } from "@/lib/league";
import { getPlayerCountsForLeagueTeams } from "@/lib/player";
import { getTeamsForLeagues } from "@/lib/team";

export default async function RosterPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/");
  }

  const leagues = await getLeaguesForUser(session.user.id);
  const leagueIds = leagues.map((league) => league.id);
  const teamsByLeagueId = await getTeamsForLeagues(session.user.id, leagueIds);
  const teamIds = Object.values(teamsByLeagueId).flatMap((teams) =>
    teams.map((team) => team.id),
  );
  const playerCounts = await getPlayerCountsForLeagueTeams(leagueIds, teamIds);
  const leaguesWithTeamsAndCounts = leagues.map((league) => ({
    ...league,
    teams: (teamsByLeagueId[league.id] ?? []).map((team) => ({
      ...team,
      playerCount: playerCounts[team.id] ?? 0,
    })),
  }));

  const totalPlayers = leaguesWithTeamsAndCounts.reduce(
    (sum, l) => l.teams.reduce((s, t) => s + t.playerCount, sum),
    0,
  );

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Rosters
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          All your rosters
        </h1>
        <p className="text-sm text-slate-500">
          {totalPlayers === 0
            ? "No players on any roster yet. Add players from a team's roster page."
            : `${totalPlayers} player${totalPlayers === 1 ? "" : "s"} across all teams.`}
        </p>
      </Card>

      {leaguesWithTeamsAndCounts.map((league) => (
        <Card className="grid gap-4" key={league.id}>
          <Link
            className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600 hover:underline"
            href={`/league/${league.id}`}
          >
            {league.name}
          </Link>

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
                    href={`/league/${league.id}/team/${team.id}/roster`}
                  >
                    <ShieldCheck className="h-5 w-5 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{team.name}</p>
                      <p className="text-sm text-slate-500">
                        {team.playerCount === 0
                          ? "No players yet"
                          : `${team.playerCount} player${team.playerCount === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-sky-600">
                      Manage roster →
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
