import {
  buildMinorPlaceholderEmail,
  isMinorPlaceholderEmail,
  MINOR_EMAIL_DOMAIN,
} from "@teamsster/db";
import { describe, expect, it } from "vitest";

import {
  createMinorAccountSchema,
  isReservedUsername,
  linkGuardianSchema,
  unlinkGuardianSchema,
  usernameSchema,
  validateUsername,
} from "@/lib/guardian";
import {
  canCreateMinorAccount,
  canManageMinorAccount,
} from "@/lib/permissions";

// ── Username validation ──────────────────────────────────────────────────────

describe("username validation", () => {
  it("accepts valid usernames", () => {
    expect(usernameSchema.safeParse("player_one").success).toBe(true);
    expect(usernameSchema.safeParse("Coach.Smith").success).toBe(true);
    expect(usernameSchema.safeParse("abc").success).toBe(true);
    expect(usernameSchema.safeParse("a".repeat(30)).success).toBe(true);
  });

  it("rejects usernames that are too short", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("").success).toBe(false);
  });

  it("rejects usernames that are too long", () => {
    expect(usernameSchema.safeParse("a".repeat(31)).success).toBe(false);
  });

  it("rejects usernames with invalid characters", () => {
    expect(usernameSchema.safeParse("user name").success).toBe(false);
    expect(usernameSchema.safeParse("user@name").success).toBe(false);
    expect(usernameSchema.safeParse("user-name").success).toBe(false);
    expect(usernameSchema.safeParse("user!name").success).toBe(false);
  });

  it("trims whitespace before validation", () => {
    const result = usernameSchema.safeParse("  player_one  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("player_one");
    }
  });

  it("identifies reserved usernames", () => {
    expect(isReservedUsername("admin")).toBe(true);
    expect(isReservedUsername("ADMIN")).toBe(true);
    expect(isReservedUsername("System")).toBe(true);
    expect(isReservedUsername("teamsster")).toBe(true);
    expect(isReservedUsername("player1")).toBe(false);
    expect(isReservedUsername("coach_sam")).toBe(false);
  });

  it("validates usernames end-to-end with reserved word check", () => {
    const valid = validateUsername("coach_sam");
    expect(valid.valid).toBe(true);
    if (valid.valid) {
      expect(valid.value).toBe("coach_sam");
    }

    const reserved = validateUsername("admin");
    expect(reserved.valid).toBe(false);
    if (!reserved.valid) {
      expect(reserved.error).toContain("isn't available");
    }

    const tooShort = validateUsername("ab");
    expect(tooShort.valid).toBe(false);
    if (!tooShort.valid) {
      expect(tooShort.error).toContain("at least 3");
    }
  });
});

// ── Minor placeholder email ──────────────────────────────────────────────────

describe("minor placeholder email", () => {
  it("builds placeholder emails with the correct domain", () => {
    const email = buildMinorPlaceholderEmail("abc123");
    expect(email).toBe(`minor-abc123@${MINOR_EMAIL_DOMAIN}`);
  });

  it("detects placeholder emails", () => {
    expect(
      isMinorPlaceholderEmail(`minor-abc@${MINOR_EMAIL_DOMAIN}`),
    ).toBe(true);
    expect(isMinorPlaceholderEmail("user@example.com")).toBe(false);
    expect(isMinorPlaceholderEmail("")).toBe(false);
  });

  it("doesn't match partial domain names", () => {
    expect(
      isMinorPlaceholderEmail("user@notminor.internal.teamsster.local"),
    ).toBe(false);
  });
});

// ── Create minor account schema ──────────────────────────────────────────────

describe("createMinorAccountSchema", () => {
  const validInput = {
    displayName: "Alex Jr",
    username: "alex_jr",
    password: "secureP4ss!",
  };

  it("accepts valid input", () => {
    const result = createMinorAccountSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts input with date of birth", () => {
    const result = createMinorAccountSchema.safeParse({
      ...validInput,
      dateOfBirth: "2015-06-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing display name", () => {
    const result = createMinorAccountSchema.safeParse({
      ...validInput,
      displayName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid username", () => {
    const result = createMinorAccountSchema.safeParse({
      ...validInput,
      username: "ab",
    });
    expect(result.success).toBe(false);
  });

  it("rejects reserved username", () => {
    const result = createMinorAccountSchema.safeParse({
      ...validInput,
      username: "admin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = createMinorAccountSchema.safeParse({
      ...validInput,
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date of birth format", () => {
    const result = createMinorAccountSchema.safeParse({
      ...validInput,
      dateOfBirth: "06/15/2015",
    });
    expect(result.success).toBe(false);
  });
});

// ── Link/unlink guardian schemas ──────────────────────────────────────────────

describe("linkGuardianSchema", () => {
  const validLink = {
    guardianUserId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    minorUserId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
  };

  it("accepts valid link input", () => {
    expect(linkGuardianSchema.safeParse(validLink).success).toBe(true);
  });

  it("accepts optional relationship", () => {
    const result = linkGuardianSchema.safeParse({
      ...validLink,
      relationship: "parent",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional isPrimary flag", () => {
    const result = linkGuardianSchema.safeParse({
      ...validLink,
      isPrimary: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID guardian ID", () => {
    expect(
      linkGuardianSchema.safeParse({
        ...validLink,
        guardianUserId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("rejects non-UUID minor ID", () => {
    expect(
      linkGuardianSchema.safeParse({
        ...validLink,
        minorUserId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });
});

describe("unlinkGuardianSchema", () => {
  it("accepts valid unlink input", () => {
    expect(
      unlinkGuardianSchema.safeParse({
        guardianUserId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        minorUserId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      }).success,
    ).toBe(true);
  });
});

// ── Minor account permission checks ──────────────────────────────────────────

describe("minor account permissions", () => {
  it("allows linked guardians to manage minor accounts", () => {
    expect(canManageMinorAccount({ isLinkedGuardian: true })).toBe(true);
  });

  it("allows org admins to manage minor accounts", () => {
    expect(
      canManageMinorAccount({ isLinkedGuardian: false, orgRoles: "ADMIN" }),
    ).toBe(true);
    expect(
      canManageMinorAccount({ isLinkedGuardian: false, orgRoles: "OWNER" }),
    ).toBe(true);
  });

  it("allows team coaches to manage minor accounts", () => {
    expect(
      canManageMinorAccount({ isLinkedGuardian: false, teamRoles: "COACH" }),
    ).toBe(true);
    expect(
      canManageMinorAccount({
        isLinkedGuardian: false,
        teamRoles: "HEAD_COACH",
      }),
    ).toBe(true);
  });

  it("blocks players and guests from managing minor accounts", () => {
    expect(
      canManageMinorAccount({ isLinkedGuardian: false, orgRoles: "PLAYER" }),
    ).toBe(false);
    expect(
      canManageMinorAccount({ isLinkedGuardian: false, orgRoles: "GUEST" }),
    ).toBe(false);
    expect(
      canManageMinorAccount({ isLinkedGuardian: false, teamRoles: "PLAYER" }),
    ).toBe(false);
  });

  it("blocks parents who aren't linked from managing minor accounts", () => {
    expect(
      canManageMinorAccount({ isLinkedGuardian: false, orgRoles: "PARENT" }),
    ).toBe(false);
  });

  it("allows standard accounts to create minor accounts", () => {
    expect(
      canCreateMinorAccount({ actorAccountType: "standard" }),
    ).toBe(true);
  });

  it("blocks minor accounts from creating other minor accounts", () => {
    expect(
      canCreateMinorAccount({ actorAccountType: "minor" }),
    ).toBe(false);
  });
});
