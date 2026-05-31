import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  date,
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
  "CAPTAIN",
  "REFEREE",
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

export const eventTypeValues = ["GAME", "PRACTICE", "GENERAL"] as const;
export const eventTypeEnum = pgEnum("event_type", eventTypeValues);

export const eventRecurrenceFrequencyValues = [
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
] as const;
export const eventRecurrenceFrequencyEnum = pgEnum(
  "event_recurrence_frequency",
  eventRecurrenceFrequencyValues,
);

export const eventRsvpStatusValues = ["YES", "NO", "MAYBE"] as const;
export const eventRsvpStatusEnum = pgEnum(
  "event_rsvp_status",
  eventRsvpStatusValues,
);

export const notificationDeliveryChannelValues = [
  "EMAIL",
  "IN_APP",
  "PUSH",
] as const;
export const notificationDeliveryChannelEnum = pgEnum(
  "notification_delivery_channel",
  notificationDeliveryChannelValues,
);

export const notificationEventTypeValues = [
  "ANNOUNCEMENT",
  "EVENT_REMINDER",
  "WEEKLY_DIGEST",
  "MESSAGE",
  "VOLUNTEER_REMINDER",
  "ASSIGNMENT",
  "REGISTRATION_DEADLINE",
] as const;
export const notificationDeliveryKindValues = notificationEventTypeValues;
export const notificationDeliveryKindEnum = pgEnum(
  "notification_delivery_kind",
  notificationDeliveryKindValues,
);

export const notificationDeliveryStatusValues = [
  "QUEUED",
  "SENT",
  "FAILED",
] as const;
export const notificationDeliveryStatusEnum = pgEnum(
  "notification_delivery_status",
  notificationDeliveryStatusValues,
);

export const accountTypeValues = ["standard", "minor"] as const;
export const accountTypeEnum = pgEnum("account_type", accountTypeValues);

export const relationshipTypeValues = [
  "parent",
  "guardian",
  "stepparent",
  "grandparent",
  "sibling",
  "coach",
  "other",
] as const;
export const relationshipTypeEnum = pgEnum(
  "relationship_type",
  relationshipTypeValues,
);

export const captainPermissionLevelValues = ["full", "restricted"] as const;
export const captainPermissionLevelEnum = pgEnum(
  "captain_permission_level",
  captainPermissionLevelValues,
);

export type NotificationEventType =
  (typeof notificationEventTypeValues)[number];
export type NotificationChannelPreference = {
  email: boolean;
  inApp: boolean;
  push: boolean;
};
export type NotificationPreferences = Record<
  NotificationEventType,
  NotificationChannelPreference
>;

type LegacyNotificationPreferences = {
  emailAnnouncements?: boolean;
  eventReminders?: boolean;
  weeklyDigest?: boolean;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  ANNOUNCEMENT: { email: true, inApp: true, push: false },
  EVENT_REMINDER: { email: true, inApp: true, push: true },
  WEEKLY_DIGEST: { email: false, inApp: true, push: false },
  MESSAGE: { email: true, inApp: true, push: true },
  VOLUNTEER_REMINDER: { email: true, inApp: true, push: true },
  ASSIGNMENT: { email: true, inApp: true, push: true },
  REGISTRATION_DEADLINE: { email: true, inApp: true, push: true },
};

