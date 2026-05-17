import {
  archivePlayer,
  archivePlayerContact,
  bulkCreatePlayers,
  createPlayer,
  createPlayerContact,
  getPlayerContactsByTeamId,
  getPlayersByTeamId,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  getUserTeamMembership,
  updatePlayer,
} from "@teamsster/db";
import { z } from "zod";

import { timezoneSchema } from "@/lib/account";
import { canEditRoster, canManageLeague } from "@/lib/permissions";

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
    relationship: optionalTextSchema(120),
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
      .optional()
      .transform((value) => value || undefined),
    isPrimary: z.boolean().default(false),
  })
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

export const importPlayersCsvSchema = z.object({
  csv: z.string().trim().min(1).max(200_000),
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
  timezone: timezoneSchema,
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type CreatePlayerContactInput = z.infer<
  typeof createPlayerContactSchema
>;
type ImportPlayersCsvInput = z.infer<typeof importPlayersCsvSchema>;

const supportedImportColumns = [
  "firstName",
  "lastName",
  "preferredName",
  "jerseyNumber",
  "eligibilityStatus",
  "eligibilityNotes",
  "profilePronouns",
  "profilePrimaryPosition",
  "profileNotes",
  "timezone",
] as const;
const requiredImportColumns = ["firstName", "lastName"] as const;
type SupportedImportColumn = (typeof supportedImportColumns)[number];

type CsvRow = {
  lineNumber: number;
  values: string[];
};

function parseCsvLine(line: string, lineNumber: number): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  let index = 0;

  while (index < line.length) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }

    index += 1;
  }

  if (inQuotes) {
    throw new Error(`CSV row ${lineNumber} has an unmatched quote.`);
  }

  values.push(current.trim());
  return values;
}

export function parsePlayerImportCsv(csv: string): {
  header: string[];
  rows: CsvRow[];
} {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error(
      "CSV must include a header row and at least one player row.",
    );
  }

  const header = parseCsvLine(lines[0], 1);
  const rows = lines.slice(1).map((line, index) => ({
    lineNumber: index + 2,
    values: parseCsvLine(line, index + 2),
  }));

  return { header, rows };
}

type ValidatedImportPlayer = {
  firstName: string;
  lastName: string;
  preferredName: string | undefined;
  jerseyNumber: string | undefined;
  eligibilityStatus: z.infer<typeof eligibilityStatusSchema>;
  eligibilityNotes: string | undefined;
  profilePronouns: string | undefined;
  profilePrimaryPosition: string | undefined;
  profileNotes: string | undefined;
  timezone: string;
};

export function validatePlayerImportCsv(input: ImportPlayersCsvInput): {
  players: ValidatedImportPlayer[];
} {
  const { csv, leagueId, teamId, timezone } = input;
  const { header, rows } = parsePlayerImportCsv(csv);
  const errors: string[] = [];
  const normalizedHeader = header.map((column) => column.trim());

  for (const requiredColumn of requiredImportColumns) {
    if (!normalizedHeader.includes(requiredColumn)) {
      errors.push(`Missing required "${requiredColumn}" column in CSV header.`);
    }
  }

  for (const column of normalizedHeader) {
    if (!(supportedImportColumns as readonly string[]).includes(column)) {
      errors.push(`Unsupported "${column}" column in CSV header.`);
    }
  }

  const columnIndexByName = new Map<string, number>(
    normalizedHeader.map((column, index) => [column, index]),
  );
  const getColumnValue = (values: string[], column: SupportedImportColumn) => {
    const columnIndex = columnIndexByName.get(column);
    return columnIndex === undefined ? undefined : values[columnIndex];
  };
  const mappedRows: ValidatedImportPlayer[] = [];

  for (const row of rows) {
    if (row.values.length !== normalizedHeader.length) {
      errors.push(
        `Row ${row.lineNumber} has ${row.values.length} value(s); expected ${normalizedHeader.length}.`,
      );
      continue;
    }

    const parsed = createPlayerSchema.safeParse({
      firstName: getColumnValue(row.values, "firstName") ?? "",
      eligibilityNotes: getColumnValue(row.values, "eligibilityNotes"),
      eligibilityStatus:
        getColumnValue(row.values, "eligibilityStatus") ?? "PENDING",
      jerseyNumber: getColumnValue(row.values, "jerseyNumber"),
      lastName: getColumnValue(row.values, "lastName") ?? "",
      leagueId,
      profileNotes: getColumnValue(row.values, "profileNotes"),
      profilePrimaryPosition: getColumnValue(
        row.values,
        "profilePrimaryPosition",
      ),
      profilePronouns: getColumnValue(row.values, "profilePronouns"),
      preferredName: getColumnValue(row.values, "preferredName"),
      teamId,
      timezone: getColumnValue(row.values, "timezone") || timezone,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const rowErrors = [
        ...flat.formErrors,
        ...Object.entries(flat.fieldErrors).flatMap(([field, messages]) =>
          (messages ?? []).map((message) => `${field}: ${message}`),
        ),
      ];
      errors.push(
        ...rowErrors.map(
          (message) => `Row ${row.lineNumber} validation error: ${message}`,
        ),
      );
      continue;
    }

    mappedRows.push({
      firstName: parsed.data.firstName,
      eligibilityNotes: parsed.data.eligibilityNotes,
      eligibilityStatus: parsed.data.eligibilityStatus,
      jerseyNumber: parsed.data.jerseyNumber,
      lastName: parsed.data.lastName,
      profileNotes: parsed.data.profileNotes,
      profilePrimaryPosition: parsed.data.profilePrimaryPosition,
      profilePronouns: parsed.data.profilePronouns,
      preferredName: parsed.data.preferredName,
      timezone: parsed.data.timezone,
    });
  }

  if (errors.length > 0) {
    throw new Error(`CSV validation failed:\n${errors.join("\n")}`);
  }

  return { players: mappedRows };
}

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

  if (canManageLeague(leagueMembership.roles)) {
    return;
  }

  const teamMembership = await getUserTeamMembership(teamId, userId);
  if (!teamMembership || !canEditRoster(teamMembership.roles)) {
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

export async function importPlayersFromCsvForUser(
  authUserId: string,
  input: ImportPlayersCsvInput,
) {
  const parsed = importPlayersCsvSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);
  const { players } = validatePlayerImportCsv(parsed);

  return bulkCreatePlayers({
    leagueId: parsed.leagueId,
    players,
    teamId: parsed.teamId,
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

export async function createPlayerContactForUser(
  authUserId: string,
  input: CreatePlayerContactInput,
) {
  const parsed = createPlayerContactSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  await assertRosterEditor(parsed.leagueId, parsed.teamId, userId);

  await createPlayerContact({
    email: parsed.email,
    firstName: parsed.firstName,
    isPrimary: parsed.isPrimary,
    lastName: parsed.lastName,
    leagueId: parsed.leagueId,
    phone: parsed.phone,
    playerId: parsed.playerId,
    relationship: parsed.relationship,
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
