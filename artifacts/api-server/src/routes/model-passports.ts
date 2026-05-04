/**
 * Model Passport Registry API
 *
 * Endpoints for the signed Model Passport lifecycle + one-of-one layer:
 *   POST   /model-passports                      — register a new passport
 *   GET    /model-passports                      — list passports (filter by lane, tier, state, tenant)
 *   GET    /model-passports/:id                  — fetch one passport by id
 *   POST   /model-passports/:id/verify           — re-verify signature + provenance hash live
 *   POST   /model-passports/resolve              — resolve best passport for given lane + budget + SLA + tenant
 *   PATCH  /model-passports/:id/state            — transition passport lifecycle state
 *   POST   /model-passports/seed                 — (ops only) seed passports for current allow-listed models
 *
 *   — Proof Bundles (capability 1+2)
 *   POST   /model-passports/:id/proof-bundle     — export a signed Proof Bundle for a run id
 *   POST   /model-passports/proof-bundle/verify  — offline-verify a submitted bundle JSON
 *
 *   — Drift (capability 3)
 *   GET    /model-passports/drift                — list passports currently flagged as drifting
 *   POST   /model-passports/:id/drift/record     — record a telemetry sample for drift evaluation
 *   POST   /model-passports/:id/drift/acknowledge — operator clears drift-active state after review
 *
 *   — Policy Lenses (capability 5)
 *   GET    /model-passports/:id/lenses           — list lenses for a passport + tenant
 *   POST   /model-passports/:id/lenses           — attach a new policy lens
 *   DELETE /model-passports/:id/lenses/:lensId   — detach a lens
 *   POST   /model-passports/:id/lenses/resolve   — resolve effective envelope for tenant + lenses
 *
 *   — Passport Diff (capability 6)
 *   POST   /model-passports/diff                 — structured policy-aware diff of two passports
 *
 *   — Eval Gates (capability 7)
 *   GET    /model-passports/:id/eval-gates       — get declared eval gates for passport
 *   POST   /model-passports/:id/eval-gates/check — run eval gate check (blocks draft→active)
 */

import { db, modelPassportLensesTable, modelPassportsTable } from '@szl-holdings/db';
import {
  DEFAULT_DRIFT_THRESHOLDS,
  buildProofBundle,
  checkEvalGates,
  computeSignatureDigest,
  deserializeBundle,
  diffPassports,
  driftDetector,
  formatGateError,
  getSeedPassports,
  mergePassportWithLenses,
  resolvePassport,
  validateSignedPassport,
  verifyAndSummarize,
  verifyPassportSignature,
  verifyProofBundle,
} from '@szl-holdings/model-passport';
import type { PolicyLens, SignedModelPassport } from '@szl-holdings/model-passport';
import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

const PRIVILEGED_ROLES = new Set(['super_admin', 'admin', 'ops', 'operator']);
const APPROVER_ROLES = new Set(['super_admin', 'admin', 'approver']);

function isPrivileged(user?: AuthenticatedUser): boolean {
  return user?.roles?.some((r) => PRIVILEGED_ROLES.has(r)) ?? false;
}

function isApprover(user?: AuthenticatedUser): boolean {
  return user?.roles?.some((r) => APPROVER_ROLES.has(r)) ?? false;
}

const registerPassportSchema = z.object({
  signedJson: z.unknown(),
});

const listQuerySchema = z.object({
  lane: z.string().optional(),
  tier: z.string().optional(),
  state: z.string().optional(),
  tenantId: z.string().optional(),
  limit: z.string().optional(),
});

const stateTransitionSchema = z.object({
  state: z.enum(['draft', 'proposed', 'approved', 'active', 'deprecated', 'revoked']),
  reason: z.string().optional(),
});

const resolveQuerySchema = z.object({
  lane: z.enum([
    'classification',
    'triage',
    'reasoning',
    'planning',
    'tool_calling',
    'vision_understanding',
    'background_batch',
    'extraction',
    'summarization',
  ]),
  budgetUsdPerCall: z.number().positive().optional(),
  slaP95Ms: z.number().int().positive().optional(),
  tenantId: z.number().int().optional(),
  requiredCapabilities: z.array(z.string()).optional(),
});

