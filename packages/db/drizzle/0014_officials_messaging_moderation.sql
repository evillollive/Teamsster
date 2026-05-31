-- M14: Officials and game management
-- M15: In-app messaging threads
-- M16: Messaging safety, moderation, and retention

-- Add REFEREE to membership_role enum
ALTER TYPE "membership_role" ADD VALUE IF NOT EXISTS 'REFEREE' BEFORE 'PLAYER';

-- M14 enums and tables

DO $$ BEGIN
  CREATE TYPE "assignment_status" AS ENUM ('pending', 'confirmed', 'declined');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "game_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "event_id" uuid NOT NULL,
  "official_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "status" "assignment_status" NOT NULL DEFAULT 'pending',
  "assigned_by_id" uuid REFERENCES "users"("id"),
  "responded_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "game_assignments_league_idx" ON "game_assignments" ("league_id");
CREATE INDEX IF NOT EXISTS "game_assignments_event_idx" ON "game_assignments" ("event_id");
CREATE INDEX IF NOT EXISTS "game_assignments_official_idx" ON "game_assignments" ("official_user_id");

CREATE TABLE IF NOT EXISTS "game_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "event_id" uuid NOT NULL,
  "home_team_id" uuid REFERENCES "teams"("id"),
  "away_team_id" uuid REFERENCES "teams"("id"),
  "home_score" text,
  "away_score" text,
  "notes" text,
  "submitted_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "game_scores_league_idx" ON "game_scores" ("league_id");
CREATE INDEX IF NOT EXISTS "game_scores_event_idx" ON "game_scores" ("event_id");

CREATE TABLE IF NOT EXISTS "official_availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "day_of_week" text NOT NULL,
  "start_time" text,
  "end_time" text,
  "is_available" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "official_availability_user_idx" ON "official_availability" ("user_id");
CREATE INDEX IF NOT EXISTS "official_availability_league_idx" ON "official_availability" ("league_id");

-- M15 enums and tables

DO $$ BEGIN
  CREATE TYPE "conversation_type" AS ENUM ('dm', 'team', 'league');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "conversation_type" NOT NULL,
  "league_id" uuid REFERENCES "leagues"("id"),
  "team_id" uuid REFERENCES "teams"("id"),
  "title" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "conversations_league_idx" ON "conversations" ("league_id");
CREATE INDEX IF NOT EXISTS "conversations_team_idx" ON "conversations" ("team_id");

CREATE TABLE IF NOT EXISTS "conversation_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id"),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "last_read_at" timestamptz,
  "is_muted" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "conversation_members_conversation_idx" ON "conversation_members" ("conversation_id");
CREATE INDEX IF NOT EXISTS "conversation_members_user_idx" ON "conversation_members" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "conversation_members_unique" ON "conversation_members" ("conversation_id", "user_id");

CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id"),
  "sender_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "content" text NOT NULL,
  "edited_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "messages_conversation_idx" ON "messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "messages_sender_idx" ON "messages" ("sender_user_id");
CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages" ("created_at");

-- M16 enums and tables

DO $$ BEGIN
  CREATE TYPE "flag_status" AS ENUM ('pending', 'reviewed', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "moderation_action_type" AS ENUM ('mute', 'unmute', 'warn', 'restrict');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "message_flags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "message_id" uuid NOT NULL REFERENCES "messages"("id"),
  "flagged_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "reason" text,
  "status" "flag_status" NOT NULL DEFAULT 'pending',
  "reviewed_by_id" uuid REFERENCES "users"("id"),
  "review_notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "message_flags_message_idx" ON "message_flags" ("message_id");
CREATE INDEX IF NOT EXISTS "message_flags_status_idx" ON "message_flags" ("status");

CREATE TABLE IF NOT EXISTS "moderation_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "target_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "action" "moderation_action_type" NOT NULL,
  "reason" text,
  "expires_at" timestamptz,
  "actor_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "moderation_actions_league_idx" ON "moderation_actions" ("league_id");
CREATE INDEX IF NOT EXISTS "moderation_actions_target_idx" ON "moderation_actions" ("target_user_id");

CREATE TABLE IF NOT EXISTS "messaging_policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "minor_dm_restriction" text NOT NULL DEFAULT 'team_threads_only',
  "retention_days" text,
  "updated_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "messaging_policies_league_unique" ON "messaging_policies" ("league_id");
