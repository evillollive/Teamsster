import { and, desc, eq, type InferSelectModel, isNull, sql } from "drizzle-orm";

import { db } from "./client";
import {
  auditLogs,
  deviceTokens,
  guardianMinorLinks,
  MINOR_EMAIL_DOMAIN,
  type NotificationEventType,
  type NotificationPreferences,
  normalizeNotificationPreferences,
  notificationDeliveries,
  notificationEvents,
  notificationFeedItems,
  users,
} from "./schema";

type UserRow = InferSelectModel<typeof users>;
type NotificationRecipientProfile = Pick<
  UserRow,
  "id" | "accountType" | "displayName" | "email"
> & {
  notificationPreferences: NotificationPreferences;
  onBehalfOf: string | null;
};

export type NotificationFeedItem = {
  id: string;
  eventId: string;
  kind: NotificationEventType;
  title: string;
  body: string;
  deliveredByFallback: boolean;
  readAt: Date | null;
  createdAt: Date;
  leagueId: string;
  teamId: string | null;
  metadata: Record<string, unknown> | null;
};

export type DispatchNotificationEventInput = {
  leagueId: string;
  teamId?: string | null;
  actorUserId?: string | null;
  audienceUserIds: string[];
  kind: NotificationEventType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  scheduledFor?: Date | null;
  dedupeKey?: string | null;
};

export type DispatchNotificationEventResult = {
  eventId: string | null;
  deduped: boolean;
  feedCount: number;
  deliveryCount: number;
};

function hasDeliverableEmail(email: string | null) {
  return Boolean(email && !email.endsWith(`@${MINOR_EMAIL_DOMAIN}`));
}

async function getRecipientProfiles(
  tx: Pick<typeof db, "select">,
  targetUserId: string,
): Promise<NotificationRecipientProfile[]> {
  const target = await tx
    .select({
      id: users.id,
      accountType: users.accountType,
      displayName: users.displayName,
      email: users.email,
      notificationPreferences: users.notificationPreferences,
    })
    .from(users)
    .where(and(eq(users.id, targetUserId), isNull(users.deletedAt)))
    .limit(1);

  if (!target[0]) {
    return [];
  }

  if (target[0].accountType !== "minor") {
    return [
      {
        ...target[0],
        notificationPreferences: normalizeNotificationPreferences(
          target[0].notificationPreferences,
        ),
        onBehalfOf: null,
      },
    ];
  }

  const guardians = await tx
    .select({
      id: users.id,
      accountType: users.accountType,
      displayName: users.displayName,
      email: users.email,
      notificationPreferences: users.notificationPreferences,
    })
    .from(guardianMinorLinks)
    .innerJoin(users, eq(users.id, guardianMinorLinks.guardianUserId))
    .where(
      and(
        eq(guardianMinorLinks.minorUserId, targetUserId),
        isNull(guardianMinorLinks.deletedAt),
        isNull(users.deletedAt),
      ),
    );

  return guardians.map((guardian) => ({
    ...guardian,
    notificationPreferences: normalizeNotificationPreferences(
      guardian.notificationPreferences,
    ),
    onBehalfOf: target[0].displayName ?? "Minor account",
  }));
}

export async function getNotificationPreferencesByUserId(userId: string) {
  const rows = await db
    .select({ notificationPreferences: users.notificationPreferences })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return rows[0]
    ? normalizeNotificationPreferences(rows[0].notificationPreferences)
    : null;
}

export async function updateNotificationPreferencesByUserId(input: {
  userId: string;
  actorUserId?: string | null;
  notificationPreferences: NotificationPreferences;
}) {
  const nextPreferences = normalizeNotificationPreferences(
    input.notificationPreferences,
  );

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        notificationPreferences: nextPreferences,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, input.userId), isNull(users.deletedAt)));

    await tx.insert(auditLogs).values({
      action: "notification.preferences.updated",
      actorUserId: input.actorUserId ?? input.userId,
      entityId: input.userId,
      entityType: "user",
      metadata: {
        eventTypes: Object.keys(nextPreferences),
      },
    });
  });
}

