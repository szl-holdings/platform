/**
 * LEXICON — License Intelligence API (folded into A11oy as the governance
 * module that backs the `license_approved` inference gate). Mounted at
 * `/api/a11oy/lexicon/*`.
 *
 * Endpoints:
 *   GET  /catalog              — full catalog (status counts in `meta`)
 *   GET  /catalog/:targetId    — single entry lookup by target id
 *   POST /request              — enqueue a review request (admin OR system call)
 *   POST /entries/:id/approve  — operator decision (admin)
 *   POST /entries/:id/deny     — operator decision (admin)
 *   POST /entries/:id/risk-flag— flag an entry as risky (admin)
 *   GET  /history              — append-only decision audit
 *   GET  /summary              — counts for the governance dashboard tile
 *
 * The seed flow preserves every license entry from the archived LEXICON
 * artifact + the operator model registry: every model with `licenseStatus`
 * approved/pending in the existing model registry is mirrored into
 * `lexicon_entries` on the first call to `seedLexiconFromRegistry`.
 */

import {
  db,
  lexiconDecisionsTable,
  lexiconEntriesTable,
  lexiconReviewRequestsTable,
  type LexiconLicenseStatus,
} from '@szl-holdings/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Router, type IRouter, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  A11OY_PRODUCT_IDS,
  type A11oyProductId,
} from '@workspace/a11oy-orchestration';
import {
  handleRouteError,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response.js';
import { logger } from '../lib/logger.js';
import { addProductCapability, appendProof } from '../services/orchestration-store.js';

const router: IRouter = Router();

// ─── seeded entries (preserves the LEXICON archive + matches the in-process
// model registry seeds in src/a11oy/runtime/model-registry.ts) ───────────────

interface LexiconSeed {
  targetId: string;
  kind: 'model' | 'dataset';
  provider: string;
  license: string;
  status: LexiconLicenseStatus;
  description: string;
}

/**
 * Bootstrap entries preserved from the archived `lyte-command-center` LEXICON
 * artifact. This mirrors the full set of operator-approved models that the
 * archive shipped with — every model in the runtime model-registry plus the
 * legacy entries the LEXICON UI relied on. Each row is upserted with
 * onConflictDoNothing so this is safe to re-run on every boot. Operators can
 * then deny/risk-flag any of them through the Lexicon UI; their decision
 * always wins because Lexicon is now the authoritative source for the
 * `license_approved` gate.
 */
const SEED_ENTRIES: LexiconSeed[] = [
  {
    targetId: 'BAAI/bge-large-en-v1.5',
    kind: 'model',
    provider: 'huggingface',
    license: 'MIT',
    status: 'approved',
    description: 'BGE-large-en-v1.5 embeddings for semantic search and RAG.',
  },
  {
    targetId: 'BAAI/bge-m3',
    kind: 'model',
    provider: 'huggingface',
    license: 'MIT',
    status: 'approved',
    description: 'BGE-M3 multilingual embeddings for cross-language retrieval.',
  },
  {
    targetId: 'facebook/bart-large-cnn',
    kind: 'model',
    provider: 'huggingface',
    license: 'MIT',
    status: 'approved',
    description: 'BART-large-CNN for document summarization.',
  },
  {
    targetId: 'nlpaueb/legal-bert-base-uncased',
    kind: 'model',
    provider: 'huggingface',
    license: 'CC-BY-SA-4.0',
    status: 'approved',
    description: 'Legal-BERT for contract clause classification and legal NLP.',
  },
  {
    targetId: 'Qwen/Qwen3-8B',
    kind: 'model',
    provider: 'huggingface',
    license: 'Apache-2.0',
    status: 'approved',
    description: 'Qwen3-8B reasoning LLM (HF Inference API).',
  },
  {
    targetId: 'tesseract-ocr-v5',
    kind: 'model',
    provider: 'local',
    license: 'Apache-2.0',
    status: 'approved',
    description: 'Tesseract OCR engine for document digitization in substrate workers.',
  },
  {
    targetId: 'gpt-4o',
    kind: 'model',
    provider: 'openai',
    license: 'Proprietary',
    status: 'approved',
    description: 'GPT-4o for primary deep reasoning, board packets, and proof reconstruction.',
  },
  {
    targetId: 'deepseek-reasoner',
    kind: 'model',
    provider: 'deepseek',
    license: 'Proprietary',
    status: 'approved',
    description: 'DeepSeek R1 for cost-efficient triage, classification, and document analysis.',
  },
  {
    targetId: 'a11oy-eval-judge-v2',
    kind: 'model',
    provider: 'internal',
    license: 'Internal',
    status: 'approved',
    description: 'Deterministic MirrorEval 2.0 judge — 14-dimension scoring.',
  },
  {
    targetId: 'szl-geospatial-rf-v1',
    kind: 'model',
    provider: 'local',
    license: 'Internal',
    status: 'approved',
    description: 'Random-forest geospatial risk model for AIS correlation and anomaly detection.',
  },
  // Legacy LEXICON archive entries — datasets and reference models the
  // archived UI seeded for license-family browsing. Imported here so the
  // catalog page mirrors what operators saw in the original artifact.
  {
    targetId: 'huggingface/datasets-mit',
    kind: 'dataset',
    provider: 'huggingface',
    license: 'MIT',
    status: 'approved',
    description: 'MIT-licensed reference dataset bundle (LEXICON archive entry).',
  },
  {
    targetId: 'huggingface/datasets-apache-2.0',
    kind: 'dataset',
    provider: 'huggingface',
    license: 'Apache-2.0',
    status: 'approved',
    description: 'Apache-2.0 reference dataset bundle (LEXICON archive entry).',
  },
];

let seedingPromise: Promise<void> | null = null;

/**
 * In-memory mirror of every approved targetId. The inference gate checker
 * runs synchronously; it cannot await a DB round trip on every model call,
 * so we keep this `Set` warm and refresh it after every approve/deny and
 * on a slow background cadence. Approving an entry in the Lexicon UI
 * therefore unblocks the next `license_approved` gate check immediately.
 */
const approvedCache = new Set<string>();
const statusCache = new Map<string, LexiconLicenseStatus>();

async function refreshApprovedCache(): Promise<void> {
  try {
    const rows = await db
      .select({ targetId: lexiconEntriesTable.targetId, status: lexiconEntriesTable.status })
      .from(lexiconEntriesTable);
    approvedCache.clear();
    statusCache.clear();
    for (const r of rows) {
      const st = r.status as LexiconLicenseStatus;
      statusCache.set(r.targetId, st);
      if (st === 'approved') approvedCache.add(r.targetId);
    }
  } catch (err) {
    logger.warn({ err }, '[lexicon] cache refresh failed (non-fatal)');
  }
}

/** Synchronous gate-check helper. Returns true iff the target has been
 *  approved by an operator. */
export function isLexiconApprovedSync(targetId: string): boolean {
  return approvedCache.has(targetId);
}

/**
 * Synchronous tri-state lookup used by the inference gate. Returns the
 * Lexicon-recorded status or `'unknown'` if the target has never been seen.
 * The router uses this to make Lexicon authoritative — known entries decide
 * the gate; unknown entries fall back to the static registry while a review
 * is auto-enqueued.
 */
export type LexiconGateStatus = LexiconLicenseStatus | 'unknown';
export function getLexiconStatusSync(targetId: string): LexiconGateStatus {
  return statusCache.get(targetId) ?? 'unknown';
}

/**
 * Register Lexicon as a child capability of the `amaru` orchestration root
 * (per task #4763 / #4748). amaru is A11oy's parent product in the fixed
 * 6-product fabric; registering Lexicon as one of its capabilities means
 * the orchestration UI surfaces "License Intelligence" alongside amaru's
 * other capabilities without needing a new top-level product slot.
 */
function registerLexiconAsChildCapability(): void {
  try {
    addProductCapability('amaru', {
      id: 'lexicon.license_intelligence',
      label: 'License Intelligence (Lexicon)',
      governanceClass: 'mutation',
    });
  } catch (err) {
    logger.warn({ err }, '[lexicon] capability registration failed (non-fatal)');
  }
}

export async function seedLexiconFromRegistry(): Promise<void> {
  if (seedingPromise) return seedingPromise;
  registerLexiconAsChildCapability();
  seedingPromise = (async () => {
    try {
      for (const seed of SEED_ENTRIES) {
        await db
          .insert(lexiconEntriesTable)
          .values({
            targetId: seed.targetId,
            kind: seed.kind,
            provider: seed.provider,
            license: seed.license,
            status: seed.status,
            description: seed.description,
            seeded: true,
          })
          .onConflictDoNothing();
      }
      logger.info({ count: SEED_ENTRIES.length }, '[lexicon] seeded entries');
      await refreshApprovedCache();
    } catch (err) {
      logger.warn({ err }, '[lexicon] seed failed (non-fatal)');
    }
  })();
  return seedingPromise;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function isLexiconAdmin(req: Request): boolean {
  const roles = req.user?.roles ?? [];
  return (
    roles.includes('super_admin') ||
    roles.includes('admin') ||
    roles.includes('platform_admin' as never) ||
    roles.includes('founder_admin' as never) ||
    roles.includes('compliance' as never)
  );
}

function principalOf(req: Request): string {
  if (req.user?.email) return req.user.email;
  if (req.user?.displayName) return req.user.displayName;
  if (req.user?.id) return `user-${req.user.id}`;
  if (req.internalAgent?.name) return `agent:${req.internalAgent.name}`;
  return 'system';
}

/**
 * Find an entry by its UUID OR canonical targetId. Lets the operator UI use
 * the friendly model id (`Qwen/Qwen3-8B`) without having to look up the row
 * id first.
 */
async function findEntry(idOrTarget: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    idOrTarget,
  );
  const rows = isUuid
    ? await db.select().from(lexiconEntriesTable).where(eq(lexiconEntriesTable.id, idOrTarget))
    : await db
        .select()
        .from(lexiconEntriesTable)
        .where(eq(lexiconEntriesTable.targetId, idOrTarget));
  return rows[0] ?? null;
}

async function getStatusCounts() {
  const rows = await db
    .select({
      status: lexiconEntriesTable.status,
      count: sql<string>`count(*)::text`,
    })
    .from(lexiconEntriesTable)
    .groupBy(lexiconEntriesTable.status);
  const counts = { pending_review: 0, approved: 0, denied: 0, risk_flagged: 0 } as Record<
    LexiconLicenseStatus,
    number
  >;
  for (const r of rows) {
    counts[r.status as LexiconLicenseStatus] = parseInt(r.count, 10) || 0;
  }
  return counts;
}

/**
 * Public: ensure a target exists in the catalog and (optionally) enqueue a
 * pending review request for it. Used by the inference gate hook so that
 * unknown models never silently bypass — every miss creates a paper trail.
 *
 * Returns the entry + the open review request (if any). Idempotent: calling
 * twice with the same target returns the same entry; a second call when a
 * review is already pending does NOT create another duplicate.
 */
export async function ensureLexiconEntryAndEnqueueReview(opts: {
  targetId: string;
  provider?: string;
  context?: Record<string, unknown>;
  requestedBy?: string;
}): Promise<{ entry: typeof lexiconEntriesTable.$inferSelect; reviewRequestId: string | null }> {
  await seedLexiconFromRegistry();

  let entry = await findEntry(opts.targetId);
  if (!entry) {
    const [created] = await db
      .insert(lexiconEntriesTable)
      .values({
        targetId: opts.targetId,
        provider: opts.provider ?? 'huggingface',
        kind: 'model',
        license: 'unknown',
        status: 'pending_review',
        description: `Auto-enqueued by inference gate for unknown target ${opts.targetId}`,
      })
      .returning();
    entry = created;
  }

  if (entry.status === 'approved') {
    return { entry, reviewRequestId: null };
  }

  const existingPending = await db
    .select()
    .from(lexiconReviewRequestsTable)
    .where(
      and(
        eq(lexiconReviewRequestsTable.entryId, entry.id),
        eq(lexiconReviewRequestsTable.status, 'pending'),
      ),
    )
    .limit(1);

  if (existingPending[0]) {
    return { entry, reviewRequestId: existingPending[0].id };
  }

  const [review] = await db
    .insert(lexiconReviewRequestsTable)
    .values({
      entryId: entry.id,
      requestedBy: opts.requestedBy ?? 'inference_gate',
      context: opts.context ?? {},
    })
    .returning();

  return { entry, reviewRequestId: review.id };
}

/**
 * Public: license-approval lookup for the inference gate. Returns
 * `{ approved: true }` when the target is in the catalog with status
 * `approved`. Otherwise returns `{ approved: false, reason }` and triggers
 * an automatic review enqueue for unknown targets.
 */
export async function isLicenseApprovedForInference(
  targetId: string,
  context?: Record<string, unknown>,
): Promise<{ approved: boolean; reason?: string; reviewRequestId?: string | null }> {
  try {
    const { entry, reviewRequestId } = await ensureLexiconEntryAndEnqueueReview({
      targetId,
      context: context ?? { source: 'inference_gate', ts: new Date().toISOString() },
    });
    if (entry.status === 'approved') return { approved: true };
    return {
      approved: false,
      reason: `lexicon_status:${entry.status}`,
      reviewRequestId,
    };
  } catch (err) {
    logger.warn({ err, targetId }, '[lexicon] gate lookup failed — failing closed');
    return { approved: false, reason: 'lexicon_lookup_failed' };
  }
}

// ─── routes ─────────────────────────────────────────────────────────────────

/**
 * Read endpoints expose governance state (catalog, summary, history). Per
 * task #4763 they require an authenticated principal — either a logged-in
 * user (any role) or an internal-agent token. The endpoints are NOT public
 * because the catalog reveals which models the org has approved/denied,
 * which is sensitive operational information.
 */
function requireAuthenticated(req: Request, res: Response, next: () => void) {
  if (req.user || req.internalAgent) return next();
  return sendForbidden(res, 'Authentication required for Lexicon read endpoints');
}

router.use(requireAuthenticated);

router.get('/catalog', async (req: Request, res: Response) => {
  try {
    await seedLexiconFromRegistry();
    const status = req.query.status as string | undefined;
    const baseQ = db.select().from(lexiconEntriesTable);
    const rows = status
      ? await baseQ.where(eq(lexiconEntriesTable.status, status as LexiconLicenseStatus))
      : await baseQ;
    const counts = await getStatusCounts();
    sendSuccess(res, {
      entries: rows.sort((a, b) => a.targetId.localeCompare(b.targetId)),
      counts,
    });
  } catch (err) {
    handleRouteError(res, err, 'lexicon_catalog_failed');
  }
});

router.get('/summary', async (_req: Request, res: Response) => {
  try {
    await seedLexiconFromRegistry();
    const counts = await getStatusCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const [pendingReviews] = await db
      .select({ count: sql<string>`count(*)::text` })
      .from(lexiconReviewRequestsTable)
      .where(eq(lexiconReviewRequestsTable.status, 'pending'));
    sendSuccess(res, {
      total,
      counts,
      pendingReviews: parseInt(pendingReviews?.count ?? '0', 10) || 0,
    });
  } catch (err) {
    handleRouteError(res, err, 'lexicon_summary_failed');
  }
});

router.get('/catalog/:targetId', async (req: Request, res: Response) => {
  try {
    await seedLexiconFromRegistry();
    const entry = await findEntry(req.params.targetId);
    if (!entry) return sendNotFound(res, 'Lexicon entry');
    const reviews = await db
      .select()
      .from(lexiconReviewRequestsTable)
      .where(eq(lexiconReviewRequestsTable.entryId, entry.id))
      .orderBy(desc(lexiconReviewRequestsTable.createdAt));
    const decisions = await db
      .select()
      .from(lexiconDecisionsTable)
      .where(eq(lexiconDecisionsTable.entryId, entry.id))
      .orderBy(desc(lexiconDecisionsTable.decidedAt));
    sendSuccess(res, { entry, reviews, decisions });
  } catch (err) {
    handleRouteError(res, err, 'lexicon_entry_failed');
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(200, parseInt(String(req.query.limit ?? '100'), 10) || 100);
    const rows = await db
      .select()
      .from(lexiconDecisionsTable)
      .orderBy(desc(lexiconDecisionsTable.decidedAt))
      .limit(limit);
    sendSuccess(res, { decisions: rows });
  } catch (err) {
    handleRouteError(res, err, 'lexicon_history_failed');
  }
});

const requestSchema = z.object({
  targetId: z.string().min(1).max(256),
  provider: z.string().max(64).optional(),
  context: z.record(z.unknown()).optional(),
});

router.post('/request', async (req: Request, res: Response) => {
  // Authz: enqueueing a review is a governance action — require either an
  // authenticated user or an internal-agent token. The inference-gate hook
  // calls `ensureLexiconEntryAndEnqueueReview` directly (in-process), so it
  // does not flow through this endpoint and is unaffected.
  if (!req.user && !req.internalAgent) {
    return sendForbidden(res, 'Authentication or internal-agent token required');
  }
  try {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return sendBadRequest(res, 'Invalid request body', parsed.error.format());
    const { entry, reviewRequestId } = await ensureLexiconEntryAndEnqueueReview({
      targetId: parsed.data.targetId,
      provider: parsed.data.provider,
      context: parsed.data.context,
      requestedBy: principalOf(req),
    });
    sendSuccess(res, { entry, reviewRequestId }, 201);
  } catch (err) {
    handleRouteError(res, err, 'lexicon_request_failed');
  }
});

const decisionSchema = z.object({
  reason: z.string().max(2000).optional().default(''),
});

async function applyDecision(
  req: Request,
  res: Response,
  decision: 'approved' | 'denied',
): Promise<void> {
  if (!req.user) return sendForbidden(res, 'Authentication required');
  if (!isLexiconAdmin(req)) return sendForbidden(res, 'Admin role required');
  const parsed = decisionSchema.safeParse(req.body ?? {});
  if (!parsed.success) return sendBadRequest(res, 'Invalid body', parsed.error.format());
  try {
    const entry = await findEntry(req.params.id);
    if (!entry) return sendNotFound(res, 'Lexicon entry');

    const [pending] = await db
      .select()
      .from(lexiconReviewRequestsTable)
      .where(
        and(
          eq(lexiconReviewRequestsTable.entryId, entry.id),
          eq(lexiconReviewRequestsTable.status, 'pending'),
        ),
      )
      .limit(1);

    const principal = principalOf(req);

    await db
      .update(lexiconEntriesTable)
      .set({
        status: decision,
        updatedAt: new Date(),
      })
      .where(eq(lexiconEntriesTable.id, entry.id));

    if (pending) {
      await db
        .update(lexiconReviewRequestsTable)
        .set({ status: decision, resolvedAt: new Date() })
        .where(eq(lexiconReviewRequestsTable.id, pending.id));
    }

    const [decisionRow] = await db
      .insert(lexiconDecisionsTable)
      .values({
        entryId: entry.id,
        reviewRequestId: pending?.id ?? null,
        decision,
        reason: parsed.data.reason ?? '',
        decidedBy: principal,
      })
      .returning();

    // Refresh the in-memory caches so the inference gate sees the new state
    // immediately (next call to checkInferenceGates picks it up). Both the
    // approved-set (fast yes/no) and the tri-state status map (authoritative)
    // are updated.
    statusCache.set(entry.targetId, decision);
    if (decision === 'approved') approvedCache.add(entry.targetId);
    else approvedCache.delete(entry.targetId);

    // Emit a fabric proof so the orchestration ledger records this decision.
    // Lexicon is not a separate product (the fixed A11oyProductId union has
    // six members); we attribute the proof to the requesting product when
    // it is captured in the review-request context, otherwise we attribute
    // to the platform default `amaru` (the orchestration root product).
    try {
      const ctxProduct =
        (pending?.context as { product?: string } | null)?.product ??
        (typeof entry.metadata === 'object' && entry.metadata
          ? (entry.metadata as { product?: string }).product
          : undefined);
      const product: A11oyProductId = (
        A11OY_PRODUCT_IDS.includes(ctxProduct as A11oyProductId) ? ctxProduct : 'amaru'
      ) as A11oyProductId;
      appendProof({
        product,
        kind: decision === 'approved' ? 'action_approved' : 'governance_block',
        summary: `Lexicon ${decision} for ${entry.targetId} by ${principal}`,
        deepLink: `/governance/lexicon/${decision === 'approved' ? 'approved' : 'denied'}`,
        payload: {
          targetId: entry.targetId,
          license: entry.license,
          reason: parsed.data.reason ?? '',
        },
        modelUsed: entry.kind === 'model' ? entry.targetId : undefined,
      });
    } catch (err) {
      logger.warn({ err }, '[lexicon] proof emission failed (non-fatal)');
    }

    logger.info(
      { entryId: entry.id, targetId: entry.targetId, decision, principal },
      '[lexicon] decision recorded',
    );

    sendSuccess(res, {
      entry: { ...entry, status: decision },
      decision: decisionRow,
    });
  } catch (err) {
    handleRouteError(res, err, 'lexicon_decision_failed');
  }
}

router.post('/entries/:id/approve', (req, res) => applyDecision(req, res, 'approved'));
router.post('/entries/:id/deny', (req, res) => applyDecision(req, res, 'denied'));

const riskFlagSchema = z.object({ riskNote: z.string().max(2000).optional().default('') });

router.post('/entries/:id/risk-flag', async (req: Request, res: Response) => {
  if (!req.user) return sendForbidden(res, 'Authentication required');
  if (!isLexiconAdmin(req)) return sendForbidden(res, 'Admin role required');
  const parsed = riskFlagSchema.safeParse(req.body ?? {});
  if (!parsed.success) return sendBadRequest(res, 'Invalid body', parsed.error.format());
  try {
    const entry = await findEntry(req.params.id);
    if (!entry) return sendNotFound(res, 'Lexicon entry');
    await db
      .update(lexiconEntriesTable)
      .set({
        riskFlagged: true,
        riskNote: parsed.data.riskNote || null,
        status: 'risk_flagged',
        updatedAt: new Date(),
      })
      .where(eq(lexiconEntriesTable.id, entry.id));
    sendSuccess(res, { ok: true });
  } catch (err) {
    handleRouteError(res, err, 'lexicon_risk_flag_failed');
  }
});

export default router;
