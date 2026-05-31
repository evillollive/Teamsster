-- M22: Incident and injury reporting

DO $$ BEGIN
  CREATE TYPE "incident_type" AS ENUM ('injury', 'conduct', 'facility', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "incident_severity" AS ENUM ('minor', 'moderate', 'serious', 'critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "incident_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "event_id" uuid,
  "team_id" uuid REFERENCES "teams"("id"),
  "type" "incident_type" NOT NULL,
  "severity" "incident_severity" NOT NULL,
  "title" text NOT NULL,
  "narrative" text NOT NULL,
  "encrypted_medical_details" text,
  "involved_parties" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "reported_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "reviewed_by_id" uuid REFERENCES "users"("id"),
  "reviewed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "incident_reports_league_idx" ON "incident_reports" ("league_id");
CREATE INDEX IF NOT EXISTS "incident_reports_event_idx" ON "incident_reports" ("event_id");
CREATE INDEX IF NOT EXISTS "incident_reports_reporter_idx" ON "incident_reports" ("reported_by_id");
CREATE INDEX IF NOT EXISTS "incident_reports_type_idx" ON "incident_reports" ("league_id", "type");
