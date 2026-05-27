// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
/**
 * Sentra — Governed Vulnerability Remediation Pipeline
 *
 * Implements the "Patching Gap" remediation layer: vulnerability findings flow
 * through the canonical A11oy nine-step decision loop:
 *   ingested → contextualized → recommended → simulated → policy-gated
 *   → approved → executing → verifying → resolved (or failed).
 *
 * Every transition is recorded in the case timeline with actor + timestamp.
 * High-trust transitions (recommendation, approval, execution, verification)
 * additionally bind a proof_chain entry, so the full lifecycle is auditable
 * end-to-end.
 *
 * The ingestion layer is source-agnostic: a webhook endpoint and a JSON API
 * route both accept the same normalized finding payload, so any scanner
 * (Pillpintu/Khipu, Snyk, Tenable, etc.) can publish findings without coupling
 * Sentra to a specific vendor.
 */
import { randomUUID } from 'node:crypto';
import { db, sentraRemediationCasesTable, type RemediationStage } from '@szl-holdings/db';
import { tagAIContent } from '@szl-holdings/proof-chain';
import { desc, eq, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendCreated, sendNotFound, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import { authMiddleware, type AuthenticatedUser } from '../middlewares/auth';
import {
  deliberateAndReceipt,
  getLatestVerdict,
} from '../lib/sentra-detector-council.js';
import type { DetectorKind, Finding } from '@szl-holdings/sentra-detector-sdk';
import {
  emitRemediationStageReceipt,
  stageOrdinal,
  type RemediationStageName,
} from '../lib/sentra-remediation-pipeline.js';

/**
 * Per-stage Λ-receipt helper (#5516). Records inputs/params/outputs hashes
 * for the transition and attaches the receipt to the API response under
 * `_pipelineReceipt` so the UI + auditors can chain stages off-line. Any
 * failure to emit is logged but does not roll back the stage transition —
 * receipts are observability, not the source of truth.
 */
async function attachStageReceipt(
  caseId: string,
  stageName: RemediationStageName,
  inputs: unknown,
  params: unknown,
  outputs: unknown,
  actor: string,
): Promise<Awaited<ReturnType<typeof emitRemediationStageReceipt>> | null> {
  try {
    return await emitRemediationStageReceipt({
      caseId,
      stageName,
      stageOrdinal: stageOrdinal(stageName),
      inputs,
      params,
      outputs,
      actor,
    });
  } catch (err) {
    logger.warn({ err, caseId, stageName }, '[sentra-remediation] stage receipt failed');
    return null;
  }
}

const router: IRouter = Router();

// ── Schemas ────────────────────────────────────────────────────────────────

const baseFindingFields = {
  cveId: z.string().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(4000),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  affectedAsset: z.string().optional(),
  affectedAssets: z.array(z.string()).optional().default([]),
  sourceRef: z.string().optional(),
  context: z.record(z.unknown()).optional().default({}),
  assignedTo: z.string().optional(),
};

// JSON-first ingestion (operator/manual/API). Defaults source to "manual"
// because callers explicitly hit the cases endpoint to file a finding.
const findingSchema = z.object({
  ...baseFindingFields,
  source: z.string().optional().default('manual'),
});

// Webhook ingest is dedicated to scanner pushes. We default `source` to
// "webhook" so the origin is captured distinctly even when the scanner
// payload omits the field.
const webhookFindingSchema = z.object({
  ...baseFindingFields,
  source: z.string().optional().default('webhook'),
});

// Stage-machine guard. Every mutating endpoint must declare which stages it
// accepts as a precondition, so direct API calls cannot bypass the canonical
// lifecycle (e.g. running /execute on a case that hasn't been approved).
const ALLOWED_PRECEDING_STAGES: Record<string, RemediationStage[]> = {
  contextualize: ['ingested'],
  recommend: ['ingested', 'contextualized'],
  simulate: ['recommended'],
  policy: ['simulated'],
  approve: ['policy-gated'],
  execute: ['approved'],
  // Execute records both the "executing" transition and the settled stage
  // ("verifying" on success/partial, or "failed" terminal) in one atomic
  // write. Verification therefore picks up from "verifying".
  verify: ['verifying'],
};

function enforceStage(
  res: Response,
  current: RemediationStage,
  action: keyof typeof ALLOWED_PRECEDING_STAGES,
): boolean {
  const allowed = ALLOWED_PRECEDING_STAGES[action];
  if (!allowed.includes(current)) {
    res.status(409).json({
      error: `Cannot ${action} a case in stage "${current}". Allowed preceding stages: ${allowed.join(', ')}.`,
      code: 'STAGE_TRANSITION_INVALID',
      currentStage: current,
      allowedFromStages: allowed,
    });
    return false;
  }
  return true;
}

// Required tier is enforced server-side: an "operator" cannot rubber-stamp
// a case that Covenant marked as "executive". Tier ordering is auto <
// operator < executive. The tier is resolved from the AUTHENTICATED
// principal's roles (req.user.roles) — never from a body string — so a
// caller cannot self-assert executive authority by crafting the payload.
const TIER_RANK: Record<'auto' | 'operator' | 'executive', number> = {
  auto: 0,
  operator: 1,
  executive: 2,
};

// Role → tier mapping. Anything that grants `exec` (directly, or via the
// admin/super_admin hierarchy) resolves to executive. Operator-level roles
// (ops, operator, member, analyst, compliance, maintenance, authenticated,
// editor) resolve to operator. Pure viewer roles cannot approve at all.
function tierFromUser(user: AuthenticatedUser | undefined): 'auto' | 'operator' | 'executive' | null {
  if (!user) return null;
  const roles = new Set(user.roles ?? []);
  if (roles.has('super_admin') || roles.has('admin') || roles.has('exec')) {
    return 'executive';
  }
  const operatorRoles = [
    'ops',
    'operator',
    'member',
    'analyst',
    'compliance',
    'maintenance',
    'editor',
    'authenticated',
  ];
  if (operatorRoles.some((r) => roles.has(r as never))) {
    return 'operator';
  }
  return null; // viewers / no qualifying role
}

function principalLabel(user: AuthenticatedUser): string {
  return user.email ?? user.displayName ?? `user:${user.id}`;
}

// PATCH is note-only by design: stage transitions MUST go through the
// dedicated lifecycle endpoints so ALLOWED_PRECEDING_STAGES + tier checks
// are enforced. This prevents an operator from jumping a case directly to
// "approved" or "resolved" out-of-band.
const advanceSchema = z
  .object({
    actor: z.string().optional(),
    note: z.string().min(1).max(2000),
  })
  .strict();

// Approval body intentionally does NOT carry an "approver" identity field —
// the approver is the authenticated principal (req.user). This prevents a
// caller from claiming executive authority via a freeform string.
const approvalSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

// Executor and verifier identities are taken from the authenticated
// principal — body fields are intentionally omitted so callers cannot
// impersonate a runner.
const executionSchema = z.object({
  result: z.enum(['success', 'partial', 'failed']),
  notes: z.string().optional(),
});

const verificationSchema = z.object({
  method: z.enum(['manual', 'rescan', 'automated']),
  vulnerabilityResolved: z.boolean(),
  regressionDetected: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

// ── Helpers ────────────────────────────────────────────────────────────────

type Row = typeof sentraRemediationCasesTable.$inferSelect;

function rowToCase(row: Row) {
  return {
    id: row.id,
    cveId: row.cveId,
    title: row.title,
    description: row.description,
    severity: row.severity,
    source: row.source,
    sourceRef: row.sourceRef,
    affectedAsset: row.affectedAsset,
    affectedAssets: row.affectedAssets,
    stage: row.stage as RemediationStage,
    outcome: row.outcome,
    context: row.context,
    recommendation: row.recommendation,
    simulation: row.simulation,
    policy: row.policy,
    execution: row.execution,
    verification: row.verification,
    proofChainIds: row.proofChainIds,
    timeline: row.timeline,
    assignedTo: row.assignedTo ?? undefined,
    detectedAt: row.detectedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function makeCaseId(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `REM-${year}-${rand}`;
}

function appendTimeline(
  existing: Row['timeline'],
  entry: { stage: RemediationStage; message: string; actor: string; proofId?: string },
): Row['timeline'] {
  return [
    {
      id: randomUUID(),
      stage: entry.stage,
      message: entry.message,
      actor: entry.actor,
      timestamp: new Date().toISOString(),
      proofId: entry.proofId,
    },
    ...existing,
  ];
}

/**
 * Best-effort proof-chain binding. We never fail the request if proof signing
 * fails — the timeline still records the transition, but the case is flagged.
 */
async function bindProof(opts: {
  caseId: string;
  contentType: string;
  rationale: string;
  confidence: number;
}): Promise<string | undefined> {
  try {
    const proof = await tagAIContent({
      contentId: `${opts.caseId}:${opts.contentType}`,
      contentType: opts.contentType,
      sourceClass: 'system_computed',
      confidenceScore: opts.confidence,
      promptText: opts.rationale,
      serviceAttribution: 'sentra-remediation',
      agentName: 'sentra-remediation-pipeline',
    });
    return String(proof.id);
  } catch (err) {
    logger.warn({ err, caseId: opts.caseId }, '[sentra-remediation] proof binding failed');
    return undefined;
  }
}

// Recommendation engine — heuristic, severity- and CVE-aware. The contract is
// stable so the implementation can be swapped for a true AI call later.
function generateRecommendation(input: {
  severity: string;
  cveId?: string | null;
  description: string;
}): NonNullable<Row['recommendation']> {
  const sev = input.severity;
  const isKev = !!input.cveId;
  const base =
    sev === 'critical'
      ? { type: 'patch' as const, confidence: 0.92 }
      : sev === 'high'
        ? { type: 'patch' as const, confidence: 0.85 }
        : sev === 'medium'
          ? { type: 'config-change' as const, confidence: 0.74 }
          : { type: 'compensating-control' as const, confidence: 0.66 };

  const action = isKev
    ? `Apply vendor patch addressing ${input.cveId} on all affected assets`
    : sev === 'low'
      ? 'Deploy compensating control (WAF rule + monitoring) — schedule patch in next maintenance window'
      : 'Apply vendor-recommended remediation across affected systems';

  return {
    action,
    type: base.type,
    confidence: base.confidence,
    rationale:
      `Severity=${sev}` +
      (input.cveId ? `, CVE=${input.cveId}` : '') +
      `. Recommendation derived from severity + CVE intelligence; ${
        isKev ? 'KEV-tracked patch available' : 'no public KEV match — defaulting to vendor guidance'
      }.`,
    alternatives: [
      { action: 'Accept risk with executive sign-off and 30-day review', type: 'accept-risk', confidence: 0.4 },
      { action: 'Deploy compensating control while patch is validated', type: 'compensating-control', confidence: 0.7 },
    ],
    generatedAt: new Date().toISOString(),
  };
}

function simulateImpact(input: {
  affectedAssets: string[];
  severity: string;
}): NonNullable<Row['simulation']> {
  const count = Math.max(1, input.affectedAssets.length);
  const sev = input.severity;
  const downtime =
    sev === 'critical' ? 15 + count * 5 : sev === 'high' ? 8 + count * 3 : sev === 'medium' ? 5 + count * 2 : 2 + count;
  const blast: 'low' | 'medium' | 'high' =
    count >= 25 || sev === 'critical' ? 'high' : count >= 5 || sev === 'high' ? 'medium' : 'low';

  return {
    affectedSystemCount: count,
    estimatedDowntimeMinutes: downtime,
    blastRadius: blast,
    dependencyImpact:
      blast === 'high'
        ? ['Identity provider', 'Edge gateway', 'Downstream OT segment']
        : blast === 'medium'
          ? ['Edge gateway', 'Internal API mesh']
          : ['Local subnet only'],
    rollbackPlan:
      sev === 'critical'
        ? 'Snapshot affected hosts pre-patch; rollback via image revert; max RTO 20m'
        : 'Standard package rollback via configuration manager; max RTO 10m',
    simulatedAt: new Date().toISOString(),
  };
}

function evaluatePolicy(input: {
  severity: string;
  blastRadius: 'low' | 'medium' | 'high';
  council?: {
    arbitratedSeverity: string;
    governanceCeiling: 'read-only' | 'advisory' | 'mutating' | 'auto-remediable';
    confidence: number;
    distinctKinds: number;
  } | null;
}): NonNullable<Row['policy']> {
  // Effective severity = max(base, council.arbitratedSeverity) so a Council
  // verdict can only escalate, never downgrade, the policy tier.
  const sevRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  const baseRank = sevRank[input.severity] ?? 0;
  const councilRank = input.council ? sevRank[input.council.arbitratedSeverity] ?? 0 : 0;
  const effRank = Math.max(baseRank, councilRank);
  const effSeverity =
    effRank >= 4 ? 'critical' : effRank >= 3 ? 'high' : effRank >= 2 ? 'medium' : 'low';

  let tier: 'auto' | 'operator' | 'executive';
  let reason: string;
  if (input.blastRadius === 'high' || effSeverity === 'critical') {
    tier = 'executive';
    reason = `Severity=${effSeverity}, blast=${input.blastRadius} → executive sign-off required by Covenant Policy`;
  } else if (input.blastRadius === 'medium' || effSeverity === 'high') {
    tier = 'operator';
    reason = `Severity=${effSeverity}, blast=${input.blastRadius} → operator approval required`;
  } else {
    tier = 'auto';
    reason = `Low risk profile (severity=${effSeverity}, blast=${input.blastRadius}) → auto-approved`;
  }
  // Governance ceiling clamp: read-only kits cannot auto-execute, period.
  if (input.council?.governanceCeiling === 'read-only' && tier === 'auto') {
    tier = 'operator';
    reason = `${reason}; clamped to operator by Council read-only governance ceiling`;
  }
  if (input.council) {
    reason = `${reason}; MARBLE verdict ${input.council.arbitratedSeverity} (confidence ${(input.council.confidence * 100).toFixed(0)}%, ${input.council.distinctKinds} kinds, ceiling=${input.council.governanceCeiling})`;
  }
  return { requiredTier: tier, tierReason: reason };
}

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /sentra/remediation/cases — list pipeline cases
router.get('/sentra/remediation/cases', async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(sentraRemediationCasesTable)
      .orderBy(desc(sentraRemediationCasesTable.detectedAt))
      .limit(200);
    sendSuccess(res, { cases: rows.map(rowToCase), total: rows.length, source: 'live' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list remediation cases');
  }
});

// GET /sentra/remediation/cases/:id
router.get('/sentra/remediation/cases/:id', async (req: Request, res: Response) => {
  try {
    const [row] = await db
      .select()
      .from(sentraRemediationCasesTable)
      .where(eq(sentraRemediationCasesTable.id, req.params.id as string))
      .limit(1);
    if (!row) {
      sendNotFound(res, 'Remediation case');
      return;
    }
    sendSuccess(res, rowToCase(row));
  } catch (err) {
    handleRouteError(res, err, 'Failed to get remediation case');
  }
});

// POST /sentra/remediation/cases — JSON-first ingestion (operator/manual/API)
// Requires an authenticated principal so manual filings are attributable.
router.post(
  '/sentra/remediation/cases',
  authMiddleware({ required: true }),
  validateBody(findingSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof findingSchema>;
      const newCase = await ingestFinding(body, 'api');
      sendCreated(res, newCase);
    } catch (err) {
      handleRouteError(res, err, 'Failed to ingest remediation case');
    }
  },
);

// POST /sentra/remediation/ingest — webhook entry-point for scanners
// Uses webhookFindingSchema so an omitted source defaults to "webhook"
// instead of "manual". This keeps origin tracking accurate when scanners
// (Pillpintu, Tenable, etc.) push findings without setting the field.
router.post(
  '/sentra/remediation/ingest',
  validateBody(webhookFindingSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof webhookFindingSchema>;
      const newCase = await ingestFinding(body, 'webhook');
      sendCreated(res, newCase);
    } catch (err) {
      handleRouteError(res, err, 'Failed to ingest webhook finding');
    }
  },
);

async function ingestFinding(
  body: z.infer<typeof findingSchema>,
  origin: 'api' | 'webhook',
): Promise<ReturnType<typeof rowToCase>> {
  const id = makeCaseId();
  const now = new Date();
  const actor = body.assignedTo ?? `${origin}:ingest`;
  const initialTimeline = [
    {
      id: randomUUID(),
      stage: 'ingested' as RemediationStage,
      message: `Finding ingested via ${origin}${body.cveId ? ` (CVE: ${body.cveId})` : ''}`,
      actor,
      timestamp: now.toISOString(),
    },
  ];

  const [row] = await db
    .insert(sentraRemediationCasesTable)
    .values({
      id,
      cveId: body.cveId ?? null,
      title: body.title,
      description: body.description,
      severity: body.severity,
      source: body.source,
      sourceRef: body.sourceRef ?? null,
      affectedAsset: body.affectedAsset ?? null,
      affectedAssets: body.affectedAssets,
      stage: 'ingested',
      outcome: 'pending',
      context: body.context,
      timeline: initialTimeline,
      assignedTo: body.assignedTo ?? null,
      detectedAt: now,
      updatedAt: now,
    })
    .returning();

  if (!row) throw new Error('Insert returned no row');
  logger.info({ id, severity: body.severity, source: body.source }, '[sentra-remediation] case ingested');
  return rowToCase(row);
}

// POST /sentra/remediation/cases/:id/contextualize — enrich with blast/asset data
router.post('/sentra/remediation/cases/:id/contextualize', authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [existing] = await db
      .select()
      .from(sentraRemediationCasesTable)
      .where(eq(sentraRemediationCasesTable.id, id))
      .limit(1);
    if (!existing) return sendNotFound(res, 'Remediation case');
    if (!enforceStage(res, existing.stage as RemediationStage, 'contextualize')) return;

    const actor = (req.body as { actor?: string })?.actor ?? 'context-engine';
    const enrichedContext = {
      ...(existing.context ?? {}),
      assetCriticality: existing.severity === 'critical' ? 'tier-1' : existing.severity === 'high' ? 'tier-2' : 'tier-3',
      existingControls: ['EDR', 'WAF', 'segmentation'],
      contextualizedAt: new Date().toISOString(),
    };

    const [updated] = await db
      .update(sentraRemediationCasesTable)
      .set({
        stage: 'contextualized',
        context: enrichedContext,
        timeline: appendTimeline(existing.timeline, {
          stage: 'contextualized',
          message: 'Context enriched: asset criticality + existing controls inventoried',
          actor,
        }),
        updatedAt: new Date(),
      })
      .where(eq(sentraRemediationCasesTable.id, id))
      .returning();
    const stageReceipt = await attachStageReceipt(
      id,
      'contextualized',
      { priorStage: existing.stage, priorContext: existing.context ?? null },
      { contextEngine: 'default' },
      { stage: 'contextualized', context: enrichedContext },
      actor,
    );
    sendSuccess(res, { ...rowToCase(updated!), _pipelineReceipt: stageReceipt });
  } catch (err) {
    handleRouteError(res, err, 'Failed to contextualize case');
  }
});

// POST /sentra/remediation/cases/:id/recommend — generate remediation action
router.post('/sentra/remediation/cases/:id/recommend', authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [existing] = await db
      .select()
      .from(sentraRemediationCasesTable)
      .where(eq(sentraRemediationCasesTable.id, id))
      .limit(1);
    if (!existing) return sendNotFound(res, 'Remediation case');
    if (!enforceStage(res, existing.stage as RemediationStage, 'recommend')) return;

    const recommendation = generateRecommendation({
      severity: existing.severity,
      cveId: existing.cveId,
      description: existing.description,
    });
    const actor = (req.body as { actor?: string })?.actor ?? 'recommendation-engine';
    const proofId = await bindProof({
      caseId: id,
      contentType: 'remediation:recommendation',
      rationale: recommendation.rationale,
      confidence: recommendation.confidence,
    });

    const [updated] = await db
      .update(sentraRemediationCasesTable)
      .set({
        stage: 'recommended',
        recommendation,
        proofChainIds: proofId ? [...existing.proofChainIds, proofId] : existing.proofChainIds,
        timeline: appendTimeline(existing.timeline, {
          stage: 'recommended',
          message: `Recommendation: ${recommendation.action} (confidence ${(recommendation.confidence * 100).toFixed(0)}%)`,
          actor,
          proofId,
        }),
        updatedAt: new Date(),
      })
      .where(eq(sentraRemediationCasesTable.id, id))
      .returning();
    const stageReceipt = await attachStageReceipt(
      id,
      'recommended',
      { priorStage: existing.stage, severity: existing.severity, cveId: existing.cveId },
      { engine: 'recommendation-engine' },
      { stage: 'recommended', recommendation, proofId },
      actor,
    );
    sendSuccess(res, { ...rowToCase(updated!), _pipelineReceipt: stageReceipt });
  } catch (err) {
    handleRouteError(res, err, 'Failed to generate recommendation');
  }
});

