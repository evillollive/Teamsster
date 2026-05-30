import { auth } from "@teamsster/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  notificationChannelLabels,
  notificationPreferenceLabels,
} from "@/lib/account";
import {
  getNotificationCenterForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "@/lib/notifications";

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function NotificationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return (
      <Card className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
          Notifications
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Notification center
        </h1>
        <p className="text-sm text-slate-600">
          Sign in to review recent notifications and update your delivery
          channels.
        </p>
        <div>
          <Button asChild size="sm">
            <Link href="/account">Go to account</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const notificationCenter = await getNotificationCenterForUser(
    session.user.id,
  ).catch(() => ({
    feed: [],
    preferences: null,
    unreadCount: 0,
  }));

  async function markReadAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to update notifications.");
    }

    await markNotificationReadForUser({
      authUserId: currentSession.user.id,
      notificationId: (formData.get("notificationId") as string | null) ?? "",
      read: formData.get("read") !== "false",
    });

    revalidatePath("/notifications");
  }

  async function markAllReadAction() {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to update notifications.");
    }

    await markAllNotificationsReadForUser(currentSession.user.id);
    revalidatePath("/notifications");
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
          Notifications
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Notification center
            </h1>
            <p className="text-sm text-slate-600">
              Review your in-app feed, unread count, and delivery preferences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
              {notificationCenter.unreadCount} unread
            </span>
            <form action={markAllReadAction}>
              <Button size="sm" type="submit" variant="secondary">
                Mark all read
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {notificationCenter.preferences ? (
        <Card className="grid gap-4">
          <div>
            <h2 className="text-lg font-semibold">Delivery preferences</h2>
            <p className="text-sm text-slate-600">
              Manage channels in your account settings. This summary shows what
              is currently enabled.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(notificationCenter.preferences).map(
              ([eventType, preference]) => (
                <div
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                  key={eventType}
                >
                  <p className="font-medium">
                    {
                      notificationPreferenceLabels[
                        eventType as keyof typeof notificationPreferenceLabels
                      ].label
                    }
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {
                      notificationPreferenceLabels[
                        eventType as keyof typeof notificationPreferenceLabels
                      ].description
                    }
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(notificationChannelLabels).map(
                      ([channel, label]) => (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            preference[channel as keyof typeof preference]
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                          key={channel}
                        >
                          {label}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
          <div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/account">Edit notification settings</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <p className="text-sm text-slate-600">
            Your feed keeps in-app copies of alerts, including fallback
            deliveries.
          </p>
        </div>
        {notificationCenter.feed.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-600">
            No notifications yet. New announcement, reminder, and message events
            will appear here.
          </p>
        ) : (
          <ul aria-label="Notification feed" className="grid gap-3">
            {notificationCenter.feed.map((item) => {
              const details = notificationPreferenceLabels[item.kind];

              return (
                <li
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                  key={item.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          {details.label}
                        </span>
                        {item.deliveredByFallback ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Fallback
                          </span>
                        ) : null}
                        {!item.readAt ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.body}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatTimestamp(item.createdAt)}
                      </p>
                    </div>
                    <form
                      action={markReadAction}
                      className="flex items-center gap-2"
                    >
                      <input
                        name="notificationId"
                        type="hidden"
                        value={item.id}
                      />
                      <input
                        name="read"
                        type="hidden"
                        value={item.readAt ? "false" : "true"}
                      />
                      <Button size="sm" type="submit" variant="secondary">
                        {item.readAt ? "Mark unread" : "Mark read"}
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
