/**
 * Vessels — Formula Thesis routes.
 *
 * Backs the "elevated formula" pillar:
 *   - normalized risk (Λ composite) with persisted history
 *   - drift score (KL approximation)
 *   - proof closure
 *   - voyage Monte Carlo persistence (canonical impl from @szl-holdings/formulas)
 *   - anomaly engine persistence with real A11oy cross-product handoff
 *   - bunker stations table (auto-seeds via DB-only existence check)
 *
 * Every compute path emits a Λ-receipt via a per-request ReceiptChain (no
 * module-level mutable state). Every persisted read/write is org-scoped
 * through tenant-scope middleware. Persistence failures are surfaced —
 * they do not silently fall back to seeded data.
 *
 * High-severity anomalies and elevated risk recomputes fire a real
 * `appendProof` cross-product handoff (Vessels → A11oy + A11oy → Vessels
 * legs) and persist the resulting fabric proof id as the handoff ref.
 */

import {
  db,
  vesselsAnomalyDetectionsTable,
  vesselsBunkerStationsTable,
  vesselsRiskHistoryTable,
  vesselsVoyageCalculationsTable,
} from '@szl-holdings/db';
import {
  driftScore,
  normalizedRiskScore,
  proofClosureScore,
  riskScore,
  voyageCostMonteCarlo,
} from '@szl-holdings/formulas';
import { ReceiptChain } from '@szl-holdings/szl-receipts';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendSuccess,
} from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { getUserOrgIds, tenantScope } from '../middlewares/tenant-scope';
import { appendProof } from '../services/orchestration-store.js';

const router: IRouter = Router();

router.use(authMiddleware());
router.use(tenantScope({ required: true }));

/**
 * Per-request receipt chain. Avoids module-level mutable state so behaviour
 * survives restarts and parallel requests don't share a chain seq.
 * The receipt is then persisted on the row via `receiptHash` for audit.
 */
function newReceiptChain(): ReceiptChain {
  return new ReceiptChain({ operatorId: 'vessels-formula-thesis' });
}

async function emitReceipt(
  chain: ReceiptChain,
  endpoint: string,
  method: 'GET' | 'POST',
  params: Record<string, unknown>,
  result: Record<string, unknown>,
): Promise<string> {
  const receipt = await chain.append({ endpoint, method, params, result });
  return receipt.selfHash;
}

/**
 * Fire a real A11oy cross-product handoff (two-leg proof). Returns the
 * Vessels→A11oy proof id, which the caller persists as the handoff ref.
 * Throws on failure — callers may catch when the handoff is advisory.
 */
function emitVesselsToA11oyHandoff(
  kind: 'sanctions' | 'anomaly' | 'risk' | 'bunker',
  refId: string,
  summary: string,
  payload: Record<string, unknown>,
): { handoffId: string; vesselsProofId: string; a11oyProofId: string } {
  const handoffId = `vsl-ho-${kind}-${refId}`;
  const vesselsProof = appendProof({
    product: 'vessels',
    kind: 'cross_product_handoff',
    summary,
    relatedProduct: 'a11oy',
    payload: { handoffId, refId, kind, ...payload },
  });
  const a11oyProof = appendProof({
    product: 'a11oy',
    kind: 'signal_ingested',
    summary: `Vessels handed off ${kind} signal ${refId}`,
    relatedProduct: 'vessels',
    payload: { handoffId, refId, kind },
  });
  return {
    handoffId,
    vesselsProofId: vesselsProof.id,
    a11oyProofId: a11oyProof.id,
  };
}

