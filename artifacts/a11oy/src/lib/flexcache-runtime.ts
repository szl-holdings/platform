/**
 * Singleton FlexCache manager for the A11oy runtime.
 *
 * Sits between A11oy's UI layer and any heavy data sources (graph snapshots,
 * agent payloads, ontology slices, demo seed loaders). Tier strategy is
 * adaptive — the manager observes access patterns first, then promotes the
 * keys that are both frequently used and expensive to recompute into the
 * hot (RAM) tier.
 */

import { FlexCacheManager, type FlexCacheConfig } from '@szl-holdings/flexcache';

const A11OY_CONFIG: Partial<FlexCacheConfig> = {
  enabled: true,
  maxHotEntries: 24,
  maxWarmEntries: 96,
  // Discovery / profiling are global iteration counters (not per-key) — the
  // first N total `get` calls across the manager are observation-only, and
  // latency sampling stops after `discoveryIters + profilingIters`. This
  // mirrors FlexTensor's iteration-budget semantics.
  discoveryIters: 1,
  profilingIters: 16,
  // A11oy keys we want to manage:
  //   graph:*   — visualization snapshots (ontology, agent-viz, capability)
  //   agent:*   — agent dossiers, behaviour traces
  //   demo:*    — InvestorDemo seed loaders
  //   evidence:*— evidence-ledger queries
  includePatterns: ['graph:*', 'agent:*', 'demo:*', 'evidence:*', 'fabric:*'],
  excludePatterns: ['*:no-cache', 'auth:*'],
  strategy: 'adaptive',
  warmBackend: 'auto',
  // 5-minute TTL by default — overridable per-call by the loader's owner.
  ttlMs: 5 * 60 * 1000,
};

let _manager: FlexCacheManager | null = null;

export function getFlexCache(): FlexCacheManager {
  if (_manager == null) {
    _manager = new FlexCacheManager(A11OY_CONFIG, { dbName: 'a11oy-flexcache' });

    // Pre-warm from any persisted profile so the strategy makes good
    // decisions on the very first session of the day.
    if (typeof globalThis !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('a11oy:flexcache:profile');
        if (raw) _manager.importProfile(JSON.parse(raw));
      } catch {
        /* noop */
      }
    }

    // Persist the profile periodically so future sessions skip the cold
    // discovery window. Best-effort — quota errors are swallowed.
    if (typeof globalThis !== 'undefined' && typeof localStorage !== 'undefined') {
      const persist = () => {
        try {
          if (!_manager) return;
          localStorage.setItem('a11oy:flexcache:profile', JSON.stringify(_manager.exportProfile()));
        } catch {
          /* noop */
        }
      };
      _manager.subscribe(() => {
        // Coalesce — don't write on every event.
        if (_persistTimer != null) return;
        _persistTimer = setTimeout(() => {
          _persistTimer = null;
          persist();
        }, 2000);
      });
    }
  }
  return _manager;
}

let _persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Test/dev helper — drop the singleton so `getFlexCache()` re-initialises. */
export function resetFlexCacheForTests(): void {
  _manager = null;
}
