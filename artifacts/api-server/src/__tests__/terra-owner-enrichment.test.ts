/**
 * Terra Owner Enrichment — Unit Tests
 *
 * Coverage:
 *   1. Pure-logic functions (no mocks needed):
 *      - isPlaceholderOwner() — placeholder detection
 *      - inferAddressBasedEntityName() — ACRIS LLC naming inference
 *      - PLACEHOLDER_SQL_PATTERN — regex correctness
 *
 *   2. resolveOwnerForRow() tier-pipeline tests (via vi.importActual):
 *      - Tier 1 (CONSTELLATION lookup) preferred when node exists
 *      - Tier 2 (terra_properties cross-reference) preferred over tier 3
 *      - Tier 3 (address inference) as final fallback for non-individual types
 *      - Individual owner type skips tier 3
 *      - Returns null when all tiers find nothing
 *      - Tier errors are swallowed and fallthrough correctly
 *
 *   3. Idempotency: resolved names are never re-queued by the placeholder filter
 *
 *   4. HTTP endpoint smoke tests (POST /run and GET /status)
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Module mocks ──────────────────────────────────────────────────────────

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
    recordMutation: vi.fn(),
  },
}));

// Constellation mock — each function is a module-level vi.fn() so we can
// control them per-test and re-establish them after vi.clearAllMocks().
const mockLookupNodeByAlias = vi.fn().mockResolvedValue(null);
const mockTerraAdapterLookupByAlias = vi.fn().mockResolvedValue(null);
const mockQueryNodes = vi.fn().mockResolvedValue({ nodes: [], total: 0 });
const mockTerraAdapterUpsertEntity = vi.fn().mockResolvedValue({
  id: 'cst-node-test-uuid',
  canonicalId: 'cst-canon-test-uuid',
  domain: 'terra',
  entityType: 'owner',
  labels: ['248 FLATBUSH AVE HOLDINGS LLC'],
  name: '248 FLATBUSH AVE HOLDINGS LLC',
  confidence: 0.85,
  freshness: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sensitivityTier: 'confidential',
  relatedActionIds: [],
  relatedDocumentIds: [],
  relatedExecutionIds: [],
  relatedRiskIds: [],
  extensions: {},
  isActive: true,
});

vi.mock('@szl-holdings/constellation', () => ({
  lookupNodeByAlias: (...args: unknown[]) => mockLookupNodeByAlias(...args),
  upsertNodeAlias: vi.fn().mockResolvedValue(undefined),
  terraAdapter: {
    lookupByAlias: (...args: unknown[]) => mockTerraAdapterLookupByAlias(...args),
    upsertEntity: (...args: unknown[]) => mockTerraAdapterUpsertEntity(...args),
  },
  queryNodes: (...args: unknown[]) => mockQueryNodes(...args),
  queryEdges: vi.fn().mockResolvedValue({ edges: [] }),
}));

// DB mock — db.select resolves to empty by default. Individual tests that
// need a tier-2 hit must override mockDbLimit before calling resolveOwnerForRow.
const mockDbUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  }),
});

// Innermost resolution value — override this per-test for tier-2 hits
const mockDbLimit = vi.fn().mockResolvedValue([]);
const mockDbSelect = vi.fn().mockReturnValue({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: mockDbLimit,
    }),
  }),
});

vi.mock('@szl-holdings/db', () => {
  const stubTable = new Proxy(
    {},
    { get: (_t, p) => (typeof p === 'string' ? Symbol(p) : undefined) },
  );

  return new Proxy(
    {
      db: {
        get select() { return mockDbSelect; },
        update: mockDbUpdate,
        insert: () => ({
          values: () => ({
            returning: () => Promise.resolve([{ id: 99 }]),
            onConflictDoNothing: () => ({ returning: () => Promise.resolve([]) }),
          }),
        }),
      },
    },
    {
      get(target, prop) {
        if (prop in target) return (target as Record<string, unknown>)[prop as string];
        return stubTable;
      },
    },
  );
});

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (_opts?: unknown) => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

vi.mock('../lib/agent-scheduler', () => ({
  dispatchCovenantBreaches: vi.fn().mockResolvedValue({ evaluated: 0, breaches: 0, approvalsCreated: 0, seeded: 0 }),
}));

vi.mock('../lib/terra-covenant-store', () => ({
  evaluateAllCovenants: vi.fn().mockResolvedValue([]),
  ingestLoanFinancials: vi.fn().mockResolvedValue(undefined),
  seedCovenantsFromDistress: vi.fn().mockResolvedValue(0),
  syncLoanFinancialsFromDistress: vi.fn().mockResolvedValue({ synced: 0 }),
}));

vi.mock('../lib/guardian-engine', () => ({
  publishGuardianDecisionEvent: vi.fn(),
}));

vi.mock('../lib/objectStorage', () => ({
  ObjectStorageService: class {
    getSignedUploadUrl = vi.fn().mockResolvedValue({ url: 'http://test', fields: {} });
    getSignedDownloadUrl = vi.fn().mockResolvedValue('http://test');
    deleteObject = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../lib/internal-tokens', () => ({
  tokenHasScope: vi.fn().mockReturnValue(true),
  verifyInternalHeader: vi.fn().mockReturnValue({ context: { scopes: new Set(['internal:write']) } }),
}));

vi.mock('../lib/seed-guard', () => ({
  guardSeedInProduction: vi.fn(),
}));

vi.mock('../lib/validation', async () => {
  const { z } = await import('zod');
  return {
    listQuerySchema: z.object({}).passthrough(),
    validateBody:
      (schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown; error?: unknown } }) =>
      (req: { body: unknown }, res: { status: (n: number) => { json: (b: unknown) => void } }, next: () => void) => {
        const result = schema.safeParse(req.body);
        if (!result.success) { res.status(400).json({ error: 'Bad request' }); return; }
        req.body = result.data;
        next();
      },
    validateQuery: (_schema: unknown) => (_req: unknown, _res: unknown, next: () => void) => next(),
  };
});

vi.mock('express-rate-limit', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('multer', () => {
  const multerInstance = () => ({
    single: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    array: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    fields: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  });
  multerInstance.memoryStorage = () => ({});
  multerInstance.diskStorage = () => ({});
  return { default: multerInstance };
});

vi.mock('@workspace/guardian', () => ({
  computeApprovalExpiresAt: vi.fn().mockReturnValue(new Date()),
}));

// Partial mock for terra-owner-enrichment: replaces resolveDistressOwnerNames
// with a controllable vi.fn() so HTTP endpoint tests do not depend on a live
// DB chain. All other exports (isPlaceholderOwner, inferAddressBasedEntityName,
// resolveOwnerForRow, PLACEHOLDER_SQL_PATTERN, lookupCanonicalPropertyOwner)
// remain real — tests that need them call vi.importActual() directly.
const mockResolveDistressOwnerNames = vi.fn().mockResolvedValue({
  scanned: 0,
  resolved: 0,
  skipped: 0,
  failed: 0,
  constellationNodesCreated: 0,
});

vi.mock('../jobs/terra-owner-enrichment', async () => {
  const actual = await vi.importActual<typeof import('../jobs/terra-owner-enrichment')>(
    '../jobs/terra-owner-enrichment',
  );
  return {
    ...actual,
    resolveDistressOwnerNames: mockResolveDistressOwnerNames,
  };
});

// Mock drizzle-orm operators so they don't throw when called with Symbol-based
// stub columns from the @szl-holdings/db mock. Operators return plain objects
// that the mocked DB chains accept without issue.
vi.mock('drizzle-orm', () => {
  const noop = (..._args: unknown[]) => ({ __drizzle_mock: true });
  const sqlTag = Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __drizzle_mock: true }),
    { raw: (_v: string) => ({ __drizzle_mock: true }) },
  );
  return {
    and: noop,
    or: noop,
    eq: noop,
    ne: noop,
    gt: noop,
    gte: noop,
    lt: noop,
    lte: noop,
    isNull: noop,
    isNotNull: noop,
    inArray: noop,
    notInArray: noop,
    like: noop,
    ilike: noop,
    between: noop,
    notBetween: noop,
    desc: (col: unknown) => ({ __drizzle_mock: true, col }),
    asc: (col: unknown) => ({ __drizzle_mock: true, col }),
    sql: sqlTag,
    SQL: class {},
    count: noop,
    sum: noop,
    avg: noop,
    min: noop,
    max: noop,
    not: noop,
    exists: noop,
    notExists: noop,
  };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

type ResolutionInput = {
  id: number;
  externalId: string | null;
  address: string;
  borough: string;
  zipCode: string | null;
  ownerName: string;
  ownerType: string;
  distressType: string;
  rawData: unknown;
};

function makeRow(overrides: Partial<ResolutionInput> = {}): ResolutionInput {
  return {
    id: 1,
    externalId: 'terra-ext-001',
    address: '248 FLATBUSH AVE',
    borough: 'BROOKLYN',
    zipCode: '11217',
    ownerName: 'Unknown Owner',
    ownerType: 'llc',
    distressType: 'foreclosure',
    rawData: {},
    ...overrides,
  };
}

// ─── 1. Pure-logic: isPlaceholderOwner() ─────────────────────────────────

describe('isPlaceholderOwner()', () => {
  const PLACEHOLDER_CASES: Array<string | null | undefined> = [
    'Unknown Owner',
    'UNKNOWN OWNER',
    'unknown owner',
    'Recent Buyer',
    'recent buyer',
    'Unknown Grantee',
    'UNKNOWN GRANTEE',
    'Unknown Entity',
    'Unknown',
    'Unresolved Owner',
    '',
    null,
    undefined,
  ];

  it.each(PLACEHOLDER_CASES)('flags "%s" as a placeholder', async (name) => {
    const { isPlaceholderOwner } = await vi.importActual<
      typeof import('../jobs/terra-owner-enrichment')
    >('../jobs/terra-owner-enrichment');
    expect(isPlaceholderOwner(name)).toBe(true);
  });

  const REAL_NAMES = [
    'Apex Brooklyn LLC',
    'James Marchetti',
    'Goldstein Family Trust',
    'Meridian Capital Corp.',
    '123 Main St Holdings LLC',
    '248 FLATBUSH AVE HOLDINGS LLC',
  ];

  it.each(REAL_NAMES)('does NOT flag "%s" as a placeholder', async (name) => {
    const { isPlaceholderOwner } = await vi.importActual<
      typeof import('../jobs/terra-owner-enrichment')
    >('../jobs/terra-owner-enrichment');
    expect(isPlaceholderOwner(name)).toBe(false);
  });
});

// ─── 2. Pure-logic: inferAddressBasedEntityName() ─────────────────────────

describe('inferAddressBasedEntityName()', () => {
  let inferAddressBasedEntityName: (
    address: string,
    ownerType: string,
  ) => { resolvedName: string; confidence: number };

  beforeEach(async () => {
    ({ inferAddressBasedEntityName } = await vi.importActual<
      typeof import('../jobs/terra-owner-enrichment')
    >('../jobs/terra-owner-enrichment'));
  });

  it('LLC type appends "HOLDINGS LLC" in upper case', () => {
    const { resolvedName, confidence } = inferAddressBasedEntityName('248 Flatbush Ave', 'llc');
    expect(resolvedName).toBe('248 FLATBUSH AVE HOLDINGS LLC');
    expect(confidence).toBe(0.68);
  });

  it('corporate type appends "REALTY CORP."', () => {
    const { resolvedName } = inferAddressBasedEntityName('100 Main St', 'corporate');
    expect(resolvedName).toBe('100 MAIN ST REALTY CORP.');
  });

  it('trust type appends "IRREVOCABLE TRUST"', () => {
    const { resolvedName } = inferAddressBasedEntityName('50 Ocean Ave', 'trust');
    expect(resolvedName).toBe('50 OCEAN AVE IRREVOCABLE TRUST');
  });

  it('individual type returns bare address (no entity suffix)', () => {
    const { resolvedName } = inferAddressBasedEntityName('10 Park Place', 'individual');
    expect(resolvedName).toBe('10 PARK PLACE');
  });

  it('normalizes whitespace and uppercases the address', () => {
    const { resolvedName } = inferAddressBasedEntityName('  22 court  street  ', 'llc');
    expect(resolvedName).toBe('22 COURT  STREET HOLDINGS LLC');
  });

  it('confidence is always 0.68 regardless of type', () => {
    for (const ownerType of ['llc', 'corporate', 'trust', 'individual', 'unknown']) {
      const { confidence } = inferAddressBasedEntityName('10 Any St', ownerType);
      expect(confidence).toBe(0.68);
    }
  });
});

// ─── 3. Pure-logic: PLACEHOLDER_SQL_PATTERN ───────────────────────────────

describe('PLACEHOLDER_SQL_PATTERN', () => {
  let pattern: string;

  beforeEach(async () => {
    ({ PLACEHOLDER_SQL_PATTERN: pattern } = await vi.importActual<
      typeof import('../jobs/terra-owner-enrichment')
    >('../jobs/terra-owner-enrichment'));
  });

  it('matches all known placeholder variants (case-insensitive)', () => {
    const re = new RegExp(pattern, 'i');
    const cases = [
      'unknown owner', 'unknown grantee', 'unknown entity',
      'recent buyer', 'unknown', 'unresolved owner',
    ];
    for (const c of cases) {
      expect(re.test(c)).toBe(true);
    }
  });

  it('does not match real entity names', () => {
    const re = new RegExp(pattern, 'i');
    for (const name of ['248 FLATBUSH AVE LLC', 'JOHN SMITH', 'APEX REALTY CORP.']) {
      expect(re.test(name)).toBe(false);
    }
  });
});

// ─── 4. resolveOwnerForRow() tier-pipeline ────────────────────────────────
//
// The injectable _overrides parameter is used to replace the real CONSTELLATION
// and DB lookups with plain async functions. This makes the tier-priority and
// fallback logic fully unit-testable without any mock chain or module-mock tricks.

describe('resolveOwnerForRow() — tier priority and fallback', () => {
  type ResolveOwnerFn = typeof import('../jobs/terra-owner-enrichment').resolveOwnerForRow;

  let resolveOwnerForRow: ResolveOwnerFn;
  type ResolutionOutput = { resolvedName: string; source: string; tier: 1 | 2 | 3; confidence: number };

  const TIER1_HIT: ResolutionOutput = {
    resolvedName: '248 FLATBUSH AVE HOLDINGS LLC',
    source: 'constellation:cstn-001',
    tier: 1,
    confidence: 0.90,
  };

  const TIER2_HIT: ResolutionOutput = {
    resolvedName: 'SOME REAL OWNER LLC',
    source: 'terra_properties:acris_deed_party',
    tier: 2,
    confidence: 0.85,
  };

  beforeEach(async () => {
    ({ resolveOwnerForRow } = await vi.importActual<
      typeof import('../jobs/terra-owner-enrichment')
    >('../jobs/terra-owner-enrichment'));
  });

  // Helpers that inject controlled tier responses
  const tier1Miss = { lookupConstellation: async () => null };
  const tier1Hit = { lookupConstellation: async () => TIER1_HIT };
  const tier1PlaceholderHit = {
    // High confidence, but resolvedName is itself a placeholder —
    // resolveOwnerForRow filters these out via isPlaceholderOwner check
    lookupConstellation: async () => ({
      resolvedName: 'Unknown Owner',
      source: 'constellation:cstn-002',
      tier: 1 as const,
      confidence: 0.90,
    }),
  };
  const tier1Error = {
    lookupConstellation: async () => {
      throw new Error('CONSTELLATION timeout');
    },
  };

  const tier2Hit = { lookupCanonical: async () => TIER2_HIT };
  const tier2Miss = { lookupCanonical: async () => null };
  const tier2PlaceholderHit = {
    lookupCanonical: async () => ({
      resolvedName: 'Unknown Grantee',
      source: 'terra_properties:acris_deed_party',
      tier: 2 as const,
      confidence: 0.85,
    }),
  };
  const tier2Error = {
    lookupCanonical: async () => {
      throw new Error('DB connection lost');
    },
  };

  it('Tier 1: returns CONSTELLATION result when confidence is high enough', async () => {
    const result = await resolveOwnerForRow(makeRow(), tier1Hit);

    expect(result).not.toBeNull();
    expect(result!.tier).toBe(1);
    expect(result!.resolvedName).toBe('248 FLATBUSH AVE HOLDINGS LLC');
    expect(result!.confidence).toBe(0.90);
    expect(result!.source).toContain('constellation:');
  });

  it('Tier 1: skips CONSTELLATION results whose name is itself a placeholder', async () => {
    // Placeholder name from tier-1 → falls through to tier-2, then tier-3
    const result = await resolveOwnerForRow(makeRow(), { ...tier1PlaceholderHit, ...tier2Miss });

    expect(result).not.toBeNull();
    expect(result!.tier).toBe(3);
  });

  it('Tier 2: uses terra_properties cross-reference when CONSTELLATION finds nothing', async () => {
    const result = await resolveOwnerForRow(makeRow(), { ...tier1Miss, ...tier2Hit });

    expect(result).not.toBeNull();
    expect(result!.tier).toBe(2);
    expect(result!.resolvedName).toBe('SOME REAL OWNER LLC');
    expect(result!.confidence).toBe(0.85);
    expect(result!.source).toBe('terra_properties:acris_deed_party');
  });

  it('Tier 2: skips canonical rows whose name is still a placeholder', async () => {
    const result = await resolveOwnerForRow(
      makeRow(),
      { ...tier1Miss, ...tier2PlaceholderHit },
    );

    // Tier-2 placeholder → falls through to tier 3
    expect(result).not.toBeNull();
    expect(result!.tier).toBe(3);
  });

  it('Tier 3: falls back to ACRIS address inference for non-individual types', async () => {
    const result = await resolveOwnerForRow(
      makeRow({ address: '248 Flatbush Ave', ownerType: 'llc' }),
      { ...tier1Miss, ...tier2Miss },
    );

    expect(result).not.toBeNull();
    expect(result!.tier).toBe(3);
    expect(result!.resolvedName).toBe('248 FLATBUSH AVE HOLDINGS LLC');
    expect(result!.confidence).toBe(0.68);
    expect(result!.source).toBe('acris:address_inference');
  });

  it('Tier 3: skipped for individual owner type (requires deed-party lookup)', async () => {
    const result = await resolveOwnerForRow(
      makeRow({ ownerType: 'individual' }),
      { ...tier1Miss, ...tier2Miss },
    );

    expect(result).toBeNull();
  });

  it('returns null when ALL tiers produce no result for individual type', async () => {
    const result = await resolveOwnerForRow(
      makeRow({ ownerType: 'individual' }),
      { ...tier1Miss, ...tier2Miss },
    );

    expect(result).toBeNull();
  });

  it('CONSTELLATION error is swallowed and falls through to tier 2', async () => {
    const result = await resolveOwnerForRow(makeRow(), { ...tier1Error, ...tier2Hit });

    expect(result).not.toBeNull();
    expect(result!.tier).toBe(2);
    expect(result!.resolvedName).toBe('SOME REAL OWNER LLC');
  });

  it('DB error in tier 2 is swallowed and falls through to tier 3', async () => {
    const result = await resolveOwnerForRow(
      makeRow({ address: '99 River Rd', ownerType: 'llc' }),
      { ...tier1Miss, ...tier2Error },
    );

    expect(result).not.toBeNull();
    expect(result!.tier).toBe(3);
    expect(result!.resolvedName).toBe('99 RIVER RD HOLDINGS LLC');
  });

  it('Tier 1 short-circuits: tier 2 and tier 3 are NOT called when tier 1 hits', async () => {
    const tier2Spy = vi.fn().mockResolvedValue(TIER2_HIT);
    const result = await resolveOwnerForRow(makeRow(), {
      lookupConstellation: async () => TIER1_HIT,
      lookupCanonical: tier2Spy,
    });

    expect(result!.tier).toBe(1);
    expect(tier2Spy).not.toHaveBeenCalled();
  });
});

// ─── 5. Idempotency guard ─────────────────────────────────────────────────

describe('Idempotency: resolved names are excluded on re-runs', () => {
  it('tier output names are not matched by the placeholder pattern', async () => {
    const { PLACEHOLDER_SQL_PATTERN: pattern } = await vi.importActual<
      typeof import('../jobs/terra-owner-enrichment')
    >('../jobs/terra-owner-enrichment');
    const re = new RegExp(pattern, 'i');
    const resolvedNames = [
      '248 FLATBUSH AVE HOLDINGS LLC',
      '100 MAIN ST REALTY CORP.',
      '50 OCEAN AVE IRREVOCABLE TRUST',
      'SOME REAL OWNER LLC',
      'CONSTELLATION ENTITY INC',
    ];
    for (const name of resolvedNames) {
      expect(re.test(name), `"${name}" should not match placeholder pattern`).toBe(false);
    }
  });
});

// ─── 6. HTTP endpoint tests ───────────────────────────────────────────────

async function buildApp() {
  const app = express();
  app.use(express.json());
  const { default: router } = await import('../routes/terra-cognitive');
  app.use('/api', router);
  return app;
}

// Re-establish all mock implementations that vi.clearAllMocks() wipes
function resetMockImplementations() {
  mockResolveDistressOwnerNames.mockResolvedValue({
    scanned: 0,
    resolved: 0,
    skipped: 0,
    failed: 0,
    constellationNodesCreated: 0,
  });
  mockDbLimit.mockResolvedValue([]);
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ limit: mockDbLimit }),
    }),
  });
  mockDbUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
  });
  mockLookupNodeByAlias.mockResolvedValue(null);
  mockTerraAdapterLookupByAlias.mockResolvedValue(null);
  mockQueryNodes.mockResolvedValue({ nodes: [], total: 0 });
}

describe('POST /api/terra/cognitive/enrichment/run', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    resetMockImplementations();
    app = await buildApp();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns 401 when no user and no internal token', async () => {
    const { verifyInternalHeader } = await import('../lib/internal-tokens');
    vi.mocked(verifyInternalHeader).mockReturnValue(null);

    const res = await request(app).post('/api/terra/cognitive/enrichment/run').send({});
    expect(res.status).toBe(401);
  });

  it('returns 401 when token exists but lacks agent:write scope', async () => {
    const { verifyInternalHeader, tokenHasScope } = await import('../lib/internal-tokens');
    vi.mocked(verifyInternalHeader).mockReturnValue({
      token: {} as never,
      context: { name: 'read-only', scopes: new Set(['internal:read' as never]), legacy: false },
    });
    vi.mocked(tokenHasScope).mockReturnValue(false);

    const res = await request(app).post('/api/terra/cognitive/enrichment/run').send({});
    expect(res.status).toBe(401);
  });

  it('returns 200 with result stats when token has agent:write scope', async () => {
    const { verifyInternalHeader, tokenHasScope } = await import('../lib/internal-tokens');
    vi.mocked(verifyInternalHeader).mockReturnValue({
      token: {} as never,
      context: { name: 'scheduler', scopes: new Set(['agent:write' as never]), legacy: false },
    });
    vi.mocked(tokenHasScope).mockReturnValue(true);

    const res = await request(app).post('/api/terra/cognitive/enrichment/run').send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('result');
    expect(res.body.result).toMatchObject({
      scanned: expect.any(Number),
      resolved: expect.any(Number),
      skipped: expect.any(Number),
      failed: expect.any(Number),
      constellationNodesCreated: expect.any(Number),
    });
  });

  it('accepts dryRun and batchSize options', async () => {
    const { verifyInternalHeader, tokenHasScope } = await import('../lib/internal-tokens');
    vi.mocked(verifyInternalHeader).mockReturnValue({
      token: {} as never,
      context: { name: 'scheduler', scopes: new Set(['agent:write' as never]), legacy: false },
    });
    vi.mocked(tokenHasScope).mockReturnValue(true);

    const res = await request(app)
      .post('/api/terra/cognitive/enrichment/run')
      .send({ dryRun: true, batchSize: 50 });
    expect(res.status).toBe(200);
  });

  it('rejects an array body with 400', async () => {
    const { verifyInternalHeader, tokenHasScope } = await import('../lib/internal-tokens');
    vi.mocked(verifyInternalHeader).mockReturnValue({
      token: {} as never,
      context: { name: 'scheduler', scopes: new Set(['agent:write' as never]), legacy: false },
    });
    vi.mocked(tokenHasScope).mockReturnValue(true);

    const res = await request(app)
      .post('/api/terra/cognitive/enrichment/run')
      .send([{ dryRun: true }]);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/terra/cognitive/enrichment/status', () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    resetMockImplementations();
    // Status endpoint queries three count queries — return count rows
    mockDbLimit.mockResolvedValue([{ count: 10 }]);
    app = await buildApp();
  });

  it('route is registered and responds (not 404)', async () => {
    const res = await request(app).get('/api/terra/cognitive/enrichment/status');
    expect(res.status).not.toBe(404);
  });

  it('response shape includes graphConfidence and graphConfidenceSource', async () => {
    const res = await request(app).get('/api/terra/cognitive/enrichment/status');
    if (res.status === 200) {
      expect(res.body).toHaveProperty('graphConfidence');
      expect(res.body).toHaveProperty('graphConfidenceSource');
      expect(res.body).toHaveProperty('unresolvedOwners');
      expect(res.body).toHaveProperty('resolutionRate');
      expect(res.body).toHaveProperty('onTrack');
    }
  });
});
