import {
  assignLeagueMemberRole,
  assignTeamMemberRole,
  assignTeamRoleTemplate,
  createLeagueInvitation,
  createTeamInvitation,
  deleteLeagueRoleTemplate,
  getLeagueMembersByLeagueId,
  getLeagueRoleTemplatesByLeagueId,
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
  upsertLeagueRoleTemplate,
} from "@teamsster/db";
import { z } from "zod";

import { canAccessFeature } from "@/lib/permissions";

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

const roleTemplateSchema = z.object({
  label: z.string().trim().min(2).max(80),
  roles: z.array(roleSchema).min(1).max(roleValues.length),
});

export const upsertLeagueRoleTemplateSchema = roleTemplateSchema.extend({
  leagueId: z.string().uuid(),
});

export const deleteLeagueRoleTemplateSchema = z.object({
  leagueId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export const assignTeamRoleTemplateSchema = z.object({
  email: memberEmailSchema,
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
  templateId: z.string().uuid(),
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

  if (!canAccessFeature("membership.manage", { orgRoles: membership.roles })) {
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

  const [members, invitations, roleTemplates] = await Promise.all([
    getLeagueMembersByLeagueId(leagueId),
    getPendingLeagueInvitationsByLeagueId(leagueId),
    getLeagueRoleTemplatesByLeagueId(leagueId),
  ]);

  return { invitations, members, roleTemplates };
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

  const [members, invitations, roleTemplates] = await Promise.all([
    getTeamMembersByTeamId(teamId),
    getPendingTeamInvitationsByTeamId(teamId),
    getLeagueRoleTemplatesByLeagueId(leagueId),
  ]);

  return { invitations, members, roleTemplates };
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

export async function upsertLeagueRoleTemplateForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = upsertLeagueRoleTemplateSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await upsertLeagueRoleTemplate({
    actorUserId: userId,
    label: parsed.label,
    leagueId: parsed.leagueId,
    roles: parsed.roles,
  });
}

export async function deleteLeagueRoleTemplateForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = deleteLeagueRoleTemplateSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await deleteLeagueRoleTemplate({
    actorUserId: userId,
    leagueId: parsed.leagueId,
    templateId: parsed.templateId,
  });
}

export async function assignTeamRoleTemplateForUser(
  authUserId: string,
  input: unknown,
) {
  const parsed = assignTeamRoleTemplateSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertLeagueAdmin(parsed.leagueId, userId);
  await assignTeamRoleTemplate({
    actorUserId: userId,
    email: parsed.email,
    leagueId: parsed.leagueId,
    teamId: parsed.teamId,
    templateId: parsed.templateId,
  });
}
