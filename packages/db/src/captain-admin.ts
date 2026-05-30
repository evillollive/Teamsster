import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "./client";
import {
  auditLogs,
  type captainPermissionLevelValues,
  isCaptain,
  isMinorPlaceholderEmail,
  teamMembers,
  users,
} from "./schema";

type CaptainPermissionLevel = (typeof captainPermissionLevelValues)[number];

type AssignCaptainInput = {
  teamId: string;
  userId: string;
  actorUserId: string;
  leagueId: string;
  permissionLevel?: CaptainPermissionLevel;
};

type RevokeCaptainInput = {
  teamId: string;
  userId: string;
  actorUserId: string;
  leagueId: string;
};

type UpdateCaptainPermissionInput = {
  teamId: string;
  userId: string;
  actorUserId: string;
  leagueId: string;
  permissionLevel: CaptainPermissionLevel;
};

/**
 * Assigns the CAPTAIN role to a team member. Requires the member to already
 * have the PLAYER role on the same team. Minor accounts default to
 * "restricted" unless an explicit override is provided.
 */
export async function assignCaptain(input: AssignCaptainInput) {
  return db.transaction(async (tx) => {
    const memberRows = await tx
      .select({
        roles: teamMembers.roles,
        captainPermissionLevel: teamMembers.captainPermissionLevel,
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, input.teamId),
          eq(teamMembers.userId, input.userId),
          isNull(teamMembers.deletedAt),
        ),
      )
      .limit(1);

    const member = memberRows[0];
    if (!member) {
      throw new Error("Team membership not found.");
    }

    if (!member.roles.includes("PLAYER")) {
      throw new Error(
        "CAPTAIN requires PLAYER on the same team. Assign PLAYER first.",
      );
    }

    if (isCaptain(member.roles)) {
      throw new Error("This member is already a captain on this team.");
    }

    // Determine permission level. Minors default to restricted.
    let level: CaptainPermissionLevel = input.permissionLevel ?? "restricted";

    if (!input.permissionLevel) {
      const userRows = await tx
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (userRows[0] && isMinorPlaceholderEmail(userRows[0].email)) {
        level = "restricted";
      }
    }

    await tx
      .update(teamMembers)
      .set({
        roles: sql`${teamMembers.roles} || 'CAPTAIN'::membership_role`,
        captainPermissionLevel: level,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teamMembers.teamId, input.teamId),
          eq(teamMembers.userId, input.userId),
        ),
      );

    await tx.insert(auditLogs).values({
      action: "team.captain.assign",
      actorUserId: input.actorUserId,
      entityId: input.teamId,
      entityType: "team",
      leagueId: input.leagueId,
      metadata: {
        userId: input.userId,
        permissionLevel: level,
      },
    });
  });
}

/**
 * Removes the CAPTAIN role from a team member and clears the
 * permission level. The PLAYER role is not affected.
 */
export async function revokeCaptain(input: RevokeCaptainInput) {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(teamMembers)
      .set({
        roles: sql`array_remove(${teamMembers.roles}, 'CAPTAIN'::membership_role)`,
        captainPermissionLevel: null,
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

    await tx.insert(auditLogs).values({
      action: "team.captain.revoke",
      actorUserId: input.actorUserId,
      entityId: input.teamId,
      entityType: "team",
      leagueId: input.leagueId,
      metadata: { userId: input.userId },
    });
  });
}

/**
 * Updates the permission level (full or restricted) for an existing captain.
 */
export async function updateCaptainPermission(
  input: UpdateCaptainPermissionInput,
) {
  return db.transaction(async (tx) => {
    const memberRows = await tx
      .select({
        roles: teamMembers.roles,
        captainPermissionLevel: teamMembers.captainPermissionLevel,
      })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, input.teamId),
          eq(teamMembers.userId, input.userId),
          isNull(teamMembers.deletedAt),
        ),
      )
      .limit(1);

    const member = memberRows[0];
    if (!member || !isCaptain(member.roles)) {
      throw new Error("Member is not a captain on this team.");
    }

    if (member.captainPermissionLevel === input.permissionLevel) {
      return; // no-op
    }

    await tx
      .update(teamMembers)
      .set({
        captainPermissionLevel: input.permissionLevel,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(teamMembers.teamId, input.teamId),
          eq(teamMembers.userId, input.userId),
        ),
      );

    await tx.insert(auditLogs).values({
      action: "team.captain.permission.update",
      actorUserId: input.actorUserId,
      entityId: input.teamId,
      entityType: "team",
      leagueId: input.leagueId,
      metadata: {
        userId: input.userId,
        from: member.captainPermissionLevel,
        to: input.permissionLevel,
      },
    });
  });
}

/**
 * Returns all captains on a team with their permission levels.
 */
export async function getTeamCaptains(teamId: string) {
  return db
    .select({
      userId: teamMembers.userId,
      captainPermissionLevel: teamMembers.captainPermissionLevel,
      displayName: users.displayName,
      email: users.email,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        isNull(teamMembers.deletedAt),
        sql`'CAPTAIN' = ANY(${teamMembers.roles})`,
      ),
    );
}
