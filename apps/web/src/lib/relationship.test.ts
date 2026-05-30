import {
  isCaptain,
  normalizeRelationship,
  relationshipTypeValues,
  TEAM_ONLY_ROLES,
} from "@teamsster/db/schema";
import { describe, expect, it } from "vitest";

import {
  canCaptainMessageTeam,
  canCaptainViewContacts,
  canManageCaptains,
  hasMinimumRole,
} from "@/lib/permissions";

import {
  assignCaptainSchema,
  captainPermissionLevelSchema,
  RELATIONSHIP_TYPE_LABELS,
  relationshipTypeSchema,
  revokeCaptainSchema,
  structuredRelationshipSchema,
  updateCaptainPermissionSchema,
} from "@/lib/relationship";

// ═══════════════════════════════════════════════════════════════════════════════
// Relationship normalization
// ═══════════════════════════════════════════════════════════════════════════════

describe("normalizeRelationship", () => {
  it("maps common parent synonyms", () => {
    for (const text of ["mom", "Mother", "dad", "Father", "parent"]) {
      const result = normalizeRelationship(text);
      expect(result.relationshipType).toBe("parent");
      expect(result.customRelationship).toBeNull();
    }
  });

  it("maps grandparent variants", () => {
    for (const text of [
      "grandma",
      "Grandmother",
      "grandpa",
      "Grandfather",
      "nana",
    ]) {
      expect(normalizeRelationship(text).relationshipType).toBe("grandparent");
    }
  });

  it("maps stepparent variants", () => {
    for (const text of [
      "stepmom",
      "step-dad",
      "Step Mom",
      "stepfather",
      "stepmother",
    ]) {
      expect(normalizeRelationship(text).relationshipType).toBe("stepparent");
    }
  });

  it("maps sibling variants", () => {
    for (const text of ["brother", "Sister", "sibling"]) {
      expect(normalizeRelationship(text).relationshipType).toBe("sibling");
    }
  });

  it("maps guardian and coach", () => {
    expect(normalizeRelationship("guardian").relationshipType).toBe("guardian");
    expect(normalizeRelationship("Legal Guardian").relationshipType).toBe(
      "guardian",
    );
    expect(normalizeRelationship("coach").relationshipType).toBe("coach");
  });

  it("falls back to 'other' for unknown values and preserves text", () => {
    const result = normalizeRelationship("Family Friend");
    expect(result.relationshipType).toBe("other");
    expect(result.customRelationship).toBe("Family Friend");
  });

  it("falls back to 'other' for empty/null input", () => {
    expect(normalizeRelationship(null).relationshipType).toBe("other");
    expect(normalizeRelationship(undefined).relationshipType).toBe("other");
    expect(normalizeRelationship("").relationshipType).toBe("other");
    expect(normalizeRelationship("   ").relationshipType).toBe("other");
  });

  it("normalizes whitespace and case", () => {
    const result = normalizeRelationship("  Step  Dad  ");
    expect(result.relationshipType).toBe("stepparent");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Relationship type enum and schema
// ═══════════════════════════════════════════════════════════════════════════════

describe("relationshipTypeValues", () => {
  it("includes all expected types", () => {
    expect(relationshipTypeValues).toContain("parent");
    expect(relationshipTypeValues).toContain("guardian");
    expect(relationshipTypeValues).toContain("stepparent");
    expect(relationshipTypeValues).toContain("grandparent");
    expect(relationshipTypeValues).toContain("sibling");
    expect(relationshipTypeValues).toContain("coach");
    expect(relationshipTypeValues).toContain("other");
  });

  it("doesn't include emergency_contact (that's a separate boolean)", () => {
    expect(relationshipTypeValues).not.toContain("emergency_contact");
  });
});

describe("structuredRelationshipSchema", () => {
  it("validates a standard relationship type", () => {
    const result = structuredRelationshipSchema.safeParse({
      relationshipType: "parent",
    });
    expect(result.success).toBe(true);
  });

  it("validates 'other' with custom text", () => {
    const result = structuredRelationshipSchema.safeParse({
      relationshipType: "other",
      customRelationship: "Host parent",
    });
    expect(result.success).toBe(true);
  });

  it("rejects 'other' without custom text", () => {
    const result = structuredRelationshipSchema.safeParse({
      relationshipType: "other",
    });
    expect(result.success).toBe(false);
  });

  it("rejects 'other' with empty custom text", () => {
    const result = structuredRelationshipSchema.safeParse({
      relationshipType: "other",
      customRelationship: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts isEmergencyContact flag", () => {
    const result = structuredRelationshipSchema.safeParse({
      relationshipType: "grandparent",
      isEmergencyContact: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isEmergencyContact).toBe(true);
    }
  });

  it("defaults isEmergencyContact to false", () => {
    const result = structuredRelationshipSchema.safeParse({
      relationshipType: "parent",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isEmergencyContact).toBe(false);
    }
  });

  it("rejects invalid relationship types", () => {
    const result = structuredRelationshipSchema.safeParse({
      relationshipType: "uncle",
    });
    expect(result.success).toBe(false);
  });
});

describe("RELATIONSHIP_TYPE_LABELS", () => {
  it("provides labels for all relationship types", () => {
    for (const type of relationshipTypeValues) {
      expect(RELATIONSHIP_TYPE_LABELS[type]).toBeDefined();
      expect(typeof RELATIONSHIP_TYPE_LABELS[type]).toBe("string");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Captain role schema
// ═══════════════════════════════════════════════════════════════════════════════

describe("TEAM_ONLY_ROLES", () => {
  it("includes CAPTAIN", () => {
    expect(TEAM_ONLY_ROLES.has("CAPTAIN")).toBe(true);
  });

  it("doesn't include standard roles", () => {
    expect(TEAM_ONLY_ROLES.has("PLAYER")).toBe(false);
    expect(TEAM_ONLY_ROLES.has("COACH")).toBe(false);
    expect(TEAM_ONLY_ROLES.has("ADMIN")).toBe(false);
  });
});

describe("isCaptain", () => {
  it("detects CAPTAIN in roles array", () => {
    expect(isCaptain(["PLAYER", "CAPTAIN"])).toBe(true);
    expect(isCaptain(["CAPTAIN"])).toBe(true);
  });

  it("returns false when CAPTAIN isn't present", () => {
    expect(isCaptain(["PLAYER"])).toBe(false);
    expect(isCaptain([])).toBe(false);
    expect(isCaptain(["COACH", "PLAYER"])).toBe(false);
  });
});

describe("captainPermissionLevelSchema", () => {
  it("accepts full and restricted", () => {
    expect(captainPermissionLevelSchema.safeParse("full").success).toBe(true);
    expect(captainPermissionLevelSchema.safeParse("restricted").success).toBe(
      true,
    );
  });

  it("rejects invalid levels", () => {
    expect(captainPermissionLevelSchema.safeParse("admin").success).toBe(false);
    expect(captainPermissionLevelSchema.safeParse("").success).toBe(false);
  });
});

describe("assignCaptainSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("validates a valid assignment", () => {
    const result = assignCaptainSchema.safeParse({
      teamId: validUuid,
      userId: validUuid,
      permissionLevel: "restricted",
    });
    expect(result.success).toBe(true);
  });

  it("defaults permissionLevel to restricted", () => {
    const result = assignCaptainSchema.safeParse({
      teamId: validUuid,
      userId: validUuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.permissionLevel).toBe("restricted");
    }
  });

  it("rejects non-UUID team/user IDs", () => {
    expect(
      assignCaptainSchema.safeParse({
        teamId: "not-a-uuid",
        userId: validUuid,
      }).success,
    ).toBe(false);
  });
});

describe("updateCaptainPermissionSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("requires permissionLevel", () => {
    const result = updateCaptainPermissionSchema.safeParse({
      teamId: validUuid,
      userId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("validates full and restricted", () => {
    expect(
      updateCaptainPermissionSchema.safeParse({
        teamId: validUuid,
        userId: validUuid,
        permissionLevel: "full",
      }).success,
    ).toBe(true);
  });
});

describe("revokeCaptainSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("validates a revocation", () => {
    expect(
      revokeCaptainSchema.safeParse({
        teamId: validUuid,
        userId: validUuid,
      }).success,
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Captain permission checks
// ═══════════════════════════════════════════════════════════════════════════════

describe("canCaptainViewContacts", () => {
  it("allows full captains to view contacts", () => {
    expect(
      canCaptainViewContacts({
        isCaptainOnTeam: true,
        captainPermissionLevel: "full",
      }),
    ).toBe(true);
  });

  it("blocks restricted captains from viewing contacts", () => {
    expect(
      canCaptainViewContacts({
        isCaptainOnTeam: true,
        captainPermissionLevel: "restricted",
      }),
    ).toBe(false);
  });

  it("blocks non-captains", () => {
    expect(
      canCaptainViewContacts({
        isCaptainOnTeam: false,
        captainPermissionLevel: null,
      }),
    ).toBe(false);
  });

  it("blocks when captain flag is false even with full level", () => {
    expect(
      canCaptainViewContacts({
        isCaptainOnTeam: false,
        captainPermissionLevel: "full",
      }),
    ).toBe(false);
  });
});

describe("canCaptainMessageTeam", () => {
  it("allows full captains to message", () => {
    expect(
      canCaptainMessageTeam({
        isCaptainOnTeam: true,
        captainPermissionLevel: "full",
      }),
    ).toBe(true);
  });

  it("blocks restricted captains from messaging", () => {
    expect(
      canCaptainMessageTeam({
        isCaptainOnTeam: true,
        captainPermissionLevel: "restricted",
      }),
    ).toBe(false);
  });
});

describe("canManageCaptains", () => {
  it("allows coaches to manage captains", () => {
    expect(canManageCaptains({ teamRoles: "COACH" })).toBe(true);
    expect(canManageCaptains({ teamRoles: "HEAD_COACH" })).toBe(true);
  });

  it("allows league admins to manage captains", () => {
    expect(canManageCaptains({ orgRoles: "ADMIN" })).toBe(true);
    expect(canManageCaptains({ orgRoles: "OWNER" })).toBe(true);
  });

  it("blocks players from managing captains", () => {
    expect(canManageCaptains({ teamRoles: "PLAYER" })).toBe(false);
  });

  it("blocks captains from managing other captains", () => {
    expect(canManageCaptains({ teamRoles: "CAPTAIN" })).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Captain role rank behavior
// ═══════════════════════════════════════════════════════════════════════════════

describe("captain role rank", () => {
  it("treats CAPTAIN at the same rank as PLAYER", () => {
    expect(hasMinimumRole("CAPTAIN", "PLAYER")).toBe(true);
    expect(hasMinimumRole("PLAYER", "CAPTAIN")).toBe(true);
  });

  it("doesn't let CAPTAIN outrank BOARD_MEMBER", () => {
    expect(hasMinimumRole("CAPTAIN", "BOARD_MEMBER")).toBe(false);
  });

  it("doesn't let CAPTAIN outrank COACH", () => {
    expect(hasMinimumRole("CAPTAIN", "COACH")).toBe(false);
  });

  it("lets CAPTAIN outrank PARENT and GUEST", () => {
    expect(hasMinimumRole("CAPTAIN", "PARENT")).toBe(true);
    expect(hasMinimumRole("CAPTAIN", "GUEST")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Privilege escalation prevention
// ═══════════════════════════════════════════════════════════════════════════════

describe("captain privilege escalation prevention", () => {
  it("captainPermissionLevel 'full' without captain role grants nothing", () => {
    // This tests that code should check isCaptain before checking level.
    expect(
      canCaptainViewContacts({
        isCaptainOnTeam: false,
        captainPermissionLevel: "full",
      }),
    ).toBe(false);
    expect(
      canCaptainMessageTeam({
        isCaptainOnTeam: false,
        captainPermissionLevel: "full",
      }),
    ).toBe(false);
  });

  it("null permission level with captain flag grants nothing", () => {
    expect(
      canCaptainViewContacts({
        isCaptainOnTeam: true,
        captainPermissionLevel: null,
      }),
    ).toBe(false);
  });
});

describe("relationshipTypeSchema", () => {
  it("accepts valid types", () => {
    for (const type of relationshipTypeValues) {
      expect(relationshipTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("rejects invalid types", () => {
    expect(relationshipTypeSchema.safeParse("uncle").success).toBe(false);
    expect(relationshipTypeSchema.safeParse("").success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Migration backfill integration tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("relationship backfill (migration logic)", () => {
  it("maps every synonym to the correct type without custom text", () => {
    const synonymMap: Record<string, string> = {
      mom: "parent",
      Mother: "parent",
      Dad: "parent",
      "legal guardian": "guardian",
      "step-mom": "stepparent",
      "step dad": "stepparent",
      stepfather: "stepparent",
      Grandma: "grandparent",
      nanny: "grandparent",
      Brother: "sibling",
      sister: "sibling",
      Coach: "coach",
    };

    for (const [input, expected] of Object.entries(synonymMap)) {
      const result = normalizeRelationship(input);
      expect(result.relationshipType).toBe(expected);
      expect(result.customRelationship).toBeNull();
    }
  });

  it("preserves unrecognized text as custom_relationship with type 'other'", () => {
    const unknowns = ["Aunt", "Family friend", "host parent", "Neighbor"];
    for (const input of unknowns) {
      const result = normalizeRelationship(input);
      expect(result.relationshipType).toBe("other");
      expect(result.customRelationship).toBe(input.trim());
    }
  });

  it("handles null and empty inputs as 'other' with no custom text", () => {
    expect(normalizeRelationship(null)).toEqual({
      relationshipType: "other",
      customRelationship: null,
    });
    expect(normalizeRelationship("")).toEqual({
      relationshipType: "other",
      customRelationship: null,
    });
    expect(normalizeRelationship("   ")).toEqual({
      relationshipType: "other",
      customRelationship: null,
    });
  });

  it("trims whitespace and normalizes case", () => {
    expect(normalizeRelationship("  Mom  ").relationshipType).toBe("parent");
    expect(normalizeRelationship("GUARDIAN").relationshipType).toBe("guardian");
    expect(normalizeRelationship("  COACH  ").relationshipType).toBe("coach");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Captain assignment integration tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("captain assignment across teams", () => {
  it("captain on one team does not grant contact visibility on another team", () => {
    const canViewOnTeamA = canCaptainViewContacts({
      isCaptainOnTeam: true,
      captainPermissionLevel: "full",
    });
    const canViewOnTeamB = canCaptainViewContacts({
      isCaptainOnTeam: false,
      captainPermissionLevel: null,
    });
    expect(canViewOnTeamA).toBe(true);
    expect(canViewOnTeamB).toBe(false);
  });

  it("full captain can message team, restricted cannot", () => {
    expect(
      canCaptainMessageTeam({
        isCaptainOnTeam: true,
        captainPermissionLevel: "full",
      }),
    ).toBe(true);
    expect(
      canCaptainMessageTeam({
        isCaptainOnTeam: true,
        captainPermissionLevel: "restricted",
      }),
    ).toBe(false);
  });

  it("captain management requires COACH or ADMIN", () => {
    expect(canManageCaptains({ teamRoles: "COACH" })).toBe(true);
    expect(canManageCaptains({ orgRoles: "ADMIN" })).toBe(true);
    expect(canManageCaptains({ teamRoles: "PLAYER" })).toBe(false);
    expect(canManageCaptains({ orgRoles: "PLAYER" })).toBe(false);
    expect(canManageCaptains({ teamRoles: "CAPTAIN" })).toBe(false);
  });
});
