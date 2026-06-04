import { describe, it, expect } from "vitest";
import { pncBedrockAxiomGuard } from "../src/pnc-bedrock-axiom-guard.js";

describe("pnc-bedrock-axiom-guard (91)", () => {
  it("clean attempt passes", () => {
    const r = pncBedrockAxiomGuard({
      attemptId: "p1",
      triesToProvePnc: false,
      contradictoryPairs: [],
      treatsPncAsRevisable: false,
    });
    expect(r.ok).toBe(true);
  });

  it("attempt to prove PNC blocked as circular", () => {
    const r = pncBedrockAxiomGuard({
      attemptId: "p1",
      triesToProvePnc: true,
      contradictoryPairs: [],
      treatsPncAsRevisable: false,
    });
    expect(r.ok).toBe(false);
    expect(r.block).toBe("circular");
  });

  it("contradictory inference blocked", () => {
    const r = pncBedrockAxiomGuard({
      attemptId: "p1",
      triesToProvePnc: false,
      contradictoryPairs: [{ a: "Socrates is mortal", notA: "Socrates is not mortal" }],
      treatsPncAsRevisable: false,
    });
    expect(r.ok).toBe(false);
    expect(r.block).toBe("contradiction");
  });

  it("treating PNC as revisable blocked", () => {
    const r = pncBedrockAxiomGuard({
      attemptId: "p1",
      triesToProvePnc: false,
      contradictoryPairs: [],
      treatsPncAsRevisable: true,
    });
    expect(r.ok).toBe(false);
    expect(r.block).toBe("revisable");
  });

  it("circular block precedes contradiction block", () => {
    const r = pncBedrockAxiomGuard({
      attemptId: "p1",
      triesToProvePnc: true,
      contradictoryPairs: [{ a: "x", notA: "not-x" }],
      treatsPncAsRevisable: false,
    });
    expect(r.block).toBe("circular");
  });

  it("multiple contradictory pairs — first reported", () => {
    const r = pncBedrockAxiomGuard({
      attemptId: "p1",
      triesToProvePnc: false,
      contradictoryPairs: [
        { a: "A", notA: "not-A" },
        { a: "B", notA: "not-B" },
      ],
      treatsPncAsRevisable: false,
    });
    expect(r.reason).toMatch(/A/);
  });

  it("Metaphysics Γ.4 reference in circular reason", () => {
    const r = pncBedrockAxiomGuard({
      attemptId: "p1",
      triesToProvePnc: true,
      contradictoryPairs: [],
      treatsPncAsRevisable: false,
    });
    expect(r.reason).toMatch(/Metaphysics|presup/);
  });

  it("dialetheist proposal blocked as revisable", () => {
    const r = pncBedrockAxiomGuard({
      attemptId: "dialetheist",
      triesToProvePnc: false,
      contradictoryPairs: [],
      treatsPncAsRevisable: true,
    });
    expect(r.ok).toBe(false);
  });
});
