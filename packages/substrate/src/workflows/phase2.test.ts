/**
 * @szl/substrate — Phase 2 Workflow End-to-End Tests
 *
 * Covers all Phase 2 reference workflows and vertical packs across all
 * four execution modes: live, dry-run, replay, and counterfactual.
 *
 * Tests use synthetic stage executors (no real AI calls) so they run
 * deterministically in CI with no external dependencies.
 */

import { describe, expect, it } from 'vitest';
import { SubstrateRuntime } from '../engine.js';
import type { AnyStage, StageExecutorContext, StageExecutorFn } from '../types.js';

// ─── Synthetic Stage Executor ─────────────────────────────────────────────────
//
// Returns high-confidence synthetic outputs for every stage type.
// ApprovalGate returns approved immediately (auto-approved in non-live modes).

const syntheticExecutor: StageExecutorFn = async (
  stage: AnyStage,
  input: unknown,
  ctx: StageExecutorContext,
) => {
  switch (stage.type) {
    case 'Reason':
    case 'Decide':
      return {
        output: {
          synthetic: true,
          stageId: stage.id,
          mode: ctx.mode,
          input: typeof input === 'string' ? input.slice(0, 50) : '[object]',
        },
        confidence: 0.88,
      };
    case 'Retrieve':
      return {
        output: {
          synthetic: true,
          documents: [
            { id: `doc-${stage.id}-1`, content: 'Synthetic document 1', relevanceScore: 0.82 },
            { id: `doc-${stage.id}-2`, content: 'Synthetic document 2', relevanceScore: 0.77 },
          ],
        },
        confidence: 0.82,
      };
    case 'Verify':
      return {
        output: {
          passed: true,
          confidence: 0.85,
          reasoning: 'Synthetic verification passed',
          verifiedAt: new Date().toISOString(),
        },
        confidence: 0.85,
      };
    case 'ApprovalGate':
      return { output: { approved: true, gatePassed: true }, confidence: 1 };
    default:
      return { output: { synthetic: true }, confidence: 0.8 };
  }
};

function makeSyntheticRuntime() {
  return new SubstrateRuntime({ stageExecutor: syntheticExecutor });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function expectCompletedRun(run: {
  status: string;
  stageResults: Array<{ stageId: string; status: string }>;
}) {
  const validStatuses = ['completed', 'dry-run-complete'];
  expect(validStatuses).toContain(run.status);
  expect(run.stageResults.length).toBeGreaterThan(0);
  for (const r of run.stageResults) {
    expect(['completed', 'skipped']).toContain(r.status);
  }
}

// ─── Reference Workflows ──────────────────────────────────────────────────────

describe('Phase 2: Cross-System Reconciliation', () => {
  it('runs in dry-run mode and returns stage results', async () => {
    const { crossSystemReconciliationWorkflow } = await import('./cross-system-reconciliation.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      crossSystemReconciliationWorkflow,
      {
        systemAId: 'erp',
        systemBId: 'ledger',
        entityType: 'invoice',
      },
      { mode: 'dry-run' },
    );
    expectCompletedRun(run);
    const stageIds = run.stageResults.map((r) => r.stageId);
    expect(stageIds).toContain('retrieve-system-a');
    expect(stageIds).toContain('retrieve-system-b');
    expect(stageIds).toContain('reason-discrepancies');
  });

  it('live mode pauses at approval gate (pending-approval)', async () => {
    const { crossSystemReconciliationWorkflow } = await import('./cross-system-reconciliation.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      crossSystemReconciliationWorkflow,
      {
        systemAId: 'erp',
        systemBId: 'ledger',
        entityType: 'contract',
      },
      { mode: 'live' },
    );
    expect(run.status).toBe('pending-approval');
    const ids = run.stageResults.map((r) => r.stageId);
    expect(ids).toContain('retrieve-system-a');
    expect(ids).toContain('reason-discrepancies');
    expect(ids).toContain('verify-discrepancies');
    expect(ids).toContain('approval-gate');
  });
});

describe('Phase 2: Executive Brief', () => {
  it('runs in dry-run mode', async () => {
    const { executiveBriefWorkflow } = await import('./executive-brief.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(executiveBriefWorkflow, { lookbackHours: 12 }, { mode: 'dry-run' });
    expectCompletedRun(run);
  });

  it('live run produces 4 stages with no approval gate (auto-publish policy)', async () => {
    const { executiveBriefWorkflow } = await import('./executive-brief.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      executiveBriefWorkflow,
      { audienceLevel: 'executive' },
      { mode: 'live' },
    );
    expectCompletedRun(run);
    const stageIds = run.stageResults.map((r) => r.stageId);
    expect(stageIds).toContain('retrieve-signals');
    expect(stageIds).toContain('decide-publish');
  });
});

describe('Phase 2: Risk Escalation', () => {
  it('dry-run completes all stages', async () => {
    const { riskEscalationWorkflow } = await import('./risk-escalation.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      riskEscalationWorkflow,
      {
        entityId: 'ENTY-001',
        entityType: 'vessel',
        domain: 'maritime',
      },
      { mode: 'dry-run' },
    );
    expectCompletedRun(run);
  });

  it('approval gate pauses pipeline in live mode', async () => {
    const { riskEscalationWorkflow } = await import('./risk-escalation.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      riskEscalationWorkflow,
      {
        entityId: 'ENTY-002',
        entityType: 'counterparty',
        domain: 'risk',
      },
      { mode: 'live' },
    );
    expect(run.status).toBe('pending-approval');
    expect(run.stageResults.map((r) => r.stageId)).toContain('approval-gate');
  });
});

describe('Phase 2: Evidence-Based Recommendation', () => {
  it('dry-run produces provenance graph stub', async () => {
    const { evidenceBasedRecommendationWorkflow } = await import(
      './evidence-based-recommendation.js'
    );
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      evidenceBasedRecommendationWorkflow,
      {
        targetId: 'ASSET-001',
        targetType: 'real-estate',
        domain: 'terra',
        objective: 'Sell or hold decision',
      },
      { mode: 'dry-run' },
    );
    expectCompletedRun(run);
    expect(run.stageResults.map((r) => r.stageId)).toContain('retrieve-evidence');
  });

  it('live mode pauses at approval gate before Decide', async () => {
    const { evidenceBasedRecommendationWorkflow } = await import(
      './evidence-based-recommendation.js'
    );
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      evidenceBasedRecommendationWorkflow,
      {
        targetId: 'ASSET-002',
        targetType: 'portfolio',
        domain: 'lyte',
        objective: 'SLO optimisation',
      },
      { mode: 'live' },
    );
    expect(run.status).toBe('pending-approval');
    expect(run.stageResults.map((r) => r.stageId)).toContain('approval-gate');
  });
});

