export { useOmniaShell, useOmniaShellSafe } from './OmniaShellProvider.js';

import { useEffect, useState } from 'react';
import type { SynthesisNarrative, WorldModelGraph } from './types.js';

const BASE_API = typeof window !== 'undefined'
  ? window.location.pathname.startsWith('/api') ? '/api' : '/api'
  : '/api';

export function useWorldModel(apiBase = BASE_API) {
  const [data, setData] = useState<WorldModelGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/omnia/graph`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: WorldModelGraph = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [apiBase]);

  return { data, loading, error };
}

export function useSynthesisNarrative(apiBase = BASE_API) {
  const [data, setData] = useState<SynthesisNarrative | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/omnia/narrative`);
        if (!res.ok) return;
        const json: SynthesisNarrative = await res.json();
        setData(json);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [apiBase]);

  return { data, loading };
}
