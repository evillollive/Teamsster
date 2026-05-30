import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import { auditLogs, calendarFeedTokens } from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type CalendarFeedToken = {
  id: string;
  userId: string;
  leagueId: string | null;
  teamId: string | null;
  token: string;
  revokedAt: Date | null;
  createdAt: Date;
};

// ── Token generation ─────────────────────────────────────────────────────────

/**
 * Generates a cryptographically secure feed token (48 bytes, hex-encoded).
 */
export function generateFeedToken(): string {
  return randomBytes(48).toString("hex");
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getFeedTokensByUser(
  userId: string,
): Promise<CalendarFeedToken[]> {
  return db
    .select({
      id: calendarFeedTokens.id,
      userId: calendarFeedTokens.userId,
      leagueId: calendarFeedTokens.leagueId,
      teamId: calendarFeedTokens.teamId,
      token: calendarFeedTokens.token,
      revokedAt: calendarFeedTokens.revokedAt,
      createdAt: calendarFeedTokens.createdAt,
    })
    .from(calendarFeedTokens)
    .where(
      and(
        eq(calendarFeedTokens.userId, userId),
        isNull(calendarFeedTokens.revokedAt),
      ),
    );
}

export async function getFeedTokenByToken(
  token: string,
): Promise<CalendarFeedToken | null> {
  const rows = await db
    .select({
      id: calendarFeedTokens.id,
      userId: calendarFeedTokens.userId,
      leagueId: calendarFeedTokens.leagueId,
      teamId: calendarFeedTokens.teamId,
      token: calendarFeedTokens.token,
      revokedAt: calendarFeedTokens.revokedAt,
      createdAt: calendarFeedTokens.createdAt,
    })
    .from(calendarFeedTokens)
    .where(
      and(
        eq(calendarFeedTokens.token, token),
        isNull(calendarFeedTokens.revokedAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createFeedToken(input: {
  userId: string;
  leagueId?: string;
  teamId?: string;
}): Promise<string> {
  const token = generateFeedToken();

  await db.insert(calendarFeedTokens).values({
    userId: input.userId,
    leagueId: input.leagueId ?? null,
    teamId: input.teamId ?? null,
    token,
  });

  await db.insert(auditLogs).values({
    action: "calendar_feed.create",
    actorUserId: input.userId,
    entityType: "calendar_feed_token",
    metadata: {
      leagueId: input.leagueId,
      teamId: input.teamId,
    },
  });

  return token;
}

export async function revokeFeedToken(input: {
  tokenId: string;
  userId: string;
}): Promise<void> {
  await db
    .update(calendarFeedTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(calendarFeedTokens.id, input.tokenId),
        eq(calendarFeedTokens.userId, input.userId),
        isNull(calendarFeedTokens.revokedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: "calendar_feed.revoke",
    actorUserId: input.userId,
    entityType: "calendar_feed_token",
    entityId: input.tokenId,
    metadata: {},
  });
}

export async function regenerateFeedToken(input: {
  tokenId: string;
  userId: string;
  leagueId?: string;
  teamId?: string;
}): Promise<string> {
  await revokeFeedToken({ tokenId: input.tokenId, userId: input.userId });
  return createFeedToken({
    userId: input.userId,
    leagueId: input.leagueId,
    teamId: input.teamId,
  });
}