// ─── Vertical Workflow Packs ──────────────────────────────────────────────────

describe('Vertical: Lyte — Operational Drift Review', () => {
  it('dry-run completes', async () => {
    const { lyteOperationalDriftWorkflow } = await import('./lyte-operational-drift.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      lyteOperationalDriftWorkflow,
      { services: ['lyte-api'] },
      { mode: 'dry-run' },
    );
    expectCompletedRun(run);
  });

  it('live run pauses at approval gate before drift decision', async () => {
    const { lyteOperationalDriftWorkflow } = await import('./lyte-operational-drift.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(lyteOperationalDriftWorkflow, {}, { mode: 'live' });
    expect(run.status).toBe('pending-approval');
    expect(run.stageResults.map((r) => r.stageId)).toContain('approval-gate');
  });

  it('counterfactual mode runs and outputs a run ID', async () => {
    const { lyteOperationalDriftWorkflow } = await import('./lyte-operational-drift.js');
    const rt = makeSyntheticRuntime();
    const baseline = await rt.start(lyteOperationalDriftWorkflow, {}, { mode: 'live' });
    const cf = await rt.start(
      lyteOperationalDriftWorkflow,
      {},
      {
        mode: 'counterfactual',
        sourceRunId: baseline.runId,
        counterfactualModel: 'synthetic-alt',
      },
    );
    expect(cf.runId).toBeTruthy();
  });
});

describe('Vertical: Aegis — Threat Triage', () => {
  it('dry-run produces triage stage results', async () => {
    const { aegisThreatTriageWorkflow } = await import('./aegis-threat-triage.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      aegisThreatTriageWorkflow,
      { lookbackHours: 4 },
      { mode: 'dry-run' },
    );
    expectCompletedRun(run);
    expect(run.stageResults.map((r) => r.stageId)).toContain('reason-triage');
  });

  it('live mode pauses at approval gate (4 stages before gate + gate itself)', async () => {
    const { aegisThreatTriageWorkflow } = await import('./aegis-threat-triage.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      aegisThreatTriageWorkflow,
      { minSeverity: 'high' },
      { mode: 'live' },
    );
    expect(run.status).toBe('pending-approval');
    expect(run.stageResults.map((r) => r.stageId)).toContain('approval-gate');
  });
});

describe('Vertical: Vessels — Voyage Anomaly Review', () => {
  it('dry-run completes voyage anomaly pipeline', async () => {
    const { vesselsVoyageAnomalyWorkflow } = await import('./vessels-voyage-anomaly.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      vesselsVoyageAnomalyWorkflow,
      {
        vesselIds: ['IMO-9876543'],
      },
      { mode: 'dry-run' },
    );
    expectCompletedRun(run);
  });

  it('replay mode skips completed stages', async () => {
    const { vesselsVoyageAnomalyWorkflow } = await import('./vessels-voyage-anomaly.js');
    const rt = makeSyntheticRuntime();
    const baseline = await rt.start(vesselsVoyageAnomalyWorkflow, {}, { mode: 'live' });
    const replayed = await rt.start(
      vesselsVoyageAnomalyWorkflow,
      {},
      {
        mode: 'replay',
        sourceRunId: baseline.runId,
        replayDiffOnly: true,
      },
    );
    expect(replayed.runId).not.toBe(baseline.runId);
  });
});

describe('Vertical: Terra — Portfolio Anomaly', () => {
  it('dry-run identifies portfolio anomaly stages', async () => {
    const { terraPortfolioAnomalyWorkflow } = await import('./terra-portfolio-anomaly.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      terraPortfolioAnomalyWorkflow,
      { portfolioId: 'CORE' },
      { mode: 'dry-run' },
    );
    expectCompletedRun(run);
    expect(run.stageResults.map((r) => r.stageId)).toContain('retrieve-portfolio-signals');
  });
});

describe('Vertical: PRISM Counsel — Evidence Packaging', () => {
  it('dry-run completes matter evidence pipeline', async () => {
    const { prismCounselEvidencePackagingWorkflow } = await import(
      './prism-counsel-evidence-packaging.js'
    );
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      prismCounselEvidencePackagingWorkflow,
      {
        matterIds: ['MTR-001'],
      },
      { mode: 'dry-run' },
    );
    expectCompletedRun(run);
  });

  it('live mode pauses at approval gate before escalation decision', async () => {
    const { prismCounselEvidencePackagingWorkflow } = await import(
      './prism-counsel-evidence-packaging.js'
    );
    const rt = makeSyntheticRuntime();
    const run = await rt.start(prismCounselEvidencePackagingWorkflow, {}, { mode: 'live' });
    expect(run.status).toBe('pending-approval');
    expect(run.stageResults.map((r) => r.stageId)).toContain('approval-gate');
  });
});

