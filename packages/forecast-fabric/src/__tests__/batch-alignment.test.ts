import { describe, expect, it } from 'vitest';
import { alignBatch, type BatchAnchor } from '../batch-alignment.js';

function anchor(runId: string, anchorId: string, position: number): BatchAnchor {
  return { runId, anchorId, position };
}

describe('alignBatch — MsdialWorkbench cross-run links', () => {
  it('links each non-reference anchor to its nearest reference within tolerance', () => {
    const runs = new Map<string, BatchAnchor[]>([
      ['ref', [anchor('ref', 'r1', 10), anchor('ref', 'r2', 20), anchor('ref', 'r3', 30)]],
      ['runA', [anchor('runA', 'a1', 10.2), anchor('runA', 'a2', 20.5), anchor('runA', 'a3', 100)]],
    ]);
    const al = alignBatch(runs, { referenceRunId: 'ref', tolerance: 1 });
    expect(al.links.get('runA::a1')?.anchorId).toBe('r1');
    expect(al.links.get('runA::a2')?.anchorId).toBe('r2');
    // a3 has no neighbour within tolerance → not linked.
    expect(al.links.has('runA::a3')).toBe(false);
  });

  it('residual is signed (this − reference)', () => {
    const runs = new Map<string, BatchAnchor[]>([
      ['ref', [anchor('ref', 'r1', 10)]],
      ['runA', [anchor('runA', 'a1', 10.3)]],
    ]);
    const al = alignBatch(runs, { referenceRunId: 'ref', tolerance: 1 });
    const link = al.links.get('runA::a1')!;
    expect(link.residual).toBeCloseTo(0.3, 6);
  });

  it('throws if the reference run is missing', () => {
    expect(() =>
      alignBatch(new Map([['runA', [anchor('runA', 'a1', 1)]]]), { referenceRunId: 'ref', tolerance: 1 }),
    ).toThrow(/reference run/);
  });
});
