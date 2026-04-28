import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export interface LiveMetrics {
  beacon: {
    total_distress_properties: number;
    high_opportunity_properties: number;
    total_leads: number;
    total_deals: number;
    converted_deals: number;
  };
  firestorm: { open_vulnerabilities: number };
  continuum: {
    workflow_runs_30d: number;
    total_recommendations: number;
    recent_recommendations: Array<{
      id: string;
      entity_type: string;
      domain: string;
      score: number;
      title: string;
      severity: string;
      generated_at: string;
    }>;
  };
  platform: {
    audit_events_30d: number;
    generated_at: string;
  };
}

export interface LiveRecommendation {
  id: string;
  entity_type: string;
  entity_id?: string;
  domain: string;
  score: number;
  confidence: number;
  severity: string;
  title: string;
  reasoning: string;
  recommended_action: string;
  timeframe: string;
  generated_at: string;
  created_at: string;
}

export interface LiveAuditRecord {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

export interface LiveTheaterData {
  status: 'idle' | 'loading' | 'success' | 'error';
  metrics: LiveMetrics | null;
  recommendations: LiveRecommendation[];
  auditRecords: LiveAuditRecord[];
  auditTotal: number;
  auditSource: string | null;
  error: string | null;
  lastFetchedAt: string | null;
  refetch: () => void;
}

async function fetchAuditRecords(): Promise<{
  records: LiveAuditRecord[];
  total: number;
  source: string | null;
}> {
  try {
    const res = await apiRequest<{
      success: boolean;
      data: LiveAuditRecord[];
      meta: { total: number };
    }>('GET', '/api/audit/activity?limit=10');
    return { records: res.data ?? [], total: res.meta?.total ?? 0, source: '/api/audit/activity' };
  } catch {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: LiveAuditRecord[];
        meta: { total: number };
      }>('GET', '/api/core/audit?limit=10');
      return { records: res.data ?? [], total: res.meta?.total ?? 0, source: '/api/core/audit' };
    } catch {
      return { records: [], total: 0, source: null };
    }
  }
}

export function useLiveTheaterData(enabled: boolean): LiveTheaterData {
  const [status, setStatus] = useState<LiveTheaterData['status']>('idle');
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<LiveRecommendation[]>([]);
  const [auditRecords, setAuditRecords] = useState<LiveAuditRecord[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditSource, setAuditSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setStatus('loading');
    setError(null);

    async function load() {
      try {
        const [metricsRes, recsRes, auditRes] = await Promise.all([
          apiRequest<{ success: boolean; data: LiveMetrics }>('GET', '/api/core/metrics'),
          apiRequest<{ success: boolean; data: LiveRecommendation[]; meta: { total: number } }>(
            'GET',
            '/api/core/recommendations?limit=8',
          ),
          fetchAuditRecords(),
        ]);

        if (cancelled) return;

        setMetrics(metricsRes.data ?? null);
        setRecommendations(recsRes.data ?? []);
        setAuditRecords(auditRes.records);
        setAuditTotal(auditRes.total);
        setAuditSource(auditRes.source);
        setLastFetchedAt(new Date().toISOString());
        setStatus('success');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, fetchKey]);

  return {
    status,
    metrics,
    recommendations,
    auditRecords,
    auditTotal,
    auditSource,
    error,
    lastFetchedAt,
    refetch,
  };
}
