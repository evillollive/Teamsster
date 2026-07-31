import { auth } from "@teamsster/auth";
import {
  getDeviceTokensForUser,
  getUserIdByAuthUserId,
  registerDeviceToken,
  unregisterDeviceToken,
} from "@teamsster/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  PUSH_TOKEN_RATE_LIMIT,
  TokenRegistrationRateLimiter,
} from "@/lib/notification-security";

const registerSchema = z.object({
  token: z.string().min(1).max(500),
  platform: z.enum(["ios", "android", "web"]),
  deviceName: z.string().max(100).optional(),
});

const registrationRateLimiter = new TokenRegistrationRateLimiter();

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdByAuthUserId(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const tokens = await getDeviceTokensForUser(userId);
  return NextResponse.json({ tokens });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdByAuthUserId(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!registrationRateLimiter.isAllowed(userId)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(PUSH_TOKEN_RATE_LIMIT.cooldownSeconds),
        },
      },
    );
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const id = await registerDeviceToken({
    userId,
    token: parsed.data.token,
    platform: parsed.data.platform,
    deviceName: parsed.data.deviceName,
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await getUserIdByAuthUserId(session.user.id);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { error: "Missing token parameter" },
      { status: 400 },
    );
  }

  await unregisterDeviceToken(userId, token);
  return NextResponse.json({ ok: true });
}