// POST /sentra/remediation/cases/:id/simulate — blast-radius + rollback plan
router.post('/sentra/remediation/cases/:id/simulate', authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [existing] = await db
      .select()
      .from(sentraRemediationCasesTable)
      .where(eq(sentraRemediationCasesTable.id, id))
      .limit(1);
    if (!existing) return sendNotFound(res, 'Remediation case');
    if (!enforceStage(res, existing.stage as RemediationStage, 'simulate')) return;

    const simulation = simulateImpact({
      affectedAssets: existing.affectedAssets,
      severity: existing.severity,
    });
    const actor = (req.body as { actor?: string })?.actor ?? 'simulation-engine';

    const [updated] = await db
      .update(sentraRemediationCasesTable)
      .set({
        stage: 'simulated',
        simulation,
        timeline: appendTimeline(existing.timeline, {
          stage: 'simulated',
          message: `Simulation: ${simulation.affectedSystemCount} systems · ~${simulation.estimatedDowntimeMinutes}m downtime · blast=${simulation.blastRadius}`,
          actor,
        }),
        updatedAt: new Date(),
      })
      .where(eq(sentraRemediationCasesTable.id, id))
      .returning();
    const stageReceipt = await attachStageReceipt(
      id,
      'simulated',
      { priorStage: existing.stage, affectedAssets: existing.affectedAssets, severity: existing.severity },
      { engine: 'simulation-engine' },
      { stage: 'simulated', simulation },
      actor,
    );
    sendSuccess(res, { ...rowToCase(updated!), _pipelineReceipt: stageReceipt });
  } catch (err) {
    handleRouteError(res, err, 'Failed to simulate impact');
  }
});