export function normalizeNotificationPreferences(
  input?: NotificationPreferences | LegacyNotificationPreferences | null,
): NotificationPreferences {
  const cloneDefaults = (): NotificationPreferences => ({
    ANNOUNCEMENT: { ...defaultNotificationPreferences.ANNOUNCEMENT },
    EVENT_REMINDER: { ...defaultNotificationPreferences.EVENT_REMINDER },
    WEEKLY_DIGEST: { ...defaultNotificationPreferences.WEEKLY_DIGEST },
    MESSAGE: { ...defaultNotificationPreferences.MESSAGE },
    VOLUNTEER_REMINDER: {
      ...defaultNotificationPreferences.VOLUNTEER_REMINDER,
    },
    ASSIGNMENT: { ...defaultNotificationPreferences.ASSIGNMENT },
    REGISTRATION_DEADLINE: {
      ...defaultNotificationPreferences.REGISTRATION_DEADLINE,
    },
  });

  if (!input) {
    return cloneDefaults();
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "ANNOUNCEMENT" in input &&
    typeof input.ANNOUNCEMENT === "object"
  ) {
    const next = cloneDefaults();

    for (const key of notificationEventTypeValues) {
      const preference = input[key as keyof NotificationPreferences];
      if (preference && typeof preference === "object") {
        next[key] = {
          email: preference.email ?? defaultNotificationPreferences[key].email,
          inApp: preference.inApp ?? defaultNotificationPreferences[key].inApp,
          push: preference.push ?? defaultNotificationPreferences[key].push,
        };
      }
    }

    return next;
  }

  const legacy = input as LegacyNotificationPreferences;
  return {
    ...cloneDefaults(),
    ANNOUNCEMENT: {
      ...defaultNotificationPreferences.ANNOUNCEMENT,
      email:
        legacy.emailAnnouncements ??
        defaultNotificationPreferences.ANNOUNCEMENT.email,
    },
    EVENT_REMINDER: {
      ...defaultNotificationPreferences.EVENT_REMINDER,
      email:
        legacy.eventReminders ??
        defaultNotificationPreferences.EVENT_REMINDER.email,
    },
    WEEKLY_DIGEST: {
      ...defaultNotificationPreferences.WEEKLY_DIGEST,
      email:
        legacy.weeklyDigest ??
        defaultNotificationPreferences.WEEKLY_DIGEST.email,
    },
  };
}

export type PlayerProfileMetadata = {
  notes?: string;
  primaryPosition?: string;
  pronouns?: string;
};

export type EventRecurrenceRule = {
  frequency: (typeof eventRecurrenceFrequencyValues)[number];
  interval: number;
  until?: string;
  count?: number;
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
  deletedById: uuid("deleted_by_id").references((): AnyPgColumn => users.id),
};

export const authUsers = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    username: text("username"),
    displayUsername: text("display_username"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_user_email_unique").on(table.email),
    uniqueIndex("auth_user_username_unique").on(table.username),
  ],
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
    accountType: accountTypeEnum("account_type").notNull().default("standard"),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    timezone: text("timezone").notNull().default("UTC"),
    notificationPreferences: jsonb("notification_preferences")
      .$type<NotificationPreferences>()
      .notNull()
      .default(
        sql`'{"ANNOUNCEMENT":{"email":true,"inApp":true,"push":false},"EVENT_REMINDER":{"email":true,"inApp":true,"push":true},"WEEKLY_DIGEST":{"email":false,"inApp":true,"push":false},"MESSAGE":{"email":true,"inApp":true,"push":true},"VOLUNTEER_REMINDER":{"email":true,"inApp":true,"push":true},"ASSIGNMENT":{"email":true,"inApp":true,"push":true},"REGISTRATION_DEADLINE":{"email":true,"inApp":true,"push":true}}'::jsonb`,
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
    createdById: uuid("created_by_id").references(() => users.id),
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
    createdById: uuid("created_by_id").references(() => users.id),
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
    createdById: uuid("created_by_id").references(() => users.id),
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
    relationshipType: relationshipTypeEnum("relationship_type"),
    customRelationship: text("custom_relationship"),
    isEmergencyContact: boolean("is_emergency_contact")
      .notNull()
      .default(false),
    email: text("email"),
    phone: text("phone"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("player_contacts_league_idx").on(table.leagueId),
    index("player_contacts_team_idx").on(table.teamId),
    index("player_contacts_player_idx").on(table.playerId),
  ],
);

export const teamEvents = pgTable(
  "team_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    eventType: eventTypeEnum("event_type").notNull().default("GENERAL"),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: timestamp("starts_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    endsAt: timestamp("ends_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    timezone: text("timezone").notNull().default("UTC"),
    recurrenceRule: jsonb("recurrence_rule")
      .$type<EventRecurrenceRule>()
      .notNull()
      .default(sql`'{"frequency":"NONE","interval":1}'::jsonb`),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("team_events_league_idx").on(table.leagueId),
    index("team_events_team_idx").on(table.teamId),
    index("team_events_starts_at_idx").on(table.startsAt),
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
    captainPermissionLevel: captainPermissionLevelEnum(
      "captain_permission_level",
    ),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    uniqueIndex("team_members_unique").on(table.teamId, table.userId),
  ],
);

// ── Guardian-minor relationships ─────────────────────────────────────────────

