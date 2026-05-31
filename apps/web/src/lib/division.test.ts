import {
  COMPETITIVE_LEVEL_LABELS,
  getAgeGroupLabel,
  validateBirthYearRange,
} from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("validateBirthYearRange", () => {
  it("returns null for no years (all ages)", () => {
    expect(validateBirthYearRange(null, null)).toBeNull();
    expect(validateBirthYearRange(undefined, undefined)).toBeNull();
  });

  it("returns null for valid range", () => {
    expect(validateBirthYearRange("2014", "2016")).toBeNull();
  });

  it("rejects inverted range", () => {
    const error = validateBirthYearRange("2020", "2010");
    expect(error).toContain("can't be after");
  });

  it("rejects non-numeric years", () => {
    expect(validateBirthYearRange("abc", "2020")).toContain("valid numbers");
  });

  it("rejects years outside 1900-2100", () => {
    expect(validateBirthYearRange("1899", "2020")).toContain("1900 and 2100");
    expect(validateBirthYearRange("2020", "2101")).toContain("1900 and 2100");
  });

  it("allows single-sided ranges", () => {
    expect(validateBirthYearRange("2015", null)).toBeNull();
    expect(validateBirthYearRange(null, "2020")).toBeNull();
  });
});

describe("getAgeGroupLabel", () => {
  it("returns 'All ages' when no years set", () => {
    expect(getAgeGroupLabel(null, null)).toBe("All ages");
  });

  it("returns range label", () => {
    expect(getAgeGroupLabel("2014", "2016")).toBe("Born 2014-2016");
  });

  it("returns min-only label", () => {
    expect(getAgeGroupLabel("2015", null)).toBe("Born 2015+");
  });

  it("returns max-only label", () => {
    expect(getAgeGroupLabel(null, "2020")).toBe("Born before 2020");
  });
});

describe("COMPETITIVE_LEVEL_LABELS", () => {
  it("has labels for all levels", () => {
    expect(COMPETITIVE_LEVEL_LABELS.recreational).toBe("Recreational");
    expect(COMPETITIVE_LEVEL_LABELS.competitive).toBe("Competitive");
    expect(COMPETITIVE_LEVEL_LABELS.elite).toBe("Elite");
  });
});
