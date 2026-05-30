import type { PlayerContactSummary } from "@teamsster/db";
import {
  archivePlayer,
  archivePlayerContact,
  createPlayer,
  createPlayerContact,
  getPlayerContactsByTeamId,
  getPlayersByTeamId,
  getTeamCaptains,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  getUserTeamMembership,
  updatePlayer,
} from "@teamsster/db";
import { z } from "zod";

import { timezoneSchema } from "@/lib/account";
import type {
  ContactVisibilityContext,
  PermissionContext,
} from "@/lib/permissions";
import {
  canAccessAction,
  canAccessFeature,
  canAccessField,
} from "@/lib/permissions";
import {
  formatRelationshipLabel,
  structuredRelationshipSchema,
} from "@/lib/relationship";
import { getTeamDetail } from "@/lib/team";

const playerNameSchema = z.string().trim().min(1).max(120);
const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);
const eligibilityStatusSchema = z.enum(["PENDING", "ELIGIBLE", "INELIGIBLE"]);
const optionalEligibilityNotesSchema = optionalTextSchema(500);
const optionalProfilePronounsSchema = optionalTextSchema(80);
const optionalProfilePositionSchema = optionalTextSchema(120);
const optionalProfileNotesSchema = optionalTextSchema(500);

export const createPlayerSchema = z.object({
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
  firstName: playerNameSchema,
  lastName: playerNameSchema,
  preferredName: optionalTextSchema(120),
  jerseyNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => value || undefined),
  eligibilityStatus: eligibilityStatusSchema.default("PENDING"),
  eligibilityNotes: optionalEligibilityNotesSchema,
  profilePronouns: optionalProfilePronounsSchema,
  profilePrimaryPosition: optionalProfilePositionSchema,
  profileNotes: optionalProfileNotesSchema,
  timezone: timezoneSchema,
});

export const updatePlayerSchema = z.object({
  playerId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
  firstName: playerNameSchema,
  lastName: playerNameSchema,
  preferredName: optionalTextSchema(120),
  jerseyNumber: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => value || undefined),
  eligibilityStatus: eligibilityStatusSchema.default("PENDING"),
  eligibilityNotes: optionalEligibilityNotesSchema,
  profilePronouns: optionalProfilePronounsSchema,
  profilePrimaryPosition: optionalProfilePositionSchema,
  profileNotes: optionalProfileNotesSchema,
  timezone: timezoneSchema,
});

