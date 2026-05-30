import { describe, expect, it } from "vitest";

import {
  assertPermission,
  canAccessAction,
  canAccessFeature,
  canAccessField,
  canCreateMinorAccount,
  canEditRoster,
  canManageEvents,
  canManageLeague,
  canManageMinorAccount,
  canManageTeam,
  canViewAuditLog,
  getHighestRole,
  hasMinimumRole,
} from "@/lib/permissions";

describe("permissions", () => {
  it("orders roles consistently", () => {
    expect(hasMinimumRole("OWNER", "ADMIN")).toBe(true);
    expect(hasMinimumRole("PLAYER", "COACH")).toBe(false);
  });

  it("derives capability helpers from roles", () => {
    expect(canManageLeague("ADMIN")).toBe(true);
    expect(canManageTeam("HEAD_COACH")).toBe(true);
    expect(canEditRoster("COACH")).toBe(true);
    expect(canManageEvents("COACH")).toBe(true);
    expect(canManageTeam("ADMIN")).toBe(true);
    expect(canEditRoster("ADMIN")).toBe(true);
    expect(canViewAuditLog("BOARD_MEMBER")).toBe(true);
    expect(canManageLeague("COACH")).toBe(false);
  });

  it("resolves capabilities as a union for multi-role memberships", () => {
    expect(canManageLeague(["PARENT", "ADMIN"])).toBe(true);
    expect(canEditRoster(["PLAYER", "COACH"])).toBe(true);
    expect(canViewAuditLog(["PARENT", "PLAYER"])).toBe(false);
    expect(getHighestRole(["COACH", "ADMIN", "PLAYER"])).toBe("ADMIN");
  });

  it("supports layered org and feature scopes", () => {
    expect(
      canAccessFeature("membership.manage", {
        orgRoles: ["PARENT", "ADMIN"],
      }),
    ).toBe(true);
    expect(
      canAccessFeature("roster.edit", {
        orgRoles: "PLAYER",
        teamRoles: "COACH",
      }),
    ).toBe(true);
    expect(
      canAccessFeature("event.manage", {
        orgRoles: "PLAYER",
        teamRoles: "COACH",
      }),
    ).toBe(true);
    expect(
      canAccessFeature("announcement.manage", {
        orgRoles: "PLAYER",
        teamRoles: "COACH",
      }),
    ).toBe(true);
    expect(
      canAccessFeature("audit.read", {
        teamRoles: "HEAD_COACH",
      }),
    ).toBe(false);
  });

  it("grants event.rsvp to any league or team member including GUEST", () => {
    expect(canAccessFeature("event.rsvp", { orgRoles: "GUEST" })).toBe(true);
    expect(canAccessFeature("event.rsvp", { teamRoles: "GUEST" })).toBe(true);
    expect(canAccessFeature("event.rsvp", { orgRoles: "PLAYER" })).toBe(true);
    expect(canAccessFeature("event.rsvp", { teamRoles: "COACH" })).toBe(true);
    expect(canAccessFeature("event.rsvp", {})).toBe(false);
  });

  it("grants announcement.read to any league or team member including GUEST", () => {
    expect(canAccessFeature("announcement.read", { orgRoles: "GUEST" })).toBe(
      true,
    );
    expect(canAccessFeature("announcement.read", { teamRoles: "GUEST" })).toBe(
      true,
    );
    expect(canAccessFeature("announcement.read", {})).toBe(false);
  });

  it("grants notification.manage only to org ADMIN or above", () => {
    expect(canAccessFeature("notification.manage", { orgRoles: "ADMIN" })).toBe(
      true,
    );
    expect(canAccessFeature("notification.manage", { orgRoles: "OWNER" })).toBe(
      true,
    );
    expect(canAccessFeature("notification.manage", { orgRoles: "COACH" })).toBe(
      false,
    );
    expect(
      canAccessFeature("notification.manage", { teamRoles: "HEAD_COACH" }),
    ).toBe(false);
    expect(canAccessFeature("notification.manage", {})).toBe(false);
  });

  it("throws when an action is not permitted", () => {
    expect(() => assertPermission("GUEST", ["OWNER", "ADMIN"])).toThrow(
      /not allowed/,
    );
    expect(() => assertPermission("OWNER", ["OWNER", "ADMIN"])).not.toThrow();
  });

  describe("canAccessField (field-level permissions)", () => {
    it("grants contact field access to COACH or above at team scope", () => {
      expect(canAccessField("contact.viewEmail", { teamRoles: "COACH" })).toBe(
        true,
      );
      expect(
        canAccessField("contact.viewPhone", { teamRoles: "HEAD_COACH" }),
      ).toBe(true);
      expect(canAccessField("contact.viewEmail", { teamRoles: "OWNER" })).toBe(
        true,
      );
    });

    it("grants contact field access to BOARD_MEMBER or above at org scope", () => {
      expect(
        canAccessField("contact.viewEmail", { orgRoles: "BOARD_MEMBER" }),
      ).toBe(true);
      expect(canAccessField("contact.viewPhone", { orgRoles: "ADMIN" })).toBe(
        true,
      );
    });

    it("denies contact field access to roles below COACH at team scope", () => {
      expect(canAccessField("contact.viewEmail", { teamRoles: "PLAYER" })).toBe(
        false,
      );
      expect(canAccessField("contact.viewPhone", { teamRoles: "PARENT" })).toBe(
        false,
      );
      expect(canAccessField("contact.viewEmail", { teamRoles: "GUEST" })).toBe(
        false,
      );
    });

    it("denies contact field access to roles below BOARD_MEMBER at org scope", () => {
      expect(canAccessField("contact.viewEmail", { orgRoles: "PLAYER" })).toBe(
        false,
      );
      expect(canAccessField("contact.viewPhone", { orgRoles: "PARENT" })).toBe(
        false,
      );
    });

    it("grants access when team role qualifies even if org role does not", () => {
      expect(
        canAccessField("contact.viewEmail", {
          orgRoles: "PLAYER",
          teamRoles: "COACH",
        }),
      ).toBe(true);
    });

    it("denies access when no roles are provided", () => {
      expect(canAccessField("contact.viewEmail", {})).toBe(false);
      expect(canAccessField("contact.viewPhone", {})).toBe(false);
    });
  });

  describe("canAccessAction (action-level permissions)", () => {
    it("grants call/email/sms to COACH at team scope", () => {
      expect(canAccessAction("contact.call", { teamRoles: "COACH" })).toBe(
        true,
      );
      expect(canAccessAction("contact.email", { teamRoles: "COACH" })).toBe(
        true,
      );
      expect(canAccessAction("contact.sms", { teamRoles: "COACH" })).toBe(true);
    });

    it("requires elevated role for contact export", () => {
      expect(canAccessAction("contact.export", { teamRoles: "COACH" })).toBe(
        false,
      );
      expect(
        canAccessAction("contact.export", { teamRoles: "HEAD_COACH" }),
      ).toBe(true);
      expect(canAccessAction("contact.export", { orgRoles: "ADMIN" })).toBe(
        true,
      );
    });

    it("denies action access without required roles", () => {
      expect(canAccessAction("contact.call", { teamRoles: "PLAYER" })).toBe(
        false,
      );
      expect(canAccessAction("contact.email", { orgRoles: "PLAYER" })).toBe(
        false,
      );
      expect(canAccessAction("contact.sms", {})).toBe(false);
      expect(
        canAccessAction("contact.export", { orgRoles: "BOARD_MEMBER" }),
      ).toBe(false);
    });
  });

  describe("canManageMinorAccount", () => {
    it("allows linked guardians regardless of role", () => {
      expect(canManageMinorAccount({ isLinkedGuardian: true })).toBe(true);
      expect(
        canManageMinorAccount({ isLinkedGuardian: true, orgRoles: "GUEST" }),
      ).toBe(true);
    });

    it("allows org admins who aren't linked guardians", () => {
      expect(
        canManageMinorAccount({ isLinkedGuardian: false, orgRoles: "ADMIN" }),
      ).toBe(true);
    });

    it("allows team coaches who aren't linked guardians", () => {
      expect(
        canManageMinorAccount({ isLinkedGuardian: false, teamRoles: "COACH" }),
      ).toBe(true);
    });

    it("blocks non-staff non-guardian users", () => {
      expect(
        canManageMinorAccount({ isLinkedGuardian: false, orgRoles: "PARENT" }),
      ).toBe(false);
      expect(
        canManageMinorAccount({ isLinkedGuardian: false, orgRoles: "PLAYER" }),
      ).toBe(false);
    });
  });

  describe("canCreateMinorAccount", () => {
    it("allows standard accounts", () => {
      expect(canCreateMinorAccount({ actorAccountType: "standard" })).toBe(
        true,
      );
    });

    it("blocks minor accounts from creating minors", () => {
      expect(canCreateMinorAccount({ actorAccountType: "minor" })).toBe(false);
    });
  });

  describe("captain contact visibility", () => {
    it("grants contact field access to full captains on the team", () => {
      expect(
        canAccessField("contact.viewEmail", {
          teamRoles: "PLAYER",
          isCaptainOnTeam: true,
          captainPermissionLevel: "full",
        }),
      ).toBe(true);
      expect(
        canAccessField("contact.viewPhone", {
          teamRoles: "PLAYER",
          isCaptainOnTeam: true,
          captainPermissionLevel: "full",
        }),
      ).toBe(true);
    });

    it("denies contact field access to restricted captains", () => {
      expect(
        canAccessField("contact.viewEmail", {
          teamRoles: "PLAYER",
          isCaptainOnTeam: true,
          captainPermissionLevel: "restricted",
        }),
      ).toBe(false);
      expect(
        canAccessField("contact.viewPhone", {
          teamRoles: "PLAYER",
          isCaptainOnTeam: true,
          captainPermissionLevel: "restricted",
        }),
      ).toBe(false);
    });

    it("denies contact field access when not a captain", () => {
      expect(
        canAccessField("contact.viewEmail", {
          teamRoles: "PLAYER",
          isCaptainOnTeam: false,
          captainPermissionLevel: null,
        }),
      ).toBe(false);
    });

    it("grants access via captain even when org/team roles are insufficient", () => {
      expect(
        canAccessField("contact.viewEmail", {
          orgRoles: "PLAYER",
          teamRoles: "PLAYER",
          isCaptainOnTeam: true,
          captainPermissionLevel: "full",
        }),
      ).toBe(true);
    });
  });
});
