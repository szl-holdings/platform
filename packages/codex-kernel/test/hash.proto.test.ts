// Negative + regression tests for canonicalize(): a "__proto__" key from
// JSON.parse must be part of the canonical bytes (and therefore the hash).
import { describe, expect, it } from "vitest";
import { canonicalize } from "../src/hash.js";

describe("canonicalize __proto__ handling", () => {
  it("keeps a top-level __proto__ member (negative)", () => {
    const tampered = JSON.parse('{"amount":1,"__proto__":{"role":"admin"}}');
    expect(canonicalize(tampered)).not.toBe(canonicalize({ amount: 1 }));
    expect(canonicalize(tampered)).toBe('{"__proto__":{"role":"admin"},"amount":1}');
  });
  it("keeps nested and in-array __proto__ members (negative)", () => {
    const nested = JSON.parse('{"a":{"__proto__":{"x":1}},"b":[{"__proto__":2}]}');
    expect(canonicalize(nested)).toBe('{"a":{"__proto__":{"x":1}},"b":[{"__proto__":2}]}');
  });
  it("leaves ordinary canonical bytes unchanged (regression)", () => {
    expect(canonicalize({ b: [2, { d: 1, c: null }], a: "x" })).toBe('{"a":"x","b":[2,{"c":null,"d":1}]}');
  });
});
