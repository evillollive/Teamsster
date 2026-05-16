import { randomUUID } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "./client";
import {
  auditLogs,
  leagueInvitations,
  leagueMembers,
  type roleValues,
  teamInvitations,
  teamMembers,
  users,
} from "./schema";

type MembershipRole = (typeof roleValues)[number];

type AssignLeagueRoleInput = {
  leagueId: string;
  email: string;
  role: MembershipRole;
  actorUserId: string;
};

type AssignTeamRoleInput = {
  teamId: string;
  leagueId: string;
  email: string;
  role: MembershipRole;
  actorUserId: string;
};

type CreateLeagueInvitationInput = {
  leagueId: string;
  email: string;
  role: MembershipRole;
  actorUserId: string;
};

type CreateTeamInvitationInput = {
  teamId: string;
  leagueId: string;
  email: string;
  role: MembershipRole;
  actorUserId: string;
};

type RevokeLeagueInvitationInput = {
  invitationId: string;
  leagueId: string;
  actorUserId: string;
};

type RevokeTeamInvitationInput = {
  invitationId: string;
  teamId: string;
  leagueId: string;
  actorUserId: string;
};

const INVITATION_EXPIRY_DAYS = 14;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildInvitationToken() {
  return `invite_${randomUUID().replaceAll("-", "")}`;
}

function buildExpiryDate() {
  return new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export async function assignLeagueMemberRole(input: AssignLeagueRoleInput) {
  const email = normalizeEmail(input.email);

  return db.transaction(async (tx) => {
    const userRows = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);
    const userId = userRows[0]?.id ?? null;
    if (!userId) {
      throw new Error(
        "No active account exists for that email. Send an invitation instead.",
      );
    }

    await tx
      .insert(leagueMembers)
      .values({
        leagueId: input.leagueId,
        role: input.role,
        userId,
      })
      .onConflictDoUpdate({
        set: {
          deletedAt: null,
          deletedById: null,
          role: input.role,
          updatedAt: new Date(),
        },
        target: [leagueMembers.leagueId, leagueMembers.userId],
      });

    await tx.insert(auditLogs).values({
      action: "league.member.role.assign",
      actorUserId: input.actorUserId,
      entityId: input.leagueId,
      entityType: "league",
      leagueId: input.leagueId,
      metadata: { email, role: input.role },
    });
  });
}

export async function assignTeamMemberRole(input: AssignTeamRoleInput) {
  const email = normalizeEmail(input.email);

  return db.transaction(async (tx) => {
    const userRows = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);
    const userId = userRows[0]?.id ?? null;
    if (!userId) {
      throw new Error(
        "No active account exists for that email. Send an invitation instead.",
      );
    }

    await tx
      .insert(teamMembers)
      .values({
        role: input.role,
        teamId: input.teamId,
        userId,
      })
      .onConflictDoUpdate({
        set: {
          deletedAt: null,
          deletedById: null,
          role: input.role,
          updatedAt: new Date(),
        },
        target: [teamMembers.teamId, teamMembers.userId],
      });

    await tx.insert(auditLogs).values({
      action: "team.member.role.assign",
      actorUserId: input.actorUserId,
      entityId: input.teamId,
      entityType: "team",
      leagueId: input.leagueId,
      metadata: { email, role: input.role },
    });
  });
}

export async function createLeagueInvitation(
  input: CreateLeagueInvitationInput,
) {
  const email = normalizeEmail(input.email);
  const invitation = (
    await db
      .insert(leagueInvitations)
      .values({
        email,
        expiresAt: buildExpiryDate(),
        invitedById: input.actorUserId,
        leagueId: input.leagueId,
        role: input.role,
        token: buildInvitationToken(),
      })
      .returning({
        email: leagueInvitations.email,
        expiresAt: leagueInvitations.expiresAt,
        id: leagueInvitations.id,
        role: leagueInvitations.role,
        token: leagueInvitations.token,
      })
  )[0];

  await db.insert(auditLogs).values({
    action: "league.member.invite",
    actorUserId: input.actorUserId,
    entityId: input.leagueId,
    entityType: "league",
    leagueId: input.leagueId,
    metadata: { email, role: input.role, token: invitation.token },
  });

  return invitation;
}

