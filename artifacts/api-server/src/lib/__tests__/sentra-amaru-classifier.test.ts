/**
 * Unit tests for the Amaru cortex classification pass that re-scores and
 * tags Sentra detector findings before they are persisted as `open`.
 */
import { describe, expect, it } from 'vitest';
import type { Finding } from '@szl-holdings/sentra-detector-sdk';
import {
  classifyFindingWithContext,
  classifyFindings,
} from '../sentra-amaru-classifier';

function makeFinding(over: Partial<Finding> = {}): Finding {
  return {
    id: 'det/x#run1#0',
    detectorId: 'det/x',
    runId: 'run1',
    severity: 'medium',
    score: 0.4,
    title: 'demo',
    summary: 'demo',
    attackTechniques: ['T1046'],
    affectedAssets: [],
    evidence: {},
    governanceClass: 'advisory',
    emittedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    ...over,
  };
}

describe('Amaru classifier', () => {
  it('returns amaru-unavailable when sidecar context is null', () => {
    const c = classifyFindingWithContext(makeFinding(), null);
    expect(c.classification.mode).toBe('amaru-unavailable');
    expect(c.finding.severity).toBe('medium');
    expect(c.originalSeverity).toBeUndefined();
  });

  it('does not bump when nothing matches', () => {
    const c = classifyFindingWithContext(makeFinding(), {
      tripwires: [{ id: 'tw1', technique: 'T1059', status: 'armed' }],
      overwatch: { alertLevel: 'green', techniques: [] },
    });
    expect(c.classification.mode).toBe('amaru-cortex');
    expect(c.classification.bumpedSteps).toBe(0);
    expect(c.finding.severity).toBe('medium');
    expect(c.originalSeverity).toBeUndefined();
  });

  it('bumps severity when an armed tripwire matches and records the override', () => {
    const c = classifyFindingWithContext(makeFinding(), {
      tripwires: [
        {
          id: 'tw1',
          technique: 'T1046',
          status: 'armed',
          adversary: 'apt-pumacat',
        },
      ],
      overwatch: { alertLevel: 'amber', techniques: [] },
    });
    expect(c.classification.mode).toBe('amaru-cortex');
    expect(c.classification.bumpedSteps).toBe(1);
    expect(c.finding.severity).toBe('high');
    expect(c.finding.score).toBeCloseTo(0.55, 5);
    expect(c.originalSeverity).toBe('medium');
    expect(c.originalScoreBps).toBe(4000);
    expect(c.classification.adversaryTags).toContain('apt-pumacat');
  });

  it('caps the bump at +2 steps', () => {
    const c = classifyFindingWithContext(makeFinding({ severity: 'low', score: 0.2 }), {
      tripwires: [
        { id: 'a', technique: 'T1046', status: 'armed' },
        { id: 'b', technique: 'T1046', armed: true },
      ],
      overwatch: {
        alertLevel: 'red',
        techniques: ['T1046'],
        adversaries: [{ tag: 'crew-x', techniques: ['T1046'] }],
      },
    });
    expect(c.classification.bumpedSteps).toBe(2);
    expect(c.finding.severity).toBe('high');
    expect(c.originalSeverity).toBe('low');
  });

  it('returns amaru-disabled when enabled=false (without touching the sidecar)', async () => {
    const out = await classifyFindings([makeFinding()], { enabled: false });
    expect(out).toHaveLength(1);
    expect(out[0]!.classification.mode).toBe('amaru-disabled');
    expect(out[0]!.finding.severity).toBe('medium');
  });

  it('passes injected context straight through without fetch', async () => {
    const out = await classifyFindings(
      [makeFinding({ id: 'a' }), makeFinding({ id: 'b', severity: 'high', score: 0.7 })],
      {
        context: {
          tripwires: [{ id: 'tw', technique: 'T1046', status: 'armed' }],
          overwatch: null,
        },
      },
    );
    expect(out).toHaveLength(2);
    expect(out[0]!.finding.severity).toBe('high');
    expect(out[1]!.finding.severity).toBe('critical');
    expect(out[1]!.originalSeverity).toBe('high');
  });
});
