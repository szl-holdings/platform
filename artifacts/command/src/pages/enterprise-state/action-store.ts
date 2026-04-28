import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE, POLL_INTERVAL_MS, STORE_KEY } from './constants';
import type { ActionStore, ActionStorePatch, RecDecision } from './types';

function emptyStore(): ActionStore {
  return { riskOwners: {}, riskActions: {}, oppDecisions: {}, recDecisions: {} };
}

function readCache(): ActionStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...emptyStore(), ...JSON.parse(raw) };
  } catch {}
  return emptyStore();
}

function writeCache(s: ActionStore) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {}
}

function applyPatchLocal(prev: ActionStore, patch: ActionStorePatch): ActionStore {
  const next: ActionStore = {
    riskOwners: { ...prev.riskOwners },
    riskActions: { ...prev.riskActions },
    oppDecisions: { ...prev.oppDecisions },
    recDecisions: { ...prev.recDecisions },
  };
  for (const key of ['riskOwners', 'riskActions', 'oppDecisions', 'recDecisions'] as const) {
    const slice = patch[key];
    if (!slice) continue;
    for (const [id, value] of Object.entries(slice)) {
      if (value === null || value === undefined) {
        delete (next[key] as Record<string, unknown>)[id];
      } else {
        (next[key] as Record<string, unknown>)[id] = value;
      }
    }
  }
  return next;
}

function storesEqual(a: ActionStore, b: ActionStore): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function useActionStore() {
  const [store, setStore] = useState<ActionStore>(readCache);
  const pendingRef = useRef(0);
  const streamConnectedRef = useRef(false);

  const applyServer = useCallback((server: Partial<ActionStore>) => {
    const merged = { ...emptyStore(), ...server };
    setStore((prev) => {
      if (storesEqual(prev, merged)) return prev;
      writeCache(merged);
      return merged;
    });
  }, []);

  const refresh = useCallback(async () => {
    if (pendingRef.current > 0) return;
    try {
      const r = await fetch(`${BASE}/api/action-store`, { credentials: 'include' });
      if (!r.ok) return;
      const json = await r.json();
      applyServer((json.data ?? json) as Partial<ActionStore>);
    } catch {
      /* keep cached store */
    }
  }, [applyServer]);

  useEffect(() => {
    refresh();

    let es: EventSource | null = null;
    try {
      es = new EventSource(`${BASE}/api/action-store/stream`, { withCredentials: true });
      es.addEventListener('store', (ev: MessageEvent) => {
        streamConnectedRef.current = true;
        if (pendingRef.current > 0) return;
        try {
          const data = JSON.parse(ev.data) as Partial<ActionStore>;
          applyServer(data);
        } catch {
          /* ignore malformed frame */
        }
      });
      es.onopen = () => {
        streamConnectedRef.current = true;
      };
      es.onerror = () => {
        streamConnectedRef.current = false;
      };
    } catch {
      streamConnectedRef.current = false;
    }

    const id = window.setInterval(() => {
      if (!streamConnectedRef.current) refresh();
    }, POLL_INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      if (es) es.close();
    };
  }, [refresh, applyServer]);

  const patch = useCallback((partial: ActionStorePatch) => {
    setStore((prev) => {
      const next = applyPatchLocal(prev, partial);
      writeCache(next);
      return next;
    });
    pendingRef.current += 1;
    fetch(`${BASE}/api/action-store`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json) return;
        const server = (json.data ?? json) as Partial<ActionStore>;
        const merged = { ...emptyStore(), ...server };
        setStore(merged);
        writeCache(merged);
      })
      .catch(() => {
        /* offline / network — local state retained */
      })
      .finally(() => {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
      });
  }, []);

  return { store, patch };
}

export type { RecDecision };