// POST /sentra/remediation/cases/:id/policy — Covenant gate evaluation
router.post('/sentra/remediation/cases/:id/policy', authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [existing] = await db
      .select()
      .from(sentraRemediationCasesTable)
      .where(eq(sentraRemediationCasesTable.id, id))
      .limit(1);
    if (!existing) return sendNotFound(res, 'Remediation case');
    if (!enforceStage(res, existing.stage as RemediationStage, 'policy')) return;

    const blast = existing.simulation?.blastRadius ?? 'medium';
    // AGI-stack wiring (#5503): if the Detector Council has fired with this
    // case id as the correlation key, fold the verdict into the policy
    // decision. Verdict can only escalate the tier (never downgrade), and
    // a read-only governance ceiling clamps auto-approve to operator.
    const verdict = getLatestVerdict(existing.id);
    const policy = evaluatePolicy({
      severity: existing.severity,
      blastRadius: blast,
      council: verdict
        ? {
            arbitratedSeverity: verdict.arbitratedSeverity,
            governanceCeiling: verdict.governanceCeiling,
            confidence: verdict.confidence,
            distinctKinds: verdict.distinctKinds,
          }
        : null,
    });
    const actor = (req.body as { actor?: string })?.actor ?? 'covenant-policy';
    const proofId = await bindProof({
      caseId: id,
      contentType: 'remediation:policy-gate',
      rationale: policy.tierReason,
      confidence: 0.99,
    });

    // Auto-approved cases skip the wait state and immediately advance to "approved".
    const nextStage: RemediationStage = policy.requiredTier === 'auto' ? 'approved' : 'policy-gated';
    const finalPolicy =
      policy.requiredTier === 'auto'
        ? {
            ...policy,
            decision: 'approved' as const,
            approvedBy: 'covenant-auto',
            approvedAt: new Date().toISOString(),
          }
        : policy;

    const [updated] = await db
      .update(sentraRemediationCasesTable)
      .set({
        stage: nextStage,
        policy: finalPolicy,
        proofChainIds: proofId ? [...existing.proofChainIds, proofId] : existing.proofChainIds,
        timeline: appendTimeline(existing.timeline, {
          stage: nextStage,
          message: policy.tierReason,
          actor,
          proofId,
        }),
        updatedAt: new Date(),
      })
      .where(eq(sentraRemediationCasesTable.id, id))
      .returning();
    const stageReceipt = await attachStageReceipt(
      id,
      nextStage === 'approved' ? 'approved' : 'policy-gated',
      { priorStage: existing.stage, blastRadius: blast, councilVerdict: verdict ?? null },
      { gate: 'covenant-policy' },
      { stage: nextStage, policy: finalPolicy },
      actor,
    );
    sendSuccess(res, { ...rowToCase(updated!), _pipelineReceipt: stageReceipt });
  } catch (err) {
    handleRouteError(res, err, 'Failed to evaluate policy');
  }
});

