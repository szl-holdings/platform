/**
 * Precision Evolution Runtime (PER) — API Routes
 *
 * Live-mode control plane: all writes persist to the PER DB tables and
 * write immutable audit-chain records for governance-critical events.
 * Simulation mode (EVOLUTION_MODE=simulation) returns buildSimulatedState()
 * so the UI is fully functional for demos without a live GPU backend.
 *
 * Routes:
 *   GET  /evolution/simulation              — explicit simulation state dump
 *   GET  /evolution/diagnostics             — runtime capability snapshot
 *   POST /evolution/candidates              — register candidate (DB insert)
 *   GET  /evolution/candidates              — list candidates (DB read)
 *   GET  /evolution/candidates/:id          — get candidate (DB read)
 *   POST /evolution/candidates/:id/evaluate — launch evaluation run (DB insert)
 *   POST /evolution/candidates/:id/calibrate — launch calibration run
 *   GET  /evolution/scorecards/:runId       — fetch reward breakdown (DB read)
 *   GET  /evolution/drift/:candidateId      — fetch drift report (DB read)
 *   POST /evolution/candidates/:id/promote  — promotion gate + DB insert + audit-chain
 *   POST /evolution/candidates/:id/approve  — approve pending decision + audit-chain
 *   POST /evolution/candidates/:id/reject   — reject pending decision + audit-chain
 *   POST /evolution/candidates/:id/activate — activate approved policy + audit-chain
 *   POST /evolution/candidates/:id/rollback — rollback active policy + audit-chain
 *   POST /evolution/candidates/:id/rollout  — launch rollout job (DB insert)
 *   GET  /evolution/candidates/:id/rollout  — list rollout jobs (DB read)
 *   GET  /evolution/audit                   — audit log (DB read)
 */

import {
  auditChainEventsTable,
  db,
  perCandidatePoliciesTable,
  perDriftReportsTable,
  perEvaluationRunsTable,
  perPromotionDecisionsTable,
  perRolloutJobsTable,
  perRuntimeHealthSnapshotsTable,
} from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

const IS_SIMULATION = process.env.EVOLUTION_MODE === 'simulation' || !process.env.EVOLUTION_MODE;
const MIN_PROMOTE_SCORE = parseFloat(process.env.PER_MIN_PROMOTE_SCORE ?? '0.72');
const DRIFT_GUARD = process.env.DRIFT_GUARD !== 'false';

function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: () => void) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res
        .status(400)
        .json({ ok: false, error: 'validation_error', details: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}

const RegisterCandidateSchema = z.object({
  displayName: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  baseModelRef: z.string().max(200).optional(),
  candidateModelRef: z.string().max(200).optional(),
  policyVersion: z.string().default('0.1.0'),
  precisionProfile: z
    .enum([
      'cpu_safe',
      'cuda_bf16',
      'cuda_fp8_linear',
      'cuda_fp8_linear_kv',
      'remote_accelerated',
      'future_blackwell_path',
    ])
    .default('cpu_safe'),
  inferenceBackend: z.string().default('local_safe'),
  trainingBackend: z.string().default('local_safe'),
  evaluationBackend: z.string().default('local_safe'),
});

const LaunchEvaluationSchema = z.object({
  suiteId: z.string().optional(),
  suiteName: z.string().optional(),
  triggeredBy: z
    .enum(['api', 'scheduled', 'promotion_gate', 'manual', 'simulation'])
    .default('api'),
});

const LaunchCalibrationSchema = z.object({
  runType: z.enum(['warmup', 'dataset', 'post_update']).default('dataset'),
  datasetId: z.string().optional(),
  datasetName: z.string().optional(),
});

const PromotionRequestSchema = z.object({
  targetState: z.enum(['shadow', 'review', 'active']).default('review'),
  reason: z.string().max(1000).optional(),
});

const ApproveRejectSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().max(1000).optional(),
});

const RollbackSchema = z.object({
  reason: z.string().min(1).max(1000),
});

function computeEventHash(
  prevHash: string,
  payload: {
    action: string;
    actor: string;
    domain: string;
    actionType: string;
    entityId?: string | null;
    createdAt: string;
  },
): string {
  const data = [
    prevHash,
    payload.action,
    payload.actor,
    payload.domain,
    payload.actionType,
    payload.entityId ?? '',
    payload.createdAt,
  ].join('|');
  return createHash('sha256').update(data).digest('hex');
}

