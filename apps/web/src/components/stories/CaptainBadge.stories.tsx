import type { Meta, StoryObj } from "@storybook/react";

type Captain = {
  userId: string;
  displayName: string | null;
  email: string;
  captainPermissionLevel: "full" | "restricted";
};

function CaptainBadgeList({ captains }: { captains: Captain[] }) {
  if (captains.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Team captains</h2>
      <ul className="grid gap-2" aria-label="Team captains">
        {captains.map((captain) => (
          <li
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            key={captain.userId}
          >
            <span
              aria-label="Captain"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700"
              role="img"
              title="Captain"
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </span>
            <span className="text-sm font-medium text-slate-700">
              {captain.displayName ?? captain.email}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {captain.captainPermissionLevel === "full"
                ? "Full permissions"
                : "Restricted"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const meta: Meta<typeof CaptainBadgeList> = {
  title: "Roster/CaptainBadge",
  component: CaptainBadgeList,
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "image-alt", enabled: true },
          { id: "list", enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CaptainBadgeList>;

export const SingleCaptain: Story = {
  args: {
    captains: [
      {
        userId: "u1",
        displayName: "Alex Rivera",
        email: "alex@example.com",
        captainPermissionLevel: "full",
      },
    ],
  },
};

export const MultipleCaptains: Story = {
  args: {
    captains: [
      {
        userId: "u1",
        displayName: "Alex Rivera",
        email: "alex@example.com",
        captainPermissionLevel: "full",
      },
      {
        userId: "u2",
        displayName: null,
        email: "sam@example.com",
        captainPermissionLevel: "restricted",
      },
    ],
  },
};

export const Empty: Story = {
  args: { captains: [] },
};