export const guardianMinorLinks = pgTable(
  "guardian_minor_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guardianUserId: uuid("guardian_user_id")
      .notNull()
      .references(() => users.id),
    minorUserId: uuid("minor_user_id")
      .notNull()
      .references(() => users.id),
    relationship: text("relationship"),
    relationshipType: relationshipTypeEnum("relationship_type"),
    customRelationship: text("custom_relationship"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    uniqueIndex("guardian_minor_links_active_unique")
      .on(table.guardianUserId, table.minorUserId)
      .where(sql`deleted_at IS NULL`),
    uniqueIndex("guardian_minor_links_primary_unique")
      .on(table.minorUserId)
      .where(sql`is_primary AND deleted_at IS NULL`),
    index("guardian_minor_links_guardian_idx").on(table.guardianUserId),
    index("guardian_minor_links_minor_idx").on(table.minorUserId),
  ],
);

export const leagueRoleTemplates = pgTable(
  "league_role_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    label: text("label").notNull(),
    roles: membershipRoleEnum("roles")
      .array()
      .notNull()
      .default(sql`ARRAY['GUEST']::membership_role[]`),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("league_role_templates_label_unique").on(
      table.leagueId,
      table.label,
    ),
    index("league_role_templates_league_idx").on(table.leagueId),
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

export const teamEventRsvps = pgTable(
  "team_event_rsvps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => teamEvents.id),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: eventRsvpStatusEnum("status").notNull(),
    note: text("note"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("team_event_rsvps_event_user_unique").on(
      table.eventId,
      table.userId,
    ),
    index("team_event_rsvps_event_idx").on(table.eventId),
    index("team_event_rsvps_user_idx").on(table.userId),
  ],
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdById: uuid("created_by_id").references(() => users.id),
    publishedAt: timestamp("published_at", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("announcements_league_idx").on(table.leagueId),
    index("announcements_team_idx").on(table.teamId),
    index("announcements_published_at_idx").on(table.publishedAt),
  ],
);

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    kind: notificationDeliveryKindEnum("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    dedupeKey: text("dedupe_key"),
    scheduledFor: timestamp("scheduled_for", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ...timestampColumns,
  },
  (table) => [
    index("notification_events_league_idx").on(table.leagueId, table.createdAt),
    index("notification_events_kind_idx").on(table.kind, table.createdAt),
    uniqueIndex("notification_events_dedupe_key_unique").on(table.dedupeKey),
  ],
);

export const notificationFeedItems = pgTable(
  "notification_feed_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => notificationEvents.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    deliveredByFallback: boolean("delivered_by_fallback")
      .notNull()
      .default(false),
    readAt: timestamp("read_at", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ...timestampColumns,
  },
  (table) => [
    index("notification_feed_items_user_idx").on(
      table.userId,
      table.readAt,
      table.createdAt,
    ),
    index("notification_feed_items_event_idx").on(table.eventId),
    uniqueIndex("notification_feed_items_event_user_unique").on(
      table.eventId,
      table.userId,
    ),
  ],
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").references(() => notificationEvents.id),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    recipientUserId: uuid("recipient_user_id").references(() => users.id),
    recipient: text("recipient").notNull(),
    channel: notificationDeliveryChannelEnum("channel")
      .notNull()
      .default("EMAIL"),
    kind: notificationDeliveryKindEnum("kind").notNull(),
    status: notificationDeliveryStatusEnum("status").notNull().default("SENT"),
    templateSubject: text("template_subject").notNull(),
    templateBody: text("template_body").notNull(),
    sentAt: timestamp("sent_at", {
      mode: "date",
      withTimezone: true,
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ...timestampColumns,
  },
  (table) => [
    index("notification_deliveries_league_idx").on(
      table.leagueId,
      table.createdAt,
    ),
    index("notification_deliveries_event_idx").on(table.eventId),
    index("notification_deliveries_recipient_idx").on(table.recipient),
    index("notification_deliveries_status_idx").on(table.status),
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

// ── Minor account helpers ────────────────────────────────────────────────────

export const MINOR_EMAIL_DOMAIN = "minor.internal.teamsster.local";

export function buildMinorPlaceholderEmail(uniqueId: string) {
  return `minor-${uniqueId}@${MINOR_EMAIL_DOMAIN}`;
}

export function isMinorPlaceholderEmail(email: string) {
  return email.endsWith(`@${MINOR_EMAIL_DOMAIN}`);
}

// ── Relationship normalization ───────────────────────────────────────────────

type RelationshipType = (typeof relationshipTypeValues)[number];

const RELATIONSHIP_SYNONYMS: Record<string, RelationshipType> = {
  mom: "parent",
  mother: "parent",
  dad: "parent",
  father: "parent",
  parent: "parent",
  guardian: "guardian",
  "legal guardian": "guardian",
  stepparent: "stepparent",
  "step-parent": "stepparent",
  stepmom: "stepparent",
  "step-mom": "stepparent",
  "step mom": "stepparent",
  stepdad: "stepparent",
  "step-dad": "stepparent",
  "step dad": "stepparent",
  stepmother: "stepparent",
  stepfather: "stepparent",
  grandparent: "grandparent",
  grandma: "grandparent",
  grandmother: "grandparent",
  grandpa: "grandparent",
  grandfather: "grandparent",
  nana: "grandparent",
  nanny: "grandparent",
  sibling: "sibling",
  brother: "sibling",
  sister: "sibling",
  coach: "coach",
};

/**
 * Maps free-text relationship values to a structured type.
 * Returns the enum value and optional custom text for "other" results.
 */
export function normalizeRelationship(freeText: string | null | undefined): {
  relationshipType: RelationshipType;
  customRelationship: string | null;
} {
  if (!freeText?.trim()) {
    return { relationshipType: "other", customRelationship: null };
  }

  const normalized = freeText.trim().toLowerCase().replace(/\s+/g, " ");
  const mapped = RELATIONSHIP_SYNONYMS[normalized];

  if (mapped) {
    return { relationshipType: mapped, customRelationship: null };
  }

  return { relationshipType: "other", customRelationship: freeText.trim() };
}

// ── Captain role helpers ─────────────────────────────────────────────────────

/** Roles that are only valid on team memberships, not league memberships. */
export const TEAM_ONLY_ROLES: ReadonlySet<string> = new Set(["CAPTAIN"]);

/** Checks if a roles array includes the CAPTAIN role. */
export function isCaptain(roles: readonly string[]): boolean {
  return roles.includes("CAPTAIN");
}

// ── Push notification device tokens ──────────────────────────────────────────

export const devicePlatformValues = ["ios", "android", "web"] as const;
export const devicePlatformEnum = pgEnum(
  "device_platform",
  devicePlatformValues,
);

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    token: text("token").notNull(),
    platform: devicePlatformEnum("platform").notNull(),
    deviceName: text("device_name"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("device_tokens_token_unique").on(table.token),
    index("device_tokens_user_idx").on(table.userId),
  ],
);

// ── File uploads ─────────────────────────────────────────────────────────────

export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    uploadedById: uuid("uploaded_by_id")
      .notNull()
      .references(() => users.id),
    url: text("url").notNull(),
    pathname: text("pathname").notNull(),
    contentType: text("content_type"),
    sizeBytes: text("size_bytes"),
    purpose: text("purpose").notNull().default("general"),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("uploads_entity_idx").on(table.entityType, table.entityId),
    index("uploads_user_idx").on(table.uploadedById),
  ],
);

// ── Templates ────────────────────────────────────────────────────────────────

export const templateTypeValues = [
  "event",
  "announcement",
  "registration_form",
  "volunteer_opportunity",
] as const;

export const templateTypeEnum = pgEnum("template_type", templateTypeValues);

export type TemplateType = (typeof templateTypeValues)[number];

export type TemplatePayload = {
  /** Display fields pre-filled when using this template */
  fields: Record<string, unknown>;
  /** Optional description shown in template preview */
  description?: string;
};

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    type: templateTypeEnum("type").notNull(),
    name: text("name").notNull(),
    payload: jsonb("payload").$type<TemplatePayload>().notNull(),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("templates_league_idx").on(table.leagueId),
    index("templates_league_type_idx").on(table.leagueId, table.type),
    index("templates_team_idx").on(table.teamId),
  ],
);

