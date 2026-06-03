import { createElement, isValidElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/notification-badge", () => ({
  NotificationBadge: vi.fn(() => null),
}));

vi.mock("@/lib/notification-badge", () => ({
  getUnreadCountForSession: vi.fn(),
}));

import { AppShell } from "@/components/app-shell";
import { NotificationBadge } from "@/components/notification-badge";
import { getUnreadCountForSession } from "@/lib/notification-badge";

type NotificationBadgeProps = {
  unreadCount: Promise<number>;
};

function collectNotificationBadgeProps(
  node: ReactNode,
): NotificationBadgeProps[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectNotificationBadgeProps);
  }

  if (!isValidElement(node)) {
    return [];
  }

  const props = node.props as {
    children?: ReactNode;
  };
  const current =
    node.type === NotificationBadge
      ? [node.props as NotificationBadgeProps]
      : [];

  return [...current, ...collectNotificationBadgeProps(props.children)];
}

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shares one unread notification count lookup across badge placements", () => {
    const unreadCount = Promise.resolve(7);
    vi.mocked(getUnreadCountForSession).mockReturnValue(unreadCount);

    const tree = AppShell({
      children: createElement("div", null, "Page content"),
    });
    const badgeProps = collectNotificationBadgeProps(tree);

    expect(getUnreadCountForSession).toHaveBeenCalledTimes(1);
    expect(badgeProps).toHaveLength(2);
    expect(badgeProps.every((props) => props.unreadCount === unreadCount)).toBe(
      true,
    );
  });
});
