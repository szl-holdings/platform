import { describe, expect, it } from 'vitest';
import {
  SEED_WORKCELL_EVIDENCE_REASON,
  SEED_WORKCELL_TIMESTAMP,
  SEED_WORKCELLS,
} from '../src/index.js';

describe('seed Workcell evidence boundary', () => {
  it('marks every repository fixture as DEMO with a nonempty reason', () => {
    expect(SEED_WORKCELLS.length).toBeGreaterThan(0);

    for (const workcell of SEED_WORKCELLS) {
      expect(workcell.evidenceState).toBe('DEMO');
      expect(workcell.evidenceReason).toBe(SEED_WORKCELL_EVIDENCE_REASON);
      expect(workcell.evidenceReason.trim()).not.toHaveLength(0);
    }
  });

  it('uses a stable fixture timestamp instead of wall-clock time', () => {
    for (const workcell of SEED_WORKCELLS) {
      expect(workcell.createdAt).toBe(SEED_WORKCELL_TIMESTAMP);
      expect(workcell.updatedAt).toBe(SEED_WORKCELL_TIMESTAMP);
      expect(workcell.actionBrief.createdAt).toBe(SEED_WORKCELL_TIMESTAMP);
      expect(workcell.actionBrief.updatedAt).toBe(SEED_WORKCELL_TIMESTAMP);
      expect(workcell.mirrorEvalResult.evaluatedAt).toBe(SEED_WORKCELL_TIMESTAMP);
    }
  });
});
