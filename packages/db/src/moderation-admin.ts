import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import {
  auditLogs,
  messageFlags,
  messagingPolicies,
  moderationActions,
} from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type MinorDmRestriction =
  | "team_threads_only"
  | "no_dm"
  | "approved_contacts_only"
  | "unrestricted";

export type MessagingPolicy = {
  id: string;
  leagueId: string;
  minorDmRestriction: string;
  retentionDays: string | null;
};

// ── Minor safety ─────────────────────────────────────────────────────────────

const MINOR_DM_RESTRICTIONS: Record<MinorDmRestriction, string> = {
  team_threads_only: "Minors can only participate in team group threads",
  no_dm: "Minors cannot send or receive direct messages",
  approved_contacts_only: "Minors can only DM approved contacts",
  unrestricted: "No restrictions on minor messaging",
};

export function getMinorRestrictionLabel(restriction: string): string {
  return (
    MINOR_DM_RESTRICTIONS[restriction as MinorDmRestriction] ??
    "Unknown restriction"
  );
}

export function canMinorSendDm(
  restriction: string,
  isApprovedContact: boolean,
): boolean {
  switch (restriction) {
    case "unrestricted":
      return true;
    case "approved_contacts_only":
      return isApprovedContact;
    case "no_dm":
    case "team_threads_only":
      return false;
    default:
      return false;
  }
}

// ── Flagging ─────────────────────────────────────────────────────────────────

export const FLAG_RATE_LIMIT = {
  maxFlagsPerHour: 10,
  windowMs: 60 * 60 * 1000,
} as const;

export async function flagMessage(input: {
  messageId: string;
  flaggedById: string;
  reason?: string;
  leagueId: string;
}): Promise<string> {
  const [row] = await db
    .insert(messageFlags)
    .values({
      messageId: input.messageId,
      flaggedById: input.flaggedById,
      reason: input.reason ?? null,
    })
    .returning({ id: messageFlags.id });

  await db.insert(auditLogs).values({
    action: "message.flag",
    actorUserId: input.flaggedById,
    entityType: "message_flag",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { messageId: input.messageId },
  });

  return row.id;
}

export async function reviewFlag(input: {
  flagId: string;
  status: "reviewed" | "dismissed";
  reviewNotes?: string;
  reviewedById: string;
  leagueId: string;
}): Promise<void> {
  await db
    .update(messageFlags)
    .set({
      status: input.status,
      reviewedById: input.reviewedById,
      reviewNotes: input.reviewNotes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(messageFlags.id, input.flagId));

  await db.insert(auditLogs).values({
    action: `message_flag.${input.status}`,
    actorUserId: input.reviewedById,
    entityType: "message_flag",
    entityId: input.flagId,
    leagueId: input.leagueId,
    metadata: { status: input.status },
  });
}

export async function getPendingFlags(leagueId: string) {
  return db
    .select({
      id: messageFlags.id,
      messageId: messageFlags.messageId,
      flaggedById: messageFlags.flaggedById,
      reason: messageFlags.reason,
      createdAt: messageFlags.createdAt,
    })
    .from(messageFlags)
    .where(eq(messageFlags.status, "pending"));
}

// ── Moderation actions ───────────────────────────────────────────────────────

export function isMuteDurationValid(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt > new Date();
}

export async function muteUser(input: {
  leagueId: string;
  targetUserId: string;
  reason?: string;
  expiresAt?: Date;
  actorUserId: string;
}): Promise<string> {
  const [row] = await db
    .insert(moderationActions)
    .values({
      leagueId: input.leagueId,
      targetUserId: input.targetUserId,
      action: "mute",
      reason: input.reason ?? null,
      expiresAt: input.expiresAt ?? null,
      actorUserId: input.actorUserId,
    })
    .returning({ id: moderationActions.id });

  await db.insert(auditLogs).values({
    action: "moderation.mute",
    actorUserId: input.actorUserId,
    entityType: "moderation_action",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { targetUserId: input.targetUserId },
  });

  return row.id;
}

export async function isUserMuted(
  userId: string,
  leagueId: string,
): Promise<boolean> {
  const now = new Date();
  const rows = await db
    .select({
      id: moderationActions.id,
      expiresAt: moderationActions.expiresAt,
    })
    .from(moderationActions)
    .where(
      and(
        eq(moderationActions.targetUserId, userId),
        eq(moderationActions.leagueId, leagueId),
        eq(moderationActions.action, "mute"),
      ),
    )
    .orderBy(moderationActions.createdAt)
    .limit(1);

  if (!rows[0]) return false;
  if (!rows[0].expiresAt) return true;
  return rows[0].expiresAt > now;
}

// ── Messaging policies ──────────────────────────────────────────────────────

export async function getMessagingPolicy(
  leagueId: string,
): Promise<MessagingPolicy | null> {
  const rows = await db
    .select({
      id: messagingPolicies.id,
      leagueId: messagingPolicies.leagueId,
      minorDmRestriction: messagingPolicies.minorDmRestriction,
      retentionDays: messagingPolicies.retentionDays,
    })
    .from(messagingPolicies)
    .where(eq(messagingPolicies.leagueId, leagueId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertMessagingPolicy(input: {
  leagueId: string;
  minorDmRestriction?: string;
  retentionDays?: string;
  updatedById: string;
}): Promise<void> {
  const existing = await getMessagingPolicy(input.leagueId);

  if (existing) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (input.minorDmRestriction !== undefined)
      updates.minorDmRestriction = input.minorDmRestriction;
    if (input.retentionDays !== undefined)
      updates.retentionDays = input.retentionDays;
    updates.updatedById = input.updatedById;

    await db
      .update(messagingPolicies)
      .set(updates)
      .where(eq(messagingPolicies.id, existing.id));
  } else {
    await db.insert(messagingPolicies).values({
      leagueId: input.leagueId,
      minorDmRestriction: input.minorDmRestriction ?? "team_threads_only",
      retentionDays: input.retentionDays ?? null,
      updatedById: input.updatedById,
    });
  }

  await db.insert(auditLogs).values({
    action: "messaging_policy.update",
    actorUserId: input.updatedById,
    entityType: "messaging_policy",
    leagueId: input.leagueId,
    metadata: {
      minorDmRestriction: input.minorDmRestriction,
      retentionDays: input.retentionDays,
    },
  });
}

// ── Retention ────────────────────────────────────────────────────────────────

export function calculateRetentionCutoff(
  retentionDays: string | null,
): Date | null {
  if (!retentionDays) return null;
  const days = Number.parseInt(retentionDays, 10);
  if (Number.isNaN(days) || days <= 0) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}
