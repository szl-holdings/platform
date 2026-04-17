import type { TraceRecord } from "./schema.js";
import type { TraceStore } from "./store.js";
import { defaultTraceStore } from "./store.js";

export interface TraceQueryFilter {
  traceId?: string;
  requestId?: string;
  agentId?: string;
  workflowId?: string;
  sessionId?: string;
  userId?: string;
  domain?: string;
  entityId?: string;
  status?: TraceRecord["status"];
  hasErrors?: boolean;
  hasPolicyBlock?: boolean;
  model?: string;
  after?: string;
  before?: string;
  limit?: number;
  offset?: number;
}

export interface TraceQueryResult {
  traces: TraceRecord[];
  total: number;
  limit: number;
  offset: number;
}

export class TraceQueryEngine {
  private readonly store: TraceStore;
  private readonly entityLinks: Map<string, Set<string>> = new Map();

  constructor(store: TraceStore = defaultTraceStore) {
    this.store = store;
  }

  linkEntityToTrace(traceId: string, entityId: string): void {
    const existing = this.entityLinks.get(entityId) ?? new Set<string>();
    existing.add(traceId);
    this.entityLinks.set(entityId, existing);

    const byTrace = this.entityLinks.get(`trace:${traceId}`) ?? new Set<string>();
    byTrace.add(entityId);
    this.entityLinks.set(`trace:${traceId}`, byTrace);
  }

  getEntitiesForTrace(traceId: string): string[] {
    return Array.from(this.entityLinks.get(`trace:${traceId}`) ?? []);
  }

  getTracesForEntity(entityId: string): string[] {
    return Array.from(this.entityLinks.get(entityId) ?? []);
  }

  query(filter: TraceQueryFilter = {}): TraceQueryResult {
    const {
      traceId,
      requestId,
      agentId,
      workflowId,
      sessionId,
      userId,
      domain,
      entityId,
      status,
      hasErrors,
      hasPolicyBlock,
      model,
      after,
      before,
      limit = 50,
      offset = 0,
    } = filter;

    let results = this.store.list();

    if (traceId) results = results.filter((t) => t.traceId === traceId);
    if (requestId) results = results.filter((t) => t.requestId === requestId);
    if (agentId) results = results.filter((t) => t.agentId === agentId);
    if (workflowId) results = results.filter((t) => t.workflowId === workflowId);
    if (sessionId) results = results.filter((t) => t.sessionId === sessionId);
    if (domain) results = results.filter((t) => (t.metadata?.["domain"] ?? undefined) === domain);
    if (model) results = results.filter((t) => t.model === model);
    if (status) results = results.filter((t) => t.status === status);
    if (hasErrors === true) results = results.filter((t) => t.errors.length > 0);
    if (hasErrors === false) results = results.filter((t) => t.errors.length === 0);
    if (hasPolicyBlock === true) {
      results = results.filter((t) =>
        t.guardrailResults.some((g) => g.outcome === "block"),
      );
    }

    if (entityId) {
      const traceIds = this.getTracesForEntity(entityId);
      const idSet = new Set(traceIds);
      results = results.filter((t) => idSet.has(t.traceId));
    }

    if (after) {
      const afterMs = new Date(after).getTime();
      results = results.filter((t) => new Date(t.startedAt).getTime() >= afterMs);
    }
    if (before) {
      const beforeMs = new Date(before).getTime();
      results = results.filter((t) => new Date(t.startedAt).getTime() <= beforeMs);
    }

    results.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );

    const total = results.length;
    const page = results.slice(offset, offset + limit);

    return { traces: page, total, limit, offset };
  }

  getById(traceId: string): TraceRecord | undefined {
    return this.store.get(traceId);
  }
}

export const defaultQueryEngine = new TraceQueryEngine(defaultTraceStore);
