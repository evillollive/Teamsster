import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleValues = [
  "OWNER",
  "ADMIN",
  "HEAD_COACH",
  "COACH",
  "BOARD_MEMBER",
  "PLAYER",
  "PARENT",
  "GUEST",
] as const;

export const membershipRoleEnum = pgEnum("membership_role", roleValues);

export const playerEligibilityStatusValues = [
  "PENDING",
  "ELIGIBLE",
  "INELIGIBLE",
] as const;
export const playerEligibilityStatusEnum = pgEnum(
  "player_eligibility_status",
  playerEligibilityStatusValues,
);

export type NotificationPreferences = {
  emailAnnouncements: boolean;
  eventReminders: boolean;
  weeklyDigest: boolean;
};

export type PlayerProfileMetadata = {
  notes?: string;
  primaryPosition?: string;
  pronouns?: string;
};

const timestampColumns = {
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
};

const softDeleteColumns = {
  deletedAt: timestamp("deleted_at", { mode: "date", withTimezone: true }),
  deletedById: uuid("deleted_by_id"),
};

export const authUsers = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("auth_user_email_unique").on(table.email)],
);

export const authSessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_session_token_unique").on(table.token),
    index("auth_session_user_idx").on(table.userId),
  ],
);

export const authAccounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_account_provider_unique").on(
      table.providerId,
      table.accountId,
    ),
    index("auth_account_user_idx").on(table.userId),
  ],
);

export const authVerifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("auth_verification_identifier_idx").on(table.identifier)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: text("auth_user_id").references(() => authUsers.id),
    email: text("email").notNull(),
    displayName: text("display_name"),
    timezone: text("timezone").notNull().default("UTC"),
    notificationPreferences: jsonb("notification_preferences")
      .$type<NotificationPreferences>()
      .notNull()
      .default(
        sql`'{"emailAnnouncements":true,"eventReminders":true,"weeklyDigest":false}'::jsonb`,
      ),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_auth_user_id_unique").on(table.authUserId),
  ],
);

export const leagues = pgTable(
  "leagues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").notNull().default("UTC"),
    createdById: uuid("created_by_id"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [uniqueIndex("leagues_slug_unique").on(table.slug)],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").notNull().default("UTC"),
    createdById: uuid("created_by_id"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    uniqueIndex("teams_league_slug_unique").on(table.leagueId, table.slug),
    index("teams_league_idx").on(table.leagueId),
  ],
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    preferredName: text("preferred_name"),
    jerseyNumber: text("jersey_number"),
    eligibilityStatus: playerEligibilityStatusEnum("eligibility_status")
      .notNull()
      .default("PENDING"),
    eligibilityNotes: text("eligibility_notes"),
    profileMetadata: jsonb("profile_metadata")
      .$type<PlayerProfileMetadata>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    timezone: text("timezone").notNull().default("UTC"),
    createdById: uuid("created_by_id"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("players_league_idx").on(table.leagueId),
    index("players_team_idx").on(table.teamId),
  ],
);

export const playerContacts = pgTable(
  "player_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    relationship: text("relationship"),
    email: text("email"),
    phone: text("phone"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdById: uuid("created_by_id"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("player_contacts_league_idx").on(table.leagueId),
    index("player_contacts_team_idx").on(table.teamId),
    index("player_contacts_player_idx").on(table.playerId),
  ],
);

export const leagueMembers = pgTable(
  "league_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    roles: membershipRoleEnum("roles")
      .array()
      .notNull()
      .default(sql`ARRAY['GUEST']::membership_role[]`),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    uniqueIndex("league_members_unique").on(table.leagueId, table.userId),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    roles: membershipRoleEnum("roles")
      .array()
      .notNull()
      .default(sql`ARRAY['GUEST']::membership_role[]`),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    uniqueIndex("team_members_unique").on(table.teamId, table.userId),
  ],
);

export const leagueInvitations = pgTable(
  "league_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    email: text("email").notNull(),
    role: membershipRoleEnum("role").notNull().default("GUEST"),
    token: text("token").notNull(),
    invitedById: uuid("invited_by_id").references(() => users.id),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
    revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("league_invitations_token_unique").on(table.token),
    index("league_invitations_pending_idx").on(
      table.leagueId,
      table.email,
      table.expiresAt,
    ),
  ],
);

export const teamInvitations = pgTable(
  "team_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    email: text("email").notNull(),
    role: membershipRoleEnum("role").notNull().default("GUEST"),
    token: text("token").notNull(),
    invitedById: uuid("invited_by_id").references(() => users.id),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    acceptedAt: timestamp("accepted_at", { mode: "date", withTimezone: true }),
    revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("team_invitations_token_unique").on(table.token),
    index("team_invitations_pending_idx").on(
      table.teamId,
      table.email,
      table.expiresAt,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id").references(() => leagues.id),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    action: text("action").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ...timestampColumns,
  },
  (table) => [
    index("audit_logs_league_idx").on(table.leagueId, table.createdAt),
  ],
);

export function buildPersonalLeagueName(displayName?: string | null) {
  const trimmed = displayName?.trim();
  return trimmed ? `${trimmed}'s Personal League` : "Personal League";
}
