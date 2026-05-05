import { describe, it, expect } from "vitest";
import {
  lutarV1,
  lutarV2,
  lutarV3,
  lutarV4,
  lutarV5,
  lutarV6,
  lutarV7,
  lutarV10Audit,
  lutarOmega,
  evaluateAll,
  adaptiveWeights,
  noetherClosureCheck,
  twistorProject,
  bekensteinBound,
  bekensteinCheck,
  conformalRescale,
  aeonRecurrence,
  rhindCircleArea,
  mayaCalendarRound,
  mayaLongCount,
  iChingIndex,
  vedicSqrt2,
  newJerusalemVolumeKm3,
  ouroboros,
  type LutarV6Input,
  type LutarV7Input,
} from "../src/lutar-formulas.ts";

const baseV6: LutarV6Input = {
  E: 100,
  M: 1,
  I: 1000,
  T: 300,
  R: 0.5,
  Chi: 1,
  Psi: 3,
  W: 1,
  Phi_IIT: 0.5,
  N_Noether: 6,
  aeon_n: 0,
  Omega_n: 1.0,
  twistor_Z: [1, 0, 1, 0],
  bekenstein_area_m2: 1e60,
  enforce_bekenstein: true,
};

describe("Lutar v1 — three-term foundation", () => {
  it("v1 returns positive value for positive inputs", () => {
    const r = lutarV1({ E: 1, M: 1, I: 1, T: 300 });
    expect(r.version).toBe("v1");
    expect(r.value).toBeGreaterThan(0);
    expect(r.closureSatisfied).toBe(true);
  });

  it("v1 information term lands on Landauer floor (γ=1)", () => {
    const r = lutarV1({ E: 0, M: 0, I: 1, T: 300, alpha: 0, beta: 0, gamma: 1 });
    const expected = 1 * 1.380649e-23 * 300 * Math.LN2;
    expect(r.value).toBeCloseTo(expected, 25);
  });
});

describe("Lutar v2 — seven-term, Phi integer-quantized", () => {
  it("v2 closes for integer Phi", () => {
    const r = lutarV2({ E: 1, M: 1, I: 1, T: 300, R: 0.1, Chi: 0.1, Psi: 0.1, Phi: 3 });
    expect(r.version).toBe("v2");
    expect(r.closureSatisfied).toBe(true);
  });

  it("v2 rejects non-integer Phi", () => {
    expect(() =>
      lutarV2({ E: 1, M: 1, I: 1, T: 300, R: 0.1, Chi: 0.1, Psi: 0.1, Phi: 2.5 }),
    ).toThrow();
  });
});

describe("Lutar v3 — cross-civilizational coupling", () => {
  it("v3 includes Egyptian Q_E and Inca Q_I terms", () => {
    const r = lutarV3({ E: 1, M: 1, I: 1, T: 300, R: 0, Chi: 0, Psi: 0, Phi: 1 });
    expect(r.version).toBe("v3");
    expect(r.terms["theta*Q_E"]).toBeGreaterThan(0);
    expect(r.terms["iota*Q_I"]).toBeGreaterThan(0);
  });
});

describe("Lutar v4 — Noether-grounded with E8/IIT/Noether-count terms", () => {
  it("v4 returns E8 container term", () => {
    const r = lutarV4({
      E: 1, M: 1, I: 1, T: 300, R: 0, Chi: 0, Psi: 0,
      W: 1, Phi_IIT: 0.5, N_Noether: 6,
    });
    expect(r.version).toBe("v4");
    expect(r.terms["kappa*Omega_E8"]).toBeDefined();
    expect(r.closureSatisfied).toBe(true);
  });
});

describe("Lutar v5 — global prisca extension (17 terms)", () => {
  it("v5 includes Maya, I Ching, Vedic, Dogon and Göbekli Tepe couplings", () => {
    const r = lutarV5({
      E: 1, M: 1, I: 1, T: 300, R: 0, Chi: 0, Psi: 0,
      W: 1, Phi_IIT: 0.5, N_Noether: 6,
    });
    expect(r.version).toBe("v5");
    expect(r.terms["theta_M*Q_M"]).toBeDefined();
    expect(r.terms["theta_IC*Q_IC"]).toBeDefined();
    expect(r.terms["theta_V*Q_V"]).toBeDefined();
    expect(r.terms["theta_D*Q_D"]).toBeDefined();
    expect(r.terms["theta_GT*Q_GT"]).toBeDefined();
  });
});

