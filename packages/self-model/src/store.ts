import type {
  SelfModelState,
  IdentityProfile,
  Capability,
  ToolAccess,
  RiskTier,
  ActiveObjective,
  PolicyInForce,
  EscalationThreshold,
  HumanDependency,
  LearnedStrategy,
  RoutingPattern,
  DomainProfile,
  PerformanceRecord,
  ConfidenceProfile,
  UncertaintyProfile,
} from "./types.js";
import { NoOpPersistenceAdapter, type SelfModelPersistenceAdapter } from "./persistence.js";

const MAX_RECENT_FAILURES = 20;
const MAX_RECENT_WINS = 20;

export class SelfModelStore {
  private models: Map<string, SelfModelState> = new Map();
  private snapshots: Map<string, SelfModelState[]> = new Map();
  private adapter: SelfModelPersistenceAdapter = new NoOpPersistenceAdapter();

  /**
   * Inject a concrete persistence adapter (e.g. a DB pool adapter).
   * Call this once at application startup before creating any models.
   */
  setPersistenceAdapter(adapter: SelfModelPersistenceAdapter): void {
    this.adapter = adapter;
  }

  getPersistenceAdapter(): SelfModelPersistenceAdapter {
    return this.adapter;
  }

  create(params: {
    agentId: string;
    identityProfile: IdentityProfile;
    capabilities?: Capability[];
    toolAccess?: ToolAccess[];
    riskTier?: RiskTier;
    activeObjectives?: ActiveObjective[];
    policiesInForce?: PolicyInForce[];
    currentEnvironment?: string;
    escalationThresholds?: EscalationThreshold[];
    humanDependencies?: HumanDependency[];
  }): SelfModelState {
    const now = new Date().toISOString();
    const state: SelfModelState = {
      runtimeId: params.identityProfile.runtimeId,
      identityProfile: params.identityProfile,
      activeObjectives: params.activeObjectives ?? [],
      capabilities: params.capabilities ?? [],
      toolAccess: params.toolAccess ?? [],
      riskTier: params.riskTier ?? "internal-workflow",
      policiesInForce: params.policiesInForce ?? [],
      currentEnvironment: params.currentEnvironment ?? params.identityProfile.environment,
      recentFailures: [],
      recentWins: [],
      learnedStrategies: [],
      confidenceProfile: {
        overall: 1.0,
        byDomain: {},
        byCapability: {},
        trend: "stable",
        lastAdjustedAt: now,
      },
      uncertaintyProfile: {
        overall: 0.0,
        byDomain: {},
        flaggedAreas: [],
        lastReviewedAt: now,
      },
      preferredRoutingPatterns: [],
      escalationThresholds: params.escalationThresholds ?? [],
      humanDependencies: params.humanDependencies ?? [],
      domainStrengths: [],
      domainWeaknesses: [],
      driftScore: 0,
      failurePatternCount: 0,
      consecutiveFailures: 0,
      version: 1,
      updatedAt: now,
    };
    this.models.set(params.agentId, state);
    this.snapshots.set(params.agentId, []);
    void this.adapter.saveModel(params.agentId, state).catch(() => undefined);
    return state;
  }

  get(agentId: string): SelfModelState | undefined {
    return this.models.get(agentId);
  }

  getOrCreate(agentId: string, identityProfile: IdentityProfile): SelfModelState {
    const existing = this.models.get(agentId);
    if (existing) return existing;
    return this.create({ agentId, identityProfile });
  }

  list(): SelfModelState[] {
    return Array.from(this.models.values());
  }

