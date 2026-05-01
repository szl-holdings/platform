import { describe, expect, it } from "vitest";
import {
  computeNoHair,
  noHairEquivalent,
  parseNoHair,
  serializeNoHair,
} from "../src/no-hair.js";
import { WitnessChain } from "../src/dual-witness.js";

describe("computeNoHair", () => {
  it("computes mass = sum of nonneg work, charge = sum of obligations", () => {
    const chain = new WitnessChain("internal");
    chain.append({
      tick: 1,
      kind: "step",
      payload: { ok: true },
      externallyObservable: false,
    });
    const s = computeNoHair({
      work: [1, 2, -1, 4], // negatives clamped to 0
      obligations: [-2, 1, -1],
      inputDistribution: new Map([["a", 5], ["b", 5]]),
      tier: 2,
      witnessChain: chain.toArray(),
    });
    expect(s.mass).toBeCloseTo(7, 10);
    expect(s.charge).toBeCloseTo(-2, 10);
    expect(s.spin).toBeCloseTo(1, 10);
    expect(s.tier).toBe(2);
    expect(s.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a stable 64-char sha256 hash", () => {
    const chain = new WitnessChain("internal");
    const s = computeNoHair({
      work: [],
      obligations: [],
      inputDistribution: new Map(),
      tier: 4,
      witnessChain: chain.toArray(),
    });
    expect(s.hash.length).toBe(64);
  });

  it("throws if witness chain integrity is broken", () => {
    // Build a real chain, then corrupt one entry's prevHash.
    const c = new WitnessChain("internal");
    c.append({
      tick: 1,
      kind: "a",
      payload: {},
      externallyObservable: false,
    });
    c.append({
      tick: 2,
      kind: "b",
      payload: {},
      externallyObservable: false,
    });
    const arr = c.toArray();
    const corrupted = [
      arr[0]!,
      { ...arr[1]!, prevHash: "x".repeat(64) },
    ];
    expect(() =>
      computeNoHair({
        work: [],
        obligations: [],
        inputDistribution: new Map(),
        tier: 3,
        witnessChain: corrupted,
      }),
    ).toThrow(/chain broken/);
  });
});

describe("serializeNoHair / parseNoHair", () => {
  it("round-trips a state exactly", () => {
    const chain = new WitnessChain("internal");
    chain.append({
      tick: 1,
      kind: "step",
      payload: { v: 1 },
      externallyObservable: false,
    });
    const original = computeNoHair({
      work: [1.5, 2.25],
      obligations: [-0.5],
      inputDistribution: new Map([["a", 1], ["b", 1]]),
      tier: 1,
      witnessChain: chain.toArray(),
    });
    const wire = serializeNoHair(original);
    expect(wire.startsWith("nohair/v1|")).toBe(true);
    const parsed = parseNoHair(wire);
    expect(noHairEquivalent(original, parsed)).toBe(true);
  });

  it("rejects malformed serialization", () => {
    expect(() => parseNoHair("garbage")).toThrow(/malformed/);
    expect(() => parseNoHair("nohair/v2|mass=0|charge=0|spin=0|tier=1|hash=" + "a".repeat(64)),
    ).toThrow(/malformed/);
  });

  it("rejects invalid tier", () => {
    const wire = `nohair/v1|mass=0|charge=0|spin=0|tier=9|hash=${"a".repeat(64)}`;
    expect(() => parseNoHair(wire)).toThrow(/invalid/);
  });

  it("rejects wrong-length hash", () => {
    const wire = "nohair/v1|mass=0|charge=0|spin=0|tier=1|hash=deadbeef";
    expect(() => parseNoHair(wire)).toThrow(/invalid/);
  });
});

describe("noHairEquivalent", () => {
  it("returns false on different hashes even with same scalars", () => {
    const a = {
      mass: 1,
      charge: 0,
      spin: 0,
      tier: 1 as const,
      hash: "a".repeat(64),
    };
    const b = { ...a, hash: "b".repeat(64) };
    expect(noHairEquivalent(a, b)).toBe(false);
  });

  it("returns true on identical states", () => {
    const a = {
      mass: 1,
      charge: 0,
      spin: 0,
      tier: 1 as const,
      hash: "a".repeat(64),
    };
    expect(noHairEquivalent(a, { ...a })).toBe(true);
  });
});
