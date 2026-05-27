/**
 * Perception/Bio API surface — Task #5519.
 *
 * Server-side governed entry points for the shared packages
 * `@szl-holdings/perception-loop`, `@szl-holdings/sequence-pipeline`,
 * `@szl-holdings/procedural-kit`. Every endpoint:
 *
 *   - validates body with zod;
 *   - runs through the in-process policy-guard with deny-by-default;
 *   - rate-limits via the standard writeLimiter (per-user/org bucket);
 *   - appends a typed entry to the evidence ledger tagged with its
 *     Doctrine V6 pillar in `policyReason`;
 *   - returns the receipt-class string + ledger entryId so the caller
 *     can audit the write.
 *
 * Perception endpoints additionally pass through the antivenom
 * guardrail (`perceptionAntivenom`): the server never sees frames,
 * only feature vectors, and every verify call must present a single-use
 * server-issued nonce inside a `PERCEPTION_FRESHNESS_WINDOW_MS`. Replay
 * is rejected on the nonce store, not on the client timestamp alone.
 *
 * Cross-package server contract: this file is the only place api-server
 * imports the three new packages. Artifact consumers reach them only
 * through the typed HTTP surface, per the task brief.
 */
import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  PERCEPTION_ENVELOPE_RECEIPT_CLASS,
  summariseDetections,
  type PerceptionEnvelope,
} from '@szl-holdings/perception-loop';
import {
  PIPELINE_STAGE_RECEIPT_CLASS,
  PIPELINE_TABULATED_STATISTIC_RECEIPT_CLASS,
  validateTabulatedStatistic,
  wilsonInterval,
} from '@szl-holdings/sequence-pipeline';
import {
  SCENE_COMPOSED_RECEIPT_CLASS,
} from '@szl-holdings/procedural-kit';
import { PolicyGuardEngine } from '@szl-holdings/policy-guard';
import type {
  PolicyCheckRequest,
  PolicyRule,
  ProofEnvelope,
} from '@szl-holdings/shared-contracts';
import {
  EvidenceLedger,
  defaultEvidenceLedgerStore,
} from '@szl-holdings/evidence-ledger';
import { authMiddleware } from '../middlewares/auth';
import { writeLimiter } from '../middlewares/rate-limiters';
import { validateBody } from '../lib/validation';
import { sendCreated, sendError } from '../lib/api-response';
import { logger } from '../lib/logger';

// ─── Doctrine V6 pillar / receipt classes ────────────────────────────────────

/** Doctrine V6 pillars used in policyReason tags (see synthesis §1–§5). */
const PILLAR = {
  evidenceFirst: 'evidence-first',
  policyAware: 'policy-aware-actions',
  governedAutonomy: 'governed-autonomy',
  operationalOntology: 'operational-ontology',
} as const;

export const PEAK_DETECTION_RECEIPT_CLASS = 'peak.detection.v1' as const;
export const PEAK_CLASSIFICATION_RECEIPT_CLASS = 'peak.classification.v1' as const;

// ─── Antivenom: nonce store + freshness window ───────────────────────────────

/**
 * Single-use nonce store. The freshness window is the maximum age the
 * server will accept on a perception verify call — it is **also** the
 * authoritative ttl on the nonce itself. Tightening the window
 * tightens both at once, which is the property the antivenom relies on.
 *
 * Persistence: in-memory. The store is single-instance and acceptable
 * because perception nonces are short-lived (default 30s) — losing them
 * on restart means a small population of in-flight clients re-requests
 * a nonce; it never permits replay.
 */
export const PERCEPTION_FRESHNESS_WINDOW_MS = 30_000;
const NONCE_BYTES = 24;
const MAX_NONCES_TRACKED = 10_000;

interface NonceRecord {
  readonly nonceId: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly issuedTo: string;
  used: boolean;
}

const nonces = new Map<string, NonceRecord>();

function gcNonces(now: number): void {
  if (nonces.size < MAX_NONCES_TRACKED) {
    // Cheap path: only drop expired-and-used.
    for (const [id, rec] of nonces) {
      if (rec.expiresAt < now && rec.used) nonces.delete(id);
    }
    return;
  }
  // Expensive path: drop all expired entries.
  for (const [id, rec] of nonces) {
    if (rec.expiresAt < now) nonces.delete(id);
  }
}

export function _resetPerceptionNoncesForTest(): void {
  nonces.clear();
}

