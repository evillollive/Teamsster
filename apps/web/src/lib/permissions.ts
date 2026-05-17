import type { roleValues } from "@teamsster/db/schema";

export type Role = (typeof roleValues)[number];
export type RoleInput = Role | readonly Role[];

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

export function getHighestRole(roleInput: RoleInput): Role {
  return (
    [...toRoles(roleInput)].sort((a, b) => roleRank[b] - roleRank[a])[0] ??
    "GUEST"
  );
}

export function canManageLeague(roleInput: RoleInput) {
  return toRoles(roleInput).some((role) => hasMinimumRole(role, "ADMIN"));
}

export function canManageTeam(roleInput: RoleInput) {
  return toRoles(roleInput).some((role) => hasMinimumRole(role, "HEAD_COACH"));
}

export function canEditRoster(roleInput: RoleInput) {
  return toRoles(roleInput).some((role) => hasMinimumRole(role, "COACH"));
}

export function canViewAuditLog(roleInput: RoleInput) {
  return toRoles(roleInput).some((role) =>
    hasMinimumRole(role, "BOARD_MEMBER"),
  );
}

export function assertPermission(currentRole: Role, allowedRoles: Role[]) {
  if (allowedRoles.includes(currentRole)) {
    return;
  }

  throw new Error(`Role ${currentRole} is not allowed to perform this action.`);
}
