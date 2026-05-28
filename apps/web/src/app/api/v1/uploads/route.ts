import { auth } from "@teamsster/auth";
import {
  createUploadRecord,
  getUserIdByAuthUserId,
  getUploadsForUser,
} from "@teamsster/db";
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

  const record = await createUploadRecord({
    uploadedById: userId,
    url: parsed.data.url,
    pathname: parsed.data.pathname,
    contentType: parsed.data.contentType,
    sizeBytes: parsed.data.sizeBytes,
    purpose: parsed.data.purpose,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
  });

  return NextResponse.json(record, { status: 201 });
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

  const results = await getUploadsForUser(userId);
  return NextResponse.json({ uploads: results });
}