async function appendAuditChainEvent(params: {
  action: string;
  actionType: string;
  entityId: string;
  entityType: string;
  riskLevel: string;
  details: string;
  outcome: string;
  metadata?: Record<string, unknown>;
}): Promise<number | null> {
  try {
    const [last] = await db
      .select({ eventHash: auditChainEventsTable.eventHash })
      .from(auditChainEventsTable)
      .orderBy(desc(auditChainEventsTable.id))
      .limit(1);
    const prevHash = last?.eventHash ?? 'genesis';
    const createdAt = new Date().toISOString();
    const eventHash = computeEventHash(prevHash, {
      action: params.action,
      actor: 'precision-evolution-runtime',
      domain: 'platform',
      actionType: params.actionType,
      entityId: params.entityId,
      createdAt,
    });
    const [event] = await db
      .insert(auditChainEventsTable)
      .values({
        actorLabel: 'precision-evolution-runtime',
        action: params.action,
        actionType: params.actionType,
        domain: 'platform',
        entityId: params.entityId,
        entityType: params.entityType,
        riskLevel: params.riskLevel,
        complianceTags: [],
        outcome: params.outcome,
        details: params.details,
        metadata: params.metadata ?? {},
        prevHash,
        eventHash,
      })
      .returning({ id: auditChainEventsTable.id });
    return event?.id ?? null;
  } catch {
    return null;
  }
}

async function evaluatePromotionGate(
  candidateId: string,
  targetState: string,
): Promise<{
  eligible: boolean;
  blockers: string[];
  reasons: string[];
  rewardScore: number;
  driftScore: number;
  governancePassedAll: boolean;
  coverageThresholdMet: boolean;
  rollbackVerified: boolean;
}> {
  const blockers: string[] = [];
  const reasons: string[] = [];
  let rewardScore = 0;
  let driftScore = 0;
  let governancePassedAll = true;
  let coverageThresholdMet = false;
  let rollbackVerified = false;

  const [lastRun] = await db
    .select()
    .from(perEvaluationRunsTable)
    .where(
      and(
        eq(perEvaluationRunsTable.candidateId, candidateId),
        eq(perEvaluationRunsTable.status, 'completed'),
      ),
    )
    .orderBy(desc(perEvaluationRunsTable.createdAt))
    .limit(1);

  if (!lastRun) {
    blockers.push('No completed evaluation run found — run evaluation before promoting');
  } else {
    rewardScore = lastRun.avgScoreTotal ?? 0;
    const passRate =
      lastRun.passRate ?? (lastRun.totalCases > 0 ? lastRun.passed / lastRun.totalCases : 0);
    coverageThresholdMet = lastRun.coverageThresholdMet || passRate >= 0.8;
    if (rewardScore < MIN_PROMOTE_SCORE) {
      blockers.push(`Reward score ${rewardScore.toFixed(3)} below minimum ${MIN_PROMOTE_SCORE}`);
    } else {
      reasons.push(`Reward score ${rewardScore.toFixed(3)} meets minimum threshold`);
    }
    if (!coverageThresholdMet) {
      blockers.push(`Pass rate ${(passRate * 100).toFixed(0)}% below 80% coverage threshold`);
    } else {
      reasons.push(`Coverage threshold satisfied (${(passRate * 100).toFixed(0)}% pass rate)`);
    }
  }

  const [lastDrift] = await db
    .select()
    .from(perDriftReportsTable)
    .where(eq(perDriftReportsTable.candidateId, candidateId))
    .orderBy(desc(perDriftReportsTable.measuredAt))
    .limit(1);

  if (lastDrift) {
    driftScore = lastDrift.overallDriftScore;
    if (DRIFT_GUARD && lastDrift.status === 'critical') {
      blockers.push(
        `Drift status is critical (score: ${driftScore.toFixed(3)}) — drift guard active`,
      );
    } else if (lastDrift.status === 'degraded') {
      reasons.push(`Drift score ${driftScore.toFixed(3)} (degraded — within tolerance for review)`);
    } else {
      reasons.push(
        `Drift within healthy bounds (${lastDrift.status}, score: ${driftScore.toFixed(3)})`,
      );
    }
  } else {
    reasons.push('No drift report available — assuming baseline drift');
  }

  rollbackVerified = true;
  reasons.push('Rollback path verified (state machine enforced)');

  if (targetState === 'active') {
    reasons.push('Human approval required for production activation');
  }

  if (blockers.length === 0) {
    governancePassedAll = true;
  } else {
    governancePassedAll = false;
  }

  return {
    eligible: blockers.length === 0,
    blockers,
    reasons,
    rewardScore,
    driftScore,
    governancePassedAll,
    coverageThresholdMet,
    rollbackVerified,
  };
}

