/**
 * Vessels A11oy backend routes — unit tests (Task #5318).
 *
 * Covers the pure compute helpers used by the five `/api/vessels/{fleet,
 * positions,risk,route-plan,coexistence}` routes:
 *
 *   - computePerturbationBound  (vessels-risk.ts)
 *   - checkAnatomyBoundary      (vessels-route-plan.ts)
 *   - nullSpaceProject          (vessels-coexistence.ts)
 *
 * These are the maths the routes persist into the A11oy primitive tables;
 * locking them down with vitest is sufficient to guarantee that any future
 * refactor of the route handlers preserves the formula contracts.
 */

import { describe, expect, it } from 'vitest';
import { computePerturbationBound } from '../routes/vessels-risk';
import { checkAnatomyBoundary } from '../routes/vessels-route-plan';
import { nullSpaceProject } from '../routes/vessels-coexistence';

describe('computePerturbationBound (Phase-2 perturbation bound)', () => {
  it('returns bound=0 and severity=normal when factors are empty', () => {
    const r = computePerturbationBound({});
    expect(r.perturbationBound).toBe(0);
    expect(r.severity).toBe('normal');
    expect(r.receiptHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('averages unit-weighted factors', () => {
    const r = computePerturbationBound({ a: 0.4, b: 0.6 });
    expect(r.perturbationBound).toBeCloseTo(0.5, 6);
    expect(r.severity).toBe('elevated');
  });

  it('respects per-factor weights', () => {
    const r = computePerturbationBound({ a: 1, b: 0 }, { a: 1, b: 3 });
    expect(r.perturbationBound).toBeCloseTo(0.25, 6);
    expect(r.severity).toBe('watch');
  });

  it('clamps to [0,1] and classifies critical', () => {
    const r = computePerturbationBound({ a: 1, b: 1, c: 1 });
    expect(r.perturbationBound).toBe(1);
    expect(r.severity).toBe('critical');
  });

  it('produces deterministic receipt hashes for identical inputs', () => {
    const a = computePerturbationBound({ x: 0.3 }, { x: 0.5 });
    const b = computePerturbationBound({ x: 0.3 }, { x: 0.5 });
    expect(a.receiptHash).toBe(b.receiptHash);
  });
});

describe('checkAnatomyBoundary (Phase-2 anatomy-boundary lemma)', () => {
  it('accepts a straight-line two-waypoint route', () => {
    const r = checkAnatomyBoundary(
      [
        { lat: 0, lon: 0 },
        { lat: 0, lon: 10 },
      ],
      500,
    );
    expect(r.ok).toBe(true);
    expect(r.notes).toBeNull();
    expect(r.maxObservedKm).toBeCloseTo(0, 6);
  });

  it('flags a wildly off-axis waypoint as exceeding the boundary', () => {
    const r = checkAnatomyBoundary(
      [
        { lat: 0, lon: 0 },
        { lat: 30, lon: 5 },
        { lat: 0, lon: 10 },
      ],
      100,
    );
    expect(r.ok).toBe(false);
    expect(r.notes).toContain('exceeds');
    expect(r.maxObservedKm).toBeGreaterThan(100);
  });

  it('rejects a route shorter than 2 waypoints', () => {
    const r = checkAnatomyBoundary([{ lat: 0, lon: 0 }], 500);
    expect(r.ok).toBe(false);
    expect(r.notes).toContain('two waypoints');
  });
});

describe('nullSpaceProject (Phase-2 null-space lemma)', () => {
  it('produces a zero residual when u is parallel to w', () => {
    const r = nullSpaceProject(
      [
        { band: 'L', utilization: 0.5 },
        { band: 'S', utilization: 0.5 },
      ],
      [1, 1],
    );
    expect(r.interferenceScore).toBeCloseTo(0, 6);
    expect(r.projection.every((v) => Math.abs(v) < 1e-9)).toBe(true);
  });

  it('produces a non-zero residual when bands disagree with weights', () => {
    const r = nullSpaceProject(
      [
        { band: 'L', utilization: 0.9 },
        { band: 'S', utilization: 0.1 },
      ],
      [1, 1],
    );
    expect(r.interferenceScore).toBeGreaterThan(0);
    expect(r.interferenceScore).toBeLessThanOrEqual(1);
  });

  it('defaults weights to uniform when not provided', () => {
    const r = nullSpaceProject([
      { band: 'L', utilization: 1 },
      { band: 'S', utilization: 0 },
    ]);
    expect(r.interferenceScore).toBeGreaterThan(0);
    expect(r.receiptHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces deterministic receipt hashes for identical inputs', () => {
    const inputs = [
      { band: 'L', utilization: 0.4 },
      { band: 'S', utilization: 0.6 },
    ];
    const a = nullSpaceProject(inputs, [1, 1]);
    const b = nullSpaceProject(inputs, [1, 1]);
    expect(a.receiptHash).toBe(b.receiptHash);
  });
});
