import { randomUUID } from "node:crypto";

import { and, eq, isNull, or, sql } from "drizzle-orm";

import { db } from "./client";
import {
  buildPersonalLeagueName,
  leagueMembers,
  leagues,
  type NotificationPreferences,
  teamMembers,
  users,
} from "./schema";

type ProvisionInput = {
  authUserId: string;
  email: string;
  displayName?: string | null;
  timezone?: string;
  invitationToken?: string | null;
};

type UpsertSettingsInput = {
  authUserId: string;
  displayName?: string | null;
  timezone?: string;
  notificationPreferences?: NotificationPreferences;
};

const defaultNotificationPreferences: NotificationPreferences = {
  emailAnnouncements: true,
  eventReminders: true,
  weeklyDigest: false,
};
const MAX_SLUG_GENERATION_ATTEMPTS = 5;

export function shouldCreatePersonalLeague(invitationToken?: string | null) {
  return !invitationToken?.trim();
}

export function buildPersonalLeagueSlug(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  return `${base || "personal-league"}-${suffix}`;
}

export async function provisionUserOnboarding(input: ProvisionInput) {
  const timezone = input.timezone?.trim() || "UTC";
  const displayName = input.displayName?.trim() || null;
  const createPersonalLeague = shouldCreatePersonalLeague(
    input.invitationToken,
  );

  return db.transaction(async (tx) => {
    const existingUser = await tx
      .select({
        id: users.id,
        authUserId: users.authUserId,
        email: users.email,
      })
      .from(users)
      .where(
        or(
          eq(users.authUserId, input.authUserId),
          eq(users.email, input.email),
        ),
      )
      .limit(1);

    let userId: string;

    if (existingUser[0]) {
      // If the existing row belongs to a different auth user, refuse the merge
      // to prevent account hijacking via email reuse or typos.
      const claimedByOther =
        existingUser[0].authUserId !== null &&
        existingUser[0].authUserId !== input.authUserId;

      if (claimedByOther) {
        throw new Error(
          "This email is already associated with another account.",
        );
      }

      userId = existingUser[0].id;
      await tx
        .update(users)
        .set({
          authUserId: input.authUserId,
          displayName,
          email: input.email,
          timezone,
        })
        .where(eq(users.id, userId));
    } else {
      userId = (
        await tx
          .insert(users)
          .values({
            authUserId: input.authUserId,
            displayName,
            email: input.email,
            timezone,
            notificationPreferences: defaultNotificationPreferences,
          })
          .returning({ id: users.id })
      )[0].id;
    }

    if (!createPersonalLeague) {
      return { createdPersonalLeague: false, userId };
    }

    const ownerMembership = await tx
      .select({
        leagueId: leagueMembers.leagueId,
      })
      .from(leagueMembers)
      .where(
        and(
          eq(leagueMembers.userId, userId),
          sql`${leagueMembers.roles} @> ARRAY['OWNER']::membership_role[]`,
          isNull(leagueMembers.deletedAt),
        ),
      )
      .limit(1);

    if (ownerMembership[0]) {
      return {
        createdPersonalLeague: false,
        leagueId: ownerMembership[0].leagueId,
        userId,
      };
    }

    const leagueName = buildPersonalLeagueName(displayName);
    let leagueId: string | null = null;

    for (
      let attempt = 0;
      attempt < MAX_SLUG_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      const candidateSlug = buildPersonalLeagueSlug(leagueName);
      try {
        leagueId = (
          await tx
            .insert(leagues)
            .values({
              createdById: userId,
              name: leagueName,
              slug: candidateSlug,
              timezone,
            })
            .returning({ id: leagues.id })
        )[0].id;
        break;
      } catch (err: unknown) {
        const isUniqueViolation =
          err instanceof Error && err.message.includes("unique");
        if (!isUniqueViolation || attempt === MAX_SLUG_GENERATION_ATTEMPTS - 1) {
          throw err;
        }
      }
    }

    if (!leagueId) {
      throw new Error("Unable to create a unique personal league slug.");
    }

    await tx.insert(leagueMembers).values({
      leagueId,
      roles: ["OWNER"],
      userId,
    });

    return { createdPersonalLeague: true, leagueId, userId };
  });
}

export async function upsertUserSettings(input: UpsertSettingsInput) {
  const timezone = input.timezone?.trim() || "UTC";
  const displayName = input.displayName?.trim() || null;
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.authUserId, input.authUserId))
    .limit(1);

  if (!existingUser[0]) {
    throw new Error("User profile has not been provisioned yet.");
  }

  await db
    .update(users)
    .set({
      displayName,
      notificationPreferences:
        input.notificationPreferences ?? defaultNotificationPreferences,
      timezone,
      updatedAt: new Date(),
    })
    .where(eq(users.id, existingUser[0].id));
}

export async function getUserSettingsByAuthUserId(authUserId: string) {
  const result = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      notificationPreferences: users.notificationPreferences,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.authUserId, authUserId))
    .limit(1);

  return result[0] ?? null;
}

export async function deleteUserAccount(authUserId: string) {
  return db.transaction(async (tx) => {
    const existingUser = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    if (!existingUser[0]) {
      throw new Error("User account not found.");
    }

    const userId = existingUser[0].id;
    const now = new Date();

    // Soft-delete all league memberships
    await tx
      .update(leagueMembers)
      .set({ deletedAt: now, deletedById: userId })
      .where(
        and(eq(leagueMembers.userId, userId), isNull(leagueMembers.deletedAt)),
      );

    // Soft-delete all team memberships
    await tx
      .update(teamMembers)
      .set({ deletedAt: now, deletedById: userId })
      .where(
        and(eq(teamMembers.userId, userId), isNull(teamMembers.deletedAt)),
      );

    // Soft-delete the user profile
    await tx
      .update(users)
      .set({
        authUserId: null,
        deletedAt: now,
        deletedById: userId,
        displayName: null,
      })
      .where(eq(users.id, userId));

    return { userId };
  });
}

export async function getActiveUserAuthIds() {
  const result = await db
    .select({ authUserId: users.authUserId })
    .from(users)
    .where(isNull(users.deletedAt));

  return result
    .map((row) => row.authUserId)
    .filter((id): id is string => id !== null);
}