  update(agentId: string, updates: Partial<SelfModelState>, changeReason?: string, triggeredBy?: string): SelfModelState {
    const current = this.models.get(agentId);
    if (!current) throw new Error(`No self-model found for agent: ${agentId}`);

    const snapshot: SelfModelState = { ...current };
    const snapshots = this.snapshots.get(agentId) ?? [];
    snapshots.push(snapshot);
    this.snapshots.set(agentId, snapshots);

    const updated: SelfModelState = {
      ...current,
      ...updates,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.models.set(agentId, updated);

    void Promise.all([
      this.adapter.saveSnapshot(agentId, snapshot, changeReason, triggeredBy).catch(() => undefined),
      this.adapter.saveModel(agentId, updated).catch(() => undefined),
    ]);

    return updated;
  }

  getHistory(agentId: string): SelfModelState[] {
    return this.snapshots.get(agentId) ?? [];
  }

  async loadFromPersistence(agentId: string): Promise<SelfModelState | null> {
    const model = await this.adapter.loadModel(agentId);
    if (model) {
      this.models.set(agentId, model);
      this.snapshots.set(agentId, []);
    }
    return model;
  }

  async hydrateAll(): Promise<number> {
    const models = await this.adapter.loadAll();
    for (const model of models) {
      if (!this.models.has(model.runtimeId)) {
        this.models.set(model.runtimeId, model);
        this.snapshots.set(model.runtimeId, []);
      }
    }
    return models.length;
  }

  recordFailure(agentId: string, record: PerformanceRecord): void {
    const state = this.models.get(agentId);
    if (!state) return;
    const failures = [record, ...state.recentFailures].slice(0, MAX_RECENT_FAILURES);
    this.models.set(agentId, { ...state, recentFailures: failures });
  }

  recordWin(agentId: string, record: PerformanceRecord): void {
    const state = this.models.get(agentId);
    if (!state) return;
    const wins = [record, ...state.recentWins].slice(0, MAX_RECENT_WINS);
    this.models.set(agentId, { ...state, recentWins: wins });
  }

  addLearnedStrategy(agentId: string, strategy: LearnedStrategy): void {
    const state = this.models.get(agentId);
    if (!state) return;
    const existing = state.learnedStrategies.findIndex(s => s.strategyId === strategy.strategyId);
    let strategies: LearnedStrategy[];
    if (existing >= 0) {
      strategies = state.learnedStrategies.map((s, i) =>
        i === existing ? { ...s, reinforcedCount: s.reinforcedCount + 1 } : s,
      );
    } else {
      strategies = [strategy, ...state.learnedStrategies];
    }
    this.models.set(agentId, { ...state, learnedStrategies: strategies });
  }

  setConfidenceProfile(agentId: string, profile: ConfidenceProfile): void {
    const state = this.models.get(agentId);
    if (!state) return;
    this.models.set(agentId, { ...state, confidenceProfile: profile });
  }

  setUncertaintyProfile(agentId: string, profile: UncertaintyProfile): void {
    const state = this.models.get(agentId);
    if (!state) return;
    this.models.set(agentId, { ...state, uncertaintyProfile: profile });
  }

  updateDomainProfiles(agentId: string, strengths: DomainProfile[], weaknesses: DomainProfile[]): void {
    const state = this.models.get(agentId);
    if (!state) return;
    this.models.set(agentId, { ...state, domainStrengths: strengths, domainWeaknesses: weaknesses });
  }

  setRoutingPatterns(agentId: string, patterns: RoutingPattern[]): void {
    const state = this.models.get(agentId);
    if (!state) return;
    this.models.set(agentId, { ...state, preferredRoutingPatterns: patterns });
  }

  delete(agentId: string): boolean {
    const existed = this.models.has(agentId);
    this.models.delete(agentId);
    this.snapshots.delete(agentId);
    return existed;
  }

  getStats(): {
    totalModels: number;
    totalSnapshots: number;
    agents: string[];
  } {
    let totalSnapshots = 0;
    for (const snaps of this.snapshots.values()) {
      totalSnapshots += snaps.length;
    }
    return {
      totalModels: this.models.size,
      totalSnapshots,
      agents: Array.from(this.models.keys()),
    };
  }
}

export const defaultSelfModelStore = new SelfModelStore();
