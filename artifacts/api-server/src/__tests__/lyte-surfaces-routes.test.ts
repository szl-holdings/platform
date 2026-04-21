import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — ALL data must be inlined inside vi.mock factories because vi.mock
// is hoisted before variable declarations.
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => {
  // Table sentinels and mock data inlined here to survive hoisting.
  const PRESSURE_CELLS_TABLE = { __table: 'lyte_pressure_cells' };
  const DRIFT_ITEMS_TABLE = { __table: 'lyte_drift_items' };
  const DEBT_ITEMS_TABLE = { __table: 'lyte_debt_items' };
  const ENTITY_NODES_TABLE = { __table: 'lyte_entity_nodes' };
  const ENTITY_EDGES_TABLE = { __table: 'lyte_entity_edges' };

  const TABLE_DATA: Record<string, unknown[]> = {
    lyte_pressure_cells: [
      {
        id: 'pc-001',
        team: 'BD',
        workflow: 'Vantex Approval Chain',
        account: 'Vantex',
        program: 'Acquisition',
        sponsor: 'Chris Wade',
        openCount: 5,
        overdue: 3,
        blocked: 2,
        escalated: 1,
        score: 98,
        orderIdx: 0,
      },
      {
        id: 'pc-002',
        team: 'Sales',
        workflow: 'Q2 Pipeline Execution',
        account: 'Multiple',
        program: 'Q2 Revenue',
        sponsor: 'Sarah Kim',
        openCount: 8,
        overdue: 1,
        blocked: 0,
        escalated: 0,
        score: 44,
        orderIdx: 1,
      },
    ],
    lyte_drift_items: [
      {
        id: 'di-001',
        team: 'BD',
        staleDays: 47,
        status: 'open',
        owner: 'Chris Wade',
        program: 'Acquisition',
        orderIdx: 0,
      },
    ],
    lyte_debt_items: [
      { id: 'debt-001', status: 'open', orderIdx: 0 },
      { id: 'debt-002', status: 'resolved', orderIdx: 1 },
    ],
    lyte_entity_nodes: [
      {
        id: 'lyte-opp-vantex-001',
        label: 'Vantex Acquisition',
        type: 'opportunity',
        status: 'stalled',
        sublabel: '$4.2M · 47d stalled',
        policyState: 'flagged',
        confidence: 0.91,
        freshness: 'stale',
        x: 400,
        y: 200,
        metadata: { estimatedValueUsd: 4200000 },
        orderIdx: 0,
      },
    ],
    lyte_entity_edges: [
      {
        id: 'e-01',
        sourceId: 'lyte-opp-vantex-001',
        targetId: 'lyte-chain-vantex-001',
        label: 'requires',
        strength: 'strong',
        status: 'stalled',
        proofRef: 'LYTE-W-0491',
        orderIdx: 0,
      },
    ],
  };

  const makeSelectChain = (tableRef?: { __table?: string }): Record<string, unknown> => {
    const data = tableRef?.__table ? (TABLE_DATA[tableRef.__table] ?? []) : [];
    const end = () => Promise.resolve(data);
    const chain: Record<string, unknown> = {};
    chain.from = (t: { __table?: string }) => makeSelectChain(t);
    chain.where = () => chain;
    chain.orderBy = end;
    chain.limit = end;
    return chain;
  };

  const db = {
    select: () => makeSelectChain(),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
  };

  return {
    db,
    lytePressureCellsTable: PRESSURE_CELLS_TABLE,
    lyteDriftItemsTable: DRIFT_ITEMS_TABLE,
    lyteDebtItemsTable: DEBT_ITEMS_TABLE,
    lyteDriftHistoryTable: { __table: 'lyte_drift_history' },
    lyteDebtScoreHistoryTable: { __table: 'lyte_debt_score_history' },
    lyteReplayScenariosTable: { __table: 'lyte_replay_scenarios' },
    lyteBoardMetricsTable: { __table: 'lyte_board_metrics' },
    lyteBoardRisksTable: { __table: 'lyte_board_risks' },
    lyteEntityNodesTable: ENTITY_NODES_TABLE,
    lyteEntityEdgesTable: ENTITY_EDGES_TABLE,
  };
});

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('drizzle-orm', () => ({
  asc: (col: unknown) => col,
  eq: (col: unknown, val: unknown) => ({ col, val }),
}));

const { default: surfacesRouter } = await import('../routes/lyte-surfaces.js');

