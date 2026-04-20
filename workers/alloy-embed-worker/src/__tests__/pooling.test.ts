import { describe, it, expect } from "vitest";
import { applyPooling, l2Normalize } from "../pooling.js";

const V1 = [1, 0, 0, 0];
const V2 = [0, 2, 0, 0];
const V3 = [0, 0, 3, 0];

describe("applyPooling", () => {
  it("cls: returns first token vector", () => {
    expect(applyPooling([V1, V2, V3], "cls")).toEqual(V1);
  });

  it("last_token: returns last token vector", () => {
    expect(applyPooling([V1, V2, V3], "last_token")).toEqual(V3);
  });

  it("mean: averages across token vectors", () => {
    const out = applyPooling([V1, V2], "mean");
    expect(out).toEqual([0.5, 1, 0, 0]);
  });

  it("single token mean equals that token", () => {
    expect(applyPooling([[5, 6, 7]], "mean")).toEqual([5, 6, 7]);
  });

  it("throws on empty token list", () => {
    expect(() => applyPooling([], "mean")).toThrow();
  });
});

describe("l2Normalize", () => {
  it("produces a unit-length vector", () => {
    const out = l2Normalize([3, 4]);
    const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it("handles zero vector without NaN", () => {
    const out = l2Normalize([0, 0, 0]);
    expect(out).toEqual([0, 0, 0]);
  });
});
