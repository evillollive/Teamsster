-- M20: Tournament and bracket support
-- M21: Venue and field management

DO $$ BEGIN
  CREATE TYPE "tournament_format" AS ENUM ('single_elimination', 'double_elimination', 'round_robin', 'pool_play');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "match_status" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "surface_type" AS ENUM ('grass', 'turf', 'indoor', 'dirt', 'court', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- M20 tables

CREATE TABLE IF NOT EXISTS "tournaments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "division_id" uuid REFERENCES "divisions"("id"),
  "season_id" uuid REFERENCES "seasons"("id"),
  "name" text NOT NULL,
  "format" "tournament_format" NOT NULL,
  "seed_order" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "tournaments_league_idx" ON "tournaments" ("league_id");
CREATE INDEX IF NOT EXISTS "tournaments_division_idx" ON "tournaments" ("division_id");

CREATE TABLE IF NOT EXISTS "tournament_matches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tournament_id" uuid NOT NULL REFERENCES "tournaments"("id"),
  "round" text NOT NULL,
  "match_number" text NOT NULL,
  "home_team_id" uuid REFERENCES "teams"("id"),
  "away_team_id" uuid REFERENCES "teams"("id"),
  "home_score" text,
  "away_score" text,
  "winner_id" uuid REFERENCES "teams"("id"),
  "status" "match_status" NOT NULL DEFAULT 'scheduled',
  "scheduled_at" timestamptz,
  "next_match_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "tournament_matches_tournament_idx" ON "tournament_matches" ("tournament_id");
CREATE INDEX IF NOT EXISTS "tournament_matches_round_idx" ON "tournament_matches" ("tournament_id", "round");

-- M21 tables

CREATE TABLE IF NOT EXISTS "venues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "name" text NOT NULL,
  "address" text,
  "city" text,
  "state" text,
  "zip_code" text,
  "latitude" text,
  "longitude" text,
  "notes" text,
  "created_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "venues_league_idx" ON "venues" ("league_id");

CREATE TABLE IF NOT EXISTS "fields" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "venue_id" uuid NOT NULL REFERENCES "venues"("id"),
  "name" text NOT NULL,
  "surface_type" "surface_type" NOT NULL DEFAULT 'grass',
  "capacity" text,
  "amenities" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "fields_venue_idx" ON "fields" ("venue_id");

CREATE TABLE IF NOT EXISTS "field_availability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "field_id" uuid NOT NULL REFERENCES "fields"("id"),
  "day_of_week" text NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "is_recurring" boolean NOT NULL DEFAULT true,
  "effective_date" date,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "field_availability_field_idx" ON "field_availability" ("field_id");
CREATE INDEX IF NOT EXISTS "field_availability_day_idx" ON "field_availability" ("field_id", "day_of_week");
