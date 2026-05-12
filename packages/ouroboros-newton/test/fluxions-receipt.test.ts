import { describe, it, expect } from "vitest";
import { receiveFluxion } from "../src/fluxions-receipt.js";

describe("Primitive 42 — Fluxions receipt", () => {
  it("ACCEPTED with FORWARD witness on f(x)=x² at x=2 (asserted ≈ 4)", () => {
    const h = 1e-4;
    const r = receiveFluxion({
      claimId: "fwd",
      point: 2,
      asserted: 4,
      witness: { kind: "FORWARD", fx: 4, fxh: (2 + h) ** 2, h },
    });
    expect(r.verdict).toBe("ACCEPTED");
    expect(r.witnessKind).toBe("FORWARD");
  });

  it("ACCEPTED with CENTRAL witness on cos at 0 (asserted ≈ 0)", () => {
    const h = 1e-4;
    const r = receiveFluxion({
      claimId: "cen",
      point: 0,
      asserted: 0,
      witness: { kind: "CENTRAL", fxh: Math.cos(h), fxmh: Math.cos(-h), h },
    });
    expect(r.verdict).toBe("ACCEPTED");
  });

  it("ACCEPTED with SYMBOLIC witness", () => {
    const r = receiveFluxion({
      claimId: "sym",
      point: 3,
      asserted: 6,
      witness: { kind: "SYMBOLIC", closedForm: 6 },
    });
    expect(r.verdict).toBe("ACCEPTED");
    expect(r.residual).toBe(0);
  });

  it("REJECTED_TOL when asserted differs from witness", () => {
    const r = receiveFluxion({
      claimId: "bad",
      point: 1,
      asserted: 99,
      witness: { kind: "SYMBOLIC", closedForm: 1 },
      tolerance: 1e-6,
    });
    expect(r.verdict).toBe("REJECTED_TOL");
  });

  it("REJECTED_BARE when asserted is NaN", () => {
    const r = receiveFluxion({
      claimId: "bare",
      point: 0,
      asserted: NaN,
      witness: { kind: "SYMBOLIC", closedForm: 1 },
    });
    expect(r.verdict).toBe("REJECTED_BARE");
  });

  it("REJECTED_H when h is non-positive", () => {
    const r = receiveFluxion({
      claimId: "h0",
      point: 0,
      asserted: 0,
      witness: { kind: "FORWARD", fx: 0, fxh: 0, h: 0 },
    });
    expect(r.verdict).toBe("REJECTED_H");
  });

  it("CENTRAL is more accurate than FORWARD at same h on smooth f", () => {
    const f = (x: number) => Math.sin(x);
    const x = 1;
    const h = 1e-3;
    const true_d = Math.cos(x);
    const fwd = receiveFluxion({
      claimId: "fwd",
      point: x,
      asserted: true_d,
      witness: { kind: "FORWARD", fx: f(x), fxh: f(x + h), h },
    });
    const cen = receiveFluxion({
      claimId: "cen",
      point: x,
      asserted: true_d,
      witness: { kind: "CENTRAL", fxh: f(x + h), fxmh: f(x - h), h },
    });
    expect(cen.residual).toBeLessThan(fwd.residual);
  });
});
