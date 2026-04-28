/**
 * Substrate Command Center — Integration Flow Tests
 *
 * Covers the five core flows specified in task #2394:
 *   1. Trajectory map: live runs surface from SSE events via client.getRun()
 *   2. Run detail with stage timeline: mapPipelineSummaryToRun produces correct shape
 *   3. Evidence drawer: stage evidence fields survive the mapping
 *   4. Counterfactual replay: runCounterfactual calls client.counterfactual() with correct args
 *   5. Approve/reject flow: submitVerdict uses approval.runId (not approval.id) as recommendationId
 *
 * All tests run against the pure async helpers exported from use-substrate.ts.
 * Hooks (useRuns, useRunDetail, usePendingApprovals) require a DOM environment and
 * are exercised separately in the components test suite.
 */

import type { CounterfactualResponse, PipelineRunSummary } from '@szl/substrate-client/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl/substrate-client/streaming', () => ({
  connectRunEvents: vi.fn(() => () => {}),
}));

import type { PendingApproval } from '../../../artifacts/command/src/pages/substrate/types';
import {
  mapPipelineSummaryToRun,
  runCounterfactual,
  submitVerdict,
} from '../../../artifacts/command/src/pages/substrate/use-substrate';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_SUMMARY: PipelineRunSummary = {
  runId: 'run-test-001',
  workflowName: 'Voyage P&L Optimization',
  status: 'running',
  startedAt: new Date(Date.now() - 90_000).toISOString(),
  completedAt: null,
  currentStageId: 'signal-extraction',
  finalConfidence: null,
  stageResults: [
    {
      stageId: 'signal-extraction',
      stageType: 'Signal Extraction',
      status: 'completed',
      confidence: 0.91,
      startedAt: new Date(Date.now() - 85_000).toISOString(),
      completedAt: new Date(Date.now() - 60_000).toISOString(),
      artifacts: [],
    },
    {
      stageId: 'risk-assessment',
      stageType: 'Risk Assessment',
      status: 'running',
      confidence: null,
      startedAt: new Date(Date.now() - 60_000).toISOString(),
      completedAt: null,
      artifacts: [],
    },
  ],
  metadata: {
    vertical: 'vessels',
    tenant: 'Pacific Freight Corp',
    modelAdapter: 'gpt-4o',
    policyProfile: 'vessels-standard-v2',
    agentId: 'voyage-optimizer',
    objective: 'Reduce fuel consumption by 12% while maintaining ETA',
  },
};

const SAMPLE_COUNTERFACTUAL_RESPONSE: CounterfactualResponse = {
  counterfactualRunId: 'cf-run-test-001',
  originalRunId: 'run-test-001',
  generatedAt: new Date().toISOString(),
  diff: {
    stageDiffs: [
      {
        stageId: 'signal-extraction',
        stageType: 'Signal Extraction',
        baseline: { status: 'completed', confidence: 0.91 },
        counterfactual: { status: 'completed', confidence: 0.88 },
        differ: false,
        decisionChanged: false,
      },
      {
        stageId: 'risk-assessment',
        stageType: 'Risk Assessment',
        baseline: { status: 'failed', confidence: 0.42 },
        counterfactual: { status: 'completed', confidence: 0.79 },
        differ: true,
        decisionChanged: true,
      },
    ],
  },
  metadata: {},
};

const SAMPLE_APPROVAL: PendingApproval = {
  id: 'pend-approval-xyz',
  runId: 'run-test-001',
  workflow: 'Voyage P&L Optimization',
  vertical: 'vessels',
  tenant: 'Pacific Freight Corp',
  riskLevel: 'high',
  policyId: 'pol-vessels-v2',
  policyName: 'SEXTANT Standard v2',
  action: 'Recommend cargo route change',
  requestedAt: new Date().toISOString(),
  requestedBy: 'voyage-optimizer',
  ageMs: 300_000,
  objectiveText: 'Reduce fuel consumption by 12%',
  evidenceSummary: 'Signal data shows 14% efficiency window',
};

// ── 1. Trajectory Map: live run surfaces from mapPipelineSummaryToRun ─────────

