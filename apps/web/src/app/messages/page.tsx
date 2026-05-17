import { auth } from "@teamsster/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  archiveAnnouncementForUser,
  createAnnouncementForUser,
  getAnnouncementsForLeagueAsUser,
} from "@/lib/announcement";
import { getLeaguesForUser } from "@/lib/league";
import {
  getNotificationDeliveriesForLeagueAsUser,
  logNotificationDeliveryForUser,
} from "@/lib/notification-delivery";
import {
  buildEventReminderTemplate,
  buildWeeklyDigestTemplate,
} from "@/lib/notification-template";
import { getEventRemindersForUser } from "@/lib/reminder";
import { getTeamsForLeague } from "@/lib/team";

export default async function MessagesPage({
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
          Messages
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Announcements workspace
        </h1>
        <p className="text-sm text-slate-600">
          Sign in and open a league to publish announcements for the league or a
          specific team.
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

  const announcements = selectedLeagueId
    ? await getAnnouncementsForLeagueAsUser(
        session.user.id,
        selectedLeagueId,
      ).catch(() => [])
    : [];
  const reminderSummary = await getEventRemindersForUser(session.user.id).catch(
    () => ({
      due: [],
      upcoming: [],
    }),
  );
  const reminderForLeague = selectedLeagueId
    ? ([...reminderSummary.due, ...reminderSummary.upcoming].find(
        (item) => item.leagueId === selectedLeagueId,
      ) ?? null)
    : null;
  const digestTemplate = selectedLeague
    ? buildWeeklyDigestTemplate({
        announcements,
        generatedAt: new Date(),
        leagueName: selectedLeague.name,
      })
    : null;
  const reminderTemplate =
    selectedLeague && reminderForLeague
      ? buildEventReminderTemplate({
          leagueName: selectedLeague.name,
          reminder: reminderForLeague,
        })
      : null;
  const [deliveryLogs, deliveryLogsError] = selectedLeagueId
    ? await getNotificationDeliveriesForLeagueAsUser(
        session.user.id,
        selectedLeagueId,
      )
        .then((result) => [result, null] as const)
        .catch((error) => [[], error] as const)
    : [[], null];

  async function createAnnouncementAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to publish announcements.");
    }

    const leagueId = (formData.get("leagueId") as string | null) ?? "";
    const audience = (formData.get("audience") as string | null) ?? "league";
    const teamId = (formData.get("teamId") as string | null) ?? "";

    await createAnnouncementForUser(currentSession.user.id, {
      body: (formData.get("body") as string | null) ?? "",
      leagueId,
      teamId: audience === "team" ? teamId : undefined,
      title: (formData.get("title") as string | null) ?? "",
    });

    revalidatePath(`/messages?leagueId=${leagueId}&teamId=${teamId}`);
    revalidatePath("/messages");
  }

  async function archiveAnnouncementAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to archive announcements.");
    }

    const leagueId = (formData.get("leagueId") as string | null) ?? "";
    const announcementId =
      (formData.get("announcementId") as string | null) ?? "";
    const teamId = (formData.get("teamId") as string | null) ?? "";

    await archiveAnnouncementForUser(
      currentSession.user.id,
      announcementId,
      leagueId,
    );
    revalidatePath(`/messages?leagueId=${leagueId}&teamId=${teamId}`);
    revalidatePath("/messages");
  }

  async function logDigestDeliveryAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to log deliveries.");
    }

    const leagueId = (formData.get("leagueId") as string | null) ?? "";
    const teamId = (formData.get("teamId") as string | null) ?? "";

    await logNotificationDeliveryForUser(currentSession.user.id, {
      kind: "WEEKLY_DIGEST",
      leagueId,
      recipient: currentSession.user.email,
      teamId: teamId || undefined,
      templateBody: (formData.get("templateBody") as string | null) ?? "",
      templateSubject: (formData.get("templateSubject") as string | null) ?? "",
    });

    revalidatePath(`/messages?leagueId=${leagueId}&teamId=${teamId}`);
    revalidatePath("/messages");
  }

  async function logReminderDeliveryAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to log deliveries.");
    }

    const leagueId = (formData.get("leagueId") as string | null) ?? "";
    const teamId = (formData.get("teamId") as string | null) ?? "";

    await logNotificationDeliveryForUser(currentSession.user.id, {
      kind: "EVENT_REMINDER",
      leagueId,
      recipient: currentSession.user.email,
      teamId: teamId || undefined,
      templateBody: (formData.get("templateBody") as string | null) ?? "",
      templateSubject: (formData.get("templateSubject") as string | null) ?? "",
    });

    revalidatePath(`/messages?leagueId=${leagueId}&teamId=${teamId}`);
    revalidatePath("/messages");
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
          Messages
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          League and team announcements
        </h1>
        <p className="text-sm text-slate-600">
          Publish clear updates to the whole league or to one team.
        </p>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">Select league</h2>
        <p className="text-sm text-slate-600" id="messages-context-help">
          Choose the league and default team context used for announcements and
          templates.
        </p>
        <form className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="leagueId" label="League">
            <select
              aria-describedby="messages-context-help"
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
          <FormField htmlFor="teamId" label="Default team context">
            <select
              aria-describedby="messages-context-help messages-team-help"
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
          <p
            className="text-xs text-slate-500 sm:col-span-2"
            id="messages-team-help"
          >
            Team-specific messages are available when a team context is
            selected.
          </p>
          <div className="sm:col-span-2">
            <Button type="submit">Load announcements</Button>
          </div>
        </form>
      </Card>

      {selectedLeague ? (
        <>
          <Card className="grid gap-4">
            <h2 className="text-lg font-semibold">
              New announcement for {selectedLeague.name}
              {selectedTeam ? ` · ${selectedTeam.name}` : ""}
            </h2>
            <p
              className="text-sm text-slate-600"
              id="announcement-compose-help"
            >
              All fields are required. Use concise titles and clear message
              details for families and staff.
            </p>
            <form action={createAnnouncementAction} className="grid gap-4">
              <input name="leagueId" type="hidden" value={selectedLeague.id} />
              <input
                name="teamId"
                type="hidden"
                value={selectedTeam?.id ?? ""}
              />
              <FormField htmlFor="announcement-title" label="Title">
                <Input
                  aria-describedby="announcement-compose-help announcement-title-help"
                  id="announcement-title"
                  maxLength={140}
                  name="title"
                  required
                />
              </FormField>
              <p
                className="text-xs text-slate-500"
                id="announcement-title-help"
              >
                Maximum 140 characters.
              </p>
              <FormField htmlFor="announcement-audience" label="Audience">
                <select
                  aria-describedby="announcement-compose-help announcement-audience-help"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                  defaultValue="league"
                  id="announcement-audience"
                  name="audience"
                >
                  <option value="league">Entire league</option>
                  <option disabled={!selectedTeam} value="team">
                    Team only{selectedTeam ? ` (${selectedTeam.name})` : ""}
                  </option>
                </select>
              </FormField>
              <p
                className="text-xs text-slate-500"
                id="announcement-audience-help"
              >
                Team-only delivery requires a selected team context.
              </p>
              <FormField htmlFor="announcement-body" label="Message">
                <textarea
                  aria-describedby="announcement-compose-help announcement-body-help"
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                  id="announcement-body"
                  maxLength={5000}
                  name="body"
                  required
                />
              </FormField>
              <p className="text-xs text-slate-500" id="announcement-body-help">
                Maximum 5000 characters. Line breaks are preserved.
              </p>
              <div>
                <Button type="submit">Publish announcement</Button>
              </div>
            </form>
          </Card>

          <Card className="grid gap-4">
            <h2 className="text-lg font-semibold">Recent announcements</h2>
            {announcements.length === 0 ? (
              <p className="text-sm text-slate-600">
                No announcements yet for this league.
              </p>
            ) : (
              <div className="grid gap-3">
                {announcements.map((announcement) => (
                  <article
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                    key={announcement.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold">
                        {announcement.title}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {announcement.teamId
                          ? `Team · ${announcement.teamName ?? "Unknown"}`
                          : "League"}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                      {announcement.body}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Published {announcement.publishedAt.toLocaleString()}
                    </p>
                    <form action={archiveAnnouncementAction} className="mt-3">
                      <input
                        name="announcementId"
                        type="hidden"
                        value={announcement.id}
                      />
                      <input
                        name="leagueId"
                        type="hidden"
                        value={announcement.leagueId}
                      />
                      <input
                        name="teamId"
                        type="hidden"
                        value={selectedTeam?.id ?? ""}
                      />
                      <Button size="sm" type="submit" variant="ghost">
                        Archive
                      </Button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <Card className="grid gap-4">
            <h2 className="text-lg font-semibold">
              Email digest and reminder templates
            </h2>
            <p className="text-sm text-slate-600">
              Preview the email content used for weekly digests and event
              reminders.
            </p>
            {digestTemplate ? (
              <article className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-semibold">Weekly digest</h3>
                <p className="text-xs text-slate-500">
                  Subject: {digestTemplate.subject}
                </p>
                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  {digestTemplate.body}
                </pre>
                <form action={logDigestDeliveryAction}>
                  <input
                    name="leagueId"
                    type="hidden"
                    value={selectedLeague.id}
                  />
                  <input
                    name="teamId"
                    type="hidden"
                    value={selectedTeam?.id ?? ""}
                  />
                  <input
                    name="templateSubject"
                    type="hidden"
                    value={digestTemplate.subject}
                  />
                  <input
                    name="templateBody"
                    type="hidden"
                    value={digestTemplate.body}
                  />
                  <Button size="sm" type="submit" variant="secondary">
                    Log digest delivery
                  </Button>
                </form>
              </article>
            ) : null}
            {reminderTemplate ? (
              <article className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-semibold">Event reminder</h3>
                <p className="text-xs text-slate-500">
                  Subject: {reminderTemplate.subject}
                </p>
                <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  {reminderTemplate.body}
                </pre>
                <form action={logReminderDeliveryAction}>
                  <input
                    name="leagueId"
                    type="hidden"
                    value={selectedLeague.id}
                  />
                  <input
                    name="teamId"
                    type="hidden"
                    value={selectedTeam?.id ?? ""}
                  />
                  <input
                    name="templateSubject"
                    type="hidden"
                    value={reminderTemplate.subject}
                  />
                  <input
                    name="templateBody"
                    type="hidden"
                    value={reminderTemplate.body}
                  />
                  <Button size="sm" type="submit" variant="secondary">
                    Log reminder delivery
                  </Button>
                </form>
              </article>
            ) : (
              <p className="text-sm text-slate-600">
                No upcoming reminder examples available for this league yet.
              </p>
            )}

            <div className="grid gap-2">
              <h3 className="text-base font-semibold">Recent delivery logs</h3>
              {deliveryLogsError ? (
                <p className="text-sm text-slate-600">
                  Delivery logs are available to announcement managers.
                </p>
              ) : deliveryLogs.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No delivery logs recorded for this league yet.
                </p>
              ) : (
                <div className="grid gap-2">
                  {deliveryLogs.map((delivery) => (
                    <article
                      className="rounded-2xl border border-slate-200 bg-white p-3"
                      key={delivery.id}
                    >
                      <p className="text-sm font-medium text-slate-800">
                        {delivery.kind} · {delivery.status}
                      </p>
                      <p className="text-xs text-slate-600">
                        Recipient: {delivery.recipient}
                      </p>
                      <p className="text-xs text-slate-600">
                        Subject: {delivery.templateSubject}
                      </p>
                      <p className="text-xs text-slate-500">
                        Logged {delivery.createdAt.toLocaleString()}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <p className="text-sm text-slate-600">
            Join or create a league before posting announcements.
          </p>
        </Card>
      )}
    </div>
  );
}
