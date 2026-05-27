/**
 * /warhacker — integration tests for the Warhacker Hub API (#5567).
 *
 * The five lanes share one hash-chained receipt helper. If anyone breaks
 * canonical-JSON payload hashing, prevHash linkage, or head computation,
 * every lane silently breaks. These tests assert per the task brief:
 *   - 200 status on the lane POST
 *   - chainLength matches the emitted receipts array
 *   - chain head equals the last entry's entryHash
 *   - prevHash chain is intact from GENESIS (sha256-of-zero, 64 hex 0s)
 *   - receiptClass values match the lane catalog (as a set; lane-4
 *     legitimately emits `pipeline.stage.v1` twice)
 *
 * Warhacker routes are public (no auth, no rate-limiter, no policy-guard),
 * so the test harness mounts the router directly without mocks.
 */
import express from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const GENESIS = '0'.repeat(64);

const LANE_CATALOG = {
  'lane-1': {
    path: '/warhacker/lane/1/bundle-compose',
    receiptClasses: ['bundle.composition.v1', 'attestation.chain.v1', 'observability.plane.v1'],
  },
  'lane-2': {
    path: '/warhacker/lane/2/health-screening',
    receiptClasses: ['extraction.schema-grounded.v1', 'memory.recall.v1', 'unit.readiness.v1'],
  },
  'lane-3': {
    path: '/warhacker/lane/3/drone-oversight',
    receiptClasses: [
      'graph.plan.v1',
      'ctm.tick.v1',
      'time-r1.window.v1',
      'lambda.invariant.v1',
    ],
  },
  'lane-4': {
    path: '/warhacker/lane/4/trajectory',
    receiptClasses: ['pipeline.stage.v1', 'time-r1.window.v1', 'context.card.v1'],
  },
  'lane-5': {
    path: '/warhacker/lane/5/edge-drill',
    receiptClasses: ['edge.drill.v1', 'peak.detection.v1', 'antivenom.catch.v1'],
  },
} as const;

interface Receipt {
  index: number;
  receiptClass: string;
  subject: string;
  summary: string;
  payloadSha256: string;
  prevHash: string;
  entryHash: string;
  emittedAt: string;
  pillar: string;
}

interface LaneEnvelope {
  lane: string;
  traceId: string;
  chain: Receipt[];
  head: string;
  chainLength: number;
}

function assertChainIntegrity(
  body: LaneEnvelope,
  laneId: keyof typeof LANE_CATALOG,
): void {
  const catalog = LANE_CATALOG[laneId];

  expect(body.lane).toBe(laneId);
  expect(Array.isArray(body.chain)).toBe(true);
  expect(body.chain.length).toBeGreaterThan(0);
  expect(body.chainLength).toBe(body.chain.length);

  // head == last entryHash
  const last = body.chain[body.chain.length - 1]!;
  expect(body.head).toBe(last.entryHash);

  // prevHash chain intact from GENESIS
  let prev = GENESIS;
  body.chain.forEach((entry, i) => {
    expect(entry.index).toBe(i);
    expect(entry.prevHash).toBe(prev);
    expect(entry.entryHash).toMatch(/^[a-f0-9]{64}$/);
    expect(entry.payloadSha256).toMatch(/^[a-f0-9]{64}$/);
    prev = entry.entryHash;
  });

  // receiptClass values match the catalog (as a set — lane-4 emits
  // pipeline.stage.v1 twice, so length-equality is not the right check)
  const emittedClasses = new Set(body.chain.map((r) => r.receiptClass));
  const catalogClasses = new Set(catalog.receiptClasses);
  expect([...emittedClasses].sort()).toEqual([...catalogClasses].sort());
}

let app: ReturnType<typeof express>;

beforeAll(async () => {
  const mod = await import('../warhacker');
  app = express();
  app.use(express.json());
  app.use(mod.default);
});

