import { describe, it, expect } from "vitest";
import { arbitrate } from "../src/backend-arbiter.js";

describe("primitive 62 — backend arbiter", () => {
  const offers = [
    { backend: "flashattn3", op: "attention", target: "SM90", cost: 10, admits: true },
    { backend: "cudnn", op: "attention", target: "SM90", cost: 12, admits: true },
    { backend: "cutlass", op: "attention", target: "SM90", cost: 10, admits: true },
    { backend: "trtllm", op: "attention", target: "SM75", cost: 15, admits: false },
  ];

  it("min-cost picks the cheapest admissible backend", () => {
    const r = arbitrate(offers, "attention", "SM90", "min-cost");
    expect(r.chosen?.backend).toBe("cutlass"); // tiebreak alphabetical
    expect(r.chosen?.cost).toBe(10);
    expect(r.considered.length).toBe(3);
  });

  it("first-admit picks the first eligible offer in input order", () => {
    const r = arbitrate(offers, "attention", "SM90", "first-admit");
    expect(r.chosen?.backend).toBe("flashattn3");
  });

  it("returns null when no backend admits", () => {
    const r = arbitrate(offers, "attention", "SM75", "min-cost");
    expect(r.chosen).toBeNull();
    expect(r.rationale).toMatch(/no admissible backend/);
  });

  it("returns null when op/target absent", () => {
    const r = arbitrate(offers, "moe", "SM90", "min-cost");
    expect(r.chosen).toBeNull();
  });

  it("rationale describes choice", () => {
    const r = arbitrate(offers, "attention", "SM90", "min-cost");
    expect(r.rationale).toMatch(/cutlass/);
    expect(r.rationale).toMatch(/cost=10/);
  });

  it("deterministic-tiebreak is reproducible across calls", () => {
    const a = arbitrate(offers, "attention", "SM90", "deterministic-tiebreak");
    const b = arbitrate(offers, "attention", "SM90", "deterministic-tiebreak");
    expect(a.chosen?.backend).toBe(b.chosen?.backend);
  });
});
