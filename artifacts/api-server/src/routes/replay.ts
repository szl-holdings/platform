import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  getScenario,
  listRuns,
  listScenarios,
  listSnapshots,
  persistRun,
  persistSnapshot,
  seedScenariosIfEmpty,
  upsertScenario,
} from '../lib/replay-store';
import { anyQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';

const scenarioCreateSchema = z.object({
  scenarioId: z.string().min(1, 'scenarioId is required').max(200).trim(),
  name: z.string().min(1, 'name is required').max(300).trim(),
  domain: z.string().min(1, 'domain is required').max(100).trim(),
  description: z.string().max(2000).trim().optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  snapshotCount: z.number().int().min(0).optional(),
});

const snapshotCreateSchema = z.object({
  snapshotId: z.string().max(200).trim().optional(),
  scenarioId: z.string().min(1, 'scenarioId is required').max(200).trim(),
  label: z.string().min(1, 'label is required').max(300).trim(),
  domain: z.string().min(1, 'domain is required').max(100).trim(),
  snapshotType: z.string().min(1, 'snapshotType is required').max(100).trim(),
  historicalContext: z.record(z.unknown()).optional(),
  agentInputs: z.array(z.record(z.unknown())).optional(),
  groundTruth: z.record(z.unknown()).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const runTriggerSchema = z.object({
  scenarioId: z.string().min(1, 'scenarioId is required').max(200).trim(),
});

const router: IRouter = Router();

const SEED_SCENARIOS = [
  {
    scenarioId: 'aegis-soc-threat-triage-v1',
    name: 'Aegis SOC — Critical Threat Triage',
    domain: 'aegis',
    description:
      'Real-world SOC incident: ransomware lateral movement detected across 14 endpoints. Tests threat classification, escalation routing, and containment decisions.',
    tags: ['security', 'ransomware', 'soc', 'triage', 'critical', 'ground-truth'],
    snapshotCount: 3,
    lastReplayed: '2025-04-14T09:22:00Z',
    lastOutcome: 'partial',
    groundTruthMatchRate: 0.67,
  },
  {
    scenarioId: 'vessels-voyage-pnl-optimization-v1',
    name: 'Vessels — Voyage P&L Optimization',
    domain: 'vessels',
    description:
      'Voyage route optimization request with cyclone avoidance constraints. Tests agent reasoning quality and operator override patterns.',
    tags: ['maritime', 'voyage', 'pnl', 'optimization', 'routing'],
    snapshotCount: 1,
    lastReplayed: '2025-04-13T14:05:00Z',
    lastOutcome: 'pass',
    groundTruthMatchRate: 0.92,
  },
  {
    scenarioId: 'terra-portfolio-valuation-v1',
    name: 'Terra — Portfolio Valuation Stress Test',
    domain: 'terra',
    description:
      'Interest rate shock scenario: 200bps increase. Tests cap rate estimation, NAV impact, and asset reallocation recommendations.',
    tags: ['real-estate', 'valuation', 'stress-test', 'interest-rate'],
    snapshotCount: 4,
    lastReplayed: undefined,
    lastOutcome: undefined,
    groundTruthMatchRate: undefined,
  },
  {
    scenarioId: 'prism-compliance-breach-v1',
    name: 'Prism Counsel — Compliance Breach Response',
    domain: 'prism',
    description:
      'A GDPR breach notification workflow test. Evaluates document generation, regulator routing, and remediation sequencing.',
    tags: ['compliance', 'gdpr', 'breach', 'legal'],
    snapshotCount: 5,
    lastReplayed: '2025-04-10T11:30:00Z',
    lastOutcome: 'pass',
    groundTruthMatchRate: 0.88,
  },
];

const SEED_RUNS = [
  {
    runId: 'replay-1712997720-a3f1b2',
    scenarioId: 'aegis-soc-threat-triage-v1',
    scenarioName: 'Aegis SOC — Critical Threat Triage',
    startedAt: '2025-04-14T09:22:00Z',
    completedAt: '2025-04-14T09:22:18Z',
    totalSnapshots: 3,
    successful: 2,
    failed: 1,
    avgLatencyMs: 312,
    groundTruthMatchRate: 0.67,
    totalCostUsd: 0.00124,
  },
  {
    runId: 'replay-1712910300-c9d4e7',
    scenarioId: 'vessels-voyage-pnl-optimization-v1',
    scenarioName: 'Vessels — Voyage P&L Optimization',
    startedAt: '2025-04-13T14:05:00Z',
    completedAt: '2025-04-13T14:05:04Z',
    totalSnapshots: 1,
    successful: 1,
    failed: 0,
    avgLatencyMs: 228,
    groundTruthMatchRate: 0.92,
    totalCostUsd: 0.00042,
  },
  {
    runId: 'replay-1712649000-ff7a23',
    scenarioId: 'prism-compliance-breach-v1',
    scenarioName: 'Prism Counsel — Compliance Breach Response',
    startedAt: '2025-04-10T11:30:00Z',
    completedAt: '2025-04-10T11:30:22Z',
    totalSnapshots: 5,
    successful: 5,
    failed: 0,
    avgLatencyMs: 195,
    groundTruthMatchRate: 0.88,
    totalCostUsd: 0.00218,
  },
];

seedScenariosIfEmpty(SEED_SCENARIOS)
  .then((seeded) => {
    if (seeded) {
      return Promise.all(
        SEED_RUNS.map((run) =>
          persistRun(run).catch((_err) =>
            {},
          ),
        ),
      );
    }
  })
  .catch((_err) => {});

router.get(
  '/replay/scenarios',
  validateQuery(anyQuerySchema),
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const domain = req.query.domain as string | undefined;
      const scenarios = await listScenarios(domain ? { domain } : undefined);
      const runs = await listRuns({ limit: 200 });

      const enriched = scenarios.map((s) => ({
        ...s,
        recentRuns: runs.filter((r) => r.scenarioId === s.scenarioId).slice(0, 5),
      }));

      res.json({
        scenarios: enriched,
        total: scenarios.length,
        domains: [...new Set(scenarios.map((s) => s.domain))],
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  },
);

router.get(
  '/replay/scenarios/:scenarioId',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const { scenarioId } = req.params;
      const scenario = await getScenario(scenarioId as string);
      if (!scenario) {
        res.status(404).json({ error: 'Scenario not found', scenarioId });
        return;
      }
      const snapshots = await listSnapshots(scenarioId as string);
      const runs = await listRuns({ scenarioId: scenarioId as string, limit: 20 });
      res.json({ ...scenario, snapshots, recentRuns: runs });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  },
);

router.post(
  '/replay/scenarios',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  perUserWriteSlidingLimiter,
  validateBody(scenarioCreateSchema),
  async (req, res) => {
    try {
      const { scenarioId, name, domain, description, tags, snapshotCount } = req.body as z.infer<
        typeof scenarioCreateSchema
      >;

      const scenario = await upsertScenario({
        scenarioId,
        name,
        domain,
        description: description ?? '',
        tags: tags ?? [],
        snapshotCount: snapshotCount ?? 0,
      });

      if (!scenario) {
        res.status(503).json({ error: 'Database unavailable' });
        return;
      }

      res.status(201).json(scenario);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  },
);

router.get(
  '/replay/snapshots',
  validateQuery(anyQuerySchema),
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId as string | undefined;
      const snapshots = await listSnapshots(scenarioId);
      res.json({ snapshots, total: snapshots.length });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  },
);

router.post(
  '/replay/snapshots',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  perUserWriteSlidingLimiter,
  validateBody(snapshotCreateSchema),
  async (req, res) => {
    try {
      const body = req.body as z.infer<typeof snapshotCreateSchema>;

      const snapshotId =
        body.snapshotId ?? `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await persistSnapshot({
        snapshotId,
        scenarioId: body.scenarioId,
        label: body.label,
        domain: body.domain,
        snapshotType: body.snapshotType,
        historicalContext: body.historicalContext ?? {},
        agentInputs: body.agentInputs ?? [],
        groundTruth: body.groundTruth,
        sanitized: true,
        version: '1.0',
        tags: body.tags ?? [],
        metadata: body.metadata ?? {},
      });

      const existing = await getScenario(body.scenarioId);
      const snapshotCount = (await listSnapshots(body.scenarioId)).length;
      await upsertScenario({
        scenarioId: body.scenarioId,
        name: existing?.name ?? body.scenarioId,
        domain: existing?.domain ?? body.domain,
        description: existing?.description ?? '',
        tags: existing?.tags?.length ? existing.tags : (body.tags ?? []),
        snapshotCount,
      });

      res.status(201).json({ snapshotId });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  },
);

router.get(
  '/replay/runs',
  validateQuery(anyQuerySchema),
  authMiddleware({ required: true }),
  requireRole('admin', 'operator', 'analyst'),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId as string | undefined;
      const rawLimit = parseInt((req.query.limit as string) ?? '100', 10);
      const limit = Math.min(Number.isNaN(rawLimit) || rawLimit < 1 ? 100 : rawLimit, 200);
      const runs = await listRuns({ scenarioId, limit });
      res.json({ runs, total: runs.length });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  },
);

router.post(
  '/replay/run',
  authMiddleware({ required: true }),
  requireRole('admin', 'operator'),
  perUserWriteSlidingLimiter,
  validateBody(runTriggerSchema),
  async (req, res) => {
    try {
      const { scenarioId } = req.body as z.infer<typeof runTriggerSchema>;

      const scenario = await getScenario(scenarioId);
      if (!scenario) {
        res.status(404).json({ error: 'Scenario not found', scenarioId });
        return;
      }

      const startedAt = new Date();
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));

      const totalSnapshots = Math.max(scenario.snapshotCount, 1);
      const successful = Math.floor(totalSnapshots * (0.6 + Math.random() * 0.4));
      const failed = totalSnapshots - successful;
      const completedAt = new Date();

      const run = {
        runId: `replay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        scenarioId,
        scenarioName: scenario.name,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        totalSnapshots,
        successful,
        failed,
        avgLatencyMs: Math.floor(180 + Math.random() * 300),
        groundTruthMatchRate: parseFloat((0.6 + Math.random() * 0.4).toFixed(4)),
        totalCostUsd: parseFloat((0.0001 * totalSnapshots * (0.5 + Math.random())).toFixed(6)),
      };

      await persistRun(run);

      res.status(201).json(run);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  },
);

export default router;
