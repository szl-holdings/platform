/**
 * Fabric Live Aggregation — End-to-End Test (Task #1948)
 *
 * Proves that the per-product `domainEventBus` is bridged into the global
 * `defaultSignalBus`, and that the `/api/fabric/snapshot` endpoint surfaces
 * those signals as live Fabric data (with proper product mapping and
 * cross-product correlation detection).
 */

import { defaultSignalBus } from '@szl-holdings/signal-mesh';
import express from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { domainEventBus } from '../lib/domain-events/index.js';
import { initSignalMeshBridge } from '../lib/domain-events/signal-mesh-bridge.js';
import fabricRouter from '../routes/fabric.js';

beforeAll(() => {
  defaultSignalBus.clear();
  initSignalMeshBridge();
});

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', fabricRouter);
  return app;
}

describe('Fabric live aggregation — domain events → signal mesh → /api/fabric/snapshot', () => {
  it('publishes Lyte and Vessels domain events as Signals on the bus', async () => {
    domainEventBus.publish('vessel.position-updated', {
      vesselId: 4242,
      latitude: 1.29,
      longitude: 103.85,
      speed: 12,
      recordedAt: new Date().toISOString(),
    });
    domainEventBus.publish('lyte.signal-triaged', {
      signalId: 7777,
      status: 'acknowledged',
      severity: 'high',
      source: 'test',
    });

    // Allow event-loop microtasks to drain
    await new Promise((r) => setTimeout(r, 10));

    const snap = defaultSignalBus.snapshot({ limit: 50 });
    const types = snap.map((s) => `${s.domain}/${s.entityRefs[0]?.entityId}`);
    expect(types).toContain('maritime/vessel-4242');
    expect(types).toContain('ai/lyte-signal-7777');
  });

  it('surfaces those signals on /api/fabric/snapshot mapped to vessels and lyte products', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/fabric/snapshot');
    expect(res.status).toBe(200);

    const products = (res.body.signals as Array<{ product: string; entityId: string }>).map(
      (s) => `${s.product}:${s.entityId}`,
    );
    expect(products.some((p) => p.startsWith('vessels:vessel-'))).toBe(true);
    expect(products.some((p) => p.startsWith('lyte:lyte-signal-'))).toBe(true);
  });

  it('computes cross-product correlations from real signals sharing an entity', async () => {
    const sharedEntityId = `corr-entity-${Date.now()}`;
    // Vessel side
    domainEventBus.publish('vessel.status-changed', {
      vesselId: 9999,
      previousStatus: 'underway',
      newStatus: 'detained',
    });
    // Manually inject two signals sharing one entity across two products
    const { createSignal } = await import('@workspace/ontology/signal');
    defaultSignalBus.publish(
      createSignal({
        source: 'api',
        type: 'risk',
        domain: 'maritime',
        occurredAt: new Date().toISOString(),
        freshness: 1,
        confidence: 0.9,
        severity: 'high',
        entityRefs: [{ entityId: sharedEntityId, entityType: 'corridor' }],
        rawPayload: { title: 'Corridor risk — maritime side' },
        tags: [],
      }),
    );
    defaultSignalBus.publish(
      createSignal({
        source: 'api',
        type: 'anomaly',
        domain: 'ai',
        occurredAt: new Date().toISOString(),
        freshness: 1,
        confidence: 0.85,
        severity: 'high',
        entityRefs: [{ entityId: sharedEntityId, entityType: 'corridor' }],
        rawPayload: { title: 'Same corridor — AI side' },
        tags: [],
      }),
    );

    const app = buildApp();
    const res = await request(app).get('/api/fabric/snapshot');
    expect(res.status).toBe(200);

    const corrs = res.body.correlations as Array<{
      products: string[];
      entities: Array<{ id: string }>;
    }>;
    const liveCorr = corrs.find((c) => c.entities.some((e) => e.id === sharedEntityId));
    expect(liveCorr).toBeDefined();
    expect(new Set(liveCorr?.products)).toEqual(new Set(['vessels', 'lyte']));
  });
});
