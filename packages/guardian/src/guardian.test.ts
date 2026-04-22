import { beforeEach, describe, expect, it } from 'vitest';
import {
  addDefaultAllowRule,
  defaultDecisionEngine,
  GuardianDecisionEngine,
} from './decision-engine.js';
import { type DecisionRequest, DecisionRequestSchema, GuardianRuleSchema } from './schema.js';
import {
  POLICY_TIER_DESCRIPTIONS,
  PolicyTierSchema,
  TIER_CONTROLS,
  TIER_NUMBER,
  TIER_RISK_LEVEL,
} from './tiers.js';

function makeRequest(overrides: Partial<DecisionRequest> = {}): DecisionRequest {
  return {
    requestId: 'req-001',
    action: 'write-record',
    context: {},
    ...overrides,
  };
}

describe('PolicyTier — 6 autonomy tiers (T0–T5)', () => {
  it('has exactly 6 tiers', () => {
    expect(PolicyTierSchema.options).toHaveLength(6);
  });

  it('tiers are ordered advisory(T0) through sovereign(T5)', () => {
    const tiers = PolicyTierSchema.options;
    expect(tiers[0]).toBe('advisory');
    expect(tiers[1]).toBe('supervised');
    expect(tiers[2]).toBe('operator-approved');
    expect(tiers[3]).toBe('dual-approved');
    expect(tiers[4]).toBe('regulated');
    expect(tiers[5]).toBe('sovereign');
  });

  it('tier numbers match T0–T5 ordering', () => {
    expect(TIER_NUMBER.advisory).toBe(0);
    expect(TIER_NUMBER.supervised).toBe(1);
    expect(TIER_NUMBER['operator-approved']).toBe(2);
    expect(TIER_NUMBER['dual-approved']).toBe(3);
    expect(TIER_NUMBER.regulated).toBe(4);
    expect(TIER_NUMBER.sovereign).toBe(5);
  });

  it('sovereign has highest risk level', () => {
    expect(TIER_RISK_LEVEL.sovereign).toBe(6);
    expect(TIER_RISK_LEVEL.advisory).toBe(1);
  });

  it('all tiers have descriptions', () => {
    for (const tier of PolicyTierSchema.options) {
      expect(POLICY_TIER_DESCRIPTIONS[tier]).toBeDefined();
      expect(POLICY_TIER_DESCRIPTIONS[tier].length).toBeGreaterThan(10);
    }
  });
});

describe('Tier control sets', () => {
  it('advisory (T0) does not allow memory write or external comms', () => {
    const controls = TIER_CONTROLS.advisory;
    expect(controls.allowMemoryWrite).toBe(false);
    expect(controls.allowExternalComms).toBe(false);
    expect(controls.approvalGate).toBe('none');
    expect(controls.requiresRollback).toBe(false);
  });

  it('supervised (T1) allows memory write but no external comms', () => {
    const controls = TIER_CONTROLS.supervised;
    expect(controls.allowMemoryWrite).toBe(true);
    expect(controls.allowExternalComms).toBe(false);
    expect(controls.approvalGate).toBe('none');
  });

  it('operator-approved (T2) requires single approval gate', () => {
    const controls = TIER_CONTROLS['operator-approved'];
    expect(controls.approvalGate).toBe('single');
    expect(controls.allowExternalComms).toBe(false);
  });

  it('dual-approved (T3) requires dual approval and rollback', () => {
    const controls = TIER_CONTROLS['dual-approved'];
    expect(controls.approvalGate).toBe('dual');
    expect(controls.requiresRollback).toBe(true);
    expect(controls.allowExternalComms).toBe(false);
  });

  it('regulated (T4) has strictest controls: dual, no memory write, no external comms, long retention', () => {
    const controls = TIER_CONTROLS.regulated;
    expect(controls.approvalGate).toBe('dual');
    expect(controls.allowMemoryWrite).toBe(false);
    expect(controls.allowExternalComms).toBe(false);
    expect(controls.requiresRollback).toBe(true);
    expect(controls.retentionDays).toBeGreaterThan(365);
  });

  it('sovereign (T5) allows external comms and memory write but requires rollback', () => {
    const controls = TIER_CONTROLS.sovereign;
    expect(controls.allowExternalComms).toBe(true);
    expect(controls.allowMemoryWrite).toBe(true);
    expect(controls.requiresRollback).toBe(true);
    expect(controls.approvalGate).toBe('none');
  });
});

