import { db } from "@teamsster/db";
import { betterAuth } from "better-auth";
import { toNextJsHandler } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { z } from "zod";

// DEV ONLY - Must be overridden in production.
const DEFAULT_AUTH_SECRET = "insecure-dev-secret-change-in-production-1234";

const envSchema = z.object({
  AUTH_EMAIL_FROM: z.string().default("Teamsster <noreply@example.com>"),
  BETTER_AUTH_SECRET: z.string().default(DEFAULT_AUTH_SECRET),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
});

const env = envSchema.parse({
  AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
});

function logAuthEmail(
  kind: "magic-link" | "verification" | "reset-password",
  payload: { email: string; url: string },
) {
  console.info(`[teamsster-auth:${kind}] ${payload.email} -> ${payload.url}`);
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
      logAuthEmail("reset-password", { email: user.email, url });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      logAuthEmail("verification", { email: user.email, url });
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        logAuthEmail("magic-link", { email, url });
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
