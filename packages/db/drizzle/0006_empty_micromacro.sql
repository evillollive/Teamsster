CREATE TYPE "public"."event_recurrence_frequency" AS ENUM('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('GAME', 'PRACTICE', 'GENERAL');--> statement-breakpoint
CREATE TABLE "team_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"event_type" "event_type" DEFAULT 'GENERAL' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"recurrence_rule" jsonb DEFAULT '{"frequency":"NONE","interval":1}'::jsonb NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "team_events" ADD CONSTRAINT "team_events_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_events" ADD CONSTRAINT "team_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_events_league_idx" ON "team_events" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "team_events_team_idx" ON "team_events" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_events_starts_at_idx" ON "team_events" USING btree ("starts_at");
