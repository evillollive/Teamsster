import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  PUSH_TOKEN_RATE_LIMIT,
  sanitizeEmailBody,
  sanitizeEmailSubject,
  stripHtmlTags,
  TokenRegistrationRateLimiter,
} from "@/lib/notification-security";

describe("escapeHtml", () => {
  it("escapes all dangerous characters", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  it("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("leaves safe text unchanged", () => {
    expect(escapeHtml("Hello world")).toBe("Hello world");
  });
});

describe("stripHtmlTags", () => {
  it("removes all HTML tags", () => {
    expect(stripHtmlTags("<b>bold</b> and <i>italic</i>")).toBe(
      "bold and italic",
    );
  });

  it("handles self-closing tags", () => {
    expect(stripHtmlTags("line<br/>break")).toBe("linebreak");
  });

  it("handles nested tags", () => {
    expect(stripHtmlTags("<div><p>text</p></div>")).toBe("text");
  });
});

describe("sanitizeEmailSubject", () => {
  it("removes newlines to prevent header injection", () => {
    expect(sanitizeEmailSubject("Subject\r\nBCC: attacker@evil.com")).toBe(
      "Subject  BCC: attacker@evil.com",
    );
  });

  it("strips HTML tags", () => {
    expect(sanitizeEmailSubject("<b>Important</b> update")).toBe(
      "Important update",
    );
  });

  it("trims whitespace", () => {
    expect(sanitizeEmailSubject("  Hello  ")).toBe("Hello");
  });

  it("truncates to 200 characters", () => {
    const long = "A".repeat(250);
    expect(sanitizeEmailSubject(long)).toHaveLength(200);
  });
});

describe("sanitizeEmailBody", () => {
  it("escapes HTML entities in body content", () => {
    expect(sanitizeEmailBody("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("respects max length parameter", () => {
    const body = "Hello ".repeat(100);
    const result = sanitizeEmailBody(body, 50);
    expect(result.length).toBeLessThanOrEqual(50);
  });
});

describe("TokenRegistrationRateLimiter", () => {
  it("allows requests under the limit", () => {
    const limiter = new TokenRegistrationRateLimiter();
    for (let i = 0; i < PUSH_TOKEN_RATE_LIMIT.maxAttempts; i++) {
      expect(limiter.isAllowed("user-1")).toBe(true);
    }
  });

  it("blocks requests over the limit", () => {
    const limiter = new TokenRegistrationRateLimiter();
    for (let i = 0; i < PUSH_TOKEN_RATE_LIMIT.maxAttempts; i++) {
      limiter.isAllowed("user-1");
    }
    expect(limiter.isAllowed("user-1")).toBe(false);
  });

  it("isolates limits per identifier", () => {
    const limiter = new TokenRegistrationRateLimiter();
    for (let i = 0; i < PUSH_TOKEN_RATE_LIMIT.maxAttempts; i++) {
      limiter.isAllowed("user-1");
    }
    expect(limiter.isAllowed("user-1")).toBe(false);
    expect(limiter.isAllowed("user-2")).toBe(true);
  });

  it("resets after window expires", () => {
    const limiter = new TokenRegistrationRateLimiter();
    const now = Date.now();
    for (let i = 0; i < PUSH_TOKEN_RATE_LIMIT.maxAttempts; i++) {
      limiter.isAllowed("user-1", now);
    }
    expect(limiter.isAllowed("user-1", now)).toBe(false);

    const afterWindow = now + PUSH_TOKEN_RATE_LIMIT.windowSeconds * 1000 + 1;
    expect(limiter.isAllowed("user-1", afterWindow)).toBe(true);
  });

  it("supports manual reset", () => {
    const limiter = new TokenRegistrationRateLimiter();
    for (let i = 0; i < PUSH_TOKEN_RATE_LIMIT.maxAttempts; i++) {
      limiter.isAllowed("user-1");
    }
    limiter.reset("user-1");
    expect(limiter.isAllowed("user-1")).toBe(true);
  });
});
