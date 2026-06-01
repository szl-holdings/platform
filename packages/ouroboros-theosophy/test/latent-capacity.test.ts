import { describe, it, expect } from "vitest";
import { LatentCapacityLedger } from "../src/latent-capacity.js";

describe("Primitive 51 — Latent-capacity ledger", () => {
  it("declares with full triple (witness/criterion/falsifier)", () => {
    const l = new LatentCapacityLedger();
    const e = l.declare(
      {
        capacityId: "c1",
        description: "memory recall",
        witness: "Dr X",
        activationCriterion: "passes 90% recall test",
        falsifier: "fails recall under double-blind",
      },
      "2026-05-01",
    );
    expect(e.activated).toBe(false);
    expect(e.falsified).toBe(false);
  });

  it("rejects missing falsifier", () => {
    const l = new LatentCapacityLedger();
    expect(() =>
      l.declare(
        {
          capacityId: "c1",
          description: "x",
          witness: "w",
          activationCriterion: "y",
          falsifier: "",
        },
        "t",
      ),
    ).toThrow();
  });

  it("activate succeeds before falsify", () => {
    const l = new LatentCapacityLedger();
    l.declare(
      {
        capacityId: "c1",
        description: "x",
        witness: "w",
        activationCriterion: "y",
        falsifier: "z",
      },
      "t",
    );
    expect(l.activate("c1")).toBe(true);
  });

  it("falsify locks out activate", () => {
    const l = new LatentCapacityLedger();
    l.declare(
      {
        capacityId: "c1",
        description: "x",
        witness: "w",
        activationCriterion: "y",
        falsifier: "z",
      },
      "t",
    );
    l.falsify("c1");
    expect(l.activate("c1")).toBe(false);
  });

  it("falsify clears prior activation", () => {
    const l = new LatentCapacityLedger();
    l.declare(
      {
        capacityId: "c1",
        description: "x",
        witness: "w",
        activationCriterion: "y",
        falsifier: "z",
      },
      "t",
    );
    l.activate("c1");
    l.falsify("c1");
    expect(l.list()[0].activated).toBe(false);
  });

  it("activate unknown returns false", () => {
    const l = new LatentCapacityLedger();
    expect(l.activate("missing")).toBe(false);
  });
});
