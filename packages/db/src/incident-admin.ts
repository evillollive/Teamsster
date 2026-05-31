import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import { encryptField } from "./compliance-admin";
import type { IncidentSeverity, IncidentType } from "./schema";
import { auditLogs, incidentReports } from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type IncidentReportSummary = {
  id: string;
  leagueId: string;
  eventId: string | null;
  teamId: string | null;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  narrative: string;
  involvedParties: Array<{ name: string; role: string; userId?: string }>;
  reportedById: string;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

type InvolvedParty = { name: string; role: string; userId?: string };

// ── Validation ───────────────────────────────────────────────────────────────

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  injury: "Injury",
  conduct: "Conduct",
  facility: "Facility",
  other: "Other",
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  minor: "Minor",
  moderate: "Moderate",
  serious: "Serious",
  critical: "Critical",
};

export function validateIncidentReport(input: {
  title: string;
  narrative: string;
  type: string;
  severity: string;
}): string[] {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push("Title is required.");
  if (input.title.length > 200)
    errors.push("Title must be 200 characters or less.");
  if (!input.narrative.trim()) errors.push("Narrative is required.");
  if (input.narrative.length > 10_000)
    errors.push("Narrative must be 10,000 characters or less.");
  if (!["injury", "conduct", "facility", "other"].includes(input.type)) {
    errors.push("Invalid incident type.");
  }
  if (!["minor", "moderate", "serious", "critical"].includes(input.severity)) {
    errors.push("Invalid severity level.");
  }
  return errors;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getIncidentsByLeague(
  leagueId: string,
  type?: IncidentType,
): Promise<IncidentReportSummary[]> {
  const conditions = [
    eq(incidentReports.leagueId, leagueId),
    isNull(incidentReports.deletedAt),
  ];
  if (type) conditions.push(eq(incidentReports.type, type));

  return db
    .select({
      id: incidentReports.id,
      leagueId: incidentReports.leagueId,
      eventId: incidentReports.eventId,
      teamId: incidentReports.teamId,
      type: incidentReports.type,
      severity: incidentReports.severity,
      title: incidentReports.title,
      narrative: incidentReports.narrative,
      involvedParties: incidentReports.involvedParties,
      reportedById: incidentReports.reportedById,
      reviewedById: incidentReports.reviewedById,
      reviewedAt: incidentReports.reviewedAt,
      createdAt: incidentReports.createdAt,
    })
    .from(incidentReports)
    .where(and(...conditions))
    .orderBy(incidentReports.createdAt);
}

export async function getIncidentById(
  reportId: string,
): Promise<IncidentReportSummary | null> {
  const rows = await db
    .select({
      id: incidentReports.id,
      leagueId: incidentReports.leagueId,
      eventId: incidentReports.eventId,
      teamId: incidentReports.teamId,
      type: incidentReports.type,
      severity: incidentReports.severity,
      title: incidentReports.title,
      narrative: incidentReports.narrative,
      involvedParties: incidentReports.involvedParties,
      reportedById: incidentReports.reportedById,
      reviewedById: incidentReports.reviewedById,
      reviewedAt: incidentReports.reviewedAt,
      createdAt: incidentReports.createdAt,
    })
    .from(incidentReports)
    .where(
      and(eq(incidentReports.id, reportId), isNull(incidentReports.deletedAt)),
    )
    .limit(1);
  return rows[0] ?? null;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function fileIncidentReport(input: {
  leagueId: string;
  eventId?: string;
  teamId?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  narrative: string;
  medicalDetails?: string;
  encryptionKey?: Buffer;
  involvedParties?: InvolvedParty[];
  reportedById: string;
}): Promise<string> {
  const errors = validateIncidentReport({
    title: input.title,
    narrative: input.narrative,
    type: input.type,
    severity: input.severity,
  });
  if (errors.length > 0) throw new Error(errors.join(" "));

  let encryptedMedical: string | null = null;
  if (input.medicalDetails && input.encryptionKey) {
    encryptedMedical = encryptField(input.medicalDetails, input.encryptionKey);
  }

  const [row] = await db
    .insert(incidentReports)
    .values({
      leagueId: input.leagueId,
      eventId: input.eventId ?? null,
      teamId: input.teamId ?? null,
      type: input.type,
      severity: input.severity,
      title: input.title.trim().slice(0, 200),
      narrative: input.narrative.trim().slice(0, 10_000),
      encryptedMedicalDetails: encryptedMedical,
      involvedParties: input.involvedParties ?? [],
      reportedById: input.reportedById,
    })
    .returning({ id: incidentReports.id });

  await db.insert(auditLogs).values({
    action: "incident.file",
    actorUserId: input.reportedById,
    entityType: "incident_report",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { type: input.type, severity: input.severity },
  });

  return row.id;
}

export async function reviewIncidentReport(input: {
  reportId: string;
  reviewedById: string;
  leagueId: string;
}): Promise<void> {
  await db
    .update(incidentReports)
    .set({
      reviewedById: input.reviewedById,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(incidentReports.id, input.reportId),
        isNull(incidentReports.deletedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: "incident.review",
    actorUserId: input.reviewedById,
    entityType: "incident_report",
    entityId: input.reportId,
    leagueId: input.leagueId,
    metadata: {},
  });
}

// ── Export ────────────────────────────────────────────────────────────────────

/**
 * Sanitizes a value for CSV export (formula injection prevention).
 */
function sanitizeCsvCell(value: string): string {
  const cleaned = value.replace(/[\r\n]/g, " ").trim();
  if (/^[=+\-@]/.test(cleaned)) return `'${cleaned}`;
  return cleaned;
}

/**
 * Generates a CSV export of incident reports.
 */
export function generateIncidentCsv(reports: IncidentReportSummary[]): string {
  const header = "Date,Type,Severity,Title,Narrative,Involved Parties";
  const rows = reports.map((r) => {
    const parties = r.involvedParties
      .map((p) => `${p.name} (${p.role})`)
      .join("; ");
    return [
      `"${sanitizeCsvCell(r.createdAt.toISOString().slice(0, 10))}"`,
      `"${sanitizeCsvCell(r.type)}"`,
      `"${sanitizeCsvCell(r.severity)}"`,
      `"${sanitizeCsvCell(r.title)}"`,
      `"${sanitizeCsvCell(r.narrative.slice(0, 500))}"`,
      `"${sanitizeCsvCell(parties)}"`,
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
