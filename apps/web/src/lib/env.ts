import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_ENABLE_PLAUSIBLE: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_ENABLE_SENTRY: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().default(""),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const serverEnvSchema = z.object({
  CRON_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  SENTRY_DSN: z.string().default(""),
  SMTP_FROM: z.string().email().optional(),
  SMTP_HOST: z.string().min(1).optional(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_ENABLE_PLAUSIBLE: process.env.NEXT_PUBLIC_ENABLE_PLAUSIBLE,
  NEXT_PUBLIC_ENABLE_SENTRY: process.env.NEXT_PUBLIC_ENABLE_SENTRY,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

export const serverEnv = serverEnvSchema.parse({
  CRON_SECRET: process.env.CRON_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SMTP_FROM: process.env.SMTP_FROM,
  SMTP_HOST: process.env.SMTP_HOST,
});
