/**
 * Control Tower — Substrate Run + Replay Endpoints
 *
 * POST /control-tower/substrate/run    — execute a workflow on the substrate
 * POST /control-tower/substrate/replay — replay/counterfactual against a past run
 * GET  /control-tower/substrate/run/:runId
 * GET  /control-tower/substrate/metrics
 *
 * Authentication: operator-tier enforced via authMiddleware + requireRole("ops", "admin")
 * applied to each route handler.
 */

import type { AnyStage, StageExecutorContext, StageExecutorFn } from '@szl/substrate';
import type { IRouter } from 'express';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../../middlewares/auth';

// ─── Synthetic Stage Executor (API-safe) ─────────────────────────────────────
//
// Used for all /substrate/run calls. Returns deterministic outputs so the
// pipeline completes without requiring registered AI adapters.

const syntheticExecutor: StageExecutorFn = async (
  stage: AnyStage,
  _input: unknown,
  ctx: StageExecutorContext,
) => {
  switch (stage.type) {
    case 'Reason':
    case 'Decide':
      return {
        output: {
          synthetic: true,
          stageId: stage.id,
          workflowId: ctx.workflowId,
          mode: ctx.mode,
          reasoning: `Synthetic ${stage.type} output for governed substrate run`,
        },
        confidence: 0.84,
      };
    case 'Retrieve': {
      // Surface the same retrieverSource shape the Python retrieval stage emits,
      // so the operator UI can label dry-run / replay results as non-live evidence.
      const retrieverAdapterId =
        (stage as { retrieverAdapterId?: string }).retrieverAdapterId ?? null;
      const retrieverSource = ctx.mode === 'dry-run' ? 'dry-run' : 'synthetic';
      return {
        output: {
          synthetic: true,
          documents: [
            { id: `doc-${stage.id}-1`, content: 'Synthetic document A', relevanceScore: 0.82 },
            { id: `doc-${stage.id}-2`, content: 'Synthetic document B', relevanceScore: 0.77 },
          ],
          totalRetrieved: 2,
          retrieverSource,
          retrieverAdapterId,
        },
        confidence: 0.9,
      };
    }
    case 'ToolCall':
      return {
        output: { synthetic: true, stageId: stage.id, toolResult: 'dry-run suppressed' },
        confidence: 0.88,
      };
    case 'Verify':
      return {
        output: {
          verified: true,
          synthetic: true,
          stageId: stage.id,
          verificationNotes: 'Synthetic verification pass',
        },
        confidence: 0.86,
      };
    case 'ApprovalGate':
      return {
        output: {
          approved: ctx.mode !== 'live',
          approvalId: `approval-${stage.id}-${Date.now().toString(36)}`,
          approvedBy: ctx.mode !== 'live' ? 'system-dry-run' : undefined,
          pendingApproval: ctx.mode === 'live',
          inboxRef: `${ctx.workflowId}/${stage.id}`,
        },
        confidence: 1.0,
      };
    default:
      return { output: { synthetic: true, stageId: stage.id }, confidence: 0.8 };
  }
};

// ─── Per-Workflow Input Schemas ───────────────────────────────────────────────
//
// Each workflow exposes a validated input schema. The /substrate/run endpoint
// performs a two-pass validation: (1) outer envelope, (2) per-workflow input.

