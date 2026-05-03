import { useState, useEffect, useCallback, useRef } from 'react';

const API = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(path: string, defaultValue?: T): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(defaultValue ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);

    fetch(`${API}${path}`, { signal: ac.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data !== undefined ? json.data : json);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
  }, [path]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDoctrineOverview() {
  return useFetch<any>('/doctrine/overview');
}

export function useConstitutions() {
  return useFetch<any[]>('/doctrine/constitutions', []);
}

export function useBehavioralAudits() {
  return useFetch<any[]>('/doctrine/behavioral-audits', []);
}

export function useWelfare() {
  return useFetch<any[]>('/doctrine/welfare', []);
}

export function useRedTeamProbes() {
  return useFetch<any[]>('/doctrine/red-team', []);
}

export function useRewardHacking() {
  return useFetch<any[]>('/doctrine/reward-hacking', []);
}

export function useAlignmentReviews() {
  return useFetch<any[]>('/doctrine/alignment-reviews', []);
}

export function useCodeBehaviors() {
  return useFetch<any[]>('/doctrine/code-behaviors', []);
}

export function useCovenantLift() {
  return useFetch<any[]>('/doctrine/covenant-lift', []);
}

export function useRiskReports() {
  return useFetch<any[]>('/doctrine/risk-reports', []);
}

export function useSnapshots() {
  return useFetch<any[]>('/doctrine/snapshots', []);
}

export function useUserTurnSignals() {
  return useFetch<any[]>('/doctrine/user-turn-signals', []);
}

export function useCapabilitySnapshots() {
  return useFetch<any[]>('/doctrine/capability-snapshots', []);
}

export function usePartners() {
  return useFetch<any[]>('/doctrine/partners', []);
}

export function useCavdRecords() {
  return useFetch<any[]>('/doctrine/cavd-records', []);
}

export function useRobustnessSnapshots() {
  return useFetch<any[]>('/doctrine/robustness-snapshots', []);
}

export function useTransparencyReports() {
  return useFetch<any[]>('/doctrine/transparency-reports', []);
}

export function useWelfarePlaybooks() {
  return useFetch<any[]>('/doctrine/welfare-playbooks', []);
}

export function useDefenderCreditPool() {
  return useFetch<any>('/doctrine/defender-credit-pool');
}

export function useDslExamples() {
  return useFetch<any[]>('/doctrine/dsl-examples', []);
}

export function useDslSimulations() {
  return useFetch<any[]>('/doctrine/dsl-simulations', []);
}

export function useSystemCard(agentId: string) {
  return useFetch<any>(`/doctrine/system-card/${agentId}`);
}

export async function triggerReplay(snapshotId: number): Promise<any> {
  const res = await fetch(`${API}/doctrine/snapshots/${snapshotId}/replay`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function seedDoctrine(): Promise<any> {
  const res = await fetch(`${API}/doctrine/seed`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function DoctrineLoader({ loading, error, children }: { loading: boolean; error: string | null; children: React.ReactNode }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: 'var(--color-a11oy-text-ghost, #8a8a8a)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', letterSpacing: '0.1em' }}>LOADING DOCTRINE DATA…</div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', color: '#e05050' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>DOCTRINE ERROR</div>
          <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', color: 'var(--color-a11oy-text-ghost, #8a8a8a)' }}>{error}</div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
