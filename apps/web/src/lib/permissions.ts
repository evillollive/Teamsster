import type { roleValues } from "@teamsster/db/schema";

export type Role = (typeof roleValues)[number];
export type RoleInput = Role | readonly Role[];
export type PermissionScope = "org" | "team" | "feature" | "field";
export type FeaturePermission =
  | "audit.read"
  | "league.manage"
  | "membership.manage"
  | "roster.edit"
  | "team.manage";
export type PermissionContext = {
  orgRoles?: RoleInput;
  teamRoles?: RoleInput;
};

const roleRank: Record<Role, number> = {
  OWNER: 80,
  ADMIN: 70,
  HEAD_COACH: 60,
  COACH: 50,
  BOARD_MEMBER: 40,
  PLAYER: 30,
  PARENT: 20,
  GUEST: 10,
};

export function hasMinimumRole(currentRole: Role, minimumRole: Role) {
  return roleRank[currentRole] >= roleRank[minimumRole];
}

function toRoles(roleInput: RoleInput): readonly Role[] {
  return typeof roleInput === "string" ? [roleInput] : roleInput;
}

function toOptionalRoles(roleInput?: RoleInput): readonly Role[] {
  return roleInput ? toRoles(roleInput) : [];
}

export function getHighestRole(roleInput: RoleInput): Role {
  return (
    [...toRoles(roleInput)].sort((a, b) => roleRank[b] - roleRank[a])[0] ??
    "GUEST"
  );
}

function hasScopedPermission(
  scope: Extract<PermissionScope, "org" | "team">,
  minimumRole: Role,
  context: PermissionContext,
) {
  const roles =
    scope === "org"
      ? toOptionalRoles(context.orgRoles)
      : toOptionalRoles(context.teamRoles);
  return roles.some((role) => hasMinimumRole(role, minimumRole));
}

export function canAccessFeature(
  feature: FeaturePermission,
  context: PermissionContext,
) {
  switch (feature) {
    case "league.manage":
    case "membership.manage":
      return hasScopedPermission("org", "ADMIN", context);
    case "team.manage":
      return (
        hasScopedPermission("org", "ADMIN", context) ||
        hasScopedPermission("team", "HEAD_COACH", context)
      );
    case "roster.edit":
      return (
        hasScopedPermission("org", "ADMIN", context) ||
        hasScopedPermission("team", "COACH", context)
      );
    case "audit.read":
      return hasScopedPermission("org", "BOARD_MEMBER", context);
    default:
      return false;
  }
}

export function canManageLeague(roleInput: RoleInput) {
  return canAccessFeature("league.manage", { orgRoles: roleInput });
}

export function canManageTeam(roleInput: RoleInput) {
  return canAccessFeature("team.manage", {
    orgRoles: roleInput,
    teamRoles: roleInput,
  });
}

export function canEditRoster(roleInput: RoleInput) {
  return canAccessFeature("roster.edit", {
    orgRoles: roleInput,
    teamRoles: roleInput,
  });
}

export function canViewAuditLog(roleInput: RoleInput) {
  return canAccessFeature("audit.read", { orgRoles: roleInput });
}

export function assertPermission(currentRole: Role, allowedRoles: Role[]) {
  if (allowedRoles.includes(currentRole)) {
    return;
  }

  throw new Error(`Role ${currentRole} is not allowed to perform this action.`);
}