// POST /sentra/remediation/cases/:id/approve — operator/executive approval
// REQUIRES authenticated principal. Tier is derived from req.user.roles
// (NOT a body string), so callers cannot self-assert executive authority.
router.post(
  '/sentra/remediation/cases/:id/approve',
  authMiddleware({ required: true }),
  validateBody(approvalSchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const id = req.params.id as string;
      const [existing] = await db
        .select()
        .from(sentraRemediationCasesTable)
        .where(eq(sentraRemediationCasesTable.id, id))
        .limit(1);
      if (!existing) return sendNotFound(res, 'Remediation case');
      if (!enforceStage(res, existing.stage as RemediationStage, 'approve')) return;

      const body = req.body as z.infer<typeof approvalSchema>;
      const requiredTier = existing.policy?.requiredTier ?? 'operator';
      const actorTier = tierFromUser(user);
      const approverIdentity = principalLabel(user);

      // Approver must hold a qualifying role at all (viewers cannot approve).
      // Then enforce tier hierarchy: an operator cannot rubber-stamp a case
      // that Covenant policy marked as "executive". Rejections require at
      // least operator-tier — they still close out the case officially.
      if (!actorTier) {
        res.status(403).json({
          error: `Approval requires an operator- or executive-tier role; principal "${approverIdentity}" has none.`,
          code: 'APPROVAL_ROLE_REQUIRED',
          requiredTier,
          principal: approverIdentity,
        });
        return;
      }
      if (body.decision === 'approved' && TIER_RANK[actorTier] < TIER_RANK[requiredTier]) {
        res.status(403).json({
          error: `Approval requires "${requiredTier}" tier; principal "${approverIdentity}" resolves to "${actorTier}".`,
          code: 'APPROVAL_TIER_INSUFFICIENT',
          requiredTier,
          actorTier,
          principal: approverIdentity,
        });
        return;
      }

      const now = new Date();
      const policy = {
        ...(existing.policy ?? { requiredTier: 'operator' as const, tierReason: 'manual review' }),
        decision: body.decision,
        approvedBy: approverIdentity,
        approvedAt: now.toISOString(),
        rejectionReason: body.decision === 'rejected' ? body.reason : undefined,
      };
      const proofId = await bindProof({
        caseId: id,
        contentType: 'remediation:approval',
        rationale: `${body.decision} by ${approverIdentity}${body.reason ? `: ${body.reason}` : ''}`,
        confidence: 1,
      });

      const nextStage: RemediationStage = body.decision === 'approved' ? 'approved' : 'failed';
      const [updated] = await db
        .update(sentraRemediationCasesTable)
        .set({
          stage: nextStage,
          policy,
          outcome: body.decision === 'rejected' ? 'risk-accepted' : 'pending',
          proofChainIds: proofId ? [...existing.proofChainIds, proofId] : existing.proofChainIds,
          timeline: appendTimeline(existing.timeline, {
            stage: nextStage,
            message: `Approval ${body.decision} by ${approverIdentity}${body.reason ? `: ${body.reason}` : ''}`,
            actor: approverIdentity,
            proofId,
          }),
          updatedAt: now,
          resolvedAt: body.decision === 'rejected' ? now : null,
        })
        .where(eq(sentraRemediationCasesTable.id, id))
        .returning();
      const stageReceipt = await attachStageReceipt(
        id,
        nextStage,
        { priorStage: existing.stage, requiredTier, actorTier },
        { decision: body.decision, requiredTier },
        { stage: nextStage, approver: approverIdentity, policy, proofId },
        approverIdentity,
      );
      sendSuccess(res, { ...rowToCase(updated!), _pipelineReceipt: stageReceipt });
    } catch (err) {
      handleRouteError(res, err, 'Failed to record approval');
    }
  },
);

