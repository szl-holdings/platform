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

  /**
   * Approve a strategy. For most tiers a single operator signature
   * activates the strategy. For `dual-approved` tier strategies (the
   * highest-impact self-modifications: detection floor changes,
   * low-confidence router constraints) two distinct operators must
   * sign. The first call records `firstApprovedBy` and flips the
   * status to `approved` (a holding state); the second call from a
   * *different* operator activates it.
   *
   * Returns `{ ok: false, reason }` for governance failures rather
   * than silently no-op'ing so the route handler can surface the
   * reason to the operator.
   */
  approve(
    strategyId: string,
    approvedBy: string,
  ): { ok: true; strategy: ReflexiveStrategy } | { ok: false; reason: string; strategy?: ReflexiveStrategy } {
    const s = this.byId.get(strategyId);
    if (!s) return { ok: false, reason: 'NOT_FOUND' };
    if (s.status === 'rejected' || s.status === 'retired') {
      return { ok: false, reason: `STRATEGY_${s.status.toUpperCase()}`, strategy: s };
    }
    if (s.status === 'active') {
      // Idempotent: already active. Return the existing record.
      return { ok: true, strategy: s };
    }

    const nowIso = new Date().toISOString();

    if (s.tier === 'dual-approved') {
      // First signature: hold at 'approved' until a second, distinct
      // operator co-signs. This is the dual-approval gate.
      if (s.status === 'proposed') {
        const next: ReflexiveStrategy = {
          ...s,
          status: 'approved',
          firstApprovedBy: approvedBy,
          firstApprovedAt: nowIso,
        };
        this.byId.set(strategyId, next);
        void this.adapter.saveStrategy(next);
        return { ok: true, strategy: next };
      }
      // Second signature must come from a *different* operator.
      if (s.firstApprovedBy && s.firstApprovedBy === approvedBy) {
        return {
          ok: false,
          reason: 'DUAL_APPROVAL_REQUIRES_DISTINCT_OPERATOR',
          strategy: s,
        };
      }
      const next: ReflexiveStrategy = {
        ...s,
        status: 'active',
        approvedAt: nowIso,
        approvedBy,
      };
      this.byId.set(strategyId, next);
      void this.adapter.saveStrategy(next);
      return { ok: true, strategy: next };
    }

    // Single-signature tiers: advisory, supervised, operator-approved.
    // (At this point s.status has been narrowed to 'proposed' | 'approved'
    // by the earlier guards.)
    const next: ReflexiveStrategy = {
      ...s,
      status: 'active',
      approvedAt: nowIso,
      approvedBy,
    };
    this.byId.set(strategyId, next);
    void this.adapter.saveStrategy(next);
    return { ok: true, strategy: next };
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
