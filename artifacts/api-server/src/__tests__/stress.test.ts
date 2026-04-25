import http from 'node:http';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { FusionCortex, type FusionAlertCategory, type FusionAlertSeverity } from '@szl-holdings/ai-engine';
import { OntologyEngine, type OntologyEntity } from '@szl-holdings/ai-engine/ontology/ontology-engine';

import app from '../app';

const MAX_ALERTS = 200;
const MAX_CACHE_SIZE = 500;

const SEVERITIES: FusionAlertSeverity[] = ['low', 'medium', 'high', 'critical'];
const CATEGORIES: FusionAlertCategory[] = [
  'cross_domain_risk',
  'entity_correlation',
  'pattern_anomaly',
  'sanctions_exposure',
];

function makeAlertPayload(i: number) {
  return {
    title: `Stress alert ${i}`,
    summary: `Synthetic alert #${i} for stress testing`,
    severity: SEVERITIES[i % SEVERITIES.length]!,
    category: CATEGORIES[i % CATEGORIES.length]!,
    confidence: 0.7 + (i % 30) * 0.01,
    affectedDomains: ['vessels', 'terra'],
    affectedEntities: [
      { id: `stress-e-${i}`, name: `Entity ${i}`, domain: 'vessels', type: 'vessel' },
    ],
    evidenceChain: [
      {
        source: 'Stress Test',
        domain: 'test',
        description: `Evidence for alert ${i}`,
        timestamp: new Date().toISOString(),
        weight: 0.8,
      },
    ],
    recommendedActions: [`Action for alert ${i}`],
    tags: ['stress-test'],
  } as const;
}

function makeEntity(i: number): OntologyEntity {
  return {
    id: `stress-entity-${i}`,
    type: 'organization',
    name: `Stress Org ${i}`,
    domain: 'szl-holdings',
    metadata: { index: i },
    tags: ['stress'],
    lastUpdated: new Date().toISOString(),
  };
}

function httpGet(agent: http.Agent, port: number, path: string): Promise<{ latencyMs: number; statusCode: number }> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.get(
      { hostname: '127.0.0.1', port, path, agent },
      (res) => {
        const statusCode = res.statusCode ?? 0;
        res.resume();
        res.on('end', () => resolve({ latencyMs: performance.now() - start, statusCode }));
      },
    );
    req.on('error', reject);
  });
}

describe('Stress test — memory regression guard', () => {
  const disposables: Array<{ dispose: () => void }> = [];

  afterEach(() => {
    for (const d of disposables) {
      try { d.dispose(); } catch { /* teardown */ }
    }
    disposables.length = 0;
  });

  describe('FusionCortex alert buffer stays within MAX_ALERTS (200)', () => {
    it('caps the buffer at 200 after injecting 300 alerts', () => {
      const cortex = new FusionCortex();
      disposables.push(cortex);

      for (let i = 0; i < 300; i++) {
        cortex.injectAlert(makeAlertPayload(i));
      }

      const stats = cortex.getStats();
      expect(stats.totalAlerts).toBeLessThanOrEqual(MAX_ALERTS);
      expect(stats.totalAlerts).toBe(MAX_ALERTS);
    });

    it('remains bounded after sustained rapid injection', () => {
      const cortex = new FusionCortex();
      disposables.push(cortex);

      for (let wave = 0; wave < 5; wave++) {
        for (let i = 0; i < 100; i++) {
          cortex.injectAlert(makeAlertPayload(wave * 100 + i));
        }
        const stats = cortex.getStats();
        expect(stats.totalAlerts).toBeLessThanOrEqual(MAX_ALERTS);
      }
    });
  });

  describe('OntologyEngine entityCache stays within MAX_CACHE_SIZE (500)', () => {
    it('caps the cache at 500 after priming 600 entries', () => {
      const engine = new OntologyEngine();
      disposables.push(engine);

      for (let i = 0; i < 600; i++) {
        engine.primeCache(makeEntity(i));
      }

      const cacheStats = engine.getCacheStats();
      expect(cacheStats.maxSize).toBe(MAX_CACHE_SIZE);
      expect(cacheStats.size).toBeLessThanOrEqual(MAX_CACHE_SIZE);
      expect(cacheStats.size).toBe(MAX_CACHE_SIZE);
    });
  });

  describe('Concurrent request latency — 50 parallel requests against real API server', () => {
    let server: http.Server;
    let port: number;
    let agent: http.Agent;

    beforeAll(async () => {
      server = app.listen(0);
      const addr = server.address();
      port = typeof addr === 'object' && addr ? addr.port : 0;
      agent = new http.Agent({ keepAlive: true, maxSockets: 50 });

      await Promise.all(
        Array.from({ length: 50 }, () => httpGet(agent, port, '/api/health/live')),
      );
      await Promise.all(
        Array.from({ length: 50 }, () => httpGet(agent, port, '/api/health/live')),
      );
    }, 15_000);

    afterAll(async () => {
      agent.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('p95 latency stays under 100ms on /api/health/live', async () => {
      const results = await Promise.all(
        Array.from({ length: 50 }, () => httpGet(agent, port, '/api/health/live')),
      );

      expect(results).toHaveLength(50);

      for (const r of results) {
        expect(r.statusCode).toBe(200);
      }

      const latencies = results.map((r) => r.latencyMs);
      latencies.sort((a, b) => a - b);
      const p95Index = Math.ceil(latencies.length * 0.95) - 1;
      const p95 = latencies[p95Index]!;

      expect(p95).toBeLessThan(100);
    });
  });
});
