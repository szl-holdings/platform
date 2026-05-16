import { describe, expect, it } from 'vitest';
import { createBrierLedger } from '../brier-ledger';

describe('brierLedger', () => {
  it('matches hand-computed score for a fixed 5-prediction fixture', () => {
    const l = createBrierLedger();
    const fixture = [
      { date: '2026-05-12', variable: 'METR', predicted: 0.9, actual: 1 },
      { date: '2026-05-13', variable: 'METR', predicted: 0.7, actual: 1 },
      { date: '2026-05-14', variable: 'EPOCH', predicted: 0.3, actual: 0 },
      { date: '2026-05-15', variable: 'EPOCH', predicted: 0.6, actual: 0 },
      { date: '2026-05-16', variable: 'ARC', predicted: 0.5, actual: 1 },
    ];
    for (const e of fixture) l.record(e);
    // (0.01 + 0.09 + 0.09 + 0.36 + 0.25) / 5 = 0.16
    expect(l.score()).toBeCloseTo(0.16, 10);
    expect(l.size()).toBe(5);
  });

  it('empty ledger scores 0', () => {
    expect(createBrierLedger().score()).toBe(0);
  });

  it('respects ring capacity', () => {
    const l = createBrierLedger(3);
    for (let i = 0; i < 5; i++) {
      l.record({ date: `2026-05-${10 + i}`, variable: 'X', predicted: 0.5, actual: 0.5 });
    }
    expect(l.size()).toBe(3);
  });

  it('rejects out-of-range probabilities', () => {
    const l = createBrierLedger();
    expect(() => l.record({ date: '2026-05-16', variable: 'X', predicted: 1.5, actual: 0 })).toThrow();
    expect(() => l.record({ date: '2026-05-16', variable: 'X', predicted: 0.5, actual: -1 })).toThrow();
  });
});
