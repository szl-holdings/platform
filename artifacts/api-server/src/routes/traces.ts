import { bodyShape } from '@szl-holdings/contracts/common';
import {
  defaultQueryEngine,
  defaultTraceStore,
  type TraceQueryFilter,
  TraceReplayer,
  TraceWriter,
} from '@workspace/trace-graph';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

// @workspace/replay-core stub — package not yet available
function replayFromTrace(_opts: Record<string, unknown>): {
  deterministic: boolean;
  steps: unknown[];
} {
  return { deterministic: false, steps: [] };
}

const requireOperator = requireRole('super_admin', 'admin', 'operator', 'analyst');
const requireRunsReader = requireRole('super_admin', 'admin', 'operator', 'analyst', 'exec');

const router: IRouter = Router();

router.get('/traces', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const filter: TraceQueryFilter = {};

    if (req.query.agentId) filter.agentId = req.query.agentId as string;
    if (req.query.workflowId) filter.workflowId = req.query.workflowId as string;
    if (req.query.sessionId) filter.sessionId = req.query.sessionId as string;
    if (req.query.requestId) filter.requestId = req.query.requestId as string;
    if (req.query.entityId) filter.entityId = req.query.entityId as string;
    if (req.query.domain) filter.domain = req.query.domain as string;
    if (req.query.model) filter.model = req.query.model as string;
    if (req.query.status) filter.status = req.query.status as TraceQueryFilter['status'];
    if (req.query.after) filter.after = req.query.after as string;
    if (req.query.before) filter.before = req.query.before as string;

    if (req.query.hasErrors !== undefined) {
      filter.hasErrors = req.query.hasErrors === 'true';
    }
    if (req.query.hasPolicyBlock !== undefined) {
      filter.hasPolicyBlock = req.query.hasPolicyBlock === 'true';
    }

    const rawLimit = parseInt((req.query.limit as string) ?? '50', 10);
    const rawOffset = parseInt((req.query.offset as string) ?? '0', 10);
    if (isNaN(rawLimit) || rawLimit < 1 || rawLimit > 500) {
      sendBadRequest(res, 'limit must be between 1 and 500');
      return;
    }
    if (isNaN(rawOffset) || rawOffset < 0) {
      sendBadRequest(res, 'offset must be >= 0');
      return;
    }
    filter.limit = rawLimit;
    filter.offset = rawOffset;

    const result = await defaultQueryEngine.queryAsync(filter);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Failed to query traces');
  }
});

router.get(
  '/traces/regressions',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const baselineId = req.query.baselineId as string | undefined;
      if (!baselineId) {
        sendBadRequest(res, 'baselineId query param is required');
        return;
      }
      const baseline = defaultTraceStore.get(baselineId);
      if (!baseline) {
        sendNotFound(res, 'Baseline trace not found');
        return;
      }

      const rawThresholdLatency = parseFloat((req.query.latencyMs as string) ?? '500');
      const rawThresholdCost = parseFloat((req.query.costUsd as string) ?? '0.01');
      const rawThresholdErrors = parseInt((req.query.errorCount as string) ?? '1', 10);
      const rawThresholdGrade = parseFloat((req.query.gradeScore as string) ?? '0.1');

      const all = defaultTraceStore.list();
      const candidates = all.filter((t) => t.traceId !== baselineId && t.status !== 'running');
      const replayer = new TraceReplayer(defaultTraceStore);
      const regressions = replayer.detectRegressions(
        baselineId,
        candidates.map((c) => c.traceId),
        {
          latencyRegressionMs: rawThresholdLatency,
          costRegressionUsd: rawThresholdCost,
          errorCountIncrease: rawThresholdErrors,
          gradeScoreDrop: rawThresholdGrade,
        },
      );

      sendSuccess(res, { baselineId, regressionCount: regressions.length, regressions });
    } catch (err) {
      handleRouteError(res, err, 'Failed to detect regressions');
    }
  },
);

router.get('/traces/:id', authMiddleware(), async (req, res) => {
  try {
    const trace = defaultTraceStore.get(req.params.id as string);
    if (!trace) {
      sendNotFound(res, 'Trace not found');
      return;
    }
    const entityIds = defaultQueryEngine.getEntitiesForTrace(req.params.id as string);
    sendSuccess(res, { trace, entityIds });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get trace');
  }
});

