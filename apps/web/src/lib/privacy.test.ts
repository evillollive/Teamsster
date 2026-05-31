import {
  anonymizeMessageContent,
  DATA_RETENTION_POLICIES,
  getGuardianBoundaries,
  isMessageAnonymized,
  planAccountDeletion,
  sanitizeExportValue,
  serializeExport,
  validateDeletionPlan,
  validateMinorConsent,
} from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("sanitizeExportValue", () => {
  it("passes safe values unchanged", () => {
    expect(sanitizeExportValue("John Doe")).toBe("John Doe");
  });

  it("prefixes formula-starting characters", () => {
    expect(sanitizeExportValue("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(sanitizeExportValue("+cmd")).toBe("'+cmd");
    expect(sanitizeExportValue("-1")).toBe("'-1");
    expect(sanitizeExportValue("@import")).toBe("'@import");
  });

  it("strips newlines", () => {
    expect(sanitizeExportValue("line1\nline2")).toBe("line1 line2");
  });

  it("trims whitespace", () => {
    expect(sanitizeExportValue("  hello  ")).toBe("hello");
  });
});

describe("serializeExport", () => {
  it("produces valid JSON", () => {
    const data = {
      profile: {
        email: "test@example.com",
        displayName: "Test",
        accountType: "standard",
        timezone: "UTC",
        createdAt: new Date("2026-01-01"),
      },
      exportedAt: new Date("2026-06-01"),
      sections: { memberships: [{ leagueId: "l1", role: "PLAYER" }] },
    };
    const json = serializeExport(data);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain("test@example.com");
  });
});

describe("planAccountDeletion", () => {
  it("produces a deletion plan with all required steps", () => {
    const plan = planAccountDeletion("user-123");
    expect(plan.userId).toBe("user-123");
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps.some((s) => s.entity === "messages")).toBe(true);
    expect(plan.steps.some((s) => s.action === "anonymize")).toBe(true);
    expect(plan.steps.some((s) => s.entity === "guardian_links")).toBe(true);
  });

  it("includes guardian reassignment step", () => {
    const plan = planAccountDeletion("user-456");
    const reassign = plan.steps.find((s) => s.action === "reassign");
    expect(reassign).toBeDefined();
    expect(reassign?.entity).toBe("guardian_links");
  });
});

describe("validateDeletionPlan", () => {
  it("returns errors for plans with guardian reassignment", () => {
    const plan = planAccountDeletion("user-789");
    const errors = validateDeletionPlan(plan);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("Guardian links require reassignment");
  });

  it("returns error for empty plan", () => {
    const errors = validateDeletionPlan({ userId: "u1", steps: [] });
    expect(errors).toContain("Empty deletion plan.");
  });

  it("returns error for missing user ID", () => {
    const errors = validateDeletionPlan({
      userId: "",
      steps: [{ entity: "x", action: "soft_delete" }],
    });
    expect(errors).toContain("Missing user ID.");
  });
});

describe("anonymizeMessageContent", () => {
  it("replaces content with standard message", () => {
    expect(anonymizeMessageContent("Hello team!")).toBe(
      "[Message from deleted account]",
    );
  });

  it("handles empty content", () => {
    expect(anonymizeMessageContent("")).toBe("[Message from deleted account]");
  });
});

describe("isMessageAnonymized", () => {
  it("detects anonymized messages", () => {
    expect(isMessageAnonymized("[Message from deleted account]")).toBe(true);
  });

  it("returns false for normal messages", () => {
    expect(isMessageAnonymized("Hello!")).toBe(false);
  });
});

describe("getGuardianBoundaries", () => {
  it("grants full access to linked guardians", () => {
    const boundaries = getGuardianBoundaries(true);
    expect(boundaries.canViewProfile).toBe(true);
    expect(boundaries.canEditProfile).toBe(true);
    expect(boundaries.canViewMessages).toBe(true);
    expect(boundaries.canViewMedical).toBe(true);
    expect(boundaries.canManageRegistration).toBe(true);
  });

  it("blocks guardians from sending as minor", () => {
    const boundaries = getGuardianBoundaries(true);
    expect(boundaries.canSendMessages).toBe(false);
  });

  it("blocks guardians from deleting minor account", () => {
    const boundaries = getGuardianBoundaries(true);
    expect(boundaries.canDeleteAccount).toBe(false);
  });

  it("denies all access to non-guardians", () => {
    const boundaries = getGuardianBoundaries(false);
    expect(boundaries.canViewProfile).toBe(false);
    expect(boundaries.canEditProfile).toBe(false);
    expect(boundaries.canViewMessages).toBe(false);
    expect(boundaries.canViewMedical).toBe(false);
  });
});

describe("validateMinorConsent", () => {
  it("returns no errors when all requirements met", () => {
    const errors = validateMinorConsent({
      hasLinkedGuardian: true,
      guardianAcknowledged: true,
      ageVerified: true,
    });
    expect(errors).toHaveLength(0);
  });

  it("returns error for missing guardian", () => {
    const errors = validateMinorConsent({
      hasLinkedGuardian: false,
      guardianAcknowledged: true,
      ageVerified: true,
    });
    expect(errors).toContain("Minor must have at least one linked guardian.");
  });

  it("returns error for missing acknowledgement", () => {
    const errors = validateMinorConsent({
      hasLinkedGuardian: true,
      guardianAcknowledged: false,
      ageVerified: true,
    });
    expect(errors.length).toBe(1);
  });

  it("returns multiple errors", () => {
    const errors = validateMinorConsent({
      hasLinkedGuardian: false,
      guardianAcknowledged: false,
      ageVerified: false,
    });
    expect(errors.length).toBe(3);
  });
});

describe("DATA_RETENTION_POLICIES", () => {
  it("defines policies for all major categories", () => {
    const categories = DATA_RETENTION_POLICIES.map((p) => p.category);
    expect(categories).toContain("User profiles");
    expect(categories).toContain("Messages");
    expect(categories).toContain("Medical/insurance records");
    expect(categories).toContain("Waiver signatures");
    expect(categories).toContain("Audit logs");
  });

  it("audit logs are never purged", () => {
    const auditPolicy = DATA_RETENTION_POLICIES.find(
      (p) => p.category === "Audit logs",
    );
    expect(auditPolicy?.purgeMethod).toContain("never");
  });
});