describe('GuardianDecisionEngine — decide()', () => {
  let engine: GuardianDecisionEngine;

  beforeEach(() => {
    engine = new GuardianDecisionEngine();
  });

  it('denies by default when no tier is set', () => {
    const result = engine.decide(makeRequest());
    expect(result.outcome).toBe('deny');
    expect(result.reason).toMatch(/deny-by-default/i);
  });

  it('denies by default when tier is set but no matching rule', () => {
    const result = engine.decide(makeRequest({ tier: 'supervised' }));
    expect(result.outcome).toBe('deny');
  });

  it('allows when a matching allow rule is added', () => {
    engine.addRule({
      id: 'allow-supervised',
      name: 'Allow supervised workflow',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 10,
      enabled: true,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: 'supervised' }));
    expect(result.outcome).toBe('allow');
    expect(result.matchedRuleId).toBe('allow-supervised');
  });

  it('respects priority order (lower priority number runs first)', () => {
    engine.addRule({
      id: 'deny-first',
      name: 'Deny (low priority number = first)',
      tier: 'advisory',
      conditions: [],
      action: 'deny',
      priority: 1,
      enabled: true,
      tags: [],
    });
    engine.addRule({
      id: 'allow-second',
      name: 'Allow (higher priority number = later)',
      tier: 'advisory',
      conditions: [],
      action: 'allow',
      priority: 2,
      enabled: true,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: 'advisory' }));
    expect(result.outcome).toBe('deny');
    expect(result.matchedRuleId).toBe('deny-first');
  });

  it('skips disabled rules', () => {
    engine.addRule({
      id: 'disabled-allow',
      name: 'Disabled allow',
      tier: 'advisory',
      conditions: [],
      action: 'allow',
      priority: 1,
      enabled: false,
      tags: [],
    });
    const result = engine.decide(makeRequest({ tier: 'advisory' }));
    expect(result.outcome).toBe('deny');
  });

  it('supports condition evaluation (eq)', () => {
    engine.addRule({
      id: 'allow-read',
      name: 'Allow read actions',
      tier: 'advisory',
      conditions: [{ field: 'action', operator: 'eq', value: 'read' }],
      action: 'allow',
      priority: 10,
      enabled: true,
      tags: [],
    });
    const allow = engine.decide(makeRequest({ tier: 'advisory', action: 'read' }));
    expect(allow.outcome).toBe('allow');
    const deny = engine.decide(makeRequest({ tier: 'advisory', action: 'write' }));
    expect(deny.outcome).toBe('deny');
  });
});

