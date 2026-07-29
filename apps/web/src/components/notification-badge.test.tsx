import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  NotificationBadge,
  resetUnreadNotificationCountCache,
} from "@/components/notification-badge";

describe("NotificationBadge", () => {
  beforeEach(() => {
    resetUnreadNotificationCountCache();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads and renders the unread count", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ unreadCount: 7 }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<NotificationBadge />);

    expect(
      await screen.findByRole("status", {
        name: "7 unread notifications",
      }),
    ).toHaveTextContent("7");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/notifications/unread-count",
      {
        cache: "no-store",
        credentials: "same-origin",
      },
    );
  });

  it("shares one unread count request across mounted badges", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ unreadCount: 3 }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <>
        <NotificationBadge />
        <NotificationBadge />
      </>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole("status")).toHaveLength(2);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