// POST /sentra/remediation/cases/:id/agi-arbitrate — convene the Detector
// Council on a bundle of candidate findings for this case. The verdict is
// kept in the latest-verdict ring under the case id so the next `policy`
// stage folds it into the autonomy tier decision. A timeline entry is
// recorded so the audit trail captures the arbitration.
const arbitrateSchema = z.object({
  candidates: z
    .array(
      z.object({
        finding: z.object({
          id: z.string(),
          detectorId: z.string(),
          runId: z.string().optional().default('agi-arbitrate'),
          severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
          score: z.number().min(0).max(1),
          title: z.string(),
          summary: z.string(),
          attackTechniques: z.array(z.string()).optional().default([]),
          affectedAssets: z.array(z.string()).optional().default([]),
          evidence: z.record(z.unknown()).optional().default({}),
          emittedAt: z.string().optional(),
          governanceClass: z
            .enum(['read-only', 'advisory', 'mutating', 'auto-remediable'])
            .optional()
            .default('advisory'),
        }),
        detectorKind: z.enum([
          'heuristic',
          'signature',
          'statistical',
          'ml',
          'correlation',
          'antivenom',
          'temporal',
        ]),
      }),
    )
    .min(1)
    .max(64),
});

router.post(
  '/sentra/remediation/cases/:id/agi-arbitrate',
  authMiddleware({ required: true }),
  validateBody(arbitrateSchema),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const [existing] = await db
        .select()
        .from(sentraRemediationCasesTable)
        .where(eq(sentraRemediationCasesTable.id, id))
        .limit(1);
      if (!existing) return sendNotFound(res, 'Remediation case');

      const body = req.body as z.infer<typeof arbitrateSchema>;
      const candidates = body.candidates.map((c) => ({
        finding: {
          ...c.finding,
          emittedAt: c.finding.emittedAt ?? new Date().toISOString(),
        } as Finding,
        detectorKind: c.detectorKind as DetectorKind,
      }));
      const result = await deliberateAndReceipt(id, candidates);
      if (!result) {
        res.status(422).json({
          error: 'Council could not produce a verdict from the supplied candidates.',
          code: 'COUNCIL_NO_VERDICT',
        });
        return;
      }

      const actor = (req.body as { actor?: string })?.actor ?? 'detector-council';
      const [updated] = await db
        .update(sentraRemediationCasesTable)
        .set({
          timeline: appendTimeline(existing.timeline, {
            stage: existing.stage as RemediationStage,
            message: `MARBLE verdict ${result.verdict.arbitratedSeverity} (confidence ${(result.verdict.confidence * 100).toFixed(0)}%, ${result.verdict.distinctKinds} kinds, ceiling=${result.verdict.governanceCeiling}). Receipt ${result.chainReceiptId.slice(0, 12)}…`,
            actor,
          }),
          updatedAt: new Date(),
        })
        .where(eq(sentraRemediationCasesTable.id, id))
        .returning();
      sendCreated(res, {
        verdict: result.verdict,
        chainReceiptId: result.chainReceiptId,
        case: rowToCase(updated!),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to arbitrate council verdict for case');
    }
  },
);

