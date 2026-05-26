import { describe, expect, it } from 'vitest';
import { makeTetrad, tetradInner, tetradNorm, type TetradFrame } from './tetrad_field';

describe('@a11oy/connection · tetrad_field', () => {
  const sample: TetradFrame = makeTetrad({
    capability_tier: 1,
    data_sensitivity: 2,
    action_reversibility: 2,
    blast_radius: 4,
  });

  it('makeTetrad builds an orthonormal frame with exactly four labelled legs', () => {
    expect(sample.legs).toHaveLength(4);
    expect(sample.legs.map((l) => l.axis)).toEqual([
      'capability_tier',
      'data_sensitivity',
      'action_reversibility',
      'blast_radius',
    ]);
    expect(sample.legs.map((l) => l.unit)).toEqual([
      'tier',
      'sensitivityLevel',
      'reversibilityScore',
      'affectedUserCount',
    ]);
    expect(sample.legs.map((l) => l.value)).toEqual([1, 2, 2, 4]);
  });

  it('tetradInner computes the Euclidean inner product over the four legs', () => {
    const other = makeTetrad({
      capability_tier: 3,
      data_sensitivity: 1,
      action_reversibility: 0,
      blast_radius: 2,
    });
    // 1*3 + 2*1 + 2*0 + 4*2 = 3 + 2 + 0 + 8 = 13
    expect(tetradInner(sample, other)).toBe(13);
  });

  it('tetradInner is symmetric and equals the squared norm against itself', () => {
    const other = makeTetrad({
      capability_tier: 3,
      data_sensitivity: 1,
      action_reversibility: 0,
      blast_radius: 2,
    });
    expect(tetradInner(sample, other)).toBe(tetradInner(other, sample));
    expect(tetradInner(sample, sample)).toBe(tetradNorm(sample) ** 2);
  });

  it('tetradNorm returns sqrt(1 + 4 + 4 + 16) = 5 for the sample frame', () => {
    expect(tetradNorm(sample)).toBe(5);
  });

  it('tetradNorm of the zero frame is zero', () => {
    const zero = makeTetrad({
      capability_tier: 0,
      data_sensitivity: 0,
      action_reversibility: 0,
      blast_radius: 0,
    });
    expect(tetradNorm(zero)).toBe(0);
  });
});
