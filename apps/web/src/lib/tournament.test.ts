import {
  calculateByes,
  calculateRounds,
  determineWinner,
  generateRoundRobinMatches,
  generateSingleEliminationBracket,
} from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("calculateRounds", () => {
  it("returns 0 for fewer than 2 teams", () => {
    expect(calculateRounds(0)).toBe(0);
    expect(calculateRounds(1)).toBe(0);
  });

  it("returns 1 for 2 teams", () => {
    expect(calculateRounds(2)).toBe(1);
  });

  it("returns correct rounds for powers of 2", () => {
    expect(calculateRounds(4)).toBe(2);
    expect(calculateRounds(8)).toBe(3);
    expect(calculateRounds(16)).toBe(4);
  });

  it("rounds up for non-power-of-2 counts", () => {
    expect(calculateRounds(3)).toBe(2);
    expect(calculateRounds(5)).toBe(3);
    expect(calculateRounds(6)).toBe(3);
    expect(calculateRounds(7)).toBe(3);
  });
});

describe("calculateByes", () => {
  it("returns 0 for powers of 2", () => {
    expect(calculateByes(2)).toBe(0);
    expect(calculateByes(4)).toBe(0);
    expect(calculateByes(8)).toBe(0);
  });

  it("returns correct byes for non-powers", () => {
    expect(calculateByes(3)).toBe(1);
    expect(calculateByes(5)).toBe(3);
    expect(calculateByes(6)).toBe(2);
    expect(calculateByes(7)).toBe(1);
  });
});

describe("generateSingleEliminationBracket", () => {
  it("generates correct matches for 4 teams", () => {
    const matches = generateSingleEliminationBracket(["A", "B", "C", "D"]);
    // 2 rounds: 2 first-round matches + 1 final
    expect(matches.length).toBe(3);
    expect(matches[0].homeTeamId).toBe("A");
    expect(matches[0].awayTeamId).toBe("B");
    expect(matches[1].homeTeamId).toBe("C");
    expect(matches[1].awayTeamId).toBe("D");
    // Final has no teams yet
    expect(matches[2].homeTeamId).toBeNull();
    expect(matches[2].awayTeamId).toBeNull();
  });

  it("generates correct matches for 2 teams", () => {
    const matches = generateSingleEliminationBracket(["A", "B"]);
    expect(matches.length).toBe(1);
    expect(matches[0].homeTeamId).toBe("A");
    expect(matches[0].awayTeamId).toBe("B");
  });

  it("generates byes for 3 teams", () => {
    const matches = generateSingleEliminationBracket(["A", "B", "C"]);
    // 4-team bracket with one bye: 2 first-round + 1 final = 3
    expect(matches.length).toBe(3);
    expect(matches[0].homeTeamId).toBe("A");
    expect(matches[0].awayTeamId).toBe("B");
    expect(matches[1].homeTeamId).toBe("C");
    expect(matches[1].awayTeamId).toBeNull(); // bye
  });

  it("links matches to next round", () => {
    const matches = generateSingleEliminationBracket(["A", "B", "C", "D"]);
    // First two matches should point to the final (index 2)
    expect(matches[0].nextMatchIndex).toBe(2);
    expect(matches[1].nextMatchIndex).toBe(2);
    // Final has no next
    expect(matches[2].nextMatchIndex).toBeNull();
  });

  it("handles 8 teams", () => {
    const teams = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const matches = generateSingleEliminationBracket(teams);
    // 4 + 2 + 1 = 7 matches
    expect(matches.length).toBe(7);
  });
});

describe("generateRoundRobinMatches", () => {
  it("generates correct number of matches", () => {
    // n*(n-1)/2 matches for n teams
    expect(generateRoundRobinMatches(["A", "B", "C"]).length).toBe(3);
    expect(generateRoundRobinMatches(["A", "B", "C", "D"]).length).toBe(6);
  });

  it("every team plays every other team exactly once", () => {
    const matches = generateRoundRobinMatches(["A", "B", "C", "D"]);
    const pairings = new Set(
      matches.map((m) => [m.homeTeamId, m.awayTeamId].sort().join("-")),
    );
    expect(pairings.size).toBe(6);
  });

  it("handles 2 teams", () => {
    const matches = generateRoundRobinMatches(["A", "B"]);
    expect(matches.length).toBe(1);
    expect(matches[0].homeTeamId).toBe("A");
    expect(matches[0].awayTeamId).toBe("B");
  });
});

describe("determineWinner", () => {
  it("returns home team for higher home score", () => {
    expect(determineWinner("3", "1", "home", "away")).toBe("home");
  });

  it("returns away team for higher away score", () => {
    expect(determineWinner("1", "3", "home", "away")).toBe("away");
  });

  it("returns null for tie", () => {
    expect(determineWinner("2", "2", "home", "away")).toBeNull();
  });

  it("returns null for invalid scores", () => {
    expect(determineWinner("abc", "1", "home", "away")).toBeNull();
  });
});
