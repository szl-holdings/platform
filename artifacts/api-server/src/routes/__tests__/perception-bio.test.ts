/**
 * /perception, /sequence-pipeline, /peak-detector, /procedural-kit
 *  — integration tests for the perception/bio API surface (#5519).
 *
 * Covers per the task brief: allowed, denied (policy + missing-auth),
 * rate-limited (writeLimiter saturation), and spoof-replay
 * (antivenom nonce reuse + unknown + wrong-actor + stale-capture).
 *
 * Auth is mocked so unauthenticated calls 401 and authenticated calls
 * carry a `req.user` shape compatible with `authedCaller()`.
 */
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let authUser: { id: number; role: string } | null = null;

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    () =>
    (req: Request, res: Response, next: NextFunction): void => {
      if (!authUser) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      (req as Request & { user: { id: number; role: string } }).user = authUser;
      next();
    },
}));

// Make the rate-limiter a no-op for happy-path tests; the dedicated
// rate-limit test re-mocks it to fail-closed instead.
let rateLimitFails = false;
vi.mock('../../middlewares/rate-limiters', () => ({
  writeLimiter: (_req: Request, res: Response, next: NextFunction): void => {
    if (rateLimitFails) {
      res.status(429).json({ error: 'Too many requests', code: 'RATE_LIMITED' });
      return;
    }
    next();
  },
}));

// Toggle to flip the policy-guard verdict to "blocked" for the 403 tests.
let policyDenies = false;

vi.mock('@szl-holdings/policy-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@szl-holdings/policy-guard')>(
      '@szl-holdings/policy-guard',
    );
  type EngineCtorArgs = ConstructorParameters<typeof actual.PolicyGuardEngine>;
  class FakeEngine {
    private readonly real: InstanceType<typeof actual.PolicyGuardEngine>;
    constructor(rules: EngineCtorArgs[0], opts?: EngineCtorArgs[1]) {
      this.real = new actual.PolicyGuardEngine(rules, opts);
    }
    evaluate(req: Parameters<InstanceType<typeof actual.PolicyGuardEngine>['evaluate']>[0]) {
      if (policyDenies) {
        return {
          verdict: 'blocked' as const,
          reason: 'test: forced policy denial',
          matchedPolicyId: 'TEST-DENY-001',
          auditRequired: true,
        };
      }
      return this.real.evaluate(req);
    }
  }
  return { ...actual, PolicyGuardEngine: FakeEngine };
});

let app: ReturnType<typeof express>;
let resetNonces: () => void;

beforeAll(async () => {
  const mod = await import('../perception-bio');
  resetNonces = mod._resetPerceptionNoncesForTest;
  app = express();
  app.use(express.json());
  app.use(mod.default);
});

beforeEach(() => {
  authUser = null;
  rateLimitFails = false;
  policyDenies = false;
  resetNonces();
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

function validFeatureVector(overrides: Record<string, unknown> = {}) {
  return {
    frameHash: 'abcdef0123456789',
    capturedAt: Date.now(),
    ranHeads: ['face', 'body'],
    skippedHeads: [],
    detectionCounts: { face: 1, body: 0 },
    livenessConfidence: 0.92,
    budgetMs: 18,
    consumerArtifact: 'rosie',
    ...overrides,
  };
}

function validPipelineTrace() {
  return {
    pipelineId: 'pipe-1',
    stages: [
      {
        stageName: 'fastqc',
        stageOrdinal: 0,
        parentPipelineId: 'pipe-1',
        inputsHash: 'i'.repeat(16),
        paramsHash: 'p'.repeat(16),
        outputsHash: 'o'.repeat(16),
        tooling: { fastqc: '0.12.1' },
      },
      {
        stageName: 'align',
        stageOrdinal: 1,
        parentPipelineId: 'pipe-1',
        inputsHash: 'i2'.repeat(8),
        paramsHash: 'p2'.repeat(8),
        outputsHash: 'o2'.repeat(8),
        tooling: { bwa: '0.7.17' },
      },
    ],
    tabulatedStatistic: {
      totalTrials: 100,
      methodRef: 'wilson-0.95',
      requiresNegativeSpace: true,
      rows: [
        { label: 'hit', count: 80, fraction: 0.8, ciLower: 0.71, ciUpper: 0.87, isNegativeSpace: false },
        { label: 'absent', count: 20, fraction: 0.2, ciLower: 0.13, ciUpper: 0.29, isNegativeSpace: true },
      ],
    },
  };
}

function validPeakBatch(withClassification = false) {
  const body: Record<string, unknown> = {
    detectorVersion: 'v1.2.3',
    peaks: [
      {
        surfaceRef: 'surf-A',
        peakId: 'pk-1',
        scoreComponents: { prominence: 0.8, snRatio: 12, shapeResidual: 0.05 },
        successes: 9,
        trials: 10,
      },
    ],
  };
  if (withClassification) {
    body.classification = {
      confidenceCutoff: 0.7,
      cutoffChosenBy: { actor: 'reviewer:alice', rationale: 'matches reference dataset' },
    };
  }
  return body;
}

function validUsdExport() {
  return {
    seed: 1337,
    libraryRef: 'kitbash@2.0',
    partGraphHash: 'pg-' + 'a'.repeat(16),
    sceneHash: 'sc-' + 'b'.repeat(16),
    bom: { cube: 4, sphere: 2 },
    consumerArtifact: 'amaru',
  };
}

// ─── /perception/nonce + /perception/verify ──────────────────────────────────

describe('POST /perception/nonce', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await request(app).post('/perception/nonce').send({});
    expect(res.status).toBe(401);
  });

  it('issues a single-use nonce with a freshness window', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app).post('/perception/nonce').send({});
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      nonceId: expect.any(String),
      issuedAt: expect.any(String),
      expiresAt: expect.any(String),
      windowMs: expect.any(Number),
    });
    expect(res.body.nonceId.length).toBeGreaterThanOrEqual(32);
  });
});

