import {
  archiveAnnouncement,
  createAnnouncement,
  getAnnouncementById,
  getAnnouncementsByLeagueId,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  getUserTeamMembership,
} from "@teamsster/db";
import { z } from "zod";

import { canAccessFeature } from "@/lib/permissions";

export const createAnnouncementSchema = z.object({
  leagueId: z.string().uuid(),
  teamId: z
    .string()
    .uuid()
    .optional()
    .transform((value) => value || undefined),
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(5000),
});

export const archiveAnnouncementSchema = z.object({
  announcementId: z.string().uuid(),
  leagueId: z.string().uuid(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

async function resolveUserId(authUserId: string): Promise<string> {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }
  return userId;
}

export async function createAnnouncementForUser(
  authUserId: string,
  input: CreateAnnouncementInput,
) {
  const parsed = createAnnouncementSchema.parse(input);
  const userId = await resolveUserId(authUserId);
  const leagueMembership = await getUserLeagueMembership(
    parsed.leagueId,
    userId,
  );

  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  if (!parsed.teamId) {
    if (
      !canAccessFeature("announcement.manage", {
        orgRoles: leagueMembership.roles,
      })
    ) {
      throw new Error(
        "You do not have permission to publish league announcements.",
      );
    }
  } else if (
    !canAccessFeature("announcement.manage", {
      orgRoles: leagueMembership.roles,
    })
  ) {
    const teamMembership = await getUserTeamMembership(parsed.teamId, userId);
    if (
      !teamMembership ||
      !canAccessFeature("announcement.manage", {
        orgRoles: leagueMembership.roles,
        teamRoles: teamMembership.roles,
      })
    ) {
      throw new Error(
        "You do not have permission to publish announcements for this team.",
      );
    }
  }

  return createAnnouncement({
    body: parsed.body,
    leagueId: parsed.leagueId,
    teamId: parsed.teamId,
    title: parsed.title,
    userId,
  });
}

export async function getAnnouncementsForLeagueAsUser(
  authUserId: string,
  leagueId: string,
) {
  const userId = await resolveUserId(authUserId);
  const leagueMembership = await getUserLeagueMembership(leagueId, userId);
  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  const announcements = await getAnnouncementsByLeagueId(leagueId);
  if (
    announcements.length === 0 ||
    canAccessFeature("announcement.manage", {
      orgRoles: leagueMembership.roles,
    })
  ) {
    return announcements;
  }

  const teamMembershipCache = new Map<string, Promise<boolean>>();
  const filtered = await Promise.all(
    announcements.map(async (announcement) => {
      if (!announcement.teamId) {
        return announcement;
      }

      if (!teamMembershipCache.has(announcement.teamId)) {
        teamMembershipCache.set(
          announcement.teamId,
          getUserTeamMembership(announcement.teamId, userId).then(Boolean),
        );
      }

      const hasTeamMembership = await teamMembershipCache.get(
        announcement.teamId,
      );
      return hasTeamMembership ? announcement : null;
    }),
  );

  return filtered.filter(
    (announcement): announcement is (typeof announcements)[number] =>
      Boolean(announcement),
  );
}

export async function archiveAnnouncementForUser(
  authUserId: string,
  announcementId: string,
  leagueId: string,
) {
  const parsed = archiveAnnouncementSchema.parse({ announcementId, leagueId });
  const userId = await resolveUserId(authUserId);
  const leagueMembership = await getUserLeagueMembership(
    parsed.leagueId,
    userId,
  );
  if (!leagueMembership) {
    throw new Error("You are not a member of this league.");
  }

  const announcement = await getAnnouncementById(parsed.announcementId);
  if (!announcement || announcement.leagueId !== parsed.leagueId) {
    throw new Error("Announcement not found or already archived.");
  }

  if (!announcement.teamId) {
    if (
      !canAccessFeature("announcement.manage", {
        orgRoles: leagueMembership.roles,
      })
    ) {
      throw new Error(
        "You do not have permission to archive league announcements.",
      );
    }
  } else if (
    !canAccessFeature("announcement.manage", {
      orgRoles: leagueMembership.roles,
    })
  ) {
    const teamMembership = await getUserTeamMembership(
      announcement.teamId,
      userId,
    );
    if (
      !teamMembership ||
      !canAccessFeature("announcement.manage", {
        orgRoles: leagueMembership.roles,
        teamRoles: teamMembership.roles,
      })
    ) {
      throw new Error(
        "You do not have permission to archive announcements for this team.",
      );
    }
  }

  await archiveAnnouncement({
    actorUserId: userId,
    announcementId: parsed.announcementId,
    leagueId: parsed.leagueId,
  });
}
