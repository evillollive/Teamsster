import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import type { AssignmentStatus } from "./schema";
import {
  auditLogs,
  gameAssignments,
  gameScores,
  officialAvailability,
} from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type GameAssignmentSummary = {
  id: string;
  leagueId: string;
  eventId: string;
  officialUserId: string;
  status: AssignmentStatus;
  respondedAt: Date | null;
  createdAt: Date;
};

export type GameScoreSummary = {
  id: string;
  leagueId: string;
  eventId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: string | null;
  awayScore: string | null;
  notes: string | null;
  publishedAt: Date | null;
};

// ── Score validation ─────────────────────────────────────────────────────────

export function validateScore(score: string | null | undefined): boolean {
  if (!score) return true;
  const num = Number.parseInt(score, 10);
  return !Number.isNaN(num) && num >= 0 && num <= 999 && String(num) === score;
}

// ── Assignment queries ───────────────────────────────────────────────────────

export async function getAssignmentsByEvent(
  eventId: string,
): Promise<GameAssignmentSummary[]> {
  return db
    .select({
      id: gameAssignments.id,
      leagueId: gameAssignments.leagueId,
      eventId: gameAssignments.eventId,
      officialUserId: gameAssignments.officialUserId,
      status: gameAssignments.status,
      respondedAt: gameAssignments.respondedAt,
      createdAt: gameAssignments.createdAt,
    })
    .from(gameAssignments)
    .where(
      and(
        eq(gameAssignments.eventId, eventId),
        isNull(gameAssignments.deletedAt),
      ),
    );
}

export async function getAssignmentsByOfficial(
  officialUserId: string,
): Promise<GameAssignmentSummary[]> {
  return db
    .select({
      id: gameAssignments.id,
      leagueId: gameAssignments.leagueId,
      eventId: gameAssignments.eventId,
      officialUserId: gameAssignments.officialUserId,
      status: gameAssignments.status,
      respondedAt: gameAssignments.respondedAt,
      createdAt: gameAssignments.createdAt,
    })
    .from(gameAssignments)
    .where(
      and(
        eq(gameAssignments.officialUserId, officialUserId),
        isNull(gameAssignments.deletedAt),
      ),
    );
}

// ── Assignment mutations ─────────────────────────────────────────────────────

export async function assignOfficial(input: {
  leagueId: string;
  eventId: string;
  officialUserId: string;
  assignedById: string;
}): Promise<string> {
  const [row] = await db
    .insert(gameAssignments)
    .values({
      leagueId: input.leagueId,
      eventId: input.eventId,
      officialUserId: input.officialUserId,
      assignedById: input.assignedById,
    })
    .returning({ id: gameAssignments.id });

  await db.insert(auditLogs).values({
    action: "game_assignment.create",
    actorUserId: input.assignedById,
    entityType: "game_assignment",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { eventId: input.eventId, officialUserId: input.officialUserId },
  });

  return row.id;
}

export async function respondToAssignment(input: {
  assignmentId: string;
  status: "confirmed" | "declined";
  officialUserId: string;
  leagueId: string;
}): Promise<void> {
  await db
    .update(gameAssignments)
    .set({
      status: input.status,
      respondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(gameAssignments.id, input.assignmentId),
        eq(gameAssignments.officialUserId, input.officialUserId),
        isNull(gameAssignments.deletedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: `game_assignment.${input.status}`,
    actorUserId: input.officialUserId,
    entityType: "game_assignment",
    entityId: input.assignmentId,
    leagueId: input.leagueId,
    metadata: { status: input.status },
  });
}

// ── Score mutations ──────────────────────────────────────────────────────────

export async function submitScore(input: {
  leagueId: string;
  eventId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore: string;
  awayScore: string;
  notes?: string;
  submittedById: string;
}): Promise<string> {
  if (!validateScore(input.homeScore) || !validateScore(input.awayScore)) {
    throw new Error("Invalid score value. Must be a non-negative integer.");
  }

  const [row] = await db
    .insert(gameScores)
    .values({
      leagueId: input.leagueId,
      eventId: input.eventId,
      homeTeamId: input.homeTeamId ?? null,
      awayTeamId: input.awayTeamId ?? null,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      notes: input.notes ?? null,
      submittedById: input.submittedById,
    })
    .returning({ id: gameScores.id });

  await db.insert(auditLogs).values({
    action: "game_score.submit",
    actorUserId: input.submittedById,
    entityType: "game_score",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: {
      eventId: input.eventId,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
    },
  });

  return row.id;
}

export async function publishScore(input: {
  scoreId: string;
  leagueId: string;
  actorUserId: string;
}): Promise<void> {
  await db
    .update(gameScores)
    .set({ publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(gameScores.id, input.scoreId));

  await db.insert(auditLogs).values({
    action: "game_score.publish",
    actorUserId: input.actorUserId,
    entityType: "game_score",
    entityId: input.scoreId,
    leagueId: input.leagueId,
    metadata: {},
  });
}

// ── Availability ─────────────────────────────────────────────────────────────

export async function setAvailability(input: {
  userId: string;
  leagueId: string;
  dayOfWeek: string;
  startTime?: string;
  endTime?: string;
  isAvailable: boolean;
}): Promise<string> {
  const existing = await db
    .select({ id: officialAvailability.id })
    .from(officialAvailability)
    .where(
      and(
        eq(officialAvailability.userId, input.userId),
        eq(officialAvailability.leagueId, input.leagueId),
        eq(officialAvailability.dayOfWeek, input.dayOfWeek),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(officialAvailability)
      .set({
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        isAvailable: input.isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(officialAvailability.id, existing[0].id));
    return existing[0].id;
  }

  const [row] = await db
    .insert(officialAvailability)
    .values({
      userId: input.userId,
      leagueId: input.leagueId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      isAvailable: input.isAvailable,
    })
    .returning({ id: officialAvailability.id });

  return row.id;
}

export async function getAvailabilityByOfficial(
  userId: string,
  leagueId: string,
) {
  return db
    .select({
      id: officialAvailability.id,
      dayOfWeek: officialAvailability.dayOfWeek,
      startTime: officialAvailability.startTime,
      endTime: officialAvailability.endTime,
      isAvailable: officialAvailability.isAvailable,
    })
    .from(officialAvailability)
    .where(
      and(
        eq(officialAvailability.userId, userId),
        eq(officialAvailability.leagueId, leagueId),
      ),
    )
    .orderBy(officialAvailability.dayOfWeek);
}
