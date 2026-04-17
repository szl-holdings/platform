import type { PlanGraph } from "./types.js";
import { PlanNotFoundError } from "./types.js";

export interface PlanStoreQuery {
  agentId?: string;
  sessionId?: string;
  workflowId?: string;
  status?: PlanGraph["status"];
  parentPlanId?: string;
  /** Tenant scoping: only return plans whose `context.orgId` matches. */
  orgId?: string;
  limit?: number;
  offset?: number;
}

export interface PlanStore {
  put(plan: PlanGraph): Promise<void>;
  get(planId: string): Promise<PlanGraph | undefined>;
  list(query?: PlanStoreQuery): Promise<{ items: PlanGraph[]; total: number }>;
  delete(planId: string): Promise<void>;
  count(): Promise<number>;
}

/** In-memory store; used by tests and as the default until DB store wired. */
export class InMemoryPlanStore implements PlanStore {
  private plans = new Map<string, PlanGraph>();

  async put(plan: PlanGraph): Promise<void> {
    this.plans.set(plan.planId, { ...plan, updatedAt: Date.now() });
  }

  async get(planId: string): Promise<PlanGraph | undefined> {
    return this.plans.get(planId);
  }

  async list(query: PlanStoreQuery = {}): Promise<{ items: PlanGraph[]; total: number }> {
    let items = Array.from(this.plans.values());
    if (query.agentId) items = items.filter((p) => p.context.agentId === query.agentId);
    if (query.sessionId) items = items.filter((p) => p.context.sessionId === query.sessionId);
    if (query.workflowId) items = items.filter((p) => p.context.workflowId === query.workflowId);
    if (query.status) items = items.filter((p) => p.status === query.status);
    if (query.parentPlanId) items = items.filter((p) => p.parentPlanId === query.parentPlanId);
    if (query.orgId !== undefined) items = items.filter((p) => p.context["orgId"] === query.orgId);
    items.sort((a, b) => b.createdAt - a.createdAt);
    const total = items.length;
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    return { items: items.slice(offset, offset + limit), total };
  }

  async delete(planId: string): Promise<void> {
    if (!this.plans.delete(planId)) throw new PlanNotFoundError(planId);
  }

  async count(): Promise<number> {
    return this.plans.size;
  }
}

/** Mutable singleton wrapper so the api-server can swap to a Postgres store. */
class MutablePlanStore implements PlanStore {
  constructor(private inner: PlanStore) {}
  setBackend(store: PlanStore): void {
    this.inner = store;
  }
  put(plan: PlanGraph) { return this.inner.put(plan); }
  get(planId: string) { return this.inner.get(planId); }
  list(query?: PlanStoreQuery) { return this.inner.list(query ?? {}); }
  delete(planId: string) { return this.inner.delete(planId); }
  count() { return this.inner.count(); }
}

export const defaultPlanStore = new MutablePlanStore(new InMemoryPlanStore());
