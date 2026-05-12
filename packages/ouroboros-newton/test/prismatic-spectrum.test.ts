import { describe, it, expect } from "vitest";
import { decomposeSpectrum } from "../src/prismatic-spectrum.js";

describe("Primitive 43 — Prismatic spectrum", () => {
  it("DECOMPOSED on orthonormal basis covering composite", () => {
    const r = decomposeSpectrum({
      artifactId: "white",
      composite: [3, 4],
      basis: [
        { name: "red", amplitude: 0 },
        { name: "blue", amplitude: 0 },
      ],
      basisVectors: [
        [1, 0],
        [0, 1],
      ],
    });
    expect(r.verdict).toBe("DECOMPOSED");
    expect(r.channels.find((c) => c.name === "red")?.amplitude).toBeCloseTo(3);
    expect(r.channels.find((c) => c.name === "blue")?.amplitude).toBeCloseTo(4);
  });

  it("RECOMBINATION_FAIL when basis is incomplete", () => {
    const r = decomposeSpectrum({
      artifactId: "x",
      composite: [1, 2, 3],
      basis: [{ name: "only", amplitude: 0 }],
      basisVectors: [[1, 0, 0]],
    });
    expect(r.verdict).toBe("RECOMBINATION_FAIL");
    expect(r.recombinationError).toBeGreaterThan(0);
  });

  it("BASIS_DIM_MISMATCH when lengths differ", () => {
    const r = decomposeSpectrum({
      artifactId: "x",
      composite: [1, 2],
      basis: [{ name: "a", amplitude: 0 }],
      basisVectors: [[1]],
    });
    expect(r.verdict).toBe("BASIS_DIM_MISMATCH");
  });

  it("BASIS_INCOMPLETE on zero-norm vector", () => {
    const r = decomposeSpectrum({
      artifactId: "x",
      composite: [1, 2],
      basis: [{ name: "a", amplitude: 0 }],
      basisVectors: [[0, 0]],
    });
    expect(r.verdict).toBe("BASIS_INCOMPLETE");
  });

  it("BASIS_DIM_MISMATCH when basis count != basisVectors count", () => {
    const r = decomposeSpectrum({
      artifactId: "x",
      composite: [1, 2],
      basis: [
        { name: "a", amplitude: 0 },
        { name: "b", amplitude: 0 },
      ],
      basisVectors: [[1, 0]],
    });
    expect(r.verdict).toBe("BASIS_DIM_MISMATCH");
  });

  it("DECOMPOSED on 3-channel orthogonal RGB-like basis", () => {
    const r = decomposeSpectrum({
      artifactId: "white3",
      composite: [1, 1, 1],
      basis: [
        { name: "r", amplitude: 0 },
        { name: "g", amplitude: 0 },
        { name: "b", amplitude: 0 },
      ],
      basisVectors: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    });
    expect(r.verdict).toBe("DECOMPOSED");
    for (const ch of r.channels) {
      expect(ch.amplitude).toBeCloseTo(1);
    }
  });
});
