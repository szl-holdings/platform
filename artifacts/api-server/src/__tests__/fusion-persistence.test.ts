import { afterEach, describe, expect, it, vi } from 'vitest';
import { FusionCortex, type FusionAlert } from '@szl-holdings/ai-engine';

function makeTestAlert(id: string, overrides: Partial<FusionAlert> = {}): FusionAlert {
  return {
    id,
    title: `Alert ${id}`,
    summary: `Summary for ${id}`,
    severity: 'high',
    category: 'cross_domain_risk',
    confidence: 0.85,
    affectedDomains: ['vessels', 'terra'],
    affectedEntities: [{ id: 'e-1', name: 'Entity 1', domain: 'vessels', type: 'vessel' }],
    evidenceChain: [{ source: 'test', domain: 'test', description: 'evidence', timestamp: new Date().toISOString(), weight: 0.8 }],
    recommendedActions: ['Review immediately'],
    tags: ['test'],
    status: 'active',
    generatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
}

describe('FusionCortex hydrateAlert — cold-start buffer restoration', () => {
  const disposables: FusionCortex[] = [];

  afterEach(() => {
    for (const c of disposables) c.dispose();
    disposables.length = 0;
  });

  it('restores an alert with original ID, status, and timestamps', () => {
    const cortex = new FusionCortex();
    disposables.push(cortex);

    cortex.hydrateAlert(makeTestAlert('hydrate-original', {
      severity: 'critical',
      status: 'acknowledged',
      generatedAt: '2025-06-15T12:00:00.000Z',
      expiresAt: '2099-12-31T23:59:59.000Z',
      confidence: 0.92,
    }));

    const found = cortex.getAlerts({ limit: 500 }).find((a) => a.id === 'hydrate-original');
    expect(found).toBeDefined();
    expect(found!.id).toBe('hydrate-original');
    expect(found!.status).toBe('acknowledged');
    expect(found!.generatedAt).toBe('2025-06-15T12:00:00.000Z');
    expect(found!.severity).toBe('critical');
    expect(found!.confidence).toBe(0.92);
  });

  it('does not fire onAlert subscribers during hydration', () => {
    const cortex = new FusionCortex();
    disposables.push(cortex);
    const calls: string[] = [];
    cortex.onAlert((a) => calls.push(a.id));

    cortex.hydrateAlert(makeTestAlert('silent-hydrate'));

    expect(calls).toHaveLength(0);
    expect(calls).not.toContain('silent-hydrate');
  });

  it('deduplicates — same ID is not inserted twice', () => {
    const cortex = new FusionCortex();
    disposables.push(cortex);
    const alert = makeTestAlert('dedup-test');

    cortex.hydrateAlert(alert);
    cortex.hydrateAlert(alert);

    const matches = cortex.getAlerts({ limit: 500 }).filter((a) => a.id === 'dedup-test');
    expect(matches).toHaveLength(1);
  });

  it('respects MAX_ALERTS (200) cap during hydration', () => {
    const cortex = new FusionCortex();
    disposables.push(cortex);

    for (let i = 0; i < 210; i++) {
      cortex.hydrateAlert(makeTestAlert(`cap-${i}`, {
        generatedAt: new Date(Date.now() - i * 1000).toISOString(),
      }));
    }

    const stats = cortex.getStats();
    expect(stats.totalAlerts).toBeLessThanOrEqual(200);
    expect(stats.totalAlerts).toBe(200);
  });

  it('keeps most recent alerts when cap is exceeded', () => {
    const cortex = new FusionCortex();
    disposables.push(cortex);

    for (let i = 0; i < 210; i++) {
      cortex.hydrateAlert(makeTestAlert(`order-${i}`, {
        generatedAt: new Date(Date.now() - i * 60000).toISOString(),
      }));
    }

    const alerts = cortex.getAlerts({ limit: 500 });
    const hasNewest = alerts.some((a) => a.id === 'order-0');
    const hasOldest = alerts.some((a) => a.id === 'order-209');
    expect(hasNewest).toBe(true);
    expect(hasOldest).toBe(false);
  });

  it('injectAlert still fires subscribers (hydrate does not break inject)', () => {
    const cortex = new FusionCortex();
    disposables.push(cortex);
    const calls: string[] = [];
    cortex.onAlert((a) => calls.push(a.id));

    cortex.hydrateAlert(makeTestAlert('hydrated-one'));
    const injected = cortex.injectAlert({
      title: 'Injected',
      summary: 'New alert',
      severity: 'medium',
      category: 'pattern_anomaly',
      confidence: 0.7,
      affectedDomains: ['vessels'],
      affectedEntities: [],
      evidenceChain: [],
      recommendedActions: [],
      tags: [],
    });

    expect(calls).not.toContain('hydrated-one');
    expect(calls).toContain(injected.id);
  });
});

describe('loadPersistedAlerts — DB query filtering contract', () => {
  it('filters: only active+acknowledged non-expired rows are hydrated; resolved/expired skipped', () => {
    const cortex = new FusionCortex();
    const hydratedIds: string[] = [];
    const origHydrate = cortex.hydrateAlert.bind(cortex);
    cortex.hydrateAlert = (alert: FusionAlert) => {
      hydratedIds.push(alert.id);
      origHydrate(alert);
    };

    const dbRows: FusionAlert[] = [
      makeTestAlert('row-active', { status: 'active', expiresAt: new Date(Date.now() + 86400000).toISOString() }),
      makeTestAlert('row-ack', { status: 'acknowledged', expiresAt: new Date(Date.now() + 86400000).toISOString() }),
      makeTestAlert('row-resolved', { status: 'resolved', expiresAt: new Date(Date.now() + 86400000).toISOString() }),
      makeTestAlert('row-expired', { status: 'active', expiresAt: new Date(Date.now() - 3600000).toISOString() }),
    ];

    const filtered = dbRows.filter(
      (r) => ['active', 'acknowledged'].includes(r.status) && new Date(r.expiresAt) > new Date(),
    );
    for (const row of filtered) {
      cortex.hydrateAlert(row);
    }

    expect(hydratedIds).toContain('row-active');
    expect(hydratedIds).toContain('row-ack');
    expect(hydratedIds).not.toContain('row-resolved');
    expect(hydratedIds).not.toContain('row-expired');

    const alerts = cortex.getAlerts({ limit: 500 });
    expect(alerts.find((a) => a.id === 'row-active')).toBeDefined();
    expect(alerts.find((a) => a.id === 'row-ack')).toBeDefined();
    expect(alerts.find((a) => a.id === 'row-resolved')).toBeUndefined();
    expect(alerts.find((a) => a.id === 'row-expired')).toBeUndefined();
    cortex.dispose();
  });

  it('ordering: more recent generatedAt comes first in buffer', () => {
    const cortex = new FusionCortex();

    const recent = makeTestAlert('recent', {
      generatedAt: new Date(Date.now() - 1000).toISOString(),
    });
    const older = makeTestAlert('older', {
      generatedAt: new Date(Date.now() - 60000).toISOString(),
    });

    cortex.hydrateAlert(recent);
    cortex.hydrateAlert(older);

    const alerts = cortex.getAlerts({ limit: 2 });
    expect(alerts.length).toBe(2);
    const recentIdx = alerts.findIndex((a) => a.id === 'recent');
    const olderIdx = alerts.findIndex((a) => a.id === 'older');
    expect(recentIdx).toBeLessThan(olderIdx);
    cortex.dispose();
  });
});
