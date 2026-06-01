import { beforeEach, describe, expect, it } from 'vitest';
import { PolicyEngine } from './engine.js';
import { RedactionRegistry } from './redaction.js';
import { RetentionRegistry } from './retention.js';
import { TenantBoundaryEnforcer } from './tenant.js';
import { type PolicyContext, type PolicyRule, PolicyRuleSchema } from './types.js';

function makeContext(overrides: Partial<PolicyContext> = {}): PolicyContext {
  return {
    requestId: 'req-001',
    tenantId: 'tenant-alpha',
    profileId: 'maritime-v1',
    hasProvenance: true,
    ...overrides,
  };
}

describe('PolicyRuleSchema', () => {
  it('parses a valid allow rule', () => {
    const result = PolicyRuleSchema.safeParse({
      ruleId: 'allow-all',
      action: 'allow',
    });
    expect(result.success).toBe(true);
  });

  it('parses a deny rule with description', () => {
    const result = PolicyRuleSchema.safeParse({
      ruleId: 'deny-external',
      action: 'deny',
      description: 'External tenants are not permitted',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown action', () => {
    const result = PolicyRuleSchema.safeParse({
      ruleId: 'bad-rule',
      action: 'block',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing ruleId', () => {
    const result = PolicyRuleSchema.safeParse({ action: 'allow' });
    expect(result.success).toBe(false);
  });
});

describe('PolicyEngine — allow/deny precedence', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine();
  });

  it('allows when no rules are registered', () => {
    const decision = engine.evaluate(makeContext());
    expect(decision.allow).toBe(true);
    expect(decision.reasons).toContain('No rules matched; default-allow');
  });

  it('denies when a matching deny rule is present', () => {
    const rule: PolicyRule = PolicyRuleSchema.parse({
      ruleId: 'deny-tenant-beta',
      action: 'deny',
      description: 'Tenant beta not permitted',
      tenantIds: ['tenant-beta'],
    });
    engine.addRule(rule);

    const denied = engine.evaluate(makeContext({ tenantId: 'tenant-beta' }));
    expect(denied.allow).toBe(false);
    expect(denied.reasons.some((r) => r.includes('deny-tenant-beta'))).toBe(true);
    expect(denied.appliedRuleIds).toContain('deny-tenant-beta');
  });

  it('allows when deny rule does not match the tenant', () => {
    const rule: PolicyRule = PolicyRuleSchema.parse({
      ruleId: 'deny-tenant-beta',
      action: 'deny',
      tenantIds: ['tenant-beta'],
    });
    engine.addRule(rule);

    const allowed = engine.evaluate(makeContext({ tenantId: 'tenant-alpha' }));
    expect(allowed.allow).toBe(true);
  });

  it('applies redaction rule and populates redactions list', () => {
    const rule: PolicyRule = PolicyRuleSchema.parse({
      ruleId: 'redact-pii',
      action: 'redact',
      redactFields: ['email', 'phone'],
    });
    engine.addRule(rule);

    const decision = engine.evaluate(makeContext());
    expect(decision.allow).toBe(true);
    expect(decision.redactions).toContain('email');
    expect(decision.redactions).toContain('phone');
  });

  it('a deny rule takes precedence over a redact rule for the same context', () => {
    engine.addRule(
      PolicyRuleSchema.parse({
        ruleId: 'deny-all',
        action: 'deny',
        priority: 10,
      }),
    );
    engine.addRule(
      PolicyRuleSchema.parse({
        ruleId: 'redact-pii',
        action: 'redact',
        redactFields: ['email'],
        priority: 5,
      }),
    );

    const decision = engine.evaluate(makeContext());
    expect(decision.allow).toBe(false);
    expect(decision.appliedRuleIds).toContain('deny-all');
  });

  it('requireProvenance=true denies when context has no provenance', () => {
    engine.addRule(
      PolicyRuleSchema.parse({
        ruleId: 'require-prov',
        action: 'allow',
        requireProvenance: true,
      }),
    );

    const denied = engine.evaluate(makeContext({ hasProvenance: false }));
    expect(denied.allow).toBe(false);
    expect(denied.reasons.some((r) => r.includes('provenance'))).toBe(true);
  });

  it('requireProvenance=true allows when context has provenance', () => {
    engine.addRule(
      PolicyRuleSchema.parse({
        ruleId: 'require-prov',
        action: 'allow',
        requireProvenance: true,
      }),
    );

    const allowed = engine.evaluate(makeContext({ hasProvenance: true }));
    expect(allowed.allow).toBe(true);
  });

  it('rules scoped to a profile do not apply when a different profile is used', () => {
    engine.addRule(
      PolicyRuleSchema.parse({
        ruleId: 'deny-cyber-profile',
        action: 'deny',
        allowedProfiles: ['cyber-v1'],
      }),
    );

    const allowed = engine.evaluate(makeContext({ profileId: 'maritime-v1' }));
    expect(allowed.allow).toBe(true);
  });

  it('rules scoped to a profile apply when that profile is used', () => {
    engine.addRule(
      PolicyRuleSchema.parse({
        ruleId: 'deny-cyber-profile',
        action: 'deny',
        allowedProfiles: ['cyber-v1'],
      }),
    );

    const denied = engine.evaluate(makeContext({ profileId: 'cyber-v1' }));
    expect(denied.allow).toBe(false);
  });

  it('removeRule removes a registered rule', () => {
    engine.addRule(
      PolicyRuleSchema.parse({
        ruleId: 'deny-all',
        action: 'deny',
      }),
    );
    const removed = engine.removeRule('deny-all');
    expect(removed).toBe(true);
    const decision = engine.evaluate(makeContext());
    expect(decision.allow).toBe(true);
  });

  it('removeRule returns false for unknown ruleId', () => {
    expect(engine.removeRule('not-a-rule')).toBe(false);
  });

  it('violations fail loudly — no silent fallback to allow on error', () => {
    engine.addRule(
      PolicyRuleSchema.parse({
        ruleId: 'deny-unregistered',
        action: 'deny',
        tenantIds: ['restricted-tenant'],
      }),
    );

    const decision = engine.evaluate(makeContext({ tenantId: 'restricted-tenant' }));
    expect(decision.allow).toBe(false);
    expect(decision.reasons.length).toBeGreaterThan(0);
  });
});

describe('TenantBoundaryEnforcer', () => {
  it('allows registered tenants', () => {
    const enforcer = new TenantBoundaryEnforcer({
      registeredTenants: new Set(['tenant-alpha', 'tenant-beta']),
    });
    const decision = enforcer.enforce(makeContext({ tenantId: 'tenant-alpha' }));
    expect(decision).toBeNull();
  });

  it('denies unregistered tenants with a structured decision', () => {
    const enforcer = new TenantBoundaryEnforcer({
      registeredTenants: new Set(['tenant-alpha']),
    });
    const decision = enforcer.enforce(makeContext({ tenantId: 'unknown-tenant' }));
    expect(decision).not.toBeNull();
    expect(decision?.allow).toBe(false);
    expect(decision?.reasons.length).toBeGreaterThan(0);
    expect(decision?.appliedRuleIds).toContain('tenant-boundary-enforcer');
  });

  it('registers a new tenant at runtime', () => {
    const enforcer = new TenantBoundaryEnforcer({ registeredTenants: new Set() });
    expect(enforcer.isRegistered('new-tenant')).toBe(false);
    enforcer.register('new-tenant');
    expect(enforcer.isRegistered('new-tenant')).toBe(true);
    expect(enforcer.enforce(makeContext({ tenantId: 'new-tenant' }))).toBeNull();
  });
});

describe('RetentionRegistry', () => {
  it('returns default retention of 90 days for unknown tenant', () => {
    const registry = new RetentionRegistry();
    expect(registry.resolveRetentionDays('unknown-tenant')).toBe(90);
  });

  it('returns the configured tenant-level default', () => {
    const registry = new RetentionRegistry();
    registry.register({
      tenantId: 't-short',
      defaultRetentionDays: 30,
      profileOverrides: {},
      deletionRequired: false,
    });
    expect(registry.resolveRetentionDays('t-short')).toBe(30);
  });

  it('returns profile-level override when profileId matches', () => {
    const registry = new RetentionRegistry();
    registry.register({
      tenantId: 't-a',
      defaultRetentionDays: 90,
      profileOverrides: { 'legal-v1': 365 },
      deletionRequired: false,
    });
    expect(registry.resolveRetentionDays('t-a', 'legal-v1')).toBe(365);
    expect(registry.resolveRetentionDays('t-a', 'maritime-v1')).toBe(90);
    expect(registry.resolveRetentionDays('t-a')).toBe(90);
  });

  it('reports deletionRequired correctly', () => {
    const registry = new RetentionRegistry();
    registry.register({
      tenantId: 't-gdpr',
      defaultRetentionDays: 30,
      profileOverrides: {},
      deletionRequired: true,
    });
    expect(registry.requiresDeletion('t-gdpr')).toBe(true);
    expect(registry.requiresDeletion('t-other')).toBe(false);
  });
});

describe('RedactionRegistry', () => {
  it('replaces field values with [REDACTED] by default', () => {
    const registry = new RedactionRegistry();
    const result = registry.applyRedactions(
      { email: 'user@example.com', name: 'Alice' },
      ['email'],
      't-a',
    );
    expect(result.email).toBe('[REDACTED]');
    expect(result.name).toBe('Alice');
  });

  it('applies a custom hook when registered', () => {
    const registry = new RedactionRegistry();
    registry.registerHook('phone', (value) => {
      const s = String(value);
      return `${s.slice(0, -4)}****`;
    });
    const result = registry.applyRedactions({ phone: '555-123-4567' }, ['phone'], 't-a');
    expect(result.phone).toBe('555-123-****');
  });

  it('skips fields not present in the record', () => {
    const registry = new RedactionRegistry();
    const result = registry.applyRedactions({ name: 'Bob' }, ['missing-field'], 't-a');
    expect(result).toEqual({ name: 'Bob' });
  });

  it('returns unchanged record when redactions list is empty', () => {
    const registry = new RedactionRegistry();
    const record = { name: 'Charlie', score: 0.9 };
    const result = registry.applyRedactions(record, [], 't-a');
    expect(result).toEqual(record);
  });

  it('does not mutate the original record', () => {
    const registry = new RedactionRegistry();
    const original = { email: 'test@example.com' };
    registry.applyRedactions(original, ['email'], 't-a');
    expect(original.email).toBe('test@example.com');
  });

  it('hasHook returns true only for registered fields', () => {
    const registry = new RedactionRegistry();
    registry.registerHook('ssn', (v) => v);
    expect(registry.hasHook('ssn')).toBe(true);
    expect(registry.hasHook('email')).toBe(false);
  });
});
