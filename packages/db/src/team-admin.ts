import { randomUUID } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import { auditLogs, teamMembers, teams } from "./schema";

export type TeamSummary = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  createdAt: Date;
};

export type TeamDetail = {
  id: string;
  leagueId: string;
  name: string;
  slug: string;
  timezone: string;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateTeamInput = {
  leagueId: string;
  name: string;
  timezone: string;
  userId: string;
};

type UpdateTeamInput = {
  teamId: string;
  leagueId: string;
  name: string;
  timezone: string;
  actorUserId: string;
};

type ArchiveTeamInput = {
  teamId: string;
  leagueId: string;
  actorUserId: string;
};

const MAX_SLUG_ATTEMPTS = 5;

export function buildTeamSlug(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8);
  return `${base || "team"}-${suffix}`;
}

export async function createTeam(input: CreateTeamInput) {
  const { leagueId, name, timezone, userId } = input;

  return db.transaction(async (tx) => {
    let teamId: string | null = null;

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const candidateSlug = buildTeamSlug(name);
      const existing = await tx
        .select({ id: teams.id })
        .from(teams)
        .where(and(eq(teams.leagueId, leagueId), eq(teams.slug, candidateSlug)))
        .limit(1);

      if (existing[0]) {
        continue;
      }

      teamId = (
        await tx
          .insert(teams)
          .values({
            createdById: userId,
            leagueId,
            name: name.trim(),
            slug: candidateSlug,
            timezone,
          })
          .returning({ id: teams.id })
      )[0].id;
      break;
    }

    if (!teamId) {
      throw new Error("Unable to generate a unique team slug.");
    }

    await tx.insert(auditLogs).values({
      action: "team.create",
      actorUserId: userId,
      entityId: teamId,
      entityType: "team",
      leagueId,
      metadata: { name: name.trim(), timezone },
    });

    return { teamId };
  });
}

export async function updateTeam(input: UpdateTeamInput) {
  const { actorUserId, leagueId, name, teamId, timezone } = input;

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(teams)
      .set({ name: name.trim(), timezone, updatedAt: new Date() })
      .where(
        and(
          eq(teams.id, teamId),
          eq(teams.leagueId, leagueId),
          isNull(teams.deletedAt),
        ),
      )
      .returning({ id: teams.id });

    if (!updated[0]) {
      throw new Error("Team not found or already archived.");
    }

    await tx.insert(auditLogs).values({
      action: "team.update",
      actorUserId,
      entityId: teamId,
      entityType: "team",
      leagueId,
      metadata: { name: name.trim(), timezone },
    });
  });
}

export async function archiveTeam(input: ArchiveTeamInput) {
  const { actorUserId, leagueId, teamId } = input;
  const now = new Date();

  await db.transaction(async (tx) => {
    const archived = await tx
      .update(teams)
      .set({ deletedAt: now, deletedById: actorUserId, updatedAt: now })
      .where(
        and(
          eq(teams.id, teamId),
          eq(teams.leagueId, leagueId),
          isNull(teams.deletedAt),
        ),
      )
      .returning({ id: teams.id });

    if (!archived[0]) {
      throw new Error("Team not found or already archived.");
    }

    await tx.insert(auditLogs).values({
      action: "team.archive",
      actorUserId,
      entityId: teamId,
      entityType: "team",
      leagueId,
      metadata: {},
    });
  });
}

export async function getTeamsByLeagueId(
  leagueId: string,
): Promise<TeamSummary[]> {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      timezone: teams.timezone,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .where(and(eq(teams.leagueId, leagueId), isNull(teams.deletedAt)));

  return rows;
}

export async function getTeamById(teamId: string): Promise<TeamDetail | null> {
  const rows = await db
    .select({
      id: teams.id,
      leagueId: teams.leagueId,
      name: teams.name,
      slug: teams.slug,
      timezone: teams.timezone,
      createdById: teams.createdById,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
    })
    .from(teams)
    .where(and(eq(teams.id, teamId), isNull(teams.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getUserTeamMembership(teamId: string, userId: string) {
  const rows = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
        isNull(teamMembers.deletedAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