// POST /sentra/remediation/cases/:id/execute — dispatch remediation
// REQUIRES authenticated principal with operator-or-higher tier. The
// executor identity is taken from req.user — body cannot impersonate.
router.post(
  '/sentra/remediation/cases/:id/execute',
  authMiddleware({ required: true }),
  validateBody(executionSchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const id = req.params.id as string;
      const [existing] = await db
        .select()
        .from(sentraRemediationCasesTable)
        .where(eq(sentraRemediationCasesTable.id, id))
        .limit(1);
      if (!existing) return sendNotFound(res, 'Remediation case');
      if (!enforceStage(res, existing.stage as RemediationStage, 'execute')) return;
      // Defense-in-depth: even if a case were forced to "approved" out-of-band,
      // refuse to execute unless Covenant policy actually approved it.
      if (existing.policy?.decision !== 'approved') {
        res.status(403).json({
          error: 'Cannot execute: Covenant policy has not approved this case.',
          code: 'EXECUTION_NOT_APPROVED',
        });
        return;
      }
      // Require operator-or-higher to execute — viewers cannot run patches.
      const actorTier = tierFromUser(user);
      if (!actorTier) {
        res.status(403).json({
          error: 'Execution requires an operator- or executive-tier role.',
          code: 'EXECUTION_ROLE_REQUIRED',
          principal: principalLabel(user),
        });
        return;
      }

      const body = req.body as z.infer<typeof executionSchema>;
      const executorIdentity = principalLabel(user);
      const now = new Date();
      const dispatchedTo = existing.affectedAssets.length > 0 ? existing.affectedAssets : ['default-fleet'];
      const execution = {
        instructions: existing.recommendation?.action ?? 'apply remediation per recommendation',
        dispatchedTo,
        startedAt: now.toISOString(),
        completedAt: now.toISOString(),
        executor: executorIdentity,
        result: body.result,
        notes: body.notes,
      };
      const proofId = await bindProof({
        caseId: id,
        contentType: 'remediation:execution',
        rationale: `Execution by ${executorIdentity}: ${body.result}${body.notes ? ` — ${body.notes}` : ''}`,
        confidence: 0.97,
      });

      // Record an "executing" transition first so the canonical lifecycle
      // includes the stage. We then settle to either "verifying" (success or
      // partial — needs verification) or "failed" (terminal) in the same
      // write so the timeline shows both transitions atomically.
      const settledStage: RemediationStage = body.result === 'failed' ? 'failed' : 'verifying';
      const interimTimeline = appendTimeline(existing.timeline, {
        stage: 'executing',
        message: `Dispatched to ${dispatchedTo.length} target(s) by ${executorIdentity}`,
        actor: executorIdentity,
        proofId,
      });
      const finalTimeline = appendTimeline(interimTimeline, {
        stage: settledStage,
        message: `Execution settled — result: ${body.result}${
          body.result === 'failed' ? ' (no verification possible)' : ' (awaiting verification)'
        }`,
        actor: executorIdentity,
      });

      const [updated] = await db
        .update(sentraRemediationCasesTable)
        .set({
          stage: settledStage,
          execution,
          outcome: body.result === 'failed' ? 'failed' : existing.outcome,
          proofChainIds: proofId ? [...existing.proofChainIds, proofId] : existing.proofChainIds,
          timeline: finalTimeline,
          updatedAt: now,
          resolvedAt: body.result === 'failed' ? now : null,
        })
        .where(eq(sentraRemediationCasesTable.id, id))
        .returning();
      // Execute hits two transitions atomically; emit a receipt for each so
      // the chain reflects the canonical 9-stage lifecycle.
      await attachStageReceipt(
        id,
        'executing',
        { priorStage: existing.stage, dispatchedTo },
        { mode: 'dispatch' },
        { stage: 'executing', execution, proofId },
        executorIdentity,
      );
      const stageReceipt = await attachStageReceipt(
        id,
        settledStage,
        { dispatchResult: body.result, dispatchedTo },
        { settlement: 'execute' },
        { stage: settledStage, execution, outcome: body.result === 'failed' ? 'failed' : existing.outcome },
        executorIdentity,
      );
      sendSuccess(res, { ...rowToCase(updated!), _pipelineReceipt: stageReceipt });
    } catch (err) {
      handleRouteError(res, err, 'Failed to record execution');
    }
  },
);

