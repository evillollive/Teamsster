import { getUnreadCountForSession } from "@/lib/notification-badge";

/**
 * Server component that renders an unread notification badge.
 * Fetches count asynchronously; renders nothing if count is 0.
 */
export async function NotificationBadge() {
  const count = await getUnreadCountForSession();

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
