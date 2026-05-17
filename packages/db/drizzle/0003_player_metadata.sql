CREATE TYPE "public"."player_eligibility_status" AS ENUM('PENDING', 'ELIGIBLE', 'INELIGIBLE');
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "eligibility_status" "player_eligibility_status" DEFAULT 'PENDING' NOT NULL;
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "eligibility_notes" text;
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "profile_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;
