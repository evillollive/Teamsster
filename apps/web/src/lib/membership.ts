import {
  assignLeagueMemberRole,
  assignTeamMemberRole,
  createLeagueInvitation,
  createTeamInvitation,
  getLeagueMembersByLeagueId,
  getPendingLeagueInvitationsByLeagueId,
  getPendingTeamInvitationsByTeamId,
  getTeamMembersByTeamId,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  removeLeagueMemberRole,
  removeTeamMemberRole,
  revokeLeagueInvitation,
  revokeTeamInvitation,
  roleValues,
} from "@teamsster/db";
import { z } from "zod";

import { canManageLeague } from "@/lib/permissions";

const roleSchema = z.enum(roleValues);
const memberEmailSchema = z.string().trim().email().max(320);

const baseMembershipSchema = z.object({
  email: memberEmailSchema,
  role: roleSchema,
});

export const assignLeagueRoleSchema = baseMembershipSchema.extend({
  leagueId: z.string().uuid(),
});

export const inviteLeagueMemberSchema = baseMembershipSchema.extend({
  leagueId: z.string().uuid(),
});

export const revokeLeagueInvitationSchema = z.object({
  invitationId: z.string().uuid(),
  leagueId: z.string().uuid(),
});

export const assignTeamRoleSchema = baseMembershipSchema.extend({
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export const inviteTeamMemberSchema = baseMembershipSchema.extend({
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export const revokeTeamInvitationSchema = z.object({
  invitationId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export const removeLeagueRoleSchema = z.object({
  leagueId: z.string().uuid(),
  role: roleSchema,
  userId: z.string().uuid(),
});

export const removeTeamRoleSchema = z.object({
  leagueId: z.string().uuid(),
  role: roleSchema,
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
});

async function resolveUserId(authUserId: string): Promise<string> {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }
  return userId;
}

async function assertLeagueAdmin(leagueId: string, userId: string) {
  const membership = await getUserLeagueMembership(leagueId, userId);
  if (!membership) {
    throw new Error("You are not a member of this league.");
  }

  if (!canManageLeague(membership.roles)) {
    throw new Error("You do not have permission to manage members.");
  }
}

export async function assignLeagueRoleForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = assignLeagueRoleSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await assignLeagueMemberRole({
    actorUserId: userId,
    email: parsed.email,
    leagueId: parsed.leagueId,
    role: parsed.role,
  });
}

export async function inviteLeagueMemberForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = inviteLeagueMemberSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  return createLeagueInvitation({
    actorUserId: userId,
    email: parsed.email,
    leagueId: parsed.leagueId,
    role: parsed.role,
  });
}

export async function revokeLeagueInvitationForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = revokeLeagueInvitationSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await revokeLeagueInvitation({
    actorUserId: userId,
    invitationId: parsed.invitationId,
    leagueId: parsed.leagueId,
  });
}

export async function getLeagueMemberWorkspaceForUser(
  authUserId: string,
  leagueId: string,
) {
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(leagueId, userId);

  const [members, invitations] = await Promise.all([
    getLeagueMembersByLeagueId(leagueId),
    getPendingLeagueInvitationsByLeagueId(leagueId),
  ]);

  return { invitations, members };
}

export async function assignTeamRoleForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = assignTeamRoleSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await assignTeamMemberRole({
    actorUserId: userId,
    email: parsed.email,
    leagueId: parsed.leagueId,
    role: parsed.role,
    teamId: parsed.teamId,
  });
}

export async function inviteTeamMemberForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = inviteTeamMemberSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  return createTeamInvitation({
    actorUserId: userId,
    email: parsed.email,
    leagueId: parsed.leagueId,
    role: parsed.role,
    teamId: parsed.teamId,
  });
}

export async function revokeTeamInvitationForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = revokeTeamInvitationSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await revokeTeamInvitation({
    actorUserId: userId,
    invitationId: parsed.invitationId,
    leagueId: parsed.leagueId,
    teamId: parsed.teamId,
  });
}

export async function getTeamMemberWorkspaceForUser(
  authUserId: string,
  leagueId: string,
  teamId: string,
) {
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(leagueId, userId);

  const [members, invitations] = await Promise.all([
    getTeamMembersByTeamId(teamId),
    getPendingTeamInvitationsByTeamId(teamId),
  ]);

  return { invitations, members };
}

export async function removeLeagueRoleForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = removeLeagueRoleSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await removeLeagueMemberRole({
    actorUserId: userId,
    leagueId: parsed.leagueId,
    role: parsed.role,
    userId: parsed.userId,
  });
}

export async function removeTeamRoleForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = removeTeamRoleSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await removeTeamMemberRole({
    actorUserId: userId,
    leagueId: parsed.leagueId,
    role: parsed.role,
    teamId: parsed.teamId,
    userId: parsed.userId,
  });
}
