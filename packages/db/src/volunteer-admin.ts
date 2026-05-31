import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "./client";
import {
  auditLogs,
  users,
  volunteerOpportunities,
  volunteerRoleAssignments,
  volunteerRoles,
  volunteerSignups,
} from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type VolunteerOpportunitySummary = {
  id: string;
  leagueId: string;
  teamId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  slotsAvailable: string;
  createdAt: Date;
};

export type VolunteerSignupSummary = {
  id: string;
  opportunityId: string;
  userId: string;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  manualHours: string | null;
  createdAt: Date;
};

export type VolunteerRoleSummary = {
  id: string;
  leagueId: string;
  teamId: string | null;
  scope: "league" | "team";
  title: string;
  description: string | null;
  isBuiltIn: boolean;
};

// ── Opportunity queries ──────────────────────────────────────────────────────

export async function getOpportunitiesByLeague(
  leagueId: string,
): Promise<VolunteerOpportunitySummary[]> {
  return db
    .select({
      id: volunteerOpportunities.id,
      leagueId: volunteerOpportunities.leagueId,
      teamId: volunteerOpportunities.teamId,
      title: volunteerOpportunities.title,
      description: volunteerOpportunities.description,
      location: volunteerOpportunities.location,
      startsAt: volunteerOpportunities.startsAt,
      endsAt: volunteerOpportunities.endsAt,
      slotsAvailable: volunteerOpportunities.slotsAvailable,
      createdAt: volunteerOpportunities.createdAt,
    })
    .from(volunteerOpportunities)
    .where(
      and(
        eq(volunteerOpportunities.leagueId, leagueId),
        isNull(volunteerOpportunities.deletedAt),
      ),
    )
    .orderBy(volunteerOpportunities.startsAt);
}

// ── Opportunity mutations ────────────────────────────────────────────────────

export async function createOpportunity(input: {
  leagueId: string;
  teamId?: string;
  eventId?: string;
  title: string;
  description?: string;
  location?: string;
  startsAt?: Date;
  endsAt?: Date;
  slotsAvailable: number;
  createdById: string;
}): Promise<string> {
  const [row] = await db
    .insert(volunteerOpportunities)
    .values({
      leagueId: input.leagueId,
      teamId: input.teamId ?? null,
      eventId: input.eventId ?? null,
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      slotsAvailable: String(input.slotsAvailable),
      createdById: input.createdById,
    })
    .returning({ id: volunteerOpportunities.id });

  await db.insert(auditLogs).values({
    action: "volunteer_opportunity.create",
    actorUserId: input.createdById,
    entityType: "volunteer_opportunity",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { title: input.title },
  });

  return row.id;
}

// ── Signup flow ──────────────────────────────────────────────────────────────

export async function getSignupCountForOpportunity(
  opportunityId: string,
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(volunteerSignups)
    .where(
      and(
        eq(volunteerSignups.opportunityId, opportunityId),
        isNull(volunteerSignups.deletedAt),
      ),
    );
  return rows[0]?.count ?? 0;
}

export async function signUpForOpportunity(input: {
  opportunityId: string;
  userId: string;
  leagueId: string;
}): Promise<string> {
  const opportunity = await db
    .select({ slotsAvailable: volunteerOpportunities.slotsAvailable })
    .from(volunteerOpportunities)
    .where(eq(volunteerOpportunities.id, input.opportunityId))
    .limit(1);

  if (!opportunity[0]) throw new Error("Opportunity not found.");

  const currentCount = await getSignupCountForOpportunity(input.opportunityId);
  const maxSlots = Number.parseInt(opportunity[0].slotsAvailable, 10);

  if (currentCount >= maxSlots) {
    throw new Error("No available slots for this opportunity.");
  }

  const [row] = await db
    .insert(volunteerSignups)
    .values({
      opportunityId: input.opportunityId,
      userId: input.userId,
    })
    .returning({ id: volunteerSignups.id });

  return row.id;
}

// ── Check-in and hours ───────────────────────────────────────────────────────

export async function checkIn(signupId: string): Promise<void> {
  await db
    .update(volunteerSignups)
    .set({ checkedInAt: new Date(), updatedAt: new Date() })
    .where(eq(volunteerSignups.id, signupId));
}

export async function checkOut(signupId: string): Promise<void> {
  await db
    .update(volunteerSignups)
    .set({ checkedOutAt: new Date(), updatedAt: new Date() })
    .where(eq(volunteerSignups.id, signupId));
}

export async function setManualHours(
  signupId: string,
  hours: string,
): Promise<void> {
  await db
    .update(volunteerSignups)
    .set({ manualHours: hours, updatedAt: new Date() })
    .where(eq(volunteerSignups.id, signupId));
}

/**
 * Calculates hours for a signup. Uses manual hours if set,
 * otherwise calculates from check-in/check-out times.
 */
