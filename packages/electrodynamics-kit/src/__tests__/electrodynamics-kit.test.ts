import { describe, it, expect } from 'vitest';
import {
  validateCommandWithinEnvelope,
  MonotonicSeqAssigner,
} from '../actuator-command.js';
import { evaluateCalibrationGate } from '../device-lifecycle.js';
import { evaluateBusDelivery } from '../bus-budget.js';
import { compileMission, validateMissionGraphShape } from '../mission-graph.js';
import { EngagementJournal } from '../engagement-dosimetry.js';
import { tally, defaultByzantineTolerance, quorumThreshold } from '../swarm-consensus.js';
import { evaluateRedundancy, isModeTransition } from '../redundancy-envelope.js';
import { validateCovariance, fuseSensor, hashCovariance } from '../nav-state-fusion.js';
import { stepField, computeEnergy, totalEnergy } from '../em-field-step.js';
import { sealCapability, verifyCapability } from '../sealed-capability.js';

const fakeHash = (s: string) => `h:${s.length}:${s.slice(0, 8)}`;

describe('actuator-command', () => {
  const env = {
    envelopeId: 'vcm-12',
    maxForce: 1000,
    maxStroke: 25,
    dutyCycle: 0.5,
    slewLimit: 100,
    deadband: 0.1,
    thermalClass: 'class-H',
    shockClass: 'mil-810',
  } as const;

  it('accepts a target inside the envelope', () => {
    const r = validateCommandWithinEnvelope({ target: 10, envelopeId: 'vcm-12' }, env);
    expect(r.withinEnvelope).toBe(true);
  });

  it('rejects target outside both stroke and force bounds', () => {
    const r = validateCommandWithinEnvelope({ target: 5000, envelopeId: 'vcm-12' }, env);
    expect(r.withinEnvelope).toBe(false);
  });

  it('rejects mismatched envelope ID', () => {
    const r = validateCommandWithinEnvelope({ target: 10, envelopeId: 'other' }, env);
    expect(r.withinEnvelope).toBe(false);
  });

  it('rejects target inside deadband', () => {
    const r = validateCommandWithinEnvelope({ target: 0.05, envelopeId: 'vcm-12' }, env);
    expect(r.withinEnvelope).toBe(false);
  });

  it('MonotonicSeqAssigner rejects non-monotonic registration', () => {
    const a = new MonotonicSeqAssigner();
    a.register('act-1', 0);
    a.register('act-1', 1);
    expect(() => a.register('act-1', 1)).toThrow(/non-monotonic/);
    expect(() => a.register('act-1', 0)).toThrow(/non-monotonic/);
  });
});

describe('device-lifecycle', () => {
  const now = Date.parse('2026-05-27T00:00:00Z');
  it('rejects when no calibrate event present', () => {
    const r = evaluateCalibrationGate('dev-1', [], now);
    expect(r.current).toBe(false);
  });
  it('accepts a current calibration', () => {
    const chain = [
      {
        deviceRef: 'dev-1',
        stage: 'calibrate' as const,
        occurredAt: '2026-05-01T00:00:00Z',
        stageData: { expiresAt: '2026-06-01T00:00:00Z' },
        chainHead: 'h1',
      },
    ];
    const r = evaluateCalibrationGate('dev-1', chain, now);
    expect(r.current).toBe(true);
  });
  it('rejects an expired calibration', () => {
    const chain = [
      {
        deviceRef: 'dev-1',
        stage: 'calibrate' as const,
        occurredAt: '2026-01-01T00:00:00Z',
        stageData: { expiresAt: '2026-02-01T00:00:00Z' },
        chainHead: 'h1',
      },
    ];
    const r = evaluateCalibrationGate('dev-1', chain, now);
    expect(r.current).toBe(false);
  });
  it('treats retirement as terminal', () => {
    const chain = [
      {
        deviceRef: 'dev-1',
        stage: 'calibrate' as const,
        occurredAt: '2026-05-01T00:00:00Z',
        stageData: { expiresAt: '2026-06-01T00:00:00Z' },
        chainHead: 'h1',
      },
      {
        deviceRef: 'dev-1',
        stage: 'retire' as const,
        occurredAt: '2026-05-15T00:00:00Z',
        stageData: {},
        chainHead: 'h2',
      },
    ];
    const r = evaluateCalibrationGate('dev-1', chain, now);
    expect(r.current).toBe(false);
    expect(r.reason).toMatch(/retired/);
  });
});

