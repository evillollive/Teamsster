import {
  archiveTeamEvent,
  createTeamEvent,
  eventRecurrenceFrequencyValues,
  eventTypeValues,
  getTeamEventsByLeagueId,
  getTeamEventsByTeamId,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  getUserTeamMembership,
  updateTeamEvent,
} from "@teamsster/db";
import { z } from "zod";

import { timezoneSchema } from "@/lib/account";
import { canAccessFeature } from "@/lib/permissions";

const recurrenceFrequencySchema = z.enum(eventRecurrenceFrequencyValues);
const eventTypeSchema = z.enum(eventTypeValues);
const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

const baseTeamEventSchema = z
  .object({
    leagueId: z.string().uuid(),
    teamId: z.string().uuid(),
    eventType: eventTypeSchema.default("GENERAL"),
    title: z.string().trim().min(1).max(140),
    description: optionalTextSchema(1200),
    location: optionalTextSchema(200),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    timezone: timezoneSchema,
    recurrenceFrequency: recurrenceFrequencySchema.default("NONE"),
    recurrenceInterval: z.coerce.number().int().min(1).max(30).default(1),
    recurrenceUntil: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: "Event end time must be after start time.",
    path: ["endsAt"],
  })
  .refine(
    (value) =>
      value.recurrenceFrequency === "NONE" ||
      !value.recurrenceUntil ||
      new Date(value.recurrenceUntil) >= value.startsAt,
    {
      message: "Recurrence end date must be on or after the event start.",
      path: ["recurrenceUntil"],
    },
  );

export const createTeamEventSchema = baseTeamEventSchema;

export const updateTeamEventSchema = baseTeamEventSchema.extend({
  eventId: z.string().uuid(),
});

export const archiveTeamEventSchema = z.object({
  eventId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export type CreateTeamEventInput = z.infer<typeof createTeamEventSchema>;
export type UpdateTeamEventInput = z.infer<typeof updateTeamEventSchema>;

function toRecurrenceRule(
  input: Pick<
    CreateTeamEventInput,
    "recurrenceFrequency" | "recurrenceInterval" | "recurrenceUntil"
  >,
) {
  return {
    frequency: input.recurrenceFrequency,
    interval: input.recurrenceInterval,
    until: input.recurrenceUntil,
  };
}

async function resolveUserId(authUserId: string): Promise<string> {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }
  return userId;
}

async function assertEventEditor(
  leagueId: string,
  teamId: string,
  userId: string,
): Promise<void> {
  const leagueMembership = await getUserLeagueMembership(leagueId, userId);
  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  if (canAccessFeature("event.manage", { orgRoles: leagueMembership.roles })) {
    return;
  }

  const teamMembership = await getUserTeamMembership(teamId, userId);
  if (
    !teamMembership ||
    !canAccessFeature("event.manage", {
      orgRoles: leagueMembership.roles,
      teamRoles: teamMembership.roles,
    })
  ) {
    throw new Error(
      "You do not have permission to manage events for this team.",
    );
  }
}

async function assertEventViewer(
  leagueId: string,
  teamId: string,
  userId: string,
): Promise<void> {
  const leagueMembership = await getUserLeagueMembership(leagueId, userId);
  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  if (canAccessFeature("event.rsvp", { orgRoles: leagueMembership.roles })) {
    return;
  }

  const teamMembership = await getUserTeamMembership(teamId, userId);
  if (
    !teamMembership ||
    !canAccessFeature("event.rsvp", {
      orgRoles: leagueMembership.roles,
      teamRoles: teamMembership.roles,
    })
  ) {
    throw new Error("You do not have permission to view events for this team.");
  }
}

export async function createTeamEventForUser(
  authUserId: string,
  input: CreateTeamEventInput,
) {
  const parsed = createTeamEventSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertEventEditor(parsed.leagueId, parsed.teamId, userId);
  return createTeamEvent({
    description: parsed.description,
    endsAt: parsed.endsAt,
    eventType: parsed.eventType,
    leagueId: parsed.leagueId,
    location: parsed.location,
    recurrenceRule: toRecurrenceRule(parsed),
    startsAt: parsed.startsAt,
    teamId: parsed.teamId,
    timezone: parsed.timezone,
    title: parsed.title,
    userId,
  });
}

export async function updateTeamEventForUser(
  authUserId: string,
  input: UpdateTeamEventInput,
) {
  const parsed = updateTeamEventSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertEventEditor(parsed.leagueId, parsed.teamId, userId);
  await updateTeamEvent({
    actorUserId: userId,
    description: parsed.description,
    endsAt: parsed.endsAt,
    eventId: parsed.eventId,
    eventType: parsed.eventType,
    leagueId: parsed.leagueId,
    location: parsed.location,
    recurrenceRule: toRecurrenceRule(parsed),
    startsAt: parsed.startsAt,
    teamId: parsed.teamId,
    timezone: parsed.timezone,
    title: parsed.title,
  });
}

export async function archiveTeamEventForUser(
  authUserId: string,
  eventId: string,
  leagueId: string,
  teamId: string,
) {
  const parsed = archiveTeamEventSchema.parse({ eventId, leagueId, teamId });
  const userId = await resolveUserId(authUserId);
  await assertEventEditor(parsed.leagueId, parsed.teamId, userId);
  await archiveTeamEvent({
    actorUserId: userId,
    eventId: parsed.eventId,
    leagueId: parsed.leagueId,
    teamId: parsed.teamId,
  });
}

export async function getTeamEventsForTeamAsUser(
  authUserId: string,
  leagueId: string,
  teamId: string,
) {
  const userId = await resolveUserId(authUserId);
  await assertEventEditor(leagueId, teamId, userId);
  return getTeamEventsByTeamId(leagueId, teamId);
}

export async function getTeamEventsForTeamAsViewer(
  authUserId: string,
  leagueId: string,
  teamId: string,
) {
  const userId = await resolveUserId(authUserId);
  await assertEventViewer(leagueId, teamId, userId);
  return getTeamEventsByTeamId(leagueId, teamId);
}

export async function getLeagueEventsForLeagueAsViewer(
  authUserId: string,
  leagueId: string,
) {
  const userId = await resolveUserId(authUserId);
  const leagueMembership = await getUserLeagueMembership(leagueId, userId);
  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  const leagueEvents = await getTeamEventsByLeagueId(leagueId);
  if (leagueEvents.length === 0) {
    return [];
  }

  if (canAccessFeature("event.rsvp", { orgRoles: leagueMembership.roles })) {
    return leagueEvents;
  }

  const teamRoleCache = new Map<
    string,
    Promise<Parameters<typeof canAccessFeature>[1]["teamRoles"] | null>
  >();
  const filtered = await Promise.all(
    leagueEvents.map(async (event) => {
      if (!teamRoleCache.has(event.teamId)) {
        teamRoleCache.set(
          event.teamId,
          getUserTeamMembership(event.teamId, userId).then(
            (membership) => membership?.roles ?? null,
          ),
        );
      }

      const teamRolesPromise = teamRoleCache.get(event.teamId);
      if (!teamRolesPromise) {
        return null;
      }
      const teamRoles = await teamRolesPromise;
      if (
        teamRoles &&
        canAccessFeature("event.rsvp", {
          orgRoles: leagueMembership.roles,
          teamRoles,
        })
      ) {
        return event;
      }
      return null;
    }),
  );

  return filtered.filter((event): event is (typeof leagueEvents)[number] =>
    Boolean(event),
  );
}
