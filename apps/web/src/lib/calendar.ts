import type { EventRecurrenceRule } from "@teamsster/db";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
  timezone: string;
  recurrenceRule: EventRecurrenceRule;
};

type BuildIcsInput = {
  calendarName: string;
  events: CalendarEvent[];
  generatedAt?: Date;
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toIcsDateUtc(value: Date | string) {
  return toDate(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function toIcsUntil(value: string | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return toIcsDateUtc(date);
}

function toRrule(rule: EventRecurrenceRule) {
  if (rule.frequency === "NONE") {
    return null;
  }

  const parts = [
    `FREQ=${rule.frequency}`,
    `INTERVAL=${Math.max(1, rule.interval)}`,
  ];
  const until = toIcsUntil(rule.until);
  if (until) {
    parts.push(`UNTIL=${until}`);
  }
  if (rule.count && rule.count > 0) {
    parts.push(`COUNT=${Math.floor(rule.count)}`);
  }
  return parts.join(";");
}

export function buildTeamEventsIcs(input: BuildIcsInput) {
  const now = input.generatedAt ?? new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Teamsster//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(input.calendarName)}`,
  ];

  for (const event of input.events) {
    const rrule = toRrule(event.recurrenceRule);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@teamsster.app`);
    lines.push(`DTSTAMP:${toIcsDateUtc(now)}`);
    lines.push(`DTSTART:${toIcsDateUtc(event.startsAt)}`);
    lines.push(`DTEND:${toIcsDateUtc(event.endsAt)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    lines.push(`X-TEAMSSTER-TIMEZONE:${escapeIcsText(event.timezone)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    if (rrule) {
      lines.push(`RRULE:${rrule}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
