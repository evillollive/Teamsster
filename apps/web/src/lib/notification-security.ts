/**
 * Security utilities for the notification delivery system.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

const HTML_ESCAPE_PATTERN = /[&<>"']/g;

/**
 * Escapes HTML special characters to prevent XSS in email templates.
 * Use this on any user-provided content before embedding in email body/subject.
 */
export function escapeHtml(input: string): string {
  return input.replace(
    HTML_ESCAPE_PATTERN,
    (char) => HTML_ESCAPE_MAP[char] ?? char,
  );
}

/**
 * Strips all HTML tags from a string, leaving only plain text.
 * Use as a fallback sanitizer for text-only contexts.
 */
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitizes an email subject line.
 * Prevents header injection by removing newlines and limiting length.
 */
export function sanitizeEmailSubject(subject: string): string {
  return stripHtmlTags(subject)
    .replace(/[\r\n]/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * Sanitizes email body content for safe embedding in HTML templates.
 * Escapes HTML entities and limits total length.
 */
export function sanitizeEmailBody(body: string, maxLength = 10_000): string {
  return escapeHtml(body).slice(0, maxLength);
}

/**
 * Rate limiting token bucket configuration for push token registration.
 * Intended to be used with a per-user or per-IP limiter.
 */
export const PUSH_TOKEN_RATE_LIMIT = {
  /** Maximum registration attempts per window */
  maxAttempts: 5,
  /** Window duration in seconds */
  windowSeconds: 300,
  /** Cooldown after exceeding limit in seconds */
  cooldownSeconds: 900,
} as const;

/**
 * Simple in-memory rate limiter for token registration.
 * In production, this should use Redis or a database-backed store.
 */
export class TokenRegistrationRateLimiter {
  private attempts = new Map<string, { count: number; windowStart: number }>();

  isAllowed(identifier: string, now = Date.now()): boolean {
    const entry = this.attempts.get(identifier);
    const windowMs = PUSH_TOKEN_RATE_LIMIT.windowSeconds * 1000;

    if (!entry || now - entry.windowStart > windowMs) {
      this.attempts.set(identifier, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= PUSH_TOKEN_RATE_LIMIT.maxAttempts) {
      return false;
    }

    entry.count++;
    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}