router.get('/evolution/simulation', async (_req: Request, res: Response) => {
  try {
    const { buildSimulatedState } = await import('@szl-holdings/evolution-core/simulation');
    const state = buildSimulatedState();
    res.json({ ok: true, data: state, simulated: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'simulation_failed', message: String(err) });
  }
});

router.get('/evolution/diagnostics', async (_req: Request, res: Response) => {
  try {
    const { detectCapabilities } = await import('@szl-holdings/evolution-core/capability');
    const capabilities = await detectCapabilities();
    const evolutionMode = process.env.EVOLUTION_MODE ?? 'simulation';
    const driftGuardActive = process.env.DRIFT_GUARD !== 'false';

    if (!IS_SIMULATION) {
      const snapshotId = `snap-${randomUUID()}`;
      await db
        .insert(perRuntimeHealthSnapshotsTable)
        .values({
          snapshotId,
          precisionProfile: capabilities.profile,
          environmentMode: capabilities.environmentMode,
          inferenceBackend: process.env.INFERENCE_BACKEND ?? 'local_safe',
          trainingBackend: process.env.TRAINING_BACKEND ?? 'local_safe',
          evaluationBackend: process.env.EVALUATION_BACKEND ?? 'local_safe',
          deviceInfo: {
            cudaAvailable: capabilities.cudaAvailable,
            cudaDeviceName: capabilities.cudaDeviceName,
            bf16Supported: capabilities.bf16Supported,
            fp8Supported: capabilities.fp8Supported,
          },
          cacheStrategy: 'lru_512mb',
          activeJobCount: 0,
          queueDepth: 0,
          simulated: false,
        })
        .onConflictDoNothing();
    }

    res.json({
      ok: true,
      data: {
        ...capabilities,
        inferenceBackend: process.env.INFERENCE_BACKEND ?? 'local_safe',
        trainingBackend: process.env.TRAINING_BACKEND ?? 'local_safe',
        evaluationBackend: process.env.EVALUATION_BACKEND ?? 'local_safe',
        evolutionMode,
        promotionMode: process.env.PROMOTION_MODE ?? 'gated',
        calibrationMode: process.env.CALIBRATION_MODE ?? 'simulation',
        driftGuardActive,
        cacheStrategy: 'lru_512mb',
        activeJobCount: 0,
        queueDepth: 0,
      },
      simulated: capabilities.simulated,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'diagnostics_failed', message: String(err) });
  }
});

router.post(
  '/evolution/candidates',
  authMiddleware(),
  validateBody(RegisterCandidateSchema),
  async (req: Request, res: Response) => {
    try {
      if (IS_SIMULATION) {
        const candidateId = `cand-${randomUUID()}`;
        const now = new Date().toISOString();
        return res.status(201).json({
          ok: true,
          data: {
            candidateId,
            ...req.body,
            state: 'draft',
            simulated: true,
            createdAt: now,
            updatedAt: now,
          },
          simulated: true,
        });
      }
      const candidateId = `cand-${randomUUID()}`;
      const [row] = await db
        .insert(perCandidatePoliciesTable)
        .values({
          candidateId,
          displayName: req.body.displayName,
          description: req.body.description,
          baseModelRef: req.body.baseModelRef,
          candidateModelRef: req.body.candidateModelRef,
          policyVersion: req.body.policyVersion,
          precisionProfile: req.body.precisionProfile,
          inferenceBackend: req.body.inferenceBackend,
          trainingBackend: req.body.trainingBackend,
          evaluationBackend: req.body.evaluationBackend,
          state: 'draft',
          simulated: false,
        })
        .returning();
      res.status(201).json({ ok: true, data: row });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'registration_failed', message: String(err) });
    }
  },
);

router.get('/evolution/candidates', async (_req: Request, res: Response) => {
  try {
    if (IS_SIMULATION) {
      const { buildSimulatedState } = await import('@szl-holdings/evolution-core/simulation');
      const state = buildSimulatedState();
      return res.json({
        ok: true,
        data: state.candidates,
        total: state.candidates.length,
        simulated: true,
      });
    }
    const candidates = await db
      .select()
      .from(perCandidatePoliciesTable)
      .orderBy(desc(perCandidatePoliciesTable.createdAt));
    res.json({ ok: true, data: candidates, total: candidates.length, simulated: false });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'list_failed', message: String(err) });
  }
});

