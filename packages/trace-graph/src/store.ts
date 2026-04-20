import type { TraceRecord } from './schema.js';

export interface TraceStore {
  save(trace: TraceRecord): void;
  get(traceId: string): TraceRecord | undefined;
  list(filter?: {
    sessionId?: string;
    workflowId?: string;
    agentId?: string;
    status?: TraceRecord['status'];
  }): TraceRecord[];
  delete(traceId: string): boolean;
  count(): number;
}

export class InMemoryTraceStore implements TraceStore {
  private readonly traces = new Map<string, TraceRecord>();

  save(trace: TraceRecord): void {
    this.traces.set(trace.traceId, { ...trace });
  }

  get(traceId: string): TraceRecord | undefined {
    return this.traces.get(traceId);
  }

  list(filter?: {
    sessionId?: string;
    workflowId?: string;
    agentId?: string;
    status?: TraceRecord['status'];
  }): TraceRecord[] {
    let results = Array.from(this.traces.values());
    if (filter?.sessionId) results = results.filter((t) => t.sessionId === filter.sessionId);
    if (filter?.workflowId) results = results.filter((t) => t.workflowId === filter.workflowId);
    if (filter?.agentId) results = results.filter((t) => t.agentId === filter.agentId);
    if (filter?.status) results = results.filter((t) => t.status === filter.status);
    return results;
  }

  delete(traceId: string): boolean {
    return this.traces.delete(traceId);
  }

  count(): number {
    return this.traces.size;
  }
}

/**
 * A TraceStore wrapper that delegates to a swappable backend. Used as the
 * process-wide `defaultTraceStore` so the API server can register a durable
 * Postgres-backed implementation at boot time without breaking existing
 * imports that hold a reference to `defaultTraceStore`.
 */
export class MutableTraceStore implements TraceStore {
  private backend: TraceStore;

  constructor(initial: TraceStore = new InMemoryTraceStore()) {
    this.backend = initial;
  }

  setBackend(store: TraceStore): void {
    this.backend = store;
  }

  getBackend(): TraceStore {
    return this.backend;
  }

  save(trace: TraceRecord): void {
    this.backend.save(trace);
  }

  get(traceId: string): TraceRecord | undefined {
    return this.backend.get(traceId);
  }

  list(filter?: {
    sessionId?: string;
    workflowId?: string;
    agentId?: string;
    status?: TraceRecord['status'];
  }): TraceRecord[] {
    return this.backend.list(filter);
  }

  delete(traceId: string): boolean {
    return this.backend.delete(traceId);
  }

  count(): number {
    return this.backend.count();
  }
}

export const defaultTraceStore: MutableTraceStore = new MutableTraceStore();
