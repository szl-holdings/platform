import { describe, it, expect } from "vitest";
import { separate, definitionIsHonest } from "../src/axiom-posit-separator.js";

describe("axiom/posit separator", () => {
  const sample = [
    { id: "a1", text: "equals from equals are equal", kind: "axiom" as const },
    { id: "d1", text: "a unit is that by which each thing is called one", kind: "definition" as const },
    { id: "h1", text: "let there be a unit", kind: "hypothesis" as const },
    { id: "u1", text: "???", kind: "unknown" as const },
  ];

  it("buckets axioms", () => {
    expect(separate(sample).axioms).toHaveLength(1);
  });

  it("buckets definitions", () => {
    expect(separate(sample).definitions).toHaveLength(1);
  });

  it("buckets hypotheses", () => {
    expect(separate(sample).hypotheses).toHaveLength(1);
  });

  it("buckets unknowns", () => {
    expect(separate(sample).unknowns).toHaveLength(1);
  });

  it("ok=false when unknowns present", () => {
    expect(separate(sample).ok).toBe(false);
  });

  it("ok=true when fully classified", () => {
    expect(separate(sample.slice(0, 3)).ok).toBe(true);
  });

  it("definitionIsHonest: rejects sneaky existence claim", () => {
    expect(definitionIsHonest({ id: "d", text: "a point is that which exists indivisibly", kind: "definition" })).toBe(false);
  });

  it("definitionIsHonest: accepts pure 'what it is'", () => {
    expect(definitionIsHonest({ id: "d", text: "a point is that which has no part", kind: "definition" })).toBe(true);
  });

  it("definitionIsHonest: rejects non-definition", () => {
    expect(definitionIsHonest({ id: "a", text: "harmless", kind: "axiom" })).toBe(false);
  });

  it("empty input is fully classified", () => {
    expect(separate([]).ok).toBe(true);
  });
});
