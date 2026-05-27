import { describe, expect, it } from 'vitest';
import { peaksToAmiContribution } from './peak-signal.js';

describe('peaksToAmiContribution', () => {
  it('returns zero contribution on an empty peak set', () => {
    const c = peaksToAmiContribution([]);
    expect(c.noise).toBe(0);
    expect(c.drift).toBe(0);
    expect(c.peakCount).toBe(0);
    expect(c.topComposite).toBe(0);
  });

  it('is monotone non-decreasing in the noise axis as peaks are added', () => {
    const a = peaksToAmiContribution([{ composite: 0.4 }]);
    const b = peaksToAmiContribution([{ composite: 0.4 }, { composite: 0.6 }]);
    expect(b.noise).toBeGreaterThanOrEqual(a.noise);
    expect(b.drift).toBeGreaterThanOrEqual(a.drift);
  });

  it('clamps to [0, 1] when peak energy exceeds capacity', () => {
    const big = peaksToAmiContribution(
      Array.from({ length: 50 }, () => ({ composite: 2 })),
    );
    expect(big.noise).toBe(1);
    expect(big.drift).toBe(1);
  });

  it('ignores non-finite composites without throwing', () => {
    const c = peaksToAmiContribution([
      { composite: Number.NaN },
      { composite: Number.POSITIVE_INFINITY },
      { composite: 0.5 },
    ]);
    expect(Number.isFinite(c.noise)).toBe(true);
    expect(Number.isFinite(c.drift)).toBe(true);
    expect(c.topComposite).toBe(0.5);
  });
});
