import { randomUUID } from "node:crypto";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "./client";
import {
  auditLogs,
  buildMinorPlaceholderEmail,
  defaultNotificationPreferences,
  guardianMinorLinks,
  users,
} from "./schema";

type CreateMinorAccountInput = {
  guardianUserId: string;
  displayName: string;
  dateOfBirth?: string | null;
  actorUserId: string;
};

type LinkGuardianInput = {
  guardianUserId: string;
  minorUserId: string;
  relationship?: string | null;
  isPrimary?: boolean;
  actorUserId: string;
};

type UnlinkGuardianInput = {
  guardianUserId: string;
  minorUserId: string;
  actorUserId: string;
};

export type GuardianMinorLink = {
  id: string;
  guardianUserId: string;
  minorUserId: string;
  relationship: string | null;
  isPrimary: boolean;
  createdAt: Date;
};

export type MinorProfile = {
  id: string;
  displayName: string | null;
  dateOfBirth: string | null;
  createdAt: Date;
};

/**
 * Creates a minor account and links it to the specified guardian. The minor
 * gets a system-generated placeholder email (never shown to users, never
 * receives real mail) and an account type of "minor".
 */
export async function createMinorAccount(input: CreateMinorAccountInput) {
  const placeholderId = randomUUID().replace(/-/g, "").slice(0, 16);
  const placeholderEmail = buildMinorPlaceholderEmail(placeholderId);

  return db.transaction(async (tx) => {
    // Verify the guardian exists and isn't a minor themselves.
    const guardian = await tx
      .select({
        id: users.id,
        accountType: users.accountType,
      })
      .from(users)
      .where(and(eq(users.id, input.guardianUserId), isNull(users.deletedAt)))
      .limit(1);

    if (!guardian[0]) {
      throw new Error("Guardian account not found.");
    }
    if (guardian[0].accountType === "minor") {
      throw new Error("A minor account can't be a guardian.");
    }

    // Create the minor's app-level user record.
    const minorUser = await tx
      .insert(users)
      .values({
        accountType: "minor",
        dateOfBirth: input.dateOfBirth ?? null,
        displayName: input.displayName.trim() || null,
        email: placeholderEmail,
        timezone: "UTC",
        notificationPreferences: defaultNotificationPreferences,
      })
      .returning({ id: users.id });

    const minorUserId = minorUser[0].id;

    // Create the guardian-minor link (first guardian is always primary).
    await tx.insert(guardianMinorLinks).values({
      createdById: input.actorUserId,
      guardianUserId: input.guardianUserId,
      isPrimary: true,
      minorUserId,
    });

    // Audit log
    await tx.insert(auditLogs).values({
      action: "minor_account.created",
      actorUserId: input.actorUserId,
      entityId: minorUserId,
      entityType: "user",
      metadata: {
        guardianUserId: input.guardianUserId,
      },
    });

    return { minorUserId, placeholderEmail };
  });
}

/**
 * Links an additional guardian to an existing minor account.
 */
export async function linkGuardianToMinor(input: LinkGuardianInput) {
  return db.transaction(async (tx) => {
    // Verify minor exists and is actually a minor.
    const minor = await tx
      .select({ id: users.id, accountType: users.accountType })
      .from(users)
      .where(and(eq(users.id, input.minorUserId), isNull(users.deletedAt)))
      .limit(1);

    if (!minor[0]) {
      throw new Error("Minor account not found.");
    }
    if (minor[0].accountType !== "minor") {
      throw new Error("Target account isn't a minor.");
    }

    // Verify guardian exists and isn't a minor.
    const guardian = await tx
      .select({ id: users.id, accountType: users.accountType })
      .from(users)
      .where(and(eq(users.id, input.guardianUserId), isNull(users.deletedAt)))
      .limit(1);

    if (!guardian[0]) {
      throw new Error("Guardian account not found.");
    }
    if (guardian[0].accountType === "minor") {
      throw new Error("A minor account can't be a guardian.");
    }

    // Prevent self-referencing.
    if (input.guardianUserId === input.minorUserId) {
      throw new Error("A user can't be their own guardian.");
    }

    await tx.insert(guardianMinorLinks).values({
      createdById: input.actorUserId,
      guardianUserId: input.guardianUserId,
      isPrimary: input.isPrimary ?? false,
      minorUserId: input.minorUserId,
      relationship: input.relationship ?? null,
    });

    await tx.insert(auditLogs).values({
      action: "guardian_link.created",
      actorUserId: input.actorUserId,
      entityId: input.minorUserId,
      entityType: "guardian_minor_link",
      metadata: {
        guardianUserId: input.guardianUserId,
        relationship: input.relationship ?? null,
      },
    });
  });
}