// ── Seasons and registration ─────────────────────────────────────────────────

export const seasonStatusValues = [
  "draft",
  "open",
  "closed",
  "archived",
] as const;
export const seasonStatusEnum = pgEnum("season_status", seasonStatusValues);
export type SeasonStatus = (typeof seasonStatusValues)[number];

export const registrationStatusValues = [
  "not_started",
  "incomplete",
  "submitted",
  "approved",
  "rejected",
] as const;
export const registrationStatusEnum = pgEnum(
  "registration_status",
  registrationStatusValues,
);
export type RegistrationStatus = (typeof registrationStatusValues)[number];

export type RegistrationFormConfig = {
  requiredFields: string[];
  optionalFields: string[];
  customFields: Array<{
    key: string;
    label: string;
    type: "text" | "boolean" | "select";
    options?: string[];
    required: boolean;
  }>;
};

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    name: text("name").notNull(),
    year: text("year").notNull(),
    status: seasonStatusEnum("status").notNull().default("draft"),
    registrationOpensAt: timestamp("registration_opens_at", {
      mode: "date",
      withTimezone: true,
    }),
    registrationClosesAt: timestamp("registration_closes_at", {
      mode: "date",
      withTimezone: true,
    }),
    formConfig: jsonb("form_config")
      .$type<RegistrationFormConfig>()
      .notNull()
      .default(
        sql`'{"requiredFields":["firstName","lastName","guardianContact","emergencyContact"],"optionalFields":["address","medicalNotes"],"customFields":[]}'::jsonb`,
      ),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("seasons_league_idx").on(table.leagueId),
    index("seasons_league_status_idx").on(table.leagueId, table.status),
  ],
);

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    playerId: uuid("player_id").references(() => players.id),
    guardianUserId: uuid("guardian_user_id")
      .notNull()
      .references(() => users.id),
    status: registrationStatusEnum("status").notNull().default("not_started"),
    formData: jsonb("form_data")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    submittedAt: timestamp("submitted_at", {
      mode: "date",
      withTimezone: true,
    }),
    reviewedById: uuid("reviewed_by_id").references(() => users.id),
    reviewNotes: text("review_notes"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("registrations_season_idx").on(table.seasonId),
    index("registrations_league_idx").on(table.leagueId),
    index("registrations_guardian_idx").on(table.guardianUserId),
    index("registrations_status_idx").on(table.seasonId, table.status),
  ],
);

