import { NextResponse } from "next/server";

import { getUnreadCountForSession } from "@/lib/notification-badge";

export async function GET() {
  const unreadCount = await getUnreadCountForSession();

  return NextResponse.json(
    { unreadCount },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
