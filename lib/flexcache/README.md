# @szl-holdings/flexcache

A tiered, self-profiling cache for browser & Node runtimes. TypeScript
adaptation of the [NVIDIA FlexTensor](https://github.com/ai-dynamo/flextensor)
offloading playbook (Apache-2.0).

## Why

Heavy app data — graph snapshots, agent payloads, ontology slices — gets
fetched, re-fetched, and held in JS heap with no awareness of access patterns.
FlexCache sits in front of those fetches and:

1. **Profiles** access — tracks call count, latency, and size per key.
2. **Tiers** — hot keys live in RAM, warm keys move to IndexedDB (or
   in-memory fallback in Node), cold keys are re-loaded from the source.
3. **Auto-promotes** based on a pluggable strategy (`greedy`, `adaptive`,
   or `knapsack`).

## Quick start

```ts
import { FlexCacheManager, defaultConfig } from '@szl-holdings/flexcache';

const cache = new FlexCacheManager({
  ...defaultConfig(),
  includePatterns: ['graph:*', 'agent:*'],
  maxHotEntries: 64,
});

const data = await cache.get('graph:capability-trajectory', () =>
  fetch('/api/graphs/capability-trajectory').then((r) => r.json()),
);

console.log(cache.stats());
// { hits: 17, misses: 3, hotSize: 12, warmSize: 4, hitRate: 0.85, ... }
```

## React

```tsx
import { useFlexCache } from '@szl-holdings/flexcache/react';

function Graph() {
  const { data, loading, tier } = useFlexCache(
    'graph:agent-viz',
    () => fetch('/api/graphs/agent-viz').then((r) => r.json()),
  );
  return loading ? 'Loading…' : <Viz data={data} servedFrom={tier} />;
}
```

## Configuration

```ts
interface FlexCacheConfig {
  enabled: boolean;             // master kill switch
  maxHotEntries: number;        // hot-tier capacity (entries)
  maxWarmEntries: number;       // warm-tier capacity (entries)
  discoveryIters: number;       // observe-only iterations before tiering
  profilingIters: number;       // sample latency for this many calls
  includePatterns: string[];    // glob-style; only matching keys are managed
  excludePatterns: string[];    // glob-style; matching keys bypass cache
  strategy: 'greedy' | 'adaptive' | 'knapsack';
  warmBackend: 'auto' | 'memory' | 'indexeddb';
  ttlMs?: number;               // optional per-entry TTL
}
```

## License

Apache-2.0 — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
