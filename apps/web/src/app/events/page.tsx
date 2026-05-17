import { auth } from "@teamsster/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  archiveTeamEventForUser,
  createTeamEventForUser,
  getTeamEventsForTeamAsUser,
  updateTeamEventForUser,
} from "@/lib/event";
import { getLeaguesForUser } from "@/lib/league";
import { getTeamsForLeague } from "@/lib/team";

function toDateTimeLocalValue(value: Date | string | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 16);
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ leagueId?: string; teamId?: string }>;
}) {
  const requestHeaders = await headers();
  const [params, session] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: requestHeaders }),
  ]);

  if (!session?.user) {
    return (
      <Card className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
          Events
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Scheduling workspace
        </h1>
        <p className="text-sm text-slate-600">
          Sign in and open a league team to create games, practices, and
          recurring events.
        </p>
        <div>
          <Button asChild size="sm">
            <Link href="/account">Go to account</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const leagues = await getLeaguesForUser(session.user.id);
  const selectedLeagueId =
    leagues.some((league) => league.id === params.leagueId) && params.leagueId
      ? params.leagueId
      : leagues[0]?.id;
  const teams = selectedLeagueId
    ? await getTeamsForLeague(selectedLeagueId)
    : [];
  const selectedTeamId =
    teams.some((team) => team.id === params.teamId) && params.teamId
      ? params.teamId
      : teams[0]?.id;
  const selectedLeague = leagues.find(
    (league) => league.id === selectedLeagueId,
  );
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  const events =
    selectedLeagueId && selectedTeamId
      ? await getTeamEventsForTeamAsUser(
          session.user.id,
          selectedLeagueId,
          selectedTeamId,
        )
      : [];

  async function createEventAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to create events.");
    }

    const leagueId = (formData.get("leagueId") as string | null) ?? "";
    const teamId = (formData.get("teamId") as string | null) ?? "";

    await createTeamEventForUser(currentSession.user.id, {
      description: (formData.get("description") as string | null) ?? undefined,
      eventType:
        (formData.get("eventType") as "GAME" | "PRACTICE" | "GENERAL" | null) ??
        "GENERAL",
      leagueId,
      location: (formData.get("location") as string | null) ?? undefined,
      recurrenceFrequency:
        (formData.get("recurrenceFrequency") as
          | "NONE"
          | "DAILY"
          | "WEEKLY"
          | "MONTHLY"
          | null) ?? "NONE",
      recurrenceInterval: Number(
        (formData.get("recurrenceInterval") as string | null) ?? "1",
      ),
      recurrenceUntil:
        (formData.get("recurrenceUntil") as string | null) ?? undefined,
      startsAt: new Date((formData.get("startsAt") as string | null) ?? ""),
      endsAt: new Date((formData.get("endsAt") as string | null) ?? ""),
      teamId,
      timezone: (formData.get("timezone") as string | null) ?? "UTC",
      title: (formData.get("title") as string | null) ?? "",
    });

    revalidatePath(`/events?leagueId=${leagueId}&teamId=${teamId}`);
    revalidatePath("/events");
  }

  async function updateEventAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to update events.");
    }

    const leagueId = (formData.get("leagueId") as string | null) ?? "";
    const teamId = (formData.get("teamId") as string | null) ?? "";

    await updateTeamEventForUser(currentSession.user.id, {
      description: (formData.get("description") as string | null) ?? undefined,
      eventId: (formData.get("eventId") as string | null) ?? "",
      eventType:
        (formData.get("eventType") as "GAME" | "PRACTICE" | "GENERAL" | null) ??
        "GENERAL",
      leagueId,
      location: (formData.get("location") as string | null) ?? undefined,
      recurrenceFrequency:
        (formData.get("recurrenceFrequency") as
          | "NONE"
          | "DAILY"
          | "WEEKLY"
          | "MONTHLY"
          | null) ?? "NONE",
      recurrenceInterval: Number(
        (formData.get("recurrenceInterval") as string | null) ?? "1",
      ),
      recurrenceUntil:
        (formData.get("recurrenceUntil") as string | null) ?? undefined,
      startsAt: new Date((formData.get("startsAt") as string | null) ?? ""),
      teamId,
      timezone: (formData.get("timezone") as string | null) ?? "UTC",
      title: (formData.get("title") as string | null) ?? "",
      endsAt: new Date((formData.get("endsAt") as string | null) ?? ""),
    });

    revalidatePath(`/events?leagueId=${leagueId}&teamId=${teamId}`);
    revalidatePath("/events");
  }

  async function archiveEventAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to archive events.");
    }

    const leagueId = (formData.get("leagueId") as string | null) ?? "";
    const teamId = (formData.get("teamId") as string | null) ?? "";
    const eventId = (formData.get("eventId") as string | null) ?? "";

    await archiveTeamEventForUser(
      currentSession.user.id,
      eventId,
      leagueId,
      teamId,
    );

    revalidatePath(`/events?leagueId=${leagueId}&teamId=${teamId}`);
    revalidatePath("/events");
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
          Events
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Schedule team events
        </h1>
        <p className="text-sm text-slate-600">
          Create, update, and archive games, practices, and general events with
          basic recurrence settings.
        </p>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">Select team</h2>
        <form className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="leagueId" label="League">
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
              defaultValue={selectedLeagueId}
              id="leagueId"
              name="leagueId"
            >
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField htmlFor="teamId" label="Team">
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
              defaultValue={selectedTeamId}
              id="teamId"
              name="teamId"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit">Load events</Button>
          </div>
        </form>
      </Card>

      {selectedLeague && selectedTeam ? (
        <>
          <Card className="grid gap-4">
            <h2 className="text-lg font-semibold">
              Add event for {selectedLeague.name} · {selectedTeam.name}
            </h2>
            <form
              action={createEventAction}
              className="grid gap-4 sm:grid-cols-2"
            >
              <input name="leagueId" type="hidden" value={selectedLeague.id} />
              <input name="teamId" type="hidden" value={selectedTeam.id} />
              <FormField htmlFor="event-title" label="Title">
                <Input id="event-title" maxLength={140} name="title" required />
              </FormField>
              <FormField htmlFor="event-type" label="Type">
                <select
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                  defaultValue="GENERAL"
                  id="event-type"
                  name="eventType"
                >
                  <option value="GENERAL">General</option>
                  <option value="PRACTICE">Practice</option>
                  <option value="GAME">Game</option>
                </select>
              </FormField>
              <FormField htmlFor="event-starts-at" label="Starts at">
                <Input
                  id="event-starts-at"
                  name="startsAt"
                  required
                  type="datetime-local"
                />
              </FormField>
              <FormField htmlFor="event-ends-at" label="Ends at">
                <Input
                  id="event-ends-at"
                  name="endsAt"
                  required
                  type="datetime-local"
                />
              </FormField>
              <FormField htmlFor="event-location" label="Location">
                <Input id="event-location" maxLength={200} name="location" />
              </FormField>
              <FormField htmlFor="event-timezone" label="Timezone">
                <Input
                  defaultValue={selectedTeam.timezone}
                  id="event-timezone"
                  name="timezone"
                  required
                />
              </FormField>
              <FormField
                htmlFor="event-recurrence-frequency"
                label="Recurrence"
              >
                <select
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                  defaultValue="NONE"
                  id="event-recurrence-frequency"
                  name="recurrenceFrequency"
                >
                  <option value="NONE">Does not repeat</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </FormField>
              <FormField htmlFor="event-recurrence-interval" label="Every">
                <Input
                  defaultValue="1"
                  id="event-recurrence-interval"
                  min={1}
                  name="recurrenceInterval"
                  type="number"
                />
              </FormField>
              <FormField
                className="sm:col-span-2"
                htmlFor="event-recurrence-until"
                label="Repeat until"
              >
                <Input
                  id="event-recurrence-until"
                  name="recurrenceUntil"
                  type="datetime-local"
                />
              </FormField>
              <FormField
                className="sm:col-span-2"
                htmlFor="event-description"
                label="Description"
              >
                <Input
                  id="event-description"
                  maxLength={1200}
                  name="description"
                />
              </FormField>
              <div className="sm:col-span-2">
                <Button type="submit">Add event</Button>
              </div>
            </form>
          </Card>

          <Card className="grid gap-4">
            <h2 className="text-lg font-semibold">Scheduled events</h2>
            {events.length === 0 ? (
              <p className="text-sm text-slate-600">
                No events yet. Add a game, practice, or team event to get
                started.
              </p>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => (
                  <form
                    action={updateEventAction}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
                    key={event.id}
                  >
                    <input name="eventId" type="hidden" value={event.id} />
                    <input
                      name="leagueId"
                      type="hidden"
                      value={selectedLeague.id}
                    />
                    <input
                      name="teamId"
                      type="hidden"
                      value={selectedTeam.id}
                    />
                    <FormField
                      htmlFor={`event-title-${event.id}`}
                      label="Title"
                    >
                      <Input
                        defaultValue={event.title}
                        id={`event-title-${event.id}`}
                        maxLength={140}
                        name="title"
                        required
                      />
                    </FormField>
                    <FormField htmlFor={`event-type-${event.id}`} label="Type">
                      <select
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                        defaultValue={event.eventType}
                        id={`event-type-${event.id}`}
                        name="eventType"
                      >
                        <option value="GENERAL">General</option>
                        <option value="PRACTICE">Practice</option>
                        <option value="GAME">Game</option>
                      </select>
                    </FormField>
                    <FormField
                      htmlFor={`event-starts-at-${event.id}`}
                      label="Starts at"
                    >
                      <Input
                        defaultValue={toDateTimeLocalValue(event.startsAt)}
                        id={`event-starts-at-${event.id}`}
                        name="startsAt"
                        required
                        type="datetime-local"
                      />
                    </FormField>
                    <FormField
                      htmlFor={`event-ends-at-${event.id}`}
                      label="Ends at"
                    >
                      <Input
                        defaultValue={toDateTimeLocalValue(event.endsAt)}
                        id={`event-ends-at-${event.id}`}
                        name="endsAt"
                        required
                        type="datetime-local"
                      />
                    </FormField>
                    <FormField
                      htmlFor={`event-location-${event.id}`}
                      label="Location"
                    >
                      <Input
                        defaultValue={event.location ?? ""}
                        id={`event-location-${event.id}`}
                        maxLength={200}
                        name="location"
                      />
                    </FormField>
                    <FormField
                      htmlFor={`event-timezone-${event.id}`}
                      label="Timezone"
                    >
                      <Input
                        defaultValue={event.timezone}
                        id={`event-timezone-${event.id}`}
                        name="timezone"
                        required
                      />
                    </FormField>
                    <FormField
                      htmlFor={`event-frequency-${event.id}`}
                      label="Recurrence"
                    >
                      <select
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                        defaultValue={event.recurrenceRule.frequency}
                        id={`event-frequency-${event.id}`}
                        name="recurrenceFrequency"
                      >
                        <option value="NONE">Does not repeat</option>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    </FormField>
                    <FormField
                      htmlFor={`event-interval-${event.id}`}
                      label="Every"
                    >
                      <Input
                        defaultValue={event.recurrenceRule.interval}
                        id={`event-interval-${event.id}`}
                        min={1}
                        name="recurrenceInterval"
                        type="number"
                      />
                    </FormField>
                    <FormField
                      className="sm:col-span-2"
                      htmlFor={`event-until-${event.id}`}
                      label="Repeat until"
                    >
                      <Input
                        defaultValue={toDateTimeLocalValue(
                          event.recurrenceRule.until,
                        )}
                        id={`event-until-${event.id}`}
                        name="recurrenceUntil"
                        type="datetime-local"
                      />
                    </FormField>
                    <FormField
                      className="sm:col-span-2"
                      htmlFor={`event-description-${event.id}`}
                      label="Description"
                    >
                      <Input
                        defaultValue={event.description ?? ""}
                        id={`event-description-${event.id}`}
                        maxLength={1200}
                        name="description"
                      />
                    </FormField>
                    <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                      <Button size="sm" type="submit">
                        Save event
                      </Button>
                      <Button
                        formAction={archiveEventAction}
                        size="sm"
                        type="submit"
                        variant="ghost"
                      >
                        Archive event
                      </Button>
                    </div>
                  </form>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm text-slate-600">
            Join or create a league/team before scheduling events.
          </p>
        </Card>
      )}
    </div>
  );
}