describe('POST /warhacker/lane/1/bundle-compose', () => {
  it('returns 200 with an intact three-receipt bundle.composition chain', async () => {
    const res = await request(app)
      .post(LANE_CATALOG['lane-1'].path)
      .send({ bundles: ['rosie-uds', 'sentra-uds', 'amaru-uds', 'a11oy-uds'] });
    expect(res.status).toBe(200);
    assertChainIntegrity(res.body, 'lane-1');
    expect(res.body.chain).toHaveLength(3);
  });
});

describe('POST /warhacker/lane/2/health-screening', () => {
  it('returns 200 with an intact three-receipt unit-readiness chain', async () => {
    const res = await request(app).post(LANE_CATALOG['lane-2'].path).send({});
    expect(res.status).toBe(200);
    assertChainIntegrity(res.body, 'lane-2');
    expect(res.body.chain).toHaveLength(3);
    expect(res.body.commanderDashboard.pillBucket).toMatch(/^(GREEN|AMBER|RED)$/);
  });
});

describe('POST /warhacker/lane/3/drone-oversight', () => {
  it('returns 200 with an intact four-receipt Λ-invariant chain', async () => {
    const res = await request(app).post(LANE_CATALOG['lane-3'].path).send({});
    expect(res.status).toBe(200);
    assertChainIntegrity(res.body, 'lane-3');
    expect(res.body.chain).toHaveLength(4);
    expect(res.body.approvalsInbox.ref).toContain(`trace=${res.body.traceId}`);
    expect(res.body.approvalsInbox.ref).toContain(`head=${res.body.head}`);
  });
});

describe('POST /warhacker/lane/4/trajectory', () => {
  it('returns 200 with an intact four-receipt trajectory chain (pipeline.stage twice)', async () => {
    const res = await request(app).post(LANE_CATALOG['lane-4'].path).send({});
    expect(res.status).toBe(200);
    assertChainIntegrity(res.body, 'lane-4');
    expect(res.body.chain).toHaveLength(4);
    // lane-4 is the duplicate-class case the helper must tolerate
    const pipelineStages = res.body.chain.filter(
      (r: Receipt) => r.receiptClass === 'pipeline.stage.v1',
    );
    expect(pipelineStages).toHaveLength(2);
    expect(pipelineStages[0]!.entryHash).not.toBe(pipelineStages[1]!.entryHash);
  });
});

describe('POST /warhacker/lane/5/edge-drill', () => {
  it('returns 200 with an intact three-receipt antivenom chain', async () => {
    const res = await request(app).post(LANE_CATALOG['lane-5'].path).send({});
    expect(res.status).toBe(200);
    assertChainIntegrity(res.body, 'lane-5');
    expect(res.body.chain).toHaveLength(3);
    expect(res.body.caughtAll).toBe(true);
  });
});

describe('chain determinism', () => {
  it('produces identical chains for identical input bodies (same traceId, head, payloadSha256)', async () => {
    const body = { unitRef: 'unit:test-determinism', rosterSize: 100, screened: 95, deferred: 3, failed: 2 };
    const a = await request(app).post(LANE_CATALOG['lane-2'].path).send(body);
    const b = await request(app).post(LANE_CATALOG['lane-2'].path).send(body);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(a.body.traceId).toBe(b.body.traceId);
    expect(a.body.head).toBe(b.body.head);
    expect(a.body.chain.map((r: Receipt) => r.entryHash)).toEqual(
      b.body.chain.map((r: Receipt) => r.entryHash),
    );
  });

  it('produces different chains when the input body changes', async () => {
    const a = await request(app)
      .post(LANE_CATALOG['lane-3'].path)
      .send({ droneRef: 'drone:A', waypointCount: 9, ctmTicks: 24, lambdaFloor: 0.9 });
    const b = await request(app)
      .post(LANE_CATALOG['lane-3'].path)
      .send({ droneRef: 'drone:B', waypointCount: 9, ctmTicks: 24, lambdaFloor: 0.9 });
    expect(a.body.traceId).not.toBe(b.body.traceId);
    expect(a.body.head).not.toBe(b.body.head);
  });
});
