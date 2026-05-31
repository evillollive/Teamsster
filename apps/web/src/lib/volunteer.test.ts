import {
  calculateHours,
  generateVolunteerCsv,
  sanitizeCsvValue,
} from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("calculateHours", () => {
  it("returns manual hours when set", () => {
    const signup = {
      id: "1",
      opportunityId: "o1",
      userId: "u1",
      checkedInAt: new Date("2026-06-01T09:00:00Z"),
      checkedOutAt: new Date("2026-06-01T11:00:00Z"),
      manualHours: "3.5",
      createdAt: new Date(),
    };
    expect(calculateHours(signup)).toBe(3.5);
  });

  it("calculates from check-in/out when no manual hours", () => {
    const signup = {
      id: "2",
      opportunityId: "o1",
      userId: "u1",
      checkedInAt: new Date("2026-06-01T09:00:00Z"),
      checkedOutAt: new Date("2026-06-01T11:30:00Z"),
      manualHours: null,
      createdAt: new Date(),
    };
    expect(calculateHours(signup)).toBe(2.5);
  });

  it("returns 0 when no check-in/out and no manual hours", () => {
    const signup = {
      id: "3",
      opportunityId: "o1",
      userId: "u1",
      checkedInAt: null,
      checkedOutAt: null,
      manualHours: null,
      createdAt: new Date(),
    };
    expect(calculateHours(signup)).toBe(0);
  });

  it("returns 0 for invalid manual hours", () => {
    const signup = {
      id: "4",
      opportunityId: "o1",
      userId: "u1",
      checkedInAt: null,
      checkedOutAt: null,
      manualHours: "not-a-number",
      createdAt: new Date(),
    };
    expect(calculateHours(signup)).toBe(0);
  });

  it("returns 0 when check-out is before check-in", () => {
    const signup = {
      id: "5",
      opportunityId: "o1",
      userId: "u1",
      checkedInAt: new Date("2026-06-01T11:00:00Z"),
      checkedOutAt: new Date("2026-06-01T09:00:00Z"),
      manualHours: null,
      createdAt: new Date(),
    };
    expect(calculateHours(signup)).toBe(0);
  });

  it("handles fractional hours precisely", () => {
    const signup = {
      id: "6",
      opportunityId: "o1",
      userId: "u1",
      checkedInAt: new Date("2026-06-01T09:00:00Z"),
      checkedOutAt: new Date("2026-06-01T09:45:00Z"),
      manualHours: null,
      createdAt: new Date(),
    };
    expect(calculateHours(signup)).toBe(0.75);
  });
});

describe("sanitizeCsvValue", () => {
  it("passes safe values unchanged", () => {
    expect(sanitizeCsvValue("John Doe")).toBe("John Doe");
  });

  it("prefixes formula-starting characters with single quote", () => {
    expect(sanitizeCsvValue("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(sanitizeCsvValue("+cmd")).toBe("'+cmd");
    expect(sanitizeCsvValue("-1+1")).toBe("'-1+1");
    expect(sanitizeCsvValue("@import")).toBe("'@import");
  });

  it("strips newlines", () => {
    expect(sanitizeCsvValue("line1\nline2")).toBe("line1 line2");
    expect(sanitizeCsvValue("line1\r\nline2")).toBe("line1  line2");
  });

  it("trims whitespace", () => {
    expect(sanitizeCsvValue("  hello  ")).toBe("hello");
  });
});

describe("generateVolunteerCsv", () => {
  it("generates valid CSV with header", () => {
    const csv = generateVolunteerCsv([
      {
        volunteerName: "Alex Rivera",
        opportunityTitle: "Field Setup",
        date: "2026-06-01",
        hours: 2.5,
        status: "completed",
      },
    ]);
    expect(csv).toContain("Volunteer,Opportunity,Date,Hours,Status");
    expect(csv).toContain("Alex Rivera");
    expect(csv).toContain("2.50");
  });

  it("sanitizes formula injection in names", () => {
    const csv = generateVolunteerCsv([
      {
        volunteerName: "=HYPERLINK(evil)",
        opportunityTitle: "Normal",
        date: "2026-06-01",
        hours: 1,
        status: "completed",
      },
    ]);
    expect(csv).toContain("'=HYPERLINK(evil)");
  });

  it("handles empty rows", () => {
    const csv = generateVolunteerCsv([]);
    expect(csv).toBe("Volunteer,Opportunity,Date,Hours,Status");
  });

  it("handles multiple rows", () => {
    const csv = generateVolunteerCsv([
      {
        volunteerName: "A",
        opportunityTitle: "O1",
        date: "2026-06-01",
        hours: 1,
        status: "completed",
      },
      {
        volunteerName: "B",
        opportunityTitle: "O2",
        date: "2026-06-02",
        hours: 2,
        status: "pending",
      },
    ]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(3);
  });
});