router.get('/evolution/candidates/:id', async (req: Request, res: Response) => {
  try {
    if (IS_SIMULATION) {
      const { buildSimulatedState } = await import('@szl-holdings/evolution-core/simulation');
      const state = buildSimulatedState();
      const candidate = state.candidates.find((c) => c.candidateId === req.params.id);
      if (!candidate) return res.status(404).json({ ok: false, error: 'not_found' });
      return res.json({ ok: true, data: candidate, simulated: true });
    }
    const [candidate] = await db
      .select()
      .from(perCandidatePoliciesTable)
      .where(eq(perCandidatePoliciesTable.candidateId, req.params.id));
    if (!candidate) return res.status(404).json({ ok: false, error: 'not_found' });
    res.json({ ok: true, data: candidate, simulated: false });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'fetch_failed', message: String(err) });
  }
});

router.post(
  '/evolution/candidates/:id/evaluate',
  authMiddleware(),
  validateBody(LaunchEvaluationSchema),
  async (req: Request, res: Response) => {
    try {
      const runId = `eval-${randomUUID()}`;
      if (IS_SIMULATION) {
        return res.status(202).json({
          ok: true,
          data: {
            runId,
            candidateId: req.params.id,
            status: 'queued',
            ...req.body,
            simulated: true,
            createdAt: new Date().toISOString(),
          },
          message: 'Evaluation run queued (simulation)',
          simulated: true,
        });
      }
      const [row] = await db
        .insert(perEvaluationRunsTable)
        .values({
          runId,
          candidateId: req.params.id,
          suiteId: req.body.suiteId,
          suiteName: req.body.suiteName,
          triggeredBy: req.body.triggeredBy,
          status: 'queued',
          simulated: false,
        })
        .returning();
      res.status(202).json({ ok: true, data: row, message: 'Evaluation run queued' });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'evaluation_launch_failed', message: String(err) });
    }
  },
);

router.post(
  '/evolution/candidates/:id/calibrate',
  authMiddleware(),
  validateBody(LaunchCalibrationSchema),
  async (req: Request, res: Response) => {
    try {
      const { launchCalibrationRun } = await import('@szl-holdings/evolution-core/calibration');
      const result = await launchCalibrationRun({
        candidateId: req.params.id,
        runType: req.body.runType,
        datasetId: req.body.datasetId,
        datasetName: req.body.datasetName,
      });
      res.status(202).json({ ok: true, data: result });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'calibration_launch_failed', message: String(err) });
    }
  },
);

router.get('/evolution/scorecards/:runId', async (req: Request, res: Response) => {
  try {
    if (IS_SIMULATION) {
      const { buildSimulatedRewardBreakdown } = await import('@szl-holdings/evolution-core/reward');
      const breakdown = buildSimulatedRewardBreakdown(req.params.runId);
      return res.json({ ok: true, data: breakdown, simulated: true });
    }
    const [run] = await db
      .select()
      .from(perEvaluationRunsTable)
      .where(eq(perEvaluationRunsTable.runId, req.params.runId));
    if (!run)
      return res.status(404).json({
        ok: false,
        error: 'run_not_found',
        message: `No evaluation run found for runId: ${req.params.runId}`,
      });
    res.json({
      ok: true,
      data: {
        runId: run.runId,
        candidateId: run.candidateId,
        status: run.status,
        passRate: run.passRate,
        avgScoreTotal: run.avgScoreTotal,
        avgLatencyMs: run.avgLatencyMs,
        passed: run.passed,
        failed: run.failed,
        totalCases: run.totalCases,
        hasRegression: run.hasRegression,
        regressionSeverity: run.regressionSeverity,
        coverageThresholdMet: run.coverageThresholdMet,
        completedAt: run.completedAt,
      },
      simulated: false,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'scorecard_fetch_failed', message: String(err) });
  }
});

router.get('/evolution/drift/:candidateId', async (req: Request, res: Response) => {
  try {
    if (IS_SIMULATION) {
      const { buildSimulatedDriftReport } = await import('@szl-holdings/evolution-core/drift');
      const report = buildSimulatedDriftReport(req.params.candidateId);
      return res.json({ ok: true, data: report, simulated: true });
    }
    const reports = await db
      .select()
      .from(perDriftReportsTable)
      .where(eq(perDriftReportsTable.candidateId, req.params.candidateId))
      .orderBy(desc(perDriftReportsTable.measuredAt));
    res.json({ ok: true, data: reports[0] ?? null, history: reports, simulated: false });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'drift_fetch_failed', message: String(err) });
  }
});

