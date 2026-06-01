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

/**
 * Adapter from {@link MemoryStoreLike} to a memory-fabric MemoryStore (the
 * concrete production store is `PostgresMemoryStore`). The adapter is
 * intentionally written against a duck-typed interface so this package
 * keeps zero compile-time dependency on memory-fabric — the api-server
 * bootstrap supplies the concrete instance.
 *
 * Why an adapter rather than implementing MemoryStoreLike directly inside
 * memory-fabric: the consolidation cycle uses a deliberately narrow surface
 * ({@link MemoryStoreLike}) so the engine can be unit-tested with the
 * trivial in-memory store; the production wiring is the only place that
 * needs to know about the richer MemoryEntry shape.
 */
export interface MemoryFabricStoreLike {
  /** List entries for a tier; each entry MUST carry id/tier/key/value. */
  list(query: { tier: MemoryEntryLike['tier'] }):
    | Array<{
        id: string;
        tier: MemoryEntryLike['tier'];
        key: string;
        value?: unknown;
        freshness?: { lastUpdatedAt?: string; lastAccessedAt?: string };
        provenance?: { createdAt?: string };
        metadata?: Record<string, unknown> | null;
      }>
    | Promise<
        Array<{
          id: string;
          tier: MemoryEntryLike['tier'];
          key: string;
          value?: unknown;
          freshness?: { lastUpdatedAt?: string; lastAccessedAt?: string };
          provenance?: { createdAt?: string };
          metadata?: Record<string, unknown> | null;
        }>
      >;
  /** Get one entry by id (cache lookup). */
  get(id: string):
    | {
        id: string;
        tier: MemoryEntryLike['tier'];
        key: string;
        value?: unknown;
        domain?: string;
        confidence?: number;
        sensitivity?: string;
        provenance?: Record<string, unknown>;
        freshness?: Record<string, unknown>;
        retention?: Record<string, unknown>;
        linkedEntities?: string[];
        linkedTraces?: string[];
        linkedActions?: string[];
        tags?: string[];
        metadata?: Record<string, unknown> | null;
        scopeId?: string;
      }
    | undefined;
  /** Upsert an entry (used to persist a tier change). */
  put(entry: unknown): void;
  /** Hard-delete an entry by id. */
  delete(id: string): boolean;
}

/**
 * Wraps a memory-fabric store so the consolidation cycle can drive it via
 * the narrow {@link MemoryStoreLike} surface. Promotion is implemented as
 * "get the canonical record, change its tier, put it back" — which causes
 * the underlying store to flush a single UPSERT to Postgres on its next
 * tick. Deletion is a hard delete.
 */
export class PostgresConsolidationStore implements MemoryStoreLike {
  constructor(private readonly fabric: MemoryFabricStoreLike) {}

  async list(tier: MemoryEntryLike['tier']): Promise<MemoryEntryLike[]> {
    const rows = await Promise.resolve(this.fabric.list({ tier }));
    return rows.map((r) => {
      const reinforced = readReinforced(r.metadata);
      return {
        id: r.id,
        tier: r.tier,
        key: r.key,
        payload: r.value,
        createdAt:
          r.provenance?.createdAt ??
          r.freshness?.lastUpdatedAt ??
          new Date().toISOString(),
        ...(reinforced !== undefined ? { reinforcedCount: reinforced } : {}),
      };
    });
  }

  promote(id: string, toTier: MemoryEntryLike['tier']): MemoryEntryLike | null {
    const cur = this.fabric.get(id);
    if (!cur) return null;
    // Re-put with the new tier; the underlying store's `put` mirrors the
    // canonical domain/metadata and schedules a flush. We don't bump
    // reinforcedCount here — that's the responsibility of the
    // event-handling code that observes a memory hit.
    this.fabric.put({ ...cur, tier: toTier });
    return {
      id: cur.id,
      tier: toTier,
      key: cur.key,
      payload: cur.value,
      createdAt:
        (cur.provenance?.createdAt as string | undefined) ??
        (cur.freshness?.lastUpdatedAt as string | undefined) ??
        new Date().toISOString(),
      ...(readReinforced(cur.metadata) !== undefined
        ? { reinforcedCount: readReinforced(cur.metadata) }
        : {}),
    };
  }

  remove(id: string): void {
    this.fabric.delete(id);
  }
}

function readReinforced(
  metadata: Record<string, unknown> | null | undefined,
): number | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const v = (metadata as Record<string, unknown>).reinforcedCount;
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
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
