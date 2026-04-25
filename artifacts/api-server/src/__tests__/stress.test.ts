import express from 'express';
import http from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';

import { FusionCortex, type FusionAlertCategory, type FusionAlertSeverity } from '@szl-holdings/ai-engine';
import { OntologyEngine, type OntologyEntity } from '@szl-holdings/ai-engine/ontology/ontology-engine';

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
    it('caps the cache at 500 after setting 600 entries', () => {
      const engine = new OntologyEngine();
      disposables.push(engine);

      const setCache = (engine as unknown as { setCache: (e: OntologyEntity) => void }).setCache.bind(engine);

      for (let i = 0; i < 600; i++) {
        setCache(makeEntity(i));
      }

      const cacheSize = (engine as unknown as { entityCache: Map<string, unknown> }).entityCache.size;
      expect(cacheSize).toBeLessThanOrEqual(MAX_CACHE_SIZE);
      expect(cacheSize).toBe(MAX_CACHE_SIZE);
    });

    it('evicts oldest entries first (FIFO) when cache is full', () => {
      const engine = new OntologyEngine();
      disposables.push(engine);

      const setCache = (engine as unknown as { setCache: (e: OntologyEntity) => void }).setCache.bind(engine);
      const entityCache = (engine as unknown as { entityCache: Map<string, OntologyEntity> }).entityCache;

      for (let i = 0; i < MAX_CACHE_SIZE + 50; i++) {
        setCache(makeEntity(i));
      }

      expect(entityCache.has('stress-entity-0')).toBe(false);
      expect(entityCache.has('stress-entity-49')).toBe(false);
      expect(entityCache.has(`stress-entity-${MAX_CACHE_SIZE + 49}`)).toBe(true);
      expect(entityCache.size).toBe(MAX_CACHE_SIZE);
    });
  });

  describe('Concurrent request latency — 50 parallel requests', () => {
    function httpGet(agent: http.Agent, port: number): Promise<number> {
      return new Promise((resolve, reject) => {
        const start = performance.now();
        const req = http.get(
          { hostname: '127.0.0.1', port, path: '/api/ping', agent },
          (res) => {
            res.resume();
            res.on('end', () => resolve(performance.now() - start));
          },
        );
        req.on('error', reject);
      });
    }

    it('p95 latency stays under 100ms', async () => {
      const app = express();
      app.get('/api/ping', (_req, res) => {
        res.json({ status: 'ok', ts: Date.now() });
      });

      const server = app.listen(0);
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const agent = new http.Agent({ keepAlive: true, maxSockets: 50 });

      try {
        for (let i = 0; i < 5; i++) {
          await httpGet(agent, port);
        }

        const latencies = await Promise.all(
          Array.from({ length: 50 }, () => httpGet(agent, port)),
        );

        expect(latencies).toHaveLength(50);
        latencies.sort((a, b) => a - b);
        const p95Index = Math.ceil(latencies.length * 0.95) - 1;
        const p95 = latencies[p95Index]!;

        expect(p95).toBeLessThan(100);
      } finally {
        agent.destroy();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  });
});
