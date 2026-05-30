import type { Meta, StoryObj } from "@storybook/react";

type FeedItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  deliveredByFallback: boolean;
};

function NotificationFeedItem({ item }: { item: FeedItem }) {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              {item.kind}
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
            <p className="mt-1 text-sm text-slate-600">{item.body}</p>
          </div>
          <p className="text-xs text-slate-500">
            {item.createdAt.toLocaleString()}
          </p>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center rounded-full bg-white px-3 text-sm font-medium text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
          type="button"
        >
          {item.readAt ? "Mark unread" : "Mark read"}
        </button>
      </div>
    </li>
  );
}

function NotificationFeed({ items }: { items: FeedItem[] }) {
  return (
    <ul
      aria-label="Notification feed"
      aria-live="polite"
      aria-relevant="additions"
      className="grid max-w-lg gap-3 motion-reduce:transition-none"
    >
      {items.map((item) => (
        <NotificationFeedItem item={item} key={item.id} />
      ))}
    </ul>
  );
}

const meta: Meta<typeof NotificationFeed> = {
  title: "Notifications/Feed",
  component: NotificationFeed,
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "list", enabled: true },
          { id: "button-name", enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationFeed>;

export const WithUnread: Story = {
  args: {
    items: [
      {
        id: "1",
        kind: "EVENT_REMINDER",
        title: "Practice tomorrow at 5 PM",
        body: "Your team has practice scheduled. Don't forget your gear!",
        readAt: null,
        createdAt: new Date("2026-05-30T10:00:00"),
        deliveredByFallback: false,
      },
      {
        id: "2",
        kind: "ANNOUNCEMENT",
        title: "Season schedule released",
        body: "The full season schedule is now available. Check events for details.",
        readAt: new Date("2026-05-29T15:00:00"),
        createdAt: new Date("2026-05-29T09:00:00"),
        deliveredByFallback: false,
      },
    ],
  },
};

export const WithFallback: Story = {
  args: {
    items: [
      {
        id: "3",
        kind: "MESSAGE",
        title: "New message from Coach Rivera",
        body: "Reminder: bring water bottles for Saturday's game.",
        readAt: null,
        createdAt: new Date("2026-05-30T08:00:00"),
        deliveredByFallback: true,
      },
    ],
  },
};

export const AllRead: Story = {
  args: {
    items: [
      {
        id: "4",
        kind: "WEEKLY_DIGEST",
        title: "Your weekly summary",
        body: "2 events this week, 1 new announcement.",
        readAt: new Date("2026-05-28T12:00:00"),
        createdAt: new Date("2026-05-28T08:00:00"),
        deliveredByFallback: false,
      },
    ],
  },
};
