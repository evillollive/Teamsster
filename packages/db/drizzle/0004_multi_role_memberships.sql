ALTER TABLE "league_members" ADD COLUMN "roles" "membership_role"[] DEFAULT ARRAY['GUEST']::membership_role[] NOT NULL;
--> statement-breakpoint
UPDATE "league_members" SET "roles" = ARRAY["role"]::membership_role[] WHERE "role" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "roles" "membership_role"[] DEFAULT ARRAY['GUEST']::membership_role[] NOT NULL;
--> statement-breakpoint
UPDATE "team_members" SET "roles" = ARRAY["role"]::membership_role[] WHERE "role" IS NOT NULL;
--> statement-breakpoint
DROP INDEX "league_members_role_idx";
--> statement-breakpoint
DROP INDEX "team_members_role_idx";
--> statement-breakpoint
ALTER TABLE "league_members" DROP COLUMN "role";
--> statement-breakpoint
ALTER TABLE "team_members" DROP COLUMN "role";
