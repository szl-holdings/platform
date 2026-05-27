/**
 * Locks the per-stage Λ-receipt shape emitted for a deterministic
 * voyage input. Receipt class must stay `pipeline.stage.v1` and the
 * stage ordering must match what `VoyagePipelineTrace` renders.
 */

import { describe, expect, it } from 'vitest';
import { runVoyagePipeline } from '../pipeline.js';

describe('runVoyagePipeline — voyage Λ-receipts', () => {
  it('emits one pipeline.stage.v1 artefact per stage, in the canonical order', async () => {
    const result = await runVoyagePipeline({
      voyageRef: 'VOY-2026-001',
      imo: '9412987',
      aisPoints: 3200,
      counterpartyIds: ['CP-001', 'CP-SDN-77'],
      sanctionsListVersion: 'OFAC-SDN-2026.05.14',
    });
    expect(result.stages.map((s) => s.stageName)).toEqual([
      'ais-ingest',
      'identity-resolve',
      'risk-score',
      'policy-screen',
      'ledger-commit',
    ]);
    for (const s of result.stages) {
      expect(s.receiptClass).toBe('pipeline.stage.v1');
      expect(s.parentPipelineId).toBe('voyage:VOY-2026-001');
    }
  });

  it('chains each stage’s outputsHash into the next stage’s inputsHash', async () => {
    const result = await runVoyagePipeline({
      voyageRef: 'VOY-2026-002',
      imo: '9650441',
      aisPoints: 1200,
      counterpartyIds: ['CP-002'],
      sanctionsListVersion: 'OFAC-SDN-2026.05.14',
    });
    for (let i = 1; i < result.stages.length; i++) {
      expect(result.stages[i]!.inputsHash).toBe(result.stages[i - 1]!.outputsHash);
    }
  });

  it('clears low-risk voyages and blocks SDN-tagged counterparties', async () => {
    const clean = await runVoyagePipeline({
      voyageRef: 'VOY-CLEAN',
      imo: '9111111',
      aisPoints: 500,
      counterpartyIds: ['CP-CLEAN'],
      sanctionsListVersion: 'OFAC-SDN-2026.05.14',
    });
    expect(clean.final.cleared).toBe(true);
    const dirty = await runVoyagePipeline({
      voyageRef: 'VOY-DIRTY',
      imo: '9222222',
      aisPoints: 500,
      counterpartyIds: ['CP-SDN-99'],
      sanctionsListVersion: 'OFAC-SDN-2026.05.14',
    });
    expect(dirty.final.cleared).toBe(false);
  });
});
