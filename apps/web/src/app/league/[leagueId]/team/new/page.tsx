import { auth } from "@teamsster/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLeagueDetail } from "@/lib/league";
import { createTeamForUser } from "@/lib/team";

export default async function NewTeamPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const league = session?.user
    ? await getLeagueDetail(session.user.id, leagueId)
    : null;

  if (!league) {
    notFound();
  }

  async function createTeamAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to create a team.");
    }

    const name = (formData.get("name") as string | null)?.trim() ?? "";
    const timezone =
      (formData.get("timezone") as string | null)?.trim() ||
      league?.timezone ||
      "UTC";

    const { teamId } = await createTeamForUser(currentSession.user.id, {
      leagueId,
      name,
      timezone,
    });

    redirect(`/league/${leagueId}/team/${teamId}`);
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          {league.name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Create a team</h1>
        <p className="text-sm text-slate-600">
          Give your team a name and timezone. It will be added to{" "}
          <span className="font-medium">{league.name}</span>.
        </p>
      </Card>

      <Card className="grid gap-4">
        <form action={createTeamAction} className="grid gap-4">
          <FormField htmlFor="team-name" label="Team name">
            <Input
              autoFocus
              id="team-name"
              maxLength={120}
              name="name"
              placeholder="Red Rockets"
              required
            />
          </FormField>
          <FormField
            description="Defaults to the league timezone. e.g. America/Chicago"
            htmlFor="team-timezone"
            label="Timezone"
          >
            <Input
              defaultValue={league.timezone}
              id="team-timezone"
              name="timezone"
              placeholder={league.timezone}
            />
          </FormField>
          <div className="flex items-center gap-3">
            <Button disabled={!session?.user} type="submit">
              Create team
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/league/${leagueId}`}>Cancel</Link>
            </Button>
          </div>
          {!session?.user ? (
            <p className="text-xs text-rose-600">
              Sign in before creating a team.
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
