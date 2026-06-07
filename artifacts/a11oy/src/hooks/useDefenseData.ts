import { useCallback, useEffect, useRef, useState } from 'react';

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: { message?: string };
  meta?: { timestamp?: string };
}

export interface DefenseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
}

export function useDefenseData<T>(endpoint: string, refreshIntervalMs = 30000): DefenseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ApiResponse<T>;
      if (!isMounted.current) return;
      if (json.ok && json.data) {
        setData(json.data);
        setLastUpdated(json.meta?.timestamp ?? new Date().toISOString());
        setError(null);
      } else {
        setError(json.error?.message ?? 'Unknown error');
      }
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    isMounted.current = true;
    void fetchData();
    const iv = setInterval(() => {
      void fetchData();
    }, refreshIntervalMs);
    return () => {
      isMounted.current = false;
      clearInterval(iv);
    };
  }, [fetchData, refreshIntervalMs]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, lastUpdated, refresh };
}
