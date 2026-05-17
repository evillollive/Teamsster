import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import {
  announcements,
  auditLogs,
  notificationDeliveries,
  type notificationDeliveryChannelValues,
  type notificationDeliveryKindValues,
  type notificationDeliveryStatusValues,
  teams,
} from "./schema";

export type AnnouncementSummary = {
  id: string;
  leagueId: string;
  teamId: string | null;
  teamName: string | null;
  title: string;
  body: string;
  publishedAt: Date;
  createdAt: Date;
};

type NotificationDeliveryChannel =
  (typeof notificationDeliveryChannelValues)[number];
type NotificationDeliveryKind = (typeof notificationDeliveryKindValues)[number];
type NotificationDeliveryStatus =
  (typeof notificationDeliveryStatusValues)[number];

export type NotificationDeliverySummary = {
  id: string;
  leagueId: string;
  teamId: string | null;
  actorUserId: string | null;
  recipient: string;
  channel: NotificationDeliveryChannel;
  kind: NotificationDeliveryKind;
  status: NotificationDeliveryStatus;
  templateSubject: string;
  templateBody: string;
  sentAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

type CreateAnnouncementInput = {
  leagueId: string;
  teamId?: string;
  title: string;
  body: string;
  userId: string;
};

type ArchiveAnnouncementInput = {
  announcementId: string;
  leagueId: string;
  actorUserId: string;
};

type LogNotificationDeliveryInput = {
  leagueId: string;
  teamId?: string;
  actorUserId: string;
  recipient: string;
  channel?: NotificationDeliveryChannel;
  kind: NotificationDeliveryKind;
  status?: NotificationDeliveryStatus;
  templateSubject: string;
  templateBody: string;
  metadata?: Record<string, unknown>;
};

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const { body, leagueId, teamId, title, userId } = input;

  return db.transaction(async (tx) => {
    if (teamId) {
      const activeTeam = await tx
        .select({ id: teams.id })
        .from(teams)
        .where(
          and(
            eq(teams.id, teamId),
            eq(teams.leagueId, leagueId),
            isNull(teams.deletedAt),
          ),
        )
        .limit(1);

      if (!activeTeam[0]) {
        throw new Error("Team not found or already archived.");
      }
    }

    const announcementId = (
      await tx
        .insert(announcements)
        .values({
          body: body.trim(),
          createdById: userId,
          leagueId,
          teamId: teamId ?? null,
          title: title.trim(),
        })
        .returning({ id: announcements.id })
    )[0].id;

    await tx.insert(auditLogs).values({
      action: "announcement.create",
      actorUserId: userId,
      entityId: announcementId,
      entityType: "announcement",
      leagueId,
      metadata: {
        body: body.trim(),
        teamId: teamId ?? null,
        title: title.trim(),
      },
    });

    return { announcementId };
  });
}

export async function archiveAnnouncement(input: ArchiveAnnouncementInput) {
  const { actorUserId, announcementId, leagueId } = input;
  const now = new Date();

  await db.transaction(async (tx) => {
    const archived = await tx
      .update(announcements)
      .set({
        deletedAt: now,
        deletedById: actorUserId,
        updatedAt: now,
      })
      .where(
        and(
          eq(announcements.id, announcementId),
          eq(announcements.leagueId, leagueId),
          isNull(announcements.deletedAt),
        ),
      )
      .returning({ id: announcements.id, teamId: announcements.teamId });

    if (!archived[0]) {
      throw new Error("Announcement not found or already archived.");
    }

    await tx.insert(auditLogs).values({
      action: "announcement.archive",
      actorUserId,
      entityId: announcementId,
      entityType: "announcement",
      leagueId,
      metadata: { teamId: archived[0].teamId },
    });
  });
}

export async function getAnnouncementsByLeagueId(
  leagueId: string,
): Promise<AnnouncementSummary[]> {
  return db
    .select({
      id: announcements.id,
      leagueId: announcements.leagueId,
      teamId: announcements.teamId,
      teamName: teams.name,
      title: announcements.title,
      body: announcements.body,
      publishedAt: announcements.publishedAt,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .leftJoin(teams, eq(teams.id, announcements.teamId))
    .where(
      and(
        eq(announcements.leagueId, leagueId),
        isNull(announcements.deletedAt),
      ),
    )
    .orderBy(desc(announcements.publishedAt), desc(announcements.createdAt));
}

export async function getAnnouncementById(announcementId: string) {
  const rows = await db
    .select({
      id: announcements.id,
      leagueId: announcements.leagueId,
      teamId: announcements.teamId,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.id, announcementId),
        isNull(announcements.deletedAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function logNotificationDelivery(
  input: LogNotificationDeliveryInput,
) {
  const {
    actorUserId,
    channel = "EMAIL",
    kind,
    leagueId,
    metadata,
    recipient,
    status = "SENT",
    teamId,
    templateBody,
    templateSubject,
  } = input;
  const now = new Date();

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(notificationDeliveries)
      .values({
        actorUserId,
        channel,
        kind,
        leagueId,
        metadata,
        recipient: recipient.trim(),
        sentAt: status === "SENT" ? now : null,
        status,
        teamId: teamId ?? null,
        templateBody,
        templateSubject,
      })
      .returning({ id: notificationDeliveries.id });

    await tx.insert(auditLogs).values({
      action: "notification.delivery.log",
      actorUserId,
      entityId: inserted[0].id,
      entityType: "notification_delivery",
      leagueId,
      metadata: {
        channel,
        kind,
        recipient: recipient.trim(),
        status,
        teamId: teamId ?? null,
      },
    });

    return inserted[0];
  });
}

export async function getNotificationDeliveriesByLeagueId(
  leagueId: string,
  limit = 20,
): Promise<NotificationDeliverySummary[]> {
  return db
    .select({
      actorUserId: notificationDeliveries.actorUserId,
      channel: notificationDeliveries.channel,
      createdAt: notificationDeliveries.createdAt,
      id: notificationDeliveries.id,
      kind: notificationDeliveries.kind,
      leagueId: notificationDeliveries.leagueId,
      metadata: notificationDeliveries.metadata,
      recipient: notificationDeliveries.recipient,
      sentAt: notificationDeliveries.sentAt,
      status: notificationDeliveries.status,
      teamId: notificationDeliveries.teamId,
      templateBody: notificationDeliveries.templateBody,
      templateSubject: notificationDeliveries.templateSubject,
    })
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.leagueId, leagueId))
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(limit);
}
