CREATE TABLE "league_role_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"label" text NOT NULL,
	"roles" "membership_role"[] DEFAULT ARRAY['GUEST']::membership_role[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "league_role_templates" ADD CONSTRAINT "league_role_templates_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "league_role_templates_label_unique" ON "league_role_templates" USING btree ("league_id","label");
--> statement-breakpoint
CREATE INDEX "league_role_templates_league_idx" ON "league_role_templates" USING btree ("league_id");