/**
 * Removes a guardian from a minor. Blocks if this is the last active
 * guardian, since every minor must have at least one.
 *
 * Uses row-level locking to prevent a race where two guardians remove
 * themselves concurrently.
 */
export async function unlinkGuardianFromMinor(input: UnlinkGuardianInput) {
  return db.transaction(async (tx) => {
    // Lock all active links for this minor to prevent concurrent removal.
    const activeLinks = await tx.execute(
      sql`SELECT id, guardian_user_id
          FROM guardian_minor_links
          WHERE minor_user_id = ${input.minorUserId}
            AND deleted_at IS NULL
          FOR UPDATE`,
    );

    const linkRows = activeLinks.rows as Array<{
      id: string;
      guardian_user_id: string;
    }>;

    const targetLink = linkRows.find(
      (row) => row.guardian_user_id === input.guardianUserId,
    );

    if (!targetLink) {
      throw new Error("Guardian link not found.");
    }

    if (linkRows.length <= 1) {
      throw new Error(
        "Can't remove the last guardian. Every minor needs at least one.",
      );
    }

    const now = new Date();
    await tx
      .update(guardianMinorLinks)
      .set({
        deletedAt: now,
        deletedById: input.actorUserId,
      })
      .where(eq(guardianMinorLinks.id, targetLink.id));

    await tx.insert(auditLogs).values({
      action: "guardian_link.removed",
      actorUserId: input.actorUserId,
      entityId: input.minorUserId,
      entityType: "guardian_minor_link",
      metadata: {
        guardianUserId: input.guardianUserId,
        remainingGuardians: linkRows.length - 1,
      },
    });
  });
}

/**
 * Returns all minor accounts linked to the given guardian.
 */
export async function getGuardianMinors(guardianUserId: string) {
  const results = await db
    .select({
      linkId: guardianMinorLinks.id,
      minorUserId: guardianMinorLinks.minorUserId,
      relationship: guardianMinorLinks.relationship,
      isPrimary: guardianMinorLinks.isPrimary,
      displayName: users.displayName,
      dateOfBirth: users.dateOfBirth,
      createdAt: guardianMinorLinks.createdAt,
    })
    .from(guardianMinorLinks)
    .innerJoin(users, eq(users.id, guardianMinorLinks.minorUserId))
    .where(
      and(
        eq(guardianMinorLinks.guardianUserId, guardianUserId),
        isNull(guardianMinorLinks.deletedAt),
        isNull(users.deletedAt),
      ),
    );

  return results;
}

/**
 * Returns all guardians linked to the given minor.
 */
export async function getMinorGuardians(minorUserId: string) {
  const results = await db
    .select({
      linkId: guardianMinorLinks.id,
      guardianUserId: guardianMinorLinks.guardianUserId,
      relationship: guardianMinorLinks.relationship,
      isPrimary: guardianMinorLinks.isPrimary,
      displayName: users.displayName,
      email: users.email,
      createdAt: guardianMinorLinks.createdAt,
    })
    .from(guardianMinorLinks)
    .innerJoin(users, eq(users.id, guardianMinorLinks.guardianUserId))
    .where(
      and(
        eq(guardianMinorLinks.minorUserId, minorUserId),
        isNull(guardianMinorLinks.deletedAt),
        isNull(users.deletedAt),
      ),
    );

  return results;
}

/**
 * Checks whether a user account is a minor.
 */
export async function isMinorAccount(userId: string) {
  const result = await db
    .select({ accountType: users.accountType })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return result[0]?.accountType === "minor";
}

/**
 * Resolves email recipients for a user. For standard accounts, returns the
 * user's own email. For minor accounts, returns all linked guardians' emails
 * with the minor's display name for labeling.
 */
export async function resolveNotificationRecipients(userId: string) {
  const user = await db
    .select({
      id: users.id,
      email: users.email,
      accountType: users.accountType,
      displayName: users.displayName,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (!user[0]) {
    return [];
  }

  if (user[0].accountType !== "minor") {
    return [{ email: user[0].email, onBehalfOf: null }];
  }

  // For minors, resolve guardian emails.
  const guardians = await getMinorGuardians(userId);

  return guardians.map((g) => ({
    email: g.email,
    onBehalfOf: user[0].displayName,
  }));
}