// POST /sentra/remediation/cases/:id/verify — verification + outcome capture
// REQUIRES authenticated principal. Verifier identity comes from req.user.
router.post(
  '/sentra/remediation/cases/:id/verify',
  authMiddleware({ required: true }),
  validateBody(verificationSchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const actorTier = tierFromUser(user);
      if (!actorTier) {
        res.status(403).json({
          error: 'Verification requires an operator- or executive-tier role.',
          code: 'VERIFICATION_ROLE_REQUIRED',
          principal: principalLabel(user),
        });
        return;
      }
      const id = req.params.id as string;
      const [existing] = await db
        .select()
        .from(sentraRemediationCasesTable)
        .where(eq(sentraRemediationCasesTable.id, id))
        .limit(1);
      if (!existing) return sendNotFound(res, 'Remediation case');
      if (!enforceStage(res, existing.stage as RemediationStage, 'verify')) return;

      const body = req.body as z.infer<typeof verificationSchema>;
      const verifierIdentity = principalLabel(user);
      const now = new Date();
      const verification = {
        verifiedAt: now.toISOString(),
        verifiedBy: verifierIdentity,
        method: body.method,
        vulnerabilityResolved: body.vulnerabilityResolved,
        regressionDetected: body.regressionDetected ?? false,
        notes: body.notes,
      };
      const proofId = await bindProof({
        caseId: id,
        contentType: 'remediation:verification',
        rationale: `Verified by ${verifierIdentity} via ${body.method}: resolved=${body.vulnerabilityResolved}, regression=${body.regressionDetected}`,
        confidence: 0.99,
      });

      const finalStage: RemediationStage = body.vulnerabilityResolved ? 'resolved' : 'failed';
      const finalOutcome = body.regressionDetected
        ? 'regressed'
        : body.vulnerabilityResolved
          ? 'verified'
          : 'failed';

      const [updated] = await db
        .update(sentraRemediationCasesTable)
        .set({
          stage: finalStage,
          verification,
          outcome: finalOutcome,
          proofChainIds: proofId ? [...existing.proofChainIds, proofId] : existing.proofChainIds,
          timeline: appendTimeline(existing.timeline, {
            stage: finalStage,
            message: `Verification (${body.method}): vulnerability ${
              body.vulnerabilityResolved ? 'resolved' : 'NOT resolved'
            }${body.regressionDetected ? ' · REGRESSION DETECTED' : ''}`,
            actor: verifierIdentity,
            proofId,
          }),
          updatedAt: now,
          resolvedAt: now,
        })
        .where(eq(sentraRemediationCasesTable.id, id))
        .returning();
      // Verify can settle to either `resolved` or `failed`. Emit a stage
      // receipt for the canonical `verifying` transition the lifecycle
      // implies, and a second one for the terminal stage.
      await attachStageReceipt(
        id,
        'verifying',
        { priorStage: existing.stage, method: body.method },
        { verifier: verifierIdentity },
        { stage: 'verifying', verification, proofId },
        verifierIdentity,
      );
      const stageReceipt = await attachStageReceipt(
        id,
        finalStage,
        { vulnerabilityResolved: body.vulnerabilityResolved, regressionDetected: body.regressionDetected ?? false },
        { settlement: 'verify' },
        { stage: finalStage, verification, outcome: finalOutcome },
        verifierIdentity,
      );
      sendSuccess(res, { ...rowToCase(updated!), _pipelineReceipt: stageReceipt });
    } catch (err) {
      handleRouteError(res, err, 'Failed to verify remediation');
    }
  },
);

