import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "./client";
import {
  auditLogs,
  normalizeRelationship,
  playerContacts,
  players,
  teams,
} from "./schema";

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

type PlayerContactRelationshipType =
  (typeof playerContacts.$inferSelect)["relationshipType"];

export type PlayerContactSummary = {
  id: string;
  playerId: string;
  firstName: string;
  lastName: string;
  relationship: string | null;
  relationshipType: PlayerContactRelationshipType;
  customRelationship: string | null;
  isEmergencyContact: boolean;
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
  relationshipType?: PlayerContactRelationshipType;
  customRelationship?: string;
  isEmergencyContact?: boolean;
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

const relationshipTypeLabels: Record<
  NonNullable<PlayerContactRelationshipType>,
  string
> = {
  parent: "Parent",
  guardian: "Guardian",
  stepparent: "Stepparent",
  grandparent: "Grandparent",
  sibling: "Sibling",
  coach: "Coach",
  other: "Other",
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

export async function getPlayerCountsByTeamIds(
  leagueId: string,
  teamIds: string[],
): Promise<Record<string, number>> {
  if (teamIds.length === 0) {
    return {};
  }

  const counts = Object.fromEntries(teamIds.map((teamId) => [teamId, 0]));
  const rows = await db
    .select({
      teamId: players.teamId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(players)
    .where(
      and(
        eq(players.leagueId, leagueId),
        inArray(players.teamId, teamIds),
        isNull(players.deletedAt),
      ),
    )
    .groupBy(players.teamId);

  for (const row of rows) {
    if (row.teamId) {
      counts[row.teamId] = row.count;
    }
  }

  return counts;
}

export async function createPlayerContact(input: CreatePlayerContactInput) {
  const {
    customRelationship,
    email,
    firstName,
    isEmergencyContact,
    isPrimary,
    lastName,
    leagueId,
    phone,
    playerId,
    relationship,
    relationshipType,
    teamId,
    userId,
  } = input;
  const normalizedStructuredRelationship = relationshipType
    ? {
        customRelationship:
          relationshipType === "other"
            ? customRelationship?.trim() || null
            : null,
        relationshipType,
      }
    : normalizeRelationship(relationship);
  const normalizedRelationship =
    relationship?.trim() ||
    normalizedStructuredRelationship.customRelationship ||
    relationshipTypeLabels[normalizedStructuredRelationship.relationshipType] ||
    null;

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
        customRelationship: normalizedStructuredRelationship.customRelationship,
        email: email?.trim() || null,
        firstName: firstName.trim(),
        isEmergencyContact: isEmergencyContact ?? false,
        isPrimary: isPrimary ?? false,
        lastName: lastName.trim(),
        leagueId,
        phone: phone?.trim() || null,
        playerId,
        relationship: normalizedRelationship,
        relationshipType: normalizedStructuredRelationship.relationshipType,
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
        customRelationship: normalizedStructuredRelationship.customRelationship,
        email: email?.trim() || null,
        firstName: firstName.trim(),
        isEmergencyContact: isEmergencyContact ?? false,
        isPrimary: isPrimary ?? false,
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        playerId,
        relationship: normalizedRelationship,
        relationshipType: normalizedStructuredRelationship.relationshipType,
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
      relationshipType: playerContacts.relationshipType,
      customRelationship: playerContacts.customRelationship,
      isEmergencyContact: playerContacts.isEmergencyContact,
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
