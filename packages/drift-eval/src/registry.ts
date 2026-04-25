import type {
  ChampionChallengerResult,
  DriftResult,
  EvalOutcome,
  EvalRegistry,
  EvalRegistryEntry,
  ModelSnapshot,
} from './types.js';

export class InMemoryEvalRegistry implements EvalRegistry {
  private readonly entries: EvalRegistryEntry[] = [];
  private readonly snapshots = new Map<string, ModelSnapshot>();

  async persist(entry: EvalRegistryEntry): Promise<void> {
    this.entries.push(entry);
  }

  async queryDrift(filter: {
    headName?: string;
    severity?: string;
    since?: string;
    limit?: number;
  }): Promise<DriftResult[]> {
    let results = this.entries
      .filter((e): e is Extract<EvalRegistryEntry, { type: 'drift' }> => e.type === 'drift')
      .map((e) => e.payload);

    if (filter.headName) results = results.filter((r) => r.headName === filter.headName);
    if (filter.severity) results = results.filter((r) => r.severity === filter.severity);
    if (filter.since) results = results.filter((r) => r.detectedAt >= filter.since!);
    if (filter.limit) results = results.slice(-filter.limit);
    return results;
  }

  async queryChampionChallenger(filter: {
    headName?: string;
    outcome?: EvalOutcome;
    since?: string;
    limit?: number;
  }): Promise<ChampionChallengerResult[]> {
    let results = this.entries
      .filter(
        (e): e is Extract<EvalRegistryEntry, { type: 'champion-challenger' }> =>
          e.type === 'champion-challenger',
      )
      .map((e) => e.payload);

    if (filter.headName) results = results.filter((r) => r.headName === filter.headName);
    if (filter.outcome) results = results.filter((r) => r.outcome === filter.outcome);
    if (filter.since) results = results.filter((r) => r.evaluatedAt >= filter.since!);
    if (filter.limit) results = results.slice(-filter.limit);
    return results;
  }

  async latestSnapshot(headName: string): Promise<ModelSnapshot | undefined> {
    return this.snapshots.get(headName);
  }

  async saveSnapshot(snapshot: ModelSnapshot): Promise<void> {
    this.snapshots.set(snapshot.headName, snapshot);
  }

  allEntries(): EvalRegistryEntry[] {
    return [...this.entries];
  }
}

export const globalEvalRegistry = new InMemoryEvalRegistry();
