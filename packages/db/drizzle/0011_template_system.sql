-- Template system: unified template table for events, announcements,
-- registration forms, and volunteer opportunities.

DO $$ BEGIN
  CREATE TYPE "template_type" AS ENUM ('event', 'announcement', 'registration_form', 'volunteer_opportunity');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "team_id" uuid REFERENCES "teams"("id"),
  "type" "template_type" NOT NULL,
  "name" text NOT NULL,
  "payload" jsonb NOT NULL,
  "is_built_in" boolean NOT NULL DEFAULT false,
  "created_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "templates_league_idx" ON "templates" ("league_id");
CREATE INDEX IF NOT EXISTS "templates_league_type_idx" ON "templates" ("league_id", "type");
CREATE INDEX IF NOT EXISTS "templates_team_idx" ON "templates" ("team_id");
