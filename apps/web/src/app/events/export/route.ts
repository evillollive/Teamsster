import { auth } from "@teamsster/auth";
import { headers } from "next/headers";

import { buildTeamEventsIcs } from "@/lib/calendar";
import { getTeamEventsForTeamAsViewer } from "@/lib/event";
import { getLeagueDetail } from "@/lib/league";
import { getTeamDetail } from "@/lib/team";

function toSafeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const leagueId = url.searchParams.get("leagueId") ?? "";
  const teamId = url.searchParams.get("teamId") ?? "";

  if (!leagueId || !teamId) {
    return new Response("Missing leagueId or teamId", { status: 400 });
  }

  const [league, team] = await Promise.all([
    getLeagueDetail(session.user.id, leagueId),
    getTeamDetail(session.user.id, teamId),
  ]);
  if (!league || !team || team.leagueId !== leagueId) {
    return new Response("Team not found", { status: 404 });
  }

  try {
    const events = await getTeamEventsForTeamAsViewer(
      session.user.id,
      leagueId,
      teamId,
    );
    const ics = buildTeamEventsIcs({
      calendarName: `${league.name} · ${team.name}`,
      events,
    });
    const filename = `${toSafeFileName(league.name)}-${toSafeFileName(team.name)}-events.ics`;

    return new Response(ics, {
      headers: {
        "content-disposition": `attachment; filename="${filename}"`,
        "content-type": "text/calendar; charset=utf-8",
      },
      status: 200,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("permission")) {
      return new Response("Forbidden", { status: 403 });
    }
    if (error instanceof Error && error.message.includes("not a member")) {
      return new Response("Forbidden", { status: 403 });
    }
    throw error;
  }
}
