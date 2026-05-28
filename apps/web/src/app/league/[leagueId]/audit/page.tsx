import { auth } from "@teamsster/auth";
import { ClipboardList } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getAuditLogForLeague, getLeagueDetail } from "@/lib/league";

export default async function LeagueAuditLogPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return (
      <div className="grid gap-6">
        <Card className="grid gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
            Audit log
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        </Card>
        <Card className="py-10 text-center">
          <p className="text-sm text-slate-500">
            Sign in to view the audit log.
          </p>
        </Card>
      </div>
    );
  }

  const league = await getLeagueDetail(session.user.id, leagueId);

  if (!league) {
    notFound();
  }

  let entries: Awaited<ReturnType<typeof getAuditLogForLeague>> = [];
  let permissionError: string | null = null;

  try {
    entries = await getAuditLogForLeague(session.user.id, leagueId);
  } catch (err) {
    permissionError =
      err instanceof Error ? err.message : "Unable to load audit log.";
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          <Link className="hover:underline" href={`/league/${leagueId}`}>
            {league.name}
          </Link>
          {" · Audit log"}
        </p>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
            <p className="mt-1 text-sm text-slate-500">
              Recent administrative actions for {league.name}.
            </p>
          </div>
        </div>
      </Card>

      {permissionError ? (
        <Card className="py-10 text-center">
          <p className="text-sm text-slate-500">{permissionError}</p>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="grid place-items-center gap-3 py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">No audit entries yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Actions taken in this league will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="grid gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Recent activity
          </p>
          <ul className="grid gap-2">
            {entries.map((entry) => (
              <li
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 px-3 py-2 text-sm"
                key={entry.id}
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{entry.action}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {entry.entityType}
                    {entry.entityId ? ` · ${entry.entityId}` : ""}
                  </p>
                </div>
                <time
                  className="shrink-0 text-xs text-slate-400"
                  dateTime={entry.createdAt.toISOString()}
                >
                  {entry.createdAt.toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