export async function getUnreadNotificationCountByUserId(userId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(notificationFeedItems)
    .where(
      and(
        eq(notificationFeedItems.userId, userId),
        isNull(notificationFeedItems.readAt),
      ),
    );

  return rows[0]?.count ?? 0;
}

export async function getNotificationFeedByUserId(userId: string, limit = 25) {
  const rows = await db
    .select({
      id: notificationFeedItems.id,
      eventId: notificationFeedItems.eventId,
      kind: notificationEvents.kind,
      title: notificationFeedItems.title,
      body: notificationFeedItems.body,
      deliveredByFallback: notificationFeedItems.deliveredByFallback,
      readAt: notificationFeedItems.readAt,
      createdAt: notificationFeedItems.createdAt,
      leagueId: notificationFeedItems.leagueId,
      teamId: notificationFeedItems.teamId,
      metadata: notificationFeedItems.metadata,
    })
    .from(notificationFeedItems)
    .innerJoin(
      notificationEvents,
      eq(notificationEvents.id, notificationFeedItems.eventId),
    )
    .where(eq(notificationFeedItems.userId, userId))
    .orderBy(desc(notificationFeedItems.createdAt))
    .limit(limit);

  return rows;
}

export async function markNotificationFeedItemRead(input: {
  userId: string;
  notificationId: string;
  read?: boolean;
}) {
  await db
    .update(notificationFeedItems)
    .set({
      readAt: input.read === false ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notificationFeedItems.id, input.notificationId),
        eq(notificationFeedItems.userId, input.userId),
      ),
    );
}

export async function markAllNotificationFeedItemsRead(userId: string) {
  await db
    .update(notificationFeedItems)
    .set({
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notificationFeedItems.userId, userId),
        isNull(notificationFeedItems.readAt),
      ),
    );
}

