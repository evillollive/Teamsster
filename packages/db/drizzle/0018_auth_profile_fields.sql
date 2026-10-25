ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "display_username" text;
CREATE UNIQUE INDEX IF NOT EXISTS "auth_user_username_unique" ON "user" ("username");

DO $$ BEGIN
  CREATE TYPE "account_type" AS ENUM ('standard', 'minor');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "account_type" "account_type" NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS "date_of_birth" date;