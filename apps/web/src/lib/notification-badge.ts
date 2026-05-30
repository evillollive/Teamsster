import { auth } from "@teamsster/auth";
import {
  getUnreadNotificationCountByUserId,
  getUserIdByAuthUserId,
} from "@teamsster/db";
import { headers } from "next/headers";

/**
 * Returns the unread notification count for the current session user.
 * Returns 0 if not authenticated or user profile doesn't exist.
 */
export async function getUnreadCountForSession(): Promise<number> {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user?.id) return 0;

    const userId = await getUserIdByAuthUserId(session.user.id);
    if (!userId) return 0;

    return await getUnreadNotificationCountByUserId(userId);
  } catch {
    return 0;
  }
}
