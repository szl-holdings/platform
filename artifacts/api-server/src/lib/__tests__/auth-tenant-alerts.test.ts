import { describe, expect, it } from 'vitest';
import { ServerTelemetryCollector } from '../../../../../lib/observability/src/telemetry';

describe('auth failure rate metric (OBS-006)', () => {
  it('returns 0 with no failures', () => {
    const t = new ServerTelemetryCollector();
    expect(t.getAuthFailureRatePerMin()).toBe(0);
  });

  it('counts failures into the rolling rate per minute', () => {
    const t = new ServerTelemetryCollector();
    for (let i = 0; i < 25; i++) t.recordAuthFailure();
    const rate = t.getAuthFailureRatePerMin();
    expect(rate).toBeGreaterThan(0);
    expect(t.getSnapshot().authFailures).toBe(25);
    expect(t.getSnapshot().authFailureRatePerMin).toBeGreaterThan(0);
  });
});

describe('tenant isolation violation tracking (OBS-005)', () => {
  it('returns no violations when none recorded', () => {
    const t = new ServerTelemetryCollector();
    expect(t.getTenantIsolationViolationCount()).toBe(0);
    expect(t.getTenantIsolationViolationsSince(0).length).toBe(0);
  });

  it('records violations and returns only those after the given timestamp', () => {
    const t = new ServerTelemetryCollector();
    const before = Date.now();
    t.recordTenantIsolationViolation({
      userId: 42,
      userOrgIds: [1],
      attemptedOrgId: 7,
      path: '/api/orgs/7/x',
      method: 'GET',
      reason: 'cross-tenant test',
    });
    expect(t.getTenantIsolationViolationCount()).toBe(1);
    const since = t.getTenantIsolationViolationsSince(before - 1);
    expect(since.length).toBe(1);
    expect(since[0]!.userId).toBe(42);
    expect(since[0]!.attemptedOrgId).toBe(7);
    expect(since[0]!.reason).toBe('cross-tenant test');
    // Nothing newer than now+ts.
    expect(t.getTenantIsolationViolationsSince(Date.now() + 1000).length).toBe(0);
  });

  it('includes tenantIsolationViolations in the snapshot', () => {
    const t = new ServerTelemetryCollector();
    t.recordTenantIsolationViolation({
      userOrgIds: [],
      attemptedOrgId: 99,
      reason: 'snapshot test',
    });
    expect(t.getSnapshot().tenantIsolationViolations).toBe(1);
  });
});
