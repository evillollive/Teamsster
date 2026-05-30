import type { Meta, StoryObj } from "@storybook/react";

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-label={`${count} unread notification${count === 1 ? "" : "s"}`}
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white"
      role="status"
    >
      {displayCount}
    </span>
  );
}

const meta: Meta<typeof NotificationBadge> = {
  title: "Notifications/Badge",
  component: NotificationBadge,
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: {
        rules: [{ id: "color-contrast", enabled: true }],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationBadge>;

export const SingleDigit: Story = {
  args: { count: 3 },
};

export const DoubleDigit: Story = {
  args: { count: 42 },
};

export const Overflow: Story = {
  args: { count: 150 },
};

export const One: Story = {
  args: { count: 1 },
};

export const Zero: Story = {
  args: { count: 0 },
};
