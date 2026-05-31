import type { RegistrationFormConfig, SeasonStatus } from "@teamsster/db";
import {
  createRegistration,
  createSeason,
  getRegistrationStatusCounts,
  getRegistrationsByGuardian,
  getRegistrationsBySeason,
  getSeasonById,
  getSeasonsByLeague,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  updateRegistrationFormData,
  updateSeasonFormConfig,
  updateSeasonStatus,
} from "@teamsster/db";
import { z } from "zod";

import { canAccessFeature } from "@/lib/permissions";

// ── Validation ───────────────────────────────────────────────────────────────

export const seasonStatusSchema = z.enum([
  "draft",
  "open",
  "closed",
  "archived",
]);

export const createSeasonSchema = z.object({
  leagueId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  year: z.string().trim().min(4).max(10),
  registrationOpensAt: z.coerce.date().optional(),
  registrationClosesAt: z.coerce.date().optional(),
});

export const customFieldSchema = z.object({
  key: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(200),
  type: z.enum(["text", "boolean", "select"]),
  options: z.array(z.string().max(100)).max(20).optional(),
  required: z.boolean(),
});

export const formConfigSchema = z.object({
  requiredFields: z.array(z.string().max(50)).max(20),
  optionalFields: z.array(z.string().max(50)).max(20),
  customFields: z.array(customFieldSchema).max(20),
});

export const registrationFormDataSchema = z.record(z.string(), z.unknown());

// ── Sanitization ─────────────────────────────────────────────────────────────

const DANGEROUS_PATTERNS = [/<script/i, /javascript:/i, /on\w+\s*=/i];

export function sanitizeRegistrationValue(value: unknown): unknown {
  if (typeof value === "string") {
    let sanitized = value.slice(0, 5000);
    for (const pattern of DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, "");
    }
    return sanitized;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value === null || value === undefined) return null;
  if (Array.isArray(value))
    return value.slice(0, 50).map(sanitizeRegistrationValue);
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeRegistrationValue(v);
    }
    return result;
  }
  return null;
}

export function sanitizeFormData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key.slice(0, 50)] = sanitizeRegistrationValue(value);
  }
  return result;
}

// ── Rate limiting ────────────────────────────────────────────────────────────

export const REGISTRATION_RATE_LIMIT = {
  maxSubmissionsPerHour: 10,
  windowMs: 60 * 60 * 1000,
} as const;

// ── Auth-gated operations ────────────────────────────────────────────────────

async function resolveAdminUser(authUserId: string, leagueId: string) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) throw new Error("User profile not found.");

  const membership = await getUserLeagueMembership(leagueId, userId);
  if (
    !membership ||
    !canAccessFeature("league.manage", { orgRoles: membership.roles })
  ) {
    throw new Error("You don't have permission to manage seasons.");
  }
  return userId;
}

export async function createSeasonForUser(
  authUserId: string,
  input: z.infer<typeof createSeasonSchema>,
) {
  const parsed = createSeasonSchema.parse(input);
  const userId = await resolveAdminUser(authUserId, parsed.leagueId);

  return createSeason({
    leagueId: parsed.leagueId,
    name: parsed.name,
    year: parsed.year,
    registrationOpensAt: parsed.registrationOpensAt,
    registrationClosesAt: parsed.registrationClosesAt,
    createdById: userId,
  });
}

export async function updateSeasonStatusForUser(
  authUserId: string,
  input: { seasonId: string; leagueId: string; status: SeasonStatus },
) {
  const userId = await resolveAdminUser(authUserId, input.leagueId);
  await updateSeasonStatus({
    seasonId: input.seasonId,
    leagueId: input.leagueId,
    status: input.status,
    actorUserId: userId,
  });
}

export async function updateFormConfigForUser(
  authUserId: string,
  input: {
    seasonId: string;
    leagueId: string;
    formConfig: RegistrationFormConfig;
  },
) {
  const parsed = formConfigSchema.parse(input.formConfig);
  const userId = await resolveAdminUser(authUserId, input.leagueId);
  await updateSeasonFormConfig({
    seasonId: input.seasonId,
    leagueId: input.leagueId,
    formConfig: parsed as RegistrationFormConfig,
    actorUserId: userId,
  });
}

export async function getSeasonsForUser(authUserId: string, leagueId: string) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) return [];
  const membership = await getUserLeagueMembership(leagueId, userId);
  if (!membership) return [];
  return getSeasonsByLeague(leagueId);
}

export async function getRegistrationDashboard(
  authUserId: string,
  seasonId: string,
) {
  const season = await getSeasonById(seasonId);
  if (!season) throw new Error("Season not found.");

  const _userId = await resolveAdminUser(authUserId, season.leagueId);
  const [allRegistrations, statusCounts] = await Promise.all([
    getRegistrationsBySeason(seasonId),
    getRegistrationStatusCounts(seasonId),
  ]);

  return { season, registrations: allRegistrations, statusCounts };
}

export async function submitRegistrationForUser(
  authUserId: string,
  input: {
    seasonId: string;
    leagueId: string;
    playerId?: string;
    formData: Record<string, unknown>;
  },
) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) throw new Error("User profile not found.");

  const sanitizedData = sanitizeFormData(input.formData);

  const existing = await getRegistrationsByGuardian(userId, input.seasonId);
  const match = existing.find(
    (r) => r.playerId === (input.playerId ?? null) && r.status !== "submitted",
  );

  if (match) {
    await updateRegistrationFormData({
      registrationId: match.id,
      formData: sanitizedData,
      status: "submitted",
    });
    return match.id;
  }

  const regId = await createRegistration({
    seasonId: input.seasonId,
    leagueId: input.leagueId,
    playerId: input.playerId,
    guardianUserId: userId,
    formData: sanitizedData,
  });

  await updateRegistrationFormData({
    registrationId: regId,
    formData: sanitizedData,
    status: "submitted",
  });

  return regId;
}

export async function getMyRegistrations(authUserId: string, seasonId: string) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) return [];
  return getRegistrationsByGuardian(userId, seasonId);
}
