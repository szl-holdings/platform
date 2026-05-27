import { describe, expect, it } from 'vitest';
import { detectPeaks, type SurfacePoint } from '../peak-detector.js';
import { rankCandidates, selectAboveCutoff } from '../ranked-candidates.js';

function gaussian(x: number, mu: number, sigma: number, amp: number): number {
  const z = (x - mu) / sigma;
  return amp * Math.exp(-0.5 * z * z);
}

describe('detectPeaks — MsdialWorkbench primitive', () => {
  it('finds a single Gaussian peak and itemises its score components', () => {
    const surface: SurfacePoint[] = [];
    for (let i = 0; i < 100; i++) surface.push({ x: i, intensity: gaussian(i, 50, 4, 100) + 0.1 });
    const peaks = detectPeaks(surface, { minProminence: 1, minSnRatio: 1, halfWindow: 5 });
    expect(peaks.length).toBe(1);
    expect(peaks[0]!.xCenter).toBeCloseTo(50, 0);
    // Itemised, not just composite.
    expect(peaks[0]!.scoreComponents.prominence).toBeGreaterThan(0);
    expect(peaks[0]!.scoreComponents.snRatio).toBeGreaterThan(0);
    expect(peaks[0]!.scoreComponents.composite).toBeGreaterThan(0);
  });

  it('respects SN ratio threshold (rejects noise-only surface)', () => {
    const surface: SurfacePoint[] = [];
    for (let i = 0; i < 100; i++) surface.push({ x: i, intensity: 0.5 + Math.sin(i) * 0.01 });
    const peaks = detectPeaks(surface, { minProminence: 0.1, minSnRatio: 10, halfWindow: 5 });
    expect(peaks).toEqual([]);
  });

  it('finds two peaks on a bimodal surface', () => {
    const surface: SurfacePoint[] = [];
    for (let i = 0; i < 100; i++) {
      surface.push({ x: i, intensity: gaussian(i, 30, 3, 50) + gaussian(i, 70, 3, 50) + 0.1 });
    }
    const peaks = detectPeaks(surface, { minProminence: 1, minSnRatio: 1, halfWindow: 4 });
    expect(peaks.length).toBe(2);
  });
});

describe('rankCandidates / selectAboveCutoff — never-collapse-without-provenance', () => {
  it('sorts by matchScore desc', () => {
    const r = rankCandidates([
      { label: 'a', matchScore: 0.3 },
      { label: 'b', matchScore: 0.9 },
      { label: 'c', matchScore: 0.6 },
    ]);
    expect(r.map((c) => c.label)).toEqual(['b', 'c', 'a']);
  });

  it('throws on collapse without cutoffChosenBy', () => {
    expect(() =>
      selectAboveCutoff({
        peakRef: 'p1',
        cutoff: 0.5,
        cutoffChosenBy: { actor: '', rationale: '' },
        candidates: [{ label: 'x', matchScore: 0.9 }],
      }),
    ).toThrow(/no collapse without provenance/);
  });

  it('returns the candidates ≥ cutoff, with mandatory provenance carried through', () => {
    const r = selectAboveCutoff({
      peakRef: 'p1',
      cutoff: 0.5,
      cutoffChosenBy: { actor: 'op-7', rationale: 'baseline-tuned' },
      candidates: [
        { label: 'x', matchScore: 0.9 },
        { label: 'y', matchScore: 0.3 },
        { label: 'z', matchScore: 0.7 },
      ],
    });
    expect(r.candidates.map((c) => c.label)).toEqual(['x', 'z']);
    expect(r.cutoffChosenBy.actor).toBe('op-7');
  });
});
