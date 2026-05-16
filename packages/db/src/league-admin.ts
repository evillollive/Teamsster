import { randomUUID } from "node:crypto";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import { auditLogs, leagueMembers, leagues, teams, users } from "./schema";

export type LeagueSummary = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  role: string;
  createdAt: Date;
};

export type LeagueDetail = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateLeagueInput = {
  name: string;
  timezone: string;
  userId: string;
};

type UpdateLeagueInput = {
  leagueId: string;
  name: string;
  timezone: string;
  actorUserId: string;
};

type ArchiveLeagueInput = {
  leagueId: string;
  actorUserId: string;
};

const MAX_SLUG_ATTEMPTS = 5;

export function buildLeagueSlug(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8);
  return `${base || "league"}-${suffix}`;
}

export async function createLeague(input: CreateLeagueInput) {
  const { name, timezone, userId } = input;

  return db.transaction(async (tx) => {
    let leagueId: string | null = null;

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const candidateSlug = buildLeagueSlug(name);
      const existing = await tx
        .select({ id: leagues.id })
        .from(leagues)
        .where(eq(leagues.slug, candidateSlug))
        .limit(1);

      if (existing[0]) {
        continue;
      }

      leagueId = (
        await tx
          .insert(leagues)
          .values({
            createdById: userId,
            name: name.trim(),
            slug: candidateSlug,
            timezone,
          })
          .returning({ id: leagues.id })
      )[0].id;
      break;
    }

    if (!leagueId) {
      throw new Error("Unable to generate a unique league slug.");
    }

    await tx.insert(leagueMembers).values({
      leagueId,
      role: "OWNER",
      userId,
    });

    await tx.insert(auditLogs).values({
      action: "league.create",
      actorUserId: userId,
      entityId: leagueId,
      entityType: "league",
      leagueId,
      metadata: { name: name.trim(), timezone },
    });

    return { leagueId };
  });
}

export async function updateLeague(input: UpdateLeagueInput) {
  const { actorUserId, leagueId, name, timezone } = input;

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(leagues)
      .set({ name: name.trim(), timezone, updatedAt: new Date() })
      .where(and(eq(leagues.id, leagueId), isNull(leagues.deletedAt)))
      .returning({ id: leagues.id });

    if (!updated[0]) {
      throw new Error("League not found or already archived.");
    }

    await tx.insert(auditLogs).values({
      action: "league.update",
      actorUserId,
      entityId: leagueId,
      entityType: "league",
      leagueId,
      metadata: { name: name.trim(), timezone },
    });
  });
}

export async function archiveLeague(input: ArchiveLeagueInput) {
  const { actorUserId, leagueId } = input;
  const now = new Date();

  await db.transaction(async (tx) => {
    // Verify the league exists and is not already archived before cascading.
    const archived = await tx
      .update(leagues)
      .set({ deletedAt: now, deletedById: actorUserId, updatedAt: now })
      .where(and(eq(leagues.id, leagueId), isNull(leagues.deletedAt)))
      .returning({ id: leagues.id });

    if (!archived[0]) {
      throw new Error("League not found or already archived.");
    }

    // Cascade soft-delete to all active teams in the league.
    await tx
      .update(teams)
      .set({ deletedAt: now, deletedById: actorUserId, updatedAt: now })
      .where(and(eq(teams.leagueId, leagueId), isNull(teams.deletedAt)));

    await tx.insert(auditLogs).values({
      action: "league.archive",
      actorUserId,
      entityId: leagueId,
      entityType: "league",
      leagueId,
      metadata: {},
    });
  });
}

export async function getLeaguesByUserId(
  userId: string,
): Promise<LeagueSummary[]> {
  const rows = await db
    .select({
      id: leagues.id,
      name: leagues.name,
      role: leagueMembers.role,
      slug: leagues.slug,
      timezone: leagues.timezone,
      createdAt: leagues.createdAt,
    })
    .from(leagueMembers)
    .innerJoin(leagues, eq(leagueMembers.leagueId, leagues.id))
    .where(
      and(
        eq(leagueMembers.userId, userId),
        isNull(leagueMembers.deletedAt),
        isNull(leagues.deletedAt),
      ),
    );

  return rows;
}

export async function getLeagueById(
  leagueId: string,
): Promise<LeagueDetail | null> {
  const rows = await db
    .select({
      id: leagues.id,
      name: leagues.name,
      slug: leagues.slug,
      timezone: leagues.timezone,
      createdById: leagues.createdById,
      createdAt: leagues.createdAt,
      updatedAt: leagues.updatedAt,
    })
    .from(leagues)
    .where(and(eq(leagues.id, leagueId), isNull(leagues.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getUserLeagueMembership(
  leagueId: string,
  userId: string,
) {
  const rows = await db
    .select({ role: leagueMembers.role })
    .from(leagueMembers)
    .where(
      and(
        eq(leagueMembers.leagueId, leagueId),
        eq(leagueMembers.userId, userId),
        isNull(leagueMembers.deletedAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getUserIdByAuthUserId(
  authUserId: string,
): Promise<string | null> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.authUserId, authUserId), isNull(users.deletedAt)))
    .limit(1);

  return rows[0]?.id ?? null;
}

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

const AUDIT_LOG_DEFAULT_LIMIT = 50;

export async function getAuditLogsForLeague(
  leagueId: string,
  limit = AUDIT_LOG_DEFAULT_LIMIT,
): Promise<AuditLogEntry[]> {
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      actorUserId: auditLogs.actorUserId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(eq(auditLogs.leagueId, leagueId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows;
}
