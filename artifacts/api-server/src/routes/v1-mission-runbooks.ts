/**
 * Mission Runbooks — in-memory CRUD + run orchestration
 *
 * GET  /api/mission-runbooks              — list runbooks
 * POST /api/mission-runbooks              — create runbook
 * GET  /api/mission-runbooks/:id          — get runbook
 * PUT  /api/mission-runbooks/:id          — update runbook
 *
 * POST /api/mission-runbooks/alert-bus    — ingest alert event; fan-out to matching runbooks
 *
 * GET  /api/mission-runbooks/runs/list    — list runs (filter: status, runbookId)
 * POST /api/mission-runbooks/runs         — trigger a new run (manual)
 * PATCH /api/mission-runbooks/runs/:id    — update run (approve / pause / resume)
 * GET  /api/mission-runbooks/:id/revisions — list immutable version snapshots
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendBadRequest, sendCreated, sendNotFound, sendSuccess } from '../lib/api-response';

// ─── Types ───────────────────────────────────────────────────────────────────

type StepType = 'tool_call' | 'approval' | 'human_task' | 'condition' | 'parallel';
type RunStatus = 'running' | 'paused' | 'pending_approval' | 'completed' | 'failed';
type TriggerType = 'manual' | 'alert_bus' | 'schedule';

interface RunbookStep {
  id: string;
  type: StepType;
  label: string;
  description: string;
  domain?: string;
  tool?: string;
  estimatedMs: number;
  requiresApproval?: boolean;
  approver?: string;
  condition?: string;
  outputs?: string[];
}

interface Runbook {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  version: string;
  description: string;
  owner: string;
  steps: RunbookStep[];
  triggers: Array<{ type: TriggerType; rule?: string }>;
  tags: string[];
  lastUpdated: number;
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  lastRun?: number;
}

interface RunbookRun {
  id: string;
  runbookId: string;
  runbookName: string;
  status: RunStatus;
  startedAt: number;
  completedAt?: number;
  owner: string;
  currentStep: number;
  totalSteps: number;
  triggeredBy: TriggerType;
  runbookVersion: string;
  alertSource?: string;
  pendingApprover?: string;
  eventData?: unknown;
}

// ─── Revision snapshot ───────────────────────────────────────────────────────

interface RunbookRevision {
  revisionId: string;
  runbookId: string;
  version: string;
  snapshot: Runbook;
  savedAt: number;
}

// ─── In-memory stores ────────────────────────────────────────────────────────

const runbooks = new Map<string, Runbook>();
const runs = new Map<string, RunbookRun>();
const revisions = new Map<string, RunbookRevision[]>();
let runSeq = 2100;

function saveRevision(rb: Runbook): void {
  const list = revisions.get(rb.id) ?? [];
  const revisionId = `${rb.id}:${rb.version}:${Date.now()}`;
  list.push({ revisionId, runbookId: rb.id, version: rb.version, snapshot: { ...rb }, savedAt: Date.now() });
  revisions.set(rb.id, list);
}

function nextRunId(): string {
  return `run-${++runSeq}`;
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const SEED_RUNBOOKS: Runbook[] = [
  {
    id: 'rb-sanctions-001',
    name: 'Sanctions Hit Response',
    category: 'Compliance',
    categoryColor: '#ef4444',
    version: 'v2.1',
    description:
      'Cross-domain sanctions screening response — freeze assets, notify Counsel, trigger Aegis review, and generate audit trail.',
    owner: 'Compliance Desk',
    tags: ['ofac', 'sanctions', 'compliance', 'aegis', 'counsel'],
    triggers: [{ type: 'alert_bus', rule: 'aegis.sanctions.entity_hit' }, { type: 'manual' }],
    lastUpdated: Date.now() - 1000 * 60 * 60 * 24 * 3,
    totalRuns: 18,
    successRate: 100,
    avgDurationMs: 1000 * 60 * 14,
    lastRun: Date.now() - 1000 * 60 * 60 * 6,
    steps: [
      { id: 's1', type: 'tool_call', label: 'Pull Sanctions Screen Report', description: 'Aegis entity resolution — fetch OFAC/UN/EU list hits with confidence scores', domain: 'aegis', tool: 'aegis.sanctions.screen', estimatedMs: 4200, outputs: ['entity_id', 'hit_type', 'confidence'] },
      { id: 's2', type: 'condition', label: 'Confidence Threshold Check', description: 'Branch: if confidence > 85% proceed to freeze; otherwise flag for review', condition: 'confidence > 0.85', estimatedMs: 200 },
      { id: 's3', type: 'tool_call', label: 'Freeze Affected Accounts', description: 'SZL Holdings — apply regulatory hold to all accounts linked to entity', domain: 'szl-holdings', tool: 'holdings.accounts.freeze', estimatedMs: 3100, outputs: ['frozen_accounts', 'freeze_timestamp'] },
      { id: 's4', type: 'approval', label: 'Chief Compliance Officer Sign-Off', description: 'CCO must acknowledge freeze action within 30 minutes before filing', requiresApproval: true, approver: 'CCO', estimatedMs: 0 },
      { id: 's5', type: 'tool_call', label: 'Draft SAR Filing', description: 'Counsel — auto-draft Suspicious Activity Report from evidence chain', domain: 'counsel', tool: 'counsel.sar.draft', estimatedMs: 8400, outputs: ['sar_draft_id', 'filing_deadline'] },
      { id: 's6', type: 'tool_call', label: 'Notify Regulatory Relations', description: 'Pulse — brief exec team and log notification in proof chain', domain: 'pulse', tool: 'pulse.notify.regulatory', estimatedMs: 1200 },
      { id: 's7', type: 'tool_call', label: 'Generate Audit Export', description: 'Counsel — package full evidence chain with timestamps as PDF audit record', domain: 'counsel', tool: 'counsel.audit.export', estimatedMs: 2200, outputs: ['audit_pdf_url', 'proof_chain_hash'] },
    ],
  },
  {
    id: 'rb-deal-dd-001',
    name: 'Deal Due Diligence Kickoff',
    category: 'Deals',
    categoryColor: '#3b82f6',
    version: 'v3.0',
    description:
      'Orchestrated deal entry — spin up workstreams across Counsel, Aegis, Lyte, and Terra for a new acquisition target.',
    owner: 'M&A Team',
    tags: ['m&a', 'due-diligence', 'deal', 'terra', 'counsel', 'lyte'],
    triggers: [{ type: 'manual' }],
    lastUpdated: Date.now() - 1000 * 60 * 60 * 24 * 1,
    totalRuns: 34,
    successRate: 97.1,
    avgDurationMs: 1000 * 60 * 22,
    lastRun: Date.now() - 1000 * 60 * 60 * 28,
    steps: [
      { id: 's1', type: 'human_task', label: 'Enter Target Details', description: 'Deal lead inputs company name, CIK, geography, and deal structure', estimatedMs: 0, outputs: ['target_id', 'target_name', 'deal_type'] },
      { id: 's2', type: 'parallel', label: 'Launch Intelligence Workstreams', description: 'Run Aegis background check, Terra property lookup, and Lyte financial pull in parallel', estimatedMs: 18000, outputs: ['aegis_report', 'terra_assets', 'lyte_financials'] },
      { id: 's3', type: 'tool_call', label: 'Create Counsel Matter', description: 'Counsel — open new matter, assign deal team, configure review permissions', domain: 'counsel', tool: 'counsel.matter.create', estimatedMs: 2800, outputs: ['matter_id', 'matter_url'] },
      { id: 's4', type: 'tool_call', label: 'Synthesize Intelligence Brief', description: 'Pulse — generate executive intelligence summary from all workstream outputs', domain: 'pulse', tool: 'pulse.brief.synthesize', estimatedMs: 9200, outputs: ['brief_id', 'risk_score', 'opportunity_score'] },
      { id: 's5', type: 'condition', label: 'Risk Gate', description: 'If Aegis risk score > 7.0 or any sanctions flags, escalate to IC before proceeding', condition: 'risk_score < 7.0 && aegis_flags.length === 0', estimatedMs: 300 },
      { id: 's6', type: 'approval', label: 'Investment Committee Approval', description: 'IC chair must approve deal entry before document requests are sent to target', requiresApproval: true, approver: 'IC Chair', estimatedMs: 0 },
      { id: 's7', type: 'tool_call', label: 'Issue Document Request List', description: 'Counsel — generate and send standard DRL to target via secure data room', domain: 'counsel', tool: 'counsel.drl.issue', estimatedMs: 4100, outputs: ['drl_id', 'data_room_url'] },
      { id: 's8', type: 'tool_call', label: 'Create Lyte Deal Dashboard', description: 'Lyte — provision deal-specific analytics workspace with KPI tracking', domain: 'lyte', tool: 'lyte.deal.provision', estimatedMs: 3400, outputs: ['dashboard_url'] },
    ],
  },
  {
    id: 'rb-portfolio-review-001',
    name: 'Quarter-End Portfolio Review',
    category: 'Portfolio',
    categoryColor: '#d4a054',
    version: 'v4.2',
    description:
      'Automated quarter-close — aggregate performance across all domains, flag drift, generate board pack, and route for sign-off.',
    owner: 'Portfolio Management',
    tags: ['quarterly', 'board', 'reporting', 'portfolio', 'lyte', 'vessels', 'terra'],
    triggers: [{ type: 'schedule', rule: 'cron:0 6 L 3,6,9,12 *' }, { type: 'manual' }],
    lastUpdated: Date.now() - 1000 * 60 * 60 * 24 * 14,
    totalRuns: 12,
    successRate: 100,
    avgDurationMs: 1000 * 60 * 38,
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 91,
    steps: [
      { id: 's1', type: 'parallel', label: 'Harvest Domain KPIs', description: 'Pull quarter-end performance from Lyte, Vessels, Terra, and SZL Holdings simultaneously', estimatedMs: 12000, outputs: ['lyte_kpis', 'vessels_kpis', 'terra_kpis', 'holdings_kpis'] },
      { id: 's2', type: 'tool_call', label: 'Detect Portfolio Drift', description: 'Pulse — compare actuals vs targets, flag underperformers and allocation drift > 5%', domain: 'pulse', tool: 'pulse.portfolio.drift_check', estimatedMs: 6400, outputs: ['drift_entities', 'drift_severity'] },
      { id: 's3', type: 'condition', label: 'Material Drift Gate', description: 'If any domain shows > 15% drift, trigger supplementary Aegis risk scan', condition: 'max_drift_pct < 15', estimatedMs: 200 },
      { id: 's4', type: 'tool_call', label: 'Generate Board Pack', description: 'Pulse — compile PDF board pack with executive summary, charts, and variance analysis', domain: 'pulse', tool: 'pulse.board.generate', estimatedMs: 14200, outputs: ['board_pack_url', 'pack_version'] },
      { id: 's5', type: 'tool_call', label: 'Counsel Compliance Check', description: 'Counsel — verify all disclosures are complete and no material events are unreported', domain: 'counsel', tool: 'counsel.compliance.quarterly_check', estimatedMs: 7800, outputs: ['compliance_status', 'open_items'] },
      { id: 's6', type: 'approval', label: 'CFO Review & Sign-Off', description: 'CFO reviews board pack and compliance status — approved pack is locked', requiresApproval: true, approver: 'CFO', estimatedMs: 0 },
      { id: 's7', type: 'tool_call', label: 'Distribute to Board', description: 'Pulse — send approved pack to board portal and log distribution receipt', domain: 'pulse', tool: 'pulse.board.distribute', estimatedMs: 2100 },
      { id: 's8', type: 'tool_call', label: 'Archive & Proof Chain', description: 'Counsel — archive quarter-end snapshot with cryptographic proof chain', domain: 'counsel', tool: 'counsel.archive.quarterly', estimatedMs: 3200, outputs: ['archive_id', 'proof_hash'] },
    ],
  },
];

const SEED_RUNS: RunbookRun[] = [
  {
    id: 'run-2049',
    runbookId: 'rb-deal-dd-001',
    runbookName: 'Deal Due Diligence Kickoff',
    status: 'pending_approval',
    startedAt: Date.now() - 1000 * 60 * 17,
    owner: 'Sarah Chen',
    currentStep: 5,
    totalSteps: 8,
    triggeredBy: 'manual',
    runbookVersion: 'v1.3',
    pendingApprover: 'IC Chair',
  },
  {
    id: 'run-2050',
    runbookId: 'rb-sanctions-001',
    runbookName: 'Sanctions Hit Response',
    status: 'running',
    startedAt: Date.now() - 1000 * 60 * 4,
    owner: 'Alert Bus',
    currentStep: 2,
    totalSteps: 7,
    triggeredBy: 'alert_bus',
    runbookVersion: 'v2.1',
    alertSource: 'aegis.sanctions.entity_hit',
  },
  {
    id: 'run-2047',
    runbookId: 'rb-portfolio-review-001',
    runbookName: 'Quarter-End Portfolio Review',
    status: 'completed',
    startedAt: Date.now() - 1000 * 60 * 60 * 24 * 91,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 91 + 1000 * 60 * 36,
    owner: 'Portfolio Management',
    currentStep: 8,
    totalSteps: 8,
    triggeredBy: 'schedule',
    runbookVersion: 'v1.0',
  },
  {
    id: 'run-2046',
    runbookId: 'rb-deal-dd-001',
    runbookName: 'Deal Due Diligence Kickoff',
    status: 'completed',
    startedAt: Date.now() - 1000 * 60 * 60 * 28,
    completedAt: Date.now() - 1000 * 60 * 60 * 28 + 1000 * 60 * 19,
    owner: 'Marcus Webb',
    currentStep: 8,
    totalSteps: 8,
    triggeredBy: 'manual',
    runbookVersion: 'v1.3',
  },
  {
    id: 'run-2044',
    runbookId: 'rb-sanctions-001',
    runbookName: 'Sanctions Hit Response',
    status: 'completed',
    startedAt: Date.now() - 1000 * 60 * 60 * 6,
    completedAt: Date.now() - 1000 * 60 * 60 * 6 + 1000 * 60 * 12,
    owner: 'Alert Bus',
    currentStep: 7,
    totalSteps: 7,
    triggeredBy: 'alert_bus',
    runbookVersion: 'v2.0',
    alertSource: 'aegis.sanctions.entity_hit',
  },
];

for (const rb of SEED_RUNBOOKS) { runbooks.set(rb.id, rb); saveRevision(rb); }

function seedHistoricalRevision(runbookId: string, version: string, ageMs: number): void {
  const current = runbooks.get(runbookId);
  if (!current) return;
  const list = revisions.get(runbookId) ?? [];
  if (list.some((r) => r.version === version)) return;
  const snapshot: Runbook = { ...current, version, lastUpdated: Date.now() - ageMs };
  const revisionId = `${runbookId}:${version}:${Date.now() - ageMs}`;
  list.unshift({ revisionId, runbookId, version, snapshot, savedAt: Date.now() - ageMs });
  revisions.set(runbookId, list);
}

for (const r of SEED_RUNS) {
  if (r.runbookVersion) seedHistoricalRevision(r.runbookId, r.runbookVersion, Date.now() - r.startedAt);
}

for (const r of SEED_RUNS) runs.set(r.id, r);

// ─── Background run progression ──────────────────────────────────────────────
// Advance running runs one step every 6 seconds server-side so that polling
// clients see live progress without relying on client-side simulation.

setInterval(() => {
  for (const run of runs.values()) {
    if (run.status !== 'running') continue;
    const rb = runbooks.get(run.runbookId);
    if (!rb) continue;
    const nextStep = run.currentStep + 1;
    // Check if next step is an approval gate
    const nextStepDef = rb.steps[nextStep];
    if (nextStepDef?.type === 'approval') {
      runs.set(run.id, {
        ...run,
        currentStep: nextStep,
        status: 'pending_approval',
        pendingApprover: nextStepDef.approver ?? 'Approver',
      });
    } else if (nextStep >= run.totalSteps) {
      runs.set(run.id, { ...run, currentStep: run.totalSteps, status: 'completed', completedAt: Date.now() });
    } else {
      runs.set(run.id, { ...run, currentStep: nextStep });
    }
  }
}, 6000);

// ─── Router ──────────────────────────────────────────────────────────────────

const router: IRouter = Router();

// GET /v1/mission-runbooks
router.get('/', (_req: Request, res: Response) => {
  try {
    return sendSuccess(res, Array.from(runbooks.values()));
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runbooks:list');
  }
});

// ─── Run routes — registered BEFORE /:id to avoid param collision ─────────────

// GET /v1/mission-runbooks/runs/list
router.get('/runs/list', (req: Request, res: Response) => {
  try {
    let items = Array.from(runs.values()).sort((a, b) => b.startedAt - a.startedAt);
    const { status, runbookId } = req.query as { status?: string; runbookId?: string };
    if (status) items = items.filter((r) => r.status === status);
    if (runbookId) items = items.filter((r) => r.runbookId === runbookId);
    return sendSuccess(res, items);
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runs:list');
  }
});

// POST /v1/mission-runbooks/runs
router.post('/runs', (req: Request, res: Response) => {
  try {
    const { runbookId, owner } = req.body as { runbookId?: string; owner?: string };
    if (!runbookId) return sendBadRequest(res, 'runbookId is required');
    const rb = runbooks.get(runbookId);
    if (!rb) return sendNotFound(res, 'Runbook not found');

    const id = nextRunId();
    const firstStep = rb.steps[0];
    const initialStatus: RunStatus = firstStep?.type === 'approval' ? 'pending_approval' : 'running';

    const run: RunbookRun = {
      id,
      runbookId: rb.id,
      runbookName: rb.name,
      status: initialStatus,
      startedAt: Date.now(),
      owner: owner ?? 'System',
      currentStep: 0,
      totalSteps: rb.steps.length,
      triggeredBy: 'manual',
      runbookVersion: rb.version,
      pendingApprover: initialStatus === 'pending_approval' ? (firstStep?.approver ?? 'Approver') : undefined,
    };
    runs.set(id, run);

    runbooks.set(rb.id, { ...rb, totalRuns: rb.totalRuns + 1, lastRun: Date.now() });
    return sendCreated(res, run);
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runs:create');
  }
});

// PATCH /v1/mission-runbooks/runs/:runId
router.patch('/runs/:runId', (req: Request, res: Response) => {
  try {
    const run = runs.get(req.params.runId!);
    if (!run) return sendNotFound(res, 'Run not found');
    const { action } = req.body as { action?: string };

    if (action === 'approve') {
      if (run.status !== 'pending_approval') return sendBadRequest(res, 'Run is not pending approval');
      const rb = runbooks.get(run.runbookId);
      const nextStep = run.currentStep + 1;
      const nextStepDef = rb?.steps[nextStep];
      const isApproval = nextStepDef?.type === 'approval';
      const isComplete = nextStep >= run.totalSteps;
      const updated: RunbookRun = {
        ...run,
        currentStep: nextStep,
        status: isComplete ? 'completed' : isApproval ? 'pending_approval' : 'running',
        completedAt: isComplete ? Date.now() : undefined,
        pendingApprover: isApproval ? (nextStepDef?.approver ?? 'Approver') : undefined,
      };
      runs.set(run.id, updated);
      return sendSuccess(res, updated);
    }

    if (action === 'pause') {
      const updated = { ...run, status: 'paused' as RunStatus };
      runs.set(run.id, updated);
      return sendSuccess(res, updated);
    }

    if (action === 'resume') {
      const updated = { ...run, status: 'running' as RunStatus };
      runs.set(run.id, updated);
      return sendSuccess(res, updated);
    }

    return sendBadRequest(res, 'Unknown action. Valid: approve | pause | resume');
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runs:patch');
  }
});

// POST /v1/mission-runbooks/alert-bus
// Accepts an inbound alert event; fans out to every runbook whose trigger
// rule matches, creating one run per matched runbook.
router.post('/alert-bus', (req: Request, res: Response) => {
  try {
    const { rule, eventData } = req.body as { rule?: string; eventData?: unknown };
    if (!rule || typeof rule !== 'string') {
      return sendBadRequest(res, '"rule" (string) is required');
    }

    const created: RunbookRun[] = [];
    for (const rb of runbooks.values()) {
      const alertTrigger = rb.triggers.find((t) => t.type === 'alert_bus');
      if (!alertTrigger) continue;
      if (alertTrigger.rule && alertTrigger.rule !== rule) continue;

      const id = nextRunId();
      const firstStep = rb.steps[0];
      const initialStatus: RunStatus = firstStep?.type === 'approval' ? 'pending_approval' : 'running';
      const run: RunbookRun = {
        id,
        runbookId: rb.id,
        runbookName: rb.name,
        status: initialStatus,
        startedAt: Date.now(),
        owner: 'Alert Bus',
        currentStep: 0,
        totalSteps: rb.steps.length,
        triggeredBy: 'alert_bus',
        runbookVersion: rb.version,
        pendingApprover: initialStatus === 'pending_approval' ? (firstStep?.approver ?? 'Approver') : undefined,
        eventData,
      };
      runs.set(id, run);
      runbooks.set(rb.id, { ...rb, totalRuns: rb.totalRuns + 1, lastRun: Date.now() });
      created.push(run);
    }

    return sendCreated(res, { matched: created.length, runs: created });
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runbooks:alert-bus');
  }
});

// ─── Runbook CRUD (after /runs/* to avoid collision) ─────────────────────────

// GET /v1/mission-runbooks/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const rb = runbooks.get(req.params.id!);
    if (!rb) return sendNotFound(res, 'Runbook not found');
    return sendSuccess(res, rb);
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runbooks:get');
  }
});

// POST /v1/mission-runbooks
router.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<Runbook>;
    if (!body.name || typeof body.name !== 'string') {
      return sendBadRequest(res, 'name is required');
    }
    const id = `rb-${Date.now()}`;
    const now = Date.now();
    const rb: Runbook = {
      id,
      name: body.name,
      category: body.category ?? 'Custom',
      categoryColor: body.categoryColor ?? '#8b5cf6',
      version: body.version ?? 'v1.0',
      description: body.description ?? '',
      owner: body.owner ?? 'Unknown',
      steps: Array.isArray(body.steps) ? body.steps : [],
      triggers: Array.isArray(body.triggers) ? body.triggers : [{ type: 'manual' }],
      tags: Array.isArray(body.tags) ? body.tags : [],
      lastUpdated: now,
      totalRuns: 0,
      successRate: 100,
      avgDurationMs: 0,
    };
    runbooks.set(id, rb);
    return sendCreated(res, rb);
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runbooks:create');
  }
});

// PUT /v1/mission-runbooks/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const existing = runbooks.get(req.params.id!);
    if (!existing) return sendNotFound(res, 'Runbook not found');
    // Snapshot the current version before overwriting (immutable revision history)
    saveRevision(existing);
    const body = req.body as Partial<Runbook>;
    const updated: Runbook = { ...existing, ...body, id: existing.id, lastUpdated: Date.now() };
    runbooks.set(existing.id, updated);
    return sendSuccess(res, updated);
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runbooks:update');
  }
});

// GET /api/mission-runbooks/:id/snapshot?version=vX.X
// Returns the exact runbook definition at a given version (from revision history).
// Falls back to current definition if no version query param is supplied.
router.get('/:id/snapshot', (req: Request, res: Response) => {
  try {
    const rb = runbooks.get(req.params.id!);
    if (!rb) return sendNotFound(res, 'Runbook not found');
    const version = req.query.version as string | undefined;
    if (!version) return sendSuccess(res, rb);
    const list = revisions.get(rb.id) ?? [];
    // Find the most recent revision snapshot that matches the requested version
    const rev = [...list].reverse().find((r) => r.version === version);
    if (!rev) {
      // If the requested version matches the current version, return current
      if (rb.version === version) return sendSuccess(res, rb);
      return sendNotFound(res, `Revision ${version} not found for runbook ${rb.id}`);
    }
    return sendSuccess(res, rev.snapshot);
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runbooks:snapshot');
  }
});

// GET /api/mission-runbooks/:id/revisions
router.get('/:id/revisions', (req: Request, res: Response) => {
  try {
    const rb = runbooks.get(req.params.id!);
    if (!rb) return sendNotFound(res, 'Runbook not found');
    const list = (revisions.get(rb.id) ?? []).map((r) => ({
      revisionId: r.revisionId,
      runbookId: r.runbookId,
      version: r.version,
      savedAt: r.savedAt,
      stepCount: r.snapshot.steps.length,
    }));
    return sendSuccess(res, { runbookId: rb.id, revisions: list });
  } catch (err) {
    return handleRouteError(res, err, 'v1-mission-runbooks:revisions');
  }
});

export default router;
