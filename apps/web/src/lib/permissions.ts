import type { roleValues } from "@teamsster/db/schema";

export type Role = (typeof roleValues)[number];
export type RoleInput = Role | readonly Role[];
export type PermissionScope = "org" | "team" | "feature" | "field" | "action";
export type FeaturePermission =
  | "announcement.manage"
  | "announcement.read"
  | "audit.read"
  | "event.manage"
  | "event.rsvp"
  | "league.manage"
  | "membership.manage"
  | "notification.manage"
  | "roster.edit"
  | "team.manage";
export type FieldPermission = "contact.viewEmail" | "contact.viewPhone";
export type ActionPermission =
  | "contact.call"
  | "contact.email"
  | "contact.sms"
  | "contact.export";
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
    case "announcement.manage":
      return (
        hasScopedPermission("org", "ADMIN", context) ||
        hasScopedPermission("team", "COACH", context)
      );
    case "announcement.read":
      return (
        hasScopedPermission("org", "GUEST", context) ||
        hasScopedPermission("team", "GUEST", context)
      );
    case "league.manage":
    case "membership.manage":
    case "notification.manage":
      return hasScopedPermission("org", "ADMIN", context);
    case "team.manage":
      return (
        hasScopedPermission("org", "ADMIN", context) ||
        hasScopedPermission("team", "HEAD_COACH", context)
      );
    case "event.manage":
    case "roster.edit":
      return (
        hasScopedPermission("org", "ADMIN", context) ||
        hasScopedPermission("team", "COACH", context)
      );
    case "event.rsvp":
      return (
        hasScopedPermission("org", "GUEST", context) ||
        hasScopedPermission("team", "GUEST", context)
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

export function canManageEvents(roleInput: RoleInput) {
  return canAccessFeature("event.manage", {
    orgRoles: roleInput,
    teamRoles: roleInput,
  });
}

export function canViewAuditLog(roleInput: RoleInput) {
  return canAccessFeature("audit.read", { orgRoles: roleInput });
}

export function canAccessField(
  field: FieldPermission,
  context: PermissionContext,
) {
  switch (field) {
    case "contact.viewEmail":
    case "contact.viewPhone":
      return (
        hasScopedPermission("org", "BOARD_MEMBER", context) ||
        hasScopedPermission("team", "COACH", context)
      );
    default:
      return false;
  }
}

export function canAccessAction(
  action: ActionPermission,
  context: PermissionContext,
) {
  switch (action) {
    case "contact.call":
    case "contact.email":
    case "contact.sms":
      return (
        hasScopedPermission("org", "BOARD_MEMBER", context) ||
        hasScopedPermission("team", "COACH", context)
      );
    case "contact.export":
      return (
        hasScopedPermission("org", "ADMIN", context) ||
        hasScopedPermission("team", "HEAD_COACH", context)
      );
    default:
      return false;
  }
}

export function assertPermission(currentRole: Role, allowedRoles: Role[]) {
  if (allowedRoles.includes(currentRole)) {
    return;
  }

  throw new Error(`Role ${currentRole} is not allowed to perform this action.`);
}

/**
 * Checks whether the actor can manage a minor account. Allowed for:
 * - Linked guardians of the minor
 * - League/team admins and coaches (staff-level roles)
 */
export function canManageMinorAccount(context: {
  isLinkedGuardian: boolean;
  orgRoles?: RoleInput;
  teamRoles?: RoleInput;
}) {
  if (context.isLinkedGuardian) {
    return true;
  }
  return (
    hasScopedPermission("org", "ADMIN", context) ||
    hasScopedPermission("team", "COACH", context)
  );
}

/**
 * Checks whether the actor can create a minor account. Allowed for:
 * - Any standard (non-minor) account holder (they become the guardian)
 * - League/team admins and coaches creating on behalf of a player
 */
export function canCreateMinorAccount(context: {
  actorAccountType: string;
  orgRoles?: RoleInput;
  teamRoles?: RoleInput;
}) {
  if (context.actorAccountType === "minor") {
    return false;
  }
  return true;
}
