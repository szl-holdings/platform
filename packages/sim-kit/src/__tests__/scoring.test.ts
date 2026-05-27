import { describe, expect, it } from 'vitest';
import { score, type ClusterPopRecord } from '../scoring.js';

const history: ClusterPopRecord[] = [
  { clusterId: 'a', size: 3, tMs: 0 },
  { clusterId: 'b', size: 7, tMs: 100 },
  { clusterId: 'c', size: 4, tMs: 200 },
];

describe('score — monotone-checked payoff', () => {
  it('sums f(size) over the history', () => {
    const total = score(history, (s) => s * s);
    expect(total).toBe(9 + 49 + 16);
  });

  it('rejects a non-monotone payoff (incentive-compatibility)', () => {
    const nonMonotone = (s: number): number => (s === 5 ? 0 : s);
    expect(() => score(history, nonMonotone)).toThrow(/monotonicity violation/);
  });

  it('accepts the identity payoff', () => {
    expect(score(history, (s) => s)).toBe(14);
  });
});
