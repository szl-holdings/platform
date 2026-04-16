import { useEffect, useState, useRef } from "react";

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

export function useIncidentSubscription(options?: { active?: boolean }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return { incidents, loading, refetch: () => Promise.resolve() };
}
