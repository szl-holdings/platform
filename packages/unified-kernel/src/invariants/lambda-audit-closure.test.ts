/** Λ_audit_closure — the central Λ Audit-Closure Operator over a receipt-bus. */
import { describe, it, expect } from "vitest";
import {
  Λ_audit_closure,
  DOCTRINE_V7_AXIOMS,
  type Receipt,
} from "./lambda-audit-closure.ts";

const AX = DOCTRINE_V7_AXIOMS;

function receipt(id: string, value: number, opts: Partial<Receipt> = {}): Receipt {
  return {
    id,
    bits: opts.bits ?? 4096,
    axisValues: AX.map(() => value),
    crossesUnder: opts.crossesUnder,
  };
}

describe("Λ_audit_closure operator", () => {
  it("folds a receipt-bus into a graded closure with all four named bounds", () => {
    const bus: Receipt[] = [receipt("r1", 0.9), receipt("r2", 0.8), receipt("r3", 0.95)];
    const closure = Λ_audit_closure(bus, AX);

    // composite Λ is the geometric mean of the per-axiom contributions, bounded.
    expect(closure.compositeLambda).toBeGreaterThan(0);
    expect(closure.compositeLambda).toBeLessThanOrEqual(1);
    // Doctrine v7: 15 axioms, 14 unique.
    expect(closure.axiomCount).toBe(15);
    expect(closure.uniqueAxiomCount).toBe(14);
    expect(closure.perAxiom).toHaveLength(15);
    // PAC-Bayes tail is a finite non-negative penalty.
    expect(closure.pacBayesTailBound).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(closure.pacBayesTailBound)).toBe(true);
    // Bekenstein cap is enormous; small receipts respect it.
    expect(closure.bekensteinRespected).toBe(true);
    // No crossings declared ⇒ single-strand identity ⇒ R1.
    expect(closure.reidemeisterClass).toBe("R1");
    expect(closure.receiptCount).toBe(3);
  });

  it("classifies a 3-strand receipt-knot chain as R3", () => {
    const bus: Receipt[] = [
      receipt("rA", 0.9, { crossesUnder: "rB" }),
      receipt("rB", 0.9, { crossesUnder: "rC" }),
      receipt("rA", 0.9, { crossesUnder: "rC" }),
    ];
    const closure = Λ_audit_closure(bus, AX);
    expect(closure.reidemeisterClass).toBe("R3");
  });

  it("flags a receipt that exceeds the Bekenstein per-receipt entropy cap", () => {
    const huge = receipt("rBig", 0.9, { bits: 1e44 }); // > ~2.87e26-bit cap (1 J / 1 m)
    const closure = Λ_audit_closure([huge, receipt("rOk", 0.9)], AX);
    expect(closure.bekensteinRespected).toBe(false);
  });

  it("rejects an empty receipt-bus", () => {
    expect(() => Λ_audit_closure([], AX)).toThrow(/empty receipt-bus/);
  });
});
