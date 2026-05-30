import { describe, expect, it } from "vitest";

import {
  createSeasonSchema,
  customFieldSchema,
  formConfigSchema,
  REGISTRATION_RATE_LIMIT,
  sanitizeFormData,
  sanitizeRegistrationValue,
  seasonStatusSchema,
} from "@/lib/registration";

describe("seasonStatusSchema", () => {
  it("accepts valid statuses", () => {
    for (const s of ["draft", "open", "closed", "archived"]) {
      expect(seasonStatusSchema.safeParse(s).success).toBe(true);
    }
  });

  it("rejects invalid statuses", () => {
    expect(seasonStatusSchema.safeParse("active").success).toBe(false);
    expect(seasonStatusSchema.safeParse("").success).toBe(false);
  });
});

describe("createSeasonSchema", () => {
  const valid = {
    leagueId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    name: "Spring 2026",
    year: "2026",
  };

  it("accepts valid season input", () => {
    expect(createSeasonSchema.safeParse(valid).success).toBe(true);
  });

  it("trims name", () => {
    const result = createSeasonSchema.parse({ ...valid, name: "  Fall  " });
    expect(result.name).toBe("Fall");
  });

  it("rejects empty name", () => {
    expect(createSeasonSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects short year", () => {
    expect(createSeasonSchema.safeParse({ ...valid, year: "26" }).success).toBe(
      false,
    );
  });

  it("accepts optional dates", () => {
    const result = createSeasonSchema.parse({
      ...valid,
      registrationOpensAt: "2026-03-01",
      registrationClosesAt: "2026-04-15",
    });
    expect(result.registrationOpensAt).toBeInstanceOf(Date);
    expect(result.registrationClosesAt).toBeInstanceOf(Date);
  });
});

describe("formConfigSchema", () => {
  it("accepts valid form config", () => {
    const config = {
      requiredFields: ["firstName", "lastName"],
      optionalFields: ["address"],
      customFields: [
        { key: "allergies", label: "Allergies", type: "text", required: false },
      ],
    };
    expect(formConfigSchema.safeParse(config).success).toBe(true);
  });

  it("rejects too many custom fields", () => {
    const config = {
      requiredFields: [],
      optionalFields: [],
      customFields: Array.from({ length: 21 }, (_, i) => ({
        key: `f${i}`,
        label: `Field ${i}`,
        type: "text",
        required: false,
      })),
    };
    expect(formConfigSchema.safeParse(config).success).toBe(false);
  });
});

describe("customFieldSchema", () => {
  it("accepts text field", () => {
    expect(
      customFieldSchema.safeParse({
        key: "size",
        label: "Jersey Size",
        type: "text",
        required: true,
      }).success,
    ).toBe(true);
  });

  it("accepts select field with options", () => {
    expect(
      customFieldSchema.safeParse({
        key: "division",
        label: "Division",
        type: "select",
        options: ["U10", "U12", "U14"],
        required: true,
      }).success,
    ).toBe(true);
  });

  it("rejects empty key", () => {
    expect(
      customFieldSchema.safeParse({
        key: "",
        label: "Something",
        type: "text",
        required: false,
      }).success,
    ).toBe(false);
  });
});

describe("sanitizeRegistrationValue", () => {
  it("passes safe strings unchanged", () => {
    expect(sanitizeRegistrationValue("hello")).toBe("hello");
  });

  it("strips script tags", () => {
    const result = sanitizeRegistrationValue("<script>alert(1)</script>");
    expect(result).not.toContain("<script");
  });

  it("strips javascript: URLs", () => {
    const result = sanitizeRegistrationValue("javascript:alert(1)");
    expect(result).not.toContain("javascript:");
  });

  it("strips event handlers", () => {
    const result = sanitizeRegistrationValue('onerror = "hack"');
    expect(result).not.toMatch(/on\w+\s*=/i);
  });

  it("truncates long strings", () => {
    const long = "A".repeat(6000);
    const result = sanitizeRegistrationValue(long);
    expect((result as string).length).toBe(5000);
  });

  it("preserves numbers and booleans", () => {
    expect(sanitizeRegistrationValue(42)).toBe(42);
    expect(sanitizeRegistrationValue(true)).toBe(true);
  });

  it("nullifies undefined", () => {
    expect(sanitizeRegistrationValue(undefined)).toBeNull();
  });

  it("limits array length", () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const result = sanitizeRegistrationValue(arr) as number[];
    expect(result.length).toBe(50);
  });
});

describe("sanitizeFormData", () => {
  it("sanitizes nested values", () => {
    const data = { name: "Safe", evil: "<script>bad</script>" };
    const result = sanitizeFormData(data);
    expect(result.name).toBe("Safe");
    expect(result.evil).not.toContain("<script");
  });

  it("truncates long keys", () => {
    const data = { ["A".repeat(100)]: "value" };
    const result = sanitizeFormData(data);
    const keys = Object.keys(result);
    expect(keys[0].length).toBe(50);
  });
});

describe("REGISTRATION_RATE_LIMIT", () => {
  it("defines reasonable limits", () => {
    expect(REGISTRATION_RATE_LIMIT.maxSubmissionsPerHour).toBe(10);
    expect(REGISTRATION_RATE_LIMIT.windowMs).toBe(3600000);
  });
});
