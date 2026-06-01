import { describe, it, expect } from "vitest";
import {
  arbitrateThinking,
  defaultThinkingPolicy,
} from "../src/thinking-mode-arbiter.js";

describe("primitive 65 — thinking-mode arbiter", () => {
  it("forces think when no ground truth", () => {
    const d = arbitrateThinking({
      id: "c1",
      estimatedCostTokens: 100,
      difficulty: 0.1,
      hasGroundTruth: false,
    });
    expect(d.mode).toBe("think");
    expect(d.rationale).toMatch(/no ground truth/);
  });

  it("forces think when difficulty over threshold", () => {
    const d = arbitrateThinking({
      id: "c2",
      estimatedCostTokens: 100,
      difficulty: 0.9,
      hasGroundTruth: true,
    });
    expect(d.mode).toBe("think");
    expect(d.rationale).toMatch(/difficulty/);
  });

  it("forces think when token cost exceeds maxNoThinkCost", () => {
    const d = arbitrateThinking({
      id: "c3",
      estimatedCostTokens: 5000,
      difficulty: 0.1,
      hasGroundTruth: true,
    });
    expect(d.mode).toBe("think");
    expect(d.rationale).toMatch(/cost/);
  });

  it("returns no-think when below all triggers", () => {
    const d = arbitrateThinking({
      id: "c4",
      estimatedCostTokens: 100,
      difficulty: 0.1,
      hasGroundTruth: true,
    });
    expect(d.mode).toBe("no-think");
  });

  it("respects custom policy", () => {
    const d = arbitrateThinking(
      {
        id: "c5",
        estimatedCostTokens: 100,
        difficulty: 0.4,
        hasGroundTruth: true,
      },
      { ...defaultThinkingPolicy, difficultyThreshold: 0.3 }
    );
    expect(d.mode).toBe("think");
  });
});
