import { auth } from "@teamsster/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  archiveLeagueForUser,
  getLeagueDetail,
  updateLeagueForUser,
} from "@/lib/league";

export default async function LeagueSettingsPage({
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

  async function updateLeagueAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to update a league.");
    }

    const currentLeague = await getLeagueDetail(leagueId);
    if (!currentLeague) {
      throw new Error("League not found.");
    }

    const name =
      (formData.get("name") as string | null)?.trim() || currentLeague.name;
    const timezone =
      (formData.get("timezone") as string | null)?.trim() ||
      currentLeague.timezone;

    await updateLeagueForUser(currentSession.user.id, {
      leagueId,
      name,
      timezone,
    });

    revalidatePath(`/league/${leagueId}`);
    revalidatePath(`/league/${leagueId}/settings`);
    redirect(`/league/${leagueId}`);
  }

  async function archiveLeagueAction() {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to archive a league.");
    }

    await archiveLeagueForUser(currentSession.user.id, leagueId);

    revalidatePath("/league");
    redirect("/league");
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          League settings
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{league.name}</h1>
        <p className="text-sm text-slate-600">
          Update league details or archive this league.
        </p>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">League details</h2>
        <form action={updateLeagueAction} className="grid gap-4">
          <FormField htmlFor="league-name" label="League name">
            <Input
              defaultValue={league.name}
              id="league-name"
              maxLength={120}
              name="name"
              required
            />
          </FormField>
          <FormField
            description="e.g. America/Chicago"
            htmlFor="league-timezone"
            label="Timezone"
          >
            <Input
              defaultValue={league.timezone}
              id="league-timezone"
              name="timezone"
            />
          </FormField>
          <div className="flex items-center gap-3">
            <Button disabled={!session?.user} type="submit">
              Save changes
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/league/${leagueId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>

      <Card className="grid gap-4 border-rose-100 bg-rose-50">
        <div>
          <h2 className="text-lg font-semibold text-rose-700">Danger zone</h2>
          <p className="mt-1 text-sm text-rose-600">
            Archiving removes this league and all its teams from active views.
            This action cannot be undone from the UI.
          </p>
        </div>
        <form action={archiveLeagueAction}>
          <Button disabled={!session?.user} type="submit" variant="secondary">
            Archive league
          </Button>
        </form>
      </Card>
    </div>
  );
}
