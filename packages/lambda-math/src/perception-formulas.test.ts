import { describe, expect, it } from 'vitest';
import { gazeStability } from './gaze-stability.js';
import { peakConfidence } from './peak-confidence.js';
import { wilsonInterval } from './wilson.js';

describe('peakConfidence — synthesis §3', () => {
  it('is in (0, 1) for any finite non-negative input', () => {
    for (const prom of [0, 0.1, 1, 10, 100]) {
      for (const sn of [0, 0.5, 5, 50]) {
        const v = peakConfidence({ prominence: prom, snRatio: sn, shapeResidual: 0.1 });
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(1);
      }
    }
  });

  it('monotone-increasing in prominence (property)', () => {
    const a = peakConfidence({ prominence: 1, snRatio: 3, shapeResidual: 0.1 });
    const b = peakConfidence({ prominence: 10, snRatio: 3, shapeResidual: 0.1 });
    expect(b).toBeGreaterThan(a);
  });

  it('monotone-decreasing in shapeResidual', () => {
    const a = peakConfidence({ prominence: 5, snRatio: 3, shapeResidual: 0.01 });
    const b = peakConfidence({ prominence: 5, snRatio: 3, shapeResidual: 5 });
    expect(b).toBeLessThan(a);
  });
});

describe('gazeStability — synthesis §1', () => {
  it('returns k/n', () => {
    expect(gazeStability({ criteriaSatisfied: 2, criteriaTotal: 3 })).toBeCloseTo(2 / 3);
  });
  it('is monotone non-decreasing in k', () => {
    const a = gazeStability({ criteriaSatisfied: 1, criteriaTotal: 3 });
    const b = gazeStability({ criteriaSatisfied: 2, criteriaTotal: 3 });
    expect(b).toBeGreaterThan(a);
  });
  it('rejects nonsense', () => {
    expect(() => gazeStability({ criteriaSatisfied: -1, criteriaTotal: 3 })).toThrow();
    expect(() => gazeStability({ criteriaSatisfied: 4, criteriaTotal: 3 })).toThrow();
    expect(() => gazeStability({ criteriaSatisfied: 0, criteriaTotal: 0 })).toThrow();
  });
});

describe('wilsonInterval — synthesis §2', () => {
  it('matches the sequence-pipeline mirror for a published value', () => {
    const r = wilsonInterval(81, 263, '0.95');
    expect(r.ciLower).toBeCloseTo(0.255, 2);
    expect(r.ciUpper).toBeCloseTo(0.366, 2);
  });
});