describe('bus-budget', () => {
  const classes = new Map([['ctl', { className: 'ctl', maxLatencyMs: 10 }]]);
  it('delivers within budget', () => {
    const r = evaluateBusDelivery(
      { className: 'ctl', payloadHash: 'p', enqueuedAt: 1000 },
      classes,
      1005,
    );
    expect(r.delivered).toBe(true);
  });
  it('refuses past budget with explicit reason', () => {
    const r = evaluateBusDelivery(
      { className: 'ctl', payloadHash: 'p', enqueuedAt: 1000 },
      classes,
      1050,
    );
    expect(r.delivered).toBe(false);
    if (!r.delivered) expect(r.refusalReason).toMatch(/budget-exceeded/);
  });
  it('refuses unknown class', () => {
    const r = evaluateBusDelivery(
      { className: 'nope', payloadHash: 'p', enqueuedAt: 1000 },
      classes,
      1005,
    );
    expect(r.delivered).toBe(false);
  });
});

describe('mission-graph', () => {
  const base = {
    planDagRef: 'plan-1',
    nodes: [
      { nodeId: 'a', action: 'sense', preconditions: [], postconditions: [], fallbackPolicy: 'abort' as const },
      { nodeId: 'b', action: 'decide', preconditions: [], postconditions: [], fallbackPolicy: 'skip-once' as const },
    ],
    edges: [{ from: 'a', to: 'b' }],
    compiledBy: 'op-1',
  };
  it('compiles a valid graph deterministically', () => {
    const m1 = compileMission(base, fakeHash, (h) => `sig:${h}`);
    const m2 = compileMission(base, fakeHash, (h) => `sig:${h}`);
    expect(m1.missionHash).toBe(m2.missionHash);
    expect(m1.signature).toBe(m2.signature);
    expect(m1.fallbackPolicyByNode.a).toBe('abort');
  });
  it('rejects a cycle', () => {
    expect(() =>
      validateMissionGraphShape({
        ...base,
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'a' },
        ],
      }),
    ).toThrow(/cycle/);
  });
  it('rejects a retry node without positive retryLimit', () => {
    expect(() =>
      validateMissionGraphShape({
        ...base,
        nodes: [
          { nodeId: 'a', action: 'x', preconditions: [], postconditions: [], fallbackPolicy: 'retry' as const },
        ],
        edges: [],
      }),
    ).toThrow(/retryLimit/);
  });
});

describe('engagement-dosimetry', () => {
  const env = {
    envelopeId: 'eng-1',
    effectClass: 'deny' as const,
    geofenceRef: 'geo-1',
    doseBudget: 100,
    doseUnit: 'opaque',
    approvedBy: 'op-1',
  };
  it('records emissions under budget', () => {
    const j = new EngagementJournal(env);
    const o = j.record({ envelopeId: 'eng-1', emissionId: 'e1', doseDelta: 40, emittedAt: '2026-05-27T00:00:00Z' });
    expect(o.outcome).toBe('emitted');
    expect(j.remaining()).toBe(60);
  });
  it('records exhaustion BEFORE refusing', () => {
    const j = new EngagementJournal(env);
    j.record({ envelopeId: 'eng-1', emissionId: 'e1', doseDelta: 60, emittedAt: 't' });
    const o = j.record({ envelopeId: 'eng-1', emissionId: 'e2', doseDelta: 50, emittedAt: 't' });
    expect(o.outcome).toBe('exhausted');
    const o2 = j.record({ envelopeId: 'eng-1', emissionId: 'e3', doseDelta: 10, emittedAt: 't' });
    expect(o2.outcome).toBe('refused');
    expect(j.view().some((e) => e.exhausted)).toBe(true);
  });
  it('refuses envelope mismatch', () => {
    const j = new EngagementJournal(env);
    const o = j.record({ envelopeId: 'other', emissionId: 'x', doseDelta: 1, emittedAt: 't' });
    expect(o.outcome).toBe('refused');
  });
});

