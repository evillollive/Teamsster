import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_ENABLE_PLAUSIBLE: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_ENABLE_SENTRY: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().default(""),
});

const serverEnvSchema = z.object({
  SENTRY_DSN: z.string().default(""),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_ENABLE_PLAUSIBLE: process.env.NEXT_PUBLIC_ENABLE_PLAUSIBLE,
  NEXT_PUBLIC_ENABLE_SENTRY: process.env.NEXT_PUBLIC_ENABLE_SENTRY,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
});

export const serverEnv = serverEnvSchema.parse({
  SENTRY_DSN: process.env.SENTRY_DSN,
});