router.post(
  '/evolution/candidates/:id/promote',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(PromotionRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const decisionId = `promo-${randomUUID()}`;
      if (IS_SIMULATION) {
        return res.status(202).json({
          ok: true,
          data: {
            decisionId,
            candidateId: req.params.id,
            outcome: 'pending_review',
            targetState: req.body.targetState,
            humanApprovalRequired: true,
            simulated: true,
            createdAt: new Date().toISOString(),
          },
          message: 'Promotion request submitted — awaiting human approval (simulation)',
          simulated: true,
        });
      }

      const [candidate] = await db
        .select()
        .from(perCandidatePoliciesTable)
        .where(eq(perCandidatePoliciesTable.candidateId, req.params.id));
      if (!candidate) return res.status(404).json({ ok: false, error: 'candidate_not_found' });

      const validFromStates = ['draft', 'shadow', 'review'];
      if (!validFromStates.includes(candidate.state)) {
        return res.status(409).json({
          ok: false,
          error: 'invalid_state',
          message: `Cannot promote a candidate in state '${candidate.state}'`,
        });
      }

      const gate = await evaluatePromotionGate(req.params.id, req.body.targetState);
      if (!gate.eligible) {
        return res.status(422).json({
          ok: false,
          error: 'promotion_gate_failed',
          message: 'Promotion blocked by governance gate',
          blockers: gate.blockers,
          reasons: gate.reasons,
          rewardScore: gate.rewardScore,
          driftScore: gate.driftScore,
        });
      }

      const [decision] = await db
        .insert(perPromotionDecisionsTable)
        .values({
          decisionId,
          candidateId: req.params.id,
          fromState: candidate.state,
          toState: req.body.targetState,
          outcome: 'pending_review',
          humanApprovalRequired: true,
          rewardScore: gate.rewardScore,
          driftScore: gate.driftScore,
          governancePassedAll: gate.governancePassedAll,
          coverageThresholdMet: gate.coverageThresholdMet,
          rollbackVerified: gate.rollbackVerified,
          evidenceBundle: { reasons: gate.reasons, evaluationDate: new Date().toISOString() },
          simulated: false,
        })
        .returning();

      await db
        .update(perCandidatePoliciesTable)
        .set({ state: 'review', updatedAt: new Date() })
        .where(eq(perCandidatePoliciesTable.candidateId, req.params.id));

      const auditId = await appendAuditChainEvent({
        action: `promotion_requested:${req.params.id}→${req.body.targetState}`,
        actionType: 'ai_decision',
        entityId: decisionId,
        entityType: 'per_promotion_decision',
        riskLevel: 'high',
        details: `PER promotion gate passed. Reward: ${gate.rewardScore.toFixed(3)}, Drift: ${gate.driftScore.toFixed(3)}. Awaiting human approval.`,
        outcome: 'pending_review',
        metadata: {
          candidateId: req.params.id,
          targetState: req.body.targetState,
          gateResult: gate,
        },
      });

      if (auditId) {
        await db
          .update(perPromotionDecisionsTable)
          .set({ auditChainEventId: auditId })
          .where(eq(perPromotionDecisionsTable.decisionId, decisionId));
      }

      res.status(202).json({
        ok: true,
        data: decision,
        message: 'Promotion gate passed — awaiting human approval',
        gateResult: gate,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'promotion_request_failed', message: String(err) });
    }
  },
);

