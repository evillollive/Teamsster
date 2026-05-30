import { describe, expect, it } from "vitest";

import {
  createTemplateSchema,
  sanitizeTemplatePayload,
  templatePayloadSchema,
  templateTypeLabels,
  templateTypeSchema,
  updateTemplateSchema,
} from "@/lib/template";

describe("templateTypeSchema", () => {
  it("accepts valid template types", () => {
    for (const type of [
      "event",
      "announcement",
      "registration_form",
      "volunteer_opportunity",
    ]) {
      expect(templateTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("rejects invalid types", () => {
    expect(templateTypeSchema.safeParse("invalid").success).toBe(false);
    expect(templateTypeSchema.safeParse("").success).toBe(false);
  });
});

describe("templatePayloadSchema", () => {
  it("accepts valid payload with fields", () => {
    const result = templatePayloadSchema.safeParse({
      fields: { title: "Practice", duration: "90 minutes" },
      description: "Weekly practice template.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts payload without description", () => {
    const result = templatePayloadSchema.safeParse({
      fields: { title: "Game" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = templatePayloadSchema.safeParse({
      description: "No fields.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 500 chars", () => {
    const result = templatePayloadSchema.safeParse({
      fields: {},
      description: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("createTemplateSchema", () => {
  const validInput = {
    leagueId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    type: "event",
    name: "Weekly Practice",
    payload: { fields: { title: "Practice" } },
  };

  it("accepts valid input", () => {
    expect(createTemplateSchema.safeParse(validInput).success).toBe(true);
  });

  it("trims and validates name", () => {
    const result = createTemplateSchema.parse({
      ...validInput,
      name: "  Trimmed Name  ",
    });
    expect(result.name).toBe("Trimmed Name");
  });

  it("rejects empty name", () => {
    expect(
      createTemplateSchema.safeParse({ ...validInput, name: "" }).success,
    ).toBe(false);
  });

  it("rejects name over 200 chars", () => {
    expect(
      createTemplateSchema.safeParse({ ...validInput, name: "A".repeat(201) })
        .success,
    ).toBe(false);
  });

  it("accepts optional teamId", () => {
    const result = createTemplateSchema.parse({
      ...validInput,
      teamId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    });
    expect(result.teamId).toBe("b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22");
  });
});

describe("updateTemplateSchema", () => {
  it("accepts partial updates", () => {
    const result = updateTemplateSchema.parse({
      templateId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      leagueId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      name: "Updated Name",
    });
    expect(result.name).toBe("Updated Name");
    expect(result.payload).toBeUndefined();
  });
});

describe("sanitizeTemplatePayload", () => {
  it("passes through safe fields unchanged", () => {
    const payload = {
      fields: { title: "Practice", duration: "90 minutes" },
      description: "A template.",
    };
    expect(sanitizeTemplatePayload(payload)).toEqual(payload);
  });

  it("strips dangerous prototype keys", () => {
    const payload = {
      fields: {
        title: "Safe",
        __proto__: "evil",
        constructor: "bad",
      },
      description: "Test.",
    };
    const result = sanitizeTemplatePayload(payload);
    expect(result.fields).toEqual({ title: "Safe" });
  });

  it("truncates long string values", () => {
    const payload = {
      fields: { body: "A".repeat(6000) },
    };
    const result = sanitizeTemplatePayload(payload);
    expect((result.fields.body as string).length).toBe(5000);
  });

  it("truncates description to 500 chars", () => {
    const payload = {
      fields: {},
      description: "B".repeat(600),
    };
    const result = sanitizeTemplatePayload(payload);
    expect(result.description?.length).toBe(500);
  });

  it("limits array length to 100", () => {
    const payload = {
      fields: { items: Array.from({ length: 150 }, (_, i) => i) },
    };
    const result = sanitizeTemplatePayload(payload);
    expect((result.fields.items as number[]).length).toBe(100);
  });

  it("limits nesting depth to 5", () => {
    const deepNested = { a: { b: { c: { d: { e: { f: "too deep" } } } } } };
    const payload = { fields: deepNested };
    const result = sanitizeTemplatePayload(payload);
    const level5 = (result.fields as Record<string, unknown>).a as Record<
      string,
      unknown
    >;
    const level4 = level5?.b as Record<string, unknown>;
    const level3 = level4?.c as Record<string, unknown>;
    const level2 = level3?.d as Record<string, unknown>;
    const level1 = level2?.e as Record<string, unknown>;
    // At depth 5, nested objects have their children nulled
    expect((level1 as Record<string, unknown>)?.f).toBeNull();
  });
});

describe("templateTypeLabels", () => {
  it("has labels for all types", () => {
    expect(templateTypeLabels.event).toBe("Event");
    expect(templateTypeLabels.announcement).toBe("Announcement");
    expect(templateTypeLabels.registration_form).toBe("Registration Form");
    expect(templateTypeLabels.volunteer_opportunity).toBe(
      "Volunteer Opportunity",
    );
  });
});
