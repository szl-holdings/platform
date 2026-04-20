import {
  db,
  platformSettingsTable,
  selfHealingPatternsTable,
  selfHealingRunsTable,
} from '@szl-holdings/db';
import { and, eq, sql } from 'drizzle-orm';
import { logger } from './logger';

const SEED_MARKER_NAMESPACE = 'self_healing';
const PATTERNS_SEED_MARKER_KEY = 'patterns_demo_seeded';

/**
 * Returns true if the given platform_settings marker has been recorded,
 * indicating that the corresponding demo seed has already run for this
 * environment. The flag is namespaced so individual seeds (patterns,
 * run history, …) can be tracked independently.
 */
export async function hasSeedMarker(namespace: string, key: string): Promise<boolean> {
  const rows = await db
    .select({ id: platformSettingsTable.id })
    .from(platformSettingsTable)
    .where(and(eq(platformSettingsTable.namespace, namespace), eq(platformSettingsTable.key, key)))
    .limit(1);
  return rows.length > 0;
}

/**
 * Idempotently records that a demo seed has run. Subsequent calls are a
 * no-op thanks to the (namespace, key) unique index — even if multiple
 * processes race during first boot, exactly one row is written.
 */
export async function setSeedMarker(namespace: string, key: string): Promise<void> {
  await db
    .insert(platformSettingsTable)
    .values({
      namespace,
      key,
      value: { seededAt: new Date().toISOString() },
      valueType: 'json',
      category: 'demo_seed',
      isPublic: false,
    })
    .onConflictDoNothing();
}

export type RemediationStatus =
  | 'executing'
  | 'pending_approval'
  | 'completed'
  | 'failed'
  | 'queued';
export type StepStatus = 'done' | 'running' | 'pending' | 'failed';

export interface RemediationStep {
  id: string;
  action: string;
  status: StepStatus;
  durationMs?: number;
}

interface PlannedStep {
  id: string;
  action: string;
}

interface StartOptions {
  patternKey: string;
  service: string;
  triggerSignal: string;
  plannedSteps: PlannedStep[];
  requireApproval?: boolean;
  approver?: string | null;
  auditRef?: string;
}

interface ActiveRun {
  runKey: string;
  patternKey: string;
  service: string;
  detectedAt: number;
  steps: RemediationStep[];
  currentStepIdx: number;
  stepStartedAt: number;
  startedAt: number | null;
}

const activeRuns = new Map<string, ActiveRun>();

/**
 * Maximum wall-clock time an executing run is allowed to remain active before
 * the runtime considers it stuck and marks it failed. Pending-approval runs
 * are exempt — they wait indefinitely for a human decision.
 */
const EXECUTION_TIMEOUT_MS = 30 * 60_000;

function activeKey(patternKey: string, service: string): string {
  return `${patternKey}::${service}`;
}

let runSeq = 0;
function nextRunKey(): string {
  runSeq = (runSeq + 1) % 1_000_000;
  const ts = Date.now().toString(36).toUpperCase();
  return `REM-${ts}-${runSeq.toString().padStart(4, '0')}`;
}

