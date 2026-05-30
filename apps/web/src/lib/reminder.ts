import {
  type eventRsvpStatusValues,
  getEventReminderCandidatesByUserId,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  getUserSettingsByAuthUserId,
  getUserTeamMembership,
} from "@teamsster/db";

import { hasEnabledNotificationChannel } from "@/lib/account";
import { canAccessFeature } from "@/lib/permissions";

type RsvpStatus = (typeof eventRsvpStatusValues)[number];

export type EventReminder = {
  eventId: string;
  leagueId: string;
  teamId: string;
  teamName: string;
  title: string;
  startsAt: Date;
  timezone: string;
  rsvpStatus: RsvpStatus;
  reminderAt: Date;
};

export function getDefaultReminderOffsetMinutes(status: RsvpStatus) {
  switch (status) {
    case "YES":
      return 24 * 60;
    case "MAYBE":
      return 2 * 60;
    case "NO":
      return null;
    default:
      return null;
  }
}

function getReminderAt(startsAt: Date, offsetMinutes: number) {
  return new Date(startsAt.getTime() - offsetMinutes * 60_000);
}

export async function getEventRemindersForUser(
  authUserId: string,
  now = new Date(),
) {
  const [settings, userId] = await Promise.all([
    getUserSettingsByAuthUserId(authUserId),
    getUserIdByAuthUserId(authUserId),
  ]);

  if (
    !hasEnabledNotificationChannel(
      settings?.notificationPreferences.EVENT_REMINDER,
    ) ||
    !userId
  ) {
    return { due: [] as EventReminder[], upcoming: [] as EventReminder[] };
  }

  const candidates = await getEventReminderCandidatesByUserId(userId, now);
  const leagueMembershipCache = new Map<
    string,
    Awaited<ReturnType<typeof getUserLeagueMembership>>
  >();
  const teamMembershipCache = new Map<
    string,
    Awaited<ReturnType<typeof getUserTeamMembership>>
  >();
  const reminders: EventReminder[] = [];

  for (const candidate of candidates) {
    const offset = getDefaultReminderOffsetMinutes(candidate.rsvpStatus);
    if (offset === null) {
      continue;
    }

    const startsAt = new Date(candidate.startsAt);
    const reminderAt = getReminderAt(startsAt, offset);

    let leagueMembership = leagueMembershipCache.get(candidate.leagueId);
    if (!leagueMembership) {
      leagueMembership = await getUserLeagueMembership(
        candidate.leagueId,
        userId,
      );
      leagueMembershipCache.set(candidate.leagueId, leagueMembership);
    }
    if (!leagueMembership) {
      continue;
    }

    const hasOrgAccess = canAccessFeature("event.rsvp", {
      orgRoles: leagueMembership.roles,
    });
    if (!hasOrgAccess) {
      let teamMembership = teamMembershipCache.get(candidate.teamId);
      if (!teamMembership) {
        teamMembership = await getUserTeamMembership(candidate.teamId, userId);
        teamMembershipCache.set(candidate.teamId, teamMembership);
      }
      if (
        !teamMembership ||
        !canAccessFeature("event.rsvp", {
          orgRoles: leagueMembership.roles,
          teamRoles: teamMembership.roles,
        })
      ) {
        continue;
      }
    }

    reminders.push({
      eventId: candidate.eventId,
      leagueId: candidate.leagueId,
      teamId: candidate.teamId,
      teamName: candidate.teamName,
      title: candidate.title,
      startsAt,
      timezone: candidate.timezone,
      rsvpStatus: candidate.rsvpStatus,
      reminderAt,
    });
  }

  const sorted = reminders.sort(
    (a, b) => a.reminderAt.getTime() - b.reminderAt.getTime(),
  );
  return {
    due: sorted.filter((item) => item.reminderAt <= now),
    upcoming: sorted.filter((item) => item.reminderAt > now).slice(0, 5),
  };
}