describe('swarm-consensus', () => {
  it('returns agreed when 2f+1 votes match', () => {
    const f = defaultByzantineTolerance(7); // f=2
    expect(quorumThreshold(f)).toBe(5);
    const votes = Array.from({ length: 5 }, (_, i) => ({
      memberId: `m${i}`,
      proposalCanonical: '{"x":1}',
      voteHash: `h${i}`,
      signature: `s${i}`,
    }));
    const r = tally(votes, { memberCount: 7, byzantineTolerance: f }, fakeHash, 't1');
    expect(r.verdict.kind).toBe('agreed');
  });
  it('returns no-quorum below threshold', () => {
    const f = defaultByzantineTolerance(7);
    const votes = [
      { memberId: 'm1', proposalCanonical: 'A', voteHash: 'h', signature: 's' },
      { memberId: 'm2', proposalCanonical: 'A', voteHash: 'h', signature: 's' },
      { memberId: 'm3', proposalCanonical: 'B', voteHash: 'h', signature: 's' },
    ];
    const r = tally(votes, { memberCount: 7, byzantineTolerance: f }, fakeHash, 't1');
    expect(r.verdict.kind).toBe('no-quorum');
  });
  it('is deterministic regardless of vote input order', () => {
    const f = 1;
    const votes = [
      { memberId: 'm2', proposalCanonical: 'A', voteHash: 'h', signature: 's' },
      { memberId: 'm1', proposalCanonical: 'A', voteHash: 'h', signature: 's' },
      { memberId: 'm3', proposalCanonical: 'A', voteHash: 'h', signature: 's' },
    ];
    const r1 = tally(votes, { memberCount: 4, byzantineTolerance: f }, fakeHash, 't1');
    const r2 = tally([...votes].reverse(), { memberCount: 4, byzantineTolerance: f }, fakeHash, 't1');
    expect(r1.votesHash).toBe(r2.votesHash);
  });
});

describe('redundancy-envelope', () => {
  const env = {
    subsystemRef: 'flight-ctrl',
    channels: 3,
    ladder: [
      { minHealthy: 3, mode: 'full' },
      { minHealthy: 2, mode: 'reduced' },
    ],
    refusalAt: 2,
  };
  it('returns full mode when all channels healthy', () => {
    expect(evaluateRedundancy(env, 3).mode).toBe('full');
  });
  it('returns reduced mode at min healthy threshold', () => {
    expect(evaluateRedundancy(env, 2).mode).toBe('reduced');
  });
  it('refuses below refusalAt', () => {
    const r = evaluateRedundancy(env, 1);
    expect(r.refused).toBe(true);
  });
  it('detects mode transitions', () => {
    const a = evaluateRedundancy(env, 3);
    const b = evaluateRedundancy(env, 2);
    expect(isModeTransition(a, b)).toBe(true);
    expect(isModeTransition(a, a)).toBe(false);
  });
});

describe('nav-state-fusion', () => {
  const identity15 = (): readonly (readonly number[])[] =>
    Array.from({ length: 15 }, (_, i) =>
      Array.from({ length: 15 }, (_, j) => (i === j ? 1 : 0)),
    );

  it('validates a well-formed identity covariance', () => {
    expect(() => validateCovariance(identity15())).not.toThrow();
  });

  it('rejects non-symmetric covariance', () => {
    const c = identity15().map((r) => [...r]);
    c[0]![1] = 0.5;
    expect(() => validateCovariance(c)).toThrow(/symmetric/);
  });

  it('does not move state when sensor is unavailable', () => {
    const prior = {
      stateRef: 's0',
      state: {
        position: [0, 0, 0] as const,
        velocity: [0, 0, 0] as const,
        attitude: [0, 0, 0] as const,
        gyroBias: [0, 0, 0] as const,
        accelBias: [0, 0, 0] as const,
      },
      covariance: identity15(),
      covarianceHash: hashCovariance(identity15(), fakeHash),
      asOf: '2026-05-27T00:00:00Z',
    };
    const next = fuseSensor(
      prior,
      { sensorRef: 'imu', available: false, confidence: 1 },
      () => {
        throw new Error('fuser should not be called');
      },
      fakeHash,
      's1',
      '2026-05-27T00:00:01Z',
    );
    expect(next.state).toBe(prior.state);
    expect(next.covarianceHash).toBe(prior.covarianceHash);
  });
});

