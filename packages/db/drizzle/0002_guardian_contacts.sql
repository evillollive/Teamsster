CREATE TABLE "player_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"relationship" text,
	"email" text,
	"phone" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by_id" uuid
);
--> statement-breakpoint
ALTER TABLE "player_contacts" ADD CONSTRAINT "player_contacts_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "player_contacts" ADD CONSTRAINT "player_contacts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "player_contacts" ADD CONSTRAINT "player_contacts_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "player_contacts_league_idx" ON "player_contacts" USING btree ("league_id");
--> statement-breakpoint
CREATE INDEX "player_contacts_team_idx" ON "player_contacts" USING btree ("team_id");
--> statement-breakpoint
CREATE INDEX "player_contacts_player_idx" ON "player_contacts" USING btree ("player_id");
