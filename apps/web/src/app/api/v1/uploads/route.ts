import { auth } from "@teamsster/auth";
import { db, getUserIdByAuthUserId, uploads } from "@teamsster/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const uploadMetaSchema = z.object({
  url: z.string().url(),
  pathname: z.string().min(1),
  contentType: z.string().optional(),
  sizeBytes: z.string().optional(),
  purpose: z.enum(["profile-photo", "team-logo", "league-logo", "general"]),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
});

/**
 * File upload metadata endpoint.
 *
 * The actual file upload happens client-side directly to the storage provider
 * (Vercel Blob, S3, etc). This endpoint records the metadata after upload.
 *
 * For Vercel Blob, the client uses `@vercel/blob/client` to upload directly,
 * then POSTs the resulting URL here to persist the record.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdByAuthUserId(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = uploadMetaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await db
    .insert(uploads)
    .values({
      uploadedById: userId,
      url: parsed.data.url,
      pathname: parsed.data.pathname,
      contentType: parsed.data.contentType,
      sizeBytes: parsed.data.sizeBytes,
      purpose: parsed.data.purpose,
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
    })
    .returning({ id: uploads.id, url: uploads.url });

  return NextResponse.json(result[0], { status: 201 });
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdByAuthUserId(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const results = await db
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

  return NextResponse.json({ uploads: results });
}
