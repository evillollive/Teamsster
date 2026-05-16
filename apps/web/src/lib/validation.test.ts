import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createValidatedAction, validateInput } from "@/lib/validation";

const schema = z.object({
  email: z.string().email(),
  teamName: z.string().min(2),
});

describe("validation", () => {
  it("returns flattened zod errors", () => {
    const result = validateInput(schema, {
      email: "not-an-email",
      teamName: "A",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.email).toHaveLength(1);
      expect(result.fieldErrors.teamName).toHaveLength(1);
    }
  });

  it("wraps actions behind schema validation", async () => {
    const action = createValidatedAction(schema, async (input) =>
      input.teamName.toUpperCase(),
    );

    const invalid = await action({ email: "bad", teamName: "A" });
    expect(invalid.success).toBe(false);

    const valid = await action({
      email: "coach@example.com",
      teamName: "Comets",
    });
    expect(valid).toEqual({ success: true, data: "COMETS" });
  });
});