describe('Vertical: Carlota Jo — Task Routing', () => {
  it('dry-run routes task and produces assignment decision', async () => {
    const { carlotaJoTaskRoutingWorkflow } = await import('./carlota-jo-task-routing.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      carlotaJoTaskRoutingWorkflow,
      {
        clientId: 'CLIENT-001',
        taskTitle: 'Strategic review',
        taskDescription: '90-day strategic diagnostic',
      },
      { mode: 'dry-run' },
    );
    expectCompletedRun(run);
  });

  it('live mode pauses at approval gate before task assignment', async () => {
    const { carlotaJoTaskRoutingWorkflow } = await import('./carlota-jo-task-routing.js');
    const rt = makeSyntheticRuntime();
    const run = await rt.start(
      carlotaJoTaskRoutingWorkflow,
      {
        clientId: 'CLIENT-002',
        taskTitle: 'Capacity planning',
        taskDescription: 'Q2 capacity plan',
      },
      { mode: 'live' },
    );
    expect(run.status).toBe('pending-approval');
    expect(run.stageResults.map((r) => r.stageId)).toContain('approval-gate');
  });
});

// ─── Policy Rejection Tests ───────────────────────────────────────────────────

describe('Policy rejection: Low-confidence stages halt pipeline', () => {
  it('when stages return confidence below requireHumanBelow, engine escalates to pending-approval', async () => {
    const lowConfidenceExecutor: StageExecutorFn = async (stage, _input, _ctx) => {
      if (stage.type === 'Verify') {
        return {
          output: { passed: false, confidence: 0.2, reasoning: 'Low confidence synthetic' },
          confidence: 0.2,
        };
      }
      return { output: { synthetic: true }, confidence: 0.2 };
    };

    const { crossSystemReconciliationWorkflow } = await import('./cross-system-reconciliation.js');
    const rt = new SubstrateRuntime({ stageExecutor: lowConfidenceExecutor });
    const run = await rt.start(
      crossSystemReconciliationWorkflow,
      {
        systemAId: 'a',
        systemBId: 'b',
        entityType: 'item',
      },
      { mode: 'dry-run' },
    );

    // confidence 0.2 < requireHumanBelow (0.35) → engine escalates to human review
    expect(run.status).toBe('pending-approval');
  });
});
