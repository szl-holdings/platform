import { describe, it, expect } from "vitest";
import { MoralLedger } from "../src/moral-ledger.js";

const e = (id: string, witness: string | null, causality = 0.7) => ({
  entryId: id,
  actorId: "actor",
  actionId: "action",
  foreseenHarms: ["x"],
  unforeseenHarms: [],
  counterfactual: "nothing happens",
  causality,
  authorityClaim: "self",
  accountabilityWitness: witness,
  timestamp: 1,
});

describe("Primitive 28 — Moral-responsibility ledger", () => {
  it("refuses anonymous entries", () => {
    const l = new MoralLedger();
    const r = l.record(e("1", null));
    expect(r.accepted).toBe(false);
    expect(l.summary().anonymousCount).toBe(1);
  });

  it("accepts entries with named witness", () => {
    const l = new MoralLedger();
    const r = l.record(e("1", "AEC chair"));
    expect(r.accepted).toBe(true);
    expect(l.summary().acceptedEntries.length).toBe(1);
  });

  it("computes mean causality across accepted entries", () => {
    const l = new MoralLedger();
    l.record(e("1", "w", 0.4));
    l.record(e("2", "w", 0.8));
    expect(l.summary().meanCausality).toBeCloseTo(0.6, 5);
  });

  it("M-axis = 1.0 on empty ledger (no claims, no debt)", () => {
    const l = new MoralLedger();
    expect(l.moralGroundingAxis()).toBe(1.0);
  });

  it("M-axis drops when anonymous entries pile up", () => {
    const l = new MoralLedger();
    l.record(e("1", "w", 0.9));
    const before = l.moralGroundingAxis();
    l.record(e("2", null));
    const after = l.moralGroundingAxis();
    expect(after).toBeLessThan(before);
  });

  it("rejects causality outside [0,1]", () => {
    const l = new MoralLedger();
    expect(() => l.record(e("1", "w", 2))).toThrow();
  });

  it("entryCount counts both accepted and refused", () => {
    const l = new MoralLedger();
    l.record(e("1", "w"));
    l.record(e("2", null));
    expect(l.summary().entryCount).toBe(2);
  });
});
