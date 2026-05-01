/**
 * SIGIL · Proving Suite (SZL Holdings, 2026)
 *
 * Each block here corresponds to one of the framework's stated theorems.
 * If any block fails, the framework's published guarantee fails with it.
 */

import { describe, expect, it } from 'vitest';
import {
        decomposeUnitFraction,
        sumUnitFractions,
        inspectableWeight,
        weightsSumToOne,
} from '../rationals.js';
import { defaultWeights, sigma, verifyBound, type SigilAxes } from '../sigma.js';
import { reconcile, convergenceAxis } from '../witness.js';
import { coherence, coherenceAxis } from '../coherence.js';
import { reading, containmentAxis, SaturationAuditor } from '../saturation.js';
import {
        doublingMultiply,
        verifyDoublingTrace,
        ShiftAddAccumulator,
        provenanceAxis,
        SIGIL_PRIME,
} from '../accumulator.js';

describe('SIGIL · rationals — unit-fraction exactness', () => {
        it('reconstructs every weight as a finite distinct unit-fraction sum', () => {
                for (const [p, q] of [
                        [1, 4],
                        [2, 3],
                        [3, 7],
                        [5, 8],
                        [7, 12],
                ] as const) {
                        const d = decomposeUnitFraction(p, q);
                        expect(d.exact).toBe(true);
                        const back = sumUnitFractions(d.terms);
                        expect(back.numerator * q).toBe(back.denominator * p);
                }
        });

        it('verifies the default weight set sums to exactly 1 over rationals', () => {
                const w = defaultWeights();
                expect(weightsSumToOne([w.provenance, w.containment, w.coherence, w.convergence])).toBe(true);
        });

        it('rejects non-summing weight sets', () => {
                const ok = inspectableWeight(1, 4);
                const bad = inspectableWeight(1, 5);
                expect(weightsSumToOne([ok, ok, ok, bad])).toBe(false);
        });
});

describe('SIGIL · Σ — composition law', () => {
        const allOnes: SigilAxes = { provenance: 1, containment: 1, coherence: 1, convergence: 1 };

        it('Σ ∈ [0,1]', () => {
                for (let i = 0; i < 100; i++) {
                        const ax: SigilAxes = {
                                provenance: Math.random(),
                                containment: Math.random(),
                                coherence: Math.random(),
                                convergence: Math.random(),
                        };
                        const r = sigma(ax);
                        expect(r.sigma).toBeGreaterThanOrEqual(0);
                        expect(r.sigma).toBeLessThanOrEqual(1 + 1e-12);
                }
        });

        it('Σ = 0 if any axis is 0 (zero-pinning)', () => {
                const cases: SigilAxes[] = [
                        { provenance: 0, containment: 1, coherence: 1, convergence: 1 },
                        { provenance: 1, containment: 0, coherence: 1, convergence: 1 },
                        { provenance: 1, containment: 1, coherence: 0, convergence: 1 },
                        { provenance: 1, containment: 1, coherence: 1, convergence: 0 },
                ];
                for (const ax of cases) expect(sigma(ax).sigma).toBe(0);
        });

        it('Σ = 1 ⇔ all axes = 1', () => {
                expect(sigma(allOnes).sigma).toBeCloseTo(1, 12);
        });

        it('Σ is monotone non-decreasing in every axis', () => {
                const base: SigilAxes = { provenance: 0.4, containment: 0.5, coherence: 0.6, convergence: 0.7 };
                const baseS = sigma(base).sigma;
                for (const k of ['provenance', 'containment', 'coherence', 'convergence'] as const) {
                        const up = { ...base, [k]: Math.min(1, base[k] + 0.1) };
                        expect(sigma(up).sigma).toBeGreaterThanOrEqual(baseS - 1e-12);
                }
        });

        it('envelope theorem: min(axis) ≤ Σ ≤ max(axis) for the published bound', () => {
                const ax: SigilAxes = { provenance: 0.3, containment: 0.6, coherence: 0.5, convergence: 0.4 };
                const r = sigma(ax);
                expect(r.sigma).toBeGreaterThanOrEqual(r.proof.minAxis - 1e-12);
                expect(r.sigma).toBeLessThanOrEqual(r.proof.maxAxis + 1e-12);
                expect(r.proof.bound.lower).toBe(r.proof.minAxis);
                expect(r.proof.bound.upper).toBe(r.proof.maxAxis);
                expect(verifyBound(r)).toBe(true);
        });

        it('envelope holds across 200 random axis tuples (no axis = 0)', () => {
                for (let i = 0; i < 200; i++) {
                        const ax: SigilAxes = {
                                provenance: 0.05 + Math.random() * 0.95,
                                containment: 0.05 + Math.random() * 0.95,
                                coherence: 0.05 + Math.random() * 0.95,
                                convergence: 0.05 + Math.random() * 0.95,
                        };
                        const r = sigma(ax);
                        expect(r.sigma).toBeGreaterThanOrEqual(r.proof.minAxis - 1e-9);
                        expect(r.sigma).toBeLessThanOrEqual(r.proof.maxAxis + 1e-9);
                        expect(verifyBound(r)).toBe(true);
                }
        });
});

