-- M10: Seasonal registration schema
-- M12: Calendar subscription feed tokens

DO $$ BEGIN
  CREATE TYPE "season_status" AS ENUM ('draft', 'open', 'closed', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "registration_status" AS ENUM ('not_started', 'incomplete', 'submitted', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "seasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "name" text NOT NULL,
  "year" text NOT NULL,
  "status" "season_status" NOT NULL DEFAULT 'draft',
  "registration_opens_at" timestamptz,
  "registration_closes_at" timestamptz,
  "form_config" jsonb NOT NULL DEFAULT '{"requiredFields":["firstName","lastName","guardianContact","emergencyContact"],"optionalFields":["address","medicalNotes"],"customFields":[]}'::jsonb,
  "created_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "seasons_league_idx" ON "seasons" ("league_id");
CREATE INDEX IF NOT EXISTS "seasons_league_status_idx" ON "seasons" ("league_id", "status");

CREATE TABLE IF NOT EXISTS "registrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "season_id" uuid NOT NULL REFERENCES "seasons"("id"),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "player_id" uuid REFERENCES "players"("id"),
  "guardian_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "status" "registration_status" NOT NULL DEFAULT 'not_started',
  "form_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "submitted_at" timestamptz,
  "reviewed_by_id" uuid REFERENCES "users"("id"),
  "review_notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "registrations_season_idx" ON "registrations" ("season_id");
CREATE INDEX IF NOT EXISTS "registrations_league_idx" ON "registrations" ("league_id");
CREATE INDEX IF NOT EXISTS "registrations_guardian_idx" ON "registrations" ("guardian_user_id");
CREATE INDEX IF NOT EXISTS "registrations_status_idx" ON "registrations" ("season_id", "status");

CREATE TABLE IF NOT EXISTS "calendar_feed_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "league_id" uuid REFERENCES "leagues"("id"),
  "team_id" uuid REFERENCES "teams"("id"),
  "token" text NOT NULL,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "calendar_feed_tokens_token_unique" ON "calendar_feed_tokens" ("token");
CREATE INDEX IF NOT EXISTS "calendar_feed_tokens_user_idx" ON "calendar_feed_tokens" ("user_id");
