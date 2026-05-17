import {
  archiveLeague,
  buildLeagueSlug,
  createLeague,
  getAuditLogsForLeague,
  getLeagueById,
  getLeaguesByUserId,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  updateLeague,
} from "@teamsster/db";
import { z } from "zod";
import { timezoneSchema } from "@/lib/account";
import { canManageLeague, canViewAuditLog } from "@/lib/permissions";

export { buildLeagueSlug };

export const createLeagueSchema = z.object({
  name: z.string().trim().min(1).max(120),
  timezone: timezoneSchema,
});

export const updateLeagueSchema = z.object({
  leagueId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  timezone: timezoneSchema,
});

export const archiveLeagueSchema = z.object({
  leagueId: z.string().uuid(),
});

export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;
export type UpdateLeagueInput = z.infer<typeof updateLeagueSchema>;

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
  if (!canManageLeague(membership.roles)) {
    throw new Error("You do not have permission to manage this league.");
  }
}

export async function createLeagueForUser(
  authUserId: string,
  input: CreateLeagueInput,
) {
  const parsed = createLeagueSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  return createLeague({ name: parsed.name, timezone: parsed.timezone, userId });
}

export async function updateLeagueForUser(
  authUserId: string,
  input: UpdateLeagueInput,
) {
  const parsed = updateLeagueSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await updateLeague({
    actorUserId: userId,
    leagueId: parsed.leagueId,
    name: parsed.name,
    timezone: parsed.timezone,
  });
}

export async function archiveLeagueForUser(
  authUserId: string,
  leagueId: string,
) {
  const parsed = archiveLeagueSchema.parse({ leagueId });
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await archiveLeague({ actorUserId: userId, leagueId: parsed.leagueId });
}

export async function getLeaguesForUser(authUserId: string) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) return [];
  return getLeaguesByUserId(userId);
}

export async function getLeagueDetail(leagueId: string) {
  return getLeagueById(leagueId);
}

export async function getAuditLogForLeague(
  authUserId: string,
  leagueId: string,
) {
  const userId = await resolveUserId(authUserId);
  const membership = await getUserLeagueMembership(leagueId, userId);
  if (!membership || !canViewAuditLog(membership.roles)) {
    throw new Error(
      "You do not have permission to view the audit log for this league.",
    );
  }
  return getAuditLogsForLeague(leagueId);
}
