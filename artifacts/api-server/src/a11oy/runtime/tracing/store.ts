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

export function createTrace(opts: { runId?: string; entityId: string; entityType: string }): string {
  const traceId = `trace-${randomUUID().slice(0, 8)}`;
  const runId = opts.runId ?? `run-${randomUUID().slice(0, 8)}`;
  traces.set(traceId, {
    traceId,
    runId,
    entityId: opts.entityId,
    entityType: opts.entityType,
    entries: [],
    startedAt: new Date().toISOString(),
    status: 'running',
  });
  if (traces.size > MAX_TRACES) {
    const oldest = traces.keys().next().value;
    if (oldest) traces.delete(oldest);
  }
  return traceId;
}

export function appendEntry(traceId: string, entry: Omit<TraceEntry, 'traceId'>): void {
  const trace = traces.get(traceId);
  if (!trace) return;
  trace.entries.push({ ...entry, traceId });
}

export function completeTrace(traceId: string, status: 'completed' | 'failed'): void {
  const trace = traces.get(traceId);
  if (!trace) return;
  trace.status = status;
  trace.completedAt = new Date().toISOString();
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
