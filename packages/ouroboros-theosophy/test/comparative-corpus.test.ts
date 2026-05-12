import { describe, it, expect } from "vitest";
import { triangulate } from "../src/comparative-corpus.js";

describe("Primitive 50 — Comparative-corpus reading", () => {
  it("passes with three distinct corpora", () => {
    const r = triangulate([
      { corpusId: "vedas", reference: "Rg-Veda 1.1" },
      { corpusId: "platonic", reference: "Republic" },
      { corpusId: "newtonian", reference: "Principia" },
    ]);
    expect(r.passes).toBe(true);
    expect(r.distinctCorpora).toBe(3);
  });

  it("fails with only two distinct corpora", () => {
    const r = triangulate([
      { corpusId: "A", reference: "x" },
      { corpusId: "A", reference: "y" },
      { corpusId: "B", reference: "z" },
    ]);
    expect(r.passes).toBe(false);
    expect(r.distinctCorpora).toBe(2);
  });

  it("required threshold is configurable", () => {
    const r = triangulate(
      [
        { corpusId: "A", reference: "x" },
        { corpusId: "B", reference: "y" },
      ],
      2,
    );
    expect(r.passes).toBe(true);
  });

  it("rationale describes outcome", () => {
    const r = triangulate([{ corpusId: "A", reference: "x" }]);
    expect(r.rationale).toContain("under-triangulated");
  });

  it("empty citations fails", () => {
    const r = triangulate([]);
    expect(r.passes).toBe(false);
    expect(r.distinctCorpora).toBe(0);
  });
});
