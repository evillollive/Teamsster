import { randomUUID } from "node:crypto";

import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { db } from "./client";
import {
  auditLogs,
  leagueInvitations,
  leagueMembers,
  leagueRoleTemplates,
  leagues,
  type roleValues,
  TEAM_ONLY_ROLES,
  teamInvitations,
  teamMembers,
  teams,
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

type UpsertLeagueRoleTemplateInput = {
  leagueId: string;
  label: string;
  roles: readonly MembershipRole[];
  actorUserId: string;
};

type DeleteLeagueRoleTemplateInput = {
  templateId: string;
  leagueId: string;
  actorUserId: string;
};

type AssignTeamRoleTemplateInput = {
  templateId: string;
  teamId: string;
  leagueId: string;
  email: string;
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

function normalizeRoleSet(roles: readonly MembershipRole[]): MembershipRole[] {
  return [...new Set(roles)];
}

type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

type InvitationLifecycle = {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
};

function getInvitationStatus(
  invitation: InvitationLifecycle,
): InvitationStatus {
  if (invitation.acceptedAt) {
    return "accepted";
  }
  if (invitation.revokedAt) {
    return "revoked";
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    return "expired";
  }
  return "pending";
}

function assertInvitationIsPending(status: InvitationStatus) {
  if (status === "accepted") {
    throw new Error("Invitation has already been accepted.");
  }
  if (status === "revoked") {
    throw new Error("Invitation has been revoked.");
  }
  if (status === "expired") {
    throw new Error("Invitation has expired.");
  }
}

export async function assignLeagueMemberRole(input: AssignLeagueRoleInput) {
  if (TEAM_ONLY_ROLES.has(input.role)) {
    throw new Error(
      `${input.role} is a team-only role and can't be assigned at the league level.`,
    );
  }

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
        roles: [input.role],
        userId,
      })
      .onConflictDoUpdate({
        set: {
          deletedAt: null,
          deletedById: null,
          roles: sql`CASE
            WHEN array_position(${leagueMembers.roles}, ${input.role}::membership_role) IS NULL
              THEN ${leagueMembers.roles} || ${input.role}::membership_role
            ELSE ${leagueMembers.roles}
          END`,
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
        roles: [input.role],
        teamId: input.teamId,
        userId,
      })
      .onConflictDoUpdate({
        set: {
          deletedAt: null,
          deletedById: null,
          roles: sql`CASE
            WHEN array_position(${teamMembers.roles}, ${input.role}::membership_role) IS NULL
              THEN ${teamMembers.roles} || ${input.role}::membership_role
            ELSE ${teamMembers.roles}
          END`,
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

export async function upsertLeagueRoleTemplate(
  input: UpsertLeagueRoleTemplateInput,
) {
  const label = input.label.trim();
  const roles = normalizeRoleSet(input.roles);

  const template = (
    await db
      .insert(leagueRoleTemplates)
      .values({
        label,
        leagueId: input.leagueId,
        roles,
      })
      .onConflictDoUpdate({
        set: {
          roles,
          updatedAt: new Date(),
        },
        target: [leagueRoleTemplates.leagueId, leagueRoleTemplates.label],
      })
      .returning({
        id: leagueRoleTemplates.id,
        label: leagueRoleTemplates.label,
        roles: leagueRoleTemplates.roles,
      })
  )[0];

  await db.insert(auditLogs).values({
    action: "league.role_template.upsert",
    actorUserId: input.actorUserId,
    entityId: template.id,
    entityType: "league_role_template",
    leagueId: input.leagueId,
    metadata: { label: template.label, roles: template.roles },
  });

  return template;
}

export async function deleteLeagueRoleTemplate(
  input: DeleteLeagueRoleTemplateInput,
) {
  const deleted = await db
    .delete(leagueRoleTemplates)
    .where(
      and(
        eq(leagueRoleTemplates.id, input.templateId),
        eq(leagueRoleTemplates.leagueId, input.leagueId),
      ),
    )
    .returning({
      id: leagueRoleTemplates.id,
      label: leagueRoleTemplates.label,
      roles: leagueRoleTemplates.roles,
    });

  if (!deleted[0]) {
    throw new Error("Role template not found.");
  }

  await db.insert(auditLogs).values({
    action: "league.role_template.delete",
    actorUserId: input.actorUserId,
    entityId: input.templateId,
    entityType: "league_role_template",
    leagueId: input.leagueId,
    metadata: { label: deleted[0].label, roles: deleted[0].roles },
  });
}

export async function getLeagueRoleTemplatesByLeagueId(leagueId: string) {
  return db
    .select({
      id: leagueRoleTemplates.id,
      label: leagueRoleTemplates.label,
      roles: leagueRoleTemplates.roles,
    })
    .from(leagueRoleTemplates)
    .where(eq(leagueRoleTemplates.leagueId, leagueId))
    .orderBy(leagueRoleTemplates.label);
}

export async function assignTeamRoleTemplate(
  input: AssignTeamRoleTemplateInput,
) {
  const email = normalizeEmail(input.email);

  return db.transaction(async (tx) => {
    const [template] = await tx
      .select({
        id: leagueRoleTemplates.id,
        label: leagueRoleTemplates.label,
        roles: leagueRoleTemplates.roles,
      })
      .from(leagueRoleTemplates)
      .where(
        and(
          eq(leagueRoleTemplates.id, input.templateId),
          eq(leagueRoleTemplates.leagueId, input.leagueId),
        ),
      )
      .limit(1);

    if (!template) {
      throw new Error("Role template not found.");
    }

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
        roles: template.roles,
        teamId: input.teamId,
        userId,
      })
      .onConflictDoUpdate({
        set: {
          deletedAt: null,
          deletedById: null,
          roles: sql`(
            SELECT ARRAY(
              SELECT DISTINCT role
              FROM unnest(${teamMembers.roles} || ${template.roles}::membership_role[]) AS role
            )
          )`,
          updatedAt: new Date(),
        },
        target: [teamMembers.teamId, teamMembers.userId],
      });

    await tx.insert(auditLogs).values({
      action: "team.member.role_template.assign",
      actorUserId: input.actorUserId,
      entityId: input.teamId,
      entityType: "team",
      leagueId: input.leagueId,
      metadata: {
        email,
        roles: template.roles,
        templateId: template.id,
        templateLabel: template.label,
      },
    });
  });
}

export async function getLeagueInvitationByToken(token: string) {
  const normalizedToken = token.trim();
  const rows = await db
    .select({
      acceptedAt: leagueInvitations.acceptedAt,
      email: leagueInvitations.email,
      expiresAt: leagueInvitations.expiresAt,
      id: leagueInvitations.id,
      leagueId: leagueInvitations.leagueId,
      leagueName: leagues.name,
      revokedAt: leagueInvitations.revokedAt,
      role: leagueInvitations.role,
      token: leagueInvitations.token,
    })
    .from(leagueInvitations)
    .innerJoin(leagues, eq(leagueInvitations.leagueId, leagues.id))
    .where(
      and(
        eq(leagueInvitations.token, normalizedToken),
        isNull(leagues.deletedAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getTeamInvitationByToken(token: string) {
  const normalizedToken = token.trim();
  const rows = await db
    .select({
      acceptedAt: teamInvitations.acceptedAt,
      email: teamInvitations.email,
      expiresAt: teamInvitations.expiresAt,
      id: teamInvitations.id,
      leagueId: teams.leagueId,
      leagueName: leagues.name,
      revokedAt: teamInvitations.revokedAt,
      role: teamInvitations.role,
      teamId: teamInvitations.teamId,
      teamName: teams.name,
      token: teamInvitations.token,
    })
    .from(teamInvitations)
    .innerJoin(teams, eq(teamInvitations.teamId, teams.id))
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(
      and(
        eq(teamInvitations.token, normalizedToken),
        isNull(teams.deletedAt),
        isNull(leagues.deletedAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function acceptLeagueInvitation(token: string, userId: string) {
  const normalizedToken = token.trim();

  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .select({
        acceptedAt: leagueInvitations.acceptedAt,
        email: leagueInvitations.email,
        expiresAt: leagueInvitations.expiresAt,
        id: leagueInvitations.id,
        leagueId: leagueInvitations.leagueId,
        revokedAt: leagueInvitations.revokedAt,
        role: leagueInvitations.role,
      })
      .from(leagueInvitations)
      .innerJoin(leagues, eq(leagueInvitations.leagueId, leagues.id))
      .where(
        and(
          eq(leagueInvitations.token, normalizedToken),
          isNull(leagues.deletedAt),
        ),
      )
      .limit(1);

    if (!invitation) {
      throw new Error("Invitation not found.");
    }

    assertInvitationIsPending(getInvitationStatus(invitation));

    const [user] = await tx
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new Error("User not found.");
    }
    if (normalizeEmail(user.email) !== normalizeEmail(invitation.email)) {
      throw new Error("This invitation was sent to a different email address.");
    }

    const now = new Date();
    const accepted = await tx
      .update(leagueInvitations)
      .set({
        acceptedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(leagueInvitations.id, invitation.id),
          isNull(leagueInvitations.acceptedAt),
          isNull(leagueInvitations.revokedAt),
          gt(leagueInvitations.expiresAt, now),
        ),
      )
      .returning({ id: leagueInvitations.id });

    if (!accepted[0]) {
      throw new Error("Invitation is no longer active.");
    }

    await tx
      .insert(leagueMembers)
      .values({
        leagueId: invitation.leagueId,
        roles: [invitation.role],
        userId,
      })
      .onConflictDoUpdate({
        set: {
          deletedAt: null,
          deletedById: null,
          roles: sql`CASE
            WHEN array_position(${leagueMembers.roles}, ${invitation.role}::membership_role) IS NULL
              THEN ${leagueMembers.roles} || ${invitation.role}::membership_role
            ELSE ${leagueMembers.roles}
          END`,
          updatedAt: now,
        },
        target: [leagueMembers.leagueId, leagueMembers.userId],
      });

    await tx.insert(auditLogs).values({
      action: "league.member.invite.accept",
      actorUserId: userId,
      entityId: invitation.id,
      entityType: "league_invitation",
      leagueId: invitation.leagueId,
      metadata: { email: invitation.email, role: invitation.role },
    });

    return { leagueId: invitation.leagueId, role: invitation.role };
  });
}

export async function acceptTeamInvitation(token: string, userId: string) {
  const normalizedToken = token.trim();

  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .select({
        acceptedAt: teamInvitations.acceptedAt,
        email: teamInvitations.email,
        expiresAt: teamInvitations.expiresAt,
        id: teamInvitations.id,
        leagueId: teams.leagueId,
        revokedAt: teamInvitations.revokedAt,
        role: teamInvitations.role,
        teamId: teamInvitations.teamId,
      })
      .from(teamInvitations)
      .innerJoin(teams, eq(teamInvitations.teamId, teams.id))
      .innerJoin(leagues, eq(teams.leagueId, leagues.id))
      .where(
        and(
          eq(teamInvitations.token, normalizedToken),
          isNull(teams.deletedAt),
          isNull(leagues.deletedAt),
        ),
      )
      .limit(1);

    if (!invitation) {
      throw new Error("Invitation not found.");
    }

    assertInvitationIsPending(getInvitationStatus(invitation));

    const [user] = await tx
      .select({ email: users.email })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      throw new Error("User not found.");
    }
    if (normalizeEmail(user.email) !== normalizeEmail(invitation.email)) {
      throw new Error("This invitation was sent to a different email address.");
    }

    const now = new Date();
    const accepted = await tx
      .update(teamInvitations)
      .set({
        acceptedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(teamInvitations.id, invitation.id),
          isNull(teamInvitations.acceptedAt),
          isNull(teamInvitations.revokedAt),
          gt(teamInvitations.expiresAt, now),
        ),
      )
      .returning({ id: teamInvitations.id });

    if (!accepted[0]) {
      throw new Error("Invitation is no longer active.");
    }

    await tx
      .insert(leagueMembers)
      .values({
        leagueId: invitation.leagueId,
        roles: [invitation.role],
        userId,
      })
      .onConflictDoUpdate({
        set: {
          deletedAt: null,
          deletedById: null,
          roles: sql`CASE
            WHEN array_position(${leagueMembers.roles}, ${invitation.role}::membership_role) IS NULL
              THEN ${leagueMembers.roles} || ${invitation.role}::membership_role
            ELSE ${leagueMembers.roles}
          END`,
          updatedAt: now,
        },
        target: [leagueMembers.leagueId, leagueMembers.userId],
      });

    await tx
      .insert(teamMembers)
      .values({
        roles: [invitation.role],
        teamId: invitation.teamId,
        userId,
      })
      .onConflictDoUpdate({
        set: {
          deletedAt: null,
          deletedById: null,
          roles: sql`CASE
            WHEN array_position(${teamMembers.roles}, ${invitation.role}::membership_role) IS NULL
              THEN ${teamMembers.roles} || ${invitation.role}::membership_role
            ELSE ${teamMembers.roles}
          END`,
          updatedAt: now,
        },
        target: [teamMembers.teamId, teamMembers.userId],
      });

    await tx.insert(auditLogs).values({
      action: "team.member.invite.accept",
      actorUserId: userId,
      entityId: invitation.id,
      entityType: "team_invitation",
      leagueId: invitation.leagueId,
      metadata: {
        email: invitation.email,
        role: invitation.role,
        teamId: invitation.teamId,
      },
    });

    return {
      leagueId: invitation.leagueId,
      role: invitation.role,
      teamId: invitation.teamId,
    };
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

type RemoveLeagueRoleInput = {
  leagueId: string;
  userId: string;
  role: MembershipRole;
  actorUserId: string;
};

type RemoveTeamRoleInput = {
  teamId: string;
  leagueId: string;
  userId: string;
  role: MembershipRole;
  actorUserId: string;
};

export async function removeLeagueMemberRole(input: RemoveLeagueRoleInput) {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(leagueMembers)
      .set({
        roles: sql`array_remove(${leagueMembers.roles}, ${input.role}::membership_role)`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(leagueMembers.leagueId, input.leagueId),
          eq(leagueMembers.userId, input.userId),
          isNull(leagueMembers.deletedAt),
        ),
      )
      .returning({ roles: leagueMembers.roles });

    if (!updated[0]) {
      throw new Error("League membership not found or already removed.");
    }

    await tx.insert(auditLogs).values({
      action: "league.member.role.remove",
      actorUserId: input.actorUserId,
      entityId: input.leagueId,
      entityType: "league",
      leagueId: input.leagueId,
      metadata: { role: input.role, userId: input.userId },
    });
  });
}

export async function removeTeamMemberRole(input: RemoveTeamRoleInput) {
  return db.transaction(async (tx) => {
    // When removing PLAYER, also remove CAPTAIN (it depends on PLAYER).
    const rolesToRemove =
      input.role === "PLAYER" ? ["PLAYER", "CAPTAIN"] : [input.role];

    let removeExpr = sql`${teamMembers.roles}`;
    for (const role of rolesToRemove) {
      removeExpr = sql`array_remove(${removeExpr}, ${role}::membership_role)`;
    }

    // Clear captainPermissionLevel when CAPTAIN is being removed.
    const clearCaptainLevel =
      input.role === "CAPTAIN" || input.role === "PLAYER";

    const updated = await tx
      .update(teamMembers)
      .set({
        roles: removeExpr,
        ...(clearCaptainLevel ? { captainPermissionLevel: null } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teamMembers.teamId, input.teamId),
          eq(teamMembers.userId, input.userId),
          isNull(teamMembers.deletedAt),
        ),
      )
      .returning({ roles: teamMembers.roles });

    if (!updated[0]) {
      throw new Error("Team membership not found.");
    }

    const auditRoles = rolesToRemove.length > 1 ? rolesToRemove : input.role;

    await tx.insert(auditLogs).values({
      action: "team.member.role.remove",
      actorUserId: input.actorUserId,
      entityId: input.teamId,
      entityType: "team",
      leagueId: input.leagueId,
      metadata: { role: auditRoles, userId: input.userId },
    });
  });
}

export async function getLeagueMembersByLeagueId(leagueId: string) {
  return db
    .select({
      email: users.email,
      roles: leagueMembers.roles,
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
      roles: teamMembers.roles,
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
