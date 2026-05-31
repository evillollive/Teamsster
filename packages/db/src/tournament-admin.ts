import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import type { MatchStatus, TournamentFormat } from "./schema";
import { auditLogs, tournamentMatches, tournaments } from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type TournamentSummary = {
  id: string;
  leagueId: string;
  divisionId: string | null;
  seasonId: string | null;
  name: string;
  format: TournamentFormat;
  seedOrder: string[];
  createdAt: Date;
};

export type TournamentMatchSummary = {
  id: string;
  tournamentId: string;
  round: string;
  matchNumber: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: string | null;
  awayScore: string | null;
  winnerId: string | null;
  status: MatchStatus;
  scheduledAt: Date | null;
  nextMatchId: string | null;
};

// ── Bracket generation ───────────────────────────────────────────────────────

/**
 * Calculates the number of rounds needed for a single-elimination bracket.
 */
export function calculateRounds(teamCount: number): number {
  if (teamCount < 2) return 0;
  return Math.ceil(Math.log2(teamCount));
}

/**
 * Calculates how many byes are needed to fill a bracket to a power of 2.
 */
export function calculateByes(teamCount: number): number {
  const nextPow2 = 2 ** calculateRounds(teamCount);
  return nextPow2 - teamCount;
}

/**
 * Generates a single-elimination bracket from seeded teams.
 * Returns match definitions (without DB IDs) ready for insertion.
 */
export function generateSingleEliminationBracket(teamIds: string[]): Array<{
  round: string;
  matchNumber: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  nextMatchIndex: number | null;
}> {
  const totalRounds = calculateRounds(teamIds.length);
  const bracketSize = 2 ** totalRounds;
  const byes = bracketSize - teamIds.length;
  const matches: Array<{
    round: string;
    matchNumber: string;
    homeTeamId: string | null;
    awayTeamId: string | null;
    nextMatchIndex: number | null;
  }> = [];

  // Build all rounds
  let matchIndex = 0;
  const roundSizes: number[] = [];
  for (let r = 1; r <= totalRounds; r++) {
    const matchesInRound = bracketSize / 2 ** r;
    roundSizes.push(matchesInRound);
  }

  // Generate round 1 matches
  const r1Matches = roundSizes[0];
  for (let m = 0; m < r1Matches; m++) {
    const homeIdx = m * 2;
    const awayIdx = m * 2 + 1;
    const homeTeam = homeIdx < teamIds.length ? teamIds[homeIdx] : null;
    const awayTeam = awayIdx < teamIds.length ? teamIds[awayIdx] : null;
    const nextMatchIdx = totalRounds > 1 ? r1Matches + Math.floor(m / 2) : null;

    matches.push({
      round: "1",
      matchNumber: String(m + 1),
      homeTeamId: homeTeam,
      awayTeamId: awayTeam,
      nextMatchIndex: nextMatchIdx,
    });
    matchIndex++;
  }

  // Generate subsequent rounds
  let prevRoundStart = 0;
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = roundSizes[r - 1];
    const roundStart = matchIndex;
    for (let m = 0; m < matchesInRound; m++) {
      const nextMatchIdx =
        r < totalRounds
          ? roundStart + matchesInRound + Math.floor(m / 2)
          : null;
      matches.push({
        round: String(r),
        matchNumber: String(m + 1),
        homeTeamId: null,
        awayTeamId: null,
        nextMatchIndex: nextMatchIdx,
      });
      matchIndex++;
    }
    prevRoundStart = roundStart;
  }

  return matches;
}

/**
 * Generates round-robin matches (each team plays every other team once).
 */
export function generateRoundRobinMatches(teamIds: string[]): Array<{
  round: string;
  matchNumber: string;
  homeTeamId: string;
  awayTeamId: string;
}> {
  const matches: Array<{
    round: string;
    matchNumber: string;
    homeTeamId: string;
    awayTeamId: string;
  }> = [];

  let matchNum = 1;
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({
        round: "1",
        matchNumber: String(matchNum++),
        homeTeamId: teamIds[i],
        awayTeamId: teamIds[j],
      });
    }
  }

  return matches;
}

// ── Score-driven advancement ─────────────────────────────────────────────────

/**
 * Determines the winner of a match based on scores.
 */
