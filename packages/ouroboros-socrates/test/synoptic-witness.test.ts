import { describe, it, expect } from "vitest";
import { bindSynopticWitness } from "../src/synoptic-witness.js";

describe("Primitive 32 — Synoptic Witness", () => {
  it("complete=true when all pair-wise kinships declared", () => {
    const r = bindSynopticWitness({
      witnessId: "W",
      primitives: [
        { id: "a", version: "1", digest: "x" },
        { id: "b", version: "1", digest: "y" },
        { id: "c", version: "1", digest: "z" },
      ],
      kinships: [
        { pair: ["a", "b"], consonant: true, note: "" },
        { pair: ["a", "c"], consonant: true, note: "" },
        { pair: ["b", "c"], consonant: true, note: "" },
      ],
    });
    expect(r.complete).toBe(true);
    expect(r.consonantCount).toBe(3);
    expect(r.dissonantCount).toBe(0);
  });

  it("complete=false when a pair missing", () => {
    const r = bindSynopticWitness({
      witnessId: "W",
      primitives: [
        { id: "a", version: "1", digest: "x" },
        { id: "b", version: "1", digest: "y" },
        { id: "c", version: "1", digest: "z" },
      ],
      kinships: [{ pair: ["a", "b"], consonant: true, note: "" }],
    });
    expect(r.complete).toBe(false);
  });

  it("synopticHash is deterministic over canonical input", () => {
    const a = bindSynopticWitness({
      witnessId: "W",
      primitives: [
        { id: "p2", version: "1", digest: "y" },
        { id: "p1", version: "1", digest: "x" },
      ],
      kinships: [{ pair: ["p2", "p1"], consonant: true, note: "" }],
    });
    const b = bindSynopticWitness({
      witnessId: "W",
      primitives: [
        { id: "p1", version: "1", digest: "x" },
        { id: "p2", version: "1", digest: "y" },
      ],
      kinships: [{ pair: ["p1", "p2"], consonant: true, note: "" }],
    });
    expect(a.synopticHash).toBe(b.synopticHash);
  });

  it("synopticHash changes when a digest changes", () => {
    const a = bindSynopticWitness({
      witnessId: "W",
      primitives: [{ id: "p", version: "1", digest: "x" }],
      kinships: [],
    });
    const b = bindSynopticWitness({
      witnessId: "W",
      primitives: [{ id: "p", version: "1", digest: "y" }],
      kinships: [],
    });
    expect(a.synopticHash).not.toBe(b.synopticHash);
  });

  it("counts dissonant kinships", () => {
    const r = bindSynopticWitness({
      witnessId: "W",
      primitives: [
        { id: "a", version: "1", digest: "x" },
        { id: "b", version: "1", digest: "y" },
      ],
      kinships: [{ pair: ["a", "b"], consonant: false, note: "broken" }],
    });
    expect(r.dissonantCount).toBe(1);
  });

  it("empty primitive list yields empty required pair set (vacuously complete)", () => {
    const r = bindSynopticWitness({
      witnessId: "W",
      primitives: [],
      kinships: [],
    });
    expect(r.complete).toBe(true);
    expect(r.primitiveCount).toBe(0);
  });
});
