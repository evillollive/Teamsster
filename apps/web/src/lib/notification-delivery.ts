import {
  getNotificationDeliveriesByLeagueId,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  getUserTeamMembership,
  logNotificationDelivery,
  type NotificationDeliverySummary,
} from "@teamsster/db";
import { z } from "zod";

import { canAccessFeature } from "@/lib/permissions";

export const logNotificationDeliverySchema = z.object({
  kind: z.enum(["WEEKLY_DIGEST", "EVENT_REMINDER"]),
  leagueId: z.string().uuid(),
  recipient: z.string().trim().email(),
  status: z.enum(["QUEUED", "SENT", "FAILED"]).default("SENT"),
  teamId: z.string().uuid().optional(),
  templateBody: z.string().trim().min(1).max(10000),
  templateSubject: z.string().trim().min(1).max(240),
});

type LogNotificationDeliveryInput = z.input<
  typeof logNotificationDeliverySchema
>;

async function resolveUserId(authUserId: string): Promise<string> {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }
  return userId;
}

export async function logNotificationDeliveryForUser(
  authUserId: string,
  input: LogNotificationDeliveryInput,
) {
  const parsed = logNotificationDeliverySchema.parse(input);
  const userId = await resolveUserId(authUserId);
  const leagueMembership = await getUserLeagueMembership(
    parsed.leagueId,
    userId,
  );

  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  let canManage = canAccessFeature("notification.manage", {
    orgRoles: leagueMembership.roles,
  });

  if (!canManage && parsed.teamId) {
    const teamMembership = await getUserTeamMembership(parsed.teamId, userId);
    canManage =
      !!teamMembership &&
      canAccessFeature("notification.manage", {
        orgRoles: leagueMembership.roles,
        teamRoles: teamMembership.roles,
      });
  }

  if (!canManage) {
    throw new Error("You do not have permission to log message deliveries.");
  }

  return logNotificationDelivery({
    actorUserId: userId,
    kind: parsed.kind,
    leagueId: parsed.leagueId,
    recipient: parsed.recipient,
    status: parsed.status,
    teamId: parsed.teamId,
    templateBody: parsed.templateBody,
    templateSubject: parsed.templateSubject,
  });
}

export async function getNotificationDeliveriesForLeagueAsUser(
  authUserId: string,
  leagueId: string,
): Promise<NotificationDeliverySummary[]> {
  const userId = await resolveUserId(authUserId);
  const leagueMembership = await getUserLeagueMembership(leagueId, userId);
  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  if (
    !canAccessFeature("notification.manage", {
      orgRoles: leagueMembership.roles,
    })
  ) {
    throw new Error("You do not have permission to view delivery logs.");
  }

  return getNotificationDeliveriesByLeagueId(leagueId);
}
