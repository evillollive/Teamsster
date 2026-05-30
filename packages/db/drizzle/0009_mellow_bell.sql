ALTER TYPE "public"."notification_delivery_channel" ADD VALUE IF NOT EXISTS 'IN_APP';--> statement-breakpoint
ALTER TYPE "public"."notification_delivery_channel" ADD VALUE IF NOT EXISTS 'PUSH';--> statement-breakpoint
ALTER TYPE "public"."notification_delivery_kind" ADD VALUE IF NOT EXISTS 'ANNOUNCEMENT';--> statement-breakpoint
ALTER TYPE "public"."notification_delivery_kind" ADD VALUE IF NOT EXISTS 'MESSAGE';--> statement-breakpoint
ALTER TYPE "public"."notification_delivery_kind" ADD VALUE IF NOT EXISTS 'VOLUNTEER_REMINDER';--> statement-breakpoint
ALTER TYPE "public"."notification_delivery_kind" ADD VALUE IF NOT EXISTS 'ASSIGNMENT';--> statement-breakpoint
ALTER TYPE "public"."notification_delivery_kind" ADD VALUE IF NOT EXISTS 'REGISTRATION_DEADLINE';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "notification_preferences" SET DEFAULT '{"ANNOUNCEMENT":{"email":true,"inApp":true,"push":false},"EVENT_REMINDER":{"email":true,"inApp":true,"push":true},"WEEKLY_DIGEST":{"email":false,"inApp":true,"push":false},"MESSAGE":{"email":true,"inApp":true,"push":true},"VOLUNTEER_REMINDER":{"email":true,"inApp":true,"push":true},"ASSIGNMENT":{"email":true,"inApp":true,"push":true},"REGISTRATION_DEADLINE":{"email":true,"inApp":true,"push":true}}'::jsonb;--> statement-breakpoint
UPDATE "users"
SET "notification_preferences" = jsonb_build_object(
  'ANNOUNCEMENT', jsonb_build_object(
    'email', COALESCE(("notification_preferences"->>'emailAnnouncements')::boolean, true),
    'inApp', true,
    'push', false
  ),
  'EVENT_REMINDER', jsonb_build_object(
    'email', COALESCE(("notification_preferences"->>'eventReminders')::boolean, true),
    'inApp', true,
    'push', true
  ),
  'WEEKLY_DIGEST', jsonb_build_object(
    'email', COALESCE(("notification_preferences"->>'weeklyDigest')::boolean, false),
    'inApp', true,
    'push', false
  ),
  'MESSAGE', jsonb_build_object('email', true, 'inApp', true, 'push', true),
  'VOLUNTEER_REMINDER', jsonb_build_object('email', true, 'inApp', true, 'push', true),
  'ASSIGNMENT', jsonb_build_object('email', true, 'inApp', true, 'push', true),
  'REGISTRATION_DEADLINE', jsonb_build_object('email', true, 'inApp', true, 'push', true)
)
WHERE jsonb_typeof("notification_preferences"->'ANNOUNCEMENT') IS DISTINCT FROM 'object';--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"team_id" uuid,
	"actor_user_id" uuid,
	"kind" "notification_delivery_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"dedupe_key" text,
	"scheduled_for" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "notification_feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"league_id" uuid NOT NULL,
	"team_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"delivered_by_fallback" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD COLUMN "recipient_user_id" uuid;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_feed_items" ADD CONSTRAINT "notification_feed_items_event_id_notification_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_feed_items" ADD CONSTRAINT "notification_feed_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_feed_items" ADD CONSTRAINT "notification_feed_items_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_feed_items" ADD CONSTRAINT "notification_feed_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_event_id_notification_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_events_dedupe_key_unique" ON "notification_events" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "notification_events_league_idx" ON "notification_events" USING btree ("league_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_events_kind_idx" ON "notification_events" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "notification_feed_items_user_idx" ON "notification_feed_items" USING btree ("user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "notification_feed_items_event_idx" ON "notification_feed_items" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_feed_items_event_user_unique" ON "notification_feed_items" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_event_idx" ON "notification_deliveries" USING btree ("event_id");