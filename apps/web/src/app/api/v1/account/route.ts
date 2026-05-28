import { auth } from "@teamsster/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getAccountSettings } from "@/lib/account";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountSettings = await getAccountSettings(session.user.id);
  return NextResponse.json(accountSettings);
}
