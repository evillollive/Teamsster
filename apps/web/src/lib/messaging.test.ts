import { MESSAGE_RATE_LIMIT, sanitizeMessageContent } from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("sanitizeMessageContent", () => {
  it("preserves safe text", () => {
    expect(sanitizeMessageContent("Hello team!")).toBe("Hello team!");
  });

  it("removes script tags", () => {
    const result = sanitizeMessageContent(
      'Hello <script>alert("xss")</script> world',
    );
    expect(result).not.toContain("<script");
    expect(result).toContain("Hello");
    expect(result).toContain("world");
  });

  it("removes javascript: URLs", () => {
    const result = sanitizeMessageContent("click javascript: void(0)");
    expect(result).not.toContain("javascript:");
  });

  it("removes event handlers", () => {
    const result = sanitizeMessageContent('test onload="evil()" end');
    expect(result).not.toContain("onload=");
  });

  it("removes iframe tags", () => {
    const result = sanitizeMessageContent('<iframe src="evil.com"></iframe>');
    expect(result).not.toContain("<iframe");
  });

  it("removes object and embed tags", () => {
    expect(sanitizeMessageContent("<object>bad</object>")).not.toContain(
      "<object",
    );
    expect(sanitizeMessageContent('<embed src="x">')).not.toContain("<embed");
  });

  it("truncates to 10,000 characters", () => {
    const long = "A".repeat(15_000);
    expect(sanitizeMessageContent(long).length).toBeLessThanOrEqual(10_000);
  });

  it("trims whitespace", () => {
    expect(sanitizeMessageContent("  hello  ")).toBe("hello");
  });

  it("preserves links", () => {
    expect(sanitizeMessageContent("https://example.com")).toBe(
      "https://example.com",
    );
  });

  it("preserves basic formatting characters", () => {
    expect(sanitizeMessageContent("**bold** and *italic*")).toBe(
      "**bold** and *italic*",
    );
  });
});

describe("MESSAGE_RATE_LIMIT", () => {
  it("defines reasonable limits", () => {
    expect(MESSAGE_RATE_LIMIT.maxMessagesPerMinute).toBe(30);
    expect(MESSAGE_RATE_LIMIT.maxThreadCreationsPerHour).toBe(10);
  });
});
