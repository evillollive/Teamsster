import {
  createFeedToken,
  generateFeedToken,
  getFeedTokenByToken,
  getFeedTokensByUser,
  getUserIdByAuthUserId,
  regenerateFeedToken,
  revokeFeedToken,
} from "@teamsster/db";

// ── Auth-gated operations ────────────────────────────────────────────────────

export async function getCalendarFeedsForUser(authUserId: string) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) return [];
  return getFeedTokensByUser(userId);
}

export async function createCalendarFeedForUser(
  authUserId: string,
  input: { leagueId?: string; teamId?: string },
) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) throw new Error("User profile not found.");

  return createFeedToken({
    userId,
    leagueId: input.leagueId,
    teamId: input.teamId,
  });
}

export async function revokeCalendarFeedForUser(
  authUserId: string,
  tokenId: string,
) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) throw new Error("User profile not found.");

  await revokeFeedToken({ tokenId, userId });
}

export async function regenerateCalendarFeedForUser(
  authUserId: string,
  input: { tokenId: string; leagueId?: string; teamId?: string },
) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) throw new Error("User profile not found.");

  return regenerateFeedToken({
    tokenId: input.tokenId,
    userId,
    leagueId: input.leagueId,
    teamId: input.teamId,
  });
}

/**
 * Builds the full subscription URL for a feed token.
 */
export function buildFeedUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/api/calendar/${token}.ics`;
}

// ── iCal generation ──────────────────────────────────────────────────────────

export function generateICalEvent(event: {
  uid: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
}): string {
  const formatDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTART:${formatDate(event.startTime)}`,
    `DTEND:${formatDate(event.endTime)}`,
    `SUMMARY:${escapeICalText(event.title)}`,
  ];

  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }

  lines.push(`DTSTAMP:${formatDate(new Date())}`, "END:VEVENT");
  return lines.join("\r\n");
}

export function generateICalFeed(
  events: Parameters<typeof generateICalEvent>[0][],
): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Teamsster//Calendar Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Teamsster Calendar",
  ].join("\r\n");

  const body = events.map(generateICalEvent).join("\r\n");
  const footer = "END:VCALENDAR";

  return `${header}\r\n${body}\r\n${footer}`;
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
