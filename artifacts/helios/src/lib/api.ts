const BASE = '/api/helios';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type SignalKind = 'capability' | 'market' | 'threat' | 'regulation' | 'vendor' | 'benchmark';

export interface Signal {
  id: string;
  kind: SignalKind;
  title: string;
  summary: string;
  soWhat: string;
  sourceUrl: string;
  sourceName: string;
  confidence: number;
  impactScore: number;
  entities: string[];
  claims: string[];
  affectedAgents: string[];
  createdAt: string;
  scanner: string;
}

export interface SignalsResponse {
  signals: Signal[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MythosNode {
  id: string;
  kind: 'concept' | 'repo' | 'paper' | 'vendor' | 'benchmark' | 'technique' | 'person';
  label: string;
  description: string;
  tags: string[];
  relevanceScore: number;
  linkedSignalCount: number;
}

export interface MythosEdge {
  source: string;
  target: string;
  relation: 'cites' | 'implements' | 'competes-with' | 'benchmarked-on' | 'authored-by' | 'extends';
}

export interface MythosSearchResult {
  nodes: MythosNode[];
  edges: MythosEdge[];
  query: string;
}

export interface CapabilityProposal {
  id: string;
  status: 'new' | 'accepted' | 'deferred' | 'rejected';
  title: string;
  description: string;
  rationale: string;
  targetAgent: string;
  impactArea: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  signalIds: string[];
  estimatedEffort: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalsResponse {
  proposals: CapabilityProposal[];
  total: number;
}

export interface BenchmarkScore {
  agentId: string;
  agentName: string;
  benchmark: string;
  score: number;
  sotaScore: number;
  delta: number;
  recordedAt: string;
}

export interface BenchmarkTimeSeries {
  agentId: string;
  agentName: string;
  benchmark: string;
  history: Array<{ date: string; score: number; sotaScore: number }>;
}

export interface Scanner {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  status: 'healthy' | 'degraded' | 'error' | 'idle';
  signalsToday: number;
  totalSignals: number;
  errorMessage?: string;
}

export interface RecalibrationMemo {
  id: string;
  weekOf: string;
  title: string;
  audit: string;
  blueprint: string;
  roadmap: string;
  signalCount: number;
  proposalCount: number;
  createdAt: string;
}

export const heliosApi = {
  getSignals: (params?: { kind?: SignalKind; page?: number; pageSize?: number; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.kind) qs.set('kind', params.kind);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params?.q) qs.set('q', params.q);
    return apiFetch<SignalsResponse>(`/signals?${qs}`);
  },

  searchMythos: (query: string) =>
    apiFetch<MythosSearchResult>(`/mythos/search?q=${encodeURIComponent(query)}`),

  getMythosNode: (id: string) =>
    apiFetch<{ node: MythosNode; neighbors: MythosNode[]; edges: MythosEdge[] }>(`/mythos/nodes/${id}`),

  getProposals: (status?: string) =>
    apiFetch<ProposalsResponse>(`/proposals${status ? `?status=${status}` : ''}`),

  updateProposalStatus: (id: string, status: 'accepted' | 'deferred' | 'rejected') =>
    apiFetch<{ proposal: CapabilityProposal }>(`/proposals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getBenchmarkScores: () =>
    apiFetch<{ scores: BenchmarkScore[]; timeSeries: BenchmarkTimeSeries[] }>('/benchmarks'),

  getScanners: () =>
    apiFetch<{ scanners: Scanner[] }>('/scanners'),

  toggleScanner: (id: string, enabled: boolean) =>
    apiFetch<{ scanner: Scanner }>(`/scanners/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),

  runScanner: (id: string) =>
    apiFetch<{ message: string }>(`/scanners/${id}/run`, { method: 'POST' }),

  getMemos: () =>
    apiFetch<{ memos: RecalibrationMemo[] }>('/memos'),

  getMemo: (id: string) =>
    apiFetch<{ memo: RecalibrationMemo }>(`/memos/${id}`),

  getStats: () =>
    apiFetch<{
      signalsToday: number;
      proposalsOpen: number;
      scannersActive: number;
      avgConfidence: number;
      topKinds: Array<{ kind: string; count: number }>;
    }>('/stats'),
};