describe('SIGIL · Σ — adversarial weight gate', () => {
        it('rejects forged weight value that disagrees with terms (recomputes from terms)', () => {
                const w = inspectableWeight(1, 4);
                const ax: SigilAxes = { provenance: 0.5, containment: 0.5, coherence: 0.5, convergence: 0.5 };
                // Truthful baseline.
                const truthful = sigma(ax, { provenance: w, containment: w, coherence: w, convergence: w });
                // Forged: pretend value is 0.9 even though terms still encode 1/4.
                const forged = {
                        provenance: { terms: w.terms, value: 0.9 },
                        containment: w,
                        coherence: w,
                        convergence: w,
                };
                const result = sigma(ax, forged);
                // Σ must match the truthful exponent path because we recompute from terms.
                expect(result.sigma).toBeCloseTo(truthful.sigma, 12);
                // The published weight value reflects the canonical (terms-derived) value.
                expect(result.weights.provenance.value).toBeCloseTo(0.25, 12);
        });

        it('rejects weight terms with non-positive denominator', () => {
                const ax: SigilAxes = { provenance: 0.5, containment: 0.5, coherence: 0.5, convergence: 0.5 };
                const bad = { terms: [4, -2], value: 0.25 };
                const w = inspectableWeight(1, 4);
                expect(() => sigma(ax, { provenance: bad as never, containment: w, coherence: w, convergence: w })).toThrow();
        });

        it('rejects axis values outside [0,1]', () => {
                expect(() => sigma({ provenance: 1.5, containment: 0.5, coherence: 0.5, convergence: 0.5 } as SigilAxes)).toThrow();
                expect(() => sigma({ provenance: -0.1, containment: 0.5, coherence: 0.5, convergence: 0.5 } as SigilAxes)).toThrow();
                expect(() => sigma({ provenance: NaN, containment: 0.5, coherence: 0.5, convergence: 0.5 } as SigilAxes)).toThrow();
        });

        it('rejects weight set whose unit-fraction terms do not sum to 1', () => {
                const w = inspectableWeight(1, 4);
                const skew = inspectableWeight(1, 5);
                const ax: SigilAxes = { provenance: 0.5, containment: 0.5, coherence: 0.5, convergence: 0.5 };
                expect(() => sigma(ax, { provenance: w, containment: w, coherence: w, convergence: skew })).toThrow();
        });
});

describe('SIGIL · convergence — N-witness reconciliation', () => {
        it('three identical witnesses reconcile (Jaccard = 1)', () => {
                const r = reconcile([
                        { id: 'a', leaves: ['x', 'y', 'z'] },
                        { id: 'b', leaves: ['x', 'y', 'z'] },
                        { id: 'c', leaves: ['x', 'y', 'z'] },
                ]);
                expect(r.verdict).toBe('RECONCILED');
                expect(r.jaccard).toBe(1);
                expect(convergenceAxis(r)).toBe(1);
        });

        it('disagreeing witnesses diverge with Jaccard ∈ (0,1)', () => {
                // Common leaf 'x' appears in all three; remaining leaves diverge.
                const r = reconcile([
                        { id: 'a', leaves: ['x', 'y'] },
                        { id: 'b', leaves: ['x', 'z'] },
                        { id: 'c', leaves: ['x', 'w'] },
                ]);
                expect(r.verdict).toBe('DIVERGENT');
                expect(r.jaccard).toBeGreaterThan(0);
                expect(r.jaccard).toBeLessThan(1);
                expect(r.maxPairwiseDiff).toBeGreaterThan(0);
        });

        it('insufficient witnesses report INSUFFICIENT', () => {
                const r = reconcile([{ id: 'a', leaves: ['x'] }], 3);
                expect(r.verdict).toBe('INSUFFICIENT');
                expect(convergenceAxis(r)).toBe(0);
        });
});

