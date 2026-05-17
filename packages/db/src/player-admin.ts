import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import { auditLogs, players, teams } from "./schema";

export type PlayerSummary = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  jerseyNumber: string | null;
  timezone: string;
  createdAt: Date;
};

type CreatePlayerInput = {
  leagueId: string;
  teamId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  jerseyNumber?: string;
  timezone: string;
  userId: string;
};

type UpdatePlayerInput = {
  playerId: string;
  leagueId: string;
  teamId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  jerseyNumber?: string;
  timezone: string;
  actorUserId: string;
};

type ArchivePlayerInput = {
  playerId: string;
  leagueId: string;
  teamId: string;
  actorUserId: string;
};

export async function createPlayer(input: CreatePlayerInput) {
  const {
    firstName,
    jerseyNumber,
    lastName,
    leagueId,
    preferredName,
    teamId,
    timezone,
    userId,
  } = input;

  return db.transaction(async (tx) => {
    const activeTeam = await tx
      .select({ id: teams.id })
      .from(teams)
      .where(
        and(
          eq(teams.id, teamId),
          eq(teams.leagueId, leagueId),
          isNull(teams.deletedAt),
        ),
      )
      .limit(1);

    if (!activeTeam[0]) {
      throw new Error("Team not found or already archived.");
    }

    const playerId = (
      await tx
        .insert(players)
        .values({
          createdById: userId,
          firstName: firstName.trim(),
          jerseyNumber: jerseyNumber?.trim() || null,
          lastName: lastName.trim(),
          leagueId,
          preferredName: preferredName?.trim() || null,
          teamId,
          timezone,
        })
        .returning({ id: players.id })
    )[0].id;

    await tx.insert(auditLogs).values({
      action: "player.create",
      actorUserId: userId,
      entityId: playerId,
      entityType: "player",
      leagueId,
      metadata: {
        firstName: firstName.trim(),
        jerseyNumber: jerseyNumber?.trim() || null,
        lastName: lastName.trim(),
        preferredName: preferredName?.trim() || null,
        teamId,
        timezone,
      },
    });

    return { playerId };
  });
}

export async function updatePlayer(input: UpdatePlayerInput) {
  const {
    actorUserId,
    firstName,
    jerseyNumber,
    lastName,
    leagueId,
    playerId,
    preferredName,
    teamId,
    timezone,
  } = input;

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(players)
      .set({
        firstName: firstName.trim(),
        jerseyNumber: jerseyNumber?.trim() || null,
        lastName: lastName.trim(),
        preferredName: preferredName?.trim() || null,
        timezone,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(players.id, playerId),
          eq(players.leagueId, leagueId),
          eq(players.teamId, teamId),
          isNull(players.deletedAt),
        ),
      )
      .returning({ id: players.id });

    if (!updated[0]) {
      throw new Error("Player not found or already archived.");
    }

    await tx.insert(auditLogs).values({
      action: "player.update",
      actorUserId,
      entityId: playerId,
      entityType: "player",
      leagueId,
      metadata: {
        firstName: firstName.trim(),
        jerseyNumber: jerseyNumber?.trim() || null,
        lastName: lastName.trim(),
        preferredName: preferredName?.trim() || null,
        teamId,
        timezone,
      },
    });
  });
}

export async function archivePlayer(input: ArchivePlayerInput) {
  const { actorUserId, leagueId, playerId, teamId } = input;
  const now = new Date();

  await db.transaction(async (tx) => {
    const archived = await tx
      .update(players)
      .set({ deletedAt: now, deletedById: actorUserId, updatedAt: now })
      .where(
        and(
          eq(players.id, playerId),
          eq(players.leagueId, leagueId),
          eq(players.teamId, teamId),
          isNull(players.deletedAt),
        ),
      )
      .returning({ id: players.id });

    if (!archived[0]) {
      throw new Error("Player not found or already archived.");
    }

    await tx.insert(auditLogs).values({
      action: "player.archive",
      actorUserId,
      entityId: playerId,
      entityType: "player",
      leagueId,
      metadata: { teamId },
    });
  });
}

export async function getPlayersByTeamId(
  leagueId: string,
  teamId: string,
): Promise<PlayerSummary[]> {
  const rows = await db
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      preferredName: players.preferredName,
      jerseyNumber: players.jerseyNumber,
      timezone: players.timezone,
      createdAt: players.createdAt,
    })
    .from(players)
    .where(
      and(
        eq(players.leagueId, leagueId),
        eq(players.teamId, teamId),
        isNull(players.deletedAt),
      ),
    )
    .orderBy(asc(players.lastName), asc(players.firstName));

  return rows;
}