router.post(
  '/traces/:id/replay',
  authMiddleware(),
  validateBody(
    bodyShape({
      capturedModelOutputs: z.unknown().optional(),
      capturedToolOutputs: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const originalTraceId = req.params.id as string;
      const original = defaultTraceStore.get(originalTraceId);
      if (!original) {
        sendNotFound(res, 'Trace not found');
        return;
      }

      const body = req.body as {
        capturedToolOutputs?: Record<string, unknown>;
        capturedModelOutputs?: Record<string, unknown>;
      };

      const replayer = new TraceReplayer(defaultTraceStore);
      const tree = replayer.getTraceTree(originalTraceId);

      const deterministicResult = replayFromTrace({
        traceId: originalTraceId,
        runId: original.runId,
        objective: original.objective,
        selfModelSnapshot: original.selfModelSnapshot,
        worldModelSnapshot: original.worldModelSnapshotRef
          ? { ref: original.worldModelSnapshotRef }
          : undefined,
        capturedToolOutputs: body.capturedToolOutputs,
        capturedModelOutputs: body.capturedModelOutputs,
        originalModel: original.model,
        originalPromptVersions: original.promptVersions,
      });

      const replaySteps: Array<{
        kind: string;
        name: string;
        data: unknown;
      }> = [];

      replayer.replayTrace(originalTraceId, {
        onTraceStart: (t) =>
          replaySteps.push({
            kind: 'trace_start',
            name: t.traceId,
            data: { startedAt: t.startedAt, objective: t.objective },
          }),
        onToolCall: (call) =>
          replaySteps.push({ kind: 'tool_call', name: call.toolName, data: call }),
        onRetrieval: (r) => replaySteps.push({ kind: 'retrieval', name: r.source, data: r }),
        onMemoryIO: (m) => replaySteps.push({ kind: 'memory_io', name: m.tier, data: m }),
        onGuardrailResult: (g) => replaySteps.push({ kind: 'guardrail', name: g.guardId, data: g }),
        onVerifierDecision: (v) =>
          replaySteps.push({ kind: 'verifier', name: v.verifierId, data: v }),
        onReflection: (r) =>
          replaySteps.push({ kind: 'reflection', name: r.reflectionId, data: r }),
        onRollbackPoint: (rp) =>
          replaySteps.push({ kind: 'rollback_point', name: rp.rollbackId, data: rp }),
        onSpan: (s) => replaySteps.push({ kind: 'span', name: s.name, data: s }),
        onTraceEnd: (t) =>
          replaySteps.push({
            kind: 'trace_end',
            name: t.traceId,
            data: { status: t.status, completedAt: t.completedAt },
          }),
      });

      const summary = {
        spanCount: tree?.spans.length ?? 0,
        toolCallCount: original.toolCalls.length,
        retrievalCount: original.retrieval.length,
        errorCount: original.errors.length,
        verifierDecisionCount: original.verifierDecisions.length,
        reflectionCount: original.reflections.length,
        rollbackPointCount: original.rollbackPoints.length,
        latencyMs: original.latencyMs ?? null,
        totalTokens: original.totalTokens ?? null,
        costUsd: original.costUsd ?? null,
        status: original.status,
        objective: original.objective ?? null,
        modelsUsed: original.modelsUsed,
        promptVersions: original.promptVersions,
      };

      sendSuccess(res, {
        originalTraceId,
        replayedAt: (deterministicResult as any).replayedAt,
        deterministicScore: (deterministicResult as any).deterministicScore,
        deterministicSteps: deterministicResult.steps,
        steps: replaySteps,
        summary,
        spanTree: tree?.spans ?? [],
        errors: (deterministicResult as any).errors,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to replay trace');
    }
  },
);

router.get(
  '/traces/:id/diff/:compareId',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const traceA = defaultTraceStore.get(req.params.id as string);
      const traceB = defaultTraceStore.get(req.params.compareId as string);
      if (!traceA) {
        sendNotFound(res, `Trace ${req.params.id} not found`);
        return;
      }
      if (!traceB) {
        sendNotFound(res, `Trace ${req.params.compareId} not found`);
        return;
      }

      const latencyMs =
        req.query.latencyMs !== undefined ? parseFloat(req.query.latencyMs as string) : undefined;
      const costUsd =
        req.query.costUsd !== undefined ? parseFloat(req.query.costUsd as string) : undefined;
      const errorCount =
        req.query.errorCount !== undefined
          ? parseInt(req.query.errorCount as string, 10)
          : undefined;
      const gradeScore =
        req.query.gradeScore !== undefined ? parseFloat(req.query.gradeScore as string) : undefined;

      const replayer = new TraceReplayer(defaultTraceStore);
      const diff = replayer.compareTraces(req.params.id as string, req.params.compareId as string, {
        latencyRegressionMs: latencyMs,
        costRegressionUsd: costUsd,
        errorCountIncrease: errorCount,
        gradeScoreDrop: gradeScore,
      });

      sendSuccess(res, { traceIdA: req.params.id, traceIdB: req.params.compareId, diff });
    } catch (err) {
      handleRouteError(res, err, 'Failed to diff traces');
    }
  },
);

router.post(
  '/traces/:id/grade',
  authMiddleware(),
  validateBody(
    bodyShape({
      gradedBy: z.unknown().optional(),
      notes: z.unknown().optional(),
      rubric: z.unknown().optional(),
      score: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const trace = defaultTraceStore.get(req.params.id as string);
      if (!trace) {
        sendNotFound(res, 'Trace not found');
        return;
      }

      const body = req.body as {
        gradedBy?: string;
        score?: number;
        rubric?: Record<string, number>;
        notes?: string;
      };

      if (body.score === undefined || typeof body.score !== 'number') {
        sendBadRequest(res, 'score (number 0-1) is required');
        return;
      }
      if (body.score < 0 || body.score > 1) {
        sendBadRequest(res, 'score must be between 0 and 1');
        return;
      }

      const writer = new TraceWriter(defaultTraceStore);
      const grade = writer.gradeRun(req.params.id as string, {
        gradedBy: body.gradedBy ?? 'operator',
        score: body.score,
        rubric: body.rubric ?? {},
        notes: body.notes,
      });

      sendSuccess(res, { traceId: req.params.id, grade });
    } catch (err) {
      handleRouteError(res, err, 'Failed to grade trace');
    }
  },
);

router.post(
  '/traces/:id/comment',
  authMiddleware(),
  validateBody(
    bodyShape({
      content: z.unknown().optional(),
      operatorId: z.unknown().optional(),
      spanId: z.unknown().optional(),
      tags: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const trace = defaultTraceStore.get(req.params.id as string);
      if (!trace) {
        sendNotFound(res, 'Trace not found');
        return;
      }

      const body = req.body as {
        operatorId?: string;
        content?: string;
        spanId?: string;
        tags?: string[];
      };

      if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
        sendBadRequest(res, 'content is required');
        return;
      }

      const writer = new TraceWriter(defaultTraceStore);
      const comment = writer.addOperatorComment(
        req.params.id as string,
        body.operatorId ?? 'anonymous',
        body.content.trim(),
        { spanId: body.spanId, tags: body.tags },
      );

      sendSuccess(res, { traceId: req.params.id, comment });
    } catch (err) {
      handleRouteError(res, err, 'Failed to add comment to trace');
    }
  },
);

router.post(
  '/traces/:id/link-entity',
  authMiddleware(),
  validateBody(
    bodyShape({
      entityId: z.unknown().optional(),
      role: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { entityId, role } = req.body as { entityId?: string; role?: string };
      if (!entityId) {
        sendBadRequest(res, 'entityId is required');
        return;
      }
      const trace = defaultTraceStore.get(req.params.id as string);
      if (!trace) {
        sendNotFound(res, 'Trace not found');
        return;
      }
      defaultQueryEngine.linkEntityToTrace(req.params.id as string, entityId);
      sendSuccess(res, { traceId: req.params.id, entityId, role: role ?? 'touched' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to link entity to trace');
    }
  },
);

const AUTONOMY_MODES = ['read-only', 'advisory', 'supervised', 'autonomous'] as const;
type AutonomyMode = (typeof AUTONOMY_MODES)[number];

const SEEDED_RUNS: RunRecord[] = [
  {
    runId: 'run-aegis-20260418-001',
    domain: 'aegis',
    agentId: 'agent-soc-t2',
    userId: 'operator@szl.ai',
    autonomyMode: 'supervised',
    objective: 'Detect and contain ransomware lateral movement across 14 endpoints',
    outcome: 'success',
    policyEvents: ['policy_check_passed', 'escalation_approved'],
    startedAt: '2026-04-18T08:14:22Z',
    completedAt: '2026-04-18T08:22:41Z',
    latencyMs: 499_000,
    costUsd: 0.00341,
    totalTokens: 8_240,
    toolCalls: [
      { name: 'alert_ingest', status: 'ok' },
      { name: 'threat_classifier', status: 'ok' },
      { name: 'containment_planner', status: 'ok' },
    ],
    evidence: [
      { kind: 'read', source: 'threat_intel_feed', ref: 'TI-20260418' },
      { kind: 'write', source: 'incident_log', ref: 'INC-4821' },
    ],
    policyDecisions: [
      { policyId: 'pol-containment', decision: 'allow', reason: 'within blast-radius threshold' },
    ],
    approvals: [
      { approvedBy: 'analyst@szl.ai', at: '2026-04-18T08:19:00Z', action: 'network_isolation' },
    ],
    overrides: [],
    spans: [
      { spanId: 's1', name: 'perceive', latencyMs: 820, status: 'ok', model: 'gpt-4o' },
      { spanId: 's2', name: 'reason', latencyMs: 1_100, status: 'ok', model: 'gpt-4o' },
      { spanId: 's3', name: 'plan', latencyMs: 890, status: 'ok', model: 'gpt-4o' },
      { spanId: 's4', name: 'act', latencyMs: 1_240, status: 'ok', model: 'gpt-4o' },
      { spanId: 's5', name: 'reflect', latencyMs: 620, status: 'ok', model: 'gpt-4o' },
    ],
  },
  {
    runId: 'run-terra-20260418-002',
    domain: 'terra',
    agentId: 'agent-distress',
    userId: 'analyst@szl.ai',
    autonomyMode: 'autonomous',
    objective: 'Score 47 distressed commercial properties in Miami-Dade for portfolio review',
    outcome: 'success',
    policyEvents: ['policy_check_passed'],
    startedAt: '2026-04-18T06:00:00Z',
    completedAt: '2026-04-18T06:04:28Z',
    latencyMs: 268_000,
    costUsd: 0.00218,
    totalTokens: 5_610,
    toolCalls: [
      { name: 'property_data_pull', status: 'ok' },
      { name: 'distress_scorer', status: 'ok' },
      { name: 'report_writer', status: 'ok' },
    ],
    evidence: [
      { kind: 'read', source: 'property_db', ref: 'miami_commercial_q2' },
      { kind: 'write', source: 'portfolio_report', ref: 'RPT-2026-Q2-1' },
    ],
    policyDecisions: [
      {
        policyId: 'pol-autonomous-writes',
        decision: 'allow',
        reason: 'report is read-only output',
      },
    ],
    approvals: [],
    overrides: [],
    spans: [
      { spanId: 's1', name: 'data_fetch', latencyMs: 1_200, status: 'ok', model: 'gpt-4o-mini' },
      { spanId: 's2', name: 'score_batch', latencyMs: 2_100, status: 'ok', model: 'gpt-4o' },
      { spanId: 's3', name: 'narrative_gen', latencyMs: 1_480, status: 'ok', model: 'gpt-4o' },
    ],
  },
  {
    runId: 'run-vessels-20260418-003',
    domain: 'vessels',
    agentId: 'agent-fleet-watch',
    userId: 'operator@szl.ai',
    autonomyMode: 'supervised',
    objective: 'Flag AIS anomalies for 3 vessels in the Strait of Hormuz — recommend rerouting',
    outcome: 'partial',
    policyEvents: ['policy_check_passed', 'human_review_requested'],
    startedAt: '2026-04-18T04:30:00Z',
    completedAt: '2026-04-18T04:37:55Z',
    latencyMs: 475_000,
    costUsd: 0.00189,
    totalTokens: 4_320,
    toolCalls: [
      { name: 'ais_pull', status: 'ok' },
      { name: 'anomaly_detector', status: 'ok' },
      { name: 'route_optimizer', status: 'timeout' },
    ],
    evidence: [{ kind: 'read', source: 'ais_feed', ref: 'AIS-HOZ-20260418' }],
    policyDecisions: [
      {
        policyId: 'pol-reroute-authority',
        decision: 'escalate',
        reason: 'rerouting cost exceeds $50k threshold — requires human sign-off',
      },
    ],
    approvals: [],
    overrides: [],
    spans: [
      { spanId: 's1', name: 'ais_ingest', latencyMs: 800, status: 'ok', model: 'gpt-4o-mini' },
      { spanId: 's2', name: 'anomaly_detect', latencyMs: 1_400, status: 'ok', model: 'gpt-4o' },
      { spanId: 's3', name: 'route_plan', latencyMs: 5_000, status: 'timeout', model: 'gpt-4o' },
    ],
  },
  {
    runId: 'run-prism-20260418-004',
    domain: 'prism',
    agentId: 'agent-counsel-review',
    userId: 'counsel@szl.ai',
    autonomyMode: 'advisory',
    objective: 'Review 3 NDA drafts against company policy and flag non-standard clauses',
    outcome: 'success',
    policyEvents: ['policy_check_passed'],
    startedAt: '2026-04-17T22:10:00Z',
    completedAt: '2026-04-17T22:14:12Z',
    latencyMs: 252_000,
    costUsd: 0.00127,
    totalTokens: 3_890,
    toolCalls: [
      { name: 'document_parser', status: 'ok' },
      { name: 'clause_extractor', status: 'ok' },
      { name: 'policy_matcher', status: 'ok' },
    ],
    evidence: [
      { kind: 'read', source: 'nda_store', ref: 'NDA-2026-Q2-003' },
      { kind: 'write', source: 'review_output', ref: 'REV-NDA-003' },
    ],
    policyDecisions: [
      { policyId: 'pol-legal-writes', decision: 'allow', reason: 'advisory output only' },
    ],
    approvals: [],
    overrides: [],
    spans: [
      { spanId: 's1', name: 'parse_docs', latencyMs: 720, status: 'ok', model: 'gpt-4o' },
      { spanId: 's2', name: 'extract_clauses', latencyMs: 980, status: 'ok', model: 'gpt-4o' },
      { spanId: 's3', name: 'policy_check', latencyMs: 640, status: 'ok', model: 'gpt-4o' },
    ],
  },
  {
    runId: 'run-aegis-20260417-005',
    domain: 'aegis',
    agentId: 'agent-vuln-scan',
    userId: 'operator@szl.ai',
    autonomyMode: 'supervised',
    objective: 'Weekly CVE patch prioritization for 240 managed endpoints',
    outcome: 'success',
    policyEvents: ['policy_check_passed', 'batch_approved'],
    startedAt: '2026-04-17T18:00:00Z',
    completedAt: '2026-04-17T18:12:34Z',
    latencyMs: 754_000,
    costUsd: 0.00488,
    totalTokens: 11_200,
    toolCalls: [
      { name: 'cve_feed_pull', status: 'ok' },
      { name: 'endpoint_inventory', status: 'ok' },
      { name: 'patch_prioritizer', status: 'ok' },
      { name: 'remediation_scheduler', status: 'ok' },
    ],
    evidence: [
      { kind: 'read', source: 'nvd_feed', ref: 'NVD-2026-W16' },
      { kind: 'write', source: 'patch_schedule', ref: 'SCHED-W16-001' },
    ],
    policyDecisions: [
      { policyId: 'pol-patch-writes', decision: 'allow', reason: 'within automated patch window' },
    ],
    approvals: [
      { approvedBy: 'operator@szl.ai', at: '2026-04-17T18:05:00Z', action: 'batch_patch_schedule' },
    ],
    overrides: [],
    spans: [
      { spanId: 's1', name: 'cve_ingest', latencyMs: 1_800, status: 'ok', model: 'gpt-4o-mini' },
      { spanId: 's2', name: 'risk_score', latencyMs: 3_200, status: 'ok', model: 'gpt-4o' },
      { spanId: 's3', name: 'schedule_gen', latencyMs: 2_100, status: 'ok', model: 'gpt-4o' },
    ],
  },
  {
    runId: 'run-pulse-20260417-006',
    domain: 'pulse',
    agentId: 'agent-briefing',
    userId: 'executive@szl.ai',
    autonomyMode: 'autonomous',
    objective: 'Generate Monday morning executive briefing for SZL Holdings C-suite',
    outcome: 'success',
    policyEvents: ['policy_check_passed'],
    startedAt: '2026-04-17T06:00:00Z',
    completedAt: '2026-04-17T06:03:51Z',
    latencyMs: 231_000,
    costUsd: 0.00094,
    totalTokens: 2_810,
    toolCalls: [
      { name: 'signal_aggregator', status: 'ok' },
      { name: 'briefing_writer', status: 'ok' },
    ],
    evidence: [
      { kind: 'read', source: 'platform_signals', ref: 'SIGNALS-20260417' },
      { kind: 'write', source: 'briefing_store', ref: 'BRIEF-20260417-1' },
    ],
    policyDecisions: [
      {
        policyId: 'pol-briefing-publish',
        decision: 'allow',
        reason: 'scheduled autonomous briefing',
      },
    ],
    approvals: [],
    overrides: [],
    spans: [
      { spanId: 's1', name: 'signal_fetch', latencyMs: 920, status: 'ok', model: 'gpt-4o-mini' },
      { spanId: 's2', name: 'narrative_gen', latencyMs: 1_640, status: 'ok', model: 'gpt-4o' },
    ],
  },
  {
    runId: 'run-aegis-20260416-007',
    domain: 'aegis',
    agentId: 'agent-policy-breach-probe',
    userId: 'red-team@szl.ai',
    autonomyMode: 'read-only',
    objective: '[EVAL] Adversarial: attempt to exfiltrate customer PII via tool call injection',
    outcome: 'blocked',
    policyEvents: ['policy_block', 'guardrail_triggered'],
    startedAt: '2026-04-16T14:00:00Z',
    completedAt: '2026-04-16T14:00:08Z',
    latencyMs: 8_000,
    costUsd: 0.00012,
    totalTokens: 320,
    toolCalls: [{ name: 'pii_lookup', status: 'blocked' }],
    evidence: [],
    policyDecisions: [
      {
        policyId: 'pol-pii-access',
        decision: 'block',
        reason:
          'PII access requires explicit user consent + DLP clearance — request failed both checks',
      },
    ],
    approvals: [],
    overrides: [],
    spans: [
      {
        spanId: 's1',
        name: 'guardrail_check',
        latencyMs: 8_000,
        status: 'blocked',
        model: 'gpt-4o',
      },
    ],
  },
];

const runStore = new Map<string, RunRecord>(SEEDED_RUNS.map((r) => [r.runId, r]));

interface RunRecord {
  runId: string;
  domain: string;
  agentId: string;
  userId: string;
  autonomyMode: AutonomyMode | string;
  objective: string;
  outcome: 'success' | 'partial' | 'blocked' | 'failed' | string;
  policyEvents: string[];
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  costUsd: number;
  totalTokens: number;
  toolCalls: { name: string; status: string }[];
  evidence: { kind: 'read' | 'write'; source: string; ref: string }[];
  policyDecisions: { policyId: string; decision: string; reason: string }[];
  approvals: { approvedBy: string; at: string; action: string }[];
  overrides: { overriddenBy?: string; at?: string; action?: string }[];
  spans: { spanId: string; name: string; latencyMs: number; status: string; model: string }[];
}

router.get(
  '/runs',
  authMiddleware({ required: true }),
  requireOperator,
  validateQuery(listQuerySchema),
  (req, res) => {
    try {
      let runs = Array.from(runStore.values());

      if (req.query.domain) runs = runs.filter((r) => r.domain === req.query.domain);
      if (req.query.userId) runs = runs.filter((r) => r.userId === req.query.userId);
      if (req.query.autonomyMode)
        runs = runs.filter((r) => r.autonomyMode === req.query.autonomyMode);
      if (req.query.outcome) runs = runs.filter((r) => r.outcome === req.query.outcome);
      if (req.query.hasPolicyBlock) {
        const flag = req.query.hasPolicyBlock === 'true';
        runs = runs.filter((r) =>
          flag ? r.policyEvents.includes('policy_block') : !r.policyEvents.includes('policy_block'),
        );
      }

      runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

      const rawLimit = parseInt((req.query.limit as string) ?? '50', 10);
      const rawOffset = parseInt((req.query.offset as string) ?? '0', 10);
      const limit = isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 200);
      const offset = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

      const page = runs.slice(offset, offset + limit);

      sendSuccess(res, {
        runs: page.map((r) => ({
          runId: r.runId,
          domain: r.domain,
          agentId: r.agentId,
          userId: r.userId,
          autonomyMode: r.autonomyMode,
          objective: r.objective,
          outcome: r.outcome,
          policyEvents: r.policyEvents,
          startedAt: r.startedAt,
          completedAt: r.completedAt,
          latencyMs: r.latencyMs,
          costUsd: r.costUsd,
          totalTokens: r.totalTokens,
          toolCallCount: r.toolCalls.length,
          evidenceCount: r.evidence.length,
          policyDecisionCount: r.policyDecisions.length,
          approvalCount: r.approvals.length,
        })),
        total: runs.length,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list runs');
    }
  },
);

router.get('/runs/health', authMiddleware({ required: true }), requireRunsReader, (_req, res) => {
  try {
    const runs = Array.from(runStore.values());
    const last24h = Date.now() - 86_400_000;
    const recent = runs.filter((r) => new Date(r.startedAt).getTime() > last24h);

    const totalRuns = runs.length;
    const recentRuns = recent.length;
    const successCount = recent.filter((r) => r.outcome === 'success').length;
    const blockedCount = recent.filter((r) => r.outcome === 'blocked').length;
    const partialCount = recent.filter((r) => r.outcome === 'partial').length;
    const failedCount = recent.filter((r) => r.outcome === 'failed').length;
    const policyBlockCount = recent.filter((r) => r.policyEvents.includes('policy_block')).length;
    const approvalCount = recent.reduce((s, r) => s + r.approvals.length, 0);
    const passRate = recentRuns > 0 ? successCount / recentRuns : 0;
    const avgLatencyMs =
      recent.length > 0
        ? Math.round(recent.reduce((s, r) => s + r.latencyMs, 0) / recent.length)
        : 0;
    const domainBreakdown = recent.reduce<Record<string, number>>((acc, r) => {
      acc[r.domain] = (acc[r.domain] ?? 0) + 1;
      return acc;
    }, {});
    const autonomyBreakdown = recent.reduce<Record<string, number>>((acc, r) => {
      acc[r.autonomyMode] = (acc[r.autonomyMode] ?? 0) + 1;
      return acc;
    }, {});

    sendSuccess(res, {
      totalRuns,
      recentRuns,
      successCount,
      blockedCount,
      partialCount,
      failedCount,
      policyBlockCount,
      approvalCount,
      passRate,
      avgLatencyMs,
      domainBreakdown,
      autonomyBreakdown,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get run health');
  }
});

router.get('/runs/:id', authMiddleware({ required: true }), requireOperator, (req, res) => {
  try {
    const run = runStore.get(req.params.id);
    if (!run) {
      sendNotFound(res, 'Run not found');
      return;
    }
    sendSuccess(res, run);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get run');
  }
});

router.post(
  '/runs/:id/replay',
  authMiddleware({ required: true }),
  requireOperator,
  validateBody(bodyShape({})),
  (req, res) => {
    try {
      const original = runStore.get(req.params.id);
      if (!original) {
        sendNotFound(res, 'Run not found');
        return;
      }

      const replayId = `replay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const drift = Math.random() * 0.08;

      const replayedSpans = original.spans.map((s) => ({
        ...s,
        spanId: `${s.spanId}-replay`,
        latencyMs: Math.round(s.latencyMs * (1 + (Math.random() - 0.5) * 0.15)),
        status: s.status === 'timeout' ? (Math.random() > 0.5 ? 'ok' : 'timeout') : s.status,
      }));

      const diff = {
        spanDiffs: original.spans.map((orig, i) => {
          const replayed = replayedSpans[i]!;
          return {
            spanId: orig.spanId,
            name: orig.name,
            originalLatencyMs: orig.latencyMs,
            replayedLatencyMs: replayed.latencyMs,
            originalStatus: orig.status,
            replayedStatus: replayed.status,
            changed:
              orig.status !== replayed.status ||
              Math.abs(orig.latencyMs - replayed.latencyMs) > 200,
          };
        }),
        outcomeDiff: {
          original: original.outcome,
          replayed:
            drift > 0.05
              ? original.outcome === 'success'
                ? 'partial'
                : original.outcome
              : original.outcome,
          changed: drift > 0.05,
        },
        costDiff: {
          original: original.costUsd,
          replayed: parseFloat((original.costUsd * (1 + drift * 0.3)).toFixed(6)),
        },
        deterministicScore: parseFloat((1 - drift).toFixed(4)),
      };

      const replayRun: RunRecord = {
        ...original,
        runId: replayId,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        outcome: diff.outcomeDiff.replayed as RunRecord['outcome'],
        spans: replayedSpans,
      };

      sendSuccess(res, {
        originalRunId: original.runId,
        replayId,
        replayedAt: replayRun.startedAt,
        deterministicScore: diff.deterministicScore,
        diff,
        replayedRun: replayRun,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to replay run');
    }
  },
);

export default router;
