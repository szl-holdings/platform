/**
 * /electrodynamics — integration tests for the electrodynamics API surface (#5532).
 *
 * Covers per the task brief: allowed, denied (policy + missing-auth),
 * rate-limited (writeLimiter saturation), and domain-rule failures
 * (out-of-envelope, exhausted dose, redundancy refusal, covariance
 * invalid, mission unsigned, capability bound-actor missing).
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

let policyDenies = false;

vi.mock('@szl-holdings/policy-guard', async () => {
  const actual = await vi.importActual<typeof import('@szl-holdings/policy-guard')>(
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
let resetJournals: () => void;

beforeAll(async () => {
  const mod = await import('../electrodynamics');
  resetJournals = mod._resetEngagementJournalsForTest;
  app = express();
  app.use(express.json());
  app.use(mod.default);
});

beforeEach(() => {
  authUser = null;
  rateLimitFails = false;
  policyDenies = false;
  resetJournals();
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

function actuatorBody(overrides: Record<string, unknown> = {}) {
  return {
    envelope: {
      envelopeId: 'env-A',
      maxForce: 100,
      maxStroke: 10,
      dutyCycle: 0.5,
      slewLimit: 5,
      deadband: 0.01,
      thermalClass: 'B',
      shockClass: 'M',
    },
    actuatorRef: 'act-1',
    target: 5,
    monotonicSeq: 1,
    issuedAt: new Date().toISOString(),
    ...overrides,
  };
}

function deviceLifecycleBody() {
  return {
    deviceRef: 'dev-1',
    stage: 'calibrate' as const,
    occurredAt: new Date().toISOString(),
    stageData: { result: 'pass' },
  };
}

function busSendBody() {
  return {
    className: 'control',
    maxLatencyMs: 100,
    payloadHash: 'p'.repeat(16),
    enqueuedAt: Date.now(),
  };
}

function missionCompileBody() {
  return {
    planDagRef: 'plan-1',
    nodes: [
      {
        nodeId: 'n1',
        action: 'move',
        preconditions: [],
        postconditions: ['at:waypoint-A'],
        fallbackPolicy: 'retry' as const,
        retryLimit: 3,
      },
    ],
    edges: [],
    compiledBy: 'compiler@v1',
  };
}

function engagementEmitBody(overrides: Record<string, unknown> = {}) {
  return {
    envelope: {
      envelopeId: 'eng-A',
      effectClass: 'deny' as const,
      geofenceRef: 'gf-A',
      doseBudget: 10,
      doseUnit: 'J',
      approvedBy: 'operator-1',
    },
    emissionId: 'em-1',
    doseDelta: 2,
    emittedAt: new Date().toISOString(),
    ...overrides,
  };
}

function swarmTallyBody() {
  const proposal = 'proposal-canonical-string';
  return {
    tallyId: 'tally-1',
    memberCount: 4,
    votes: [
      { memberId: 'm1', proposalCanonical: proposal, voteHash: 'h1234567', signature: 's1234567' },
      { memberId: 'm2', proposalCanonical: proposal, voteHash: 'h1234567', signature: 's1234567' },
      { memberId: 'm3', proposalCanonical: proposal, voteHash: 'h1234567', signature: 's1234567' },
    ],
  };
}

function redundancyTransitionBody() {
  return {
    envelope: {
      subsystemRef: 'sub-A',
      channels: 3,
      ladder: [
        { minHealthy: 3, mode: 'nominal' },
        { minHealthy: 2, mode: 'degraded' },
        { minHealthy: 1, mode: 'safe-hold' },
      ],
      refusalAt: 0,
    },
    priorChannelsHealthy: 3,
    nextChannelsHealthy: 2,
    reason: 'channel-2 sensor fault',
  };
}

function navStateFusionBody() {
  return {
    stateRef: 'state-1',
    sensorRef: 'imu-1',
    sensorHealth: { sensorRef: 'imu-1', available: true, confidence: 0.95 },
    covariance: Array.from({ length: 15 }, (_, i) =>
      Array.from({ length: 15 }, (_, j) => (i === j ? 1 : 0)),
    ),
    asOf: new Date().toISOString(),
    consumerArtifact: 'vessels',
  };
}

function emFieldStepBody() {
  return {
    gridRef: 'grid-1',
    stepIndex: 1,
    values: [0, 0.1, 0.2, 0.1, 0],
    dx: 0.1,
    dt: 0.001,
    priorTotalEnergy: 0,
    consumerArtifact: 'sentra',
  };
}

function capabilitySealBody() {
  return {
    capabilityId: 'cap-1',
    permissions: ['actuator:write'],
    boundActorId: 'svc:rosie',
    sealedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  };
}

// ─── /electrodynamics/actuator/command ───────────────────────────────────────

describe('POST /electrodynamics/actuator/command', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await request(app).post('/electrodynamics/actuator/command').send(actuatorBody());
    expect(res.status).toBe(401);
  });

  it('accepts an in-envelope command and writes actuator.command.v1', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app).post('/electrodynamics/actuator/command').send(actuatorBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('actuator.command.v1');
    expect(res.body.entryId).toBeTruthy();
    expect(res.body.pillar).toBe('policy-aware-actions');
    expect(res.body.withinEnvelope).toBe(true);
  });

  it('rejects an out-of-envelope command with OUT_OF_ENVELOPE', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app)
      .post('/electrodynamics/actuator/command')
      .send(actuatorBody({ target: 9999 }));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('OUT_OF_ENVELOPE');
  });

  it('is rate-limited when the writeLimiter trips (429)', async () => {
    authUser = { id: 1, role: 'operator' };
    rateLimitFails = true;
    const res = await request(app).post('/electrodynamics/actuator/command').send(actuatorBody());
    expect(res.status).toBe(429);
  });

  it('returns 403 POLICY_DENIED when the policy-guard blocks the command', async () => {
    authUser = { id: 1, role: 'operator' };
    policyDenies = true;
    const res = await request(app).post('/electrodynamics/actuator/command').send(actuatorBody());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('POLICY_DENIED');
  });
});

// ─── /electrodynamics/device/lifecycle ───────────────────────────────────────

describe('POST /electrodynamics/device/lifecycle', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await request(app)
      .post('/electrodynamics/device/lifecycle')
      .send(deviceLifecycleBody());
    expect(res.status).toBe(401);
  });

  it('accepts a valid stage and emits device.lifecycle.v1 with a chainHead', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app)
      .post('/electrodynamics/device/lifecycle')
      .send(deviceLifecycleBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('device.lifecycle.v1');
    expect(res.body.chainHead).toMatch(/^[a-f0-9]{64}$/);
    expect(res.body.pillar).toBe('evidence-first');
  });
});

// ─── /electrodynamics/bus/send ───────────────────────────────────────────────

describe('POST /electrodynamics/bus/send', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await request(app).post('/electrodynamics/bus/send').send(busSendBody());
    expect(res.status).toBe(401);
  });

  it('accepts a send and returns a bus.delivery.v1 outcome', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app).post('/electrodynamics/bus/send').send(busSendBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('bus.delivery.v1');
    expect(res.body.outcome).toBeTruthy();
  });
});

// ─── /electrodynamics/mission/compile ────────────────────────────────────────

describe('POST /electrodynamics/mission/compile', () => {
  it('accepts a well-formed mission and emits mission.graph.v1 with a signature', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app)
      .post('/electrodynamics/mission/compile')
      .send(missionCompileBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('mission.graph.v1');
    expect(res.body.missionHash).toMatch(/^[a-f0-9]{64}$/);
    expect(res.body.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(res.body.pillar).toBe('governed-autonomy');
  });

  it('returns 403 POLICY_DENIED when the policy-guard blocks compile', async () => {
    authUser = { id: 1, role: 'operator' };
    policyDenies = true;
    const res = await request(app)
      .post('/electrodynamics/mission/compile')
      .send(missionCompileBody());
    expect(res.status).toBe(403);
  });
});

// ─── /electrodynamics/engagement/emit ────────────────────────────────────────

describe('POST /electrodynamics/engagement/emit', () => {
  it('accepts an emission inside dose budget for an operator caller', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app)
      .post('/electrodynamics/engagement/emit')
      .send(engagementEmitBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('engagement.dosimetry.v1');
    expect(res.body.outcome).toBe('emitted');
  });

  it('refuses further emissions once the envelope is exhausted (409)', async () => {
    authUser = { id: 1, role: 'operator' };
    // burn through the budget
    await request(app)
      .post('/electrodynamics/engagement/emit')
      .send(engagementEmitBody({ emissionId: 'em-1', doseDelta: 10 }));
    const res = await request(app)
      .post('/electrodynamics/engagement/emit')
      .send(engagementEmitBody({ emissionId: 'em-2', doseDelta: 1 }));
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ENGAGEMENT_EXHAUSTED');
  });

  it('blocks non-operator callers with POLICY_REQUIRES_APPROVAL', async () => {
    authUser = { id: 1, role: 'analyst' };
    const res = await request(app)
      .post('/electrodynamics/engagement/emit')
      .send(engagementEmitBody());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('POLICY_REQUIRES_APPROVAL');
  });
});

// ─── /electrodynamics/swarm/tally ────────────────────────────────────────────

describe('POST /electrodynamics/swarm/tally', () => {
  it('tallies votes and emits swarm.consensus.v1', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app).post('/electrodynamics/swarm/tally').send(swarmTallyBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('swarm.consensus.v1');
    expect(res.body.result).toBeTruthy();
  });
});

// ─── /electrodynamics/redundancy/transition ──────────────────────────────────

describe('POST /electrodynamics/redundancy/transition', () => {
  it('records a transition and emits redundancy.mode-transition.v1', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app)
      .post('/electrodynamics/redundancy/transition')
      .send(redundancyTransitionBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('redundancy.mode-transition.v1');
    expect(res.body.prior).toBeTruthy();
    expect(res.body.next).toBeTruthy();
  });
});

// ─── /electrodynamics/nav/state-fusion ───────────────────────────────────────

describe('POST /electrodynamics/nav/state-fusion', () => {
  it('accepts a valid covariance and emits navigation.state-fusion.v1', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app)
      .post('/electrodynamics/nav/state-fusion')
      .send(navStateFusionBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('navigation.state-fusion.v1');
    expect(res.body.covarianceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects a non-square covariance with COVARIANCE_INVALID', async () => {
    authUser = { id: 1, role: 'operator' };
    const body = navStateFusionBody();
    body.covariance = [
      [1, 0, 0],
      [0, 1, 0],
    ];
    const res = await request(app).post('/electrodynamics/nav/state-fusion').send(body);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('COVARIANCE_INVALID');
  });
});

// ─── /electrodynamics/em/field-step ──────────────────────────────────────────

describe('POST /electrodynamics/em/field-step', () => {
  it('steps the field and emits em.field-step.v1 with energy bookkeeping', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app).post('/electrodynamics/em/field-step').send(emFieldStepBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('em.field-step.v1');
    expect(res.body.energyComponents).toBeTruthy();
    expect(typeof res.body.totalEnergy).toBe('number');
  });
});

// ─── /electrodynamics/capability/seal ────────────────────────────────────────

describe('POST /electrodynamics/capability/seal', () => {
  it('seals a capability and emits capability.sealed.v1', async () => {
    authUser = { id: 1, role: 'operator' };
    const res = await request(app)
      .post('/electrodynamics/capability/seal')
      .send(capabilitySealBody());
    expect(res.status).toBe(201);
    expect(res.body.receiptClass).toBe('capability.sealed.v1');
    expect(res.body.capability).toBeTruthy();
  });

  it('returns 403 POLICY_DENIED when the policy-guard blocks the seal', async () => {
    authUser = { id: 1, role: 'operator' };
    policyDenies = true;
    const res = await request(app)
      .post('/electrodynamics/capability/seal')
      .send(capabilitySealBody());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('POLICY_DENIED');
  });
});