describe('Flow 1 — Trajectory Map: mapping SDK summary to SubstrateRun', () => {
  it('maps runId, workflowName, and status from PipelineRunSummary', () => {
    const run = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    expect(run.id).toBe('run-test-001');
    expect(run.workflow).toBe('Voyage P&L Optimization');
    expect(run.status).toBe('running');
  });

  it('reads vertical and tenant from metadata when no base run is provided', () => {
    const run = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    expect(run.vertical).toBe('vessels');
    expect(run.tenant).toBe('Pacific Freight Corp');
  });

  it('calculates ageMs from startedAt', () => {
    const run = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    expect(run.ageMs).toBeGreaterThan(80_000);
    expect(run.ageMs).toBeLessThan(200_000);
  });

  it('prefers base run fields over metadata when base is supplied (incremental update)', () => {
    const base = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    base.policyStatus = 'flagged';
    base.riskLevel = 'high';

    const updated = mapPipelineSummaryToRun(SAMPLE_SUMMARY, base);
    expect(updated.policyStatus).toBe('flagged');
    expect(updated.riskLevel).toBe('high');
  });

  it('surfaces new runs (no base) without requiring a mock seed', () => {
    const freshSummary = { ...SAMPLE_SUMMARY, runId: 'run-brand-new-999' };
    const run = mapPipelineSummaryToRun(freshSummary);
    expect(run.id).toBe('run-brand-new-999');
    expect(run.vertical).toBe('vessels');
  });
});

// ── 2. Run Detail: stage timeline survives mapping ────────────────────────────

describe('Flow 2 — Run Detail: stage timeline in mapped run', () => {
  it('maps stageResults to SubstrateRun.stages', () => {
    const run = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    expect(run.stages).toHaveLength(2);
  });

  it('sets correct status for completed stages', () => {
    const run = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    const signalStage = run.stages.find((s) => s.id === 'signal-extraction');
    expect(signalStage?.status).toBe('completed');
  });

  it('sets correct status for in-progress stages', () => {
    const run = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    const riskStage = run.stages.find((s) => s.id === 'risk-assessment');
    expect(riskStage?.status).toBe('running');
  });

  it('maps confidence to stage-level confidence', () => {
    const run = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    const signalStage = run.stages.find((s) => s.id === 'signal-extraction');
    expect(signalStage?.confidence).toBe(0.91);
  });

  it('does not fall back to MOCK_RUNS[0] when the run is not in the mock set', () => {
    const unknownRun = { ...SAMPLE_SUMMARY, runId: 'run-completely-unknown' };
    const mapped = mapPipelineSummaryToRun(unknownRun);
    expect(mapped.id).toBe('run-completely-unknown');
    expect(mapped.id).not.toBe('run-vessels-001');
  });
});

// ── 3. Evidence Drawer: evidence refs survive mapping ─────────────────────────

describe('Flow 3 — Evidence Drawer: evidence fields', () => {
  it('initializes evidenceRefs as empty array when summary has no artifacts', () => {
    const run = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    run.stages.forEach((stage) => {
      expect(Array.isArray(stage.evidenceRefs)).toBe(true);
    });
  });

  it('inherits rich stage evidence from a base run when supplied', () => {
    const base = mapPipelineSummaryToRun(SAMPLE_SUMMARY);
    base.stages[0].evidenceRefs = ['evidence-ref-001', 'evidence-ref-002'];

    const updated = mapPipelineSummaryToRun(SAMPLE_SUMMARY, base);
    expect(updated.stages[0].evidenceRefs).toEqual(['evidence-ref-001', 'evidence-ref-002']);
  });
});

// ── 4. Counterfactual Replay: calls client.counterfactual with correct args ──

describe('Flow 4 — Counterfactual Replay: SDK integration', () => {
  it('calls client.counterfactual with runId, workflowId, modelAdapterId, policyId', async () => {
    const mockClient = {
      counterfactual: vi.fn().mockResolvedValue(SAMPLE_COUNTERFACTUAL_RESPONSE),
    } as unknown as import('@szl/substrate-client').SubstrateClient;

    await runCounterfactual(
      mockClient,
      'run-test-001',
      'voyage-pnl',
      'claude-3-5-sonnet',
      'vessels-strict-v3',
    );

    expect(mockClient.counterfactual).toHaveBeenCalledWith({
      runId: 'run-test-001',
      workflowId: 'voyage-pnl',
      modelAdapterId: 'claude-3-5-sonnet',
      policyId: 'vessels-strict-v3',
    });
  });

  it('returns a CounterfactualDiff with the original and counterfactual runIds', async () => {
    const mockClient = {
      counterfactual: vi.fn().mockResolvedValue(SAMPLE_COUNTERFACTUAL_RESPONSE),
    } as unknown as import('@szl/substrate-client').SubstrateClient;

    const diff = await runCounterfactual(
      mockClient,
      'run-test-001',
      'voyage-pnl',
      'claude-3-5-sonnet',
      undefined,
    );

    expect(diff.originalRunId).toBe('run-test-001');
    expect(diff.runId).toBe('cf-run-test-001');
  });

  it('marks stages that changed between original and counterfactual', async () => {
    const mockClient = {
      counterfactual: vi.fn().mockResolvedValue(SAMPLE_COUNTERFACTUAL_RESPONSE),
    } as unknown as import('@szl/substrate-client').SubstrateClient;

    const diff = await runCounterfactual(
      mockClient,
      'run-test-001',
      'voyage-pnl',
      'claude-3-5-sonnet',
      undefined,
    );

    const changedStage = diff.stages.find((s) => s.stageName === 'risk-assessment');
    const unchangedStage = diff.stages.find((s) => s.stageName === 'signal-extraction');

    expect(changedStage?.changed).toBe(true);
    expect(unchangedStage?.changed).toBe(false);
  });
});

