const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '');
const API = `${BASE_URL.replace(/\/aegis.*/, '')}/api`;

export interface LiveMetrics {
  arr: string;
  arrRaw: number | null;
  mrr: string;
  mrrRaw: number | null;
  mrrGrowthPct: number | null;
  customers: number | null;
  customerGrowthPct: number | null;
  nrr: number | null;
  churnRatePct: number | null;
  openCriticals: number | null;
  meanTimeToRespondMin: number | null;
  compliancePct: number | null;
  activeThreats: number | null;
  aggregateRisk: number | null;
  platformUptime: number;
  fetchedAt: string;
}

export interface DeckSnapshot {
  id: string;
  label: string;
  createdAt: string;
  metrics: LiveMetrics;
  copyOverrides: Record<string, unknown>;
}

export interface SnapshotSummary {
  id: string;
  label: string;
  createdAt: string;
  fetchedAt: string;
  arrRaw: number | null;
  arr: string;
  customers: number | null;
}

export interface ShareTokenResult {
  token: string;
  expiresAt: string;
  recipient: string;
}

export interface SharePayload {
  recipient: string;
  expiresAt: string;
  snapshot: DeckSnapshot;
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export const investorDeckApi = {
  getMetrics: () => apiFetch<LiveMetrics>('/aegis/investor/metrics'),

  createSnapshot: (label: string, copyOverrides: Record<string, unknown> = {}) =>
    apiFetch<DeckSnapshot>('/aegis/investor/snapshots', {
      method: 'POST',
      body: JSON.stringify({ label, copyOverrides }),
    }),

  listSnapshots: () => apiFetch<SnapshotSummary[]>('/aegis/investor/snapshots'),

  deleteSnapshot: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/aegis/investor/snapshots/${id}`, { method: 'DELETE' }),

  createShare: (snapshotId: string, recipient: string, ttlDays = 30) =>
    apiFetch<ShareTokenResult>('/aegis/investor/share', {
      method: 'POST',
      body: JSON.stringify({ snapshotId, recipient, ttlDays }),
    }),

  getSnapshot: (id: string) =>
    apiFetch<DeckSnapshot>(`/aegis/investor/snapshots/${id}`),

  getShare: (token: string) =>
    apiFetch<SharePayload>(`/aegis/investor/share/${token}`),
};

// ---------------------------------------------------------------------------
// Metric binding schema — documents each metric's data source, format, and fallback
// ---------------------------------------------------------------------------

export interface MetricBinding {
  key: keyof LiveMetrics;
  label: string;
  source: string;
  format: 'currency' | 'percent' | 'integer' | 'decimal' | 'text';
  fallback: string;
  description: string;
}

export const METRIC_BINDINGS: MetricBinding[] = [
  {
    key: 'arrRaw',
    label: 'ARR',
    source: 'subscriptions.price_monthly * 12 (active subscriptions)',
    format: 'currency',
    fallback: '—',
    description: 'Annual Recurring Revenue derived from sum of active subscription monthly prices × 12',
  },
  {
    key: 'mrrRaw',
    label: 'MRR',
    source: 'subscriptions.price_monthly (active subscriptions)',
    format: 'currency',
    fallback: '—',
    description: 'Monthly Recurring Revenue from sum of active subscription monthly prices',
  },
  {
    key: 'mrrGrowthPct',
    label: 'MRR Growth MoM',
    source: 'subscriptions.price_monthly (current vs. prior month)',
    format: 'percent',
    fallback: '—',
    description: 'Month-over-month MRR growth percentage',
  },
  {
    key: 'customers',
    label: 'Active Customers',
    source: 'organizations.status = active',
    format: 'integer',
    fallback: '—',
    description: 'Count of organizations with active status',
  },
  {
    key: 'nrr',
    label: 'NRR',
    source: 'subscriptions (current MRR / prior month MRR)',
    format: 'percent',
    fallback: '—',
    description: 'Net Revenue Retention = current MRR ÷ prior-month MRR × 100',
  },
  {
    key: 'churnRatePct',
    label: 'Churn Rate',
    source: 'subscriptions.canceled_at (this month) / total subscriptions',
    format: 'percent',
    fallback: '—',
    description: 'Monthly churn rate = cancellations this month ÷ total subscriptions',
  },
  {
    key: 'openCriticals',
    label: 'Open Critical Alerts',
    source: 'aegis_action_queue_items.priority = critical AND status != complete',
    format: 'integer',
    fallback: '—',
    description: 'Count of unresolved critical-priority action queue items',
  },
  {
    key: 'meanTimeToRespondMin',
    label: 'MTTR',
    source: 'aegis_soar_runs (completed, last 7 days)',
    format: 'decimal',
    fallback: '—',
    description: 'Mean time to respond in minutes for completed SOAR runs over last 7 days',
  },
  {
    key: 'compliancePct',
    label: 'Compliance Score',
    source: 'guardian_policies.enabled / total policies',
    format: 'percent',
    fallback: '—',
    description: 'Percentage of Guardian policies currently enabled',
  },
  {
    key: 'aggregateRisk',
    label: 'Aggregate Risk Score',
    source: 'derived: (openCriticals × 4 + activeThreats × 2) × 1.2',
    format: 'integer',
    fallback: '—',
    description: 'Composite risk score 0–100 from critical alerts and active threat honeypots',
  },
  {
    key: 'platformUptime',
    label: 'Platform Uptime',
    source: 'static: 99.98% (SLA target; real-time monitor integration pending)',
    format: 'percent',
    fallback: '99.98%',
    description: 'Platform availability SLA target',
  },
];

export const DECK_COPY_STORAGE_KEY = 'aegis-investor-deck-copy-v1';

export interface DeckCopyOverrides {
  [slideId: string]: {
    headline?: string;
    subhead?: string;
    body?: string;
    captionOverrides?: Record<string, string>;
  };
}

export function loadCopyOverrides(): DeckCopyOverrides {
  try {
    const raw = localStorage.getItem(DECK_COPY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DeckCopyOverrides;
  } catch {
    return {};
  }
}

export function saveCopyOverrides(overrides: DeckCopyOverrides): void {
  try {
    localStorage.setItem(DECK_COPY_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* storage full */
  }
}

export function formatMetric(
  value: number | null | undefined,
  format: 'currency' | 'percent' | 'integer' | 'decimal' | 'text',
  fallback = '—',
): string {
  if (value == null) return fallback;
  switch (format) {
    case 'currency':
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
      return `$${Math.round(value)}`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'integer':
      return value.toLocaleString('en-US');
    case 'decimal':
      return value.toFixed(1);
    default:
      return String(value);
  }
}
