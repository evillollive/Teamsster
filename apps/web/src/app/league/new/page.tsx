import { auth } from "@teamsster/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createLeagueForUser } from "@/lib/league";

async function createLeagueAction(formData: FormData) {
  "use server";

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("You must be signed in to create a league.");
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const timezone = (formData.get("timezone") as string | null)?.trim() || "UTC";

  const { leagueId } = await createLeagueForUser(session.user.id, {
    name,
    timezone,
  });

  redirect(`/league/${leagueId}`);
}

export default async function NewLeaguePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Leagues
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create a league
        </h1>
        <p className="text-sm text-slate-600">
          Give your league a name and timezone. You'll land on the new league
          dashboard next, where you can create the first team right away.
        </p>
      </Card>

      <Card className="grid gap-4">
        <form action={createLeagueAction} className="grid gap-4">
          <FormField htmlFor="league-name" label="League name">
            <Input
              autoFocus
              id="league-name"
              maxLength={120}
              name="name"
              placeholder="Spring Soccer League"
              required
            />
          </FormField>
          <FormField
            description="Used for scheduling and display. e.g. America/Chicago"
            htmlFor="league-timezone"
            label="Timezone"
          >
            <Input
              defaultValue="UTC"
              id="league-timezone"
              name="timezone"
              placeholder="UTC"
            />
          </FormField>
          <div className="flex items-center gap-3">
            <Button disabled={!session?.user} type="submit">
              Create league and continue
            </Button>
            <Button asChild variant="ghost">
              <Link href="/league">Cancel</Link>
            </Button>
          </div>
          {!session?.user ? (
            <p className="text-xs text-rose-600">
              Sign in before creating a league.
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
