import { relationshipTypeValues } from "@teamsster/db/schema";
import { z } from "zod";

// ── Relationship validation ──────────────────────────────────────────────────

export const relationshipTypeSchema = z.enum(relationshipTypeValues);

export const structuredRelationshipSchema = z
  .object({
    relationshipType: relationshipTypeSchema,
    customRelationship: z.string().trim().max(120).optional(),
    isEmergencyContact: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.relationshipType === "other") {
        return (
          data.customRelationship !== undefined &&
          data.customRelationship.length > 0
        );
      }
      return true;
    },
    {
      message: "Please describe the relationship when selecting 'other'.",
      path: ["customRelationship"],
    },
  );

/** Human-readable labels for relationship types in the UI. */
export const RELATIONSHIP_TYPE_LABELS: Record<
  (typeof relationshipTypeValues)[number],
  string
> = {
  parent: "Parent",
  guardian: "Guardian",
  stepparent: "Stepparent",
  grandparent: "Grandparent",
  sibling: "Sibling",
  coach: "Coach",
  other: "Other",
};

// ── Captain validation ───────────────────────────────────────────────────────

export const captainPermissionLevelSchema = z.enum(["full", "restricted"]);

export const assignCaptainSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  permissionLevel: captainPermissionLevelSchema.default("restricted"),
});

export const updateCaptainPermissionSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  permissionLevel: captainPermissionLevelSchema,
});

export const revokeCaptainSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
});