describe('POST /perception/verify (antivenom)', () => {
  async function freshNonce(): Promise<string> {
    const res = await request(app).post('/perception/nonce').send({});
    return res.body.nonceId as string;
  }

  it('accepts a verify with a fresh nonce and writes a receipt', async () => {
    authUser = { id: 1, role: 'operator' };
    const nonceId = await freshNonce();
    const res = await request(app)
      .post('/perception/verify')
      .send({ nonceId, featureVector: validFeatureVector() });
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('perception.envelope.v1');
    expect(res.body.entryId).toBeTruthy();
    expect(res.body.pillar).toBe('evidence-first');
    expect(res.body.nonceWindowMs).toBeGreaterThan(0);
  });

  it('rejects a replay of the same nonce with NONCE_REPLAYED', async () => {
    authUser = { id: 1, role: 'operator' };
    const nonceId = await freshNonce();
    const first = await request(app)
      .post('/perception/verify')
      .send({ nonceId, featureVector: validFeatureVector() });
    expect(first.status).toBe(201);
    const replay = await request(app)
      .post('/perception/verify')
      .send({ nonceId, featureVector: validFeatureVector() });
    expect(replay.status).toBe(401);
    expect(replay.body.code).toBe('NONCE_REPLAYED');
  });

  it('rejects an unknown / forged nonce with NONCE_UNKNOWN', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app)
      .post('/perception/verify')
      .send({ nonceId: 'deadbeef'.repeat(4), featureVector: validFeatureVector() });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NONCE_UNKNOWN');
  });

  it('rejects a nonce issued to a different caller (cross-actor spoof)', async () => {
    authUser = { id: 1, role: 'operator' };
    const nonceId = await freshNonce();
    authUser = { id: 2, role: 'operator' };
    const res = await request(app)
      .post('/perception/verify')
      .send({ nonceId, featureVector: validFeatureVector() });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NONCE_WRONG_ACTOR');
  });

  it('rejects a stale capture timestamp even with a fresh nonce', async () => {
    authUser = { id: 1, role: 'operator' };
    const nonceId = await freshNonce();
    const res = await request(app)
      .post('/perception/verify')
      .send({
        nonceId,
        featureVector: validFeatureVector({ capturedAt: Date.now() - 5 * 60 * 1000 }),
      });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NONCE_EXPIRED');
  });

  it('rejects malformed feature vectors with 400', async () => {
    authUser = { id: 1, role: 'operator' };
    const nonceId = await freshNonce();
    const res = await request(app)
      .post('/perception/verify')
      .send({ nonceId, featureVector: { ...validFeatureVector(), livenessConfidence: 2 } });
    expect(res.status).toBe(400);
  });

  it('is rate-limited when the writeLimiter trips (429)', async () => {
    authUser = { id: 1, role: 'operator' };
    rateLimitFails = true;
    const res = await request(app)
      .post('/perception/verify')
      .send({ nonceId: 'x'.repeat(32), featureVector: validFeatureVector() });
    expect(res.status).toBe(429);
  });

  it('returns 403 POLICY_DENIED when the policy-guard blocks the action', async () => {
    authUser = { id: 1, role: 'operator' };
    const nonceId = await freshNonce();
    policyDenies = true;
    const res = await request(app)
      .post('/perception/verify')
      .send({ nonceId, featureVector: validFeatureVector() });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('POLICY_DENIED');
  });
});

// ─── /sequence-pipeline/trace ────────────────────────────────────────────────

