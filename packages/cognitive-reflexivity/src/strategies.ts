/**
 * Strategy store — in-memory registry of reflexive strategies, plus
 * lifecycle helpers (propose, approve, retire, reinforce).
 *
 * Persistence: this module exposes a setter for a persistence adapter
 * so api-server can wire DB persistence without coupling this package
 * to drizzle. The default adapter is a no-op.
 */

import type {
  ReflexiveStrategy,
  StrategyClass,
  StrategyDecisionTrace,
  StrategyStatus,
} from './types';
import { classifyTier } from './types';

export interface StrategyPersistenceAdapter {
  saveStrategy(strategy: ReflexiveStrategy): Promise<void> | void;
  recordDecisionTrace(trace: StrategyDecisionTrace): Promise<void> | void;
  loadAll?(): Promise<ReflexiveStrategy[]> | ReflexiveStrategy[];
}

const noopAdapter: StrategyPersistenceAdapter = {
  saveStrategy() {},
  recordDecisionTrace() {},
};

export class StrategyRegistry {
  private byId = new Map<string, ReflexiveStrategy>();
  private decisionTraces: StrategyDecisionTrace[] = [];
  private adapter: StrategyPersistenceAdapter = noopAdapter;
  private static MAX_DECISION_TRACES = 1_000;

  setPersistenceAdapter(adapter: StrategyPersistenceAdapter) {
    this.adapter = adapter;
  }

  async hydrate(): Promise<void> {
    if (!this.adapter.loadAll) return;
    const loaded = await this.adapter.loadAll();
    for (const s of loaded) this.byId.set(s.strategyId, s);
  }

  /**
   * Propose a new strategy. The tier is computed from class+confidence
   * unless the caller has overridden it. Status is always 'proposed' on
   * creation; advisory tier strategies can be auto-approved by the
   * caller via approve() immediately after.
   */
  propose(
    input: Omit<ReflexiveStrategy, 'tier' | 'status' | 'createdAt' | 'reinforcedCount'> & {
      tier?: ReflexiveStrategy['tier'];
    },
  ): ReflexiveStrategy {
    const tier = input.tier ?? classifyTier(input.class, input.confidence);
    const strategy: ReflexiveStrategy = {
      ...input,
      tier,
      status: 'proposed',
      createdAt: new Date().toISOString(),
      reinforcedCount: 0,
    };
    this.byId.set(strategy.strategyId, strategy);
    void this.adapter.saveStrategy(strategy);
    return strategy;
  }

  approve(
    strategyId: string,
    approvedBy: string,
  ): ReflexiveStrategy | null {
    const s = this.byId.get(strategyId);
    if (!s) return null;
    if (s.status !== 'proposed' && s.status !== 'approved') return s;
    const next: ReflexiveStrategy = {
      ...s,
      status: 'active',
      approvedAt: new Date().toISOString(),
      approvedBy,
    };
    this.byId.set(strategyId, next);
    void this.adapter.saveStrategy(next);
    return next;
  }

  reject(
    strategyId: string,
    rejectedBy: string,
    reason?: string,
  ): ReflexiveStrategy | null {
    const s = this.byId.get(strategyId);
    if (!s) return null;
    const next: ReflexiveStrategy = {
      ...s,
      status: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date().toISOString(),
      rejectionReason: reason,
    };
    this.byId.set(strategyId, next);
    void this.adapter.saveStrategy(next);
    return next;
  }

  retire(strategyId: string): ReflexiveStrategy | null {
    const s = this.byId.get(strategyId);
    if (!s) return null;
    const next: ReflexiveStrategy = {
      ...s,
      status: 'retired',
      retiredAt: new Date().toISOString(),
    };
    this.byId.set(strategyId, next);
    void this.adapter.saveStrategy(next);
    return next;
  }

  /**
   * Reinforce a strategy after a successful application. Refuses to mutate
   * non-active strategies — protects against accidental cross-pollination
   * from future non-router consumers calling reinforce on rejected/proposed
   * strategies.
   */
  reinforce(strategyId: string, success: boolean): ReflexiveStrategy | null {
    const s = this.byId.get(strategyId);
    if (!s) return null;
    if (s.status !== 'active') return s;
    const reinforcedCount = s.reinforcedCount + 1;
    const prevSuccesses = (s.successRate ?? 1) * s.reinforcedCount;
    const successes = prevSuccesses + (success ? 1 : 0);
    const successRate = reinforcedCount > 0 ? successes / reinforcedCount : 0;
    const next: ReflexiveStrategy = { ...s, reinforcedCount, successRate };
    this.byId.set(strategyId, next);
    void this.adapter.saveStrategy(next);
    return next;
  }

  get(strategyId: string): ReflexiveStrategy | undefined {
    return this.byId.get(strategyId);
  }

  list(filter?: {
    status?: StrategyStatus;
    klass?: StrategyClass;
    tier?: ReflexiveStrategy['tier'];
    agentId?: string;
  }): ReflexiveStrategy[] {
    let list = Array.from(this.byId.values());
    if (filter?.status) list = list.filter((s) => s.status === filter.status);
    if (filter?.klass) list = list.filter((s) => s.class === filter.klass);
    if (filter?.tier) list = list.filter((s) => s.tier === filter.tier);
    if (filter?.agentId) {
      const aid = filter.agentId;
      list = list.filter((s) => s.applicableContexts.some((c) => c.includes(aid)));
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Active strategies the router/consumers should currently apply. */
  active(): ReflexiveStrategy[] {
    return this.list({ status: 'active' });
  }

  recordDecisionTrace(trace: StrategyDecisionTrace): void {
    this.decisionTraces.push(trace);
    if (this.decisionTraces.length > StrategyRegistry.MAX_DECISION_TRACES) {
      this.decisionTraces.splice(
        0,
        this.decisionTraces.length - StrategyRegistry.MAX_DECISION_TRACES,
      );
    }
    void this.adapter.recordDecisionTrace(trace);
  }

  recentTraces(limit = 50): StrategyDecisionTrace[] {
    return this.decisionTraces.slice(-limit).reverse();
  }

  // Test-only hooks
  _reset() {
    this.byId.clear();
    this.decisionTraces = [];
    this.adapter = noopAdapter;
  }
}

export const defaultStrategyRegistry = new StrategyRegistry();
