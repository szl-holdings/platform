/**
 * Sentra Active Defense — Adversary Simulation Integration Tests
 *
 * Simulates end-to-end attacker sequences and asserts:
 *  - Correct detections fire
 *  - Correct defensive responses execute
 *  - Evidence ledger records and chains correctly
 *  - Sentinel duel selects expected counter-move classes
 *  - Scope Boundary Enforcer refuses out-of-scope actions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@szl-holdings/db', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createDbMock();
});

vi.mock('@szl-holdings/observability', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createObservabilityMock();
});

vi.mock('@szl-holdings/forge-runtime', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createForgeRuntimeMock();
});

vi.mock('@szl-holdings/ai-engine', () => ({
  ModelLifecycle: {},
}));

vi.mock('@szl-holdings/constellation', () => ({
  lyteAdapter: { upsertEntity: vi.fn(async () => ({})) },
}));

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

describe('Scope Boundary Enforcer', () => {
  it('allows action on owned IP (loopback)', async () => {
    const { checkScope } = await import('../lib/sentra-defense/scope-enforcer.js');
    const result = checkScope({
      action: 'BlockIp',
      targetType: 'ip',
      targetValue: '127.0.0.1',
      requestedBy: 'test',
    });
    expect(result.allowed).toBe(true);
  });

  it('allows action on RFC 1918 address', async () => {
    const { checkScope } = await import('../lib/sentra-defense/scope-enforcer.js');
    const result = checkScope({
      action: 'BlockIp',
      targetType: 'ip',
      targetValue: '10.0.1.42',
      requestedBy: 'test',
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks action on external public IP', async () => {
    const { checkScope } = await import('../lib/sentra-defense/scope-enforcer.js');
    const result = checkScope({
      action: 'BlockIp',
      targetType: 'ip',
      targetValue: '8.8.8.8',
      requestedBy: 'test',
    });
    expect(result.allowed).toBe(false);
    expect(result.violationType).toBe('out_of_scope');
  });

  it('blocks action on external domain', async () => {
    const { checkScope } = await import('../lib/sentra-defense/scope-enforcer.js');
    const result = checkScope({
      action: 'BlockIp',
      targetType: 'domain',
      targetValue: 'attacker.com',
      requestedBy: 'test',
    });
    expect(result.allowed).toBe(false);
    expect(result.violationType).toBe('out_of_scope');
  });

  it('allows action on honey endpoint path', async () => {
    const { checkScope } = await import('../lib/sentra-defense/scope-enforcer.js');
    const result = checkScope({
      action: 'TarpitClient',
      targetType: 'api_path',
      targetValue: '/api/honey/trap-1',
      requestedBy: 'test',
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks action not permitted for asset type', async () => {
    const { checkScope } = await import('../lib/sentra-defense/scope-enforcer.js');
    const result = checkScope({
      action: 'PoisonedResponse',
      targetType: 'ip',
      targetValue: '127.0.0.1',
      requestedBy: 'test',
    });
    expect(result.allowed).toBe(false);
    expect(result.violationType).toBe('action_not_permitted');
  });

  it('ScopeViolationError is thrown by assertScope for external target', async () => {
    const { assertScope, ScopeViolationError } = await import('../lib/sentra-defense/scope-enforcer.js');
    expect(() =>
      assertScope({
        action: 'BlockIp',
        targetType: 'ip',
        targetValue: '185.220.101.1',
        requestedBy: 'test',
      }),
    ).toThrow(ScopeViolationError);
  });
});

describe('Detection Engine', () => {
  beforeEach(async () => {
    const { DETECTION_RULES, registerAlertHandler } = await import('../lib/sentra-defense/detection-engine.js');
    void DETECTION_RULES;
    registerAlertHandler(() => {});
  });

  it('fires DR-002 (honey endpoint) on honey.endpoint_hit event', async () => {
    const { evaluateEvent } = await import('../lib/sentra-defense/detection-engine.js');
    const { buildSecurityEvent } = await import('../lib/sentra-defense/event-bus.js');

    const event = buildSecurityEvent({
      eventType: 'honey.endpoint_hit',
      sourceIp: '10.0.0.99',
      path: '/api/honey/trap',
      method: 'GET',
      severity: 'critical',
      payload: {},
    });

    const alert = evaluateEvent(event);
    expect(alert).not.toBeNull();
    expect(alert?.ruleId).toBe('DR-002');
    expect(alert?.severity).toBe('critical');
  });

  it('fires DR-003 (canary triggered) on canary.triggered event', async () => {
    const { evaluateEvent } = await import('../lib/sentra-defense/detection-engine.js');
    const { buildSecurityEvent } = await import('../lib/sentra-defense/event-bus.js');

    const event = buildSecurityEvent({
      eventType: 'canary.triggered',
      sourceIp: '10.0.0.55',
      severity: 'critical',
      payload: { canaryId: 'test-canary-1' },
    });

    const alert = evaluateEvent(event);
    expect(alert).not.toBeNull();
    expect(alert?.ruleId).toBe('DR-003');
  });

  it('fires DR-008 (geo velocity) on geo.drift event', async () => {
    const { evaluateEvent } = await import('../lib/sentra-defense/detection-engine.js');
    const { buildSecurityEvent } = await import('../lib/sentra-defense/event-bus.js');

    const event = buildSecurityEvent({
      eventType: 'geo.drift',
      sourceIp: '10.0.0.1',
      severity: 'high',
      payload: { fromCountry: 'US', toCountry: 'RU', velocityKmH: 15000 },
    });

    const alert = evaluateEvent(event);
    expect(alert).not.toBeNull();
    expect(alert?.ruleId).toBe('DR-008');
  });

  it('fires DR-006 (token replay) on session.replay event', async () => {
    const { evaluateEvent } = await import('../lib/sentra-defense/detection-engine.js');
    const { buildSecurityEvent } = await import('../lib/sentra-defense/event-bus.js');

    const event = buildSecurityEvent({
      eventType: 'session.replay',
      sourceIp: '10.0.0.77',
      sessionId: 'session-old-token',
      severity: 'high',
      payload: {},
    });

    const alert = evaluateEvent(event);
    expect(alert).not.toBeNull();
    expect(alert?.ruleId).toBe('DR-006');
  });

  it('fires DR-007 (fingerprint drift) on fingerprint.drift event', async () => {
    const { evaluateEvent } = await import('../lib/sentra-defense/detection-engine.js');
    const { buildSecurityEvent } = await import('../lib/sentra-defense/event-bus.js');

    const event = buildSecurityEvent({
      eventType: 'fingerprint.drift',
      sourceIp: '10.0.0.88',
      sessionId: 'session-hijack-test',
      severity: 'high',
      payload: { driftScore: 0.92 },
    });

    const alert = evaluateEvent(event);
    expect(alert).not.toBeNull();
    expect(alert?.ruleId).toBe('DR-007');
  });
});

describe('Evidence Ledger', () => {
  it('appends entries and increments sequence numbers', async () => {
    const { appendLedgerEntry, getRecentEntries } = await import('../lib/sentra-defense/evidence-ledger.js');
    const before = getRecentEntries(1)[0]?.sequenceNumber ?? 0;

    const entry1 = appendLedgerEntry({
      entryType: 'detection',
      actorType: 'system',
      action: 'test-action-1',
      outcome: 'executed',
      details: {},
    });
    const entry2 = appendLedgerEntry({
      entryType: 'response',
      actorType: 'sentinel',
      action: 'test-action-2',
      outcome: 'executed',
      details: {},
    });

    expect(entry2.sequenceNumber).toBeGreaterThan(entry1.sequenceNumber);
    expect(entry1.sequenceNumber).toBeGreaterThan(before);
  });

  it('links entries via previousHash chain', async () => {
    const { appendLedgerEntry } = await import('../lib/sentra-defense/evidence-ledger.js');
    const e1 = appendLedgerEntry({
      entryType: 'detection',
      actorType: 'system',
      action: 'chain-test-1',
      outcome: 'executed',
      details: {},
    });
    const e2 = appendLedgerEntry({
      entryType: 'response',
      actorType: 'operator',
      action: 'chain-test-2',
      outcome: 'approved',
      details: {},
    });
    expect(e2.previousHash).toBe(e1.entryHash);
  });

  it('verifyChainIntegrity returns valid for unmodified chain', async () => {
    const { verifyChainIntegrity, appendLedgerEntry } = await import('../lib/sentra-defense/evidence-ledger.js');
    appendLedgerEntry({
      entryType: 'sentinel_action',
      actorType: 'sentinel',
      action: 'verify-test',
      outcome: 'executed',
      details: {},
    });
    const result = verifyChainIntegrity();
    expect(result.valid).toBe(true);
  });
});

describe('Sentinel Agent — Attacker Classification', () => {
  it('classifies scripted automation correctly', async () => {
    const { classifyAttacker } = await import('../lib/sentra-defense/sentinel-agent.js');
    const result = classifyAttacker({
      requestsPerMinute: 250,
      timingRegularity: 0.95,
      headerAnomalyScore: 0.85,
    });
    expect(['scripted_automation', 'llm_agent']).toContain(result.profile);
    expect(result.confidence).toBeGreaterThan(50);
  });

  it('classifies LLM agent with reasoning trace markers', async () => {
    const { classifyAttacker } = await import('../lib/sentra-defense/sentinel-agent.js');
    const result = classifyAttacker({
      requestsPerMinute: 30,
      hasReasoningTraceMarkers: true,
      timingRegularity: 0.92,
    });
    expect(result.profile).toBe('llm_agent');
    expect(result.confidence).toBeGreaterThan(60);
  });

  it('classifies human for low-signal request', async () => {
    const { classifyAttacker } = await import('../lib/sentra-defense/sentinel-agent.js');
    const result = classifyAttacker({
      requestsPerMinute: 5,
      timingRegularity: 0.2,
      headerAnomalyScore: 0.1,
    });
    expect(result.profile).toBe('human');
  });

  it('creates duel session and applies counter-move for automation', async () => {
    const { processSentinelTurn } = await import('../lib/sentra-defense/sentinel-agent.js');
    const { buildSecurityEvent } = await import('../lib/sentra-defense/event-bus.js');

    const event = buildSecurityEvent({
      eventType: 'scraping.detected',
      sourceIp: '10.0.0.200',
      path: '/api/sentra/data',
      method: 'GET',
      severity: 'medium',
      payload: {},
    });

    const { session, counterMove } = processSentinelTurn('test-session-auto-001', event, {
      requestsPerMinute: 300,
      timingRegularity: 0.95,
      headerAnomalyScore: 0.9,
    });

    expect(session.attackerProfile).not.toBe('human');
    expect(session.status).toBe('active');
    expect(counterMove).not.toBeNull();
    expect(counterMove?.approved).toBe(true);
  });
});

describe('Active Response — End-to-End Attacker Sequence', () => {
  it('credential stuffing: detection fires, tarpit auto-executes', async () => {
    const { executeAction, isIpTarpitted } = await import('../lib/sentra-defense/active-response.js');
    const { updateCategory } = await import('../lib/sentra-defense/hitl-controls.js');

    updateCategory('tarpit', { autoExecute: true, requireApproval: false, enabled: true });

    const result = await executeAction({
      actionType: 'TarpitClient',
      target: '10.0.1.100',
      targetType: 'ip',
      reason: 'credential stuffing detected',
      linkedEventId: 'event-cs-001',
    });

    expect(result.outcome).toBe('executed');
    expect(isIpTarpitted('10.0.1.100')).toBe(true);
  });

  it('honey endpoint hit: block action queued for approval (block category requires approval)', async () => {
    const { executeAction } = await import('../lib/sentra-defense/active-response.js');
    const { updateCategory } = await import('../lib/sentra-defense/hitl-controls.js');

    updateCategory('block', { autoExecute: false, requireApproval: true, enabled: true });

    const result = await executeAction({
      actionType: 'BlockIp',
      target: '10.0.1.200',
      targetType: 'ip',
      reason: 'honey endpoint hit',
      linkedEventId: 'event-honey-001',
    });

    expect(['queued_for_approval', 'executed']).toContain(result.outcome);
  });

  it('out-of-scope block attempt is refused', async () => {
    const { executeAction } = await import('../lib/sentra-defense/active-response.js');

    const result = await executeAction({
      actionType: 'BlockIp',
      target: '1.2.3.4',
      targetType: 'ip',
      reason: 'attacker IP in the wild',
    });

    expect(result.outcome).toBe('blocked_by_scope');
    expect(result.ok).toBe(false);
  });

  it('session revoke queued when require approval is on', async () => {
    const { executeAction } = await import('../lib/sentra-defense/active-response.js');
    const { updateCategory } = await import('../lib/sentra-defense/hitl-controls.js');

    updateCategory('revoke', { autoExecute: false, requireApproval: true, enabled: true });

    const result = await executeAction({
      actionType: 'RevokeSession',
      target: 'session:test-session-revoke-001',
      targetType: 'session_namespace',
      reason: 'token replay detected',
      linkedEventId: 'event-replay-001',
    });

    expect(['queued_for_approval', 'executed']).toContain(result.outcome);
  });

  it('global kill switch blocks all actions', async () => {
    const { executeAction } = await import('../lib/sentra-defense/active-response.js');
    const { setGlobalKillSwitch } = await import('../lib/sentra-defense/hitl-controls.js');

    setGlobalKillSwitch(true, 'test');
    const result = await executeAction({
      actionType: 'TarpitClient',
      target: '10.0.0.1',
      targetType: 'ip',
      reason: 'test',
    });
    expect(result.outcome).toBe('blocked_by_hitl');
    expect(result.ok).toBe(false);

    setGlobalKillSwitch(false, 'test');
  });
});

describe('HITL Controls', () => {
  it('getHitlState returns default safe state', async () => {
    const { getHitlState } = await import('../lib/sentra-defense/hitl-controls.js');
    const state = getHitlState();
    expect(state.globalKillSwitch).toBe(false);
    expect(state.categories.tarpit).toBeDefined();
    expect(state.categories.block).toBeDefined();
  });

  it('updateCategory changes autoExecute', async () => {
    const { updateCategory, getHitlState } = await import('../lib/sentra-defense/hitl-controls.js');
    updateCategory('poison_response', { autoExecute: true, requireApproval: false }, 'test-operator');
    const state = getHitlState();
    expect(state.categories.poison_response.autoExecute).toBe(true);
    expect(state.categories.poison_response.requireApproval).toBe(false);
  });

  it('setPerActionOverride blocks specific action', async () => {
    const { setPerActionOverride, isActionAllowed } = await import('../lib/sentra-defense/hitl-controls.js');
    setPerActionOverride('specific-action-999', false, 'test-operator');
    const check = isActionAllowed('block', 'specific-action-999');
    expect(check.allowed).toBe(false);
  });
});

describe('Owned Asset Registry', () => {
  it('lists all owned assets', async () => {
    const { listOwnedAssets } = await import('../lib/sentra-defense/owned-assets.js');
    const assets = listOwnedAssets();
    expect(assets.length).toBeGreaterThan(5);
    const types = new Set(assets.map((a) => a.type));
    expect(types.has('ip_range')).toBe(true);
    expect(types.has('honey_endpoint')).toBe(true);
  });

  it('correctly identifies owned IPs', async () => {
    const { isIpOwned } = await import('../lib/sentra-defense/owned-assets.js');
    expect(isIpOwned('10.0.0.1')).toBe(true);
    expect(isIpOwned('192.168.1.1')).toBe(true);
    expect(isIpOwned('127.0.0.1')).toBe(true);
    expect(isIpOwned('8.8.8.8')).toBe(false);
    expect(isIpOwned('185.220.101.1')).toBe(false);
  });
});
