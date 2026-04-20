import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = '/api';

export type AgentHealthStatus = 'healthy' | 'degraded' | 'offline';

export interface AgentStatusMetrics {
  totalAgents: number;
  activeAgents: number;
  avgSuccessRate: number;
  avgLatencyMs: number;
  status: AgentHealthStatus;
  lastFetched: Date | null;
}

export interface DomainInsight {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  severity: string;
  domain: string;
  recommendedAction?: string;
  enrichedAt: string;
  agentId?: string;
  signalType?: string;
  sourceVenture?: string;
}

export interface MeshSignal {
  id: string;
  targetVenture: string;
  sourceVenture: string;
  severity: string;
  title: string;
  confidence: number;
  detectedAt: string;
  signalType?: string;
}

export interface AgentTrace {
  id: string;
  agentId: string;
  status: string;
  latencyMs: number;
  input?: string;
  startedAt: string;
}

const SESSION_CACHE: Map<string, { data: unknown; ts: number }> = new Map();
const CACHE_TTL_MS = 30_000;

async function apiFetch<T>(path: string, ttlMs = CACHE_TTL_MS): Promise<T | null> {
  const cached = SESSION_CACHE.get(path);
  if (cached && Date.now() - cached.ts < ttlMs) return cached.data as T;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as T;
    SESSION_CACHE.set(path, { data, ts: Date.now() });
    return data;
  } catch {
    return null;
  }
}

export function useAgentStatus(
  pollIntervalMs = 30_000,
): AgentStatusMetrics & { refresh: () => void } {
  const [metrics, setMetrics] = useState<AgentStatusMetrics>({
    totalAgents: 0,
    activeAgents: 0,
    avgSuccessRate: 0,
    avgLatencyMs: 0,
    status: 'offline',
    lastFetched: null,
  });

  const fetch_ = useCallback(async () => {
    const data = await apiFetch<{ overall: Record<string, number> }>(
      '/ai/mastra/agentops/metrics?windowHours=1',
    );
    if (!data) return;
    const o = data.overall ?? {};
    const healthy = o.healthyAgents ?? 0;
    const degraded = o.degradedAgents ?? 0;
    const breached = o.breachedAgents ?? 0;
    const total = healthy + degraded + breached;
    setMetrics({
      totalAgents: total,
      activeAgents: healthy + degraded,
      avgSuccessRate: o.avgSuccessRate ?? 0,
      avgLatencyMs: o.avgLatencyMs ?? 0,
      status: total === 0 ? 'offline' : breached > 0 || degraded > 0 ? 'degraded' : 'healthy',
      lastFetched: new Date(),
    });
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, pollIntervalMs);
    return () => clearInterval(t);
  }, [fetch_, pollIntervalMs]);

  return { ...metrics, refresh: fetch_ };
}

export function useDomainInsights(
  domain: string,
  limit = 5,
  pollIntervalMs = 60_000,
): { insights: DomainInsight[]; isLoading: boolean; isStale: boolean; refresh: () => void } {
  const [insights, setInsights] = useState<DomainInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const fetch_ = useCallback(async () => {
    const data = await apiFetch<{ insights: DomainInsight[] }>(
      `/intelligence-mesh/insights?domain=${domain}&limit=${limit}`,
    );
    if (data && Array.isArray(data.insights) && data.insights.length > 0) {
      setInsights(data.insights);
      setIsStale(false);
    } else {
      setIsStale(true);
    }
    setIsLoading(false);
  }, [domain, limit]);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, pollIntervalMs);
    return () => clearInterval(t);
  }, [fetch_, pollIntervalMs]);

  return { insights, isLoading, isStale, refresh: fetch_ };
}

export function useMeshFeed(opts?: {
  targetVenture?: string;
  signalType?: string;
  severity?: string;
  limit?: number;
  pollIntervalMs?: number;
}): {
  signals: MeshSignal[];
  isLoading: boolean;
  isStale: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
} {
  const { targetVenture, signalType, severity, limit = 10, pollIntervalMs = 45_000 } = opts ?? {};
  const [signals, setSignals] = useState<MeshSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const buildPath = useCallback(() => {
    const params = new URLSearchParams();
    if (targetVenture) params.set('targetVenture', targetVenture);
    if (signalType) params.set('signalType', signalType);
    if (severity) params.set('severity', severity);
    params.set('limit', String(limit));
    return `/intelligence-mesh/feed?${params.toString()}`;
  }, [targetVenture, signalType, severity, limit]);

  const fetch_ = useCallback(async () => {
    const data = await apiFetch<{ events: MeshSignal[] }>(buildPath(), 15_000);
    if (data && Array.isArray(data.events)) {
      setSignals(data.events);
      setIsStale(false);
      setLastUpdated(new Date());
    } else if (signals.length > 0) {
      setIsStale(true);
    }
    setIsLoading(false);
  }, [buildPath, signals.length]);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, pollIntervalMs);
    return () => clearInterval(t);
  }, [fetch_, pollIntervalMs]);

  return { signals, isLoading, isStale, lastUpdated, refresh: fetch_ };
}

export function useCopilotBridge(): {
  openCopilot: () => void;
  isOpen: boolean;
  close: () => void;
} {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);
    window.addEventListener('szl:open-copilot', onOpen);
    window.addEventListener('szl:close-copilot', onClose);
    return () => {
      window.removeEventListener('szl:open-copilot', onOpen);
      window.removeEventListener('szl:close-copilot', onClose);
    };
  }, []);

  const openCopilot = useCallback(() => {
    setIsOpen(true);
    window.dispatchEvent(new CustomEvent('szl:open-copilot'));
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('szl:close-copilot'));
  }, []);

  return { openCopilot, isOpen, close };
}

export function useAgentTraces(
  limit = 20,
  pollIntervalMs = 30_000,
): {
  traces: AgentTrace[];
  isLoading: boolean;
  refresh: () => void;
} {
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    const data = await apiFetch<{ traces: typeof traces }>(
      `/ai/mastra/agentops/traces?limit=${limit}`,
      15_000,
    );
    if (data && Array.isArray(data.traces)) {
      setTraces(data.traces);
    }
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, pollIntervalMs);
    return () => clearInterval(t);
  }, [fetch_, pollIntervalMs]);

  return { traces, isLoading, refresh: fetch_ };
}