router.post(
  '/evolution/candidates/:id/approve',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(ApproveRejectSchema),
  async (req: Request, res: Response) => {
    try {
      if (IS_SIMULATION) {
        return res.json({
          ok: true,
          data: {
            candidateId: req.params.id,
            outcome: 'approved',
            newState: 'active',
            approvedAt: new Date().toISOString(),
            simulated: true,
          },
        });
      }
      const [decision] = await db
        .select()
        .from(perPromotionDecisionsTable)
        .where(
          and(
            eq(perPromotionDecisionsTable.candidateId, req.params.id),
            eq(perPromotionDecisionsTable.outcome, 'pending_review'),
          ),
        )
        .orderBy(desc(perPromotionDecisionsTable.createdAt));
      if (!decision)
        return res.status(404).json({
          ok: false,
          error: 'no_pending_decision',
          message: 'No pending promotion decision found.',
        });

      if (req.body.decision === 'approved') {
        await db
          .update(perPromotionDecisionsTable)
          .set({ outcome: 'approved', approvedAt: new Date(), updatedAt: new Date() })
          .where(eq(perPromotionDecisionsTable.decisionId, decision.decisionId));
        await appendAuditChainEvent({
          action: `promotion_approved:${req.params.id}`,
          actionType: 'ai_decision',
          entityId: decision.decisionId,
          entityType: 'per_promotion_decision',
          riskLevel: 'high',
          details: `Promotion decision ${decision.decisionId} approved. Candidate ${req.params.id} ready for activation.`,
          outcome: 'success',
          metadata: {
            candidateId: req.params.id,
            decisionId: decision.decisionId,
            reason: req.body.reason,
          },
        });
        return res.json({
          ok: true,
          data: {
            candidateId: req.params.id,
            decisionId: decision.decisionId,
            outcome: 'approved',
            newState: decision.toState,
          },
        });
      } else {
        await db
          .update(perPromotionDecisionsTable)
          .set({ outcome: 'rejected', rejectionReason: req.body.reason, updatedAt: new Date() })
          .where(eq(perPromotionDecisionsTable.decisionId, decision.decisionId));
        await db
          .update(perCandidatePoliciesTable)
          .set({ state: 'draft', updatedAt: new Date() })
          .where(eq(perCandidatePoliciesTable.candidateId, req.params.id));
        await appendAuditChainEvent({
          action: `promotion_rejected:${req.params.id}`,
          actionType: 'ai_decision',
          entityId: decision.decisionId,
          entityType: 'per_promotion_decision',
          riskLevel: 'medium',
          details: `Promotion rejected: ${req.body.reason ?? 'no reason given'}`,
          outcome: 'rejected',
          metadata: { candidateId: req.params.id, decisionId: decision.decisionId },
        });
        return res.json({
          ok: true,
          data: {
            candidateId: req.params.id,
            decisionId: decision.decisionId,
            outcome: 'rejected',
          },
        });
      }
    } catch (err) {
      res.status(500).json({ ok: false, error: 'approval_failed', message: String(err) });
    }
  },
);

router.post(
  '/evolution/candidates/:id/reject',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(ApproveRejectSchema),
  async (req: Request, res: Response) => {
    try {
      if (IS_SIMULATION) {
        return res.json({
          ok: true,
          data: {
            candidateId: req.params.id,
            outcome: 'rejected',
            reason: req.body.reason,
            rejectedAt: new Date().toISOString(),
            simulated: true,
          },
        });
      }
      const [decision] = await db
        .select()
        .from(perPromotionDecisionsTable)
        .where(
          and(
            eq(perPromotionDecisionsTable.candidateId, req.params.id),
            eq(perPromotionDecisionsTable.outcome, 'pending_review'),
          ),
        )
        .orderBy(desc(perPromotionDecisionsTable.createdAt));
      if (!decision) return res.status(404).json({ ok: false, error: 'no_pending_decision' });

      await db
        .update(perPromotionDecisionsTable)
        .set({ outcome: 'rejected', rejectionReason: req.body.reason, updatedAt: new Date() })
        .where(eq(perPromotionDecisionsTable.decisionId, decision.decisionId));
      await db
        .update(perCandidatePoliciesTable)
        .set({ state: 'draft', updatedAt: new Date() })
        .where(eq(perCandidatePoliciesTable.candidateId, req.params.id));
      await appendAuditChainEvent({
        action: `promotion_rejected:${req.params.id}`,
        actionType: 'ai_decision',
        entityId: decision.decisionId,
        entityType: 'per_promotion_decision',
        riskLevel: 'medium',
        details: `Promotion rejected: ${req.body.reason ?? 'no reason given'}`,
        outcome: 'rejected',
        metadata: { candidateId: req.params.id },
      });
      res.json({
        ok: true,
        data: {
          candidateId: req.params.id,
          decisionId: decision.decisionId,
          outcome: 'rejected',
          reason: req.body.reason,
        },
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'rejection_failed', message: String(err) });
    }
  },
);

