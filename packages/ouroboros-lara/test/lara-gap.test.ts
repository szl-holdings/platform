import { describe, it, expect } from "vitest";
import { declareLara, nonMeasurabilityHonesty } from "../src/lara-gap.js";
import type { GowersGateResult } from "../src/gowers-norm.js";
import type { AbramovGateResult } from "../src/abramov-gate.js";
import type { MeasurabilityResult } from "../src/measurability.js";

const G = (verdict: GowersGateResult["verdict"]): GowersGateResult => ({
  verdict,
  norm: verdict === "STRUCTURED" ? 0.6 : 0.0,
  eta: 0.05,
  reason: "test",
  exact: true,
});
const A = (status: AbramovGateResult["status"]): AbramovGateResult => ({
  p: 2,
  k: 5,
  status,
  citation: "test citation",
  reason: "test",
});
const M = (verdict: MeasurabilityResult["verdict"]): MeasurabilityResult => ({
  candidatePolynomialId: "Q",
  verdict,
  successRate: verdict === "MEASURABLE" ? 0.8 : 0.1,
  trialCount: 10,
  reason: "test",
});

describe("Primitive 36 — Lara-gap declaration", () => {
  it("emits LARA_NA when no structure detected", () => {
    const r = declareLara({
      detectionId: "d1",
      gowers: G("UNIFORM"),
      abramov: A("ABRAMOV_PROVEN"),
      measurability: null,
    });
    expect(r.kind).toBe("LARA_NA");
    expect(r.reconstructibilityClaimAllowed).toBe(false);
  });

  it("emits LARA_HOLD on undetermined measurability", () => {
    const r = declareLara({
      detectionId: "d2",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_PROVEN"),
      measurability: null,
    });
    expect(r.kind).toBe("LARA_HOLD");
  });

  it("emits LARA_GAP when ABRAMOV_FAILS and NON_MEASURABLE — runtime honesty", () => {
    const r = declareLara({
      detectionId: "d3",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_FAILS"),
      measurability: M("NON_MEASURABLE"),
    });
    expect(r.kind).toBe("LARA_GAP");
    expect(r.reconstructibilityClaimAllowed).toBe(false);
    expect(r.axisN).toBe(1.0);
  });

  it("emits LARA_OK when measurable and Abramov not failing", () => {
    const r = declareLara({
      detectionId: "d4",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_PROVEN"),
      measurability: M("MEASURABLE"),
    });
    expect(r.kind).toBe("LARA_OK");
    expect(r.reconstructibilityClaimAllowed).toBe(true);
  });

  it("emits LARA_BUG when ABRAMOV_PROVEN but reconstruction non-measurable", () => {
    const r = declareLara({
      detectionId: "d5",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_PROVEN"),
      measurability: M("NON_MEASURABLE"),
    });
    expect(r.kind).toBe("LARA_BUG");
    expect(r.axisN).toBe(0.0);
  });

  it("emits LARA_GAP for ABRAMOV_OPEN + NON_MEASURABLE", () => {
    const r = declareLara({
      detectionId: "d6",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_OPEN"),
      measurability: M("NON_MEASURABLE"),
    });
    expect(r.kind).toBe("LARA_GAP");
  });

  it("emits LARA_HOLD for ABRAMOV_FAILS + MEASURABLE (lucky run, no general guarantee)", () => {
    const r = declareLara({
      detectionId: "d7",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_FAILS"),
      measurability: M("MEASURABLE"),
    });
    expect(r.kind).toBe("LARA_HOLD");
    expect(r.reconstructibilityClaimAllowed).toBe(false);
    expect(r.axisN).toBe(0.5);
  });

  it("aggregates axisN across receipts", () => {
    const ok = declareLara({
      detectionId: "ok",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_PROVEN"),
      measurability: M("MEASURABLE"),
    });
    const gap = declareLara({
      detectionId: "gap",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_FAILS"),
      measurability: M("NON_MEASURABLE"),
    });
    const bug = declareLara({
      detectionId: "bug",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_PROVEN"),
      measurability: M("NON_MEASURABLE"),
    });
    expect(nonMeasurabilityHonesty([ok, gap, bug])).toBeCloseTo((1 + 1 + 0) / 3, 5);
    expect(nonMeasurabilityHonesty([])).toBe(1.0);
  });

  it("includes the Math. Ann. citation in non-trivial receipts", () => {
    const r = declareLara({
      detectionId: "cite",
      gowers: G("STRUCTURED"),
      abramov: A("ABRAMOV_FAILS"),
      measurability: M("NON_MEASURABLE"),
    });
    expect(r.citations.some((c) => c.includes("Math. Ann."))).toBe(true);
  });
});
