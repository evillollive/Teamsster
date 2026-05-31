import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import { users } from "./schema";

// ── Account data export ──────────────────────────────────────────────────────

export type AccountExportData = {
  profile: {
    email: string;
    displayName: string | null;
    accountType: string;
    timezone: string;
    createdAt: Date;
  };
  exportedAt: Date;
  sections: Record<string, unknown[]>;
};

/**
 * Sanitizes a value for safe CSV export.
 * Prevents formula injection by prefixing dangerous start characters.
 */
export function sanitizeExportValue(value: string): string {
  const cleaned = value.replace(/[\r\n]/g, " ").trim();
  if (/^[=+\-@]/.test(cleaned)) {
    return `'${cleaned}`;
  }
  return cleaned;
}

/**
 * Serializes export data to a JSON string with safe formatting.
 */
export function serializeExport(data: AccountExportData): string {
  return JSON.stringify(data, null, 2);
}

export async function getUserProfileForExport(userId: string) {
  const rows = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      accountType: users.accountType,
      timezone: users.timezone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

// ── Account deletion ─────────────────────────────────────────────────────────

export type DeletionPlan = {
  userId: string;
  steps: DeletionStep[];
};

export type DeletionStep = {
  entity: string;
  action: "soft_delete" | "anonymize" | "reassign" | "cascade";
  count?: number;
};

/**
 * Plans the deletion cascade for a user account.
 * Does not execute deletion; returns the plan for review/confirmation.
 */
export function planAccountDeletion(userId: string): DeletionPlan {
  return {
    userId,
    steps: [
      { entity: "user_profile", action: "soft_delete" },
      { entity: "messages", action: "anonymize" },
      { entity: "volunteer_signups", action: "soft_delete" },
      { entity: "volunteer_role_assignments", action: "soft_delete" },
      { entity: "conversation_memberships", action: "soft_delete" },
      { entity: "notification_preferences", action: "cascade" },
      { entity: "device_tokens", action: "cascade" },
      { entity: "calendar_feed_tokens", action: "cascade" },
      { entity: "guardian_links", action: "reassign" },
    ],
  };
}

/**
 * Validates that a deletion plan is safe to execute.
 * Returns errors if there are blocking conditions.
 */
export function validateDeletionPlan(plan: DeletionPlan): string[] {
  const errors: string[] = [];
  if (!plan.userId) errors.push("Missing user ID.");
  if (!plan.steps.length) errors.push("Empty deletion plan.");
  const hasReassign = plan.steps.some((s) => s.action === "reassign");
  if (hasReassign) {
    // Guardian reassignment must be handled before deletion
    errors.push(
      "Guardian links require reassignment before deletion. Ensure all minors have at least one other guardian.",
    );
  }
  return errors;
}

// ── Message anonymization ────────────────────────────────────────────────────

const _ANONYMIZED_SENDER = "deleted-user";

/**
 * Anonymizes message content from a deleted user.
 * Replaces sender reference but preserves message structure for thread continuity.
 */
export function anonymizeMessageContent(_content: string): string {
  return "[Message from deleted account]";
}

/**
 * Checks whether a message is already anonymized.
 */
export function isMessageAnonymized(content: string): boolean {
  return content === "[Message from deleted account]";
}

// ── Consent and boundary helpers ─────────────────────────────────────────────

export type GuardianBoundary = {
  canViewProfile: boolean;
  canEditProfile: boolean;
  canViewMessages: boolean;
  canSendMessages: boolean;
  canViewMedical: boolean;
  canManageRegistration: boolean;
  canDeleteAccount: boolean;
};

/**
 * Defines what a guardian can and can't do on behalf of a linked minor.
 */
export function getGuardianBoundaries(
  isLinkedGuardian: boolean,
): GuardianBoundary {
  if (!isLinkedGuardian) {
    return {
      canViewProfile: false,
      canEditProfile: false,
      canViewMessages: false,
      canSendMessages: false,
      canViewMedical: false,
      canManageRegistration: false,
      canDeleteAccount: false,
    };
  }

  return {
    canViewProfile: true,
    canEditProfile: true,
    canViewMessages: true,
    canSendMessages: false,
    canViewMedical: true,
    canManageRegistration: true,
    canDeleteAccount: false,
  };
}

/**
 * Validates minor consent requirements.
 * Returns a list of unmet requirements.
 */
export function validateMinorConsent(input: {
  hasLinkedGuardian: boolean;
  guardianAcknowledged: boolean;
  ageVerified: boolean;
}): string[] {
  const unmet: string[] = [];
  if (!input.hasLinkedGuardian) {
    unmet.push("Minor must have at least one linked guardian.");
  }
  if (!input.guardianAcknowledged) {
    unmet.push("Guardian must acknowledge the terms of use.");
  }
  if (!input.ageVerified) {
    unmet.push("Age verification is required for minor accounts.");
  }
  return unmet;
}

// ── Data retention ───────────────────────────────────────────────────────────

export type RetentionPolicy = {
  category: string;
  retentionPeriod: string;
  purgeMethod: string;
};

export const DATA_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    category: "User profiles",
    retentionPeriod: "Retained until account deletion, then soft-deleted",
    purgeMethod: "Soft delete with 30-day grace period before hard purge",
  },
  {
    category: "Messages",
    retentionPeriod: "Configurable per league (default: indefinite)",
    purgeMethod:
      "Auto-archived past retention cutoff; anonymized on account deletion",
  },
  {
    category: "Medical/insurance records",
    retentionPeriod: "Retained for the active season plus 1 year",
    purgeMethod:
      "Hard delete after retention period; all access is audit-logged",
  },
  {
    category: "Waiver signatures",
    retentionPeriod: "Retained indefinitely for legal compliance",
    purgeMethod: "Never auto-purged; admin can export for offline archival",
  },
  {
    category: "Audit logs",
    retentionPeriod: "Retained indefinitely",
    purgeMethod: "Immutable; never purged",
  },
  {
    category: "Volunteer hours",
    retentionPeriod: "Retained for the active season plus 2 years",
    purgeMethod: "Soft delete after retention; exportable before purge",
  },
  {
    category: "Calendar feed tokens",
    retentionPeriod: "Active until revoked",
    purgeMethod: "Hard delete on revocation",
  },
  {
    category: "Device tokens",
    retentionPeriod: "Active until revoked or account deleted",
    purgeMethod: "Hard delete on revocation or account deletion",
  },
];