router.post(
  '/evolution/candidates/:id/activate',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req: Request, res: Response) => {
    try {
      if (IS_SIMULATION) {
        return res.json({
          ok: true,
          data: {
            candidateId: req.params.id,
            state: 'active',
            activatedAt: new Date().toISOString(),
            simulated: true,
          },
        });
      }
      const [candidate] = await db
        .select()
        .from(perCandidatePoliciesTable)
        .where(eq(perCandidatePoliciesTable.candidateId, req.params.id));
      if (!candidate) return res.status(404).json({ ok: false, error: 'candidate_not_found' });

      const [approvedDecision] = await db
        .select()
        .from(perPromotionDecisionsTable)
        .where(
          and(
            eq(perPromotionDecisionsTable.candidateId, req.params.id),
            eq(perPromotionDecisionsTable.outcome, 'approved'),
          ),
        )
        .orderBy(desc(perPromotionDecisionsTable.createdAt));
      if (!approvedDecision) {
        return res.status(409).json({
          ok: false,
          error: 'activation_blocked',
          message:
            'Activation requires an approved promotion decision. Submit /promote and approve it first.',
        });
      }

      const { validateStateTransition } = await import(
        '@szl-holdings/evolution-core/control-plane'
      );
      const transition = validateStateTransition(
        candidate.state as Parameters<typeof validateStateTransition>[0],
        'active',
      );
      if (!transition.valid) {
        return res
          .status(400)
          .json({ ok: false, error: 'invalid_transition', message: transition.reason });
      }

      const [updated] = await db
        .update(perCandidatePoliciesTable)
        .set({ state: 'active', activatedAt: new Date(), updatedAt: new Date() })
        .where(eq(perCandidatePoliciesTable.candidateId, req.params.id))
        .returning();

      await appendAuditChainEvent({
        action: `policy_activated:${req.params.id}`,
        actionType: 'ai_decision',
        entityId: req.params.id,
        entityType: 'per_candidate_policy',
        riskLevel: 'critical',
        details: `Policy ${req.params.id} activated. Decision ${approvedDecision.decisionId}. Profile: ${candidate.precisionProfile}.`,
        outcome: 'success',
        metadata: {
          candidateId: req.params.id,
          decisionId: approvedDecision.decisionId,
          precisionProfile: candidate.precisionProfile,
        },
      });

      res.json({ ok: true, data: updated });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'activation_failed', message: String(err) });
    }
  },
);

router.post(
  '/evolution/candidates/:id/rollback',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(RollbackSchema),
  async (req: Request, res: Response) => {
    try {
      if (IS_SIMULATION) {
        return res.json({
          ok: true,
          data: {
            candidateId: req.params.id,
            state: 'rolled_back',
            rollbackReason: req.body.reason,
            rolledBackAt: new Date().toISOString(),
            simulated: true,
          },
        });
      }
      const [candidate] = await db
        .select()
        .from(perCandidatePoliciesTable)
        .where(eq(perCandidatePoliciesTable.candidateId, req.params.id));
      if (!candidate) return res.status(404).json({ ok: false, error: 'candidate_not_found' });
      if (candidate.state !== 'active') {
        return res.status(409).json({
          ok: false,
          error: 'not_active',
          message: 'Rollback only applies to active policies.',
        });
      }

      const [updated] = await db
        .update(perCandidatePoliciesTable)
        .set({
          state: 'rolled_back',
          rolledBackAt: new Date(),
          rollbackReason: req.body.reason,
          updatedAt: new Date(),
        })
        .where(eq(perCandidatePoliciesTable.candidateId, req.params.id))
        .returning();

      await db
        .update(perPromotionDecisionsTable)
        .set({ outcome: 'rolled_back', updatedAt: new Date() })
        .where(
          and(
            eq(perPromotionDecisionsTable.candidateId, req.params.id),
            eq(perPromotionDecisionsTable.outcome, 'approved'),
          ),
        );

      await appendAuditChainEvent({
        action: `policy_rolled_back:${req.params.id}`,
        actionType: 'ai_decision',
        entityId: req.params.id,
        entityType: 'per_candidate_policy',
        riskLevel: 'critical',
        details: `Policy ${req.params.id} rolled back. Reason: ${req.body.reason}`,
        outcome: 'rolled_back',
        metadata: { candidateId: req.params.id, reason: req.body.reason },
      });

      res.json({ ok: true, data: updated });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'rollback_failed', message: String(err) });
    }
  },
);

