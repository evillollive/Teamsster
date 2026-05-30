import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "./client";
import type {
  RegistrationFormConfig,
  RegistrationStatus,
  SeasonStatus,
} from "./schema";
import { auditLogs, registrations, seasons } from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type SeasonSummary = {
  id: string;
  leagueId: string;
  name: string;
  year: string;
  status: SeasonStatus;
  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
  formConfig: RegistrationFormConfig;
  createdAt: Date;
};

export type RegistrationSummary = {
  id: string;
  seasonId: string;
  leagueId: string;
  playerId: string | null;
  guardianUserId: string;
  status: RegistrationStatus;
  formData: Record<string, unknown>;
  submittedAt: Date | null;
  createdAt: Date;
};

// ── Season queries ───────────────────────────────────────────────────────────

export async function getSeasonsByLeague(
  leagueId: string,
): Promise<SeasonSummary[]> {
  return db
    .select({
      id: seasons.id,
      leagueId: seasons.leagueId,
      name: seasons.name,
      year: seasons.year,
      status: seasons.status,
      registrationOpensAt: seasons.registrationOpensAt,
      registrationClosesAt: seasons.registrationClosesAt,
      formConfig: seasons.formConfig,
      createdAt: seasons.createdAt,
    })
    .from(seasons)
    .where(and(eq(seasons.leagueId, leagueId), isNull(seasons.deletedAt)))
    .orderBy(seasons.year);
}

