import { describe, it, expect } from "vitest";
import { runPhilosophyGate } from "../src/unified-philosophy.ts";

const baseInput = {
  payload: "p",
  provenance: { author: "A", timestamp: "t", sourceUri: "u" },
  shadowAcknowledgements: [
    { id: "s1", description: "x", declaredAt: "t" },
  ],
  citations: [
    { corpusId: "vedas", reference: "x" },
    { corpusId: "platonic", reference: "y" },
    { corpusId: "newtonian", reference: "z" },
  ],
  channelBindings: [
    { asset: "key" as const, channelId: "k" },
    { asset: "carrier" as const, channelId: "c" },
  ],
  decodings: [
    { systemId: "s1", decoded: "X" },
    { systemId: "s2", decoded: "X" },
    { systemId: "s3", decoded: "X" },
  ],
};

describe("Unified philosophy gate", () => {
  it("PROCEED on a clean input", () => {
    const v = runPhilosophyGate(baseInput);
    expect(v.action).toBe("PROCEED");
    expect(v.failed).toEqual([]);
  });

  it("ABORT when key/carrier overlap (hard veto)", () => {
    const v = runPhilosophyGate({
      ...baseInput,
      channelBindings: [
        { asset: "key", channelId: "same" },
        { asset: "carrier", channelId: "same" },
      ],
    });
    expect(v.action).toBe("ABORT");
  });

  it("QUARANTINE on under-triangulated citations", () => {
    const v = runPhilosophyGate({
      ...baseInput,
      citations: [{ corpusId: "vedas", reference: "x" }],
    });
    expect(v.action).toBe("QUARANTINE");
    expect(v.failed).toContain("theosophy.triangulation");
  });

  it("QUARANTINE on no polygraphic quorum", () => {
    const v = runPhilosophyGate({
      ...baseInput,
      decodings: [
        { systemId: "s1", decoded: "A" },
        { systemId: "s2", decoded: "B" },
        { systemId: "s3", decoded: "C" },
      ],
    });
    expect(v.action).toBe("QUARANTINE");
  });

  it("PROCEED with valid phi claim", () => {
    const v = runPhilosophyGate({
      ...baseInput,
      goldenRatioClaim: 1.6180339887,
    });
    expect(v.action).toBe("PROCEED");
  });

  it("QUARANTINE with bad phi claim", () => {
    const v = runPhilosophyGate({
      ...baseInput,
      goldenRatioClaim: 3.0,
    });
    expect(v.action).toBe("QUARANTINE");
    expect(v.failed).toContain("davinci.divine-proportion");
  });

  it("QUARANTINE on Aristotle metabasis violation", () => {
    const v = runPhilosophyGate({
      ...baseInput,
      aristotleMetabasis: {
        targetGenus: "geometry",
        principles: [{ id: "foreign", homeGenus: "ethics" }],
      },
    });
    expect(v.action).toBe("QUARANTINE");
    expect(v.failed).toContain("aristotle.metabasis");
  });

  it("PROCEED on Aristotle subalternate borrow", () => {
    const v = runPhilosophyGate({
      ...baseInput,
      aristotleMetabasis: {
        targetGenus: "optics",
        principles: [{ id: "thm", homeGenus: "geometry" }],
        subalternateAncestors: ["geometry"],
      },
    });
    expect(v.action).toBe("PROCEED");
  });

  it("QUARANTINE on hoti-grade proof (causal order reversed)", () => {
    const v = runPhilosophyGate({
      ...baseInput,
      aristotleHotiDioti: {
        conclusionSubject: "planets",
        conclusionPredicate: "near",
        middleTerm: "do-not-twinkle",
        causalGraph: { near: ["do-not-twinkle"] },
      },
    });
    expect(v.action).toBe("QUARANTINE");
    expect(v.failed).toContain("aristotle.hoti-dioti");
  });

  it("ABORT on PNC violation (hard veto)", () => {
    const v = runPhilosophyGate({
      ...baseInput,
      aristotlePnc: {
        attemptId: "x",
        triesToProvePnc: false,
        contradictoryPairs: [{ a: "A", notA: "not-A" }],
        treatsPncAsRevisable: false,
      },
    });
    expect(v.action).toBe("ABORT");
    expect(v.failed).toContain("aristotle.pnc");
  });
});
