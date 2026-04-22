import { useEffect, useRef, useState } from 'react';

export interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  type: string;
  description: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export function useIncidentSubscription(_options?: { active?: boolean }) {
  const [incidents, _setIncidents] = useState<Incident[]>([]);
  const [loading, _setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { incidents, loading, refetch: () => Promise.resolve() };
}