export function determineWinner(
  homeScore: string,
  awayScore: string,
  homeTeamId: string | null,
  awayTeamId: string | null,
): string | null {
  const h = Number.parseInt(homeScore, 10);
  const a = Number.parseInt(awayScore, 10);
  if (Number.isNaN(h) || Number.isNaN(a)) return null;
  if (h > a) return homeTeamId;
  if (a > h) return awayTeamId;
  return null; // Tie, no automatic advancement
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getTournamentsByLeague(
  leagueId: string,
): Promise<TournamentSummary[]> {
  return db
    .select({
      id: tournaments.id,
      leagueId: tournaments.leagueId,
      divisionId: tournaments.divisionId,
      seasonId: tournaments.seasonId,
      name: tournaments.name,
      format: tournaments.format,
      seedOrder: tournaments.seedOrder,
      createdAt: tournaments.createdAt,
    })
    .from(tournaments)
    .where(
      and(eq(tournaments.leagueId, leagueId), isNull(tournaments.deletedAt)),
    )
    .orderBy(tournaments.createdAt);
}

export async function getMatchesByTournament(
  tournamentId: string,
): Promise<TournamentMatchSummary[]> {
  return db
    .select({
      id: tournamentMatches.id,
      tournamentId: tournamentMatches.tournamentId,
      round: tournamentMatches.round,
      matchNumber: tournamentMatches.matchNumber,
      homeTeamId: tournamentMatches.homeTeamId,
      awayTeamId: tournamentMatches.awayTeamId,
      homeScore: tournamentMatches.homeScore,
      awayScore: tournamentMatches.awayScore,
      winnerId: tournamentMatches.winnerId,
      status: tournamentMatches.status,
      scheduledAt: tournamentMatches.scheduledAt,
      nextMatchId: tournamentMatches.nextMatchId,
    })
    .from(tournamentMatches)
    .where(eq(tournamentMatches.tournamentId, tournamentId))
    .orderBy(tournamentMatches.round, tournamentMatches.matchNumber);
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createTournament(input: {
  leagueId: string;
  divisionId?: string;
  seasonId?: string;
  name: string;
  format: TournamentFormat;
  seedOrder: string[];
  createdById: string;
}): Promise<string> {
  const [row] = await db
    .insert(tournaments)
    .values({
      leagueId: input.leagueId,
      divisionId: input.divisionId ?? null,
      seasonId: input.seasonId ?? null,
      name: input.name,
      format: input.format,
      seedOrder: input.seedOrder,
      createdById: input.createdById,
    })
    .returning({ id: tournaments.id });

  await db.insert(auditLogs).values({
    action: "tournament.create",
    actorUserId: input.createdById,
    entityType: "tournament",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: {
      name: input.name,
      format: input.format,
      teamCount: input.seedOrder.length,
    },
  });

  // Generate bracket matches
  let bracketMatches: Array<{
    round: string;
    matchNumber: string;
    homeTeamId: string | null;
    awayTeamId: string | null;
    nextMatchIndex?: number | null;
  }>;

  if (input.format === "round_robin" || input.format === "pool_play") {
    bracketMatches = generateRoundRobinMatches(input.seedOrder);
  } else {
    bracketMatches = generateSingleEliminationBracket(input.seedOrder);
  }

  // Insert matches and track IDs for linking
  const matchIds: string[] = [];
  for (const match of bracketMatches) {
    const [m] = await db
      .insert(tournamentMatches)
      .values({
        tournamentId: row.id,
        round: match.round,
        matchNumber: match.matchNumber,
        homeTeamId: match.homeTeamId ?? null,
        awayTeamId: match.awayTeamId ?? null,
      })
      .returning({ id: tournamentMatches.id });
    matchIds.push(m.id);
  }

  // Link next-match references for elimination brackets
  if (input.format !== "round_robin" && input.format !== "pool_play") {
    for (let i = 0; i < bracketMatches.length; i++) {
      const nextIdx = (bracketMatches[i] as { nextMatchIndex?: number | null })
        .nextMatchIndex;
      if (nextIdx != null && matchIds[nextIdx]) {
        await db
          .update(tournamentMatches)
          .set({ nextMatchId: matchIds[nextIdx] })
          .where(eq(tournamentMatches.id, matchIds[i]));
      }
    }
  }

  return row.id;
}

export async function submitMatchScore(input: {
  matchId: string;
  homeScore: string;
  awayScore: string;
  submittedById: string;
  leagueId: string;
}): Promise<void> {
  const match = await db
    .select({
      homeTeamId: tournamentMatches.homeTeamId,
      awayTeamId: tournamentMatches.awayTeamId,
      nextMatchId: tournamentMatches.nextMatchId,
      matchNumber: tournamentMatches.matchNumber,
    })
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, input.matchId))
    .limit(1);

  if (!match[0]) throw new Error("Match not found.");

  const winner = determineWinner(
    input.homeScore,
    input.awayScore,
    match[0].homeTeamId,
    match[0].awayTeamId,
  );

  await db
    .update(tournamentMatches)
    .set({
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      winnerId: winner,
      status: "completed",
      updatedAt: new Date(),
    })
    .where(eq(tournamentMatches.id, input.matchId));

  // Advance winner to next match
  if (winner && match[0].nextMatchId) {
    const nextMatch = await db
      .select({
        homeTeamId: tournamentMatches.homeTeamId,
      })
      .from(tournamentMatches)
      .where(eq(tournamentMatches.id, match[0].nextMatchId))
      .limit(1);

    if (nextMatch[0]) {
      const slot = nextMatch[0].homeTeamId ? "awayTeamId" : "homeTeamId";
      await db
        .update(tournamentMatches)
        .set({ [slot]: winner, updatedAt: new Date() })
        .where(eq(tournamentMatches.id, match[0].nextMatchId));
    }
  }

  await db.insert(auditLogs).values({
    action: "tournament_match.score",
    actorUserId: input.submittedById,
    entityType: "tournament_match",
    entityId: input.matchId,
    leagueId: input.leagueId,
    metadata: {
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      winner,
    },
  });
}
