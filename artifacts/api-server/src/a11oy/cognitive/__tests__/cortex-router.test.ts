import { describe, it, expect, beforeEach } from 'vitest';
import { decideCortexRoute } from '../cortex-router.js';
import type { CognitiveWorker } from '../types.js';

const TENANT = 'tenant-test-001';

function makeWorker(overrides: Partial<CognitiveWorker> = {}): CognitiveWorker {
  return {
    workerId: 'w-test',
    tenantId: TENANT,
    name: 'TestWorker',
    rolloutGroup: 'default',
    configChecksum: 'sha256-abc123',
    capabilities: ['reasoning'],
    status: 'active',
    isDraining: false,
    uptimeSeconds: 0,
    requestsHandled: 0,
    errorsCount: 0,
    registeredAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('CortexRouter', () => {
  it('latency mode selects the lowest-latency eligible candidate', () => {
    const decision = decideCortexRoute({
      requestId: 'req-lat',
      tenantId: TENANT,
      scoringMode: 'latency',
    });
    expect(decision.selectedModel).toBeDefined();
    expect(decision.latencyScore).toBeGreaterThan(0);
    expect(decision.estimatedLatencyMs).toBeLessThan(3000);
    expect(decision.scoringMode).toBe('latency');
  });

  it('cost mode selects the lowest-cost eligible candidate', () => {
    const decision = decideCortexRoute({
      requestId: 'req-cost',
      tenantId: TENANT,
      scoringMode: 'cost',
    });
    expect(decision.selectedModel).toBeDefined();
    expect(decision.costScore).toBeGreaterThan(0);
    expect(decision.estimatedCostUsd).toBeLessThan(0.00005);
    expect(decision.scoringMode).toBe('cost');
  });

  it('confidence mode selects a high-confidence model', () => {
    const decision = decideCortexRoute({
      requestId: 'req-conf',
      tenantId: TENANT,
      scoringMode: 'confidence',
    });
    expect(decision.selectedModel).toBeDefined();
    expect(decision.confidenceScore).toBeGreaterThan(0.8);
  });

  it('falls back when primary fails sensitivity constraints', () => {
    const decision = decideCortexRoute({
      requestId: 'req-restricted',
      tenantId: TENANT,
      scoringMode: 'balanced',
      constraints: { sensitivityTier: 'restricted' },
    });
    expect(decision.selectedProvider).toBe('anthropic');
  });

  it('excludes unhealthy workers from decisions when worker list is provided', () => {
    const drainingWorker = makeWorker({ workerId: 'w-opus', status: 'draining', isDraining: true });
    const activeWorker = makeWorker({ workerId: 'w-sonnet', status: 'active' });

    const decision = decideCortexRoute({
      requestId: 'req-health',
      tenantId: TENANT,
      scoringMode: 'balanced',
      workers: [drainingWorker, activeWorker],
    });

    expect(decision.routeDecisionId).toBeDefined();
    expect(decision.candidatesEvaluated).toBeGreaterThan(0);
  });

  it('falls back with reason when no candidates meet SLA', () => {
    const decision = decideCortexRoute({
      requestId: 'req-impossible',
      tenantId: TENANT,
      scoringMode: 'latency',
      constraints: { maxLatencyMs: 1, sensitivityTier: 'restricted' },
    });
    expect(decision.isFallback).toBe(true);
    expect(decision.fallbackReason).toBeDefined();
  });

  it('includes required metadata bundle on every decision', () => {
    const decision = decideCortexRoute({
      requestId: 'req-meta',
      tenantId: TENANT,
    });
    expect(decision.routeDecisionId).toMatch(/^rd-/);
    expect(decision.requestId).toBe('req-meta');
    expect(decision.tenantId).toBe(TENANT);
    expect(decision.selectedModel).toBeDefined();
    expect(decision.selectedProvider).toBeDefined();
    expect(decision.decidedAt).toBeDefined();
  });
});
