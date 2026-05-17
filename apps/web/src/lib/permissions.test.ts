import { describe, expect, it } from "vitest";

import {
  assertPermission,
  canEditRoster,
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
    expect(canViewAuditLog("BOARD_MEMBER")).toBe(true);
    expect(canManageLeague("COACH")).toBe(false);
  });

  it("resolves capabilities as a union for multi-role memberships", () => {
    expect(canManageLeague(["PARENT", "ADMIN"])).toBe(true);
    expect(canEditRoster(["PLAYER", "COACH"])).toBe(true);
    expect(canViewAuditLog(["PARENT", "PLAYER"])).toBe(false);
    expect(getHighestRole(["COACH", "ADMIN", "PLAYER"])).toBe("ADMIN");
  });

  it("throws when an action is not permitted", () => {
    expect(() => assertPermission("GUEST", ["OWNER", "ADMIN"])).toThrow(
      /not allowed/,
    );
    expect(() => assertPermission("OWNER", ["OWNER", "ADMIN"])).not.toThrow();
  });
});
