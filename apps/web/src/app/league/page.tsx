import { auth } from "@teamsster/auth";
import { Plus } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLeaguesForUser } from "@/lib/league";
import { getHighestRole } from "@/lib/permissions";

export default async function LeaguePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const leagues = session?.user ? await getLeaguesForUser(session.user.id) : [];

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Leagues
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your leagues
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Every team belongs to a league. Create a new one or select an
              existing league to manage it.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/league/new">
              <Plus className="mr-1 h-4 w-4" />
              New league
            </Link>
          </Button>
        </div>
      </Card>

      {leagues.length === 0 ? (
        <Card className="grid place-items-center gap-3 py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-sky-600">
            <Plus className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold">No leagues yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {session?.user
                ? "Create your first league to get started."
                : "Sign in to see your leagues."}
            </p>
          </div>
          {session?.user ? (
            <Button asChild size="sm">
              <Link href="/league/new">Create a league</Link>
            </Button>
          ) : null}
        </Card>
      ) : (
        <ul className="grid gap-3">
          {leagues.map((league) => (
            <li key={league.id}>
              <Link
                className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-sky-200 hover:shadow-md"
                href={`/league/${league.id}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{league.name}</p>
                    <p className="text-sm text-slate-500">
                      {league.timezone} &middot;{" "}
                      {league.roles.length > 1
                        ? `${getHighestRole(league.roles)} +${league.roles.length - 1}`
                        : getHighestRole(league.roles)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-sky-600">
                    Manage →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
