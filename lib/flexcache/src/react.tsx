/**
 * Optional React bindings.
 *
 * The package's "react" subpath export — only pulled in when `react` is a
 * peer dependency. Server-rendered apps that don't use React can skip this
 * file entirely.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FlexCacheManager } from './manager';
import type { CacheStats, Tier, TierDecisionEvent } from './types';

const FlexCacheContext = createContext<FlexCacheManager | null>(null);

export interface FlexCacheProviderProps {
  manager: FlexCacheManager;
  children: React.ReactNode;
}

export function FlexCacheProvider({ manager, children }: FlexCacheProviderProps) {
  return (
    <FlexCacheContext.Provider value={manager}>{children}</FlexCacheContext.Provider>
  );
}

export function useFlexCacheManager(): FlexCacheManager {
  const m = useContext(FlexCacheContext);
  if (!m) throw new Error('useFlexCacheManager must be used inside <FlexCacheProvider>');
  return m;
}

export interface UseFlexCacheState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  tier: Tier | undefined;
  /** Force a re-fetch (bypasses cache for this single call). */
  refresh: () => Promise<void>;
}

export interface UseFlexCacheOptions {
  /** Skip the fetch entirely (e.g. waiting on auth). */
  enabled?: boolean;
}

/**
 * Fetch through the FlexCache manager. Re-fetches when `key` changes.
 * Loader is captured fresh on every render to avoid stale closures, but the
 * fetch is only re-fired on key change unless `refresh()` is called.
 */
export function useFlexCache<T>(
  key: string,
  loader: () => Promise<T>,
  options: UseFlexCacheOptions = {},
): UseFlexCacheState<T> {
  const manager = useFlexCacheManager();
  const enabled = options.enabled !== false;
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [state, setState] = useState<{
    data: T | undefined;
    loading: boolean;
    error: Error | undefined;
    tier: Tier | undefined;
  }>({ data: undefined, loading: enabled, error: undefined, tier: undefined });

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const result = await manager.get(key, () => loaderRef.current());
      setState({
        data: result.value,
        loading: false,
        error: undefined,
        tier: result.tier,
      });
    } catch (err) {
      setState({
        data: undefined,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
        tier: undefined,
      });
    }
  }, [manager, key]);

  useEffect(() => {
    if (!enabled) return;
    void run();
  }, [enabled, run]);

  const refresh = useCallback(async () => {
    await manager.invalidate(key);
    await run();
  }, [manager, key, run]);

  return { ...state, refresh };
}

/**
 * Live cache stats — re-reads on every tier-decision event plus a 1s tick
 * so latency and approxBytes stay fresh even when nothing's moving.
 */
export function useFlexCacheStats(intervalMs = 1000): CacheStats | undefined {
  const manager = useFlexCacheManager();
  const [stats, setStats] = useState<CacheStats | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const s = await manager.stats();
      if (!cancelled) setStats(s);
    };
    void refresh();
    const id = setInterval(refresh, intervalMs);
    const unsub = manager.subscribe(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      clearInterval(id);
      unsub();
    };
  }, [manager, intervalMs]);

  return stats;
}

/**
 * Live decision event log — keeps the most recent N events for visualisation.
 */
export function useFlexCacheEvents(maxEvents = 50): TierDecisionEvent[] {
  const manager = useFlexCacheManager();
  const [events, setEvents] = useState<TierDecisionEvent[]>([]);
  useEffect(() => {
    return manager.subscribe((e) => {
      setEvents((prev) => [e, ...prev].slice(0, maxEvents));
    });
  }, [manager, maxEvents]);
  return events;
}

/** Live profile snapshot (top N by score). Refreshes on each event. */
export function useFlexCacheProfiles(top = 20) {
  const manager = useFlexCacheManager();
  const [profiles, setProfiles] = useState(() => manager.profiles().slice(0, top));
  useEffect(() => {
    const refresh = () => setProfiles(manager.profiles().slice(0, top));
    refresh();
    return manager.subscribe(refresh);
  }, [manager, top]);
  return profiles;
}
