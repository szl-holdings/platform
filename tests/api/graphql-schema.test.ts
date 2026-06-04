/**
 * GraphQL Schema Contract Tests
 *
 * Executes actual frontend-used query documents (extracted from
 * lib/graphql-client/src/hooks/*.ts) against the live, built GraphQL schema.
 *
 * Goals:
 *   1. Schema SDL parses and type-checks without errors
 *   2. Every frontend query document is valid against the built schema
 *   3. Resolvers return the expected shape when invoked with mock storage data
 *   4. Type mismatches (e.g. field renamed server-side) produce test failures
 *
 * Only the I/O boundaries are mocked:
 *   - Domain service storage builders (return predictable stub data)
 *   - pubsub / WebSocket bridge (no real WS server in test context)
 *   - websocket.js publish helper
 *   - domain-events bus
 *   - @szl-holdings/db (for resolvers that access db directly)
 */

import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ── Stub factories ─────────────────────────────────────────────────────────────

const makeVessel = (id = 1) => ({
  id,
  name: `Test Vessel ${id}`,
  imo: `IMO100000${id}`,
  mmsi: null,
  vesselType: 'cargo',
  flag: 'US',
  yearBuilt: 2020,
  grossTonnage: '50000.00',
  status: 'active',
  fleetId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const makeVenture = (id = 1) => ({
  id,
  slug: `venture-${id}`,
  name: `Test Venture ${id}`,
  description: null,
  sector: 'tech',
  status: 'active',
  stage: 'growth',
  founded: '2020',
  website: null,
  logo: null,
  color: null,
  metrics: null,
  metadata: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const makeIncident = (id = 1) => ({
  id,
  title: `Incident ${id}`,
  severity: 'high',
  status: 'open',
  impactArea: 'production',
  rootCause: null,
  resolution: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const makeSignal = (id = 1) => ({
  id,
  source: 'prometheus',
  severity: 'medium',
  title: `Signal ${id}`,
  summary: 'test signal',
  status: 'active',
  domain: 'lyte',
  metadata: null,
  createdAt: new Date().toISOString(),
});

// ── Drizzle chain mock (for domains that use db directly) ─────────────────────
const makeChain = (result: unknown[] = []) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'from',
    'where',
    'orderBy',
    'limit',
    'offset',
    'innerJoin',
    'leftJoin',
    'groupBy',
    'having',
    'insert',
    'into',
    'values',
    'returning',
    'update',
    'set',
    'delete',
  ];
  for (const m of methods) {
    chain[m] = () => chain;
  }
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(result));
  chain[Symbol.toStringTag] = 'Promise';
  return chain;
};

const mockDb = {
  select: () => makeChain([]),
  insert: () => makeChain([{ id: 1 }]),
  update: () => makeChain([{ id: 1 }]),
  delete: () => makeChain([]),
};

// ── Mock: @szl-holdings/db ────────────────────────────────────────────────────
const tableProxy = new Proxy({}, { get: (_t, p) => ({ name: String(p), columnType: 'text' }) });

vi.mock('@szl-holdings/db', () => ({
  db: mockDb,
  ...new Proxy(
    {},
    {
      get: (_t, p: string) => {
        if (p === 'db') return mockDb;
        if (p === 'default') return {};
        if (p === 'pool') return { end: vi.fn(), query: vi.fn() };
        return tableProxy;
      },
    },
  ),
}));

// ── Mock: domain service modules ──────────────────────────────────────────────
vi.mock('../../artifacts/api-server/src/lib/domain-services/vessels/index.js', () => ({
  buildVesselsStorage: vi.fn().mockResolvedValue({
    listVessels: vi.fn().mockResolvedValue([makeVessel(1), makeVessel(2)]),
    getVessel: vi.fn().mockResolvedValue(makeVessel(1)),
    listPositions: vi.fn().mockResolvedValue([]),
    listRoutes: vi.fn().mockResolvedValue([]),
    listEvents: vi.fn().mockResolvedValue([]),
  }),
  listVessels: vi.fn().mockResolvedValue([makeVessel(1), makeVessel(2)]),
  getVessel: vi.fn().mockResolvedValue(makeVessel(1)),
  listVesselPositions: vi.fn().mockResolvedValue([]),
  listVesselRoutes: vi.fn().mockResolvedValue([]),
  listVesselEvents: vi.fn().mockResolvedValue([]),
  domainEventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
}));

vi.mock('../../artifacts/api-server/src/lib/domain-services/holdings/index.js', () => ({
  buildHoldingsStorage: vi.fn().mockResolvedValue({
    listVentures: vi.fn().mockResolvedValue([makeVenture(1)]),
    getVenture: vi.fn().mockResolvedValue(makeVenture(1)),
    getVentureBySlug: vi.fn().mockResolvedValue(makeVenture(1)),
    listMetrics: vi.fn().mockResolvedValue([]),
    listMilestones: vi.fn().mockResolvedValue([]),
    listInquiries: vi.fn().mockResolvedValue([]),
    createInquiry: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
  }),
  listHoldingsVentures: vi.fn().mockResolvedValue([makeVenture(1)]),
  getHoldingsVenture: vi.fn().mockResolvedValue(makeVenture(1)),
  getHoldingsVentureBySlug: vi.fn().mockResolvedValue(makeVenture(1)),
  listHoldingsMetrics: vi.fn().mockResolvedValue([]),
  listHoldingsMilestones: vi.fn().mockResolvedValue([]),
  listHoldingsInquiries: vi.fn().mockResolvedValue([]),
  createHoldingsInquiry: vi
    .fn()
    .mockResolvedValue({ id: 1, name: 'Test', email: 't@t.com', subject: 's', message: 'm' }),
  getTrustCenterStatus: vi.fn().mockResolvedValue({
    lastAuditDate: '2025-01-01',
    nextReviewDate: '2026-01-01',
    overallScore: 95,
    frameworks: [],
    certifications: [],
  }),
}));

vi.mock('../../artifacts/api-server/src/lib/domain-services/lyte/index.js', () => ({
  buildLyteStorage: vi.fn().mockResolvedValue({
    listIncidents: vi.fn().mockResolvedValue([makeIncident(1)]),
    getIncident: vi.fn().mockResolvedValue(makeIncident(1)),
    listSignals: vi.fn().mockResolvedValue([makeSignal(1)]),
    listActions: vi.fn().mockResolvedValue([]),
  }),
  listLyteIncidents: vi.fn().mockResolvedValue([makeIncident(1)]),
  getLyteIncident: vi.fn().mockResolvedValue(makeIncident(1)),
  listLyteSignals: vi.fn().mockResolvedValue([makeSignal(1)]),
  listLyteActions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../artifacts/api-server/src/lib/domain-services/terra/index.js', () => ({
  buildTerraStorage: vi.fn().mockResolvedValue({
    listListings: vi.fn().mockResolvedValue([]),
    getMarketStats: vi.fn().mockResolvedValue({ totalListings: 0, avgPrice: 0 }),
  }),
  listTerraListings: vi.fn().mockResolvedValue([]),
  getTerraMarketStats: vi.fn().mockResolvedValue({ totalListings: 0, avgPrice: 0 }),
}));

vi.mock('../../artifacts/api-server/src/lib/domain-services/carlota-jo/index.js', () => ({
  buildCarlotaJoStorage: vi.fn().mockResolvedValue({
    listServices: vi.fn().mockResolvedValue([]),
    listInquiries: vi.fn().mockResolvedValue([]),
    createInquiry: vi.fn().mockResolvedValue({ id: 1 }),
  }),
  listCarlotaServices: vi.fn().mockResolvedValue([]),
  listCarlotaInquiries: vi.fn().mockResolvedValue([]),
  createCarlotaInquiry: vi.fn().mockResolvedValue({ id: 1 }),
}));

vi.mock('../../artifacts/api-server/src/lib/domain-services/firestorm/index.js', () => ({
  buildAegisStorage: vi.fn().mockResolvedValue({
    listIncidents: vi.fn().mockResolvedValue([]),
    listAlerts: vi.fn().mockResolvedValue([]),
    listAssets: vi.fn().mockResolvedValue([]),
    listScenarios: vi.fn().mockResolvedValue([]),
    listFindings: vi.fn().mockResolvedValue([]),
  }),
  listAegisIncidents: vi.fn().mockResolvedValue([]),
  listAegisAlerts: vi.fn().mockResolvedValue([]),
  listAegisAssets: vi.fn().mockResolvedValue([]),
  listAegisScenarios: vi.fn().mockResolvedValue([]),
  listAegisFindings: vi.fn().mockResolvedValue([]),
}));

// ── Mock: infrastructure (pubsub, WS, events) ─────────────────────────────────
vi.mock('../../artifacts/api-server/src/lib/pubsub-bridge.js', () => ({
  pubsub: { publish: vi.fn(), asyncIterator: vi.fn(() => ({ [Symbol.asyncIterator]: vi.fn() })) },
  broadcastWs: vi.fn(),
  withFilter: vi.fn((fn) => fn),
  VESSELS_EVENTS: { POSITION_UPDATED: 'VPU' },
  TERRA_EVENTS: { LISTING_UPDATED: 'TLU' },
  LYTE_EVENTS: { INCIDENT_CREATED: 'LIC' },
  FIRESTORM_EVENTS: { INCIDENT_CREATED: 'FIC' },
  ALLOY_EVENTS: { DECISION_CREATED: 'ADC' },
  CARLOTA_EVENTS: { INQUIRY_CREATED: 'CIC' },
}));

vi.mock('../../artifacts/api-server/src/lib/websocket.js', () => ({
  publish: vi.fn(),
  WS_CHANNELS: {},
  issueWsTicket: vi.fn(() => 'mock-ticket'),
}));

vi.mock('../../artifacts/api-server/src/lib/domain-events/index.js', () => ({
  domainEventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn(), removeListener: vi.fn() },
}));

vi.mock('../../artifacts/api-server/src/lib/activity-logger.js', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

// ── Schema under test ─────────────────────────────────────────────────────────

let schema: ReturnType<typeof makeExecutableSchema>;

beforeAll(async () => {
  const { typeDefs, resolvers } = await import('../../artifacts/api-server/src/graphql/schema');
  schema = makeExecutableSchema({ typeDefs, resolvers });
});

// ── Helper ────────────────────────────────────────────────────────────────────

async function runQuery(source: string, variables?: Record<string, unknown>) {
  const result = await graphql({ schema, source, variableValues: variables ?? {} });
  return result;
}

// ── Test Suite: Schema Validity ────────────────────────────────────────────────

describe('GraphQL Schema — introspection and type validity', () => {
  it('schema builds without type errors', () => {
    expect(schema).toBeDefined();
    expect(typeof schema.getQueryType).toBe('function');
    expect(schema.getQueryType()).not.toBeNull();
  });

  it('schema introspection returns all expected domain types', async () => {
    const result = await runQuery(`
      {
        __schema {
          types {
            name
          }
        }
      }
    `);
    expect(result.errors).toBeUndefined();
    const typeNames = (
      result.data as { __schema: { types: { name: string }[] } }
    ).__schema.types.map((t) => t.name);
    expect(typeNames).toContain('Vessel');
    expect(typeNames).toContain('HoldingsVenture');
    expect(typeNames).toContain('LyteIncident');
    expect(typeNames).toContain('AegisIncident');
  });

  it('_version query resolves without error', async () => {
    const result = await runQuery(`{ _version }`);
    expect(result.errors).toBeUndefined();
    expect(typeof result.data?._version).toBe('string');
  });
});

// ── Test Suite: Vessels frontend queries ───────────────────────────────────────

describe('GraphQL Schema — Vessels domain (frontend query documents)', () => {
  it('GET_VESSELS query executes and returns vessels array', async () => {
    const result = await runQuery(
      `
      query GetVessels($status: String, $limit: Int, $offset: Int) {
        vessels(status: $status, limit: $limit, offset: $offset) {
          id
          name
          imo
          vesselType
          status
          fleetId
          createdAt
        }
      }
    `,
      { limit: 10 },
    );
    expect(result.errors).toBeUndefined();
    expect(Array.isArray(result.data?.vessels)).toBe(true);
    const vessels = result.data?.vessels as { id: string; name: string; vesselType: string }[];
    if (vessels.length > 0) {
      expect(vessels[0]).toHaveProperty('id');
      expect(vessels[0]).toHaveProperty('name');
      expect(vessels[0]).toHaveProperty('vesselType');
    }
  });

  it('GET_VESSEL query executes and returns a single vessel', async () => {
    const result = await runQuery(
      `
      query GetVessel($id: ID!) {
        vessel(id: $id) {
          id
          name
          imo
          vesselType
          status
          fleetId
          createdAt
        }
      }
    `,
      { id: '1' },
    );
    expect(result.errors).toBeUndefined();
    const vessel = result.data?.vessel as { id: string; name: string } | null;
    if (vessel) {
      expect(vessel).toHaveProperty('id');
      expect(vessel).toHaveProperty('name');
    }
  });

  it('GET_VESSEL_POSITIONS query executes and returns array', async () => {
    const result = await runQuery(
      `
      query GetVesselPositions($vesselId: ID, $limit: Int) {
        vesselPositions(vesselId: $vesselId, limit: $limit) {
          vesselId
          latitude
          longitude
          speed
          recordedAt
        }
      }
    `,
      { limit: 10 },
    );
    expect(result.errors).toBeUndefined();
    expect(Array.isArray(result.data?.vesselPositions)).toBe(true);
  });

  it('GET_VESSEL_ROUTES query executes and returns array', async () => {
    const result = await runQuery(
      `
      query GetVesselRoutes($vesselId: ID, $status: String, $limit: Int, $offset: Int) {
        vesselRoutes(vesselId: $vesselId, status: $status, limit: $limit, offset: $offset) {
          id
          vesselId
          originPort
          destinationPort
          departureAt
          status
        }
      }
    `,
      { limit: 10, offset: 0 },
    );
    expect(result.errors).toBeUndefined();
    expect(Array.isArray(result.data?.vesselRoutes)).toBe(true);
  });
});

// ── Test Suite: Holdings frontend queries ─────────────────────────────────────

describe('GraphQL Schema — Holdings domain (frontend query documents)', () => {
  it('GET_HOLDINGS_VENTURES query executes and returns ventures array', async () => {
    const result = await runQuery(
      `
      query GetHoldingsVentures($status: String, $limit: Int, $offset: Int) {
        holdingsVentures(status: $status, limit: $limit, offset: $offset) {
          id
          slug
          name
          status
          sector
          createdAt
        }
      }
    `,
      { limit: 10 },
    );
    expect(result.errors).toBeUndefined();
    expect(Array.isArray(result.data?.holdingsVentures)).toBe(true);
    const ventures = result.data?.holdingsVentures as { id: string; slug: string }[];
    if (ventures.length > 0) {
      expect(ventures[0]).toHaveProperty('id');
      expect(ventures[0]).toHaveProperty('slug');
    }
  });

  it('GET_HOLDINGS_VENTURE_BY_SLUG query executes and returns a venture or null', async () => {
    const result = await runQuery(
      `
      query GetHoldingsVentureBySlug($slug: String!) {
        holdingsVentureBySlug(slug: $slug) {
          id
          slug
          name
          status
          sector
          createdAt
        }
      }
    `,
      { slug: 'venture-1' },
    );
    expect(result.errors).toBeUndefined();
  });

  it('GET_HOLDINGS_METRICS query executes and returns metrics array', async () => {
    const result = await runQuery(
      `
      query GetHoldingsMetrics($ventureId: ID!, $limit: Int) {
        holdingsMetrics(ventureId: $ventureId, limit: $limit) {
          id
          ventureId
          label
          value
          change
          period
          createdAt
        }
      }
    `,
      { ventureId: '1', limit: 10 },
    );
    expect(result.errors).toBeUndefined();
    expect(Array.isArray(result.data?.holdingsMetrics)).toBe(true);
  });

  it('GET_HOLDINGS_MILESTONES query executes and returns milestones array', async () => {
    const result = await runQuery(
      `
      query GetHoldingsMilestones($ventureId: ID!, $limit: Int) {
        holdingsMilestones(ventureId: $ventureId, limit: $limit) {
          id
          ventureId
          title
          date
          category
          createdAt
        }
      }
    `,
      { ventureId: '1', limit: 10 },
    );
    expect(result.errors).toBeUndefined();
    expect(Array.isArray(result.data?.holdingsMilestones)).toBe(true);
  });
});

// ── Test Suite: Lyte frontend queries ─────────────────────────────────────────

describe('GraphQL Schema — Lyte domain (frontend query documents)', () => {
  it('GET_LYTE_INCIDENTS query executes and returns incidents array', async () => {
    const result = await runQuery(
      `
      query GetLyteIncidents($status: String, $severity: String, $limit: Int, $offset: Int) {
        lyteIncidents(status: $status, severity: $severity, limit: $limit, offset: $offset) {
          id
          severity
          status
          impactArea
          rootCause
          createdAt
        }
      }
    `,
      { limit: 10 },
    );
    expect(result.errors).toBeUndefined();
    expect(Array.isArray(result.data?.lyteIncidents)).toBe(true);
  });

  it('GET_LYTE_SIGNALS query executes and returns signals array', async () => {
    const result = await runQuery(
      `
      query GetLyteSignals($severity: String, $status: String, $limit: Int, $offset: Int) {
        lyteSignals(severity: $severity, status: $status, limit: $limit, offset: $offset) {
          id
          source
          severity
          title
          status
          createdAt
        }
      }
    `,
      { limit: 10 },
    );
    expect(result.errors).toBeUndefined();
    expect(Array.isArray(result.data?.lyteSignals)).toBe(true);
  });

  it('GET_LYTE_ACTIONS query executes and returns actions array', async () => {
    const result = await runQuery(
      `
      query GetLyteActions($state: String, $limit: Int, $offset: Int) {
        lyteActions(state: $state, limit: $limit, offset: $offset) {
          id
          state
          priority
          valueAtRisk
          createdAt
        }
      }
    `,
      { limit: 10 },
    );
    expect(result.errors).toBeUndefined();
    expect(Array.isArray(result.data?.lyteActions)).toBe(true);
  });
});

// ── Test Suite: Schema field contract enforcement ─────────────────────────────

describe('GraphQL Schema — Field contract enforcement', () => {
  it('querying a non-existent field on Vessel produces a schema validation error', async () => {
    const result = await graphql({
      schema,
      source: `query { vessels { id nonExistentField123 } }`,
    });
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.[0].message).toMatch(/nonExistentField123/);
  });

  it('querying a non-existent field on HoldingsVenture produces a schema validation error', async () => {
    const result = await graphql({
      schema,
      source: `query { holdingsVentures { id slug ghostField999 } }`,
    });
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].message).toMatch(/ghostField999/);
  });

  it('querying a non-existent root query produces a schema validation error', async () => {
    const result = await graphql({
      schema,
      source: `query { completelyMadeUpQuery { id } }`,
    });
    expect(result.errors).toBeDefined();
  });
});
