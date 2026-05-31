import {
  generateIncidentCsv,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_TYPE_LABELS,
  validateIncidentReport,
} from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("validateIncidentReport", () => {
  const valid = {
    title: "Player injury during practice",
    narrative: "Player A tripped over a cone and twisted their ankle.",
    type: "injury",
    severity: "moderate",
  };

  it("returns no errors for valid input", () => {
    expect(validateIncidentReport(valid)).toHaveLength(0);
  });

  it("requires title", () => {
    expect(validateIncidentReport({ ...valid, title: "" })).toContain(
      "Title is required.",
    );
    expect(validateIncidentReport({ ...valid, title: "   " })).toContain(
      "Title is required.",
    );
  });

  it("rejects title over 200 chars", () => {
    const errors = validateIncidentReport({
      ...valid,
      title: "A".repeat(201),
    });
    expect(errors.some((e) => e.includes("200 characters"))).toBe(true);
  });

  it("requires narrative", () => {
    expect(validateIncidentReport({ ...valid, narrative: "" })).toContain(
      "Narrative is required.",
    );
  });

  it("rejects narrative over 10,000 chars", () => {
    const errors = validateIncidentReport({
      ...valid,
      narrative: "A".repeat(10_001),
    });
    expect(errors.some((e) => e.includes("10,000"))).toBe(true);
  });

  it("rejects invalid type", () => {
    expect(validateIncidentReport({ ...valid, type: "unknown" })).toContain(
      "Invalid incident type.",
    );
  });

  it("rejects invalid severity", () => {
    expect(validateIncidentReport({ ...valid, severity: "extreme" })).toContain(
      "Invalid severity level.",
    );
  });

  it("returns multiple errors at once", () => {
    const errors = validateIncidentReport({
      title: "",
      narrative: "",
      type: "bad",
      severity: "bad",
    });
    expect(errors.length).toBe(4);
  });
});

describe("INCIDENT_TYPE_LABELS", () => {
  it("has labels for all types", () => {
    expect(INCIDENT_TYPE_LABELS.injury).toBe("Injury");
    expect(INCIDENT_TYPE_LABELS.conduct).toBe("Conduct");
    expect(INCIDENT_TYPE_LABELS.facility).toBe("Facility");
    expect(INCIDENT_TYPE_LABELS.other).toBe("Other");
  });
});

describe("INCIDENT_SEVERITY_LABELS", () => {
  it("has labels for all severities", () => {
    expect(INCIDENT_SEVERITY_LABELS.minor).toBe("Minor");
    expect(INCIDENT_SEVERITY_LABELS.moderate).toBe("Moderate");
    expect(INCIDENT_SEVERITY_LABELS.serious).toBe("Serious");
    expect(INCIDENT_SEVERITY_LABELS.critical).toBe("Critical");
  });
});

describe("generateIncidentCsv", () => {
  const sampleReport = {
    id: "r1",
    leagueId: "l1",
    eventId: "e1",
    teamId: "t1",
    type: "injury" as const,
    severity: "moderate" as const,
    title: "Ankle sprain",
    narrative: "Player twisted ankle during warmup.",
    involvedParties: [
      { name: "Alex Rivera", role: "Player" },
      { name: "Coach Kim", role: "Coach" },
    ],
    reportedById: "u1",
    reviewedById: null,
    reviewedAt: null,
    createdAt: new Date("2026-06-01T15:00:00Z"),
  };

  it("generates CSV with header", () => {
    const csv = generateIncidentCsv([sampleReport]);
    expect(csv).toContain(
      "Date,Type,Severity,Title,Narrative,Involved Parties",
    );
    expect(csv).toContain("Ankle sprain");
    expect(csv).toContain("2026-06-01");
  });

  it("includes involved parties", () => {
    const csv = generateIncidentCsv([sampleReport]);
    expect(csv).toContain("Alex Rivera (Player)");
    expect(csv).toContain("Coach Kim (Coach)");
  });

  it("sanitizes formula injection in titles", () => {
    const evil = { ...sampleReport, title: "=CMD(danger)" };
    const csv = generateIncidentCsv([evil]);
    expect(csv).toContain("'=CMD(danger)");
  });

  it("handles empty reports", () => {
    const csv = generateIncidentCsv([]);
    expect(csv).toBe("Date,Type,Severity,Title,Narrative,Involved Parties");
  });

  it("truncates long narratives in export", () => {
    const longNarrative = { ...sampleReport, narrative: "A".repeat(1000) };
    const csv = generateIncidentCsv([longNarrative]);
    const narrativeCol = csv.split("\n")[1].split(",")[4];
    expect(narrativeCol.length).toBeLessThanOrEqual(505); // 500 + quotes + possible prefix
  });
});