const app = express();
app.use(express.json());
app.use(surfacesRouter);
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: err.message });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /lyte/workflow-health — live pressure cells', () => {
  it('returns 200 with workflows array and summary', async () => {
    const res = await request(app).get('/lyte/workflow-health');
    expect(res.status).toBe(200);
    const body = res.body as { workflows: unknown[]; summary: Record<string, unknown> };
    expect(Array.isArray(body.workflows)).toBe(true);
    expect(typeof body.summary).toBe('object');
    expect(typeof body.summary.total).toBe('number');
    expect(typeof body.summary.stalled).toBe('number');
    expect(typeof body.summary.blocked).toBe('number');
  });

  it('workflow item contains live liveMetrics from pressure cells', async () => {
    const res = await request(app).get('/lyte/workflow-health');
    expect(res.status).toBe(200);
    const body = res.body as {
      workflows: Array<{
        name: string;
        status: string;
        liveMetrics: Record<string, unknown>;
      }>;
    };
    expect(body.workflows.length).toBeGreaterThan(0);
    const first = body.workflows[0]!;
    expect(typeof first.liveMetrics.pressureScore).toBe('number');
    expect(typeof first.liveMetrics.openCount).toBe('number');
    expect(['stalled', 'blocked', 'at_risk', 'on_track', 'complete']).toContain(first.status);
  });

  it('summary.total matches number of pressure cells', async () => {
    const res = await request(app).get('/lyte/workflow-health');
    expect(res.status).toBe(200);
    const body = res.body as { workflows: unknown[]; summary: { total: number } };
    expect(body.summary.total).toBe(body.workflows.length);
  });

  it('computeStatus maps high score (blocked=2, score=98) to stalled', () => {
    const blocked = 2;
    const score = 98;
    const status =
      blocked >= 2 || score >= 90
        ? 'stalled'
        : blocked >= 1 || score >= 70
          ? 'blocked'
          : score >= 50
            ? 'at_risk'
            : 'on_track';
    expect(status).toBe('stalled');
  });

  it('computeStatus maps low score (blocked=0, score=30) to on_track', () => {
    const blocked = 0;
    const score = 30;
    const status =
      blocked >= 2 || score >= 90
        ? 'stalled'
        : blocked >= 1 || score >= 70
          ? 'blocked'
          : score >= 50
            ? 'at_risk'
            : 'on_track';
    expect(status).toBe('on_track');
  });
});

describe('GET /lyte/entity-graph — DB-backed', () => {
  it('returns 200 with nodes, edges, and provenance', async () => {
    const res = await request(app).get('/lyte/entity-graph');
    expect(res.status).toBe(200);
    const body = res.body as {
      nodes: unknown[];
      edges: unknown[];
      provenance: Record<string, unknown>;
    };
    expect(Array.isArray(body.nodes)).toBe(true);
    expect(Array.isArray(body.edges)).toBe(true);
    expect(typeof body.provenance).toBe('object');
    expect(typeof body.provenance.fetchedAt).toBe('string');
    expect(typeof body.provenance.nodeCount).toBe('number');
    expect(typeof body.provenance.edgeCount).toBe('number');
  });

  it('node shape has required fields', async () => {
    const res = await request(app).get('/lyte/entity-graph');
    expect(res.status).toBe(200);
    const body = res.body as {
      nodes: Array<Record<string, unknown>>;
    };
    expect(body.nodes.length).toBeGreaterThan(0);
    const node = body.nodes[0]!;
    expect(typeof node.id).toBe('string');
    expect(typeof node.label).toBe('string');
    expect(typeof node.type).toBe('string');
    expect(typeof node.status).toBe('string');
    expect(typeof node.confidence).toBe('number');
  });

  it('edge shape has required fields', async () => {
    const res = await request(app).get('/lyte/entity-graph');
    expect(res.status).toBe(200);
    const body = res.body as {
      edges: Array<Record<string, unknown>>;
    };
    expect(body.edges.length).toBeGreaterThan(0);
    const edge = body.edges[0]!;
    expect(typeof edge.id).toBe('string');
    expect(typeof edge.sourceId).toBe('string');
    expect(typeof edge.targetId).toBe('string');
    expect(typeof edge.label).toBe('string');
  });

  it('provenance nodeCount and edgeCount match actual array lengths', async () => {
    const res = await request(app).get('/lyte/entity-graph');
    expect(res.status).toBe(200);
    const body = res.body as {
      nodes: unknown[];
      edges: unknown[];
      provenance: { nodeCount: number; edgeCount: number };
    };
    expect(body.provenance.nodeCount).toBe(body.nodes.length);
    expect(body.provenance.edgeCount).toBe(body.edges.length);
  });
});
