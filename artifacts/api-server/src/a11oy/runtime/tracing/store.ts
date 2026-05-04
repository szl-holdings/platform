import type { TraceEntry } from '../types.js';
import { randomUUID } from 'node:crypto';

interface Trace {
  traceId: string;
  runId: string;
  entityId: string;
  entityType: string;
  entries: TraceEntry[];
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
}

const MAX_TRACES = 500;
const traces = new Map<string, Trace>();

async function persistTrace(trace: Trace): Promise<void> {
  try {
    const { db } = await import('@szl-holdings/db');
    const { a11oyExecutionTracesTable } = await import('@szl-holdings/db/schema');
    await db.insert(a11oyExecutionTracesTable).values({
      traceId: trace.traceId,
      runId: trace.runId,
      entityId: trace.entityId,
      entityType: trace.entityType,
      entries: trace.entries as unknown as Record<string, unknown>[],
      status: trace.status,
      startedAt: new Date(trace.startedAt),
      completedAt: trace.completedAt ? new Date(trace.completedAt) : null,
    }).onConflictDoUpdate({
      target: a11oyExecutionTracesTable.traceId,
      set: {
        entries: trace.entries as unknown as Record<string, unknown>[],
        status: trace.status,
        completedAt: trace.completedAt ? new Date(trace.completedAt) : null,
      },
    });
  } catch { /* non-fatal */ }
}

export function createTrace(opts: { runId?: string; entityId: string; entityType: string }): string {
  const traceId = `trace-${randomUUID().slice(0, 8)}`;
  const runId = opts.runId ?? `run-${randomUUID().slice(0, 8)}`;
  const trace: Trace = {
    traceId,
    runId,
    entityId: opts.entityId,
    entityType: opts.entityType,
    entries: [],
    startedAt: new Date().toISOString(),
    status: 'running',
  };
  traces.set(traceId, trace);
  if (traces.size > MAX_TRACES) {
    const oldest = traces.keys().next().value;
    if (oldest) traces.delete(oldest);
  }
  void persistTrace(trace);
  return traceId;
}

export function appendEntry(traceId: string, entry: Omit<TraceEntry, 'traceId'>): void {
  const trace = traces.get(traceId);
  if (!trace) return;
  trace.entries.push({ ...entry, traceId });
  void persistTrace(trace);
}

export function completeTrace(traceId: string, status: 'completed' | 'failed'): void {
  const trace = traces.get(traceId);
  if (!trace) return;
  trace.status = status;
  trace.completedAt = new Date().toISOString();
  void persistTrace(trace);
}

export function getTrace(traceId: string): Trace | undefined {
  return traces.get(traceId);
}

export function listTraces(limit = 20): Trace[] {
  return [...traces.values()].slice(-limit).reverse();
}

export function exportTrace(traceId: string): Record<string, unknown> | undefined {
  const trace = traces.get(traceId);
  if (!trace) return undefined;
  return {
    traceId: trace.traceId,
    runId: trace.runId,
    entityId: trace.entityId,
    entityType: trace.entityType,
    entryCount: trace.entries.length,
    status: trace.status,
    startedAt: trace.startedAt,
    completedAt: trace.completedAt,
    totalDurationMs: trace.completedAt
      ? new Date(trace.completedAt).getTime() - new Date(trace.startedAt).getTime()
      : null,
    totalTokensUsed: trace.entries.reduce((s, e) => s + (e.tokensUsed ?? 0), 0),
    totalCostEstimateUsd: trace.entries.reduce((s, e) => s + (e.costEstimateUsd ?? 0), 0),
    steps: trace.entries.map((e) => ({
      name: e.name,
      entityType: e.entityType,
      status: e.status,
      durationMs: e.durationMs,
      tokensUsed: e.tokensUsed,
      timestamp: e.timestamp,
    })),
  };
}

export function buildTraceEntry(
  runId: string,
  entityId: string,
  entityType: TraceEntry['entityType'],
  name: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  status: TraceEntry['status'],
  durationMs: number,
  opts?: Partial<Pick<TraceEntry, 'errorMessage' | 'tokensUsed' | 'costEstimateUsd' | 'metadata'>>,
): Omit<TraceEntry, 'traceId'> {
  return {
    runId,
    entityId,
    entityType,
    name,
    input,
    output,
    status,
    durationMs,
    errorMessage: opts?.errorMessage,
    tokensUsed: opts?.tokensUsed,
    costEstimateUsd: opts?.costEstimateUsd,
    timestamp: new Date().toISOString(),
    metadata: opts?.metadata ?? {},
  };
}

export function hydrateTracingStore(loaded: Array<{
  traceId: string;
  runId: string;
  entityId: string;
  entityType: string;
  entries: unknown;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
}>): void {
  for (const row of loaded) {
    if (!traces.has(row.traceId)) {
      traces.set(row.traceId, {
        traceId: row.traceId,
        runId: row.runId,
        entityId: row.entityId,
        entityType: row.entityType,
        entries: Array.isArray(row.entries) ? (row.entries as TraceEntry[]) : [],
        startedAt: row.startedAt.toISOString(),
        completedAt: row.completedAt?.toISOString(),
        status: row.status as Trace['status'],
      });
    }
  }
}
