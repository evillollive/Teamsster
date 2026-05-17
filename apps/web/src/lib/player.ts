import {
  archivePlayer,
  archivePlayerContact,
  createPlayer,
  createPlayerContact,
  getPlayerContactsByTeamId,
  getPlayersByTeamId,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  getUserTeamMembership,
  updatePlayer,
} from "@teamsster/db";
import { z } from "zod";

import { timezoneSchema } from "@/lib/account";
import { canEditRoster, canManageLeague } from "@/lib/permissions";

const playerNameSchema = z.string().trim().min(1).max(120);
const optionalTextSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => value || undefined);

export const createPlayerSchema = z.object({
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
  firstName: playerNameSchema,
  lastName: playerNameSchema,
  preferredName: optionalTextSchema,
  jerseyNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => value || undefined),
  timezone: timezoneSchema,
});

export const updatePlayerSchema = z.object({
  playerId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
  firstName: playerNameSchema,
  lastName: playerNameSchema,
  preferredName: optionalTextSchema,
  jerseyNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => value || undefined),
  timezone: timezoneSchema,
});

export const archivePlayerSchema = z.object({
  playerId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export const createPlayerContactSchema = z
  .object({
    playerId: z.string().uuid(),
    leagueId: z.string().uuid(),
    teamId: z.string().uuid(),
    firstName: playerNameSchema,
    lastName: playerNameSchema,
    relationship: optionalTextSchema,
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    phone: z
      .string()
      .trim()
      .max(32)
      .optional()
      .transform((value) => value || undefined),
    isPrimary: z.boolean().default(false),
  })
  .refine(
    (value) => Boolean(value.email?.trim()) || Boolean(value.phone?.trim()),
    {
      message: "Provide at least one contact method.",
      path: ["email"],
    },
  );

export const archivePlayerContactSchema = z.object({
  contactId: z.string().uuid(),
  playerId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type CreatePlayerContactInput = z.infer<
  typeof createPlayerContactSchema
>;

async function resolveUserId(authUserId: string): Promise<string> {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }
  return userId;
}

async function assertRosterEditor(
  leagueId: string,
  teamId: string,
  userId: string,
): Promise<void> {
  const leagueMembership = await getUserLeagueMembership(leagueId, userId);

  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  if (
    canManageLeague(
      leagueMembership.role as Parameters<typeof canManageLeague>[0],
    )
  ) {
    return;
  }

  const teamMembership = await getUserTeamMembership(teamId, userId);
  if (
    !teamMembership ||
    !canEditRoster(teamMembership.role as Parameters<typeof canEditRoster>[0])
  ) {
    throw new Error("You do not have permission to manage this roster.");
  }
}

export async function createPlayerForUser(
  authUserId: string,
  input: CreatePlayerInput,
) {
  const parsed = createPlayerSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  return createPlayer({
    firstName: parsed.firstName,
    jerseyNumber: parsed.jerseyNumber,
    lastName: parsed.lastName,
    leagueId: parsed.leagueId,
    preferredName: parsed.preferredName,
    teamId: parsed.teamId,
    timezone: parsed.timezone,
    userId,
  });
}

export async function updatePlayerForUser(
  authUserId: string,
  input: UpdatePlayerInput,
) {
  const parsed = updatePlayerSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  await updatePlayer({
    actorUserId: userId,
    firstName: parsed.firstName,
    jerseyNumber: parsed.jerseyNumber,
    lastName: parsed.lastName,
    leagueId: parsed.leagueId,
    playerId: parsed.playerId,
    preferredName: parsed.preferredName,
    teamId: parsed.teamId,
    timezone: parsed.timezone,
  });
}

export async function archivePlayerForUser(
  authUserId: string,
  playerId: string,
  leagueId: string,
  teamId: string,
) {
  const parsed = archivePlayerSchema.parse({ playerId, leagueId, teamId });
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  await archivePlayer({
    actorUserId: userId,
    leagueId: parsed.leagueId,
    playerId: parsed.playerId,
    teamId: parsed.teamId,
  });
}

export async function getPlayersForTeam(leagueId: string, teamId: string) {
  return getPlayersByTeamId(leagueId, teamId);
}

export async function createPlayerContactForUser(
  authUserId: string,
  input: CreatePlayerContactInput,
) {
  const parsed = createPlayerContactSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  await createPlayerContact({
    email: parsed.email,
    firstName: parsed.firstName,
    isPrimary: parsed.isPrimary,
    lastName: parsed.lastName,
    leagueId: parsed.leagueId,
    phone: parsed.phone,
    playerId: parsed.playerId,
    relationship: parsed.relationship,
    teamId: parsed.teamId,
    userId,
  });
}

export async function archivePlayerContactForUser(
  authUserId: string,
  contactId: string,
  playerId: string,
  leagueId: string,
  teamId: string,
) {
  const parsed = archivePlayerContactSchema.parse({
    contactId,
    leagueId,
    playerId,
    teamId,
  });
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  await archivePlayerContact({
    actorUserId: userId,
    contactId: parsed.contactId,
    leagueId: parsed.leagueId,
    playerId: parsed.playerId,
    teamId: parsed.teamId,
  });
}

export async function getPlayerContactsForTeam(
  leagueId: string,
  teamId: string,
) {
  return getPlayerContactsByTeamId(leagueId, teamId);
}
