import { and, eq } from "drizzle-orm";

import { db } from "./client";
import { decryptField, encryptField } from "./compliance-admin";
import { auditLogs, deviceTokens } from "./schema";

/**
 * Encrypts a push token before storage.
 * If no encryption key is provided, stores the token as-is.
 */
function encryptToken(token: string, encryptionKey?: Buffer): string {
  if (!encryptionKey) return token;
  return encryptField(token, encryptionKey);
}

/**
 * Decrypts a stored push token.
 * If the token doesn't look encrypted (no colons), returns it as-is.
 */
function decryptToken(stored: string, encryptionKey?: Buffer): string {
  if (!encryptionKey) return stored;
  if (!stored.includes(":")) return stored;
  return decryptField(stored, encryptionKey);
}

export async function registerDeviceToken(input: {
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  deviceName?: string;
  encryptionKey?: Buffer;
}) {
  const storedToken = encryptToken(input.token, input.encryptionKey);

  const existing = await db
    .select({ id: deviceTokens.id })
    .from(deviceTokens)
    .where(eq(deviceTokens.token, storedToken))
    .limit(1);

  if (existing[0]) {
    await db
      .update(deviceTokens)
      .set({
        userId: input.userId,
        platform: input.platform,
        deviceName: input.deviceName,
        updatedAt: new Date(),
      })
      .where(eq(deviceTokens.id, existing[0].id));

    await db.insert(auditLogs).values({
      action: "device_token.update",
      actorUserId: input.userId,
      entityType: "device_token",
      entityId: existing[0].id,
      metadata: { platform: input.platform },
    });

    return existing[0].id;
  }

  const result = await db
    .insert(deviceTokens)
    .values({
      userId: input.userId,
      token: storedToken,
      platform: input.platform,
      deviceName: input.deviceName,
    })
    .returning({ id: deviceTokens.id });

  await db.insert(auditLogs).values({
    action: "device_token.register",
    actorUserId: input.userId,
    entityType: "device_token",
    entityId: result[0].id,
    metadata: { platform: input.platform },
  });

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
