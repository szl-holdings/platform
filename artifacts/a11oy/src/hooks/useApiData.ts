import { useState, useEffect } from 'react';

const API_BASE = '/api/a11oy';

export function useApiData<T>(endpoint: string, fallback: T): { data: T; loading: boolean; source: 'api' | 'demo' } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'demo'>('demo');

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}${endpoint}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.ok) {
          setData(d.data);
          setSource('api');
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [endpoint]);

  return { data, loading, source };
}