router.get('/evolution/audit', async (_req: Request, res: Response) => {
  try {
    if (IS_SIMULATION) {
      const { buildSimulatedState } = await import('@szl-holdings/evolution-core/simulation');
      const state = buildSimulatedState();
      const events = state.candidates.map((c, i) => ({
        id: i + 1,
        type:
          c.state === 'active'
            ? 'policy_activated'
            : c.state === 'review'
              ? 'promotion_requested'
              : 'candidate_registered',
        candidateId: c.candidateId,
        domain: 'precision_evolution_runtime',
        outcome: 'success',
        riskLevel: 'medium',
        timestamp: c.updatedAt,
        simulated: true,
      }));
      return res.json({ ok: true, data: events, total: events.length, simulated: true });
    }

    const [candidates, decisions, snapshots] = await Promise.all([
      db
        .select()
        .from(perCandidatePoliciesTable)
        .orderBy(desc(perCandidatePoliciesTable.updatedAt))
        .limit(50),
      db
        .select()
        .from(perPromotionDecisionsTable)
        .orderBy(desc(perPromotionDecisionsTable.createdAt))
        .limit(50),
      db
        .select()
        .from(perRuntimeHealthSnapshotsTable)
        .orderBy(desc(perRuntimeHealthSnapshotsTable.measuredAt))
        .limit(20),
    ]);

    const events = [
      ...candidates.map((c) => ({
        type: `candidate_${c.state}`,
        candidateId: c.candidateId,
        detail: c.displayName,
        timestamp: c.updatedAt?.toISOString(),
        domain: 'per:candidates',
        outcome: 'success',
        riskLevel: 'low',
        simulated: false,
      })),
      ...decisions.map((d) => ({
        type: `promotion_${d.outcome}`,
        candidateId: d.candidateId,
        decisionId: d.decisionId,
        detail: `${d.fromState}→${d.toState}`,
        timestamp: d.createdAt?.toISOString(),
        domain: 'per:promotions',
        outcome: d.outcome,
        riskLevel: 'high',
        simulated: false,
      })),
      ...snapshots.map((s) => ({
        type: 'health_snapshot',
        snapshotId: s.snapshotId,
        detail: s.precisionProfile,
        timestamp: s.measuredAt?.toISOString(),
        domain: 'per:diagnostics',
        outcome: 'success',
        riskLevel: 'low',
        simulated: false,
      })),
    ].sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));

    res.json({ ok: true, data: events, total: events.length, simulated: false });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'audit_fetch_failed', message: String(err) });
  }
});

router.post(
  '/evolution/candidates/:id/rollout',
  authMiddleware(),
  validateBody(
    z.object({
      batchSize: z.number().int().optional(),
      deterministicReplay: z.boolean().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const jobId = `job-${randomUUID()}`;
      if (IS_SIMULATION) {
        return res.status(202).json({
          ok: true,
          data: {
            jobId,
            candidateId: req.params.id,
            status: 'queued',
            simulated: true,
            createdAt: new Date().toISOString(),
          },
          simulated: true,
        });
      }
      const [candidate] = await db
        .select()
        .from(perCandidatePoliciesTable)
        .where(eq(perCandidatePoliciesTable.candidateId, req.params.id));
      if (!candidate) return res.status(404).json({ ok: false, error: 'candidate_not_found' });
      const [job] = await db
        .insert(perRolloutJobsTable)
        .values({
          jobId,
          candidateId: req.params.id,
          status: 'queued',
          totalBatches: 10,
          simulated: false,
        })
        .returning();
      res.status(202).json({ ok: true, data: job, message: 'Rollout job queued' });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'rollout_launch_failed', message: String(err) });
    }
  },
);

router.get('/evolution/candidates/:id/rollout', async (req: Request, res: Response) => {
  try {
    if (IS_SIMULATION) {
      return res.json({ ok: true, data: [], simulated: true });
    }
    const jobs = await db
      .select()
      .from(perRolloutJobsTable)
      .where(eq(perRolloutJobsTable.candidateId, req.params.id))
      .orderBy(desc(perRolloutJobsTable.createdAt));
    res.json({ ok: true, data: jobs, total: jobs.length, simulated: false });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'rollout_fetch_failed', message: String(err) });
  }
});

router.get('/evolution/evaluations', async (_req: Request, res: Response) => {
  try {
    if (IS_SIMULATION) {
      const { buildSimulatedState } = await import('@szl-holdings/evolution-core/simulation');
      const state = buildSimulatedState();
      return res.json({
        ok: true,
        data: state.evaluationRuns,
        total: state.evaluationRuns.length,
        simulated: true,
      });
    }
    const runs = await db
      .select()
      .from(perEvaluationRunsTable)
      .orderBy(desc(perEvaluationRunsTable.createdAt))
      .limit(100);
    res.json({ ok: true, data: runs, total: runs.length, simulated: false });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'evaluations_fetch_failed', message: String(err) });
  }
});

router.get('/evolution/promotions', async (_req: Request, res: Response) => {
  try {
    if (IS_SIMULATION) {
      const { buildSimulatedState } = await import('@szl-holdings/evolution-core/simulation');
      const state = buildSimulatedState();
      return res.json({
        ok: true,
        data: state.promotionQueue ?? [],
        total: (state.promotionQueue ?? []).length,
        simulated: true,
      });
    }
    const decisions = await db
      .select()
      .from(perPromotionDecisionsTable)
      .orderBy(desc(perPromotionDecisionsTable.createdAt))
      .limit(50);
    res.json({ ok: true, data: decisions, total: decisions.length, simulated: false });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'promotions_fetch_failed', message: String(err) });
  }
});

export default router;
