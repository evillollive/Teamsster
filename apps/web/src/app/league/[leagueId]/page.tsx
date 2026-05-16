import { auth } from "@teamsster/auth";
import { Settings } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLeagueDetail } from "@/lib/league";

export default async function LeagueDashboardPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const [session, league] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getLeagueDetail(leagueId),
  ]);

  if (!league) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          League
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {league.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{league.timezone}</p>
          </div>
          {session?.user ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/league/${leagueId}/settings`}>
                <Settings className="mr-1 h-4 w-4" />
                Settings
              </Link>
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Teams
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Team management is coming in a future milestone.
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Members
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Role assignment and invitations are coming in a future milestone.
          </p>
        </Card>
      </div>
    </div>
  );
}