describe('GuardianDecisionEngine — evaluate() full autonomy governor', () => {
  let engine: GuardianDecisionEngine;

  beforeEach(() => {
    engine = new GuardianDecisionEngine();
  });

  it('blocks when no tier is set', () => {
    const result = engine.evaluate(makeRequest());
    expect(result.outcome).toBe('block');
    expect(result.controlViolations).toContain('missing-tier');
  });

  it('blocks with unknown tier', () => {
    const result = engine.evaluate(makeRequest({ tier: 'super-secret' as any }));
    expect(result.outcome).toBe('block');
    expect(result.controlViolations).toContain('unknown-tier');
  });

  it('T0 advisory: blocks memory write attempt', () => {
    engine.addRule({
      id: 'allow-advisory',
      name: 'Allow advisory',
      tier: 'advisory',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'advisory', memoryScope: 'session-1' }));
    expect(result.outcome).toBe('block');
    expect(result.controlViolations).toContain('memory-write-not-allowed');
  });

  it('T0 advisory: blocks external comms', () => {
    engine.addRule({
      id: 'allow-advisory',
      name: 'Allow advisory',
      tier: 'advisory',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'advisory', isExternalComms: true }));
    expect(result.outcome).toBe('block');
    expect(result.controlViolations).toContain('external-comms-blocked');
  });

  it('T1 supervised: allows with a matching allow rule', () => {
    engine.addRule({
      id: 'allow-supervised',
      name: 'Allow supervised',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised' }));
    expect(result.outcome).toBe('allow');
    expect(result.rollbackRequired).toBe(false);
    expect(result.redactApplied).toBe(true);
  });

  it('T2 operator-approved: returns require-approval even for allow rules', () => {
    engine.addRule({
      id: 'allow-op',
      name: 'Allow operator',
      tier: 'operator-approved',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(
      makeRequest({ tier: 'operator-approved', environment: 'staging' }),
    );
    expect(result.outcome).toBe('require-approval');
    expect(result.requiredApprovers).toContain('operator');
    expect(result.rollbackRequired).toBe(false);
  });

  it('T2 operator-approved: blocks disallowed environment', () => {
    engine.addRule({
      id: 'allow-op',
      name: 'Allow operator',
      tier: 'operator-approved',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(
      makeRequest({ tier: 'operator-approved', environment: 'development' }),
    );
    expect(result.outcome).toBe('block');
    expect(result.controlViolations.some((v) => v.includes('environment-not-allowed'))).toBe(true);
  });

  it('T3 dual-approved: always returns require-dual-approval', () => {
    engine.addRule({
      id: 'allow-dual',
      name: 'Allow dual',
      tier: 'dual-approved',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(
      makeRequest({ tier: 'dual-approved', environment: 'production' }),
    );
    expect(result.outcome).toBe('require-dual-approval');
    expect(result.requiredApprovers).toContain('operator');
    expect(result.requiredApprovers).toContain('executive');
    expect(result.rollbackRequired).toBe(true);
  });

  it('T4 regulated: always returns require-dual-approval', () => {
    engine.addRule({
      id: 'allow-regulated',
      name: 'Allow regulated',
      tier: 'regulated',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'regulated', environment: 'production' }));
    expect(result.outcome).toBe('require-dual-approval');
    expect(result.requiredApprovers).toContain('operator');
    expect(result.requiredApprovers).toContain('executive');
    expect(result.rollbackRequired).toBe(true);
    expect(result.redactApplied).toBe(true);
  });

  it('T5 sovereign: allows when rule matches and rollback is required', () => {
    engine.addRule({
      id: 'allow-sovereign',
      name: 'Allow sovereign',
      tier: 'sovereign',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'sovereign', environment: 'production' }));
    expect(result.outcome).toBe('allow');
    expect(result.rollbackRequired).toBe(true);
  });

  it('T5 sovereign: allows external comms', () => {
    engine.addRule({
      id: 'allow-sovereign',
      name: 'Allow sovereign',
      tier: 'sovereign',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(
      makeRequest({ tier: 'sovereign', environment: 'production', isExternalComms: true }),
    );
    expect(result.outcome).toBe('allow');
    expect(result.controlViolations).not.toContain('external-comms-blocked');
  });

  it('model allowlist enforcement: blocks disallowed model', () => {
    engine.addRule({
      id: 'allowlist-rule',
      name: 'Only allow approved models',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 10,
      enabled: true,
      tags: [],
      allowedModels: ['gpt-4o', 'claude-3-5-sonnet'],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised', model: 'unknown-model' }));
    expect(result.outcome).toBe('block');
    expect(result.controlViolations.some((v) => v.includes('model-not-allowlisted'))).toBe(true);
  });

  it('model allowlist enforcement: allows listed model', () => {
    engine.addRule({
      id: 'allowlist-rule',
      name: 'Only allow approved models',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 10,
      enabled: true,
      tags: [],
      allowedModels: ['gpt-4o', 'claude-3-5-sonnet'],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised', model: 'gpt-4o' }));
    expect(result.outcome).toBe('allow');
  });

  it('tool allowlist enforcement: blocks disallowed tool', () => {
    engine.addRule({
      id: 'tool-allowlist-rule',
      name: 'Only allow approved tools',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 10,
      enabled: true,
      tags: [],
      allowedTools: ['search-tool', 'read-tool'],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised', toolId: 'delete-tool' }));
    expect(result.outcome).toBe('block');
    expect(result.controlViolations.some((v) => v.includes('tool-not-allowlisted'))).toBe(true);
  });

  it('tool allowlist enforcement: allows listed tool', () => {
    engine.addRule({
      id: 'tool-allowlist-rule',
      name: 'Only allow approved tools',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 10,
      enabled: true,
      tags: [],
      allowedTools: ['search-tool', 'read-tool'],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised', toolId: 'search-tool' }));
    expect(result.outcome).toBe('allow');
  });

  it('action limit enforcement: blocks when limit exceeded', () => {
    engine.addRule({
      id: 'allow-supervised',
      name: 'Allow supervised',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised', actionCount: 51 }));
    expect(result.outcome).toBe('block');
    expect(result.controlViolations.some((v) => v.includes('action-limit-exceeded'))).toBe(true);
  });

  it('action limit: allows when under limit', () => {
    engine.addRule({
      id: 'allow-supervised',
      name: 'Allow supervised',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised', actionCount: 10 }));
    expect(result.outcome).toBe('allow');
  });

  it('require-dual-approval rule overrides allow rule', () => {
    engine.addRule({
      id: 'dual-rule',
      name: 'Force dual approval for financial actions',
      tier: 'supervised',
      conditions: [{ field: 'domain', operator: 'eq', value: 'finance' }],
      action: 'require-dual-approval',
      priority: 1,
      enabled: true,
      tags: ['finance'],
    });
    engine.addRule({
      id: 'allow-supervised',
      name: 'Allow supervised',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised', domain: 'finance' }));
    expect(result.outcome).toBe('require-dual-approval');
    expect(result.requiredApprovers).toContain('operator');
    expect(result.requiredApprovers).toContain('executive');
  });

  it('rollback required flag propagates for T3+ tiers', () => {
    engine.addRule({
      id: 'allow-sovereign',
      name: 'Allow sovereign',
      tier: 'sovereign',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'sovereign', environment: 'production' }));
    expect(result.rollbackRequired).toBe(true);
  });

  it('block rule results in block outcome', () => {
    engine.addRule({
      id: 'block-rule',
      name: 'Block dangerous writes',
      tier: 'supervised',
      conditions: [{ field: 'action', operator: 'eq', value: 'delete-all' }],
      action: 'block',
      priority: 1,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised', action: 'delete-all' }));
    expect(result.outcome).toBe('block');
  });

  it('context-driven approval: high-value transaction triggers require-approval', () => {
    engine.addRule({
      id: 'high-value-approval',
      name: 'High value transfer approval',
      tier: 'supervised',
      conditions: [{ field: 'amount', operator: 'gt', value: 100000 }],
      action: 'require-approval',
      priority: 1,
      enabled: true,
      tags: ['finance'],
    });
    engine.addRule({
      id: 'low-value-allow',
      name: 'Low value allow',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const high = engine.evaluate(makeRequest({ tier: 'supervised', context: { amount: 500000 } }));
    expect(high.outcome).toBe('require-approval');

    const low = engine.evaluate(makeRequest({ tier: 'supervised', context: { amount: 1000 } }));
    expect(low.outcome).toBe('allow');
  });

  it('evaluate result carries decidedAt timestamp', () => {
    engine.addRule({
      id: 'allow-rule',
      name: 'Allow',
      tier: 'supervised',
      conditions: [],
      action: 'allow',
      priority: 100,
      enabled: true,
      tags: [],
    });
    const result = engine.evaluate(makeRequest({ tier: 'supervised' }));
    expect(new Date(result.decidedAt).getTime()).toBeGreaterThan(0);
  });
});

describe('GuardianRuleSchema validation', () => {
  it('validates a minimal valid rule', () => {
    const rule = {
      id: 'r1',
      name: 'Test rule',
      tier: 'supervised',
      action: 'allow',
    };
    expect(() => GuardianRuleSchema.parse(rule)).not.toThrow();
  });

  it('rejects an unknown action', () => {
    const rule = { id: 'r1', name: 'Test', tier: 'supervised', action: 'unknown' };
    expect(() => GuardianRuleSchema.parse(rule)).toThrow();
  });

  it('rejects an unknown tier', () => {
    const rule = { id: 'r1', name: 'Test', tier: 'human-approval-mandatory', action: 'allow' };
    expect(() => GuardianRuleSchema.parse(rule)).toThrow();
  });

  it('accepts require-dual-approval as a valid action', () => {
    const rule = { id: 'r1', name: 'Test', tier: 'advisory', action: 'require-dual-approval' };
    expect(() => GuardianRuleSchema.parse(rule)).not.toThrow();
  });

  it('accepts block as a valid action', () => {
    const rule = { id: 'r1', name: 'Test', tier: 'advisory', action: 'block' };
    expect(() => GuardianRuleSchema.parse(rule)).not.toThrow();
  });

  it('defaults conditions to empty array', () => {
    const rule = GuardianRuleSchema.parse({
      id: 'r1',
      name: 'Test',
      tier: 'advisory',
      action: 'allow',
    });
    expect(rule.conditions).toEqual([]);
  });

  it('accepts allowedModels and allowedTools per-rule allowlists', () => {
    const rule = GuardianRuleSchema.parse({
      id: 'r1',
      name: 'Test',
      tier: 'supervised',
      action: 'allow',
      allowedModels: ['gpt-4o'],
      allowedTools: ['search-tool'],
    });
    expect(rule.allowedModels).toEqual(['gpt-4o']);
    expect(rule.allowedTools).toEqual(['search-tool']);
  });
});

describe('DecisionRequestSchema validation', () => {
  it('validates a minimal decision request', () => {
    const req = { requestId: 'r1', action: 'read-data' };
    expect(() => DecisionRequestSchema.parse(req)).not.toThrow();
  });

  it('fails when requestId is missing', () => {
    expect(() => DecisionRequestSchema.parse({ action: 'read-data' })).toThrow();
  });

  it('defaults context to empty object', () => {
    const req = DecisionRequestSchema.parse({ requestId: 'r1', action: 'x' });
    expect(req.context).toEqual({});
  });

  it('accepts all new fields: model, toolId, actionCount, environment, memoryScope, isExternalComms', () => {
    const req = DecisionRequestSchema.parse({
      requestId: 'r1',
      action: 'read-data',
      model: 'gpt-4o',
      toolId: 'search-tool',
      actionCount: 5,
      environment: 'production',
      memoryScope: 'session-1',
      isExternalComms: false,
    });
    expect(req.model).toBe('gpt-4o');
    expect(req.toolId).toBe('search-tool');
    expect(req.actionCount).toBe(5);
    expect(req.environment).toBe('production');
    expect(req.memoryScope).toBe('session-1');
    expect(req.isExternalComms).toBe(false);
  });
});

describe('addDefaultAllowRule helper', () => {
  it('adds a default allow rule to the default engine', () => {
    addDefaultAllowRule('advisory');
    const result = defaultDecisionEngine.decide(makeRequest({ tier: 'advisory' }));
    expect(result.outcome).toBe('allow');
  });
});
