import { db, users } from "@teamsster/db";
import { isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { getEventRemindersForUser } from "@/lib/reminder";

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
  const activeUsers = await db
    .select({ authUserId: users.authUserId })
    .from(users)
    .where(isNull(users.deletedAt));

  let processed = 0;
  let remindersFound = 0;

  for (const user of activeUsers) {
    if (!user.authUserId) continue;

    try {
      const { due } = await getEventRemindersForUser(user.authUserId, now);
      if (due.length > 0) {
        remindersFound += due.length;
        // TODO: Send reminder emails via SMTP transport once configured.
        // For now, log the reminders for observability.
        console.log(
          `[cron/reminders] ${due.length} due reminder(s) for user ${user.authUserId}`,
        );
      }
      processed++;
    } catch (error) {
      console.error(
        `[cron/reminders] Error processing user ${user.authUserId}:`,
        error,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    remindersFound,
    timestamp: now.toISOString(),
  });
}
