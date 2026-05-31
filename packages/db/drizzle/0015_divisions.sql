-- M19: Divisions, age groups, and competitive levels

DO $$ BEGIN
  CREATE TYPE "competitive_level" AS ENUM ('recreational', 'competitive', 'elite');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "divisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "name" text NOT NULL,
  "short_name" text,
  "min_birth_year" text,
  "max_birth_year" text,
  "competitive_level" "competitive_level" NOT NULL DEFAULT 'recreational',
  "sort_order" text NOT NULL DEFAULT '0',
  "created_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "divisions_league_idx" ON "divisions" ("league_id");
CREATE INDEX IF NOT EXISTS "divisions_league_level_idx" ON "divisions" ("league_id", "competitive_level");

CREATE TABLE IF NOT EXISTS "team_division_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "team_id" uuid NOT NULL REFERENCES "teams"("id"),
  "division_id" uuid NOT NULL REFERENCES "divisions"("id"),
  "season_id" uuid REFERENCES "seasons"("id"),
  "assigned_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "team_division_assignments_team_idx" ON "team_division_assignments" ("team_id");
CREATE INDEX IF NOT EXISTS "team_division_assignments_division_idx" ON "team_division_assignments" ("division_id");
CREATE INDEX IF NOT EXISTS "team_division_assignments_season_idx" ON "team_division_assignments" ("season_id");
