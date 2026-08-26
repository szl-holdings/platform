import { describe, expect, it } from 'vitest';
import { OPERATIONAL_WORKCELLS, WORKCELL_SOURCE, getOperationalWorkcells } from '../src/index.js';
import type { OperationalSourceState } from '../src/data/workcells.js';

const STATES: readonly OperationalSourceState[] = [
  'REAL',
  'DEMO',
  'UNAVAILABLE',
  'DEGRADED',
  'BLOCKED',
  'ROADMAP',
] as const;

describe('operational workcell source truth states', () => {
  it('keeps the complete six-state vocabulary explicit', () => {
    expect(STATES).toEqual(['REAL', 'DEMO', 'UNAVAILABLE', 'DEGRADED', 'BLOCKED', 'ROADMAP']);
  });

  it('fails closed when no authenticated operational source exists', () => {
    expect(WORKCELL_SOURCE.state).toBe('UNAVAILABLE');
    expect(WORKCELL_SOURCE.source).toBeNull();
    expect(WORKCELL_SOURCE.observedAt).toBeNull();
    expect(WORKCELL_SOURCE.records).toBe(OPERATIONAL_WORKCELLS);
    expect(OPERATIONAL_WORKCELLS).toHaveLength(0);
    expect(Object.isFrozen(OPERATIONAL_WORKCELLS)).toBe(true);
    expect(Object.isFrozen(WORKCELL_SOURCE)).toBe(true);
    expect(getOperationalWorkcells()).toBe(WORKCELL_SOURCE);
  });
});
