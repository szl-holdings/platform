import { useState, useEffect } from 'react';

const API_BASE = '/api/a11oy';
const IS_DEMO = import.meta.env.VITE_IS_DEMO === 'true';

export function useApiData<T>(endpoint: string, demoData?: T): { data: T | null; loading: boolean; error: string | null; source: 'api' | 'demo' } {
  const [data, setData] = useState<T | null>(IS_DEMO && demoData !== undefined ? demoData : null);
  const [loading, setLoading] = useState(!IS_DEMO);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'api' | 'demo'>(IS_DEMO ? 'demo' : 'api');

  useEffect(() => {
    if (IS_DEMO) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}${endpoint}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (cancelled) return;
        if (d.ok) {
          setData(d.data);
          setSource('api');
        } else {
          setError('API error — check server status');
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message ?? 'Failed to load data');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, source };
}