function nextAuditRef(): string {
  const yr = new Date().getUTCFullYear();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AUD-${yr}-${rnd}`;
}

async function patternIsEnabled(patternKey: string): Promise<boolean | null> {
  try {
    const rows = await db
      .select({ enabled: selfHealingPatternsTable.enabled })
      .from(selfHealingPatternsTable)
      .where(eq(selfHealingPatternsTable.patternKey, patternKey))
      .limit(1);
    if (rows.length === 0) return null;
    return rows[0].enabled;
  } catch (err) {
    logger.warn({ err, patternKey }, 'self-healing-runtime: pattern lookup failed');
    return null;
  }
}

export function hasActiveRun(patternKey: string, service: string): boolean {
  return activeRuns.has(activeKey(patternKey, service));
}

export function getActiveRunKeys(): string[] {
  return [...activeRuns.keys()];
}

export async function startRemediation(opts: StartOptions): Promise<string | null> {
  const key = activeKey(opts.patternKey, opts.service);
  const existing = activeRuns.get(key);
  if (existing) return existing.runKey;

  const enabled = await patternIsEnabled(opts.patternKey);
  if (enabled === null) {
    logger.debug(
      { patternKey: opts.patternKey },
      'self-healing-runtime: unknown pattern, skipping run',
    );
    return null;
  }
  if (!enabled) {
    logger.debug(
      { patternKey: opts.patternKey },
      'self-healing-runtime: pattern disabled, skipping run',
    );
    return null;
  }

  const runKey = nextRunKey();
  const auditRef = opts.auditRef ?? nextAuditRef();
  const detectedAt = new Date();
  const status: RemediationStatus = opts.requireApproval ? 'pending_approval' : 'executing';
  const steps: RemediationStep[] = opts.plannedSteps.map((s, i) => ({
    id: s.id,
    action: s.action,
    status: opts.requireApproval ? 'pending' : i === 0 ? 'running' : 'pending',
  }));

  try {
    await db.insert(selfHealingRunsTable).values({
      runKey,
      patternKey: opts.patternKey,
      triggerSignal: opts.triggerSignal,
      service: opts.service,
      detectedAt,
      startedAt: opts.requireApproval ? null : detectedAt,
      completedAt: null,
      status,
      steps,
      mttrSavedMins: 0,
      approver: opts.approver ?? null,
      auditRef,
    });
  } catch (err) {
    logger.warn(
      { err, runKey, patternKey: opts.patternKey },
      'self-healing-runtime: insert failed',
    );
    return null;
  }

  const nowMs = Date.now();
  activeRuns.set(key, {
    runKey,
    patternKey: opts.patternKey,
    service: opts.service,
    detectedAt: detectedAt.getTime(),
    steps,
    currentStepIdx: opts.requireApproval ? -1 : 0,
    stepStartedAt: nowMs,
    startedAt: opts.requireApproval ? null : nowMs,
  });

  logger.info(
    { runKey, patternKey: opts.patternKey, service: opts.service, status },
    'self-healing-runtime: remediation run recorded',
  );
  return runKey;
}

async function persistSteps(runKey: string, steps: RemediationStep[]): Promise<void> {
  try {
    await db
      .update(selfHealingRunsTable)
      .set({ steps })
      .where(eq(selfHealingRunsTable.runKey, runKey));
  } catch (err) {
    logger.warn({ err, runKey }, 'self-healing-runtime: step persist failed');
  }
}

export async function advanceRemediation(patternKey: string, service: string): Promise<void> {
  const run = activeRuns.get(activeKey(patternKey, service));
  if (!run) return;
  if (run.currentStepIdx < 0) return;
  if (run.currentStepIdx >= run.steps.length) return;

  const now = Date.now();
  run.steps[run.currentStepIdx] = {
    ...run.steps[run.currentStepIdx],
    status: 'done',
    durationMs: now - run.stepStartedAt,
  };
  run.currentStepIdx++;
  if (run.currentStepIdx < run.steps.length) {
    run.steps[run.currentStepIdx] = {
      ...run.steps[run.currentStepIdx],
      status: 'running',
    };
    run.stepStartedAt = now;
  }
  await persistSteps(run.runKey, run.steps);
}

export async function approveRemediation(
  patternKey: string,
  service: string,
  approver: string,
): Promise<boolean> {
  const run = activeRuns.get(activeKey(patternKey, service));
  if (!run || run.currentStepIdx >= 0) return false;
  const nowMs = Date.now();
  run.currentStepIdx = 0;
  run.stepStartedAt = nowMs;
  run.startedAt = nowMs;
  if (run.steps.length > 0) {
    run.steps[0] = { ...run.steps[0], status: 'running' };
  }
  try {
    await db
      .update(selfHealingRunsTable)
      .set({
        status: 'executing',
        startedAt: new Date(nowMs),
        steps: run.steps,
        approver,
      })
      .where(eq(selfHealingRunsTable.runKey, run.runKey));
    logger.info(
      { runKey: run.runKey, patternKey, service, approver },
      'self-healing-runtime: remediation approved',
    );
    return true;
  } catch (err) {
    logger.warn({ err, runKey: run.runKey }, 'self-healing-runtime: approve failed');
    return false;
  }
}

/** Look up an active run by runKey (used by API endpoints that take :id). */
export function findActiveByRunKey(runKey: string): { patternKey: string; service: string } | null {
  for (const r of activeRuns.values()) {
    if (r.runKey === runKey) return { patternKey: r.patternKey, service: r.service };
  }
  return null;
}

/** Returns true if the active run has been executing longer than EXECUTION_TIMEOUT_MS. */
export function isExecutionExpired(
  patternKey: string,
  service: string,
  now: number = Date.now(),
): boolean {
  const run = activeRuns.get(activeKey(patternKey, service));
  if (!run || run.startedAt == null) return false;
  return now - run.startedAt > EXECUTION_TIMEOUT_MS;
}

export async function completeRemediation(
  patternKey: string,
  service: string,
  opts?: { mttrSavedMins?: number; approver?: string | null },
): Promise<void> {
  const run = activeRuns.get(activeKey(patternKey, service));
  if (!run) return;
  const now = Date.now();

  if (run.currentStepIdx >= 0 && run.currentStepIdx < run.steps.length) {
    run.steps[run.currentStepIdx] = {
      ...run.steps[run.currentStepIdx],
      status: 'done',
      durationMs: now - run.stepStartedAt,
    };
  }
  for (let i = Math.max(0, run.currentStepIdx + 1); i < run.steps.length; i++) {
    if (run.steps[i].status !== 'done') {
      run.steps[i] = { ...run.steps[i], status: 'done', durationMs: 0 };
    }
  }

  let mttrSavedMins = opts?.mttrSavedMins;
  if (mttrSavedMins == null) {
    let avg = 0;
    try {
      const aggRows = await db
        .select({
          avg: sql<number>`COALESCE(ROUND(AVG(${selfHealingRunsTable.mttrSavedMins})), 0)::int`,
        })
        .from(selfHealingRunsTable)
        .where(
          and(
            eq(selfHealingRunsTable.patternKey, patternKey),
            eq(selfHealingRunsTable.status, 'completed'),
          ),
        );
      avg = aggRows[0]?.avg ?? 0;
    } catch {
      avg = 0;
    }
    const elapsedMins = Math.max(1, Math.round((now - run.detectedAt) / 60_000));
    mttrSavedMins = Math.max(elapsedMins, avg);
  }

  try {
    await db
      .update(selfHealingRunsTable)
      .set({
        status: 'completed',
        completedAt: new Date(),
        steps: run.steps,
        mttrSavedMins,
        ...(opts?.approver ? { approver: opts.approver } : {}),
      })
      .where(eq(selfHealingRunsTable.runKey, run.runKey));
  } catch (err) {
    logger.warn({ err, runKey: run.runKey }, 'self-healing-runtime: complete failed');
  }
  activeRuns.delete(activeKey(patternKey, service));
  logger.info(
    { runKey: run.runKey, patternKey, service, mttrSavedMins },
    'self-healing-runtime: remediation completed',
  );
}

export async function failRemediation(
  patternKey: string,
  service: string,
  reason: string,
): Promise<void> {
  const run = activeRuns.get(activeKey(patternKey, service));
  if (!run) return;
  if (run.currentStepIdx >= 0 && run.currentStepIdx < run.steps.length) {
    run.steps[run.currentStepIdx] = {
      ...run.steps[run.currentStepIdx],
      status: 'failed',
      durationMs: Date.now() - run.stepStartedAt,
    };
  }
  try {
    await db
      .update(selfHealingRunsTable)
      .set({
        status: 'failed',
        completedAt: new Date(),
        steps: run.steps,
      })
      .where(eq(selfHealingRunsTable.runKey, run.runKey));
  } catch (err) {
    logger.warn({ err, runKey: run.runKey, reason }, 'self-healing-runtime: fail update error');
  }
  activeRuns.delete(activeKey(patternKey, service));
  logger.warn(
    { runKey: run.runKey, patternKey, service, reason },
    'self-healing-runtime: remediation failed',
  );
}

interface ActiveRunSummary {
  patternKey: string;
  service: string;
  runKey: string;
  awaitingApproval: boolean;
}

export function listActiveRuns(): ActiveRunSummary[] {
  return [...activeRuns.values()].map((r) => ({
    patternKey: r.patternKey,
    service: r.service,
    runKey: r.runKey,
    awaitingApproval: r.currentStepIdx < 0,
  }));
}

const SEED_PATTERN_DEFS: Array<{
  patternKey: string;
  name: string;
  type: 'restart' | 'scale' | 'failover' | 'clear_queue' | 'rollback';
  trigger: string;
  runbook: string;
  enabled: boolean;
}> = [
  {
    patternKey: 'p1',
    name: 'Service Restart on OOM',
    type: 'restart',
    trigger: 'OOM kill detected on pod',
    runbook: 'RUNBOOK-001: Drain → Restart → Health-check → Reroute',
    enabled: true,
  },
  {
    patternKey: 'p2',
    name: 'Auto-Scale on CPU Saturation',
    type: 'scale',
    trigger: 'CPU > 85% for 5 consecutive minutes',
    runbook: 'RUNBOOK-002: Scale +2 replicas → Verify HPA → Alert',
    enabled: true,
  },
  {
    patternKey: 'p3',
    name: 'DB Failover on Primary Failure',
    type: 'failover',
    trigger: 'Primary DB health check failures > 3',
    runbook: 'RUNBOOK-003: Promote replica → Update DNS → Validate',
    enabled: true,
  },
  {
    patternKey: 'p4',
    name: 'Queue Drain on Backlog Overflow',
    type: 'clear_queue',
    trigger: 'Queue depth > 50k messages for 3 min',
    runbook: 'RUNBOOK-004: Pause producers → Drain → Flush DLQ → Resume',
    enabled: true,
  },
  {
    patternKey: 'p5',
    name: 'Canary Rollback on Error Spike',
    type: 'rollback',
    trigger: 'Error rate delta > 5% vs baseline on new deploy',
    runbook: 'RUNBOOK-005: Halt canary → Shift traffic → Rollback image',
    enabled: false,
  },
];

let patternSeedPromise: Promise<void> | null = null;

/**
 * Ensures the catalog of self-healing pattern definitions exists in the
 * database. Pattern definitions are configuration (the catalog of what the
 * runtime knows how to recognize) and are safe to seed in any environment;
 * demo run history is seeded separately by the route module.
 */
export async function ensurePatternsSeeded(): Promise<void> {
  if (patternSeedPromise) return patternSeedPromise;
  patternSeedPromise = (async () => {
    try {
      // Once we've recorded that demo seeding has run for this environment,
      // never re-insert demo patterns — even if an operator has since deleted
      // some or all of them. Deletions must be respected.
      if (await hasSeedMarker(SEED_MARKER_NAMESPACE, PATTERNS_SEED_MARKER_KEY)) {
        return;
      }

      const existing = await db
        .select({ id: selfHealingPatternsTable.id })
        .from(selfHealingPatternsTable)
        .limit(1);

      if (existing.length === 0) {
        await db.insert(selfHealingPatternsTable).values(SEED_PATTERN_DEFS).onConflictDoNothing();
      }
      // Whether we just seeded an empty table or detected a pre-existing
      // seeded environment, record the marker so future calls short-circuit.
      // This makes pre-existing environments behave the same as before
      // (no re-seed) while new environments get seeded exactly once.
      await setSeedMarker(SEED_MARKER_NAMESPACE, PATTERNS_SEED_MARKER_KEY);
    } catch (err) {
      patternSeedPromise = null;
      throw err;
    }
  })();
  return patternSeedPromise;
}

/**
 * On startup, hydrate the in-memory active-run map from any rows that were
 * left in `executing` or `pending_approval` state at the time of the previous
 * shutdown. This prevents orphaned runs and keeps MTTR/success-rate stats
 * accurate across process restarts.
 */
export async function recoverActiveRuns(): Promise<number> {
  try {
    await ensurePatternsSeeded();
    const rows = await db
      .select()
      .from(selfHealingRunsTable)
      .where(sql`${selfHealingRunsTable.status} IN ('executing','pending_approval')`);
    let recovered = 0;
    for (const r of rows) {
      const steps = (r.steps ?? []) as RemediationStep[];
      let currentStepIdx = -1;
      if (r.status === 'executing') {
        currentStepIdx = steps.findIndex((s) => s.status === 'running');
        if (currentStepIdx < 0) {
          // No running step recorded — resume at the first non-done step.
          currentStepIdx = steps.findIndex((s) => s.status !== 'done');
          if (currentStepIdx < 0) currentStepIdx = Math.max(0, steps.length - 1);
          if (steps[currentStepIdx]) {
            steps[currentStepIdx] = { ...steps[currentStepIdx], status: 'running' };
          }
        }
      }
      const startedMs = r.startedAt ? r.startedAt.getTime() : null;
      activeRuns.set(activeKey(r.patternKey, r.service), {
        runKey: r.runKey,
        patternKey: r.patternKey,
        service: r.service,
        detectedAt: r.detectedAt.getTime(),
        steps,
        currentStepIdx,
        stepStartedAt: startedMs ?? r.detectedAt.getTime(),
        startedAt: startedMs,
      });
      recovered++;
    }
    if (recovered > 0) {
      logger.info({ recovered }, 'self-healing-runtime: recovered open runs from database');
    }
    return recovered;
  } catch (err) {
    logger.warn({ err }, 'self-healing-runtime: recovery failed (non-fatal)');
    return 0;
  }
}

/** Test/admin utility — clears the in-memory active-run map without touching the DB. */
export function __resetActiveRunsForTests(): void {
  activeRuns.clear();
}
