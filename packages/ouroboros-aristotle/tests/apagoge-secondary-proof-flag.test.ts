import { describe, it, expect } from "vitest";
import { apagogeSecondaryFlag } from "../src/apagoge-secondary-proof-flag.js";

describe("apagoge-secondary-proof-flag (90)", () => {
  it("direct proof gets dioti-grade tag", () => {
    const r = apagogeSecondaryFlag({
      proofId: "p1",
      method: "direct",
      conclusion: "C",
      directProofAvailable: true,
      requiresDiotiExplanation: true,
    });
    expect(r.tags).toContain("dioti-grade");
  });

  it("reductio without direct alternative — valid-indirect only", () => {
    const r = apagogeSecondaryFlag({
      proofId: "p1",
      method: "reductio",
      conclusion: "C",
      reductioStructure: { assumption: "¬C", derivedContradiction: "1=2" },
      directProofAvailable: false,
      requiresDiotiExplanation: false,
    });
    expect(r.ok).toBe(true);
    expect(r.tags).toContain("valid-indirect");
    expect(r.tags).not.toContain("prefer-direct");
  });

  it("reductio with direct alternative — prefer-direct advisory", () => {
    const r = apagogeSecondaryFlag({
      proofId: "p1",
      method: "reductio",
      conclusion: "C",
      reductioStructure: { assumption: "¬C", derivedContradiction: "1=2" },
      directProofAvailable: true,
      requiresDiotiExplanation: false,
    });
    expect(r.tags).toContain("prefer-direct");
  });

  it("reductio + dioti requirement stacks epistemic-downgrade", () => {
    const r = apagogeSecondaryFlag({
      proofId: "p1",
      method: "reductio",
      conclusion: "C",
      reductioStructure: { assumption: "¬C", derivedContradiction: "x" },
      directProofAvailable: true,
      requiresDiotiExplanation: true,
    });
    expect(r.tags).toContain("valid-indirect");
    expect(r.tags).toContain("prefer-direct");
    expect(r.tags).toContain("epistemic-downgrade");
  });

  it("reductio missing structure — fails", () => {
    const r = apagogeSecondaryFlag({
      proofId: "p1",
      method: "reductio",
      conclusion: "C",
      directProofAvailable: false,
      requiresDiotiExplanation: false,
    });
    expect(r.ok).toBe(false);
  });

  it("mixed method routes through reductio path", () => {
    const r = apagogeSecondaryFlag({
      proofId: "p1",
      method: "mixed",
      conclusion: "C",
      reductioStructure: { assumption: "x", derivedContradiction: "y" },
      directProofAvailable: false,
      requiresDiotiExplanation: false,
    });
    expect(r.ok).toBe(true);
    expect(r.tags).toContain("valid-indirect");
  });

  it("Aristotle's irrationality of root-2 by reductio — flagged", () => {
    const r = apagogeSecondaryFlag({
      proofId: "root-2-irrational",
      method: "reductio",
      conclusion: "sqrt(2) is irrational",
      reductioStructure: { assumption: "p/q = sqrt(2)", derivedContradiction: "even+odd" },
      directProofAvailable: false,
      requiresDiotiExplanation: true,
    });
    expect(r.tags).toContain("epistemic-downgrade");
  });

  it("direct proof with dioti requirement clears all flags", () => {
    const r = apagogeSecondaryFlag({
      proofId: "p1",
      method: "direct",
      conclusion: "C",
      directProofAvailable: true,
      requiresDiotiExplanation: true,
    });
    expect(r.tags).toEqual(["dioti-grade"]);
  });
});
