import { beforeEach, describe, expect, it } from 'vitest';
import {
  ConfidenceProfileSchema,
  CreateSelfModelSchema,
  RunOutcomeSchema,
  SelfModelStateSchema,
} from './schema.js';
import { SelfModelStore } from './store.js';
import type { EscalationThreshold, IdentityProfile, RunOutcome } from './types.js';
import { requestHelpIfBelowThreshold, updateAfterRun } from './update.js';

function makeIdentity(overrides: Partial<IdentityProfile> = {}): IdentityProfile {
  return {
    runtimeId: 'test-runtime-001',
    name: 'Test Agent',
    version: '1.0.0',
    environment: 'development',
    launchedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<RunOutcome> = {}): RunOutcome {
  return {
    runId: 'run-001',
    agentId: 'agent-001',
    status: 'success',
    ...overrides,
  };
}

const defaultThresholds: EscalationThreshold[] = [
  {
    metric: 'confidence',
    threshold: 0.5,
    action: 'request-help',
    notifyRecipients: ['human-supervisor'],
  },
  {
    metric: 'consecutiveFailures',
    threshold: 3,
    action: 'request-help',
    notifyRecipients: ['on-call'],
  },
];

describe('SelfModelStore — creation', () => {
  it('creates a new model with defaults', () => {
    const store = new SelfModelStore();
    const identity = makeIdentity();
    const model = store.create({ agentId: 'agent-001', identityProfile: identity });
    expect(model.runtimeId).toBe('test-runtime-001');
    expect(model.version).toBe(1);
    expect(model.confidenceProfile.overall).toBe(1.0);
    expect(model.driftScore).toBe(0);
    expect(model.consecutiveFailures).toBe(0);
    expect(model.recentFailures).toHaveLength(0);
    expect(model.recentWins).toHaveLength(0);
  });

  it('allows custom capabilities and tool access', () => {
    const store = new SelfModelStore();
    const identity = makeIdentity();
    const model = store.create({
      agentId: 'agent-002',
      identityProfile: identity,
      capabilities: [{ name: 'text-analysis', status: 'active' }],
      toolAccess: [
        { toolId: 'tool-1', name: 'Search', permitted: true, riskTier: 'advisory-only' },
      ],
    });
    expect(model.capabilities).toHaveLength(1);
    expect(model.toolAccess).toHaveLength(1);
  });

  it('returns undefined for unknown agent', () => {
    const store = new SelfModelStore();
    expect(store.get('unknown-agent')).toBeUndefined();
  });
});

describe('SelfModelStore — history / snapshots', () => {
  it('starts with empty history', () => {
    const store = new SelfModelStore();
    store.create({ agentId: 'agent-001', identityProfile: makeIdentity() });
    expect(store.getHistory('agent-001')).toHaveLength(0);
  });

  it('records a snapshot on each update', () => {
    const store = new SelfModelStore();
    store.create({ agentId: 'agent-001', identityProfile: makeIdentity() });
    store.update('agent-001', { driftScore: 0.1 }, 'test update 1');
    store.update('agent-001', { driftScore: 0.2 }, 'test update 2');
    expect(store.getHistory('agent-001')).toHaveLength(2);
  });

  it('increments version on each update', () => {
    const store = new SelfModelStore();
    store.create({ agentId: 'agent-001', identityProfile: makeIdentity() });
    const v2 = store.update('agent-001', { driftScore: 0.1 });
    const v3 = store.update('agent-001', { driftScore: 0.2 });
    expect(v2.version).toBe(2);
    expect(v3.version).toBe(3);
  });

  it('throws when updating unknown agent', () => {
    const store = new SelfModelStore();
    expect(() => store.update('no-such-agent', {})).toThrow(/No self-model found/);
  });
});

describe('updateAfterRun — confidence adjustments', () => {
  let store: SelfModelStore;

  beforeEach(() => {
    store = new SelfModelStore();
    store.create({
      agentId: 'agent-001',
      identityProfile: makeIdentity(),
      escalationThresholds: defaultThresholds,
    });
  });

  it('boosts confidence on success', () => {
    const result = updateAfterRun('agent-001', makeOutcome({ status: 'success' }), store);
    expect(result.confidenceAfter).toBeGreaterThan(1.0 - 0.001);
    expect(result.updated).toBe(true);
    expect(result.snapshotCreated).toBe(true);
  });

  it('reduces confidence on failure', () => {
    const result = updateAfterRun('agent-001', makeOutcome({ status: 'failure' }), store);
    expect(result.confidenceAfter).toBeLessThan(1.0);
    expect(result.driftScore).toBeGreaterThan(0);
    expect(result.consecutiveFailures).toBe(1);
  });

  it('resets consecutive failures on success', () => {
    updateAfterRun('agent-001', makeOutcome({ runId: 'run-1', status: 'failure' }), store);
    updateAfterRun('agent-001', makeOutcome({ runId: 'run-2', status: 'failure' }), store);
    const result = updateAfterRun(
      'agent-001',
      makeOutcome({ runId: 'run-3', status: 'success' }),
      store,
    );
    expect(result.consecutiveFailures).toBe(0);
  });

  it('respects custom confidenceDelta', () => {
    const result = updateAfterRun(
      'agent-001',
      makeOutcome({ status: 'success', confidenceDelta: -0.3 }),
      store,
    );
    expect(result.confidenceAfter).toBeCloseTo(0.7, 2);
  });

  it('clamps confidence to [0, 1]', () => {
    for (let i = 0; i < 30; i++) {
      updateAfterRun(
        'agent-001',
        makeOutcome({ runId: `run-${i}`, status: 'failure', confidenceDelta: -0.5 }),
        store,
      );
    }
    const state = store.get('agent-001')!;
    expect(state.confidenceProfile.overall).toBeGreaterThanOrEqual(0);
    expect(state.confidenceProfile.overall).toBeLessThanOrEqual(1);
  });

  it('records failure in recentFailures', () => {
    updateAfterRun('agent-001', makeOutcome({ status: 'failure' }), store);
    const state = store.get('agent-001')!;
    expect(state.recentFailures).toHaveLength(1);
    expect(state.recentFailures[0]?.outcome).toBe('failure');
  });

  it('records win in recentWins', () => {
    updateAfterRun('agent-001', makeOutcome({ status: 'success' }), store);
    const state = store.get('agent-001')!;
    expect(state.recentWins).toHaveLength(1);
  });

  it('increments version after run', () => {
    const result = updateAfterRun('agent-001', makeOutcome(), store);
    expect(result.newVersion).toBe(2);
  });

  it('throws for unknown agent', () => {
    expect(() => updateAfterRun('no-such-agent', makeOutcome(), store)).toThrow(
      /No self-model found/,
    );
  });
});

describe('updateAfterRun — drift tracking', () => {
  let store: SelfModelStore;

  beforeEach(() => {
    store = new SelfModelStore();
    store.create({
      agentId: 'agent-001',
      identityProfile: makeIdentity(),
      escalationThresholds: [],
    });
  });

  it('increases drift on failure', () => {
    updateAfterRun('agent-001', makeOutcome({ status: 'failure' }), store);
    const state = store.get('agent-001')!;
    expect(state.driftScore).toBeGreaterThan(0);
  });

  it('reduces drift on success', () => {
    store.update('agent-001', { driftScore: 0.5 });
    updateAfterRun('agent-001', makeOutcome({ status: 'success' }), store);
    const state = store.get('agent-001')!;
    expect(state.driftScore).toBeLessThan(0.5);
  });

  it('caps drift at 1.0', () => {
    for (let i = 0; i < 20; i++) {
      updateAfterRun('agent-001', makeOutcome({ runId: `run-${i}`, status: 'failure' }), store);
    }
    const state = store.get('agent-001')!;
    expect(state.driftScore).toBeLessThanOrEqual(1.0);
  });

  it('never goes below 0', () => {
    for (let i = 0; i < 20; i++) {
      updateAfterRun('agent-001', makeOutcome({ runId: `run-${i}`, status: 'success' }), store);
    }
    const state = store.get('agent-001')!;
    expect(state.driftScore).toBeGreaterThanOrEqual(0);
  });

  it('increments failurePatternCount on each failure', () => {
    updateAfterRun('agent-001', makeOutcome({ runId: 'r1', status: 'failure' }), store);
    updateAfterRun('agent-001', makeOutcome({ runId: 'r2', status: 'failure' }), store);
    const state = store.get('agent-001')!;
    expect(state.failurePatternCount).toBe(2);
  });
});

describe('requestHelpIfBelowThreshold — escalation', () => {
  it('triggers help when confidence falls below threshold', () => {
    const store = new SelfModelStore();
    store.create({
      agentId: 'agent-001',
      identityProfile: makeIdentity(),
      escalationThresholds: [
        { metric: 'confidence', threshold: 0.9, action: 'request-help', notifyRecipients: ['ops'] },
      ],
    });
    store.update('agent-001', {
      confidenceProfile: {
        overall: 0.85,
        byDomain: {},
        byCapability: {},
        trend: 'declining',
        lastAdjustedAt: new Date().toISOString(),
      },
    });
    const help = requestHelpIfBelowThreshold('agent-001', 'confidence', store);
    expect(help).not.toBeNull();
    expect(help?.metric).toBe('confidence');
    expect(help?.action).toBe('request-help');
    expect(help?.notifyRecipients).toContain('ops');
  });

  it('returns null when confidence is above threshold', () => {
    const store = new SelfModelStore();
    store.create({
      agentId: 'agent-001',
      identityProfile: makeIdentity(),
      escalationThresholds: [
        { metric: 'confidence', threshold: 0.5, action: 'request-help', notifyRecipients: [] },
      ],
    });
    const help = requestHelpIfBelowThreshold('agent-001', 'confidence', store);
    expect(help).toBeNull();
  });

  it('returns null for unknown agent', () => {
    const store = new SelfModelStore();
    const help = requestHelpIfBelowThreshold('no-such-agent', 'confidence', store);
    expect(help).toBeNull();
  });

  it('triggers help when consecutiveFailures exceeds threshold', () => {
    const store = new SelfModelStore();
    store.create({
      agentId: 'agent-001',
      identityProfile: makeIdentity(),
      escalationThresholds: [
        {
          metric: 'consecutiveFailures',
          threshold: 3,
          action: 'request-help',
          notifyRecipients: [],
        },
      ],
    });
    store.update('agent-001', { consecutiveFailures: 5 });
    const help = requestHelpIfBelowThreshold('agent-001', 'consecutiveFailures', store);
    expect(help).not.toBeNull();
  });
});

describe('updateAfterRun — threshold-triggered help requests', () => {
  it('requests help after enough failures drop confidence below threshold', () => {
    const store = new SelfModelStore();
    store.create({
      agentId: 'agent-001',
      identityProfile: makeIdentity(),
      escalationThresholds: [
        {
          metric: 'confidence',
          threshold: 0.95,
          action: 'request-help',
          notifyRecipients: ['supervisor'],
        },
      ],
    });
    const result = updateAfterRun(
      'agent-001',
      makeOutcome({ status: 'failure', confidenceDelta: -0.1 }),
      store,
    );
    expect(result.helpRequested).not.toBeNull();
    expect(result.helpRequested?.metric).toBe('confidence');
  });

  it('does not request help if thresholds are not breached', () => {
    const store = new SelfModelStore();
    store.create({
      agentId: 'agent-001',
      identityProfile: makeIdentity(),
      escalationThresholds: [
        { metric: 'confidence', threshold: 0.1, action: 'request-help', notifyRecipients: [] },
      ],
    });
    const result = updateAfterRun('agent-001', makeOutcome({ status: 'success' }), store);
    expect(result.helpRequested).toBeNull();
  });
});

describe('Zod schema validation', () => {
  it('parses a minimal RunOutcome', () => {
    const outcome = RunOutcomeSchema.parse({ runId: 'r1', agentId: 'a1', status: 'success' });
    expect(outcome.runId).toBe('r1');
  });

  it('rejects invalid status', () => {
    expect(() =>
      RunOutcomeSchema.parse({ runId: 'r1', agentId: 'a1', status: 'unknown-status' }),
    ).toThrow();
  });

  it('parses CreateSelfModelSchema with defaults', () => {
    const parsed = CreateSelfModelSchema.parse({
      agentId: 'a1',
      identityProfile: {
        runtimeId: 'rt-1',
        name: 'My Agent',
        version: '1.0.0',
        launchedAt: new Date().toISOString(),
      },
    });
    expect(parsed.capabilities).toEqual([]);
    expect(parsed.riskTier).toBe('internal-workflow');
    expect(parsed.currentEnvironment).toBe('production');
  });

  it('validates ConfidenceProfile trend enum', () => {
    expect(() =>
      ConfidenceProfileSchema.parse({
        overall: 0.8,
        trend: 'sideways',
        lastAdjustedAt: new Date().toISOString(),
      }),
    ).toThrow();
  });
});
