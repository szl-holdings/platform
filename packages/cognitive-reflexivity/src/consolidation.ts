/**
 * Memory consolidation cycle — moves cognitive insights through the
 * working → episodic → semantic memory tiers.
 *
 * Pure logic; the api-server passes in a MemoryStoreLike adapter so we
 * don't take a hard dependency on memory-fabric here. The default
 * adapter is in-memory and useful for tests + local runs.
 */

export interface MemoryEntryLike {
  id: string;
  tier: 'working' | 'episodic' | 'semantic';
  key: string;
  payload: unknown;
  createdAt: string;
  reinforcedCount?: number;
}

export interface MemoryStoreLike {
  list(tier: MemoryEntryLike['tier']): Promise<MemoryEntryLike[]> | MemoryEntryLike[];
  promote(
    id: string,
    toTier: MemoryEntryLike['tier'],
  ): Promise<MemoryEntryLike | null> | MemoryEntryLike | null;
  remove(id: string): Promise<void> | void;
}

export interface ConsolidationConfig {
  workingMaxAgeMinutes: number;
  episodicReinforceFloor: number; // promotion to semantic at >= this count
  semanticDedupKeyPrefixes?: string[];
}

export const DEFAULT_CONSOLIDATION: ConsolidationConfig = {
  workingMaxAgeMinutes: 60, // 1h working window
  episodicReinforceFloor: 3, // 3 occurrences → semantic
};

export interface ConsolidationResult {
  promotedToEpisodic: number;
  promotedToSemantic: number;
  expired: number;
  inspectedAt: string;
}

export async function runConsolidationCycle(
  store: MemoryStoreLike,
  config: ConsolidationConfig = DEFAULT_CONSOLIDATION,
): Promise<ConsolidationResult> {
  const result: ConsolidationResult = {
    promotedToEpisodic: 0,
    promotedToSemantic: 0,
    expired: 0,
    inspectedAt: new Date().toISOString(),
  };

  const cutoff = Date.now() - config.workingMaxAgeMinutes * 60 * 1000;

  // working → episodic: anything older than cutoff that has been reinforced
  // at least once gets promoted; otherwise it expires.
  const working = await store.list('working');
  for (const entry of working) {
    const ageMs = Date.parse(entry.createdAt);
    if (Number.isNaN(ageMs)) continue;
    if (ageMs > cutoff) continue;
    if ((entry.reinforcedCount ?? 0) >= 1) {
      const promoted = await store.promote(entry.id, 'episodic');
      if (promoted) result.promotedToEpisodic++;
    } else {
      await store.remove(entry.id);
      result.expired++;
    }
  }

  // episodic → semantic: any episodic memory whose reinforcedCount has
  // reached the floor gets promoted to semantic.
  const episodic = await store.list('episodic');
  for (const entry of episodic) {
    if ((entry.reinforcedCount ?? 0) >= config.episodicReinforceFloor) {
      const promoted = await store.promote(entry.id, 'semantic');
      if (promoted) result.promotedToSemantic++;
    }
  }

  return result;
}

/** A trivial in-memory store, useful for tests and the api-server bootstrap. */
export class InMemoryConsolidationStore implements MemoryStoreLike {
  private entries: MemoryEntryLike[] = [];

  add(entry: MemoryEntryLike) {
    this.entries.push(entry);
  }

  list(tier: MemoryEntryLike['tier']): MemoryEntryLike[] {
    return this.entries.filter((e) => e.tier === tier);
  }

  promote(id: string, toTier: MemoryEntryLike['tier']): MemoryEntryLike | null {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    const cur = this.entries[idx];
    if (!cur) return null;
    const next: MemoryEntryLike = { ...cur, tier: toTier };
    this.entries[idx] = next;
    return next;
  }

  remove(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id);
  }

  reinforce(id: string): void {
    const idx = this.entries.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const cur = this.entries[idx];
    if (!cur) return;
    this.entries[idx] = { ...cur, reinforcedCount: (cur.reinforcedCount ?? 0) + 1 };
  }

  size(): number {
    return this.entries.length;
  }

  _all(): MemoryEntryLike[] {
    return [...this.entries];
  }
}
