import { and, eq } from "drizzle-orm";

import { db } from "./client";
import { deviceTokens } from "./schema";

export async function registerDeviceToken(input: {
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  deviceName?: string;
}) {
  const existing = await db
    .select({ id: deviceTokens.id })
    .from(deviceTokens)
    .where(eq(deviceTokens.token, input.token))
    .limit(1);

  if (existing[0]) {
    // Update ownership if token already exists (device may have changed user)
    await db
      .update(deviceTokens)
      .set({
        userId: input.userId,
        platform: input.platform,
        deviceName: input.deviceName,
        updatedAt: new Date(),
      })
      .where(eq(deviceTokens.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db
    .insert(deviceTokens)
    .values({
      userId: input.userId,
      token: input.token,
      platform: input.platform,
      deviceName: input.deviceName,
    })
    .returning({ id: deviceTokens.id });

  return result[0].id;
}

export async function unregisterDeviceToken(userId: string, token: string) {
  await db
    .delete(deviceTokens)
    .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)));
}

export async function getDeviceTokensForUser(userId: string) {
  return db
    .select({
      id: deviceTokens.id,
      token: deviceTokens.token,
      platform: deviceTokens.platform,
      deviceName: deviceTokens.deviceName,
      createdAt: deviceTokens.createdAt,
    })
    .from(deviceTokens)
    .where(eq(deviceTokens.userId, userId));
}