const proofBundleRequestSchema = z.object({
  runId: z.string().min(1),
  requestContent: z.string().optional().default(''),
  responseContent: z.string().optional().default(''),
  policyTrace: z
    .object({
      requestId: z.string(),
      effect: z.enum(['allow', 'deny']),
      allowed: z.boolean(),
      matchedPolicies: z.array(z.string()),
      deniedBy: z.string().nullable().optional(),
      reason: z.string().optional(),
      evaluatedAt: z.number(),
      action: z.string(),
    })
    .optional()
    .nullable(),
  telemetrySlice: z
    .array(
      z.object({
        spanId: z.string(),
        traceId: z.string(),
        model: z.string(),
        provider: z.string(),
        routeClass: z.string(),
        totalTokens: z.number(),
        latencyMs: z.number(),
        costEstimateUsd: z.number(),
        passportId: z.string().optional(),
        timestamp: z.number(),
      }),
    )
    .optional()
    .default([]),
});

const lensSchema = z.object({
  displayName: z.string().min(1),
  description: z.string().optional(),
  envelope: z.object({
    autonomyTier: z.enum(['read_only', 'advisory', 'supervised', 'autonomous']).optional(),
    allowedDomains: z.array(z.string()).optional(),
    piiHandling: z.enum(['blocked', 'redacted', 'allowed']).optional(),
    escalationRules: z.array(z.string()).optional(),
    jurisdictions: z.array(z.string()).optional(),
    maxBudgetUsdPerCall: z.number().positive().optional(),
  }),
});

const diffRequestSchema = z.object({
  fromPassportId: z.string(),
  toPassportId: z.string(),
});

const driftSampleSchema = z.object({
  costEstimateUsd: z.number(),
  latencyMs: z.number(),
  accuracy: z.number().min(0).max(1).optional(),
});

const evalGateCheckSchema = z.object({
  evalRunId: z.string().min(1),
  report: z.object({
    timestamp: z.string(),
    model: z.string(),
    totalTests: z.number(),
    passed: z.number(),
    failed: z.number(),
    passRate: z.string(),
    byCategory: z.record(z.object({ total: z.number(), passed: z.number(), failed: z.number() })),
    results: z.array(z.unknown()),
    avgLatencyMs: z.number(),
    avgCostPerCallUsd: z.number().nonnegative(),
  }),
});

function rowToSigned(row: typeof modelPassportsTable.$inferSelect): SignedModelPassport {
  return row.signedJson as SignedModelPassport;
}

async function getActivePassportsForTenant(tenantId?: number): Promise<SignedModelPassport[]> {
  const rows = await db
    .select()
    .from(modelPassportsTable)
    .where(eq(modelPassportsTable.state, 'active'));

  return rows
    .filter((r) => !tenantId || r.tenantId === tenantId || r.tenantId === null)
    .map(rowToSigned);
}

