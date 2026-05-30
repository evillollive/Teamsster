import type { TemplatePayload, TemplateType } from "@teamsster/db";
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  getTemplateById,
  getTemplatesByLeague,
  getTemplatesByTeam,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  updateTemplate,
} from "@teamsster/db";
import { z } from "zod";

import { canAccessFeature } from "@/lib/permissions";

// ── Validation ───────────────────────────────────────────────────────────────

export const templateTypeSchema = z.enum([
  "event",
  "announcement",
  "registration_form",
  "volunteer_opportunity",
]);

export const templatePayloadSchema = z.object({
  fields: z.record(z.string(), z.unknown()),
  description: z.string().max(500).optional(),
});

export const createTemplateSchema = z.object({
  leagueId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  type: templateTypeSchema,
  name: z.string().trim().min(1).max(200),
  payload: templatePayloadSchema,
});

export const updateTemplateSchema = z.object({
  templateId: z.string().uuid(),
  leagueId: z.string().uuid(),
  name: z.string().trim().min(1).max(200).optional(),
  payload: templatePayloadSchema.optional(),
});

// ── Labels ───────────────────────────────────────────────────────────────────

export const templateTypeLabels: Record<TemplateType, string> = {
  event: "Event",
  announcement: "Announcement",
  registration_form: "Registration Form",
  volunteer_opportunity: "Volunteer Opportunity",
};

// ── Sanitization ─────────────────────────────────────────────────────────────

const DANGEROUS_KEYS = ["__proto__", "constructor", "prototype"];

/**
 * Sanitizes a template payload by removing dangerous keys and limiting depth.
 */
export function sanitizeTemplatePayload(
  payload: TemplatePayload,
): TemplatePayload {
  function sanitizeValue(value: unknown, depth = 0): unknown {
    if (depth > 5) return null;
    if (value === null || value === undefined) return value;
    if (typeof value === "string") return value.slice(0, 5000);
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) {
      return value.slice(0, 100).map((v) => sanitizeValue(v, depth + 1));
    }
    if (typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (DANGEROUS_KEYS.includes(k)) continue;
        result[k] = sanitizeValue(v, depth + 1);
      }
      return result;
    }
    return null;
  }

  return {
    fields: sanitizeValue(payload.fields) as Record<string, unknown>,
    description: payload.description?.slice(0, 500),
  };
}

// ── Auth-gated operations ────────────────────────────────────────────────────

async function resolveAndAuthorize(authUserId: string, leagueId: string) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }

  const membership = await getUserLeagueMembership(leagueId, userId);
  if (
    !membership ||
    !canAccessFeature("league.manage", { orgRoles: membership.roles })
  ) {
    throw new Error("You do not have permission to manage templates.");
  }

  return userId;
}

export async function getTemplatesForLeagueAsUser(
  authUserId: string,
  leagueId: string,
  type?: TemplateType,
) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) return [];

  const membership = await getUserLeagueMembership(leagueId, userId);
  if (!membership) return [];

  return getTemplatesByLeague(leagueId, type);
}

export async function getTemplatesForTeamAsUser(
  authUserId: string,
  leagueId: string,
  teamId: string,
  type?: TemplateType,
) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) return [];

  const membership = await getUserLeagueMembership(leagueId, userId);
  if (!membership) return [];

  const [leagueTemplates, teamTemplates] = await Promise.all([
    getTemplatesByLeague(leagueId, type),
    getTemplatesByTeam(teamId, type),
  ]);

  // Team templates override league templates with the same name
  const teamNames = new Set(teamTemplates.map((t) => t.name));
  const filtered = leagueTemplates.filter((t) => !teamNames.has(t.name));

  return [...teamTemplates, ...filtered];
}

export async function createTemplateForUser(
  authUserId: string,
  input: z.infer<typeof createTemplateSchema>,
) {
  const parsed = createTemplateSchema.parse(input);
  const userId = await resolveAndAuthorize(authUserId, parsed.leagueId);

  return createTemplate({
    leagueId: parsed.leagueId,
    teamId: parsed.teamId,
    type: parsed.type,
    name: parsed.name,
    payload: sanitizeTemplatePayload(parsed.payload),
    createdById: userId,
  });
}

export async function updateTemplateForUser(
  authUserId: string,
  input: z.infer<typeof updateTemplateSchema>,
) {
  const parsed = updateTemplateSchema.parse(input);
  const userId = await resolveAndAuthorize(authUserId, parsed.leagueId);

  await updateTemplate({
    templateId: parsed.templateId,
    leagueId: parsed.leagueId,
    name: parsed.name,
    payload: parsed.payload
      ? sanitizeTemplatePayload(parsed.payload)
      : undefined,
    actorUserId: userId,
  });
}

export async function duplicateTemplateForUser(
  authUserId: string,
  input: {
    templateId: string;
    leagueId: string;
    teamId?: string;
    newName: string;
  },
) {
  const userId = await resolveAndAuthorize(authUserId, input.leagueId);

  return duplicateTemplate({
    templateId: input.templateId,
    leagueId: input.leagueId,
    teamId: input.teamId,
    newName: input.newName.trim().slice(0, 200),
    actorUserId: userId,
  });
}

export async function deleteTemplateForUser(
  authUserId: string,
  input: { templateId: string; leagueId: string },
) {
  const userId = await resolveAndAuthorize(authUserId, input.leagueId);

  await deleteTemplate({
    templateId: input.templateId,
    leagueId: input.leagueId,
    actorUserId: userId,
  });
}

export async function getTemplatePreview(templateId: string) {
  return getTemplateById(templateId);
}
