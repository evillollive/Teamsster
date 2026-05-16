import type { roleValues } from "@teamsster/db/schema";

export type Role = (typeof roleValues)[number];

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

export function canManageLeague(currentRole: Role) {
  return hasMinimumRole(currentRole, "ADMIN");
}

export function canManageTeam(currentRole: Role) {
  return hasMinimumRole(currentRole, "HEAD_COACH");
}

export function canEditRoster(currentRole: Role) {
  return hasMinimumRole(currentRole, "COACH");
}

export function canViewAuditLog(currentRole: Role) {
  return hasMinimumRole(currentRole, "BOARD_MEMBER");
}

export function assertPermission(currentRole: Role, allowedRoles: Role[]) {
  if (allowedRoles.includes(currentRole)) {
    return;
  }

  throw new Error(`Role ${currentRole} is not allowed to perform this action.`);
}
