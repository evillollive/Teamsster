import { eq } from "drizzle-orm";

import { db } from "./client";
import { uploads } from "./schema";

export async function createUploadRecord(input: {
  uploadedById: string;
  url: string;
  pathname: string;
  contentType?: string;
  sizeBytes?: string;
  purpose: string;
  entityType?: string;
  entityId?: string;
}) {
  const result = await db
    .insert(uploads)
    .values(input)
    .returning({ id: uploads.id, url: uploads.url });

  return result[0];
}

export async function getUploadsForUser(userId: string) {
  return db
    .select({
      id: uploads.id,
      url: uploads.url,
      pathname: uploads.pathname,
      contentType: uploads.contentType,
      purpose: uploads.purpose,
      entityType: uploads.entityType,
      entityId: uploads.entityId,
      createdAt: uploads.createdAt,
    })
    .from(uploads)
    .where(eq(uploads.uploadedById, userId))
    .orderBy(uploads.createdAt);
}
