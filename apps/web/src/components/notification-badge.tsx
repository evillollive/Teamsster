"use client";

import { useEffect, useState } from "react";

type UnreadCountResponse = {
  unreadCount: number;
};

let unreadCountPromise: Promise<number> | null = null;

export function resetUnreadNotificationCountCache() {
  unreadCountPromise = null;
}

function getUnreadNotificationCount() {
  if (!unreadCountPromise) {
    unreadCountPromise = fetch("/api/v1/notifications/unread-count", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load unread notification count.");
        }

        const body = (await response.json()) as UnreadCountResponse;
        return Number.isFinite(body.unreadCount) ? body.unreadCount : 0;
      })
      .catch((error: unknown) => {
        unreadCountPromise = null;
        console.error("[teamsster] Unread notification count failed:", error);
        return 0;
      });
  }

  return unreadCountPromise;
}

export function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    getUnreadNotificationCount().then((nextCount) => {
      if (active) {
        setCount(nextCount);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-label={`${count} unread notification${count === 1 ? "" : "s"}`}
      className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white"
      role="status"
    >
      {displayCount}
    </span>
  );
}
