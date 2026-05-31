import type { Meta, StoryObj } from "@storybook/react";

type FlaggedMessage = {
  id: string;
  messagePreview: string;
  flaggedBy: string;
  reason: string;
  flaggedAt: string;
  status: "pending" | "reviewed" | "dismissed";
};

type MinorRestriction = {
  label: string;
  value: string;
  description: string;
};

function FlagQueue({ flags }: { flags: FlaggedMessage[] }) {
  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    reviewed: "bg-emerald-100 text-emerald-700",
    dismissed: "bg-slate-100 text-slate-500",
  };

  return (
    <section aria-label="Flagged messages" className="max-w-lg">
      <h2 className="mb-3 text-lg font-semibold">Moderation queue</h2>
      {flags.length === 0 ? (
        <p className="text-sm text-slate-500">No flagged messages to review.</p>
      ) : (
        <ul className="grid gap-3">
          {flags.map((flag) => (
            <li
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              key={flag.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-700">
                    &quot;{flag.messagePreview}&quot;
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Flagged by {flag.flaggedBy}: {flag.reason}
                  </p>
                  <p className="text-xs text-slate-400">{flag.flaggedAt}</p>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[flag.status]}`}
                >
                  {flag.status}
                </span>
              </div>
              {flag.status === "pending" ? (
                <div className="mt-2 flex gap-2">
                  <button
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                    type="button"
                  >
                    Dismiss
                  </button>
                  <button
                    className="rounded-full bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500"
                    type="button"
                  >
                    Take action
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MinorRestrictionSettings({
  restrictions,
  current,
}: {
  restrictions: MinorRestriction[];
  current: string;
}) {
  return (
    <fieldset className="max-w-md">
      <legend className="mb-2 text-sm font-semibold text-slate-700">
        Minor messaging restrictions
      </legend>
      <div className="grid gap-2">
        {restrictions.map((r) => (
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${
              r.value === current
                ? "border-sky-300 bg-sky-50"
                : "border-slate-200 bg-white"
            }`}
            key={r.value}
          >
            <input
              checked={r.value === current}
              className="mt-0.5"
              name="minor-restriction"
              readOnly
              type="radio"
              value={r.value}
            />
            <div>
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-xs text-slate-500">{r.description}</p>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const meta: Meta<typeof FlagQueue> = {
  title: "Moderation/FlagQueue",
  component: FlagQueue,
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "button-name", enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FlagQueue>;

export const PendingFlags: Story = {
  args: {
    flags: [
      {
        id: "1",
        messagePreview: "This is inappropriate content...",
        flaggedBy: "Parent Jones",
        reason: "Inappropriate language",
        flaggedAt: "2026-06-01 10:30 AM",
        status: "pending",
      },
      {
        id: "2",
        messagePreview: "Stop messaging me",
        flaggedBy: "Player Smith",
        reason: "Harassment",
        flaggedAt: "2026-05-31 3:15 PM",
        status: "pending",
      },
    ],
  },
};

export const AllReviewed: Story = {
  args: {
    flags: [
      {
        id: "1",
        messagePreview: "Some message",
        flaggedBy: "User A",
        reason: "Spam",
        flaggedAt: "2026-05-30",
        status: "reviewed",
      },
      {
        id: "2",
        messagePreview: "Another message",
        flaggedBy: "User B",
        reason: "Off-topic",
        flaggedAt: "2026-05-29",
        status: "dismissed",
      },
    ],
  },
};

export const EmptyQueue: Story = { args: { flags: [] } };

export const MinorRestrictions: StoryObj<typeof MinorRestrictionSettings> = {
  render: () => (
    <MinorRestrictionSettings
      current="team_threads_only"
      restrictions={[
        {
          value: "team_threads_only",
          label: "Team threads only",
          description: "Minors can only participate in team group threads.",
        },
        {
          value: "no_dm",
          label: "No direct messages",
          description: "Minors cannot send or receive direct messages.",
        },
        {
          value: "approved_contacts_only",
          label: "Approved contacts only",
          description: "Minors can only DM contacts approved by guardians.",
        },
        {
          value: "unrestricted",
          label: "Unrestricted",
          description: "No restrictions on minor messaging.",
        },
      ]}
    />
  ),
};
