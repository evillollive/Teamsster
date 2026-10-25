import { getActiveUserAuthIds } from "@teamsster/db";
import { type NextRequest, NextResponse } from "next/server";

import { getEventRemindersForUser } from "@/lib/reminder";

const REMINDER_CRON_BATCH_SIZE = 10;

type ReminderCronResult = {
  processed: number;
  remindersFound: number;
};

async function processReminderUser(
  authUserId: string,
  now: Date,
): Promise<ReminderCronResult> {
  try {
    const { due } = await getEventRemindersForUser(authUserId, now);
    if (due.length > 0) {
      // TODO: Send reminder emails via SMTP transport once configured.
      // For now, log the reminders for observability.
      console.log(
        `[cron/reminders] ${due.length} due reminder(s) for user ${authUserId}`,
      );
    }
    return { processed: 1, remindersFound: due.length };
  } catch (error) {
    console.error(
      `[cron/reminders] Error processing user ${authUserId}:`,
      error,
    );
    return { processed: 0, remindersFound: 0 };
  }
}

/**
 * Cron-compatible API route for processing event reminders.
 *
 * Intended to be called by Vercel Cron (vercel.json) or an external scheduler.
 * Requires CRON_SECRET env var to match the Authorization header.
 *
 * For each active user with event reminders enabled, checks for due reminders
 * and logs them. Email delivery should be wired once SMTP is configured.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const authUserIds = await getActiveUserAuthIds();

  let processed = 0;
  let remindersFound = 0;

  for (
    let index = 0;
    index < authUserIds.length;
    index += REMINDER_CRON_BATCH_SIZE
  ) {
    const batch = authUserIds.slice(index, index + REMINDER_CRON_BATCH_SIZE);
    const results = await Promise.all(
      batch.map((authUserId) => processReminderUser(authUserId, now)),
    );

    for (const result of results) {
      processed += result.processed;
      remindersFound += result.remindersFound;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    remindersFound,
    timestamp: now.toISOString(),
  });
}