// ── Calendar subscriptions ───────────────────────────────────────────────────

export const calendarFeedTokens = pgTable(
  "calendar_feed_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    leagueId: uuid("league_id").references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    token: text("token").notNull(),
    revokedAt: timestamp("revoked_at", { mode: "date", withTimezone: true }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("calendar_feed_tokens_token_unique").on(table.token),
    index("calendar_feed_tokens_user_idx").on(table.userId),
  ],
);

// ── Waivers, medical, and compliance ─────────────────────────────────────────

export const paymentStatusValues = [
  "pending",
  "received",
  "comped",
  "scholarship",
] as const;
export const paymentStatusEnum = pgEnum("payment_status", paymentStatusValues);
export type PaymentStatus = (typeof paymentStatusValues)[number];

export type InsuranceRecord = {
  carrier: string;
  policyNumber: string;
  groupNumber?: string;
  insuredName: string;
};

export type WaiverMetadata = {
  waiverVersion: string;
  ipAddress: string;
  userAgent: string;
  signedByName: string;
  signedByRelationship?: string;
};

export const insuranceRecords = pgTable(
  "insurance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id),
    playerId: uuid("player_id").references(() => players.id),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    encryptedData: text("encrypted_data").notNull(),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
  },
  (table) => [
    index("insurance_records_registration_idx").on(table.registrationId),
    index("insurance_records_player_idx").on(table.playerId),
  ],
);

export const medicalNotes = pgTable(
  "medical_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id),
    playerId: uuid("player_id").references(() => players.id),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    encryptedNotes: text("encrypted_notes").notNull(),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
  },
  (table) => [
    index("medical_notes_registration_idx").on(table.registrationId),
    index("medical_notes_player_idx").on(table.playerId),
  ],
);

export const waiverSignatures = pgTable(
  "waiver_signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    signerUserId: uuid("signer_user_id")
      .notNull()
      .references(() => users.id),
    waiverText: text("waiver_text").notNull(),
    metadata: jsonb("metadata").$type<WaiverMetadata>().notNull(),
    signedAt: timestamp("signed_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestampColumns,
  },
  (table) => [
    index("waiver_signatures_registration_idx").on(table.registrationId),
    index("waiver_signatures_league_idx").on(table.leagueId),
    index("waiver_signatures_signer_idx").on(table.signerUserId),
  ],
);

