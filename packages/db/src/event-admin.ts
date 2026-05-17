import { and, asc, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import {
  auditLogs,
  type EventRecurrenceRule,
  teamEvents,
  teams,
} from "./schema";

type EventType = (typeof teamEvents.$inferSelect)["eventType"];

export type TeamEventSummary = {
  id: string;
  eventType: EventType;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  recurrenceRule: EventRecurrenceRule;
  createdAt: Date;
};

type CreateTeamEventInput = {
  leagueId: string;
  teamId: string;
  eventType: EventType;
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  recurrenceRule: EventRecurrenceRule;
  userId: string;
};

type UpdateTeamEventInput = {
  eventId: string;
  leagueId: string;
  teamId: string;
  eventType: EventType;
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  recurrenceRule: EventRecurrenceRule;
  actorUserId: string;
};

type ArchiveTeamEventInput = {
  eventId: string;
  leagueId: string;
  teamId: string;
  actorUserId: string;
};

function normalizeRecurrenceRule(
  input: EventRecurrenceRule,
): EventRecurrenceRule {
  return {
    count: input.count,
    frequency: input.frequency,
    interval: Math.max(1, Math.floor(input.interval || 1)),
    until: input.until,
  };
}

export async function createTeamEvent(input: CreateTeamEventInput) {
  const {
    description,
    endsAt,
    eventType,
    leagueId,
    location,
    recurrenceRule,
    startsAt,
    teamId,
    timezone,
    title,
    userId,
  } = input;

  if (endsAt <= startsAt) {
    throw new Error("Event end time must be after start time.");
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

    const normalizedRecurrence = normalizeRecurrenceRule(recurrenceRule);
    const eventId = (
      await tx
        .insert(teamEvents)
        .values({
          createdById: userId,
          description: description?.trim() || null,
          endsAt,
          eventType,
          leagueId,
          location: location?.trim() || null,
          recurrenceRule: normalizedRecurrence,
          startsAt,
          teamId,
          timezone,
          title: title.trim(),
        })
        .returning({ id: teamEvents.id })
    )[0].id;

    await tx.insert(auditLogs).values({
      action: "team_event.create",
      actorUserId: userId,
      entityId: eventId,
      entityType: "team_event",
      leagueId,
      metadata: {
        description: description?.trim() || null,
        endsAt: endsAt.toISOString(),
        eventType,
        location: location?.trim() || null,
        recurrenceRule: normalizedRecurrence,
        startsAt: startsAt.toISOString(),
        teamId,
        timezone,
        title: title.trim(),
      },
    });

    return { eventId };
  });
}

export async function updateTeamEvent(input: UpdateTeamEventInput) {
  const {
    actorUserId,
    description,
    endsAt,
    eventId,
    eventType,
    leagueId,
    location,
    recurrenceRule,
    startsAt,
    teamId,
    timezone,
    title,
  } = input;

  if (endsAt <= startsAt) {
    throw new Error("Event end time must be after start time.");
  }

  await db.transaction(async (tx) => {
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

    const normalizedRecurrence = normalizeRecurrenceRule(recurrenceRule);
    const updated = await tx
      .update(teamEvents)
      .set({
        description: description?.trim() || null,
        endsAt,
        eventType,
        location: location?.trim() || null,
        recurrenceRule: normalizedRecurrence,
        startsAt,
        timezone,
        title: title.trim(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teamEvents.id, eventId),
          eq(teamEvents.leagueId, leagueId),
          eq(teamEvents.teamId, teamId),
          isNull(teamEvents.deletedAt),
        ),
      )
      .returning({ id: teamEvents.id });

    if (!updated[0]) {
      throw new Error("Event not found or already archived.");
    }

    await tx.insert(auditLogs).values({
      action: "team_event.update",
      actorUserId,
      entityId: eventId,
      entityType: "team_event",
      leagueId,
      metadata: {
        description: description?.trim() || null,
        endsAt: endsAt.toISOString(),
        eventType,
        location: location?.trim() || null,
        recurrenceRule: normalizedRecurrence,
        startsAt: startsAt.toISOString(),
        teamId,
        timezone,
        title: title.trim(),
      },
    });
  });
}

export async function archiveTeamEvent(input: ArchiveTeamEventInput) {
  const { actorUserId, eventId, leagueId, teamId } = input;
  const now = new Date();

  await db.transaction(async (tx) => {
    const archived = await tx
      .update(teamEvents)
      .set({ deletedAt: now, deletedById: actorUserId, updatedAt: now })
      .where(
        and(
          eq(teamEvents.id, eventId),
          eq(teamEvents.leagueId, leagueId),
          eq(teamEvents.teamId, teamId),
          isNull(teamEvents.deletedAt),
        ),
      )
      .returning({ id: teamEvents.id });

    if (!archived[0]) {
      throw new Error("Event not found or already archived.");
    }

    await tx.insert(auditLogs).values({
      action: "team_event.archive",
      actorUserId,
      entityId: eventId,
      entityType: "team_event",
      leagueId,
      metadata: { teamId },
    });
  });
}

export async function getTeamEventsByTeamId(
  leagueId: string,
  teamId: string,
): Promise<TeamEventSummary[]> {
  return db
    .select({
      id: teamEvents.id,
      eventType: teamEvents.eventType,
      title: teamEvents.title,
      description: teamEvents.description,
      location: teamEvents.location,
      startsAt: teamEvents.startsAt,
      endsAt: teamEvents.endsAt,
      timezone: teamEvents.timezone,
      recurrenceRule: teamEvents.recurrenceRule,
      createdAt: teamEvents.createdAt,
    })
    .from(teamEvents)
    .where(
      and(
        eq(teamEvents.leagueId, leagueId),
        eq(teamEvents.teamId, teamId),
        isNull(teamEvents.deletedAt),
      ),
    )
    .orderBy(asc(teamEvents.startsAt), asc(teamEvents.createdAt));
}
