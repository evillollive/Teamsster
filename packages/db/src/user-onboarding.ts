import { randomUUID } from "node:crypto";

import { and, eq, isNull, or, sql } from "drizzle-orm";

import { db } from "./client";
import {
  buildPersonalLeagueName,
  leagueMembers,
  leagues,
  type NotificationPreferences,
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

    const userId =
      existingUser[0]?.id ??
      (
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

    if (existingUser[0]) {
      await tx
        .update(users)
        .set({
          authUserId: input.authUserId,
          displayName,
          email: input.email,
          timezone,
        })
        .where(eq(users.id, userId));
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
      const existingSlug = await tx
        .select({
          id: leagues.id,
        })
        .from(leagues)
        .where(eq(leagues.slug, candidateSlug))
        .limit(1);

      if (existingSlug[0]) {
        continue;
      }

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