const workflowInputSchemas = {
  'lyte-operational-drift': z.object({
    services: z.array(z.string()).optional(),
    lookbackHours: z.number().int().min(1).max(168).optional(),
    driftThreshold: z.number().min(0).max(1).optional(),
    requestedBy: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  'aegis-threat-triage': z.object({
    alertIds: z.array(z.string()).optional(),
    lookbackHours: z.number().int().min(1).max(168).optional(),
    minSeverity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    requestedBy: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  'vessels-voyage-anomaly': z.object({
    vesselIds: z.array(z.string()).optional(),
    voyageIds: z.array(z.string()).optional(),
    lookbackHours: z.number().int().min(1).max(720).optional(),
    requestedBy: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  'terra-portfolio-anomaly': z.object({
    portfolioId: z.string().optional(),
    propertyIds: z.array(z.string()).optional(),
    lookbackDays: z.number().int().min(1).max(365).optional(),
    requestedBy: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  'prism-counsel-evidence-packaging': z.object({
    matterIds: z.array(z.string()).optional(),
    lookAheadDays: z.number().int().min(1).max(365).optional(),
    includePrivileged: z.boolean().optional(),
    requestedBy: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  'carlota-jo-task-routing': z.object({
    clientId: z.string(),
    taskTitle: z.string(),
    taskDescription: z.string(),
    taskType: z.string().optional(),
    urgency: z.enum(['immediate', 'standard', 'deferred']).optional(),
    requestedBy: z.string().optional(),
    sessionId: z.string().optional(),
  }),
  'cross-system-reconciliation': z.object({
    systems: z.array(z.string()).optional(),
    lookbackHours: z.number().int().optional(),
    requestedBy: z.string().optional(),
  }),
  'executive-brief': z.object({
    lookbackHours: z.number().int().optional(),
    audienceLevel: z.enum(['executive', 'board', 'operational']).optional(),
    requestedBy: z.string().optional(),
  }),
  'risk-escalation': z.object({
    riskId: z.string().optional(),
    severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    requestedBy: z.string().optional(),
  }),
  'evidence-based-recommendation': z.object({
    domain: z.string().optional(),
    question: z.string().optional(),
    requestedBy: z.string().optional(),
  }),
  'opportunity-audit': z.object({
    portfolioId: z.string().optional(),
    focusArea: z.string().optional(),
    requestedBy: z.string().optional(),
  }),
} satisfies Record<string, z.ZodObject<z.ZodRawShape>>;

type WorkflowId = keyof typeof workflowInputSchemas;

// ─── Run Request Schema ───────────────────────────────────────────────────────

const RunRequestSchema = z.object({
  workflowId: z.string().min(1, 'workflowId is required'),
  input: z.record(z.unknown()).default({}),
  mode: z.enum(['live', 'dry-run', 'replay', 'counterfactual']).default('dry-run'),
  sessionId: z.string().optional(),
});

// ─── Request Schema (Zod boundary validation) ────────────────────────────────

const ReplayRequestSchema = z.object({
  runId: z.string().min(1, 'runId is required'),
  counterfactual: z.boolean().optional(),
  model: z.string().optional(),
  policyId: z.string().optional(),
  // Workflow overrides are complex nested objects; validated as a structured
  // record (not raw unknown) so every key is at least a primitive or object.
  workflow: z.record(z.unknown()).optional(),
});

export function register(router: IRouter): void {
  /**
   * POST /substrate/run
   *
   * Body: { workflowId, input?, mode?, sessionId? }
   *
   * Executes a named substrate workflow using the governed runtime with a
   * synthetic stage executor. Suitable for live, dry-run, and operator-triggered
   * runs from vertical operator UIs.
   *
   * Response: PipelineRun (serialised)
   */
  router.post('/substrate/run', authMiddleware(), requireRole('ops', 'admin'), async (req, res) => {
    const parsed = RunRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { workflowId, input, mode, sessionId } = parsed.data;

    // ── Per-workflow typed input validation ──────────────────────────────────
    const inputSchema = workflowInputSchemas[workflowId as WorkflowId];
    if (!inputSchema) {
      res.status(404).json({ error: `Unknown workflowId: '${workflowId}'` });
      return;
    }

    const inputParsed = inputSchema.safeParse(input);
    if (!inputParsed.success) {
      res.status(400).json({
        error: 'Invalid input for workflow',
        workflowId,
        details: inputParsed.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const substrate = await import('@szl/substrate');
      const { SubstrateRuntime, defaultRuntime } = substrate;

      const WORKFLOW_RUNNERS: Record<
        string,
        () => Promise<import('@szl/substrate').WorkflowDefinition>
      > = {
        'lyte-operational-drift': async () =>
          (await import('@szl/substrate/workflows/lyte-operational-drift'))
            .lyteOperationalDriftWorkflow,
        'aegis-threat-triage': async () =>
          (await import('@szl/substrate/workflows/aegis-threat-triage')).aegisThreatTriageWorkflow,
        'vessels-voyage-anomaly': async () =>
          (await import('@szl/substrate/workflows/vessels-voyage-anomaly'))
            .vesselsVoyageAnomalyWorkflow,
        'terra-portfolio-anomaly': async () =>
          (await import('@szl/substrate/workflows/terra-portfolio-anomaly'))
            .terraPortfolioAnomalyWorkflow,
        'prism-counsel-evidence-packaging': async () =>
          (await import('@szl/substrate/workflows/prism-counsel-evidence-packaging'))
            .prismCounselEvidencePackagingWorkflow,
        'carlota-jo-task-routing': async () =>
          (await import('@szl/substrate/workflows/carlota-jo-task-routing'))
            .carlotaJoTaskRoutingWorkflow,
        'cross-system-reconciliation': async () =>
          (await import('@szl/substrate/workflows/cross-system-reconciliation'))
            .crossSystemReconciliationWorkflow,
        'executive-brief': async () =>
          (await import('@szl/substrate/workflows/executive-brief')).executiveBriefWorkflow,
        'risk-escalation': async () =>
          (await import('@szl/substrate/workflows/risk-escalation')).riskEscalationWorkflow,
        'evidence-based-recommendation': async () =>
          (await import('@szl/substrate/workflows/evidence-based-recommendation'))
            .evidenceBasedRecommendationWorkflow,
        'opportunity-audit': async () =>
          (await import('@szl/substrate/workflows/opportunity-audit')).opportunityAuditWorkflow,
      };

      const loader = WORKFLOW_RUNNERS[workflowId];
      const workflow = await loader();

      // ── Executor selection: live uses the real governed runtime (adapter
      // calls propagate naturally); dry-run/replay/counterfactual use the
      // deterministic synthetic executor so results are reproducible without
      // requiring live AI adapter registration.
      const runtime =
        mode === 'live'
          ? defaultRuntime
          : new SubstrateRuntime({ stageExecutor: syntheticExecutor });

      const run = await runtime.start(workflow, inputParsed.data, {
        mode,
        ...(sessionId ? { sessionId } : {}),
        metadata: { requestedBy: 'operator-ui', workflowId, via: 'control-tower-api' },
      });

      res.json(run);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[substrate-run] Error:', message);
      res.status(500).json({ error: message });
    }
  });

  /**
   * POST /substrate/replay
   *
   * Body: { runId, counterfactual?, model?, policyId?, workflow? }
   *
   * Response: ReplayEndpointResponse
   *   { sourceRunId, replayRunId, mode, stableHashes, mismatchedStages, diff, replayRun }
   */
  router.post(
    '/substrate/replay',
    authMiddleware(),
    requireRole('ops', 'admin'),
    async (req, res) => {
      const parsed = ReplayRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Invalid request body',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const body = parsed.data;

      try {
        const { handleReplayRequest } = await import('@szl/substrate');

        const response = await handleReplayRequest({
          runId: body.runId,
          counterfactual: body.counterfactual,
          model: body.model,
          policyId: body.policyId,
          // body.workflow is validated as z.record(z.unknown()); the substrate
          // engine performs further schema validation at runtime.
          workflow: body.workflow as import('@szl/substrate').WorkflowDefinition | undefined,
        });

        res.json(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';

        if (message.includes('not found')) {
          res.status(404).json({ error: message });
          return;
        }

        console.error('[substrate-replay] Error:', message);
        res.status(500).json({ error: message });
      }
    },
  );

  /**
   * GET /substrate/run/:runId
   *
   * Fetch a pipeline run by ID (from the substrate run store).
   * Useful for polling run status on async approval gates.
   */
  router.get(
    '/substrate/run/:runId',
    authMiddleware(),
    requireRole('ops', 'admin'),
    async (req, res) => {
      const runIdParsed = z.string().min(1).safeParse(req.params['runId']);
      if (!runIdParsed.success) {
        res.status(400).json({ error: 'Invalid runId' });
        return;
      }

      try {
        const { defaultRunStore } = await import('@szl/substrate');

        const run = await defaultRunStore.get(runIdParsed.data);
        if (!run) {
          res.status(404).json({ error: `Run '${runIdParsed.data}' not found` });
          return;
        }

        res.json(run);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: message });
      }
    },
  );

  /**
   * GET /substrate/metrics
   *
   * Return aggregate telemetry metrics from the substrate runtime.
   * Restricted to ops/admin to prevent metric exfiltration.
   */
  router.get(
    '/substrate/metrics',
    authMiddleware(),
    requireRole('ops', 'admin'),
    async (_req, res) => {
      try {
        const { getMetrics } = await import('@szl/substrate');
        res.json(getMetrics());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ error: message });
      }
    },
  );
}
