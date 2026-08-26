import {
  deleteEventRsvp,
  eventRsvpStatusValues,
  getEventRsvpDataByEventIds,
  getEventRsvpSummary,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  getUserRsvpForEvent,
  getUserTeamMembership,
  upsertEventRsvp,
} from "@teamsster/db";
import { z } from "zod";

import { canAccessFeature } from "@/lib/permissions";

export const rsvpStatusSchema = z.enum(eventRsvpStatusValues);

export const upsertEventRsvpSchema = z.object({
  eventId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
  status: rsvpStatusSchema,
  note: z
    .string()
    .trim()
    .max(280)
    .optional()
    .transform((v) => v || undefined),
});

export const deleteEventRsvpSchema = z.object({
  eventId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export type UpsertEventRsvpInput = z.infer<typeof upsertEventRsvpSchema>;

async function resolveUserId(authUserId: string): Promise<string> {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }
  return userId;
}

async function assertRsvpAccess(
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
    throw new Error("You do not have permission to RSVP to this event.");
  }
}

export async function upsertEventRsvpForUser(
  authUserId: string,
  input: UpsertEventRsvpInput,
) {
  const parsed = upsertEventRsvpSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertRsvpAccess(parsed.leagueId, parsed.teamId, userId);
  await upsertEventRsvp({
    eventId: parsed.eventId,
    leagueId: parsed.leagueId,
    note: parsed.note,
    status: parsed.status,
    teamId: parsed.teamId,
    userId,
  });
}

export async function deleteEventRsvpForUser(
  authUserId: string,
  eventId: string,
  leagueId: string,
  teamId: string,
) {
  const parsed = deleteEventRsvpSchema.parse({ eventId, leagueId, teamId });
  const userId = await resolveUserId(authUserId);
  await assertRsvpAccess(parsed.leagueId, parsed.teamId, userId);
  await deleteEventRsvp({ eventId: parsed.eventId, userId });
}

export async function getEventRsvpSummaryForUser(
  authUserId: string,
  eventId: string,
  leagueId: string,
  teamId: string,
) {
  const userId = await resolveUserId(authUserId);
  await assertRsvpAccess(leagueId, teamId, userId);
  const [summary, userRsvp] = await Promise.all([
    getEventRsvpSummary(eventId),
    getUserRsvpForEvent(eventId, userId),
  ]);
  return { summary, userRsvp };
}

export async function getEventRsvpDataForUser(
  authUserId: string,
  eventIds: string[],
  leagueId: string,
  teamId: string,
) {
  if (eventIds.length === 0) {
    return {};
  }

  const userId = await resolveUserId(authUserId);
  await assertRsvpAccess(leagueId, teamId, userId);
  return getEventRsvpDataByEventIds(eventIds, userId);
}