export function calculateHours(signup: VolunteerSignupSummary): number {
  if (signup.manualHours) {
    const parsed = Number.parseFloat(signup.manualHours);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (signup.checkedInAt && signup.checkedOutAt) {
    const ms = signup.checkedOutAt.getTime() - signup.checkedInAt.getTime();
    return Math.max(0, Math.round((ms / 3_600_000) * 100) / 100);
  }
  return 0;
}

// ── Signups by user ──────────────────────────────────────────────────────────

export async function getSignupsByUser(
  userId: string,
): Promise<VolunteerSignupSummary[]> {
  return db
    .select({
      id: volunteerSignups.id,
      opportunityId: volunteerSignups.opportunityId,
      userId: volunteerSignups.userId,
      checkedInAt: volunteerSignups.checkedInAt,
      checkedOutAt: volunteerSignups.checkedOutAt,
      manualHours: volunteerSignups.manualHours,
      createdAt: volunteerSignups.createdAt,
    })
    .from(volunteerSignups)
    .where(
      and(
        eq(volunteerSignups.userId, userId),
        isNull(volunteerSignups.deletedAt),
      ),
    );
}

// ── Volunteer roles ──────────────────────────────────────────────────────────

export async function getRolesByLeague(
  leagueId: string,
): Promise<VolunteerRoleSummary[]> {
  return db
    .select({
      id: volunteerRoles.id,
      leagueId: volunteerRoles.leagueId,
      teamId: volunteerRoles.teamId,
      scope: volunteerRoles.scope,
      title: volunteerRoles.title,
      description: volunteerRoles.description,
      isBuiltIn: volunteerRoles.isBuiltIn,
    })
    .from(volunteerRoles)
    .where(
      and(
        eq(volunteerRoles.leagueId, leagueId),
        isNull(volunteerRoles.deletedAt),
      ),
    )
    .orderBy(volunteerRoles.title);
}

export async function createVolunteerRole(input: {
  leagueId: string;
  teamId?: string;
  scope: "league" | "team";
  title: string;
  description?: string;
  isBuiltIn?: boolean;
  createdById: string;
}): Promise<string> {
  const [row] = await db
    .insert(volunteerRoles)
    .values({
      leagueId: input.leagueId,
      teamId: input.teamId ?? null,
      scope: input.scope,
      title: input.title,
      description: input.description ?? null,
      isBuiltIn: input.isBuiltIn ?? false,
      createdById: input.createdById,
    })
    .returning({ id: volunteerRoles.id });

  await db.insert(auditLogs).values({
    action: "volunteer_role.create",
    actorUserId: input.createdById,
    entityType: "volunteer_role",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { title: input.title, scope: input.scope },
  });

  return row.id;
}

export async function assignVolunteerRole(input: {
  roleId: string;
  userId: string;
  seasonId?: string;
  assignedById: string;
  leagueId: string;
}): Promise<string> {
  const [row] = await db
    .insert(volunteerRoleAssignments)
    .values({
      roleId: input.roleId,
      userId: input.userId,
      seasonId: input.seasonId ?? null,
      assignedById: input.assignedById,
    })
    .returning({ id: volunteerRoleAssignments.id });

  await db.insert(auditLogs).values({
    action: "volunteer_role.assign",
    actorUserId: input.assignedById,
    entityType: "volunteer_role_assignment",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { roleId: input.roleId, userId: input.userId },
  });

  return row.id;
}

export async function getRoleAssignmentsWithUsers(roleId: string) {
  return db
    .select({
      id: volunteerRoleAssignments.id,
      userId: volunteerRoleAssignments.userId,
      displayName: users.displayName,
      email: users.email,
      seasonId: volunteerRoleAssignments.seasonId,
    })
    .from(volunteerRoleAssignments)
    .innerJoin(users, eq(volunteerRoleAssignments.userId, users.id))
    .where(
      and(
        eq(volunteerRoleAssignments.roleId, roleId),
        isNull(volunteerRoleAssignments.deletedAt),
      ),
    );
}

// ── Starter roles ────────────────────────────────────────────────────────────

const STARTER_VOLUNTEER_ROLES = [
  "Travel Coordinator",
  "Social Coordinator",
  "Communications Manager",
  "Fundraising Chair",
  "Equipment Manager",
  "Team Parent",
  "Snack Coordinator",
];

export async function seedStarterVolunteerRoles(
  leagueId: string,
  createdById: string,
): Promise<void> {
  for (const title of STARTER_VOLUNTEER_ROLES) {
    await createVolunteerRole({
      leagueId,
      scope: "league",
      title,
      isBuiltIn: true,
      createdById,
    });
  }
}

// ── CSV export ───────────────────────────────────────────────────────────────

/**
 * Sanitizes a CSV cell value to prevent formula injection.
 * Prefixes cells starting with =, +, -, @ with a single quote.
 */
export function sanitizeCsvValue(value: string): string {
  const trimmed = value.replace(/[\r\n]/g, " ").trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Generates a CSV string from volunteer signup data.
 */
export function generateVolunteerCsv(
  rows: Array<{
    volunteerName: string;
    opportunityTitle: string;
    date: string;
    hours: number;
    status: string;
  }>,
): string {
  const header = "Volunteer,Opportunity,Date,Hours,Status";
  const csvRows = rows.map((row) =>
    [
      `"${sanitizeCsvValue(row.volunteerName)}"`,
      `"${sanitizeCsvValue(row.opportunityTitle)}"`,
      `"${sanitizeCsvValue(row.date)}"`,
      row.hours.toFixed(2),
      `"${sanitizeCsvValue(row.status)}"`,
    ].join(","),
  );
  return [header, ...csvRows].join("\n");
}