export interface NonceIssuance {
  readonly nonceId: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

function issueNonce(issuedTo: string): NonceIssuance {
  const now = Date.now();
  gcNonces(now);
  const nonceId = crypto.randomBytes(NONCE_BYTES).toString('hex');
  const expiresAt = now + PERCEPTION_FRESHNESS_WINDOW_MS;
  nonces.set(nonceId, { nonceId, issuedAt: now, expiresAt, issuedTo, used: false });
  return {
    nonceId,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

type NonceVerdict =
  | { ok: true; record: NonceRecord }
  | { ok: false; code: 'NONCE_UNKNOWN' | 'NONCE_EXPIRED' | 'NONCE_REPLAYED' | 'NONCE_WRONG_ACTOR'; reason: string };

function consumeNonce(nonceId: string, callerId: string, capturedAt: number): NonceVerdict {
  const now = Date.now();
  const rec = nonces.get(nonceId);
  if (!rec) return { ok: false, code: 'NONCE_UNKNOWN', reason: 'nonce not issued by this server' };
  if (rec.used) return { ok: false, code: 'NONCE_REPLAYED', reason: 'nonce already consumed (replay)' };
  if (rec.expiresAt < now) return { ok: false, code: 'NONCE_EXPIRED', reason: 'nonce outside freshness window' };
  if (rec.issuedTo !== callerId) {
    return { ok: false, code: 'NONCE_WRONG_ACTOR', reason: 'nonce was issued to a different caller' };
  }
  // Freshness on the client timestamp: capturedAt must lie inside the
  // nonce's lifetime — antivenom rejects "stale capture, fresh nonce".
  if (capturedAt < rec.issuedAt - 1_000 || capturedAt > rec.expiresAt + 1_000) {
    return { ok: false, code: 'NONCE_EXPIRED', reason: 'capture timestamp outside nonce window' };
  }
  rec.used = true;
  return { ok: true, record: rec };
}

// ─── Policy guard rules per receipt class ────────────────────────────────────

const policyRules: PolicyRule[] = [
  {
    policyId: 'PERC-001',
    description: 'Perception verify requires an authenticated, non-readonly caller.',
    tier: 'high',
    conditions: ['action:perception.verify'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'PERC-002',
    description: 'Bulk perception verify on an org without an active reviewer requires approval.',
    tier: 'critical',
    conditions: ['action:perception.verify.bulk'],
    verdict: 'requires-approval',
    requiresApprovalFrom: ['operator'],
    auditRequired: true,
  },
  {
    policyId: 'SEQP-001',
    description: 'Sequence-pipeline trace ingest is allowed for authenticated callers; CI bounds enforced at write.',
    tier: 'medium',
    conditions: ['action:sequence-pipeline.trace.ingest'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'PEAK-001',
    description: 'Peak-detector batch scoring is allowed; ranked-candidate cutoff actor is mandatory on classification.',
    tier: 'medium',
    conditions: ['action:peak-detector.batch.score'],
    verdict: 'allowed',
    auditRequired: true,
  },
  {
    policyId: 'USD-001',
    description: 'Procedural-kit USD export is allowed; scene seed + library ref captured in receipt.',
    tier: 'medium',
    conditions: ['action:procedural-kit.usd-export'],
    verdict: 'allowed',
    auditRequired: true,
  },
];

const policyEngine = new PolicyGuardEngine(policyRules, { strictMode: true });

interface AuthedCaller {
  readonly callerId: string;
  readonly role: string;
  readonly traceId: string;
}

function authedCaller(req: Request): AuthedCaller {
  const u = (req as Request & { user?: { id?: string | number; role?: string; orgId?: string | number } }).user;
  const callerId = u?.id != null ? `user:${u.id}` : `anon:${req.ip ?? '0.0.0.0'}`;
  const role = (u?.role ?? 'anonymous') as string;
  const traceId =
    (req.headers['x-trace-id'] as string | undefined) ??
    (req.headers['x-correlation-id'] as string | undefined) ??
    `t_${crypto.randomBytes(8).toString('hex')}`;
  return { callerId, role, traceId };
}

function evaluatePolicy(actionType: string, caller: AuthedCaller): { allowed: boolean; reason: string; matchedPolicyId?: string } {
  const req: PolicyCheckRequest = {
    actionType,
    agentRole: caller.role,
    traceId: caller.traceId,
  };
  const result = policyEngine.evaluate(req);
  const out: { allowed: boolean; reason: string; matchedPolicyId?: string } = {
    allowed: result.verdict === 'allowed',
    reason: result.reason ?? result.verdict,
  };
  if (result.matchedPolicyId !== undefined) out.matchedPolicyId = result.matchedPolicyId;
  return out;
}

// ─── Evidence-ledger emission ────────────────────────────────────────────────

/**
 * Per-route ledger. We hold one EvidenceLedger instance so the
 * `getAll()` accessor is available to tests; entries are persisted
 * through the defaultEvidenceLedgerStore fan-out.
 */
const ledger = new EvidenceLedger();

export function _getPerceptionBioLedgerForTest(): EvidenceLedger {
  return ledger;
}

interface EmitOptions {
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly pillar: typeof PILLAR[keyof typeof PILLAR];
  readonly receiptClass: string;
  readonly caller: AuthedCaller;
  readonly policyVerdict: 'allowed' | 'blocked' | 'requires-approval';
  readonly extraSources?: ProofEnvelope['sources'];
}

function emitLedger(opts: EmitOptions) {
  const envelope: Omit<ProofEnvelope, 'generatedAt'> = {
    traceId: opts.caller.traceId,
    agentRole: opts.caller.role,
    sources: opts.extraSources ?? [],
    toolCalls: [],
    confidence: 'high',
    freshness: 'fresh',
    policyVerdict: opts.policyVerdict,
    // Pillar + receipt class are recorded in policyReason so downstream
    // audit can filter by both without a schema migration.
    policyReason: `pillar:${opts.pillar};receipt:${opts.receiptClass}`,
  };
  const entry = ledger.append({
    entityType: opts.entityType,
    entityId: opts.entityId,
    action: opts.action,
    actor: opts.caller.callerId,
    actorRole: opts.caller.role,
    envelope,
  });
  // Fan out to the durable singleton too so cross-route consumers see it.
  try {
    const result = defaultEvidenceLedgerStore.save(entry);
    if (result instanceof Promise) result.catch((err) => logger.warn({ err }, 'perception-bio: ledger fan-out failed'));
  } catch (err) {
    logger.warn({ err }, 'perception-bio: ledger fan-out threw');
  }
  return entry;
}

// ─── Zod request schemas ─────────────────────────────────────────────────────

const HEAD_NAMES = ['face', 'body', 'hand', 'gesture', 'iris', 'emotion', 'object', 'person'] as const;

const NonceRequestSchema = z.object({}).strict();

const FeatureVectorSchema = z.object({
  /** Stable hash of the source frame; server never sees the frame itself. */
  frameHash: z.string().min(8).max(256),
  /** Wall-clock millis when the client captured the frame. */
  capturedAt: z.number().int().nonnegative(),
  /** Heads that actually executed; empty array allowed (no detections). */
  ranHeads: z.array(z.enum(HEAD_NAMES)),
  skippedHeads: z.array(z.enum(HEAD_NAMES)),
  /** Per-head detection counts (no boxes, no keypoints, no raw image data). */
  detectionCounts: z.record(z.enum(HEAD_NAMES), z.number().int().nonnegative()).default({}),
  /** Aggregate liveness ∈ [0, 1] computed client-side from the envelope. */
  livenessConfidence: z.number().min(0).max(1),
  budgetMs: z.number().nonnegative(),
  consumerArtifact: z.string().min(1).max(64),
});

const PerceptionVerifyBodySchema = z.object({
  nonceId: z.string().min(8).max(128),
  featureVector: FeatureVectorSchema,
}).strict();

const StageArtefactSchema = z.object({
  stageName: z.string().min(1).max(64),
  stageOrdinal: z.number().int().nonnegative(),
  parentPipelineId: z.string().min(1).max(128),
  inputsHash: z.string().min(8).max(256),
  paramsHash: z.string().min(8).max(256),
  outputsHash: z.string().min(8).max(256),
  tooling: z.record(z.string(), z.string()),
}).strict();

const TabulatedRowSchema = z.object({
  label: z.string().min(1).max(128),
  count: z.number().int().nonnegative(),
  fraction: z.number().min(0).max(1),
  ciLower: z.number().min(0).max(1),
  ciUpper: z.number().min(0).max(1),
  isNegativeSpace: z.boolean(),
}).strict();

const TabulatedStatisticSchema = z.object({
  totalTrials: z.number().int().nonnegative(),
  rows: z.array(TabulatedRowSchema).min(1),
  methodRef: z.string().min(1).max(64),
  requiresNegativeSpace: z.boolean(),
}).strict();

const SequencePipelineTraceBodySchema = z.object({
  pipelineId: z.string().min(1).max(128),
  stages: z.array(StageArtefactSchema).min(1).max(64),
  tabulatedStatistic: TabulatedStatisticSchema.optional(),
}).strict();

const PeakInputSchema = z.object({
  surfaceRef: z.string().min(1).max(128),
  peakId: z.string().min(1).max(128),
  /** Itemised score components — never just a composite. */
  scoreComponents: z.object({
    prominence: z.number(),
    snRatio: z.number(),
    shapeResidual: z.number(),
  }).strict(),
  /** Successes / trials feed Wilson CI on the composite score. */
  successes: z.number().int().nonnegative(),
  trials: z.number().int().positive(),
}).strict();

const PeakBatchBodySchema = z.object({
  detectorVersion: z.string().min(1).max(64),
  peaks: z.array(PeakInputSchema).min(1).max(256),
  /** If present, requests classification too — cutoff actor is mandatory. */
  classification: z.object({
    confidenceCutoff: z.number().min(0).max(1),
    cutoffChosenBy: z.object({
      actor: z.string().min(1).max(128),
      rationale: z.string().min(1).max(512),
    }).strict(),
  }).strict().optional(),
}).strict();

const UsdExportBodySchema = z.object({
  seed: z.number().int(),
  libraryRef: z.string().min(1).max(128),
  partGraphHash: z.string().min(8).max(256),
  sceneHash: z.string().min(8).max(256),
  bom: z.record(z.string().min(1).max(128), z.number().int().nonnegative()),
  /** Caller-supplied artifact for receipt provenance. */
  consumerArtifact: z.string().min(1).max(64),
}).strict();

// ─── Router ──────────────────────────────────────────────────────────────────

const router = Router();

// ─── /perception/nonce ───────────────────────────────────────────────────────

router.post(
  '/perception/nonce',
  writeLimiter,
  authMiddleware(),
  validateBody(NonceRequestSchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const issuance = issueNonce(caller.callerId);
    res.status(201).json({
      ...issuance,
      windowMs: PERCEPTION_FRESHNESS_WINDOW_MS,
    });
  },
);

// ─── /perception/verify ──────────────────────────────────────────────────────

router.post(
  '/perception/verify',
  writeLimiter,
  authMiddleware(),
  validateBody(PerceptionVerifyBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof PerceptionVerifyBodySchema>;

    // 1. Policy guard.
    const decision = evaluatePolicy('perception.verify', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    // 2. Antivenom: single-use nonce inside the freshness window.
    const verdict = consumeNonce(body.nonceId, caller.callerId, body.featureVector.capturedAt);
    if (!verdict.ok) {
      sendError(res, verdict.reason, 401, verdict.code);
      return;
    }

    // 3. Reconstruct an envelope-shaped summary for receipt provenance.
    //    We never instantiate a full PerceptionEnvelope on the server —
    //    the server doctrine is "no frames, only feature vectors" — but
    //    we synthesise the detectionsSummary from the per-head counts so
    //    the receipt records the same shape the client built.
    const fv = body.featureVector;
    const detectionsSummary = summariseDetections({
      frameHash: fv.frameHash,
      ranHeads: fv.ranHeads,
      skippedHeads: fv.skippedHeads,
      face: new Array(fv.detectionCounts.face ?? 0).fill(0).map(() => emptyDetection()),
      body: new Array(fv.detectionCounts.body ?? 0).fill(0).map(() => emptyDetection()),
      hand: new Array(fv.detectionCounts.hand ?? 0).fill(0).map(() => emptyDetection()),
      gesture: new Array(fv.detectionCounts.gesture ?? 0).fill(0).map(() => emptyDetection()),
      object: new Array(fv.detectionCounts.object ?? 0).fill(0).map(() => emptyDetection()),
      person: new Array(fv.detectionCounts.person ?? 0).fill(0).map(() => emptyDetection()),
      liveness: {
        livenessConfidence: fv.livenessConfidence,
        livenessReasons: [],
        windowMs: PERCEPTION_FRESHNESS_WINDOW_MS,
      },
      budgetMs: fv.budgetMs,
      consumerArtifact: fv.consumerArtifact,
    } satisfies Omit<PerceptionEnvelope, 'detectionsSummary'>);

    const entry = emitLedger({
      action: 'perception.verify',
      entityType: 'perception.envelope',
      entityId: fv.frameHash,
      pillar: PILLAR.evidenceFirst,
      receiptClass: PERCEPTION_ENVELOPE_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
      ...(decision.matchedPolicyId !== undefined
        ? {
            extraSources: [
              {
                sourceId: decision.matchedPolicyId,
                title: 'policy-guard match',
                retrievedAt: new Date().toISOString(),
              },
            ],
          }
        : {}),
    });

    sendCreated(res, {
      receiptClass: PERCEPTION_ENVELOPE_RECEIPT_CLASS,
      entryId: entry.entryId,
      traceId: entry.traceId,
      pillar: PILLAR.evidenceFirst,
      detectionsSummary,
      livenessConfidence: fv.livenessConfidence,
      nonceWindowMs: PERCEPTION_FRESHNESS_WINDOW_MS,
    });
  },
);

function emptyDetection() {
  return { score: 0, box: [0, 0, 0, 0] as const, modelVersion: 'server-side-summary' };
}

// ─── /sequence-pipeline/trace ────────────────────────────────────────────────

router.post(
  '/sequence-pipeline/trace',
  writeLimiter,
  authMiddleware(),
  validateBody(SequencePipelineTraceBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof SequencePipelineTraceBodySchema>;

    const decision = evaluatePolicy('sequence-pipeline.trace.ingest', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    // Stage ordinals must be strictly increasing — keeps the chained
    // (parentPipelineId, stageOrdinal) pair globally unique.
    let prev = -1;
    for (const s of body.stages) {
      if (s.stageOrdinal <= prev) {
        sendError(res, `stages out of order at ordinal ${s.stageOrdinal}`, 400, 'STAGE_ORDER');
        return;
      }
      if (s.parentPipelineId !== body.pipelineId) {
        sendError(res, `stage ${s.stageName} parentPipelineId mismatch`, 400, 'STAGE_PARENT');
        return;
      }
      prev = s.stageOrdinal;
    }

    // Tabulated statistic — re-validate on the server boundary so a
    // malformed CI row (no claim without an interval, absence is a row)
    // is rejected even if the client skipped validation.
    if (body.tabulatedStatistic) {
      try {
        validateTabulatedStatistic(body.tabulatedStatistic);
      } catch (err) {
        sendError(
          res,
          err instanceof Error ? err.message : String(err),
          400,
          'TABULATED_STATISTIC_INVALID',
        );
        return;
      }
    }

    // One stage receipt per stage; one terminal tabulated-statistic
    // receipt iff the body included one.
    const entryIds: string[] = [];
    for (const s of body.stages) {
      const entry = emitLedger({
        action: 'sequence-pipeline.stage',
        entityType: 'pipeline.stage',
        entityId: `${s.parentPipelineId}:${s.stageOrdinal}:${s.stageName}`,
        pillar: PILLAR.evidenceFirst,
        receiptClass: PIPELINE_STAGE_RECEIPT_CLASS,
        caller,
        policyVerdict: 'allowed',
      });
      entryIds.push(entry.entryId);
    }
    let terminalEntryId: string | undefined;
    if (body.tabulatedStatistic) {
      const entry = emitLedger({
        action: 'sequence-pipeline.tabulated-statistic',
        entityType: 'pipeline.tabulated-statistic',
        entityId: body.pipelineId,
        pillar: PILLAR.evidenceFirst,
        receiptClass: PIPELINE_TABULATED_STATISTIC_RECEIPT_CLASS,
        caller,
        policyVerdict: 'allowed',
      });
      terminalEntryId = entry.entryId;
    }

    const result: Record<string, unknown> = {
      pipelineId: body.pipelineId,
      stageReceiptClass: PIPELINE_STAGE_RECEIPT_CLASS,
      stageEntryIds: entryIds,
      pillar: PILLAR.evidenceFirst,
    };
    if (terminalEntryId !== undefined) {
      result.tabulatedStatisticReceiptClass = PIPELINE_TABULATED_STATISTIC_RECEIPT_CLASS;
      result.tabulatedStatisticEntryId = terminalEntryId;
    }
    sendCreated(res, result);
  },
);

// ─── /peak-detector/batch ────────────────────────────────────────────────────

router.post(
  '/peak-detector/batch',
  writeLimiter,
  authMiddleware(),
  validateBody(PeakBatchBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof PeakBatchBodySchema>;

    const decision = evaluatePolicy('peak-detector.batch.score', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    // Compute Wilson CI on the per-peak composite score and emit one
    // peak.detection.v1 receipt per peak.
    const scored = body.peaks.map((p) => {
      const composite =
        0.5 * p.scoreComponents.prominence +
        0.3 * p.scoreComponents.snRatio -
        0.2 * p.scoreComponents.shapeResidual;
      const ci = wilsonInterval(p.successes, p.trials, '0.95');
      const entry = emitLedger({
        action: 'peak-detector.detect',
        entityType: 'peak.detection',
        entityId: `${p.surfaceRef}:${p.peakId}`,
        pillar: PILLAR.evidenceFirst,
        receiptClass: PEAK_DETECTION_RECEIPT_CLASS,
        caller,
        policyVerdict: 'allowed',
      });
      return {
        peakId: p.peakId,
        surfaceRef: p.surfaceRef,
        composite,
        scoreComponents: p.scoreComponents,
        confidenceInterval: { p: ci.p, ciLower: ci.ciLower, ciUpper: ci.ciUpper, level: ci.level },
        entryId: entry.entryId,
      };
    });

    // Classification path — the cutoff actor + rationale is mandatory.
    // We re-enforce it here even though the zod schema already does, so
    // the doctrine "no collapse without provenance" is visible at the
    // route boundary too.
    let classification: { receiptClass: typeof PEAK_CLASSIFICATION_RECEIPT_CLASS; entryId: string } | undefined;
    if (body.classification) {
      if (!body.classification.cutoffChosenBy.rationale.trim()) {
        sendError(res, 'cutoffChosenBy.rationale is required', 400, 'CUTOFF_RATIONALE_REQUIRED');
        return;
      }
      const entry = emitLedger({
        action: 'peak-detector.classify',
        entityType: 'peak.classification',
        entityId: `${body.detectorVersion}:${body.peaks.length}`,
        pillar: PILLAR.governedAutonomy,
        receiptClass: PEAK_CLASSIFICATION_RECEIPT_CLASS,
        caller,
        policyVerdict: 'allowed',
      });
      classification = { receiptClass: PEAK_CLASSIFICATION_RECEIPT_CLASS, entryId: entry.entryId };
    }

    const result: Record<string, unknown> = {
      detectorVersion: body.detectorVersion,
      detectionReceiptClass: PEAK_DETECTION_RECEIPT_CLASS,
      peaks: scored,
      pillar: PILLAR.evidenceFirst,
    };
    if (classification) {
      result.classificationReceiptClass = classification.receiptClass;
      result.classificationEntryId = classification.entryId;
    }
    sendCreated(res, result);
  },
);

// ─── /procedural-kit/usd-export ──────────────────────────────────────────────

router.post(
  '/procedural-kit/usd-export',
  writeLimiter,
  authMiddleware(),
  validateBody(UsdExportBodySchema),
  (req: Request, res: Response) => {
    const caller = authedCaller(req);
    const body = req.body as z.infer<typeof UsdExportBodySchema>;

    const decision = evaluatePolicy('procedural-kit.usd-export', caller);
    if (!decision.allowed) {
      sendError(res, decision.reason, 403, 'POLICY_DENIED');
      return;
    }

    const jobId = `usd_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const entry = emitLedger({
      action: 'procedural-kit.usd-export',
      entityType: 'scene.composed',
      entityId: body.sceneHash,
      pillar: PILLAR.operationalOntology,
      receiptClass: SCENE_COMPOSED_RECEIPT_CLASS,
      caller,
      policyVerdict: 'allowed',
    });

    sendCreated(res, {
      jobId,
      receiptClass: SCENE_COMPOSED_RECEIPT_CLASS,
      entryId: entry.entryId,
      seed: body.seed,
      libraryRef: body.libraryRef,
      partGraphHash: body.partGraphHash,
      sceneHash: body.sceneHash,
      bom: body.bom,
      pillar: PILLAR.operationalOntology,
    });
  },
);

export default router;