describe('POST /sequence-pipeline/trace', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await request(app).post('/sequence-pipeline/trace').send(validPipelineTrace());
    expect(res.status).toBe(401);
  });

  it('accepts a valid trace and emits one receipt per stage + terminal stat', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app).post('/sequence-pipeline/trace').send(validPipelineTrace());
    expect(res.status).toBe(201);
    expect(res.body.stageReceiptClass).toBe('pipeline.stage.v1');
    expect(res.body.stageEntryIds).toHaveLength(2);
    expect(res.body.tabulatedStatisticReceiptClass).toBe('pipeline.tabulated-statistic.v1');
    expect(res.body.tabulatedStatisticEntryId).toBeTruthy();
  });

  it('rejects out-of-order stage ordinals with STAGE_ORDER', async () => {
    authUser = { id: 1, role: 'operator' };
    const body = validPipelineTrace();
    body.stages[1].stageOrdinal = 0;
    const res = await request(app).post('/sequence-pipeline/trace').send(body);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('STAGE_ORDER');
  });

  it('rejects a tabulated statistic that omits negative space when required', async () => {
    authUser = { id: 1, role: 'operator' };
    const body = validPipelineTrace();
    body.tabulatedStatistic.rows = body.tabulatedStatistic.rows.filter((r) => !r.isNegativeSpace);
    const res = await request(app).post('/sequence-pipeline/trace').send(body);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TABULATED_STATISTIC_INVALID');
  });

  it('returns 403 POLICY_DENIED when the policy-guard blocks ingest', async () => {
    authUser = { id: 1, role: 'operator' };
    policyDenies = true;
    const res = await request(app).post('/sequence-pipeline/trace').send(validPipelineTrace());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('POLICY_DENIED');
  });
});

// ─── /peak-detector/batch ────────────────────────────────────────────────────

describe('POST /peak-detector/batch', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await request(app).post('/peak-detector/batch').send(validPeakBatch());
    expect(res.status).toBe(401);
  });

  it('scores a batch and returns per-peak Wilson CIs', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app).post('/peak-detector/batch').send(validPeakBatch());
    expect(res.status).toBe(201);
    expect(res.body.detectionReceiptClass).toBe('peak.detection.v1');
    expect(res.body.peaks[0].confidenceInterval).toMatchObject({
      p: expect.any(Number),
      ciLower: expect.any(Number),
      ciUpper: expect.any(Number),
      level: '0.95',
    });
    expect(res.body.peaks[0].entryId).toBeTruthy();
  });

  it('emits a classification receipt when cutoff actor + rationale are provided', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app).post('/peak-detector/batch').send(validPeakBatch(true));
    expect(res.status).toBe(201);
    expect(res.body.classificationReceiptClass).toBe('peak.classification.v1');
    expect(res.body.classificationEntryId).toBeTruthy();
  });

  it('rejects classification when rationale is missing (schema 400)', async () => {
    authUser = { id: 1, role: 'operator' };
    const body = validPeakBatch(true) as { classification: { cutoffChosenBy: { rationale: string } } };
    body.classification.cutoffChosenBy.rationale = '';
    const res = await request(app).post('/peak-detector/batch').send(body);
    expect(res.status).toBe(400);
  });

  it('returns 403 POLICY_DENIED when the policy-guard blocks scoring', async () => {
    authUser = { id: 1, role: 'operator' };
    policyDenies = true;
    const res = await request(app).post('/peak-detector/batch').send(validPeakBatch());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('POLICY_DENIED');
  });
});

// ─── /procedural-kit/usd-export ──────────────────────────────────────────────

describe('POST /procedural-kit/usd-export', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await request(app).post('/procedural-kit/usd-export').send(validUsdExport());
    expect(res.status).toBe(401);
  });

  it('accepts an export job and stamps a scene.composed.v1 receipt', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app).post('/procedural-kit/usd-export').send(validUsdExport());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('scene.composed.v1');
    expect(res.body.entryId).toBeTruthy();
    expect(res.body.jobId).toMatch(/^usd_/);
    expect(res.body.pillar).toBe('operational-ontology');
  });

  it('is rate-limited when the writeLimiter trips (429)', async () => {
    authUser = { id: 1, role: 'operator' };
    rateLimitFails = true;
    const res = await request(app).post('/procedural-kit/usd-export').send(validUsdExport());
    expect(res.status).toBe(429);
  });

  it('returns 403 POLICY_DENIED when the policy-guard blocks the export', async () => {
    authUser = { id: 1, role: 'operator' };
    policyDenies = true;
    const res = await request(app).post('/procedural-kit/usd-export').send(validUsdExport());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('POLICY_DENIED');
  });
});
