import { createElement, isValidElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/notification-badge", () => ({
  NotificationBadge: vi.fn(() => null),
}));

import { AppShell } from "@/components/app-shell";
import { NotificationBadge } from "@/components/notification-badge";

function collectNotificationBadges(node: ReactNode): ReactNode[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectNotificationBadges);
  }

  if (!isValidElement(node)) {
    return [];
  }

  const props = node.props as {
    children?: ReactNode;
  };
  const current =
    node.type === NotificationBadge ? [node.props as ReactNode] : [];

  return [...current, ...collectNotificationBadges(props.children)];
}

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders notification badge placeholders without fetching in the shell", () => {
    const tree = AppShell({
      children: createElement("div", null, "Page content"),
    });
    const badges = collectNotificationBadges(tree);

    expect(badges).toHaveLength(2);
    expect(NotificationBadge).toHaveBeenCalledTimes(0);
  });
});