export async function dispatchNotificationEvent(
  input: DispatchNotificationEventInput,
): Promise<DispatchNotificationEventResult> {
  const audienceUserIds = [...new Set(input.audienceUserIds.filter(Boolean))];

  if (audienceUserIds.length === 0) {
    return {
      eventId: null,
      deduped: false,
      feedCount: 0,
      deliveryCount: 0,
    };
  }

  if (input.dedupeKey) {
    const existing = await db
      .select({ id: notificationEvents.id })
      .from(notificationEvents)
      .where(eq(notificationEvents.dedupeKey, input.dedupeKey))
      .limit(1);

    if (existing[0]) {
      return {
        eventId: existing[0].id,
        deduped: true,
        feedCount: 0,
        deliveryCount: 0,
      };
    }
  }

  return db.transaction(async (tx) => {
    const event = await tx
      .insert(notificationEvents)
      .values({
        actorUserId: input.actorUserId ?? null,
        body: input.body,
        dedupeKey: input.dedupeKey ?? null,
        kind: input.kind,
        leagueId: input.leagueId,
        metadata: input.metadata,
        scheduledFor: input.scheduledFor ?? null,
        teamId: input.teamId ?? null,
        title: input.title,
      })
      .returning({ id: notificationEvents.id });

    const eventId = event[0].id;
    let feedCount = 0;
    let deliveryCount = 0;

    const queueDelivery = async (params: {
      channel: "EMAIL" | "IN_APP" | "PUSH";
      metadata?: Record<string, unknown>;
      recipient: string;
      recipientUserId: string;
      status: "FAILED" | "QUEUED" | "SENT";
      sentAt?: Date | null;
    }) => {
      await tx.insert(notificationDeliveries).values({
        actorUserId: input.actorUserId ?? null,
        channel: params.channel,
        eventId,
        kind: input.kind,
        leagueId: input.leagueId,
        metadata: params.metadata,
        recipient: params.recipient,
        recipientUserId: params.recipientUserId,
        sentAt: params.sentAt ?? null,
        status: params.status,
        teamId: input.teamId ?? null,
        templateBody: input.body,
        templateSubject: input.title,
      });
      deliveryCount += 1;
    };

    for (const targetUserId of audienceUserIds) {
      const recipients = await getRecipientProfiles(tx, targetUserId);

      for (const recipient of recipients) {
        const preference = recipient.notificationPreferences[input.kind];
        let feedCreated = false;

        const ensureFeed = async (fallbackReason?: string) => {
          if (feedCreated) {
            return;
          }

          await tx.insert(notificationFeedItems).values({
            body: input.body,
            deliveredByFallback: Boolean(fallbackReason),
            eventId,
            leagueId: input.leagueId,
            metadata: {
              ...input.metadata,
              fallbackReason: fallbackReason ?? null,
              onBehalfOf: recipient.onBehalfOf,
              recipientUserId: recipient.id,
            },
            teamId: input.teamId ?? null,
            title: input.title,
            userId: recipient.id,
          });
          await queueDelivery({
            channel: "IN_APP",
            metadata: {
              fallbackReason: fallbackReason ?? null,
              onBehalfOf: recipient.onBehalfOf,
            },
            recipient: `user:${recipient.id}`,
            recipientUserId: recipient.id,
            sentAt: new Date(),
            status: "SENT",
          });
          feedCreated = true;
          feedCount += 1;
        };

        if (preference.inApp) {
          await ensureFeed();
        }

        let emailQueued = false;
        if (preference.email) {
          if (hasDeliverableEmail(recipient.email)) {
            await queueDelivery({
              channel: "EMAIL",
              metadata: { onBehalfOf: recipient.onBehalfOf },
              recipient: recipient.email as string,
              recipientUserId: recipient.id,
              status: "QUEUED",
            });
            emailQueued = true;
          } else {
            await queueDelivery({
              channel: "EMAIL",
              metadata: {
                onBehalfOf: recipient.onBehalfOf,
                failureReason: "No deliverable email address",
              },
              recipient: recipient.email ?? `user:${recipient.id}`,
              recipientUserId: recipient.id,
              status: "FAILED",
            });
          }
        }

        let pushQueued = false;
        if (preference.push) {
          const pushTokenRows = await tx
            .select({ count: sql<number>`count(*)`.mapWith(Number) })
            .from(deviceTokens)
            .where(eq(deviceTokens.userId, recipient.id));
          const pushCount = pushTokenRows[0]?.count ?? 0;
          if (pushCount > 0) {
            await queueDelivery({
              channel: "PUSH",
              metadata: {
                onBehalfOf: recipient.onBehalfOf,
                tokenCount: pushCount,
              },
              recipient: `user:${recipient.id}`,
              recipientUserId: recipient.id,
              status: "QUEUED",
            });
            pushQueued = true;
          } else {
            await queueDelivery({
              channel: "PUSH",
              metadata: {
                onBehalfOf: recipient.onBehalfOf,
                failureReason: "No active device tokens",
              },
              recipient: `user:${recipient.id}`,
              recipientUserId: recipient.id,
              status: "FAILED",
            });
          }
        }

        if (preference.push && !pushQueued && !emailQueued) {
          if (hasDeliverableEmail(recipient.email)) {
            await queueDelivery({
              channel: "EMAIL",
              metadata: {
                fallbackFrom: "PUSH",
                onBehalfOf: recipient.onBehalfOf,
              },
              recipient: recipient.email as string,
              recipientUserId: recipient.id,
              status: "QUEUED",
            });
            emailQueued = true;
          }
        }

        if ((preference.email || preference.push) && !emailQueued) {
          await ensureFeed(preference.push && !pushQueued ? "PUSH" : "EMAIL");
        }
      }
    }

    return {
      eventId,
      deduped: false,
      feedCount,
      deliveryCount,
    };
  });
}
