-- M11: Waivers, medical, insurance, and payment status
-- M13: Volunteer opportunities, signups, roles, and assignments

DO $$ BEGIN
  CREATE TYPE "payment_status" AS ENUM ('pending', 'received', 'comped', 'scholarship');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "volunteer_role_scope" AS ENUM ('league', 'team');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- M11 tables

CREATE TABLE IF NOT EXISTS "insurance_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "registration_id" uuid NOT NULL REFERENCES "registrations"("id"),
  "player_id" uuid REFERENCES "players"("id"),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "encrypted_data" text NOT NULL,
  "created_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "insurance_records_registration_idx" ON "insurance_records" ("registration_id");
CREATE INDEX IF NOT EXISTS "insurance_records_player_idx" ON "insurance_records" ("player_id");

CREATE TABLE IF NOT EXISTS "medical_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "registration_id" uuid NOT NULL REFERENCES "registrations"("id"),
  "player_id" uuid REFERENCES "players"("id"),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "encrypted_notes" text NOT NULL,
  "created_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "medical_notes_registration_idx" ON "medical_notes" ("registration_id");
CREATE INDEX IF NOT EXISTS "medical_notes_player_idx" ON "medical_notes" ("player_id");

CREATE TABLE IF NOT EXISTS "waiver_signatures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "registration_id" uuid NOT NULL REFERENCES "registrations"("id"),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "signer_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "waiver_text" text NOT NULL,
  "metadata" jsonb NOT NULL,
  "signed_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "waiver_signatures_registration_idx" ON "waiver_signatures" ("registration_id");
CREATE INDEX IF NOT EXISTS "waiver_signatures_league_idx" ON "waiver_signatures" ("league_id");
CREATE INDEX IF NOT EXISTS "waiver_signatures_signer_idx" ON "waiver_signatures" ("signer_user_id");

CREATE TABLE IF NOT EXISTS "registration_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "registration_id" uuid NOT NULL REFERENCES "registrations"("id"),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "status" "payment_status" NOT NULL DEFAULT 'pending',
  "amount" text,
  "notes" text,
  "updated_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "registration_payments_registration_idx" ON "registration_payments" ("registration_id");
CREATE INDEX IF NOT EXISTS "registration_payments_league_idx" ON "registration_payments" ("league_id");

-- M13 tables

CREATE TABLE IF NOT EXISTS "volunteer_opportunities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "team_id" uuid REFERENCES "teams"("id"),
  "event_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "location" text,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "slots_available" text NOT NULL DEFAULT '1',
  "created_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "volunteer_opportunities_league_idx" ON "volunteer_opportunities" ("league_id");
CREATE INDEX IF NOT EXISTS "volunteer_opportunities_team_idx" ON "volunteer_opportunities" ("team_id");

CREATE TABLE IF NOT EXISTS "volunteer_signups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "opportunity_id" uuid NOT NULL REFERENCES "volunteer_opportunities"("id"),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "checked_in_at" timestamptz,
  "checked_out_at" timestamptz,
  "manual_hours" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "volunteer_signups_opportunity_idx" ON "volunteer_signups" ("opportunity_id");
CREATE INDEX IF NOT EXISTS "volunteer_signups_user_idx" ON "volunteer_signups" ("user_id");

CREATE TABLE IF NOT EXISTS "volunteer_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "league_id" uuid NOT NULL REFERENCES "leagues"("id"),
  "team_id" uuid REFERENCES "teams"("id"),
  "scope" "volunteer_role_scope" NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "is_built_in" boolean NOT NULL DEFAULT false,
  "created_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "volunteer_roles_league_idx" ON "volunteer_roles" ("league_id");
CREATE INDEX IF NOT EXISTS "volunteer_roles_team_idx" ON "volunteer_roles" ("team_id");

CREATE TABLE IF NOT EXISTS "volunteer_role_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "role_id" uuid NOT NULL REFERENCES "volunteer_roles"("id"),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "season_id" uuid REFERENCES "seasons"("id"),
  "assigned_by_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  "deleted_by_id" uuid REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "volunteer_role_assignments_role_idx" ON "volunteer_role_assignments" ("role_id");
CREATE INDEX IF NOT EXISTS "volunteer_role_assignments_user_idx" ON "volunteer_role_assignments" ("user_id");