export async function getSeasonById(
  seasonId: string,
): Promise<SeasonSummary | null> {
  const rows = await db
    .select({
      id: seasons.id,
      leagueId: seasons.leagueId,
      name: seasons.name,
      year: seasons.year,
      status: seasons.status,
      registrationOpensAt: seasons.registrationOpensAt,
      registrationClosesAt: seasons.registrationClosesAt,
      formConfig: seasons.formConfig,
      createdAt: seasons.createdAt,
    })
    .from(seasons)
    .where(and(eq(seasons.id, seasonId), isNull(seasons.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getActiveSeasonForLeague(
  leagueId: string,
): Promise<SeasonSummary | null> {
  const rows = await db
    .select({
      id: seasons.id,
      leagueId: seasons.leagueId,
      name: seasons.name,
      year: seasons.year,
      status: seasons.status,
      registrationOpensAt: seasons.registrationOpensAt,
      registrationClosesAt: seasons.registrationClosesAt,
      formConfig: seasons.formConfig,
      createdAt: seasons.createdAt,
    })
    .from(seasons)
    .where(
      and(
        eq(seasons.leagueId, leagueId),
        eq(seasons.status, "open"),
        isNull(seasons.deletedAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

// ── Season mutations ─────────────────────────────────────────────────────────

export async function createSeason(input: {
  leagueId: string;
  name: string;
  year: string;
  registrationOpensAt?: Date;
  registrationClosesAt?: Date;
  formConfig?: RegistrationFormConfig;
  createdById: string;
}): Promise<string> {
  const [row] = await db
    .insert(seasons)
    .values({
      leagueId: input.leagueId,
      name: input.name,
      year: input.year,
      registrationOpensAt: input.registrationOpensAt ?? null,
      registrationClosesAt: input.registrationClosesAt ?? null,
      formConfig: input.formConfig ?? undefined,
      createdById: input.createdById,
    })
    .returning({ id: seasons.id });

  await db.insert(auditLogs).values({
    action: "season.create",
    actorUserId: input.createdById,
    entityType: "season",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { name: input.name, year: input.year },
  });

  return row.id;
}

export async function updateSeasonStatus(input: {
  seasonId: string;
  leagueId: string;
  status: SeasonStatus;
  actorUserId: string;
}): Promise<void> {
  await db
    .update(seasons)
    .set({ status: input.status, updatedAt: new Date() })
    .where(
      and(
        eq(seasons.id, input.seasonId),
        eq(seasons.leagueId, input.leagueId),
        isNull(seasons.deletedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: "season.status_change",
    actorUserId: input.actorUserId,
    entityType: "season",
    entityId: input.seasonId,
    leagueId: input.leagueId,
    metadata: { newStatus: input.status },
  });
}

export async function updateSeasonFormConfig(input: {
  seasonId: string;
  leagueId: string;
  formConfig: RegistrationFormConfig;
  actorUserId: string;
}): Promise<void> {
  await db
    .update(seasons)
    .set({ formConfig: input.formConfig, updatedAt: new Date() })
    .where(
      and(
        eq(seasons.id, input.seasonId),
        eq(seasons.leagueId, input.leagueId),
        isNull(seasons.deletedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: "season.form_config_update",
    actorUserId: input.actorUserId,
    entityType: "season",
    entityId: input.seasonId,
    leagueId: input.leagueId,
    metadata: {},
  });
}

// ── Registration queries ─────────────────────────────────────────────────────

export async function getRegistrationsBySeason(
  seasonId: string,
): Promise<RegistrationSummary[]> {
  return db
    .select({
      id: registrations.id,
      seasonId: registrations.seasonId,
      leagueId: registrations.leagueId,
      playerId: registrations.playerId,
      guardianUserId: registrations.guardianUserId,
      status: registrations.status,
      formData: registrations.formData,
      submittedAt: registrations.submittedAt,
      createdAt: registrations.createdAt,
    })
    .from(registrations)
    .where(
      and(
        eq(registrations.seasonId, seasonId),
        isNull(registrations.deletedAt),
      ),
    );
}

export async function getRegistrationsByGuardian(
  guardianUserId: string,
  seasonId: string,
): Promise<RegistrationSummary[]> {
  return db
    .select({
      id: registrations.id,
      seasonId: registrations.seasonId,
      leagueId: registrations.leagueId,
      playerId: registrations.playerId,
      guardianUserId: registrations.guardianUserId,
      status: registrations.status,
      formData: registrations.formData,
      submittedAt: registrations.submittedAt,
      createdAt: registrations.createdAt,
    })
    .from(registrations)
    .where(
      and(
        eq(registrations.guardianUserId, guardianUserId),
        eq(registrations.seasonId, seasonId),
        isNull(registrations.deletedAt),
      ),
    );
}

export async function getRegistrationStatusCounts(seasonId: string) {
  const rows = await db
    .select({
      status: registrations.status,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(registrations)
    .where(
      and(
        eq(registrations.seasonId, seasonId),
        isNull(registrations.deletedAt),
      ),
    )
    .groupBy(registrations.status);

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row.count;
    return acc;
  }, {});
}

// ── Registration mutations ───────────────────────────────────────────────────

export async function createRegistration(input: {
  seasonId: string;
  leagueId: string;
  playerId?: string;
  guardianUserId: string;
  formData?: Record<string, unknown>;
}): Promise<string> {
  const [row] = await db
    .insert(registrations)
    .values({
      seasonId: input.seasonId,
      leagueId: input.leagueId,
      playerId: input.playerId ?? null,
      guardianUserId: input.guardianUserId,
      formData: input.formData ?? {},
      status: "not_started",
    })
    .returning({ id: registrations.id });

  return row.id;
}

export async function updateRegistrationFormData(input: {
  registrationId: string;
  formData: Record<string, unknown>;
  status?: RegistrationStatus;
}): Promise<void> {
  const updates: Record<string, unknown> = {
    formData: input.formData,
    updatedAt: new Date(),
  };
  if (input.status) {
    updates.status = input.status;
    if (input.status === "submitted") {
      updates.submittedAt = new Date();
    }
  }

  await db
    .update(registrations)
    .set(updates)
    .where(
      and(
        eq(registrations.id, input.registrationId),
        isNull(registrations.deletedAt),
      ),
    );
}

export async function reviewRegistration(input: {
  registrationId: string;
  status: "approved" | "rejected";
  reviewNotes?: string;
  reviewedById: string;
  leagueId: string;
}): Promise<void> {
  await db
    .update(registrations)
    .set({
      status: input.status,
      reviewedById: input.reviewedById,
      reviewNotes: input.reviewNotes ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(registrations.id, input.registrationId),
        isNull(registrations.deletedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: `registration.${input.status}`,
    actorUserId: input.reviewedById,
    entityType: "registration",
    entityId: input.registrationId,
    leagueId: input.leagueId,
    metadata: { notes: input.reviewNotes },
  });
}