export const registrationPayments = pgTable(
  "registration_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    status: paymentStatusEnum("status").notNull().default("pending"),
    amount: text("amount"),
    notes: text("notes"),
    updatedById: uuid("updated_by_id").references(() => users.id),
    ...timestampColumns,
  },
  (table) => [
    index("registration_payments_registration_idx").on(table.registrationId),
    index("registration_payments_league_idx").on(table.leagueId),
  ],
);

// ── Volunteer tracking ───────────────────────────────────────────────────────

export const volunteerOpportunities = pgTable(
  "volunteer_opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    eventId: uuid("event_id"),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: timestamp("starts_at", { mode: "date", withTimezone: true }),
    endsAt: timestamp("ends_at", { mode: "date", withTimezone: true }),
    slotsAvailable: text("slots_available").notNull().default("1"),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("volunteer_opportunities_league_idx").on(table.leagueId),
    index("volunteer_opportunities_team_idx").on(table.teamId),
  ],
);

export const volunteerSignups = pgTable(
  "volunteer_signups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => volunteerOpportunities.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    checkedInAt: timestamp("checked_in_at", {
      mode: "date",
      withTimezone: true,
    }),
    checkedOutAt: timestamp("checked_out_at", {
      mode: "date",
      withTimezone: true,
    }),
    manualHours: text("manual_hours"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("volunteer_signups_opportunity_idx").on(table.opportunityId),
    index("volunteer_signups_user_idx").on(table.userId),
  ],
);

export const volunteerRoleScopeValues = ["league", "team"] as const;
export const volunteerRoleScopeEnum = pgEnum(
  "volunteer_role_scope",
  volunteerRoleScopeValues,
);

export const volunteerRoles = pgTable(
  "volunteer_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    scope: volunteerRoleScopeEnum("scope").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("volunteer_roles_league_idx").on(table.leagueId),
    index("volunteer_roles_team_idx").on(table.teamId),
  ],
);

export const volunteerRoleAssignments = pgTable(
  "volunteer_role_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => volunteerRoles.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    seasonId: uuid("season_id").references(() => seasons.id),
    assignedById: uuid("assigned_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("volunteer_role_assignments_role_idx").on(table.roleId),
    index("volunteer_role_assignments_user_idx").on(table.userId),
  ],
);

// ── Officials and game management ────────────────────────────────────────────

export const assignmentStatusValues = [
  "pending",
  "confirmed",
  "declined",
] as const;
export const assignmentStatusEnum = pgEnum(
  "assignment_status",
  assignmentStatusValues,
);
export type AssignmentStatus = (typeof assignmentStatusValues)[number];

export const gameAssignments = pgTable(
  "game_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    eventId: uuid("event_id").notNull(),
    officialUserId: uuid("official_user_id")
      .notNull()
      .references(() => users.id),
    status: assignmentStatusEnum("status").notNull().default("pending"),
    assignedById: uuid("assigned_by_id").references(() => users.id),
    respondedAt: timestamp("responded_at", {
      mode: "date",
      withTimezone: true,
    }),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("game_assignments_league_idx").on(table.leagueId),
    index("game_assignments_event_idx").on(table.eventId),
    index("game_assignments_official_idx").on(table.officialUserId),
  ],
);

export const gameScores = pgTable(
  "game_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    eventId: uuid("event_id").notNull(),
    homeTeamId: uuid("home_team_id").references(() => teams.id),
    awayTeamId: uuid("away_team_id").references(() => teams.id),
    homeScore: text("home_score"),
    awayScore: text("away_score"),
    notes: text("notes"),
    submittedById: uuid("submitted_by_id")
      .notNull()
      .references(() => users.id),
    publishedAt: timestamp("published_at", {
      mode: "date",
      withTimezone: true,
    }),
    ...timestampColumns,
  },
  (table) => [
    index("game_scores_league_idx").on(table.leagueId),
    index("game_scores_event_idx").on(table.eventId),
  ],
);

export const officialAvailability = pgTable(
  "official_availability",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    dayOfWeek: text("day_of_week").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    isAvailable: boolean("is_available").notNull().default(true),
    ...timestampColumns,
  },
  (table) => [
    index("official_availability_user_idx").on(table.userId),
    index("official_availability_league_idx").on(table.leagueId),
  ],
);