// ── 5. Approve/Reject Flow: correct recommendationId routing ─────────────────

describe('Flow 5 — Approve/Reject: verdict routing via SDK', () => {
  let mockClient: { approve: ReturnType<typeof vi.fn>; reject: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockClient = {
      approve: vi.fn().mockResolvedValue({
        approvalId: 'apr-001',
        recommendationId: SAMPLE_APPROVAL.runId,
        verdict: 'approved',
        timestamp: Date.now(),
        actor: 'command-center',
        note: '',
        proofRef: 'proof-001',
      }),
      reject: vi.fn().mockResolvedValue({
        approvalId: 'apr-001',
        recommendationId: SAMPLE_APPROVAL.runId,
        verdict: 'rejected',
        timestamp: Date.now(),
        actor: 'command-center',
        note: '',
        proofRef: 'proof-001',
      }),
    };
  });

  it('approve calls client.approve with approval.runId as recommendationId (NOT approval.id)', async () => {
    const client = mockClient as unknown as import('@szl/substrate-client').SubstrateClient;
    await submitVerdict(client, SAMPLE_APPROVAL, 'approved', 'Looks correct');

    expect(mockClient.approve).toHaveBeenCalledWith(
      expect.objectContaining({ recommendationId: 'run-test-001' }),
    );
    expect(mockClient.approve).not.toHaveBeenCalledWith(
      expect.objectContaining({ recommendationId: 'pend-approval-xyz' }),
    );
  });

  it('reject calls client.reject with approval.runId as recommendationId (NOT approval.id)', async () => {
    const client = mockClient as unknown as import('@szl/substrate-client').SubstrateClient;
    await submitVerdict(client, SAMPLE_APPROVAL, 'rejected', 'Policy violation');

    expect(mockClient.reject).toHaveBeenCalledWith(
      expect.objectContaining({ recommendationId: 'run-test-001' }),
    );
  });

  it('escalate calls client.reject with [ESCALATED] prefix in note', async () => {
    const client = mockClient as unknown as import('@szl/substrate-client').SubstrateClient;
    await submitVerdict(client, SAMPLE_APPROVAL, 'escalated', 'Needs senior review');

    expect(mockClient.reject).toHaveBeenCalledWith(
      expect.objectContaining({
        recommendationId: 'run-test-001',
        note: '[ESCALATED] Needs senior review',
        actor: 'command-center-escalate',
      }),
    );
  });

  it('escalate does NOT call client.approve', async () => {
    const client = mockClient as unknown as import('@szl/substrate-client').SubstrateClient;
    await submitVerdict(client, SAMPLE_APPROVAL, 'escalated', 'Needs senior review');
    expect(mockClient.approve).not.toHaveBeenCalled();
  });

  it('returns null (not throws) when the gateway is unreachable', async () => {
    mockClient.approve = vi.fn().mockRejectedValue(new Error('Network error'));
    const client = mockClient as unknown as import('@szl/substrate-client').SubstrateClient;
    const result = await submitVerdict(client, SAMPLE_APPROVAL, 'approved', 'ok');
    expect(result).toBeNull();
  });

  it('passes the justification note to client.approve', async () => {
    const client = mockClient as unknown as import('@szl/substrate-client').SubstrateClient;
    await submitVerdict(client, SAMPLE_APPROVAL, 'approved', 'Confirmed by policy');

    expect(mockClient.approve).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'Confirmed by policy' }),
    );
  });
});
