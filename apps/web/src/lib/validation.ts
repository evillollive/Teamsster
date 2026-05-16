import type { ZodTypeAny, z } from "zod";

export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      fieldErrors: Record<string, string[]>;
      formErrors: string[];
    };

export function validateInput<TSchema extends ZodTypeAny>(
  schema: TSchema,
  input: unknown,
): ValidationResult<z.infer<TSchema>> {
  const parsed = schema.safeParse(input);

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
    };
  }

  const flattened = parsed.error.flatten();

  return {
    success: false,
    fieldErrors: Object.fromEntries(
      Object.entries(flattened.fieldErrors).map(([key, value]) => [
        key,
        value ?? [],
      ]),
    ) as Record<string, string[]>,
    formErrors: flattened.formErrors,
  };
}

export function createValidatedAction<TSchema extends ZodTypeAny, TResult>(
  schema: TSchema,
  handler: (input: z.infer<TSchema>) => TResult | Promise<TResult>,
) {
  return async (input: unknown) => {
    const result = validateInput(schema, input);

    if (!result.success) {
      return result;
    }

    return {
      success: true as const,
      data: await handler(result.data),
    };
  };
}