export const archivePlayerSchema = z.object({
  playerId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export const createPlayerContactSchema = z
  .object({
    playerId: z.string().uuid(),
    leagueId: z.string().uuid(),
    teamId: z.string().uuid(),
    firstName: playerNameSchema,
    lastName: playerNameSchema,
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    phone: z
      .string()
      .trim()
      .max(32)
      .regex(/^[+\d\s().-]*$/, "Invalid phone number format")
      .optional()
      .transform((value) => value || undefined),
    isPrimary: z.boolean().default(false),
  })
  .merge(structuredRelationshipSchema)
  .refine(
    (value) => Boolean(value.email?.trim()) || Boolean(value.phone?.trim()),
    {
      message: "Provide at least one contact method.",
      path: ["email"],
    },
  );

export const archivePlayerContactSchema = z.object({
  contactId: z.string().uuid(),
  playerId: z.string().uuid(),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type CreatePlayerContactInput = z.infer<
  typeof createPlayerContactSchema
>;
export type ContactActionPermissions = {
  canCall: boolean;
  canEmail: boolean;
  canExport: boolean;
  canSms: boolean;
};

async function resolveUserId(authUserId: string): Promise<string> {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }
  return userId;
}

async function assertRosterEditor(
  leagueId: string,
  teamId: string,
  userId: string,
): Promise<void> {
  const leagueMembership = await getUserLeagueMembership(leagueId, userId);

  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  if (canAccessFeature("roster.edit", { orgRoles: leagueMembership.roles })) {
    return;
  }

  const teamMembership = await getUserTeamMembership(teamId, userId);
  if (
    !teamMembership ||
    !canAccessFeature("roster.edit", {
      orgRoles: leagueMembership.roles,
      teamRoles: teamMembership.roles,
    })
  ) {
    throw new Error("You do not have permission to manage this roster.");
  }
}

export async function createPlayerForUser(
  authUserId: string,
  input: CreatePlayerInput,
) {
  const parsed = createPlayerSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  return createPlayer({
    firstName: parsed.firstName,
    eligibilityNotes: parsed.eligibilityNotes,
    eligibilityStatus: parsed.eligibilityStatus,
    jerseyNumber: parsed.jerseyNumber,
    lastName: parsed.lastName,
    leagueId: parsed.leagueId,
    profileMetadata: {
      notes: parsed.profileNotes,
      primaryPosition: parsed.profilePrimaryPosition,
      pronouns: parsed.profilePronouns,
    },
    preferredName: parsed.preferredName,
    teamId: parsed.teamId,
    timezone: parsed.timezone,
    userId,
  });
}

export async function updatePlayerForUser(
  authUserId: string,
  input: UpdatePlayerInput,
) {
  const parsed = updatePlayerSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  await updatePlayer({
    actorUserId: userId,
    eligibilityNotes: parsed.eligibilityNotes,
    eligibilityStatus: parsed.eligibilityStatus,
    firstName: parsed.firstName,
    jerseyNumber: parsed.jerseyNumber,
    lastName: parsed.lastName,
    leagueId: parsed.leagueId,
    playerId: parsed.playerId,
    profileMetadata: {
      notes: parsed.profileNotes,
      primaryPosition: parsed.profilePrimaryPosition,
      pronouns: parsed.profilePronouns,
    },
    preferredName: parsed.preferredName,
    teamId: parsed.teamId,
    timezone: parsed.timezone,
  });
}

export async function archivePlayerForUser(
  authUserId: string,
  playerId: string,
  leagueId: string,
  teamId: string,
) {
  const parsed = archivePlayerSchema.parse({ playerId, leagueId, teamId });
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  await archivePlayer({
    actorUserId: userId,
    leagueId: parsed.leagueId,
    playerId: parsed.playerId,
    teamId: parsed.teamId,
  });
}

export async function getPlayersForTeam(leagueId: string, teamId: string) {
  return getPlayersByTeamId(leagueId, teamId);
}

export async function getTeamRosterForUser(
  authUserId: string,
  leagueId: string,
  teamId: string,
) {
  const team = await getTeamDetail(authUserId, teamId);
  if (!team || team.leagueId !== leagueId) {
    return null;
  }

  const [players, contacts, contactActionPermissions] = await Promise.all([
    getPlayersForTeam(leagueId, teamId),
    getPlayerContactsForTeamAsUser(authUserId, leagueId, teamId),
    getContactActionPermissionsForTeamAsUser(authUserId, leagueId, teamId),
  ]);

  return {
    contactActionPermissions,
    contacts,
    players,
    team,
  };
}

export async function createPlayerContactForUser(
  authUserId: string,
  input: CreatePlayerContactInput,
) {
  const parsed = createPlayerContactSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  const customRelationship =
    parsed.relationshipType === "other"
      ? parsed.customRelationship?.trim() || undefined
      : undefined;

  await createPlayerContact({
    customRelationship,
    email: parsed.email,
    firstName: parsed.firstName,
    isEmergencyContact: parsed.isEmergencyContact,
    isPrimary: parsed.isPrimary,
    lastName: parsed.lastName,
    leagueId: parsed.leagueId,
    phone: parsed.phone,
    playerId: parsed.playerId,
    relationship: formatRelationshipLabel({
      customRelationship,
      relationshipType: parsed.relationshipType,
    }),
    relationshipType: parsed.relationshipType,
    teamId: parsed.teamId,
    userId,
  });
}

export async function archivePlayerContactForUser(
  authUserId: string,
  contactId: string,
  playerId: string,
  leagueId: string,
  teamId: string,
) {
  const parsed = archivePlayerContactSchema.parse({
    contactId,
    leagueId,
    playerId,
    teamId,
  });
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  await archivePlayerContact({
    actorUserId: userId,
    contactId: parsed.contactId,
    leagueId: parsed.leagueId,
    playerId: parsed.playerId,
    teamId: parsed.teamId,
  });
}

export async function getPlayerContactsForTeam(
  leagueId: string,
  teamId: string,
) {
  return getPlayerContactsByTeamId(leagueId, teamId);
}

export function applyContactFieldMask(
  contact: PlayerContactSummary,
  context: ContactVisibilityContext,
): PlayerContactSummary {
  return {
    ...contact,
    email: canAccessField("contact.viewEmail", context) ? contact.email : null,
    phone: canAccessField("contact.viewPhone", context) ? contact.phone : null,
  };
}

export function getContactActionPermissions(
  context: PermissionContext,
): ContactActionPermissions {
  return {
    canCall: canAccessAction("contact.call", context),
    canEmail: canAccessAction("contact.email", context),
    canExport: canAccessAction("contact.export", context),
    canSms: canAccessAction("contact.sms", context),
  };
}

export async function getPlayerContactsForTeamAsUser(
  authUserId: string | null | undefined,
  leagueId: string,
  teamId: string,
): Promise<PlayerContactSummary[]> {
  const contacts = await getPlayerContactsByTeamId(leagueId, teamId);

  if (!authUserId) {
    return contacts.map((c) =>
      applyContactFieldMask(c, { orgRoles: [], teamRoles: [] }),
    );
  }

  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    return contacts.map((c) =>
      applyContactFieldMask(c, { orgRoles: [], teamRoles: [] }),
    );
  }

  const [leagueMembership, teamMembership, captains] = await Promise.all([
    getUserLeagueMembership(leagueId, userId),
    getUserTeamMembership(teamId, userId),
    getTeamCaptains(teamId),
  ]);

  const captainEntry = captains.find((c) => c.userId === userId);
  const context: ContactVisibilityContext = {
    orgRoles: leagueMembership?.roles ?? [],
    teamRoles: teamMembership?.roles ?? [],
    isCaptainOnTeam: Boolean(captainEntry),
    captainPermissionLevel: captainEntry?.captainPermissionLevel ?? null,
  };

  return contacts.map((c) => applyContactFieldMask(c, context));
}

export async function getContactActionPermissionsForTeamAsUser(
  authUserId: string | null | undefined,
  leagueId: string,
  teamId: string,
): Promise<ContactActionPermissions> {
  if (!authUserId) {
    return getContactActionPermissions({ orgRoles: [], teamRoles: [] });
  }

  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    return getContactActionPermissions({ orgRoles: [], teamRoles: [] });
  }

  const [leagueMembership, teamMembership] = await Promise.all([
    getUserLeagueMembership(leagueId, userId),
    getUserTeamMembership(teamId, userId),
  ]);

  return getContactActionPermissions({
    orgRoles: leagueMembership?.roles ?? [],
    teamRoles: teamMembership?.roles ?? [],
  });
}
