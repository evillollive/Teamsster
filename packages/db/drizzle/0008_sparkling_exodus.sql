CREATE TYPE "public"."notification_delivery_channel" AS ENUM('EMAIL');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_kind" AS ENUM('WEEKLY_DIGEST', 'EVENT_REMINDER');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_status" AS ENUM('QUEUED', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"team_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"created_by_id" uuid,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"team_id" uuid,
	"actor_user_id" uuid,
	"recipient" text NOT NULL,
	"channel" "notification_delivery_channel" DEFAULT 'EMAIL' NOT NULL,
	"kind" "notification_delivery_kind" NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'SENT' NOT NULL,
	"template_subject" text NOT NULL,
	"template_body" text NOT NULL,
	"sent_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_league_idx" ON "announcements" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "announcements_team_idx" ON "announcements" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "announcements_published_at_idx" ON "announcements" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "notification_deliveries_league_idx" ON "notification_deliveries" USING btree ("league_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_deliveries_recipient_idx" ON "notification_deliveries" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries" USING btree ("status");