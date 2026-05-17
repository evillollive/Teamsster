import { describe, expect, it } from "vitest";

import {
  assertPermission,
  canAccessFeature,
  canAccessField,
  canEditRoster,
  canManageEvents,
  canManageLeague,
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
      canAccessFeature("audit.read", {
        teamRoles: "HEAD_COACH",
      }),
    ).toBe(false);
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
});
