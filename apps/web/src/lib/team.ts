import {
  archiveTeam,
  buildTeamSlug,
  createTeam,
  getTeamById,
  getTeamsByLeagueId,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  updateTeam,
} from "@teamsster/db";
import { z } from "zod";

import { timezoneSchema } from "@/lib/account";
import { canAccessFeature } from "@/lib/permissions";

export { buildTeamSlug };

export const createTeamSchema = z.object({
  leagueId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  timezone: timezoneSchema,
});

export const updateTeamSchema = z.object({
  teamId: z.string().uuid(),
  leagueId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  timezone: timezoneSchema,
});

export const archiveTeamSchema = z.object({
  teamId: z.string().uuid(),
  leagueId: z.string().uuid(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

async function resolveUserId(authUserId: string): Promise<string> {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }
  return userId;
}

async function assertLeagueAdmin(
  leagueId: string,
  userId: string,
): Promise<void> {
  const membership = await getUserLeagueMembership(leagueId, userId);
  if (!membership) {
    throw new Error("You are not a member of this league.");
  }
  if (!canAccessFeature("league.manage", { orgRoles: membership.roles })) {
    throw new Error(
      "You do not have permission to manage teams in this league.",
    );
  }
}

export async function createTeamForUser(
  authUserId: string,
  input: CreateTeamInput,
) {
  const parsed = createTeamSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  return createTeam({
    leagueId: parsed.leagueId,
    name: parsed.name,
    timezone: parsed.timezone,
    userId,
  });
}

export async function updateTeamForUser(
  authUserId: string,
  input: UpdateTeamInput,
) {
  const parsed = updateTeamSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await updateTeam({
    actorUserId: userId,
    leagueId: parsed.leagueId,
    name: parsed.name,
    teamId: parsed.teamId,
    timezone: parsed.timezone,
  });
}

export async function archiveTeamForUser(
  authUserId: string,
  teamId: string,
  leagueId: string,
) {
  const parsed = archiveTeamSchema.parse({ teamId, leagueId });
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await archiveTeam({
    actorUserId: userId,
    leagueId: parsed.leagueId,
    teamId: parsed.teamId,
  });
}

export async function getTeamsForLeague(
  authUserId: string,
  leagueId: string,
) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) return [];
  const membership = await getUserLeagueMembership(leagueId, userId);
  if (!membership) return [];
  return getTeamsByLeagueId(leagueId);
}

export async function getTeamDetail(
  authUserId: string,
  teamId: string,
) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) return null;
  const team = await getTeamById(teamId);
  if (!team) return null;
  const membership = await getUserLeagueMembership(team.leagueId, userId);
  if (!membership) return null;
  return team;
}
