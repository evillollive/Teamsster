import { auth } from "@teamsster/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getTeamEventsForTeamAsViewer } from "@/lib/event";
import { getTeamDetail } from "@/lib/team";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string; teamId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leagueId, teamId } = await params;
  const team = await getTeamDetail(session.user.id, teamId);
  if (!team || team.leagueId !== leagueId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const events = await getTeamEventsForTeamAsViewer(
      session.user.id,
      leagueId,
      teamId,
    );
    return NextResponse.json(events);
  } catch (error) {
    if (error instanceof Error && error.message.includes("permission")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    throw error;
  }
}
