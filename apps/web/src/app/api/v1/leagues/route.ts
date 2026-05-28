import { auth } from "@teamsster/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getLeaguesForUser } from "@/lib/league";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leagues = await getLeaguesForUser(session.user.id);
  return NextResponse.json(leagues);
}
