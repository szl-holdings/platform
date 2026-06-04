import { describe, expect, it } from "vitest";
import { WitnessChain, verifyDualWitness } from "../src/dual-witness.js";

describe("WitnessChain", () => {
  it("chains entries with sha256 prevHash linkage", () => {
    const c = new WitnessChain("internal");
    const e1 = c.append({
      tick: 1,
      kind: "a",
      payload: {},
      externallyObservable: false,
    });
    const e2 = c.append({
      tick: 2,
      kind: "b",
      payload: { x: 1 },
      externallyObservable: true,
    });
    expect(e1.prevHash).toBe("0".repeat(64));
    expect(e2.prevHash).toBe(e1.hash);
    expect(c.length).toBe(2);
    expect(c.head).toBe(e2.hash);
  });

  it("verify() returns true on a clean chain", () => {
    const c = new WitnessChain("external");
    c.append({ tick: 1, kind: "a", payload: {}, externallyObservable: false });
    c.append({ tick: 2, kind: "b", payload: {}, externallyObservable: false });
    c.append({ tick: 3, kind: "c", payload: {}, externallyObservable: false });
    expect(c.verify()).toBe(true);
  });

  it("produces deterministic hashes for identical sequences", () => {
    const c1 = new WitnessChain("internal");
    const c2 = new WitnessChain("internal");
    for (const i of [1, 2, 3]) {
      c1.append({
        tick: i,
        kind: "k",
        payload: { i },
        externallyObservable: false,
      });
      c2.append({
        tick: i,
        kind: "k",
        payload: { i },
        externallyObservable: false,
      });
    }
    expect(c1.head).toBe(c2.head);
  });

  it("produces different hashes for different payloads", () => {
    const c1 = new WitnessChain("internal");
    const c2 = new WitnessChain("internal");
    c1.append({
      tick: 1,
      kind: "k",
      payload: { i: 1 },
      externallyObservable: false,
    });
    c2.append({
      tick: 1,
      kind: "k",
      payload: { i: 2 },
      externallyObservable: false,
    });
    expect(c1.head).not.toBe(c2.head);
  });
});

describe("verifyDualWitness", () => {
  it("passes when every external-observable internal claim has an external match", () => {
    const internal = new WitnessChain("internal");
    const external = new WitnessChain("external");
    internal.append({
      tick: 10,
      kind: "tool_call",
      payload: { name: "search" },
      externallyObservable: true,
    });
    external.append({
      tick: 11,
      kind: "tool_call",
      payload: { name: "search", duration_ms: 42 },
      externallyObservable: true,
    });
    const r = verifyDualWitness({ internal, external });
    expect(r.consistent).toBe(true);
    expect(r.orphanedClaims).toEqual([]);
  });

  it("flags an orphaned internal claim", () => {
    const internal = new WitnessChain("internal");
    const external = new WitnessChain("external");
    internal.append({
      tick: 10,
      kind: "tool_call",
      payload: { name: "search" },
      externallyObservable: true,
    });
    // No external entry — complementarity violation.
    const r = verifyDualWitness({ internal, external });
    expect(r.consistent).toBe(false);
    expect(r.orphanedClaims.length).toBe(1);
    expect(r.orphanedClaims[0]!.kind).toBe("tool_call");
  });

  it("ignores internal claims that are not externally observable", () => {
    const internal = new WitnessChain("internal");
    const external = new WitnessChain("external");
    internal.append({
      tick: 1,
      kind: "reasoning",
      payload: { thought: "considering options" },
      externallyObservable: false,
    });
    const r = verifyDualWitness({ internal, external });
    expect(r.consistent).toBe(true);
  });

  it("respects windowTicks: external too far away counts as orphan", () => {
    const internal = new WitnessChain("internal");
    const external = new WitnessChain("external");
    internal.append({
      tick: 1,
      kind: "tool_call",
      payload: { name: "x" },
      externallyObservable: true,
    });
    external.append({
      tick: 1000,
      kind: "tool_call",
      payload: { name: "x" },
      externallyObservable: true,
    });
    const r = verifyDualWitness({ internal, external, windowTicks: 50 });
    expect(r.consistent).toBe(false);
  });

  it("throws when an input chain's integrity is broken", () => {
    const internal = new WitnessChain("internal");
    const external = new WitnessChain("external");
    internal.append({
      tick: 1,
      kind: "a",
      payload: {},
      externallyObservable: false,
    });
    // Pass a freshly-constructed object that mimics WitnessChain but with
    // a verify() that returns false.
    const fakeInternal = {
      toArray: () => internal.toArray(),
      verify: () => false,
    } as unknown as WitnessChain;
    expect(() =>
      verifyDualWitness({ internal: fakeInternal, external }),
    ).toThrow(/chain integrity broken/);
  });
});
