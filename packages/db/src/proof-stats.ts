/**
 * Stats proof-of-concept module.
 *
 * Demonstrates how a stats/standings module would hook into
 * the extension system. Provides team standings calculation
 * and basic stat aggregation patterns.
 */

import type { HookPayload } from "./extension-system";
import { registerHook, registerModule } from "./extension-system";

// ── Types ────────────────────────────────────────────────────────────────────

export type TeamStanding = {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export type LeagueStandings = {
  leagueId: string;
  seasonId?: string;
  standings: TeamStanding[];
  lastUpdated: Date;
};

// ── Standings calculation ────────────────────────────────────────────────────

export function calculatePoints(wins: number, ties: number): number {
  return wins * 3 + ties;
}

export function calculateGoalDifference(
  goalsFor: number,
  goalsAgainst: number,
): number {
  return goalsFor - goalsAgainst;
}

export function sortStandings(standings: TeamStanding[]): TeamStanding[] {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = calculateGoalDifference(a.goalsFor, a.goalsAgainst);
    const gdB = calculateGoalDifference(b.goalsFor, b.goalsAgainst);
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });
}

export function createEmptyStanding(
  teamId: string,
  teamName: string,
): TeamStanding {
  return {
    teamId,
    teamName,
    wins: 0,
    losses: 0,
    ties: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  };
}

export function updateStandingFromScore(
  standing: TeamStanding,
  scored: number,
  conceded: number,
): TeamStanding {
  const updated = { ...standing };
  updated.goalsFor += scored;
  updated.goalsAgainst += conceded;

  if (scored > conceded) {
    updated.wins++;
  } else if (scored < conceded) {
    updated.losses++;
  } else {
    updated.ties++;
  }

  updated.points = calculatePoints(updated.wins, updated.ties);
  return updated;
}

// ── Module registration ──────────────────────────────────────────────────────

export function initStatsModule(): void {
  registerModule({
    id: "stats",
    name: "Stats and Standings",
    version: "0.1.0",
    description: "Team standings, win/loss records, and goal statistics.",
    hooks: [
      {
        event: "score.published",
        description: "Updates team standings when a score is published.",
      },
    ],
    apiRoutes: [
      {
        method: "GET",
        path: "/api/stats/standings/:leagueId",
        description: "Returns current league standings.",
      },
    ],
  });

  registerHook("stats", "score.published", async (payload: HookPayload) => {
    console.log(
      `[stats] Score published for event ${payload.data.eventId}, standings would be recalculated.`,
    );
  });
}