const DEMO_SIGNER_PRIVATE_KEY = process.env.PASSPORT_SIGNER_PRIVATE_KEY ?? '';
const DEMO_SIGNER_PUBLIC_KEY = process.env.PASSPORT_SIGNER_PUBLIC_KEY ?? '';

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendBadRequest(res, 'Invalid query parameters');
      return;
    }
    const { lane, tier, state, tenantId, limit } = parsed.data;

    let query = db.select().from(modelPassportsTable).$dynamic();

    const conditions = [];
    if (state) conditions.push(eq(modelPassportsTable.state, state as string));
    if (tier) conditions.push(eq(modelPassportsTable.quantTier, tier));
    if (tenantId) conditions.push(eq(modelPassportsTable.tenantId, parseInt(tenantId, 10)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.limit(parseInt(limit ?? '100', 10));

    let passports = rows.map((r) => ({
      id: r.id,
      displayName: r.displayName,
      provider: r.provider,
      providerModelId: r.providerModelId,
      quantTier: r.quantTier,
      lanes: r.lanes as string[],
      state: r.state,
      tenantId: r.tenantId,
      costPer1kTokensUsd: r.costPer1kTokensUsd,
      p50LatencyMs: r.p50LatencyMs,
      p95LatencyMs: r.p95LatencyMs,
      evalPassRate: r.evalPassRate,
      autonomyTier: r.autonomyTier,
      signatureDigest: computeSignatureDigest(r.signature),
      provenanceHash: r.provenanceHash,
      isDrifting: driftDetector.isDrifting(r.id),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    if (lane) {
      passports = passports.filter((p) => (p.lanes as string[]).includes(lane));
    }

    sendSuccess(res, passports, 200, { total: passports.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list model passports');
  }
});

router.get('/drift', async (_req, res) => {
  try {
    const drifting = driftDetector.getAllDriftingPassports();
    const details = drifting.map((passportId) => ({
      passportId,
      metrics: driftDetector.getMetrics(passportId),
    }));
    sendSuccess(res, details, 200, { count: drifting.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list drifting passports');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    sendSuccess(res, {
      ...row,
      signatureDigest: computeSignatureDigest(row.signature),
      isDrifting: driftDetector.isDrifting(row.id),
      driftMetrics: driftDetector.getMetrics(row.id),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch model passport');
  }
});

router.post('/resolve', validateBody(resolveQuerySchema), async (req, res) => {
  try {
    const query = req.body as z.infer<typeof resolveQuerySchema>;
    const actingTenantId = req.user?.orgs?.[0]?.orgId ?? undefined;

    const store = {
      listActive: async () => getActivePassportsForTenant(actingTenantId ?? query.tenantId),
      getById: async (id: string) => {
        const [row] = await db
          .select()
          .from(modelPassportsTable)
          .where(and(eq(modelPassportsTable.id, id), eq(modelPassportsTable.state, 'active')))
          .limit(1);
        return row ? rowToSigned(row) : null;
      },
    };

    const result = await resolvePassport(
      query as Parameters<typeof resolvePassport>[0],
      store,
    );
    if (!result) {
      sendSuccess(res, {
        resolved: false,
        reason: 'No matching active passport found for the given criteria',
      });
      return;
    }

    const passport = result.passport.passport;
    let effectiveEnvelope = passport.policyEnvelope;
    let appliedLenses: string[] = [];
    let lensConflicts: unknown[] = [];

    const tenantId = actingTenantId ?? query.tenantId;
    if (tenantId != null) {
      const lensRows = await db
        .select()
        .from(modelPassportLensesTable)
        .where(
          and(
            eq(modelPassportLensesTable.tenantId, tenantId),
            eq(modelPassportLensesTable.passportId, result.passportId),
          ),
        );
      const lenses: PolicyLens[] = lensRows.map((r) => ({
        lensId: r.lensId,
        tenantId: r.tenantId,
        passportId: r.passportId,
        displayName: r.displayName,
        description: r.description ?? undefined,
        envelope: r.envelope as PolicyLens['envelope'],
        createdAt: r.createdAt.toISOString(),
        createdBy: r.createdBy ?? undefined,
      }));
      if (lenses.length > 0) {
        const mergeResult = mergePassportWithLenses(passport.policyEnvelope, lenses);
        effectiveEnvelope = mergeResult.effectiveEnvelope;
        appliedLenses = mergeResult.appliedLenses;
        lensConflicts = mergeResult.conflicts;
      }
    }

    sendSuccess(res, {
      resolved: true,
      passportId: result.passportId,
      signatureDigest: result.signatureDigest,
      displayName: passport.identity.displayName,
      model: passport.identity.providerModelId,
      provider: passport.identity.provider,
      quantTier: passport.quantProfile.tier,
      costPer1kTokensUsd: passport.costProfile.costPer1kTokensUsd,
      p95LatencyMs: passport.costProfile.p95LatencyMs,
      evalPassRate: passport.costProfile.evalPassRate,
      autonomyTier: passport.policyEnvelope.autonomyTier,
      effectiveEnvelope,
      appliedLenses,
      lensConflicts,
      downgradeLadder: result.downgradeLadder,
      passport: result.passport,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to resolve model passport');
  }
});

router.post('/:id/verify', async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    const signed = rowToSigned(row);
    const result = verifyAndSummarize(signed);
    const signatureDigest = computeSignatureDigest(row.signature);

    sendSuccess(res, {
      passportId: row.id,
      signatureDigest,
      provenanceHash: row.provenanceHash,
      ...result,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to verify model passport');
  }
});

router.post('/:id/proof-bundle', validateBody(proofBundleRequestSchema), async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    if (!DEMO_SIGNER_PRIVATE_KEY || !DEMO_SIGNER_PUBLIC_KEY) {
      sendError(
        res,
        'Proof bundle signing key not configured — set PASSPORT_SIGNER_PRIVATE_KEY and PASSPORT_SIGNER_PUBLIC_KEY',
        503,
      );
      return;
    }

    const { runId, requestContent, responseContent, policyTrace, telemetrySlice } =
      req.body as z.infer<typeof proofBundleRequestSchema>;

    const signed = rowToSigned(row);
    const bundle = buildProofBundle({
      runId,
      passport: signed,
      requestContent,
      responseContent,
      policyTrace: policyTrace ?? null,
      telemetrySlice: telemetrySlice ?? [],
      signerPrivateKeyPem: DEMO_SIGNER_PRIVATE_KEY,
      signerPublicKeyPem: DEMO_SIGNER_PUBLIC_KEY,
    });

    logger.info(
      { passportId: row.id, runId, bundleId: bundle.manifest.bundleId },
      'Proof bundle exported',
    );

    sendSuccess(res, {
      bundleId: bundle.manifest.bundleId,
      passportId: row.id,
      runId,
      bundle,
      integrityRoot: bundle.manifest.integrityRoot,
      createdAt: bundle.manifest.createdAt,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to export proof bundle');
  }
});

router.post('/proof-bundle/verify', async (req, res) => {
  try {
    const { bundleJson } = req.body as { bundleJson: string };
    if (!bundleJson) {
      sendBadRequest(res, 'bundleJson is required');
      return;
    }

    const bundle = deserializeBundle(bundleJson);

    const [passportRow] = await db
      .select({ signerPublicKey: modelPassportsTable.signerPublicKey })
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, bundle.manifest.passportId))
      .limit(1);

    // The trust anchor for bundle verification is the platform's bundle-signing key (env var),
    // NOT the passport's own signerPublicKey (which covers passport content integrity only
    // and is verified separately inside verifyProofBundle via verifyPassportSignature).
    // Using the passport key here would allow an attacker to re-sign a tampered bundle
    // with any passport key they control.
    const trustedSignerKey = DEMO_SIGNER_PUBLIC_KEY || undefined;

    const result = verifyProofBundle(bundle, trustedSignerKey);

    sendSuccess(res, {
      ...result,
      bundleId: bundle.manifest.bundleId,
      passportId: bundle.manifest.passportId,
      runId: bundle.manifest.runId,
      trustAnchor: trustedSignerKey ? 'env_key' : 'none',
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to verify proof bundle');
  }
});

router.get('/:id/lenses', async (req, res) => {
  try {
    const [row] = await db
      .select({ id: modelPassportsTable.id })
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    const tenantId = req.user?.orgs?.[0]?.orgId;
    if (tenantId == null) {
      sendSuccess(res, [], 200, { total: 0 });
      return;
    }

    const lenses = await db
      .select()
      .from(modelPassportLensesTable)
      .where(
        and(
          eq(modelPassportLensesTable.tenantId, tenantId),
          eq(modelPassportLensesTable.passportId, req.params.id!),
        ),
      );
    sendSuccess(res, lenses, 200, { total: lenses.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list lenses');
  }
});

router.post('/:id/lenses', validateBody(lensSchema), async (req, res) => {
  const tenantId = req.user?.orgs?.[0]?.orgId;
  if (tenantId == null) {
    sendError(res, 'Tenant context required — lens creation requires an authenticated tenant session', 400);
    return;
  }

  try {
    const [row] = await db
      .select({ id: modelPassportsTable.id })
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    const body = req.body as z.infer<typeof lensSchema>;
    const lensId = `lens_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    await db
      .insert(modelPassportLensesTable)
      .values({
        lensId,
        tenantId,
        passportId: req.params.id!,
        displayName: body.displayName,
        description: body.description,
        envelope: body.envelope as Record<string, unknown>,
        createdBy: String(req.user?.userId ?? 'unknown'),
      });

    logger.info(
      { passportId: req.params.id, lensId, tenantId },
      'Policy lens attached',
    );

    sendCreated(res, { lensId, passportId: req.params.id, tenantId });
  } catch (err) {
    handleRouteError(res, err, 'Failed to attach policy lens');
  }
});

router.delete('/:id/lenses/:lensId', async (req, res) => {
  try {
    const tenantId = req.user?.orgs?.[0]?.orgId;
    if (tenantId == null) {
      sendError(res, 'Tenant context required', 400);
      return;
    }

    const deleted = await db
      .delete(modelPassportLensesTable)
      .where(
        and(
          eq(modelPassportLensesTable.lensId, req.params.lensId!),
          eq(modelPassportLensesTable.tenantId, tenantId),
          eq(modelPassportLensesTable.passportId, req.params.id!),
        ),
      )
      .returning({ lensId: modelPassportLensesTable.lensId });

    if (deleted.length === 0) {
      sendNotFound(res, 'Lens not found');
      return;
    }

    logger.info(
      { passportId: req.params.id, lensId: req.params.lensId, tenantId },
      'Policy lens detached',
    );

    sendSuccess(res, { removed: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to detach policy lens');
  }
});

router.post('/:id/lenses/resolve', async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    // Tenant identity is enforced from the auth context — never from the request body,
    // which would allow cross-tenant policy inspection.
    const tenantId = req.user?.orgs?.[0]?.orgId ?? 0;

    const signed = rowToSigned(row);
    const lensRows = await db
      .select()
      .from(modelPassportLensesTable)
      .where(
        and(
          eq(modelPassportLensesTable.tenantId, tenantId),
          eq(modelPassportLensesTable.passportId, req.params.id!),
        ),
      );
    const lenses: PolicyLens[] = lensRows.map((r) => ({
      lensId: r.lensId,
      tenantId: r.tenantId,
      passportId: r.passportId,
      displayName: r.displayName,
      description: r.description ?? undefined,
      envelope: r.envelope as PolicyLens['envelope'],
      createdAt: r.createdAt.toISOString(),
      createdBy: r.createdBy ?? undefined,
    }));
    const { effectiveEnvelope, appliedLenses, conflicts } = mergePassportWithLenses(
      signed.passport.policyEnvelope,
      lenses,
    );

    sendSuccess(res, {
      passportId: req.params.id,
      tenantId,
      baseEnvelope: signed.passport.policyEnvelope,
      effectiveEnvelope,
      appliedLenses,
      conflicts,
      lensCount: lenses.length,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to resolve effective policy envelope');
  }
});

router.post('/diff', validateBody(diffRequestSchema), async (req, res) => {
  try {
    const { fromPassportId, toPassportId } = req.body as z.infer<typeof diffRequestSchema>;

    const [fromRow] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, fromPassportId))
      .limit(1);

    const [toRow] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, toPassportId))
      .limit(1);

    if (!fromRow) {
      sendNotFound(res, `Source passport '${fromPassportId}' not found`);
      return;
    }
    if (!toRow) {
      sendNotFound(res, `Target passport '${toPassportId}' not found`);
      return;
    }

    const fromSigned = rowToSigned(fromRow);
    const toSigned = rowToSigned(toRow);
    const diff = diffPassports(fromSigned.passport, toSigned.passport);

    sendSuccess(res, diff);
  } catch (err) {
    handleRouteError(res, err, 'Failed to diff passports');
  }
});

router.post('/:id/drift/record', validateBody(driftSampleSchema), async (req, res) => {
  try {
    const [row] = await db
      .select({ id: modelPassportsTable.id, costPer1kTokensUsd: modelPassportsTable.costPer1kTokensUsd, p95LatencyMs: modelPassportsTable.p95LatencyMs, evalPassRate: modelPassportsTable.evalPassRate })
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    driftDetector.registerPassportProfile(row.id, {
      costPer1kTokensUsd: parseFloat(row.costPer1kTokensUsd ?? '0'),
      p95LatencyMs: row.p95LatencyMs ?? 5000,
      evalPassRate: parseFloat(row.evalPassRate ?? '0.8'),
    });

    const { costEstimateUsd, latencyMs, accuracy } = req.body as z.infer<typeof driftSampleSchema>;
    driftDetector.record({
      passportId: row.id,
      costEstimateUsd,
      latencyMs,
      accuracy,
      recordedAt: Date.now(),
    });

    sendSuccess(res, {
      passportId: row.id,
      isDrifting: driftDetector.isDrifting(row.id),
      metrics: driftDetector.getMetrics(row.id),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to record drift sample');
  }
});

router.post('/:id/drift/acknowledge', async (req, res) => {
  if (!isPrivileged(req.user)) {
    sendError(res, 'Insufficient privileges — drift acknowledgment requires ops or admin role', 403);
    return;
  }

  try {
    const [row] = await db
      .select({ id: modelPassportsTable.id })
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    const wasDrifting = driftDetector.isDrifting(row.id);
    driftDetector.clearDriftActive(row.id);

    logger.info(
      { passportId: row.id, acknowledgedBy: req.user?.userId },
      '[passport-drift] Drift state acknowledged and cleared by operator',
    );

    sendSuccess(res, {
      passportId: row.id,
      acknowledged: true,
      wasDrifting,
      acknowledgedBy: req.user?.userId,
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to acknowledge drift state');
  }
});

router.get('/:id/eval-gates', async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    const signed = rowToSigned(row);
    const evalGates = signed.passport.evalGates ?? null;
    const pinnedEvalRunId = signed.metadata?.pinnedEvalRunId ?? signed.passport.provenance?.evalRunId ?? null;

    sendSuccess(res, {
      passportId: row.id,
      evalGates,
      pinnedEvalRunId,
      defaultGates: evalGates == null
        ? {
            minGoldenSetPassRate: 0.7,
            maxP95LatencyMs: 10000,
            maxCostPerCallUsd: 1.0,
          }
        : null,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get eval gates');
  }
});

router.post('/:id/eval-gates/check', validateBody(evalGateCheckSchema), async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    const signed = rowToSigned(row);
    const gates = signed.passport.evalGates ?? {
      minGoldenSetPassRate: 0.7,
      maxP95LatencyMs: 10000,
      maxCostPerCallUsd: 1.0,
    };

    const { evalRunId, report } = req.body as z.infer<typeof evalGateCheckSchema>;
    const result = checkEvalGates(
      gates,
      report as Parameters<typeof checkEvalGates>[1],
      evalRunId,
      { costPerCallUsd: report.avgCostPerCallUsd },
    );

    if (!result.passed) {
      sendSuccess(res, {
        passportId: row.id,
        canTransitionToActive: false,
        gateResult: result,
        error: formatGateError(result),
      });
      return;
    }

    // Pin the passing eval run id into the signedJson metadata (outside the signed passport
    // envelope so the Ed25519 signature over passport content remains valid). The state
    // transition check reads from metadata.pinnedEvalRunId first, falling back to
    // passport.provenance.evalRunId for passports that carried the run id at registration.
    const existingMeta = signed.metadata ?? {};
    const updatedSignedJson = {
      ...signed,
      metadata: { ...existingMeta, pinnedEvalRunId: evalRunId },
    };

    await db
      .update(modelPassportsTable)
      .set({
        signedJson: updatedSignedJson as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(modelPassportsTable.id, row.id));

    logger.info(
      { passportId: row.id, evalRunId, gatesPassed: result.gates.length },
      'Eval gates passed — pinned evalRunId to passport metadata',
    );

    sendSuccess(res, {
      passportId: row.id,
      canTransitionToActive: true,
      gateResult: result,
      evalRunId,
      pinnedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to check eval gates');
  }
});

router.post('/', async (req, res) => {
  if (!isPrivileged(req.user)) {
    sendError(
      res,
      'Insufficient privileges — passport registration requires ops or admin role',
      403,
    );
    return;
  }

  try {
    const bodyParsed = registerPassportSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      sendBadRequest(res, 'Invalid request body', bodyParsed.error.flatten());
      return;
    }

    const passportValidation = validateSignedPassport(bodyParsed.data.signedJson);
    if (!passportValidation.success) {
      sendBadRequest(
        res,
        'Passport schema validation failed',
        passportValidation.error.flatten(),
      );
      return;
    }

    const signedJson = passportValidation.data as SignedModelPassport;
    const passport = signedJson.passport;

    const { signatureOk, hashOk } = verifyPassportSignature(signedJson);

    if (!signatureOk || !hashOk) {
      sendBadRequest(
        res,
        'Passport signature or provenance hash verification failed — all registered passports must carry a valid Ed25519 signature',
      );
      return;
    }

    const id = passport.identity.id;
    const signatureDigest = computeSignatureDigest(signedJson.signature);
    const lanes = passport.capabilitySurface.lanes;

    await db
      .insert(modelPassportsTable)
      .values({
        id,
        tenantId: passport.tenantId ?? null,
        displayName: passport.identity.displayName,
        version: passport.identity.version,
        provider: passport.identity.provider,
        providerModelId: passport.identity.providerModelId,
        quantTier: passport.quantProfile.tier,
        lanes: lanes,
        state: passport.state,
        signedJson: signedJson as unknown as Record<string, unknown>,
        signature: signedJson.signature,
        signerPublicKey: signedJson.signerPublicKey,
        provenanceHash: signedJson.provenanceHash,
        downgradeTo: passport.downgradeTo,
        costPer1kTokensUsd: String(passport.costProfile.costPer1kTokensUsd),
        p50LatencyMs: passport.costProfile.p50LatencyMs,
        p95LatencyMs: passport.costProfile.p95LatencyMs,
        evalPassRate: String(passport.costProfile.evalPassRate),
        autonomyTier: passport.policyEnvelope.autonomyTier,
        approvals: passport.approvals as unknown as Record<string, unknown>[],
      })
      .onConflictDoUpdate({
        target: modelPassportsTable.id,
        set: {
          displayName: passport.identity.displayName,
          state: passport.state,
          signedJson: signedJson as unknown as Record<string, unknown>,
          signature: signedJson.signature,
          provenanceHash: signedJson.provenanceHash,
          updatedAt: new Date(),
        },
      });

    logger.info({ passportId: id, signatureDigest }, 'Model passport registered');
    sendCreated(res, { id, signatureDigest, provenanceHash: signedJson.provenanceHash });
  } catch (err) {
    handleRouteError(res, err, 'Failed to register model passport');
  }
});

router.patch('/:id/state', validateBody(stateTransitionSchema), async (req, res) => {
  const { state: newState, reason } = req.body as z.infer<typeof stateTransitionSchema>;

  if (!isPrivileged(req.user)) {
    sendError(
      res,
      'Insufficient privileges — state transitions require ops or admin role',
      403,
    );
    return;
  }

  const HIGH_RISK_TRANSITIONS = new Set(['active', 'revoked']);

  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    // ── Eval Gate check for approved → active ──────────────────────────────
    // Before activating any passport, check whether it has declared eval gates
    // and whether a passing eval run has been pinned. The run id is stored in
    // signedJson.metadata.pinnedEvalRunId (set by /eval-gates/check on pass),
    // falling back to passport.provenance.evalRunId for passports that carried
    // the run id at registration time. If gates are declared and no passing run
    // is on record, block the transition with a descriptive 422.
    if (newState === 'active' && row.state === 'approved') {
      const signed = rowToSigned(row);
      const passportGates = signed.passport.evalGates;

      const pinnedEvalRunId =
        signed.metadata?.pinnedEvalRunId ?? signed.passport.provenance?.evalRunId;

      if (passportGates && !pinnedEvalRunId) {
        sendError(
          res,
          `Passport declares eval gates but no passing eval run is pinned. ` +
            `Required thresholds: pass rate ≥ ${passportGates.minGoldenSetPassRate * 100}%, ` +
            `P95 latency ≤ ${passportGates.maxP95LatencyMs}ms, ` +
            `cost per call ≤ $${passportGates.maxCostPerCallUsd}. ` +
            `Run POST /model-passports/${row.id}/eval-gates/check to pin a passing run.`,
          422,
        );
        return;
      }
    }

    if (HIGH_RISK_TRANSITIONS.has(newState)) {
      const { covenantEngine, createApprovalRequest } = await import(
        '@szl-holdings/covenant-policy'
      );
      const userId = typeof req.user?.userId === 'number' ? req.user.userId : null;
      const userRole = (req.user?.roles?.[0] as string | undefined) ?? undefined;

      const decision = covenantEngine.evaluate({
        subject: {
          roles: (req.user?.roles ?? []) as string[],
          userId: String(req.user?.userId ?? ''),
          tenantId: String(row.tenantId ?? ''),
          attributes: {},
        },
        resource: {
          type: 'model_passport',
          id: req.params.id!,
          domain: null,
          actionClass: `state_transition.${newState}`,
          attributes: { fromState: row.state, toState: newState },
        },
        action: 'model_passport.transition',
        context: { reason },
      });

      if (decision.effect === 'deny') {
        sendError(
          res,
          decision.reason ?? `Covenant policy denied state transition to '${newState}'`,
          403,
        );
        return;
      }

      if (decision.effect === 'escalate' || !isApprover(req.user)) {
        const signed = rowToSigned(row);
        const parentPassportId = signed.passport.provenance?.parentPassportId;

        let diffPayload: unknown = null;
        if (parentPassportId) {
          try {
            const [parentRow] = await db
              .select()
              .from(modelPassportsTable)
              .where(eq(modelPassportsTable.id, parentPassportId))
              .limit(1);
            if (parentRow) {
              const parentSigned = rowToSigned(parentRow);
              diffPayload = diffPassports(parentSigned.passport, signed.passport);
            }
          } catch {
            /* non-fatal — diff is optional metadata */
          }
        }

        const approval = await createApprovalRequest({
          orgId: typeof row.tenantId === 'number' ? row.tenantId : null,
          resourceType: 'model_passport.state',
          resourceId: req.params.id!,
          title: `Passport state transition to '${newState}': ${row.displayName}`,
          description:
            reason ?? `Operator requested transition from '${row.state}' to '${newState}'`,
          actionClass: 'model_governance',
          priority: newState === 'revoked' ? 'critical' : 'high',
          requestedById: userId,
          requestedByRole: userRole,
          requiredApproverRole: 'approver',
          correlationId: req.params.id,
          serviceAttribution: 'model-passport.state-transition',
          payload: {
            passportId: req.params.id,
            fromState: row.state,
            toState: newState,
            reason,
            covenantDecision: decision.effect,
            parentPassportId,
            policyDiff: diffPayload,
          },
        });

        sendSuccess(res, {
          id: req.params.id,
          status: 'pending_approval',
          approvalRequestId: approval.id,
          message: `Transition to '${newState}' requires approval. Approval request #${approval.id} created.`,
          policyDiffIncluded: diffPayload != null,
        });
        return;
      }
    }

    const updateData: Partial<typeof modelPassportsTable.$inferInsert> = {
      state: newState,
      updatedAt: new Date(),
    };

    if (newState === 'revoked') {
      updateData.revokedAt = new Date();
      updateData.revokedBy = String(req.user?.userId ?? 'unknown');
      updateData.revocationReason = reason ?? 'Revoked by approver';
    }

    await db
      .update(modelPassportsTable)
      .set(updateData)
      .where(eq(modelPassportsTable.id, req.params.id!));

    logger.info(
      { passportId: req.params.id, fromState: row.state, toState: newState, reason },
      'Passport state transitioned',
    );
    sendSuccess(res, { id: req.params.id, state: newState, updatedAt: updateData.updatedAt });
  } catch (err) {
    handleRouteError(res, err, 'Failed to transition passport state');
  }
});

router.post('/seed', requireRole('admin'), async (req, res) => {
  try {
    const seeds = getSeedPassports();
    const results: Array<{ id: string; status: 'inserted' | 'skipped' | 'error'; error?: string }> =
      [];

    for (const signed of seeds) {
      const passport = signed.passport;
      const id = passport.identity.id;

      try {
        await db
          .insert(modelPassportsTable)
          .values({
            id,
            tenantId: passport.tenantId ?? null,
            displayName: passport.identity.displayName,
            version: passport.identity.version,
            provider: passport.identity.provider,
            providerModelId: passport.identity.providerModelId,
            quantTier: passport.quantProfile.tier,
            lanes: passport.capabilitySurface.lanes,
            state: passport.state,
            signedJson: signed as unknown as Record<string, unknown>,
            signature: signed.signature,
            signerPublicKey: signed.signerPublicKey,
            provenanceHash: signed.provenanceHash,
            downgradeTo: passport.downgradeTo,
            costPer1kTokensUsd: String(passport.costProfile.costPer1kTokensUsd),
            p50LatencyMs: passport.costProfile.p50LatencyMs,
            p95LatencyMs: passport.costProfile.p95LatencyMs,
            evalPassRate: String(passport.costProfile.evalPassRate),
            autonomyTier: passport.policyEnvelope.autonomyTier,
            approvals: passport.approvals as unknown as Record<string, unknown>[],
          })
          .onConflictDoNothing();
        results.push({ id, status: 'inserted' });
      } catch (err) {
        results.push({
          id,
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logger.info(
      { count: results.filter((r) => r.status === 'inserted').length },
      'Seed passports registered',
    );
    sendSuccess(res, {
      seeded: results.filter((r) => r.status === 'inserted').length,
      results,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to seed passports');
  }
});

export default router;