describe('SIGIL · coherence — phase order parameter', () => {
        it('phase-locked agents yield r ≈ 1', () => {
                const r = coherence(Array.from({ length: 16 }, (_, i) => ({ agentId: `a${i}`, thetaRadians: 1.234 })));
                expect(r.r).toBeCloseTo(1, 12);
                expect(r.verdict).toBe('ROUTE');
                expect(coherenceAxis(r)).toBeCloseTo(1, 12);
        });

        it('uniformly distributed phases yield r ≈ 0', () => {
                const N = 256;
                const samples = Array.from({ length: N }, (_, i) => ({
                        agentId: `a${i}`,
                        thetaRadians: (2 * Math.PI * i) / N,
                }));
                const r = coherence(samples);
                expect(r.r).toBeLessThan(0.01);
                expect(r.verdict).toBe('DESYNC');
        });

        it('r ∈ [0,1] for any sample set', () => {
                for (let i = 0; i < 50; i++) {
                        const samples = Array.from({ length: 8 }, (_, j) => ({
                                agentId: `${j}`,
                                thetaRadians: Math.random() * Math.PI * 2,
                        }));
                        const r = coherence(samples);
                        expect(r.r).toBeGreaterThanOrEqual(0);
                        expect(r.r).toBeLessThanOrEqual(1);
                }
        });
});

describe('SIGIL · containment — bounded saturation', () => {
        it('ρ stays bounded above by cap as Δy → 0', () => {
                const r = reading(1, 1e-30);
                expect(r.rho).toBeLessThanOrEqual(7);
                expect(r.verdict).toBe('SLACK');
        });

        it('ρ → 0 as Δx → 0 (CRITICAL containment)', () => {
                const r = reading(0, 100);
                expect(r.rho).toBe(0);
                expect(r.verdict).toBe('CRITICAL');
                expect(containmentAxis(r)).toBe(0);
        });

        it('rolling window auditor preserves per-sample audit', () => {
                const a = new SaturationAuditor(4);
                a.record(1, 2);
                a.record(1, 2);
                a.record(1, 2);
                a.record(1, 2);
                a.record(1, 2);
                expect(a.count()).toBe(4);
                const w = a.windowReading();
                expect(w.rho).toBeCloseTo((7 * 4) / 8, 9);
        });
});

describe('SIGIL · accumulator — shift-add doubling provenance', () => {
        it('a·b via doubling matches the native product (associativity)', () => {
                for (const [a, b] of [
                        [7n, 13n],
                        [255n, 1023n],
                        [12345n, 67890n],
                ] as const) {
                        const t = doublingMultiply(a, b);
                        expect(t.product).toBe(a * b);
                        expect(verifyDoublingTrace(t)).toBe(true);
                }
        });

        it('accumulator step round-trips through the verifier (provenance proof)', () => {
                const acc = new ShiftAddAccumulator();
                const leaves: bigint[] = [
                        1n,
                        0xdeadbeefn,
                        SIGIL_PRIME - 1n,
                        0xfeedfacefeedfacefeedfacefeedfacen,
                ];
                let verified = 0;
                for (const leaf of leaves) {
                        const { trace } = acc.append(leaf);
                        if (verifyDoublingTrace(trace)) verified++;
                }
                expect(verified).toBe(leaves.length);
                expect(provenanceAxis(verified, leaves.length)).toBe(1);
        });

        it('partial verification yields P ∈ (0,1)', () => {
                expect(provenanceAxis(3, 4)).toBe(0.75);
                expect(provenanceAxis(0, 0)).toBe(0);
        });
});

describe('SIGIL · end-to-end thesis', () => {
        it('composes all four axis primitives into a Σ report', () => {
                const conv = reconcile([
                        { id: 'a', leaves: ['x', 'y', 'z'] },
                        { id: 'b', leaves: ['x', 'y', 'z'] },
                        { id: 'c', leaves: ['x', 'y'] },
                ]);
                const coh = coherence([
                        { agentId: 'a1', thetaRadians: 1.0 },
                        { agentId: 'a2', thetaRadians: 1.05 },
                        { agentId: 'a3', thetaRadians: 0.98 },
                ]);
                const sat = reading(0.85, 1.0);
                const ax: SigilAxes = {
                        provenance: provenanceAxis(98, 100),
                        containment: containmentAxis(sat),
                        coherence: coherenceAxis(coh),
                        convergence: convergenceAxis(conv),
                };
                const r = sigma(ax);
                expect(r.sigma).toBeGreaterThan(0);
                expect(r.sigma).toBeLessThanOrEqual(r.proof.maxAxis + 1e-12);
                expect(r.proof.weightsExact).toBe(true);
                expect(r.proof.law).toContain('SZL');
        });
});
