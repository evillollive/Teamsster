import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "./client";
import type { ConversationType } from "./schema";
import {
  auditLogs,
  conversationMembers,
  conversations,
  messages,
} from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type ConversationSummary = {
  id: string;
  type: ConversationType;
  leagueId: string | null;
  teamId: string | null;
  title: string | null;
  createdAt: Date;
};

export type MessageSummary = {
  id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
};

// ── Message sanitization ─────────────────────────────────────────────────────

const XSS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
];

export function sanitizeMessageContent(content: string): string {
  let sanitized = content.slice(0, 10_000);
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }
  return sanitized.trim();
}

// ── Rate limiting ────────────────────────────────────────────────────────────

export const MESSAGE_RATE_LIMIT = {
  maxMessagesPerMinute: 30,
  maxThreadCreationsPerHour: 10,
} as const;

// ── Thread management ────────────────────────────────────────────────────────

export async function createConversation(input: {
  type: ConversationType;
  leagueId?: string;
  teamId?: string;
  title?: string;
  memberUserIds: string[];
}): Promise<string> {
  const [row] = await db
    .insert(conversations)
    .values({
      type: input.type,
      leagueId: input.leagueId ?? null,
      teamId: input.teamId ?? null,
      title: input.title ?? null,
    })
    .returning({ id: conversations.id });

  for (const userId of input.memberUserIds) {
    await db.insert(conversationMembers).values({
      conversationId: row.id,
      userId,
    });
  }

  if (input.leagueId) {
    await db.insert(auditLogs).values({
      action: "conversation.create",
      actorUserId: input.memberUserIds[0],
      entityType: "conversation",
      entityId: row.id,
      leagueId: input.leagueId,
      metadata: { type: input.type, memberCount: input.memberUserIds.length },
    });
  }

  return row.id;
}

export async function getConversationsByUser(
  userId: string,
): Promise<ConversationSummary[]> {
  return db
    .select({
      id: conversations.id,
      type: conversations.type,
      leagueId: conversations.leagueId,
      teamId: conversations.teamId,
      title: conversations.title,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .innerJoin(
      conversationMembers,
      eq(conversations.id, conversationMembers.conversationId),
    )
    .where(
      and(
        eq(conversationMembers.userId, userId),
        isNull(conversations.deletedAt),
      ),
    )
    .orderBy(desc(conversations.updatedAt));
}

export async function isThreadMember(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: conversationMembers.id })
    .from(conversationMembers)
    .innerJoin(
      conversations,
      eq(conversations.id, conversationMembers.conversationId),
    )
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
        isNull(conversations.deletedAt),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function sendMessage(input: {
  conversationId: string;
  senderUserId: string;
  content: string;
}): Promise<string> {
  const sanitized = sanitizeMessageContent(input.content);
  if (!sanitized) {
    throw new Error("Message content can't be empty.");
  }

  const [row] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      senderUserId: input.senderUserId,
      content: sanitized,
    })
    .returning({ id: messages.id });

  // Update conversation timestamp for ordering
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, input.conversationId));

  return row.id;
}

export async function getMessagesByConversation(
  conversationId: string,
  limit = 50,
): Promise<MessageSummary[]> {
  return db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderUserId: messages.senderUserId,
      content: messages.content,
      createdAt: messages.createdAt,
      editedAt: messages.editedAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        isNull(messages.deletedAt),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

// ── Unread counts ────────────────────────────────────────────────────────────

export async function getUnreadCountForConversation(
  conversationId: string,
  userId: string,
): Promise<number> {
  const memberRows = await db
    .select({ lastReadAt: conversationMembers.lastReadAt })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    )
    .limit(1);

  const lastRead = memberRows[0]?.lastReadAt;
  const conditions = [
    eq(messages.conversationId, conversationId),
    isNull(messages.deletedAt),
  ];

  if (lastRead) {
    const rows = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(messages)
      .where(and(...conditions, sql`${messages.createdAt} > ${lastRead}`));
    return rows[0]?.count ?? 0;
  }

  const rows = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(messages)
    .where(and(...conditions));
  return rows[0]?.count ?? 0;
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await db
    .update(conversationMembers)
    .set({ lastReadAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    );
}