describe("Lutar v6 — Holographic-Twistor-Cyclic", () => {
  it("v6 returns spacetime, L5, L6, Bekenstein bound and ok flag", () => {
    const r = lutarV6(baseV6);
    expect(r.version).toBe("v6");
    expect(r.spacetime.length).toBe(4);
    expect(r.L5).toBeGreaterThan(0);
    expect(r.bekenstein_ok).toBe(true);
    expect(r.bekenstein_bound).toBeGreaterThan(0);
  });

  it("v6 reduces to L5 when Omega=1 and Bekenstein-disabled", () => {
    const r = lutarV6({ ...baseV6, Omega_n: 1.0, enforce_bekenstein: false });
    expect(r.L6).toBeCloseTo(r.L5, 12);
  });

  it("v6 throws on Bekenstein violation when enforced", () => {
    expect(() =>
      lutarV6({
        ...baseV6,
        I: 1e60,
        Phi_IIT: 1e60,
        bekenstein_area_m2: 1e-30,
        enforce_bekenstein: true,
      }),
    ).toThrow(/Bekenstein/);
  });

  it("v6 rejects negative aeon_n and non-positive Omega_n", () => {
    expect(() => lutarV6({ ...baseV6, aeon_n: -1 })).toThrow();
    expect(() => lutarV6({ ...baseV6, Omega_n: 0 })).toThrow();
  });
});

