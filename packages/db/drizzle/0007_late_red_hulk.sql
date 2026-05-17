CREATE TYPE "public"."event_rsvp_status" AS ENUM('YES', 'NO', 'MAYBE');--> statement-breakpoint
CREATE TABLE "team_event_rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"league_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "event_rsvp_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_event_rsvps" ADD CONSTRAINT "team_event_rsvps_event_id_team_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."team_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_event_rsvps" ADD CONSTRAINT "team_event_rsvps_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_event_rsvps" ADD CONSTRAINT "team_event_rsvps_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_event_rsvps" ADD CONSTRAINT "team_event_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_event_rsvps_event_user_unique" ON "team_event_rsvps" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "team_event_rsvps_event_idx" ON "team_event_rsvps" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "team_event_rsvps_user_idx" ON "team_event_rsvps" USING btree ("user_id");