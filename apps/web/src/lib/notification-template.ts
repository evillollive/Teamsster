import type { AnnouncementSummary } from "@teamsster/db";

import type { EventReminder } from "@/lib/reminder";

type EmailTemplate = {
  subject: string;
  body: string;
};

export function buildWeeklyDigestTemplate(input: {
  leagueName: string;
  generatedAt: Date;
  announcements: Pick<
    AnnouncementSummary,
    "title" | "body" | "publishedAt" | "teamName"
  >[];
}): EmailTemplate {
  const headingDate = input.generatedAt.toLocaleDateString();
  const subject = `${input.leagueName} weekly digest · ${headingDate}`;
  const intro = `Hello,\n\nHere is your weekly digest for ${input.leagueName}.`;

  if (input.announcements.length === 0) {
    return {
      subject,
      body: `${intro}\n\nNo new announcements were published this week.\n\n— Teamsster`,
    };
  }

  const updates = input.announcements
    .slice(0, 5)
    .map((announcement, index) => {
      const audience = announcement.teamName
        ? `Team: ${announcement.teamName}`
        : "League-wide";
      return `${index + 1}. ${announcement.title}\n${audience}\nPublished: ${announcement.publishedAt.toLocaleString()}\n${announcement.body}`;
    })
    .join("\n\n");

  return {
    subject,
    body: `${intro}\n\n${updates}\n\nManage your notification preferences in Teamsster account settings.\n\n— Teamsster`,
  };
}

export function buildEventReminderTemplate(input: {
  leagueName: string;
  reminder: EventReminder;
}): EmailTemplate {
  const subject = `Reminder: ${input.reminder.title} (${input.reminder.teamName})`;
  return {
    subject,
    body: [
      "Hello,",
      "",
      `This is a reminder for ${input.leagueName}:`,
      `Event: ${input.reminder.title}`,
      `Team: ${input.reminder.teamName}`,
      `RSVP status: ${input.reminder.rsvpStatus}`,
      `Starts: ${input.reminder.startsAt.toLocaleString()} (${input.reminder.timezone})`,
      `Reminder time: ${input.reminder.reminderAt.toLocaleString()}`,
      "",
      "You can update your RSVP and notification preferences in Teamsster.",
      "",
      "— Teamsster",
    ].join("\n"),
  };
}
