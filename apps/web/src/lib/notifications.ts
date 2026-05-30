import {
  getNotificationFeedByUserId,
  getNotificationPreferencesByUserId,
  getUnreadNotificationCountByUserId,
  getUserIdByAuthUserId,
  markAllNotificationFeedItemsRead,
  markNotificationFeedItemRead,
} from "@teamsster/db";

async function resolveUserId(authUserId: string) {
  const userId = await getUserIdByAuthUserId(authUserId);
  if (!userId) {
    throw new Error("User profile not found. Please complete onboarding.");
  }

  return userId;
}

export async function getNotificationCenterForUser(authUserId: string) {
  const userId = await resolveUserId(authUserId);
  const [feed, preferences, unreadCount] = await Promise.all([
    getNotificationFeedByUserId(userId),
    getNotificationPreferencesByUserId(userId),
    getUnreadNotificationCountByUserId(userId),
  ]);

  return {
    feed,
    preferences,
    unreadCount,
  };
}

export async function markNotificationReadForUser(input: {
  authUserId: string;
  notificationId: string;
  read?: boolean;
}) {
  const userId = await resolveUserId(input.authUserId);
  await markNotificationFeedItemRead({
    notificationId: input.notificationId,
    read: input.read,
    userId,
  });
}

export async function markAllNotificationsReadForUser(authUserId: string) {
  const userId = await resolveUserId(authUserId);
  await markAllNotificationFeedItemsRead(userId);
}
