import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import type { TemplatePayload, TemplateType } from "./schema";
import { auditLogs, templates } from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type TemplateSummary = {
  id: string;
  leagueId: string;
  teamId: string | null;
  type: TemplateType;
  name: string;
  payload: TemplatePayload;
  isBuiltIn: boolean;
  createdAt: Date;
};

type CreateTemplateInput = {
  leagueId: string;
  teamId?: string;
  type: TemplateType;
  name: string;
  payload: TemplatePayload;
  isBuiltIn?: boolean;
  createdById: string;
};

type UpdateTemplateInput = {
  templateId: string;
  leagueId: string;
  name?: string;
  payload?: TemplatePayload;
  actorUserId: string;
};

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getTemplatesByLeague(
  leagueId: string,
  type?: TemplateType,
): Promise<TemplateSummary[]> {
  const conditions = [
    eq(templates.leagueId, leagueId),
    isNull(templates.deletedAt),
  ];

  if (type) {
    conditions.push(eq(templates.type, type));
  }

  return db
    .select({
      id: templates.id,
      leagueId: templates.leagueId,
      teamId: templates.teamId,
      type: templates.type,
      name: templates.name,
      payload: templates.payload,
      isBuiltIn: templates.isBuiltIn,
      createdAt: templates.createdAt,
    })
    .from(templates)
    .where(and(...conditions))
    .orderBy(templates.name);
}

export async function getTemplatesByTeam(
  teamId: string,
  type?: TemplateType,
): Promise<TemplateSummary[]> {
  const conditions = [
    eq(templates.teamId, teamId),
    isNull(templates.deletedAt),
  ];

  if (type) {
    conditions.push(eq(templates.type, type));
  }

  return db
    .select({
      id: templates.id,
      leagueId: templates.leagueId,
      teamId: templates.teamId,
      type: templates.type,
      name: templates.name,
      payload: templates.payload,
      isBuiltIn: templates.isBuiltIn,
      createdAt: templates.createdAt,
    })
    .from(templates)
    .where(and(...conditions))
    .orderBy(templates.name);
}

export async function getTemplateById(
  templateId: string,
): Promise<TemplateSummary | null> {
  const rows = await db
    .select({
      id: templates.id,
      leagueId: templates.leagueId,
      teamId: templates.teamId,
      type: templates.type,
      name: templates.name,
      payload: templates.payload,
      isBuiltIn: templates.isBuiltIn,
      createdAt: templates.createdAt,
    })
    .from(templates)
    .where(and(eq(templates.id, templateId), isNull(templates.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createTemplate(
  input: CreateTemplateInput,
): Promise<string> {
  const [row] = await db
    .insert(templates)
    .values({
      leagueId: input.leagueId,
      teamId: input.teamId ?? null,
      type: input.type,
      name: input.name,
      payload: input.payload,
      isBuiltIn: input.isBuiltIn ?? false,
      createdById: input.createdById,
    })
    .returning({ id: templates.id });

  await db.insert(auditLogs).values({
    action: "template.create",
    actorUserId: input.createdById,
    entityType: "template",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { type: input.type, name: input.name },
  });

  return row.id;
}

export async function updateTemplate(
  input: UpdateTemplateInput,
): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.payload !== undefined) updates.payload = input.payload;

  await db
    .update(templates)
    .set(updates)
    .where(
      and(
        eq(templates.id, input.templateId),
        eq(templates.leagueId, input.leagueId),
        isNull(templates.deletedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: "template.update",
    actorUserId: input.actorUserId,
    entityType: "template",
    entityId: input.templateId,
    leagueId: input.leagueId,
    metadata: {
      updatedFields: Object.keys(updates).filter((k) => k !== "updatedAt"),
    },
  });
}

export async function duplicateTemplate(input: {
  templateId: string;
  leagueId: string;
  teamId?: string;
  newName: string;
  actorUserId: string;
}): Promise<string> {
  const original = await getTemplateById(input.templateId);
  if (!original) {
    throw new Error("Template not found.");
  }

  return createTemplate({
    leagueId: input.leagueId,
    teamId: input.teamId,
    type: original.type,
    name: input.newName,
    payload: original.payload,
    isBuiltIn: false,
    createdById: input.actorUserId,
  });
}

export async function deleteTemplate(input: {
  templateId: string;
  leagueId: string;
  actorUserId: string;
}): Promise<void> {
  await db
    .update(templates)
    .set({ deletedAt: new Date(), deletedById: input.actorUserId })
    .where(
      and(
        eq(templates.id, input.templateId),
        eq(templates.leagueId, input.leagueId),
        isNull(templates.deletedAt),
      ),
    );

  await db.insert(auditLogs).values({
    action: "template.delete",
    actorUserId: input.actorUserId,
    entityType: "template",
    entityId: input.templateId,
    leagueId: input.leagueId,
    metadata: {},
  });
}

// ── Starter templates ────────────────────────────────────────────────────────

const STARTER_TEMPLATES: Omit<
  CreateTemplateInput,
  "leagueId" | "createdById"
>[] = [
  {
    type: "event",
    name: "Weekly Practice",
    payload: {
      fields: {
        title: "Practice",
        duration: "90 minutes",
        recurrence: "weekly",
      },
      description: "Standard weekly team practice session.",
    },
    isBuiltIn: true,
  },
  {
    type: "event",
    name: "Game Day",
    payload: {
      fields: { title: "Game", duration: "120 minutes", requiresRsvp: true },
      description: "Regular season game with RSVP tracking.",
    },
    isBuiltIn: true,
  },
  {
    type: "event",
    name: "Tournament",
    payload: {
      fields: { title: "Tournament", duration: "full day", requiresRsvp: true },
      description: "Multi-game tournament event.",
    },
    isBuiltIn: true,
  },
  {
    type: "announcement",
    name: "Rain Cancellation",
    payload: {
      fields: {
        title: "Practice Cancelled",
        body: "Due to weather conditions, today's practice has been cancelled. Stay safe!",
      },
      description: "Quick weather cancellation notice.",
    },
    isBuiltIn: true,
  },
  {
    type: "announcement",
    name: "Field Change",
    payload: {
      fields: {
        title: "Field Change",
        body: "Today's event has been moved to a different location. Please check the updated details.",
      },
      description: "Location change notification.",
    },
    isBuiltIn: true,
  },
  {
    type: "registration_form",
    name: "Standard Season Registration",
    payload: {
      fields: {
        requireGuardianContact: true,
        requireEmergencyContact: true,
        requireMedicalNotes: false,
      },
      description:
        "Basic season registration collecting player and guardian info.",
    },
    isBuiltIn: true,
  },
  {
    type: "volunteer_opportunity",
    name: "Concession Stand Shift",
    payload: {
      fields: {
        title: "Concession Stand",
        duration: "2 hours",
        spotsNeeded: 2,
      },
      description: "Standard concession stand volunteer shift.",
    },
    isBuiltIn: true,
  },
  {
    type: "volunteer_opportunity",
    name: "Field Setup",
    payload: {
      fields: { title: "Field Setup", duration: "1 hour", spotsNeeded: 4 },
      description: "Pre-game field preparation and equipment setup.",
    },
    isBuiltIn: true,
  },
];

/**
 * Seeds built-in starter templates for a new league.
 * Call this after league creation.
 */
export async function seedStarterTemplates(
  leagueId: string,
  createdById: string,
): Promise<void> {
  for (const template of STARTER_TEMPLATES) {
    await createTemplate({
      ...template,
      leagueId,
      createdById,
    });
  }
}
