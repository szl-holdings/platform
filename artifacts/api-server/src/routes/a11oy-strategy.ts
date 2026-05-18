/**
 * A11oy Strategy Simulations — scenario catalog + run lifecycle.
 *
 * Tenant-scoped contract for headless strategy-simulation execution
 * (Task #5171). The in-app Crisis Stress Drill / Game Day surfaces are
 * gated behind the VITE_FEATURE_A11OY_STRATEGY_SIMS flag in a11oy; this
 * module is the supported API contract for callers (CI, integration
 * tests, future UIs) that want to enumerate scenarios and persist runs.
 *   GET  /a11oy/strategy/scenarios            — list catalog scenarios
 *   GET  /a11oy/strategy/scenarios/:id        — scenario detail
 *   POST /a11oy/strategy/scenarios/:id/run    — start a new run, returns runId
 *   GET  /a11oy/strategy/runs                 — list completed/active runs
 *   GET  /a11oy/strategy/runs/:runId          — fetch persisted result
 *
 * Run results are persisted in-memory keyed by tenant (bounded at 50 per
 * tenant). Deterministic seed so the same caller observes consistent
 * scenarios across reloads.
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response';

const router: IRouter = Router();

function tenantSlug(req: Request): string {
  const raw =
    (req.headers['x-tenant-id'] as string | undefined) ??
    (req.headers['x-org-id'] as string | undefined) ??
    (req as Request & { user?: { tenantId?: string; orgId?: string } }).user?.tenantId ??
    (req as Request & { user?: { tenantId?: string; orgId?: string } }).user?.orgId ??
    'demo';
  return String(raw).slice(0, 64) || 'demo';
}

interface Scenario {
  id: string;
  name: string;
  archetype: 'crisis-stress-drill' | 'game-day';
  summary: string;
  durationHours: number;
  domains: string[];
  injects: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const SCENARIOS: Scenario[] = [
  {
    id: 'ransomware-cfo',
    name: 'Ransomware — CFO',
    archetype: 'crisis-stress-drill',
    summary:
      'Finance leadership locked out mid-close. Tests payment freeze, comms cadence, and board escalation.',
    durationHours: 4,
    domains: ['security', 'finance', 'comms'],
    injects: 14,
    difficulty: 'advanced',
  },
  {
    id: 'sanctions-sweep',
    name: 'Sanctions Sweep',
    archetype: 'crisis-stress-drill',
    summary:
      'Same-day OFAC delta hits 9 in-flight deals. Tests counterparty screening + revenue hold workflows.',
    durationHours: 3,
    domains: ['compliance', 'revenue'],
    injects: 11,
    difficulty: 'intermediate',
  },
  {
    id: 'hurricane-default',
    name: 'Hurricane Default',
    archetype: 'crisis-stress-drill',
    summary:
      'Cat-4 landfall on a key supplier corridor. Tests supply-chain failover and customer comms.',
    durationHours: 6,
    domains: ['supply-chain', 'ops', 'comms'],
    injects: 18,
    difficulty: 'advanced',
  },
  {
    id: 'gameday-sev1',
    name: 'Game Day — Sev-1 Production',
    archetype: 'game-day',
    summary:
      'Multi-region production Sev-1 with cascading auth failures. Scored on detect/contain/resolve.',
    durationHours: 2,
    domains: ['platform', 'security'],
    injects: 9,
    difficulty: 'intermediate',
  },
  {
    id: 'gameday-data-leak',
    name: 'Game Day — Data Exfil',
    archetype: 'game-day',
    summary:
      'Insider exfiltration via approved tools. Scored on detection time and DLP policy execution.',
    durationHours: 2,
    domains: ['security', 'legal'],
    injects: 12,
    difficulty: 'advanced',
  },
];

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

interface RunResult {
  runId: string;
  scenarioId: string;
  tenant: string;
  startedAt: string;
  completedAt: string;
  status: 'completed' | 'aborted' | 'active';
  participants: string[];
  scores: {
    detect: number;
    contain: number;
    resolve: number;
    overall: number;
    grade: Grade;
  };
  injectsFired: number;
  injectsResolved: number;
  missedSteps: string[];
  notes: string;
}

const RUNS: Map<string, RunResult[]> = new Map();

function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function gradeFor(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function pushRun(tenant: string, run: RunResult): void {
  const list = RUNS.get(tenant) ?? [];
  list.unshift(run);
  if (list.length > 50) list.length = 50;
  RUNS.set(tenant, list);
}

router.get('/scenarios', (req, res) => {
  try {
    return sendSuccess(res, { scenarios: SCENARIOS }, 200, { count: SCENARIOS.length });
  } catch (err) {
    return handleRouteError(res, err, 'a11oy-strategy:list-scenarios');
  }
});

router.get('/scenarios/:id', (req, res) => {
  try {
    const found = SCENARIOS.find((s) => s.id === req.params.id);
    if (!found) return sendNotFound(res, 'Scenario');
    return sendSuccess(res, { scenario: found });
  } catch (err) {
    return handleRouteError(res, err, 'a11oy-strategy:scenario-detail');
  }
});

const runSchema = z.object({
  participants: z.array(z.string().min(1).max(120)).max(20).optional(),
  notes: z.string().max(500).optional(),
});

router.post('/scenarios/:id/run', (req, res) => {
  try {
    const scenario = SCENARIOS.find((s) => s.id === req.params.id);
    if (!scenario) return sendNotFound(res, 'Scenario');
    const parsed = runSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendBadRequest(res, 'Invalid run payload', parsed.error.flatten());
    }
    const tenant = tenantSlug(req);
    const runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const seed = fnv1a(`${tenant}|${scenario.id}|${runId}`);
    const detect = 55 + (seed % 40);
    const contain = 50 + ((seed >> 4) % 45);
    const resolve = 50 + ((seed >> 8) % 45);
    const overall = Math.round((detect * 0.4 + contain * 0.3 + resolve * 0.3));
    const startedAt = new Date(Date.now() - scenario.durationHours * 3600 * 1000).toISOString();
    const completedAt = new Date().toISOString();
    const missedCount = Math.max(0, scenario.injects - Math.floor(scenario.injects * (overall / 100)));
    const result: RunResult = {
      runId,
      scenarioId: scenario.id,
      tenant,
      startedAt,
      completedAt,
      status: 'completed',
      participants: parsed.data.participants ?? ['operator@demo'],
      scores: { detect, contain, resolve, overall, grade: gradeFor(overall) },
      injectsFired: scenario.injects,
      injectsResolved: scenario.injects - missedCount,
      missedSteps: Array.from({ length: missedCount }, (_, i) => `inject-${i + 1}`),
      notes: parsed.data.notes ?? '',
    };
    pushRun(tenant, result);
    return sendSuccess(res, { run: result }, 201, { persisted: true });
  } catch (err) {
    return handleRouteError(res, err, 'a11oy-strategy:start-run');
  }
});

router.get('/runs', (req, res) => {
  try {
    const tenant = tenantSlug(req);
    const list = RUNS.get(tenant) ?? [];
    return sendSuccess(res, { runs: list }, 200, { count: list.length, tenant });
  } catch (err) {
    return handleRouteError(res, err, 'a11oy-strategy:list-runs');
  }
});

router.get('/runs/:runId', (req, res) => {
  try {
    const tenant = tenantSlug(req);
    const list = RUNS.get(tenant) ?? [];
    const found = list.find((r) => r.runId === req.params.runId);
    if (!found) return sendNotFound(res, 'Run');
    return sendSuccess(res, { run: found });
  } catch (err) {
    return handleRouteError(res, err, 'a11oy-strategy:run-detail');
  }
});

export default router;
