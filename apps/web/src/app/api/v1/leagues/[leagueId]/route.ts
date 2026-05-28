import { auth } from "@teamsster/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getLeagueDetail } from "@/lib/league";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leagueId } = await params;
  const league = await getLeagueDetail(session.user.id, leagueId);
  if (!league) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(league);
}
