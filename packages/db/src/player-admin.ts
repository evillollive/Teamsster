import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import { auditLogs, playerContacts, players, teams } from "./schema";

export type PlayerSummary = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  jerseyNumber: string | null;
  timezone: string;
  createdAt: Date;
};

export type PlayerContactSummary = {
  id: string;
  playerId: string;
  firstName: string;
  lastName: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
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

type BulkCreatePlayersInput = {
  leagueId: string;
  teamId: string;
  userId: string;
  players: Array<{
    firstName: string;
    lastName: string;
    preferredName?: string;
    jerseyNumber?: string;
    timezone: string;
  }>;
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

type CreatePlayerContactInput = {
  leagueId: string;
  teamId: string;
  playerId: string;
  firstName: string;
  lastName: string;
  relationship?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
  userId: string;
};

type ArchivePlayerContactInput = {
  leagueId: string;
  teamId: string;
  playerId: string;
  contactId: string;
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

export async function bulkCreatePlayers(input: BulkCreatePlayersInput) {
  const { leagueId, players: playerRows, teamId, userId } = input;

  if (playerRows.length === 0) {
    return { createdPlayerIds: [] as string[] };
  }

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

    const normalizedPlayers = playerRows.map((player) => ({
      createdById: userId,
      firstName: player.firstName.trim(),
      jerseyNumber: player.jerseyNumber?.trim() || null,
      lastName: player.lastName.trim(),
      leagueId,
      preferredName: player.preferredName?.trim() || null,
      teamId,
      timezone: player.timezone,
    }));

    const insertedPlayers = await tx
      .insert(players)
      .values(normalizedPlayers)
      .returning({
        id: players.id,
        firstName: players.firstName,
        jerseyNumber: players.jerseyNumber,
        lastName: players.lastName,
        preferredName: players.preferredName,
        timezone: players.timezone,
      });

    await tx.insert(auditLogs).values(
      insertedPlayers.map((player) => ({
        action: "player.create",
        actorUserId: userId,
        entityId: player.id,
        entityType: "player" as const,
        leagueId,
        metadata: {
          firstName: player.firstName,
          jerseyNumber: player.jerseyNumber,
          lastName: player.lastName,
          preferredName: player.preferredName,
          teamId,
          timezone: player.timezone,
        },
      })),
    );

    return { createdPlayerIds: insertedPlayers.map((player) => player.id) };
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

export async function createPlayerContact(input: CreatePlayerContactInput) {
  const {
    email,
    firstName,
    isPrimary,
    lastName,
    leagueId,
    phone,
    playerId,
    relationship,
    teamId,
    userId,
  } = input;

  return db.transaction(async (tx) => {
    const activePlayer = await tx
      .select({ id: players.id })
      .from(players)
      .where(
        and(
          eq(players.id, playerId),
          eq(players.leagueId, leagueId),
          eq(players.teamId, teamId),
          isNull(players.deletedAt),
        ),
      )
      .limit(1);

    if (!activePlayer[0]) {
      throw new Error("Player not found or already archived.");
    }

    const inserted = await tx
      .insert(playerContacts)
      .values({
        createdById: userId,
        email: email?.trim() || null,
        firstName: firstName.trim(),
        isPrimary: isPrimary ?? false,
        lastName: lastName.trim(),
        leagueId,
        phone: phone?.trim() || null,
        playerId,
        relationship: relationship?.trim() || null,
        teamId,
      })
      .returning({ id: playerContacts.id });

    await tx.insert(auditLogs).values({
      action: "player_contact.create",
      actorUserId: userId,
      entityId: inserted[0].id,
      entityType: "player_contact",
      leagueId,
      metadata: {
        email: email?.trim() || null,
        firstName: firstName.trim(),
        isPrimary: isPrimary ?? false,
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        playerId,
        relationship: relationship?.trim() || null,
        teamId,
      },
    });
  });
}

export async function archivePlayerContact(input: ArchivePlayerContactInput) {
  const { actorUserId, contactId, leagueId, playerId, teamId } = input;
  const now = new Date();

  await db.transaction(async (tx) => {
    const archived = await tx
      .update(playerContacts)
      .set({
        deletedAt: now,
        deletedById: actorUserId,
        updatedAt: now,
      })
      .where(
        and(
          eq(playerContacts.id, contactId),
          eq(playerContacts.leagueId, leagueId),
          eq(playerContacts.teamId, teamId),
          eq(playerContacts.playerId, playerId),
          isNull(playerContacts.deletedAt),
        ),
      )
      .returning({ id: playerContacts.id });

    if (!archived[0]) {
      throw new Error("Contact not found or already archived.");
    }

    await tx.insert(auditLogs).values({
      action: "player_contact.archive",
      actorUserId,
      entityId: contactId,
      entityType: "player_contact",
      leagueId,
      metadata: { playerId, teamId },
    });
  });
}

export async function getPlayerContactsByTeamId(
  leagueId: string,
  teamId: string,
): Promise<PlayerContactSummary[]> {
  return db
    .select({
      id: playerContacts.id,
      playerId: playerContacts.playerId,
      firstName: playerContacts.firstName,
      lastName: playerContacts.lastName,
      relationship: playerContacts.relationship,
      email: playerContacts.email,
      phone: playerContacts.phone,
      isPrimary: playerContacts.isPrimary,
      createdAt: playerContacts.createdAt,
    })
    .from(playerContacts)
    .where(
      and(
        eq(playerContacts.leagueId, leagueId),
        eq(playerContacts.teamId, teamId),
        isNull(playerContacts.deletedAt),
      ),
    )
    .orderBy(
      asc(playerContacts.playerId),
      desc(playerContacts.isPrimary),
      asc(playerContacts.lastName),
      asc(playerContacts.firstName),
    );
}