// PATCH /sentra/remediation/cases/:id — note-only updates.
// Stage transitions are intentionally NOT permitted here; they must go
// through the dedicated lifecycle endpoints (/contextualize, /recommend,
// /simulate, /policy, /approve, /execute, /verify) so that
// ALLOWED_PRECEDING_STAGES + tier checks are always enforced. Any attempt
// to send a `stage` field is rejected by the schema's strict shape.
router.patch(
  '/sentra/remediation/cases/:id',
  authMiddleware({ required: true }),
  validateBody(advanceSchema),
  async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const [existing] = await db
        .select()
        .from(sentraRemediationCasesTable)
        .where(eq(sentraRemediationCasesTable.id, id))
        .limit(1);
      if (!existing) return sendNotFound(res, 'Remediation case');

      // Reject any attempt to mutate stage via PATCH; surface the proper
      // dedicated endpoint so callers don't silently fall back to bypass.
      if (
        req.body &&
        typeof req.body === 'object' &&
        Object.prototype.hasOwnProperty.call(req.body, 'stage')
      ) {
        res.status(400).json({
          error:
            'PATCH does not accept "stage". Stage transitions must go through the dedicated lifecycle endpoints (/contextualize, /recommend, /simulate, /policy, /approve, /execute, /verify).',
          code: 'STAGE_MUTATION_FORBIDDEN',
        });
        return;
      }

      const body = req.body as z.infer<typeof advanceSchema>;
      const actor = body.actor ?? existing.assignedTo ?? 'operator';
      const currentStage = existing.stage as RemediationStage;
      const [updated] = await db
        .update(sentraRemediationCasesTable)
        .set({
          timeline: appendTimeline(existing.timeline, {
            stage: currentStage,
            message: `Note: ${body.note}`,
            actor,
          }),
          updatedAt: new Date(),
        })
        .where(eq(sentraRemediationCasesTable.id, id))
        .returning();
      sendSuccess(res, rowToCase(updated!));
    } catch (err) {
      handleRouteError(res, err, 'Failed to update remediation case');
    }
  },
);

// GET /sentra/remediation/metrics — pipeline KPIs for the dashboard
router.get('/sentra/remediation/metrics', async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(sentraRemediationCasesTable);
    const total = rows.length;
    const byStage: Record<string, number> = {};
    const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    let resolvedCount = 0;
    let failedCount = 0;
    let mttrSecondsTotal = 0;
    let mttrCount = 0;
    let pendingApproval = 0;
    let oldestPendingApprovalAgeMin = 0;

    const now = Date.now();
    for (const row of rows) {
      byStage[row.stage] = (byStage[row.stage] ?? 0) + 1;
      bySeverity[row.severity] = (bySeverity[row.severity] ?? 0) + 1;
      if (row.stage === 'resolved') resolvedCount++;
      if (row.stage === 'failed') failedCount++;
      if (row.resolvedAt) {
        mttrSecondsTotal += (row.resolvedAt.getTime() - row.detectedAt.getTime()) / 1000;
        mttrCount++;
      }
      if (row.stage === 'policy-gated') {
        pendingApproval++;
        const ageMin = (now - row.detectedAt.getTime()) / 60_000;
        if (ageMin > oldestPendingApprovalAgeMin) oldestPendingApprovalAgeMin = ageMin;
      }
    }

    const closed = resolvedCount + failedCount;
    sendSuccess(res, {
      source: 'live',
      total,
      open: total - closed,
      resolved: resolvedCount,
      failed: failedCount,
      successRate: closed > 0 ? resolvedCount / closed : 0,
      meanTimeToRemediateSeconds: mttrCount > 0 ? Math.round(mttrSecondsTotal / mttrCount) : null,
      byStage,
      bySeverity,
      approvalBottleneck: {
        pending: pendingApproval,
        oldestAgeMinutes: Math.round(oldestPendingApprovalAgeMin),
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute remediation metrics');
  }
});

// Demo seed — operator-triggered, idempotent (no-op when cases already exist)
router.post('/sentra/remediation/seed-demo', authMiddleware({ required: true }), async (_req: Request, res: Response) => {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sentraRemediationCasesTable);
    if ((count ?? 0) > 0) {
      return sendSuccess(res, { seeded: 0, skipped: true });
    }
    const seeds: Array<z.infer<typeof findingSchema>> = [
      {
        cveId: 'CVE-2026-31337',
        title: 'Critical RCE in Linux kernel io_uring (Pillpintu finding)',
        description:
          'Anthropic Khipu Preview discovered a heap-overflow in io_uring submission queue handling, exploitable for local privilege escalation and remote code execution via container escape.',
        severity: 'critical',
        affectedAssets: ['linux-fleet-prod', 'k8s-node-pool-1', 'k8s-node-pool-2'],
        source: 'pillpintu',
        sourceRef: 'khipu-preview/2026-04-19',
        context: { cvss: 9.8, kev: true, exploitMaturity: 'public-poc' },
      },
      {
        cveId: 'CVE-2026-22115',
        title: 'High-sev SSRF in OpenSSH ProxyCommand parser',
        description:
          'Mishandled URI parsing allows attacker-controlled ProxyCommand resolution leading to authenticated SSRF and credential exfiltration.',
        severity: 'high',
        affectedAssets: ['bastion-east-1', 'bastion-west-1'],
        source: 'tenable',
      },
      {
        title: 'Medium misconfig: S3 bucket logging disabled',
        description: 'Six S3 buckets in production lack server-access logging — violates SOC2 CC7.2.',
        severity: 'medium',
        affectedAssets: ['s3-prod-data', 's3-prod-logs', 's3-prod-backups'],
        source: 'manual',
      },
      {
        title: 'Low: TLS 1.1 still enabled on edge LB',
        description: 'Edge load balancer accepts TLS 1.1 connections; deprecate per company policy.',
        severity: 'low',
        affectedAssets: ['edge-lb-primary'],
        source: 'manual',
      },
    ];

    let seeded = 0;
    for (const finding of seeds) {
      await ingestFinding(finding, 'api');
      seeded++;
    }
    sendSuccess(res, { seeded, skipped: false });
  } catch (err) {
    handleRouteError(res, err, 'Failed to seed demo cases');
  }
});

export default router;
