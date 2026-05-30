import {
  buildMinorPlaceholderEmail,
  isMinorPlaceholderEmail,
  MINOR_EMAIL_DOMAIN,
} from "@teamsster/db";
import { z } from "zod";

// Username validation: alphanumeric, underscores, dots. 3-30 chars.
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username can't be longer than 30 characters.")
  .regex(
    /^[a-zA-Z0-9_.]+$/,
    "Username can only contain letters, numbers, underscores, and dots.",
  );

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "help",
  "mod",
  "moderator",
  "root",
  "staff",
  "support",
  "system",
  "teamsster",
]);

export function isReservedUsername(username: string) {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

export function validateUsername(username: string) {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return { valid: false as const, error: parsed.error.issues[0].message };
  }
  if (isReservedUsername(parsed.data)) {
    return { valid: false as const, error: "That username isn't available." };
  }
  return { valid: true as const, value: parsed.data };
}

export const createMinorAccountSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(120),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD.")
    .optional(),
  username: usernameSchema.refine(
    (val) => !isReservedUsername(val),
    "That username isn't available.",
  ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128),
});

export const linkGuardianSchema = z.object({
  guardianUserId: z.string().uuid(),
  minorUserId: z.string().uuid(),
  relationship: z.string().trim().max(100).optional(),
  isPrimary: z.boolean().optional(),
});

export const unlinkGuardianSchema = z.object({
  guardianUserId: z.string().uuid(),
  minorUserId: z.string().uuid(),
});

export {
  buildMinorPlaceholderEmail,
  isMinorPlaceholderEmail,
  MINOR_EMAIL_DOMAIN,
};