// ── Messaging ────────────────────────────────────────────────────────────────

export const conversationTypeValues = ["dm", "team", "league"] as const;
export const conversationTypeEnum = pgEnum(
  "conversation_type",
  conversationTypeValues,
);
export type ConversationType = (typeof conversationTypeValues)[number];

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: conversationTypeEnum("type").notNull(),
    leagueId: uuid("league_id").references(() => leagues.id),
    teamId: uuid("team_id").references(() => teams.id),
    title: text("title"),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("conversations_league_idx").on(table.leagueId),
    index("conversations_team_idx").on(table.teamId),
  ],
);

export const conversationMembers = pgTable(
  "conversation_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lastReadAt: timestamp("last_read_at", {
      mode: "date",
      withTimezone: true,
    }),
    isMuted: boolean("is_muted").notNull().default(false),
    ...timestampColumns,
  },
  (table) => [
    index("conversation_members_conversation_idx").on(table.conversationId),
    index("conversation_members_user_idx").on(table.userId),
    uniqueIndex("conversation_members_unique").on(
      table.conversationId,
      table.userId,
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    editedAt: timestamp("edited_at", { mode: "date", withTimezone: true }),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_sender_idx").on(table.senderUserId),
    index("messages_created_at_idx").on(table.createdAt),
  ],
);

// ── Messaging safety and moderation ──────────────────────────────────────────

export const flagStatusValues = ["pending", "reviewed", "dismissed"] as const;
export const flagStatusEnum = pgEnum("flag_status", flagStatusValues);

export const messageFlags = pgTable(
  "message_flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id),
    flaggedById: uuid("flagged_by_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason"),
    status: flagStatusEnum("status").notNull().default("pending"),
    reviewedById: uuid("reviewed_by_id").references(() => users.id),
    reviewNotes: text("review_notes"),
    ...timestampColumns,
  },
  (table) => [
    index("message_flags_message_idx").on(table.messageId),
    index("message_flags_status_idx").on(table.status),
  ],
);

export const moderationActionValues = [
  "mute",
  "unmute",
  "warn",
  "restrict",
] as const;
export const moderationActionEnum = pgEnum(
  "moderation_action_type",
  moderationActionValues,
);

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => users.id),
    action: moderationActionEnum("action").notNull(),
    reason: text("reason"),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id),
    ...timestampColumns,
  },
  (table) => [
    index("moderation_actions_league_idx").on(table.leagueId),
    index("moderation_actions_target_idx").on(table.targetUserId),
  ],
);

export const messagingPolicies = pgTable(
  "messaging_policies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    minorDmRestriction: text("minor_dm_restriction")
      .notNull()
      .default("team_threads_only"),
    retentionDays: text("retention_days"),
    updatedById: uuid("updated_by_id").references(() => users.id),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("messaging_policies_league_unique").on(table.leagueId),
  ],
);

// ── Divisions and competitive levels ─────────────────────────────────────────

export const competitiveLevelValues = [
  "recreational",
  "competitive",
  "elite",
] as const;
export const competitiveLevelEnum = pgEnum(
  "competitive_level",
  competitiveLevelValues,
);
export type CompetitiveLevel = (typeof competitiveLevelValues)[number];

export const divisions = pgTable(
  "divisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id),
    name: text("name").notNull(),
    shortName: text("short_name"),
    minBirthYear: text("min_birth_year"),
    maxBirthYear: text("max_birth_year"),
    competitiveLevel: competitiveLevelEnum("competitive_level")
      .notNull()
      .default("recreational"),
    sortOrder: text("sort_order").notNull().default("0"),
    createdById: uuid("created_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("divisions_league_idx").on(table.leagueId),
    index("divisions_league_level_idx").on(
      table.leagueId,
      table.competitiveLevel,
    ),
  ],
);

export const teamDivisionAssignments = pgTable(
  "team_division_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    divisionId: uuid("division_id")
      .notNull()
      .references(() => divisions.id),
    seasonId: uuid("season_id").references(() => seasons.id),
    assignedById: uuid("assigned_by_id").references(() => users.id),
    ...timestampColumns,
    ...softDeleteColumns,
  },
  (table) => [
    index("team_division_assignments_team_idx").on(table.teamId),
    index("team_division_assignments_division_idx").on(table.divisionId),
    index("team_division_assignments_season_idx").on(table.seasonId),
  ],
);
