import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import { auditLogs, playerContacts, players, teams } from "./schema";

type PlayerEligibilityStatus =
  (typeof players.$inferSelect)["eligibilityStatus"];
type PlayerProfileMetadata = (typeof players.$inferSelect)["profileMetadata"];

export type PlayerSummary = {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  jerseyNumber: string | null;
  eligibilityStatus: PlayerEligibilityStatus;
  eligibilityNotes: string | null;
  profileMetadata: PlayerProfileMetadata;
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
  eligibilityStatus: PlayerEligibilityStatus;
  eligibilityNotes?: string;
  profileMetadata?: PlayerProfileMetadata;
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
    eligibilityStatus: PlayerEligibilityStatus;
    eligibilityNotes?: string;
    profileMetadata?: PlayerProfileMetadata;
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
  eligibilityStatus: PlayerEligibilityStatus;
  eligibilityNotes?: string;
  profileMetadata?: PlayerProfileMetadata;
  timezone: string;
  actorUserId: string;
};

type ArchivePlayerInput = {
  playerId: string;
  leagueId: string;
  teamId: string;
  actorUserId: string;
};

function normalizePlayerProfileMetadata(input?: PlayerProfileMetadata) {
  return {
    notes: input?.notes?.trim() || undefined,
    primaryPosition: input?.primaryPosition?.trim() || undefined,
    pronouns: input?.pronouns?.trim() || undefined,
  } as PlayerProfileMetadata;
}

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
    eligibilityNotes,
    eligibilityStatus,
    jerseyNumber,
    lastName,
    leagueId,
    profileMetadata,
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
    const normalizedProfileMetadata =
      normalizePlayerProfileMetadata(profileMetadata);

    const playerId = (
      await tx
        .insert(players)
        .values({
          eligibilityNotes: eligibilityNotes?.trim() || null,
          eligibilityStatus,
          createdById: userId,
          firstName: firstName.trim(),
          jerseyNumber: jerseyNumber?.trim() || null,
          lastName: lastName.trim(),
          leagueId,
          profileMetadata: normalizedProfileMetadata,
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
        eligibilityNotes: eligibilityNotes?.trim() || null,
        eligibilityStatus,
        firstName: firstName.trim(),
        jerseyNumber: jerseyNumber?.trim() || null,
        lastName: lastName.trim(),
        profileMetadata: normalizedProfileMetadata,
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
      eligibilityNotes: player.eligibilityNotes?.trim() || null,
      eligibilityStatus: player.eligibilityStatus,
      createdById: userId,
      firstName: player.firstName.trim(),
      jerseyNumber: player.jerseyNumber?.trim() || null,
      lastName: player.lastName.trim(),
      leagueId,
      profileMetadata: normalizePlayerProfileMetadata(player.profileMetadata),
      preferredName: player.preferredName?.trim() || null,
      teamId,
      timezone: player.timezone,
    }));

    const insertedPlayers = await tx
      .insert(players)
      .values(normalizedPlayers)
      .returning({
        id: players.id,
        eligibilityNotes: players.eligibilityNotes,
        eligibilityStatus: players.eligibilityStatus,
        firstName: players.firstName,
        jerseyNumber: players.jerseyNumber,
        lastName: players.lastName,
        profileMetadata: players.profileMetadata,
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
          eligibilityNotes: player.eligibilityNotes,
          eligibilityStatus: player.eligibilityStatus,
          firstName: player.firstName,
          jerseyNumber: player.jerseyNumber,
          lastName: player.lastName,
          profileMetadata: player.profileMetadata,
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
    eligibilityNotes,
    eligibilityStatus,
    firstName,
    jerseyNumber,
    lastName,
    leagueId,
    playerId,
    profileMetadata,
    preferredName,
    teamId,
    timezone,
  } = input;
  const normalizedProfileMetadata =
    normalizePlayerProfileMetadata(profileMetadata);

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(players)
      .set({
        eligibilityNotes: eligibilityNotes?.trim() || null,
        eligibilityStatus,
        firstName: firstName.trim(),
        jerseyNumber: jerseyNumber?.trim() || null,
        lastName: lastName.trim(),
        profileMetadata: normalizedProfileMetadata,
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
        eligibilityNotes: eligibilityNotes?.trim() || null,
        eligibilityStatus,
        firstName: firstName.trim(),
        jerseyNumber: jerseyNumber?.trim() || null,
        lastName: lastName.trim(),
        profileMetadata: normalizedProfileMetadata,
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
      eligibilityNotes: players.eligibilityNotes,
      eligibilityStatus: players.eligibilityStatus,
      firstName: players.firstName,
      lastName: players.lastName,
      profileMetadata: players.profileMetadata,
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
