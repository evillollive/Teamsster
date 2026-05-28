import { db, provisionUserOnboarding } from "@teamsster/db";
import { betterAuth } from "better-auth";
import { toNextJsHandler } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import nodemailer from "nodemailer";
import { z } from "zod";

// DEV ONLY - Must be overridden in production.
const DEFAULT_AUTH_SECRET = "insecure-dev-secret-change-in-production-1234";

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  AUTH_EMAIL_FROM: z.string().default("Teamsster <noreply@example.com>"),
  AUTH_SMTP_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: isProduction
    ? z.string().min(1, "BETTER_AUTH_SECRET is required in production")
    : z.string().default(DEFAULT_AUTH_SECRET),
  BETTER_AUTH_URL: isProduction
    ? z.string().url("BETTER_AUTH_URL is required in production")
    : z.string().url().default("http://localhost:3000"),
});

const env = envSchema.parse({
  AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
  AUTH_SMTP_URL: process.env.AUTH_SMTP_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
});

// Fail fast: never allow the default dev secret in production.
if (isProduction && env.BETTER_AUTH_SECRET === DEFAULT_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET must be overridden in production.");
}

function getMailTransport() {
  if (!env.AUTH_SMTP_URL) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "AUTH_SMTP_URL must be configured in production to send auth emails.",
      );
    }

    return nodemailer.createTransport({
      streamTransport: true,
    });
  }

  return nodemailer.createTransport(env.AUTH_SMTP_URL);
}

async function sendAuthEmail(
  kind: "magic-link" | "verification" | "reset-password",
  payload: { email: string; url: string },
) {
  const subject =
    kind === "magic-link"
      ? "Your Teamsster magic link"
      : kind === "verification"
        ? "Verify your Teamsster email"
        : "Reset your Teamsster password";

  const escapedUrl = payload.url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const html = `<p>Hi there,</p><p>Use this secure link for Teamsster:</p><p><a href="${escapedUrl}">${escapedUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`;

  await getMailTransport().sendMail({
    from: env.AUTH_EMAIL_FROM,
    html,
    subject,
    text: `Use this Teamsster link: ${payload.url}`,
    to: payload.email,
  });
}

export const auth = betterAuth({
  appName: "Teamsster",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],
  database: {
    db,
    type: "postgres",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail("reset-password", { email: user.email, url });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail("verification", { email: user.email, url });
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await provisionUserOnboarding({
            authUserId: user.id,
            displayName: user.name,
            email: user.email,
          });
        },
      },
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendAuthEmail("magic-link", { email, url });
      },
    }),
  ],
  rateLimit: {
    enabled: true,
  },
});

export type AuthInstance = typeof auth;
export { toNextJsHandler };

export function assertProductionAuthSecret() {
  if (
    process.env.NODE_ENV === "production" &&
    env.BETTER_AUTH_SECRET === DEFAULT_AUTH_SECRET
  ) {
    throw new Error("BETTER_AUTH_SECRET must be overridden in production.");
  }
}
