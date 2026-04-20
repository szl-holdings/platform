/**
 * useUserPrefs — Persisted UI preferences (Task #886)
 *
 * Three-stage load to avoid first-paint flicker:
 *   1) Synchronous read from localStorage (`szl:user-prefs`) when the hook first runs
 *   2) Async fetch of `/api/settings/resolve?namespace=ui-prefs` on first mount.
 *      Server values are only applied for keys the user has not locally
 *      modified since hydration started — local edits always win.
 *   3) Each `setPref` writes through to localStorage immediately. Server
 *      writes are serialized per key (last-intent-wins) so out-of-order
 *      network replies cannot persist a stale value.
 *
 * The store is a module-level singleton with subscriptions, so any component
 * can read or write without wrapping the tree in a provider.
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'szl:user-prefs';
const NAMESPACE = 'ui-prefs';
const RESOLVE_PATH = '/api/settings/resolve?namespace=ui-prefs';
const WRITE_PATH = '/api/settings/user';

export interface UserPrefs {
  sidebarCollapsed: boolean;
  notificationSound: boolean;
  [key: string]: unknown;
}

const DEFAULTS: UserPrefs = {
  sidebarCollapsed: false,
  notificationSound: true,
};

function readLocal(): UserPrefs {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<UserPrefs>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeLocal(prefs: UserPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

let state: UserPrefs = readLocal();
const listeners = new Set<() => void>();
let hydrated = false;
let hydrationPromise: Promise<void> | null = null;
let hydrationStartedAt = 0;
const lastUserUpdate: Record<string, number> = {};
const writeChain: Record<string, Promise<void>> = {};

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): UserPrefs {
  return state;
}

function getServerSnapshot(): UserPrefs {
  return DEFAULTS;
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]!) : '';
}

async function hydrateFromServer(): Promise<void> {
  if (hydrated) return;
  if (hydrationPromise) return hydrationPromise;
  hydrationStartedAt = Date.now();
  hydrationPromise = (async () => {
    try {
      const res = await fetch(RESOLVE_PATH, { credentials: 'include' });
      if (!res.ok) return;
      const json = (await res.json()) as {
        data?: { settings?: Array<{ key: string; value: unknown }> };
        settings?: Array<{ key: string; value: unknown }>;
      };
      const settings = json.data?.settings ?? json.settings ?? [];
      const next: UserPrefs = { ...state };
      let changed = false;
      for (const s of settings) {
        // Skip keys the user has modified locally since hydration began —
        // local edits must win over the in-flight server snapshot.
        const localTs = lastUserUpdate[s.key] ?? 0;
        if (localTs >= hydrationStartedAt) continue;
        if (next[s.key] !== s.value) {
          next[s.key] = s.value;
          changed = true;
        }
      }
      if (changed) {
        state = next;
        writeLocal(state);
        emit();
      }
    } catch {
      /* offline — local cache is fine */
    } finally {
      hydrated = true;
    }
  })();
  return hydrationPromise;
}

function valueTypeOf(value: unknown): 'boolean' | 'number' | 'string' | 'json' {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  return 'json';
}

function pushToServer(key: string, value: unknown): void {
  // Serialize per-key writes so the last user intent wins regardless of
  // network reordering. We chain on the previous in-flight promise; if any
  // earlier write rejects, the chain continues with the latest value.
  const prev = writeChain[key] ?? Promise.resolve();
  const next = prev.then(
    () => doPush(key, value),
    () => doPush(key, value),
  );
  writeChain[key] = next;
  // When this is the tail of the chain, clear the slot so the map does not
  // grow unbounded across long sessions.
  void next.finally(() => {
    if (writeChain[key] === next) delete writeChain[key];
  });
}

async function doPush(key: string, value: unknown): Promise<void> {
  try {
    await fetch(WRITE_PATH, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': getCsrfToken(),
      },
      body: JSON.stringify({
        namespace: NAMESPACE,
        key,
        value,
        valueType: valueTypeOf(value),
      }),
    });
  } catch {
    /* localStorage remains the source of truth until the next change */
  }
}

export function setUserPref<K extends keyof UserPrefs>(key: K, value: UserPrefs[K]): void {
  if (state[key] === value) return;
  lastUserUpdate[String(key)] = Date.now();
  state = { ...state, [key]: value };
  writeLocal(state);
  emit();
  pushToServer(String(key), value);
}

export function getUserPref<K extends keyof UserPrefs>(key: K): UserPrefs[K] {
  return state[key];
}

export function useUserPrefs(): UserPrefs {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    void hydrateFromServer();
  }, []);
  return snap;
}

export function useUserPref<K extends keyof UserPrefs>(
  key: K,
): [UserPrefs[K], (value: UserPrefs[K]) => void] {
  const prefs = useUserPrefs();
  const setter = useCallback((value: UserPrefs[K]) => setUserPref(key, value), [key]);
  return [prefs[key], setter];
}

export function useSidebarCollapsed(): [boolean, (v: boolean) => void] {
  return useUserPref('sidebarCollapsed');
}

export function useNotificationSound(): [boolean, (v: boolean) => void] {
  return useUserPref('notificationSound');
}