export async function createTeamInvitation(input: CreateTeamInvitationInput) {
  const email = normalizeEmail(input.email);
  const invitation = (
    await db
      .insert(teamInvitations)
      .values({
        email,
        expiresAt: buildExpiryDate(),
        invitedById: input.actorUserId,
        role: input.role,
        teamId: input.teamId,
        token: buildInvitationToken(),
      })
      .returning({
        email: teamInvitations.email,
        expiresAt: teamInvitations.expiresAt,
        id: teamInvitations.id,
        role: teamInvitations.role,
        token: teamInvitations.token,
      })
  )[0];

  await db.insert(auditLogs).values({
    action: "team.member.invite",
    actorUserId: input.actorUserId,
    entityId: input.teamId,
    entityType: "team",
    leagueId: input.leagueId,
    metadata: { email, role: input.role, token: invitation.token },
  });

  return invitation;
}

export async function revokeLeagueInvitation(
  input: RevokeLeagueInvitationInput,
) {
  const now = new Date();
  const revoked = await db
    .update(leagueInvitations)
    .set({
      revokedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(leagueInvitations.id, input.invitationId),
        eq(leagueInvitations.leagueId, input.leagueId),
        isNull(leagueInvitations.acceptedAt),
        isNull(leagueInvitations.revokedAt),
      ),
    )
    .returning({
      email: leagueInvitations.email,
      role: leagueInvitations.role,
    });

  if (!revoked[0]) {
    throw new Error("Invitation not found or already inactive.");
  }

  await db.insert(auditLogs).values({
    action: "league.member.invite.revoke",
    actorUserId: input.actorUserId,
    entityId: input.invitationId,
    entityType: "league_invitation",
    leagueId: input.leagueId,
    metadata: { email: revoked[0].email, role: revoked[0].role },
  });
}

export async function revokeTeamInvitation(input: RevokeTeamInvitationInput) {
  const now = new Date();
  const revoked = await db
    .update(teamInvitations)
    .set({
      revokedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(teamInvitations.id, input.invitationId),
        eq(teamInvitations.teamId, input.teamId),
        isNull(teamInvitations.acceptedAt),
        isNull(teamInvitations.revokedAt),
      ),
    )
    .returning({
      email: teamInvitations.email,
      role: teamInvitations.role,
    });

  if (!revoked[0]) {
    throw new Error("Invitation not found or already inactive.");
  }

  await db.insert(auditLogs).values({
    action: "team.member.invite.revoke",
    actorUserId: input.actorUserId,
    entityId: input.invitationId,
    entityType: "team_invitation",
    leagueId: input.leagueId,
    metadata: { email: revoked[0].email, role: revoked[0].role },
  });
}

export async function getLeagueMembersByLeagueId(leagueId: string) {
  return db
    .select({
      email: users.email,
      role: leagueMembers.role,
      userId: users.id,
    })
    .from(leagueMembers)
    .innerJoin(users, eq(leagueMembers.userId, users.id))
    .where(
      and(
        eq(leagueMembers.leagueId, leagueId),
        isNull(leagueMembers.deletedAt),
        isNull(users.deletedAt),
      ),
    );
}

export async function getTeamMembersByTeamId(teamId: string) {
  return db
    .select({
      email: users.email,
      role: teamMembers.role,
      userId: users.id,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        isNull(teamMembers.deletedAt),
        isNull(users.deletedAt),
      ),
    );
}

export async function getPendingLeagueInvitationsByLeagueId(leagueId: string) {
  return db
    .select({
      email: leagueInvitations.email,
      expiresAt: leagueInvitations.expiresAt,
      id: leagueInvitations.id,
      role: leagueInvitations.role,
    })
    .from(leagueInvitations)
    .where(
      and(
        eq(leagueInvitations.leagueId, leagueId),
        isNull(leagueInvitations.acceptedAt),
        isNull(leagueInvitations.revokedAt),
        gt(leagueInvitations.expiresAt, new Date()),
      ),
    );
}

export async function getPendingTeamInvitationsByTeamId(teamId: string) {
  return db
    .select({
      email: teamInvitations.email,
      expiresAt: teamInvitations.expiresAt,
      id: teamInvitations.id,
      role: teamInvitations.role,
    })
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.teamId, teamId),
        isNull(teamInvitations.acceptedAt),
        isNull(teamInvitations.revokedAt),
        gt(teamInvitations.expiresAt, new Date()),
      ),
    );
}
