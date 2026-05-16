import {
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

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    timezone: text("timezone").notNull().default("UTC"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
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
    role: membershipRoleEnum("role").notNull().default("GUEST"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    uniqueIndex("league_members_unique").on(table.leagueId, table.userId),
    index("league_members_role_idx").on(table.leagueId, table.role),
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
    role: membershipRoleEnum("role").notNull().default("GUEST"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    uniqueIndex("team_members_unique").on(table.teamId, table.userId),
    index("team_members_role_idx").on(table.teamId, table.role),
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
