import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import type { SurfaceType } from "./schema";
import { auditLogs, fieldAvailability, fields, venues } from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type VenueSummary = {
  id: string;
  leagueId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  createdAt: Date;
};

export type FieldSummary = {
  id: string;
  venueId: string;
  name: string;
  surfaceType: SurfaceType;
  capacity: string | null;
  amenities: string[] | null;
};

export type AvailabilityWindow = {
  id: string;
  fieldId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  effectiveDate: string | null;
};

// ── Time conflict detection ──────────────────────────────────────────────────

/**
 * Checks whether two time windows overlap.
 * Times are in HH:MM format.
 */
export function doTimesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Checks whether a proposed booking conflicts with existing availability.
 * Returns true if there IS a conflict (the slot is already taken).
 */
export function hasConflict(
  existing: AvailabilityWindow[],
  proposed: { dayOfWeek: string; startTime: string; endTime: string },
): boolean {
  return existing.some(
    (w) =>
      w.dayOfWeek === proposed.dayOfWeek &&
      doTimesOverlap(
        w.startTime,
        w.endTime,
        proposed.startTime,
        proposed.endTime,
      ),
  );
}

/**
 * Validates time format (HH:MM, 24-hour).
 */
export function isValidTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

/**
 * Validates that start time is before end time.
 */
export function isValidTimeRange(start: string, end: string): boolean {
  return start < end;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getVenuesByLeague(
  leagueId: string,
): Promise<VenueSummary[]> {
  return db
    .select({
      id: venues.id,
      leagueId: venues.leagueId,
      name: venues.name,
      address: venues.address,
      city: venues.city,
      state: venues.state,
      zipCode: venues.zipCode,
      createdAt: venues.createdAt,
    })
    .from(venues)
    .where(and(eq(venues.leagueId, leagueId), isNull(venues.deletedAt)))
    .orderBy(venues.name);
}

export async function getFieldsByVenue(
  venueId: string,
): Promise<FieldSummary[]> {
  return db
    .select({
      id: fields.id,
      venueId: fields.venueId,
      name: fields.name,
      surfaceType: fields.surfaceType,
      capacity: fields.capacity,
      amenities: fields.amenities,
    })
    .from(fields)
    .where(and(eq(fields.venueId, venueId), isNull(fields.deletedAt)))
    .orderBy(fields.name);
}

export async function getFieldAvailability(
  fieldId: string,
): Promise<AvailabilityWindow[]> {
  return db
    .select({
      id: fieldAvailability.id,
      fieldId: fieldAvailability.fieldId,
      dayOfWeek: fieldAvailability.dayOfWeek,
      startTime: fieldAvailability.startTime,
      endTime: fieldAvailability.endTime,
      isRecurring: fieldAvailability.isRecurring,
      effectiveDate: fieldAvailability.effectiveDate,
    })
    .from(fieldAvailability)
    .where(eq(fieldAvailability.fieldId, fieldId))
    .orderBy(fieldAvailability.dayOfWeek, fieldAvailability.startTime);
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createVenue(input: {
  leagueId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdById: string;
}): Promise<string> {
  const [row] = await db
    .insert(venues)
    .values({
      leagueId: input.leagueId,
      name: input.name,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zipCode: input.zipCode ?? null,
      notes: input.notes ?? null,
      createdById: input.createdById,
    })
    .returning({ id: venues.id });

  await db.insert(auditLogs).values({
    action: "venue.create",
    actorUserId: input.createdById,
    entityType: "venue",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { name: input.name },
  });

  return row.id;
}

export async function createField(input: {
  venueId: string;
  name: string;
  surfaceType?: SurfaceType;
  capacity?: string;
  amenities?: string[];
  leagueId: string;
  createdById: string;
}): Promise<string> {
  const [row] = await db
    .insert(fields)
    .values({
      venueId: input.venueId,
      name: input.name,
      surfaceType: input.surfaceType ?? "grass",
      capacity: input.capacity ?? null,
      amenities: input.amenities ?? [],
    })
    .returning({ id: fields.id });

  await db.insert(auditLogs).values({
    action: "field.create",
    actorUserId: input.createdById,
    entityType: "field",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { venueId: input.venueId, name: input.name },
  });

  return row.id;
}

export async function setFieldAvailability(input: {
  fieldId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  effectiveDate?: string;
}): Promise<string> {
  if (
    !isValidTimeFormat(input.startTime) ||
    !isValidTimeFormat(input.endTime)
  ) {
    throw new Error("Times must be in HH:MM 24-hour format.");
  }
  if (!isValidTimeRange(input.startTime, input.endTime)) {
    throw new Error("Start time must be before end time.");
  }

  const [row] = await db
    .insert(fieldAvailability)
    .values({
      fieldId: input.fieldId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      isRecurring: input.isRecurring ?? true,
      effectiveDate: input.effectiveDate ?? null,
    })
    .returning({ id: fieldAvailability.id });

  return row.id;
}

// ── Weather cancellation ─────────────────────────────────────────────────────

export type CancellationResult = {
  venueId: string;
  venueName: string;
  cancelledCount: number;
};

/**
 * Plans a weather cancellation for all events at a venue on a date range.
 * Returns the count of affected events (actual cancellation would need
 * to call the event admin layer and fire M8 notifications).
 */
export function planWeatherCancellation(input: {
  venueId: string;
  venueName: string;
  startDate: string;
  endDate: string;
}): CancellationResult {
  // In production, this would query events at the venue in the date range
  // and return the actual count. For now, return the plan structure.
  return {
    venueId: input.venueId,
    venueName: input.venueName,
    cancelledCount: 0,
  };
}
