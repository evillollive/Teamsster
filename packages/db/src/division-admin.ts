import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import type { CompetitiveLevel } from "./schema";
import { auditLogs, divisions, teamDivisionAssignments } from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type DivisionSummary = {
  id: string;
  leagueId: string;
  name: string;
  shortName: string | null;
  minBirthYear: string | null;
  maxBirthYear: string | null;
  competitiveLevel: CompetitiveLevel;
  sortOrder: string;
  createdAt: Date;
};

export type TeamDivisionAssignment = {
  id: string;
  teamId: string;
  divisionId: string;
  seasonId: string | null;
};

// ── Validation ───────────────────────────────────────────────────────────────

export function validateBirthYearRange(
  min: string | null | undefined,
  max: string | null | undefined,
): string | null {
  if (!min && !max) return null;
  if (min && max) {
    const minYear = Number.parseInt(min, 10);
    const maxYear = Number.parseInt(max, 10);
    if (Number.isNaN(minYear) || Number.isNaN(maxYear)) {
      return "Birth years must be valid numbers.";
    }
    if (minYear > maxYear) {
      return "Minimum birth year can't be after maximum birth year.";
    }
    if (minYear < 1900 || maxYear > 2100) {
      return "Birth years must be between 1900 and 2100.";
    }
  }
  return null;
}

export function getAgeGroupLabel(
  minBirthYear: string | null,
  maxBirthYear: string | null,
): string {
  if (!minBirthYear && !maxBirthYear) return "All ages";
  if (minBirthYear && maxBirthYear) {
    return `Born ${minBirthYear}-${maxBirthYear}`;
  }
  if (minBirthYear) return `Born ${minBirthYear}+`;
  return `Born before ${maxBirthYear}`;
}

export const COMPETITIVE_LEVEL_LABELS: Record<CompetitiveLevel, string> = {
  recreational: "Recreational",
  competitive: "Competitive",
  elite: "Elite",
};

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getDivisionsByLeague(
  leagueId: string,
): Promise<DivisionSummary[]> {
  return db
    .select({
      id: divisions.id,
      leagueId: divisions.leagueId,
      name: divisions.name,
      shortName: divisions.shortName,
      minBirthYear: divisions.minBirthYear,
      maxBirthYear: divisions.maxBirthYear,
      competitiveLevel: divisions.competitiveLevel,
      sortOrder: divisions.sortOrder,
      createdAt: divisions.createdAt,
    })
    .from(divisions)
    .where(and(eq(divisions.leagueId, leagueId), isNull(divisions.deletedAt)))
    .orderBy(divisions.sortOrder, divisions.name);
}

