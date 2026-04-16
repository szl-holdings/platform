import type { TraceRecord } from "./schema.js";

export interface TraceStore {
  save(trace: TraceRecord): void;
  get(traceId: string): TraceRecord | undefined;
  list(filter?: { sessionId?: string; workflowId?: string; agentId?: string; status?: TraceRecord["status"] }): TraceRecord[];
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

  list(filter?: { sessionId?: string; workflowId?: string; agentId?: string; status?: TraceRecord["status"] }): TraceRecord[] {
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

export const defaultTraceStore = new InMemoryTraceStore();