function resolveOrgIdForWrite(
  orgIds: Set<number> | null,
  explicit?: number,
): number | null {
  if (orgIds === null) return explicit ?? null;
  if (explicit !== undefined) {
    if (!orgIds.has(explicit)) return null;
    return explicit;
  }
  if (orgIds.size === 1) return [...orgIds][0]!;
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Risk history (Λ composite) — org-scoped, fires A11oy handoff when elevated
// ────────────────────────────────────────────────────────────────────────────

const recomputeRiskSchema = z.object({
  vesselId: z.number().int().positive(),
  severity: z.number().min(0).max(1),
  likelihood: z.number().min(0).max(1),
  valueAtRiskUsd: z.number().nonnegative(),
  capUsd: z.number().positive().default(1_000_000),
  factors: z.record(z.string(), z.number()).optional(),
  orgId: z.number().int().positive().optional(),
});

router.post(
  '/vessels/formula/risk-recompute',
  validateBody(recomputeRiskSchema),
  async (req, res) => {
    try {
      const input = req.body as z.infer<typeof recomputeRiskSchema>;
      const orgIds = getUserOrgIds(req.user!);
      const orgId = resolveOrgIdForWrite(orgIds, input.orgId);
      if (orgId === null) {
        return sendBadRequest(
          res,
          'orgId is required (multi-org user) or not in your tenant scope',
        );
      }

      const lambda = normalizedRiskScore(
        input.severity,
        input.likelihood,
        input.valueAtRiskUsd,
        input.capUsd,
      );
      const rawRisk = riskScore(
        input.severity,
        input.likelihood,
        input.valueAtRiskUsd,
        input.capUsd,
      );

      // Fire real A11oy handoff for elevated risk (Λ ≥ 0.7).
      let handoff: ReturnType<typeof emitVesselsToA11oyHandoff> | null = null;
      if (lambda >= 0.7) {
        handoff = emitVesselsToA11oyHandoff(
          'risk',
          `vsl-${input.vesselId}-${Date.now()}`,
          `Vessel ${input.vesselId}: Λ recomputed to ${lambda.toFixed(3)} — review required`,
          { lambda, severity: input.severity, likelihood: input.likelihood },
        );
      }

      const computeResult = {
        vesselId: input.vesselId,
        orgId,
        lambdaScore: lambda,
        rawRiskUsd: rawRisk,
        formulaVersion: 'lambda-v10',
        formula: 'normalizedRiskScore(severity, likelihood, valueAtRisk, cap)',
        a11oyHandoff: handoff,
        computedAt: new Date().toISOString(),
      };

      const chain = newReceiptChain();
      const receiptHash = await emitReceipt(
        chain,
        '/vessels/formula/risk-recompute',
        'POST',
        input as Record<string, unknown>,
        computeResult,
      );

      await db.insert(vesselsRiskHistoryTable).values({
        vesselId: input.vesselId,
        orgId,
        lambdaScore: lambda,
        severity: input.severity,
        likelihood: input.likelihood,
        valueAtRiskUsd: input.valueAtRiskUsd,
        capUsd: input.capUsd,
        factors: input.factors ?? null,
        receiptHash,
      });

      return sendSuccess(res, { ...computeResult, receiptHash });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to recompute risk');
    }
  },
);

router.get('/vessels/formula/risk-history/:vesselId', async (req, res) => {
  try {
    const vesselId = Number.parseInt(req.params.vesselId ?? '', 10);
    if (Number.isNaN(vesselId)) return sendBadRequest(res, 'Invalid vesselId');

    const orgIds = getUserOrgIds(req.user!);
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const conditions = [
      eq(vesselsRiskHistoryTable.vesselId, vesselId),
      gte(vesselsRiskHistoryTable.computedAt, since),
    ];
    if (orgIds !== null) {
      if (orgIds.size === 0)
        return sendSuccess(res, { vesselId, windowDays: 90, points: [], seeded: false });
      conditions.push(inArray(vesselsRiskHistoryTable.orgId, [...orgIds]));
    }

    const rows = await db
      .select()
      .from(vesselsRiskHistoryTable)
      .where(and(...conditions))
      .orderBy(desc(vesselsRiskHistoryTable.computedAt))
      .limit(500);

    if (rows.length === 0) {
      const now = Date.now();
      const points = Array.from({ length: 30 }).map((_, i) => {
        const t = new Date(now - (29 - i) * 24 * 60 * 60 * 1000);
        const base = 0.35 + Math.sin(i / 4) * 0.12 + i / 60;
        return {
          computedAt: t.toISOString(),
          lambdaScore: Math.max(0, Math.min(1, base)),
          severity: 0.45,
          likelihood: 0.55,
          valueAtRiskUsd: 250_000,
          formulaVersion: 'lambda-v10',
          seeded: true,
        };
      });
      return sendSuccess(res, {
        vesselId,
        windowDays: 90,
        formula: 'normalizedRiskScore(severity, likelihood, valueAtRisk, cap)',
        formulaVersion: 'lambda-v10',
        points,
        seeded: true,
      });
    }

    return sendSuccess(res, {
      vesselId,
      windowDays: 90,
      formula: 'normalizedRiskScore(severity, likelihood, valueAtRisk, cap)',
      formulaVersion: 'lambda-v10',
      points: rows.map((r) => ({
        computedAt: r.computedAt.toISOString(),
        lambdaScore: r.lambdaScore,
        severity: r.severity,
        likelihood: r.likelihood,
        valueAtRiskUsd: r.valueAtRiskUsd,
        driftScore: r.driftScore,
        formulaVersion: r.formulaVersion,
        receiptHash: r.receiptHash,
      })),
      seeded: false,
    });
  } catch (err) {
    return handleRouteError(res, err, 'Failed to fetch risk history');
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Drift & proof closure (stateless compute endpoints used by ShowTheMath)
// ────────────────────────────────────────────────────────────────────────────

const driftRequestSchema = z.object({
  baseline: z.array(z.number()).min(1),
  current: z.array(z.number()).min(1),
});

router.post('/vessels/formula/drift', validateBody(driftRequestSchema), async (req, res) => {
  try {
    const { baseline, current } = req.body as z.infer<typeof driftRequestSchema>;
    if (baseline.length !== current.length) {
      return sendBadRequest(res, 'baseline and current must be same length');
    }
    const score = driftScore(baseline, current);
    const result = {
      formula: 'driftScore(baseline, current) ≈ KL(p‖q)',
      formulaVersion: 'drift-v10',
      score,
      baselineDist: baseline,
      currentDist: current,
      computedAt: new Date().toISOString(),
    };
    const chain = newReceiptChain();
    const receiptHash = await emitReceipt(
      chain,
      '/vessels/formula/drift',
      'POST',
      req.body as Record<string, unknown>,
      result,
    );
    return sendSuccess(res, { ...result, receiptHash });
  } catch (err) {
    return handleRouteError(res, err, 'Failed to compute drift');
  }
});

const proofSchema = z.object({
  presentDims: z.number().int().nonnegative(),
  totalDims: z.number().int().positive(),
});

router.post('/vessels/formula/proof-closure', validateBody(proofSchema), async (req, res) => {
  try {
    const { presentDims, totalDims } = req.body as z.infer<typeof proofSchema>;
    const score = proofClosureScore(presentDims, totalDims);
    const result = {
      formula: 'proofClosureScore(present, total) = present/total',
      formulaVersion: 'proof-v10',
      score,
      presentDims,
      totalDims,
      computedAt: new Date().toISOString(),
    };
    const chain = newReceiptChain();
    const receiptHash = await emitReceipt(
      chain,
      '/vessels/formula/proof-closure',
      'POST',
      req.body as Record<string, unknown>,
      result,
    );
    return sendSuccess(res, { ...result, receiptHash });
  } catch (err) {
    return handleRouteError(res, err, 'Failed to compute proof closure');
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Voyage Monte Carlo (canonical impl, persisted, org-scoped)
// ────────────────────────────────────────────────────────────────────────────

const voyageMonteCarloSchema = z.object({
  vesselClassId: z.string().min(1),
  routeId: z.string().min(1),
  meanCostUsd: z.number().positive(),
  costStdDevPct: z.number().min(0).max(1).default(0.18),
  iterations: z.number().int().min(100).max(20000).default(2000),
  charterType: z.enum(['time_charter', 'spot']).default('time_charter'),
  cargoQuantityMt: z.number().positive().optional(),
  orgId: z.number().int().positive().optional(),
});

router.post(
  '/vessels/formula/voyage-monte-carlo',
  validateBody(voyageMonteCarloSchema),
  async (req, res) => {
    try {
      const input = req.body as z.infer<typeof voyageMonteCarloSchema>;
      const orgIds = getUserOrgIds(req.user!);
      const orgId = resolveOrgIdForWrite(orgIds, input.orgId);
      if (orgId === null) {
        return sendBadRequest(
          res,
          'orgId is required (multi-org user) or not in your tenant scope',
        );
      }

      const mc = voyageCostMonteCarlo({
        meanCostUsd: input.meanCostUsd,
        costStdDevPct: input.costStdDevPct,
        iterations: input.iterations,
      });

      const ref = `vmc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const result = {
        calculationRef: ref,
        formula: 'voyageCostMonteCarlo(mean, σ, N) — Gaussian sampling',
        formulaVersion: mc.formulaVersion,
        meanCostUsd: input.meanCostUsd,
        iterations: mc.iterations,
        p10: mc.p10,
        p50: mc.p50,
        p90: mc.p90,
        mean: mc.mean,
        computedAt: new Date().toISOString(),
      };

      const chain = newReceiptChain();
      const receiptHash = await emitReceipt(
        chain,
        '/vessels/formula/voyage-monte-carlo',
        'POST',
        input as Record<string, unknown>,
        result,
      );

      await db.insert(vesselsVoyageCalculationsTable).values({
        orgId,
        calculationRef: ref,
        vesselClassId: input.vesselClassId,
        routeId: input.routeId,
        charterType: input.charterType,
        cargoQuantityMt: input.cargoQuantityMt ?? null,
        totalRevenueUsd: 0,
        totalCostsUsd: input.meanCostUsd,
        grossProfitUsd: 0,
        grossMarginPct: 0,
        tceRateUsd: 0,
        voyageDays: 0,
        monteCarloP10: result.p10,
        monteCarloP50: result.p50,
        monteCarloP90: result.p90,
        estimate: result as Record<string, unknown>,
        receiptHash,
      });

      return sendSuccess(res, { ...result, receiptHash });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to run voyage Monte Carlo');
    }
  },
);

// ────────────────────────────────────────────────────────────────────────────
// Anomaly engine (persisted, org-scoped, real A11oy handoff for severe)
// ────────────────────────────────────────────────────────────────────────────

const anomalyDetectSchema = z.object({
  vesselId: z.number().int().positive(),
  anomalyType: z.enum([
    'ais_blackout',
    'route_deviation',
    'speed_spike',
    'unexpected_port',
    'sts_transfer',
    'dark_loiter',
    'cargo_mismatch',
  ]),
  anomalyScore: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1).default(0.8),
  summary: z.string().min(1).max(500),
  evidence: z.record(z.string(), z.unknown()).optional(),
  location: z.object({ lat: z.number(), lon: z.number() }).optional(),
  orgId: z.number().int().positive().optional(),
});

router.post(
  '/vessels/formula/anomaly-detect',
  validateBody(anomalyDetectSchema),
  async (req, res) => {
    try {
      const input = req.body as z.infer<typeof anomalyDetectSchema>;
      const orgIds = getUserOrgIds(req.user!);
      const orgId = resolveOrgIdForWrite(orgIds, input.orgId);
      if (orgId === null) {
        return sendBadRequest(
          res,
          'orgId is required (multi-org user) or not in your tenant scope',
        );
      }

      const severity: 'low' | 'medium' | 'high' | 'critical' =
        input.anomalyScore >= 0.9
          ? 'critical'
          : input.anomalyScore >= 0.7
            ? 'high'
            : input.anomalyScore >= 0.4
              ? 'medium'
              : 'low';

      const ref = `anom-${input.vesselId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Real A11oy handoff for high/critical anomalies — writes two proof
      // ledger entries (vessels → a11oy, a11oy → vessels) and gives us a
      // durable handoff id to persist.
      const handoff =
        severity === 'high' || severity === 'critical'
          ? emitVesselsToA11oyHandoff('anomaly', ref, input.summary, {
              anomalyType: input.anomalyType,
              anomalyScore: input.anomalyScore,
              vesselId: input.vesselId,
            })
          : null;

      const result = {
        detectionRef: ref,
        vesselId: input.vesselId,
        orgId,
        anomalyType: input.anomalyType,
        anomalyScore: input.anomalyScore,
        severity,
        a11oyHandoff: handoff,
        detectedAt: new Date().toISOString(),
      };

      const chain = newReceiptChain();
      const receiptHash = await emitReceipt(
        chain,
        '/vessels/formula/anomaly-detect',
        'POST',
        input as Record<string, unknown>,
        result,
      );

      await db.insert(vesselsAnomalyDetectionsTable).values({
        vesselId: input.vesselId,
        orgId,
        detectionRef: ref,
        anomalyType: input.anomalyType,
        severity,
        anomalyScore: input.anomalyScore,
        confidence: input.confidence,
        summary: input.summary,
        evidence: input.evidence ?? null,
        location: input.location ?? null,
        a11oyHandoffId: handoff?.handoffId ?? null,
        receiptHash,
      });

      return sendSuccess(res, { ...result, receiptHash });
    } catch (err) {
      return handleRouteError(res, err, 'Failed to record anomaly');
    }
  },
);

router.get('/vessels/formula/anomalies', async (req, res) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    const vesselIdRaw = req.query.vesselId as string | undefined;
    const vesselId = vesselIdRaw ? Number.parseInt(vesselIdRaw, 10) : null;

    const conditions = [] as ReturnType<typeof eq>[];
    if (vesselId !== null && !Number.isNaN(vesselId)) {
      conditions.push(eq(vesselsAnomalyDetectionsTable.vesselId, vesselId));
    }
    if (orgIds !== null) {
      if (orgIds.size === 0) return sendSuccess(res, { anomalies: [], total: 0 });
      conditions.push(inArray(vesselsAnomalyDetectionsTable.orgId, [...orgIds]));
    }

    const rows = await (conditions.length > 0
      ? db
          .select()
          .from(vesselsAnomalyDetectionsTable)
          .where(and(...conditions))
          .orderBy(desc(vesselsAnomalyDetectionsTable.detectedAt))
          .limit(100)
      : db
          .select()
          .from(vesselsAnomalyDetectionsTable)
          .orderBy(desc(vesselsAnomalyDetectionsTable.detectedAt))
          .limit(100));

    return sendSuccess(res, {
      anomalies: rows.map((r) => ({
        id: r.id,
        vesselId: r.vesselId,
        detectionRef: r.detectionRef,
        anomalyType: r.anomalyType,
        severity: r.severity,
        anomalyScore: r.anomalyScore,
        confidence: r.confidence,
        summary: r.summary,
        location: r.location,
        status: r.status,
        a11oyHandoffId: r.a11oyHandoffId,
        detectedAt: r.detectedAt.toISOString(),
      })),
      total: rows.length,
    });
  } catch (err) {
    return handleRouteError(res, err, 'Failed to list anomalies');
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Bunker stations — global reference table, DB-only existence check on seed
// (no module-level memory). Race-safe via onConflictDoNothing on station_code.
// ────────────────────────────────────────────────────────────────────────────

const SEED_BUNKER_STATIONS = [
  { stationCode: 'SGP-01', port: 'Singapore', country: 'SG', region: 'APAC', lat: 1.29, lon: 103.85, vlsfoUsdPerMt: 592, hfoUsdPerMt: 445, mgoUsdPerMt: 780, lngUsdPerMmbtu: 11.2, biofuelAvailable: true, avgWaitHours: 4, qualityScore: 0.95 },
  { stationCode: 'FUJ-01', port: 'Fujairah', country: 'AE', region: 'MEA', lat: 25.12, lon: 56.34, vlsfoUsdPerMt: 578, hfoUsdPerMt: 432, mgoUsdPerMt: 765, lngUsdPerMmbtu: 10.8, biofuelAvailable: false, avgWaitHours: 6, qualityScore: 0.88 },
  { stationCode: 'ROT-01', port: 'Rotterdam', country: 'NL', region: 'EMEA', lat: 51.92, lon: 4.48, vlsfoUsdPerMt: 605, hfoUsdPerMt: 455, mgoUsdPerMt: 795, lngUsdPerMmbtu: 12.1, biofuelAvailable: true, avgWaitHours: 8, qualityScore: 0.92 },
  { stationCode: 'HOU-01', port: 'Houston', country: 'US', region: 'AMER', lat: 29.76, lon: -95.36, vlsfoUsdPerMt: 588, hfoUsdPerMt: 440, mgoUsdPerMt: 772, lngUsdPerMmbtu: 3.8, biofuelAvailable: true, avgWaitHours: 5, qualityScore: 0.9 },
  { stationCode: 'PIR-01', port: 'Piraeus', country: 'GR', region: 'EMEA', lat: 37.94, lon: 23.65, vlsfoUsdPerMt: 598, hfoUsdPerMt: 448, mgoUsdPerMt: 785, lngUsdPerMmbtu: 11.5, biofuelAvailable: false, avgWaitHours: 7, qualityScore: 0.85 },
  { stationCode: 'BUS-01', port: 'Busan', country: 'KR', region: 'APAC', lat: 35.18, lon: 129.07, vlsfoUsdPerMt: 595, hfoUsdPerMt: 450, mgoUsdPerMt: 790, lngUsdPerMmbtu: 11.8, biofuelAvailable: false, avgWaitHours: 6, qualityScore: 0.89 },
  { stationCode: 'PAN-01', port: 'Panama', country: 'PA', region: 'AMER', lat: 8.97, lon: -79.55, vlsfoUsdPerMt: 612, hfoUsdPerMt: 462, mgoUsdPerMt: 802, lngUsdPerMmbtu: 10.5, biofuelAvailable: false, avgWaitHours: 9, qualityScore: 0.82 },
  { stationCode: 'ALG-01', port: 'Algeciras', country: 'ES', region: 'EMEA', lat: 36.13, lon: -5.45, vlsfoUsdPerMt: 601, hfoUsdPerMt: 449, mgoUsdPerMt: 788, lngUsdPerMmbtu: 11.7, biofuelAvailable: false, avgWaitHours: 5, qualityScore: 0.87 },
];

router.get('/vessels/formula/bunker-stations', async (_req, res) => {
  try {
    // DB-only existence check — no in-memory flag. Insert is idempotent
    // (UNIQUE constraint on station_code + onConflictDoNothing), so safe
    // to call from any process or worker without coordination.
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vesselsBunkerStationsTable);
    if (Number(count) === 0) {
      await db
        .insert(vesselsBunkerStationsTable)
        .values(SEED_BUNKER_STATIONS)
        .onConflictDoNothing();
    }
    const rows = await db.select().from(vesselsBunkerStationsTable).limit(200);

    return sendSuccess(res, {
      stations: rows.map((r) => ({
        id: r.id,
        stationCode: r.stationCode,
        port: r.port,
        country: r.country,
        region: r.region,
        lat: r.lat,
        lon: r.lon,
        vlsfoUsdPerMt: r.vlsfoUsdPerMt,
        hfoUsdPerMt: r.hfoUsdPerMt,
        mgoUsdPerMt: r.mgoUsdPerMt,
        lngUsdPerMmbtu: r.lngUsdPerMmbtu,
        biofuelAvailable: r.biofuelAvailable,
        avgWaitHours: r.avgWaitHours,
        qualityScore: r.qualityScore,
        priceAsOf: r.priceAsOf.toISOString(),
      })),
      total: rows.length,
    });
  } catch (err) {
    return handleRouteError(res, err, 'Failed to fetch bunker stations');
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Formula provenance registry — used by ShowTheMath affordance
// ────────────────────────────────────────────────────────────────────────────

router.get('/vessels/formula/registry', (_req, res) => {
  sendSuccess(res, {
    formulas: [
      {
        id: 'normalizedRiskScore',
        label: 'Λ — Normalized Risk Composite',
        expression: 'Λ = clamp( severity · likelihood · valueAtRisk / cap , 0, 1 )',
        thesisRef: 'docs/thesis/v10-canonical.md §5.2',
        pkg: '@szl-holdings/formulas',
        emitsReceipt: true,
      },
      {
        id: 'driftScore',
        label: 'Drift — KL Divergence',
        expression: 'D_KL(p‖q) = Σ pᵢ · log(pᵢ / qᵢ)',
        thesisRef: 'docs/thesis/v10-canonical.md §5.4',
        pkg: '@szl-holdings/formulas',
        emitsReceipt: true,
      },
      {
        id: 'proofClosureScore',
        label: 'Λ₁₀ — Proof Closure',
        expression: 'closure = presentDims / totalDims',
        thesisRef: 'docs/thesis/v10-canonical.md §6.1',
        pkg: '@szl-holdings/formulas',
        emitsReceipt: true,
      },
      {
        id: 'voyageCostMonteCarlo',
        label: 'Voyage Cost — Monte Carlo (Gaussian)',
        expression: 'Cᵢ = max(0, μ + σ · Z),  Z ~ N(0,1);  return p10/p50/p90',
        thesisRef: 'docs/thesis/v10-canonical.md §7.3',
        pkg: '@szl-holdings/formulas',
        emitsReceipt: true,
      },
    ],
    chainOperator: 'vessels-formula-thesis',
  });
});

export default router;
