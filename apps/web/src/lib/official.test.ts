import { validateScore } from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("validateScore", () => {
  it("accepts valid integer scores", () => {
    expect(validateScore("0")).toBe(true);
    expect(validateScore("3")).toBe(true);
    expect(validateScore("42")).toBe(true);
    expect(validateScore("999")).toBe(true);
  });

  it("accepts null or undefined (optional)", () => {
    expect(validateScore(null)).toBe(true);
    expect(validateScore(undefined)).toBe(true);
  });

  it("rejects negative scores", () => {
    expect(validateScore("-1")).toBe(false);
  });

  it("rejects scores over 999", () => {
    expect(validateScore("1000")).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(validateScore("abc")).toBe(false);
    expect(validateScore("3.5")).toBe(false);
  });

  it("treats empty string as no score (valid)", () => {
    expect(validateScore("")).toBe(true);
  });

  it("rejects padded numbers", () => {
    expect(validateScore("03")).toBe(false);
    expect(validateScore("007")).toBe(false);
  });
});