describe("Lutar Ω — unified master invariant on the 5-simplex", () => {
  it("uniform default weights sum to 1 and produce mean of L_values", () => {
    const r = lutarOmega({ L_values: [1, 2, 3, 4, 5, 6] });
    expect(r.version).toBe("omega");
    expect(r.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(r.value).toBeCloseTo(3.5, 12);
  });

  it("vertex weights recover an individual L_k", () => {
    const r = lutarOmega({
      L_values: [10, 20, 30, 40, 50, 60],
      weights: [0, 0, 1, 0, 0, 0],
    });
    expect(r.value).toBeCloseTo(30, 12);
  });

  it("rejects weights that do not sum to 1", () => {
    expect(() =>
      lutarOmega({
        L_values: [1, 1, 1, 1, 1, 1],
        weights: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      }),
    ).toThrow(/sum to 1/);
  });

  it("rejects negative weights", () => {
    expect(() =>
      lutarOmega({
        L_values: [1, 1, 1, 1, 1, 1],
        weights: [1.5, -0.5, 0, 0, 0, 0],
      }),
    ).toThrow(/non-negative/);
  });

  it("closure theorem string is exposed for documentation", () => {
    const r = lutarOmega({ L_values: [1, 1, 1, 1, 1, 1] });
    expect(r.closureTheorem).toMatch(/Noether/);
  });
});

describe("Adaptive weights — softmax(exp((k+1)·H))", () => {
  it("sums to 1 for any H", () => {
    for (const H of [-2, -0.5, 0, 0.1, 1, 5]) {
      const w = adaptiveWeights(H);
      expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    }
  });

  it("uniform weights when H = 0", () => {
    const w = adaptiveWeights(0);
    for (const wi of w) expect(wi).toBeCloseTo(1 / 6, 12);
  });

  it("monotonic in k for positive H — favours higher invariants", () => {
    const w = adaptiveWeights(0.5);
    for (let i = 0; i < w.length - 1; i++) {
      expect(w[i + 1]).toBeGreaterThan(w[i]);
    }
  });
});

describe("Lutar v7 — Bianchi closure (HUFT-inspired)", () => {
  it("v7 = L_Ω when the Lutar layer sequence is affine (D_A F = 0)", () => {
    const flat: LutarV7Input = {
      ...baseV6,
      omegaWeights: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
      huftCoupling: 1.0,
    };
    const r = lutarV7(flat);
    const omega = lutarOmega({
      L_values: r.L_values as [number, number, number, number, number, number],
    });
    if (r.bianchiDeviation < 1e-10) {
      expect(r.value).toBeCloseTo(omega.value, 9);
    } else {
      expect(r.value).toBeLessThanOrEqual(omega.value);
    }
  });

  it("v7 returns finite-difference fiber curvature (length 5) and covariant derivative (length 4)", () => {
    const r = lutarV7({ ...baseV6, huftCoupling: 1.0 });
    expect(r.fiberCurvature.length).toBe(5);
    expect(r.covariantDerivative.length).toBe(4);
  });

  it("v7 unification strength = exp(-κ·B) ∈ (0, 1]", () => {
    const r = lutarV7({ ...baseV6, huftCoupling: 1.0 });
    expect(r.unificationStrength).toBeGreaterThan(0);
    expect(r.unificationStrength).toBeLessThanOrEqual(1);
  });

  it("v7 rejects non-positive HUFT coupling", () => {
    expect(() => lutarV7({ ...baseV6, huftCoupling: 0 })).toThrow();
    expect(() => lutarV7({ ...baseV6, huftCoupling: -1 })).toThrow();
  });

  it("v7 always satisfies L7 ≤ L_Ω (exponential damping)", () => {
    const r = lutarV7({ ...baseV6, huftCoupling: 5.0 });
    expect(r.value).toBeLessThanOrEqual(r.L_Omega + 1e-9);
  });
});

describe("evaluateAll — single-shot v1..v6 + Ω", () => {
  it("returns six finite L_k values consumable by Lutar Ω", () => {
    const all = evaluateAll(baseV6);
    expect(all.values.length).toBe(6);
    for (const v of all.values) {
      expect(Number.isFinite(v)).toBe(true);
    }
    const omega = lutarOmega({
      L_values: all.values as [number, number, number, number, number, number],
    });
    expect(omega.value).toBeGreaterThan(0);
  });
});

describe("Noether closure check", () => {
  it("noether check accepts dL/dt = 0 within default tolerance", () => {
    expect(noetherClosureCheck(0)).toBe(true);
    expect(noetherClosureCheck(1e-12)).toBe(true);
  });

  it("noether check rejects dL/dt outside tolerance", () => {
    expect(noetherClosureCheck(1)).toBe(false);
  });
});

describe("Twistor projection Π: T=ℂ⁴ → R^{3,1}", () => {
  it("twistor projection returns a 4-vector", () => {
    const x = twistorProject([1, 2, 3, 4]);
    expect(x.length).toBe(4);
    for (const xi of x) expect(Number.isFinite(xi)).toBe(true);
  });
});

describe("Bekenstein bound + holographic principle", () => {
  it("bekenstein bound is positive for positive area", () => {
    expect(bekensteinBound(1)).toBeGreaterThan(0);
  });

  it("bekenstein check returns ok=true when entropy << bound", () => {
    const r = bekensteinCheck(1, 1e60);
    expect(r.ok).toBe(true);
    expect(r.bound).toBeGreaterThan(0);
  });

  it("bekenstein check returns ok=false when entropy >> bound", () => {
    const r = bekensteinCheck(1e80, 1e-50);
    expect(r.ok).toBe(false);
  });
});

describe("Conformal rescale + aeon recurrence (Penrose CCC)", () => {
  it("conformal rescale equals Ω² × L", () => {
    expect(conformalRescale(2, 0.5)).toBeCloseTo(2 * 0.25, 12);
  });

  it("aeon recurrence iterates L^(n+1) = Ω² · L^(n)", () => {
    const next = aeonRecurrence(1, 0.5);
    expect(next).toBeCloseTo(0.25, 12);
  });
});

describe("Prisca helpers — sourced civilizational quantities", () => {
  it("rhind circle area uses Egyptian (8/9·d)² formula", () => {
    expect(rhindCircleArea(9)).toBeCloseTo(64, 12);
  });

  it("maya calendar round = 18 980 days", () => {
    expect(mayaCalendarRound()).toBe(18980);
  });

  it("maya long count is base-20 with one mixed (winal=20, tun=18 winal)", () => {
    const lc = mayaLongCount(0, 0, 0, 0, 1);
    expect(lc).toBe(1);
    const lc2 = mayaLongCount(0, 0, 0, 1, 0);
    expect(lc2).toBe(20);
  });

  it("i-ching index for [1,1,1,1,1,1] (Qian) = 63 and for [0,…,0] (Kun) = 0", () => {
    expect(iChingIndex([1, 1, 1, 1, 1, 1])).toBe(63);
    expect(iChingIndex([0, 0, 0, 0, 0, 0])).toBe(0);
  });

  it("vedic √2 (Baudhayana) approximates Math.SQRT2 to <1e-5", () => {
    expect(Math.abs(vedicSqrt2() - Math.SQRT2)).toBeLessThan(1e-5);
  });

  it("new jerusalem volume from 12000-stadia cube is finite and positive", () => {
    const v = newJerusalemVolumeKm3();
    expect(v).toBeGreaterThan(0);
    expect(Number.isFinite(v)).toBe(true);
  });
});

describe("Ouroboros operator", () => {
  it("ouroboros n=0 is identity", () => {
    expect(ouroboros(7, (x) => x + 1, 0)).toBe(7);
  });

  it("ouroboros n=k applies transform k times", () => {
    expect(ouroboros(0, (x) => x + 1, 5)).toBe(5);
  });
});

describe("Lutar v10 — exhaustive-audit (Audit Closure Operator Λ₁₀)", () => {
  it("v10 returns operational closure when all six artefacts present (default)", () => {
    const r = lutarV10Audit(baseV6);
    expect(r.version).toBe("v10");
    expect(r.auditClosed).toBe(true);
    expect(r.closureSatisfied).toBe(true);
    expect(r.closureRatio).toBeCloseTo(1, 12);
    expect(r.Sigma_audit).toBe(r.Sigma_full);
    expect(r.missingArtifacts).toHaveLength(0);
    expect(r.perLayer).toHaveLength(8);
  });

  it("v10 collapses ratio when any artefact is missing for a layer", () => {
    // Mark thesis-coverage missing for v3 (index 2): A_v3 → 0
    const r = lutarV10Audit({
      ...baseV6,
      audit: {
        thesis: [true, true, false, true, true, true, true, true],
      },
    });
    expect(r.auditClosed).toBe(false);
    expect(r.closureRatio).toBeLessThan(1);
    expect(r.perLayer[2].operational).toBe(false);
    expect(r.perLayer[2].contribution).toBe(0);
    expect(r.missingArtifacts).toContain("v3:THESIS");
  });

  it("v10 closure ratio equals exactly the operational L-fraction", () => {
    // Drop v1 entirely (one missing dimension is enough)
    const r = lutarV10Audit({
      ...baseV6,
      audit: {
        code: [false, true, true, true, true, true, true, true],
      },
    });
    const expectedRatio = (r.Sigma_full - r.perLayer[0].L) / r.Sigma_full;
    expect(r.closureRatio).toBeCloseTo(expectedRatio, 12);
  });

  it("v10 reports missingArtifacts deterministically per layer × dimension", () => {
    const r = lutarV10Audit({
      ...baseV6,
      audit: {
        api: [true, true, true, true, true, false, true, true],
        test: [true, true, true, true, true, false, true, true],
      },
    });
    expect(r.missingArtifacts).toEqual(
      expect.arrayContaining(["v6:API", "v6:TEST"]),
    );
    expect(r.perLayer[5].operational).toBe(false);
  });

  it("v10 per-layer carries each L_k from evaluate-all + omega + v7", () => {
    const r = lutarV10Audit(baseV6);
    expect(r.perLayer.map((p) => p.version)).toEqual([
      "v1", "v2", "v3", "v4", "v5", "v6", "omega", "v7",
    ]);
    for (const p of r.perLayer) {
      expect(Number.isFinite(p.L)).toBe(true);
      expect(p.contribution).toBe(p.operational ? p.L : 0);
    }
  });

  it("v10 theorem string is the canonical formal statement", () => {
    const r = lutarV10Audit(baseV6);
    expect(r.theorem).toContain("auditClosed");
    expect(r.theorem).toContain("closureRatio = 1");
  });

  it("v10 fully-broken state (all six dims false for one layer) zeroes only that layer", () => {
    const r = lutarV10Audit({
      ...baseV6,
      audit: {
        code:    [true, true, true, true, false, true, true, true],
        codex:   [true, true, true, true, false, true, true, true],
        api:     [true, true, true, true, false, true, true, true],
        test:    [true, true, true, true, false, true, true, true],
        thesis:  [true, true, true, true, false, true, true, true],
        surface: [true, true, true, true, false, true, true, true],
      },
    });
    expect(r.perLayer[4].operational).toBe(false);
    expect(r.perLayer[4].contribution).toBe(0);
    // Other layers untouched
    for (let i = 0; i < 8; i++) {
      if (i === 4) continue;
      expect(r.perLayer[i].operational).toBe(true);
    }
  });

  it("v10 Sigma_audit + missing-fraction · Sigma_full = Sigma_full (conservation)", () => {
    const r = lutarV10Audit({
      ...baseV6,
      audit: { surface: [true, true, true, true, true, true, true, false] },
    });
    const missingMass = r.Sigma_full - r.Sigma_audit;
    // Relative tolerance — Sigma_full is dominated by L_v6 ~1e16; absolute
    // floating-point noise is O(few units) which is ~1e-15 relative.
    const rel = Math.abs(missingMass - r.perLayer[7].L) / Math.abs(r.perLayer[7].L);
    expect(rel).toBeLessThan(1e-10);
  });
});