describe('em-field-step', () => {
  it('energy decreases under damped descent with no external field', () => {
    let grid = { gridRef: 'g', values: [0.5, 1, -1, 1, -0.5], dx: 0.1 };
    const e0 = totalEnergy(computeEnergy(grid));
    let prior = e0;
    for (let i = 0; i < 50; i++) {
      const r = stepField(grid, 0.0005, i, prior, { damping: 0.3, exchangeWeight: 1, anisotropyWeight: 0.5 });
      grid = r.grid;
      prior = r.totalEnergy;
    }
    expect(prior).toBeLessThan(e0);
  });
  it('emits a deltaEnergy field per step', () => {
    const grid = { gridRef: 'g', values: [0, 1, 0], dx: 1 };
    const r = stepField(grid, 0.01, 0, 999, { damping: 0.1 });
    expect(Number.isFinite(r.deltaEnergy)).toBe(true);
    expect(r.totalEnergy - r.deltaEnergy).toBeCloseTo(999, 6);
  });
});

describe('sealed-capability', () => {
  const now = Date.parse('2026-05-27T00:00:00Z');
  const sealer: (s: string) => string = (s) => `mac(${s.length})`;
  const baseCap = {
    capabilityId: 'cap-1',
    permissions: ['actuator.command'],
    boundActorId: 'op-1',
    sealedAt: '2026-05-27T00:00:00Z',
    expiresAt: '2026-05-27T01:00:00Z',
  };
  it('seals and verifies a valid capability', () => {
    const cap = sealCapability(baseCap, sealer);
    const v = verifyCapability({
      cap,
      actorId: 'op-1',
      requiredPermission: 'actuator.command',
      revoked: new Set(),
      now,
      sealer,
    });
    expect(v.ok).toBe(true);
  });
  it('rejects expired', () => {
    const cap = sealCapability(baseCap, sealer);
    const v = verifyCapability({
      cap,
      actorId: 'op-1',
      requiredPermission: 'actuator.command',
      revoked: new Set(),
      now: Date.parse('2026-05-27T02:00:00Z'),
      sealer,
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('expired');
  });
  it('rejects revoked', () => {
    const cap = sealCapability(baseCap, sealer);
    const v = verifyCapability({
      cap,
      actorId: 'op-1',
      requiredPermission: 'actuator.command',
      revoked: new Set(['cap-1']),
      now,
      sealer,
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toBe('revoked');
  });
  it('rejects actor mismatch', () => {
    const cap = sealCapability(baseCap, sealer);
    const v = verifyCapability({
      cap,
      actorId: 'op-2',
      requiredPermission: 'actuator.command',
      revoked: new Set(),
      now,
      sealer,
    });
    expect(v.ok).toBe(false);
  });
  it('rejects missing permission', () => {
    const cap = sealCapability(baseCap, sealer);
    const v = verifyCapability({
      cap,
      actorId: 'op-1',
      requiredPermission: 'other.action',
      revoked: new Set(),
      now,
      sealer,
    });
    expect(v.ok).toBe(false);
  });
  it('rejects forged seal', () => {
    const cap = { ...sealCapability(baseCap, sealer), sealHex: 'forged' };
    const v = verifyCapability({
      cap,
      actorId: 'op-1',
      requiredPermission: 'actuator.command',
      revoked: new Set(),
      now,
      sealer,
    });
    expect(v.ok).toBe(false);
  });
});