export async function getDivisionById(
  divisionId: string,
): Promise<DivisionSummary | null> {
  const rows = await db
    .select({
      id: divisions.id,
      leagueId: divisions.leagueId,
      name: divisions.name,
      shortName: divisions.shortName,
      minBirthYear: divisions.minBirthYear,
      maxBirthYear: divisions.maxBirthYear,
      competitiveLevel: divisions.competitiveLevel,
      sortOrder: divisions.sortOrder,
      createdAt: divisions.createdAt,
    })
    .from(divisions)
    .where(and(eq(divisions.id, divisionId), isNull(divisions.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getTeamDivision(
  teamId: string,
  seasonId?: string,
): Promise<TeamDivisionAssignment | null> {
  const conditions = [
    eq(teamDivisionAssignments.teamId, teamId),
    isNull(teamDivisionAssignments.deletedAt),
  ];
  if (seasonId) {
    conditions.push(eq(teamDivisionAssignments.seasonId, seasonId));
  }

  const rows = await db
    .select({
      id: teamDivisionAssignments.id,
      teamId: teamDivisionAssignments.teamId,
      divisionId: teamDivisionAssignments.divisionId,
      seasonId: teamDivisionAssignments.seasonId,
    })
    .from(teamDivisionAssignments)
    .where(and(...conditions))
    .limit(1);
  return rows[0] ?? null;
}

export async function getTeamsByDivision(
  divisionId: string,
  seasonId?: string,
): Promise<TeamDivisionAssignment[]> {
  const conditions = [
    eq(teamDivisionAssignments.divisionId, divisionId),
    isNull(teamDivisionAssignments.deletedAt),
  ];
  if (seasonId) {
    conditions.push(eq(teamDivisionAssignments.seasonId, seasonId));
  }

  return db
    .select({
      id: teamDivisionAssignments.id,
      teamId: teamDivisionAssignments.teamId,
      divisionId: teamDivisionAssignments.divisionId,
      seasonId: teamDivisionAssignments.seasonId,
    })
    .from(teamDivisionAssignments)
    .where(and(...conditions));
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createDivision(input: {
  leagueId: string;
  name: string;
  shortName?: string;
  minBirthYear?: string;
  maxBirthYear?: string;
  competitiveLevel?: CompetitiveLevel;
  sortOrder?: string;
  createdById: string;
}): Promise<string> {
  const yearError = validateBirthYearRange(
    input.minBirthYear,
    input.maxBirthYear,
  );
  if (yearError) throw new Error(yearError);

  const [row] = await db
    .insert(divisions)
    .values({
      leagueId: input.leagueId,
      name: input.name,
      shortName: input.shortName ?? null,
      minBirthYear: input.minBirthYear ?? null,
      maxBirthYear: input.maxBirthYear ?? null,
      competitiveLevel: input.competitiveLevel ?? "recreational",
      sortOrder: input.sortOrder ?? "0",
      createdById: input.createdById,
    })
    .returning({ id: divisions.id });

  await db.insert(auditLogs).values({
    action: "division.create",
    actorUserId: input.createdById,
    entityType: "division",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { name: input.name, competitiveLevel: input.competitiveLevel },
  });

  return row.id;
}

export async function updateDivision(input: {
  divisionId: string;
  leagueId: string;
  name?: string;
  shortName?: string;
  minBirthYear?: string;
  maxBirthYear?: string;
  competitiveLevel?: CompetitiveLevel;
  sortOrder?: string;
  actorUserId: string;
}): Promise<void> {
  if (input.minBirthYear !== undefined || input.maxBirthYear !== undefined) {
    const yearError = validateBirthYearRange(
      input.minBirthYear,
      input.maxBirthYear,
    );
    if (yearError) throw new Error(yearError);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.shortName !== undefined) updates.shortName = input.shortName;
  if (input.minBirthYear !== undefined)
    updates.minBirthYear = input.minBirthYear;
  if (input.maxBirthYear !== undefined)
    updates.maxBirthYear = input.maxBirthYear;
  if (input.competitiveLevel !== undefined)
    updates.competitiveLevel = input.competitiveLevel;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;

  await db
    .update(divisions)
    .set(updates)
    .where(
      and(
        eq(divisions.id, input.divisionId),
        eq(divisions.leagueId, input.leagueId),
        isNull(divisions.deletedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: "division.update",
    actorUserId: input.actorUserId,
    entityType: "division",
    entityId: input.divisionId,
    leagueId: input.leagueId,
    metadata: {
      updatedFields: Object.keys(updates).filter((k) => k !== "updatedAt"),
    },
  });
}

export async function deleteDivision(input: {
  divisionId: string;
  leagueId: string;
  actorUserId: string;
}): Promise<void> {
  await db
    .update(divisions)
    .set({ deletedAt: new Date(), deletedById: input.actorUserId })
    .where(
      and(
        eq(divisions.id, input.divisionId),
        eq(divisions.leagueId, input.leagueId),
        isNull(divisions.deletedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: "division.delete",
    actorUserId: input.actorUserId,
    entityType: "division",
    entityId: input.divisionId,
    leagueId: input.leagueId,
    metadata: {},
  });
}

export async function assignTeamToDivision(input: {
  teamId: string;
  divisionId: string;
  seasonId?: string;
  assignedById: string;
  leagueId: string;
}): Promise<string> {
  // Validate the division belongs to the right league
  const division = await getDivisionById(input.divisionId);
  if (!division || division.leagueId !== input.leagueId) {
    throw new Error("Division doesn't belong to this league.");
  }

  const [row] = await db
    .insert(teamDivisionAssignments)
    .values({
      teamId: input.teamId,
      divisionId: input.divisionId,
      seasonId: input.seasonId ?? null,
      assignedById: input.assignedById,
    })
    .returning({ id: teamDivisionAssignments.id });

  await db.insert(auditLogs).values({
    action: "division.assign_team",
    actorUserId: input.assignedById,
    entityType: "team_division_assignment",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { teamId: input.teamId, divisionId: input.divisionId },
  });

  return row.id;
}
