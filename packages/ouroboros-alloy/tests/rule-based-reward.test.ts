import { describe, it, expect } from "vitest";
import { score, difficultyWeighted } from "../src/rule-based-reward.js";

describe("primitive 72 — rule-based reward", () => {
  it("scores against firing rules", () => {
    const r = score("hello world", [
      {
        id: "len",
        weight: 1,
        fires: (s) => s.length > 5,
        rationale: "long enough",
      },
      {
        id: "uppercase",
        weight: 2,
        fires: (s) => s === s.toUpperCase(),
        rationale: "all caps",
      },
    ]);
    expect(r.totalReward).toBe(1);
    expect(r.fired.length).toBe(1);
    expect(r.silent.length).toBe(1);
  });

  it("rejects empty rule list", () => {
    expect(() => score("x", [])).toThrow(/at least 1 rule/);
  });

  it("rejects non-positive weight", () => {
    expect(() =>
      score("x", [
        { id: "r", weight: 0, fires: () => true, rationale: "" },
      ])
    ).toThrow(/non-positive weight/);
  });

  it("difficultyWeighted accumulates difficulty for passes", () => {
    const r = difficultyWeighted("answer", [
      { caseId: "easy", difficulty: 0.1, check: () => true },
      { caseId: "med", difficulty: 0.5, check: () => true },
      { caseId: "hard", difficulty: 0.9, check: () => false },
    ]);
    expect(r.totalReward).toBeCloseTo(0.6);
    expect(r.passed.length).toBe(2);
    expect(r.failed.length).toBe(1);
  });

  it("difficultyWeighted refuses out-of-range difficulty", () => {
    expect(() =>
      difficultyWeighted("x", [
        { caseId: "c", difficulty: 1.5, check: () => true },
      ])
    ).toThrow(/difficulty must be in/);
  });

  it("difficultyWeighted refuses empty case list", () => {
    expect(() => difficultyWeighted("x", [])).toThrow(/at least 1/);
  });
});
