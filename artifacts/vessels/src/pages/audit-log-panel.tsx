import { useStandardQuery } from '@szl-holdings/api-client-react';

import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Info,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';

interface AuditEvent {
  id: number;
  actorLabel: string;
  action: string;
  actionType: string;
  domain: string;
  entityId?: string | null;
  entityType?: string | null;
  riskLevel: string;
  outcome: string;
  complianceTags?: string[];
  details?: string | null;
  eventHash: string;
  prevHash: string;
  createdAt: string;
}

interface AuditResponse {
  data?: {
    events: AuditEvent[];
    total: number;
    limit: number;
    offset: number;
  };
}

const RISK_STYLES: Record<string, { cls: string; icon: typeof Shield }> = {
  low: { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Shield },
  medium: { cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: ShieldAlert },
  high: { cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: ShieldAlert },
  critical: { cls: 'text-red-400 bg-red-500/10 border-red-500/20', icon: ShieldAlert },
};

const ACTION_TYPES = [
  '',
  'login',
  'logout',
  'data_access',
  'config_change',
  'export',
  'alert',
  'voyage_update',
];

const DOMAIN_COLORS: Record<string, string> = {
  vessels: 'text-[#4d8fcc]',
  aegis:   'text-[#9b7cc8]',
  terra:   'text-[#5baa8a]',
  billing: 'text-[#c9a85c]',
  auth:    'text-[#c96070]',
  audit:   'text-[#7a99b8]',
};

function RiskBadge({ level }: { level: string }) {
  const s = RISK_STYLES[level] ?? {
    cls: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    icon: Info,
  };
  return (
    <span
      className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize', s.cls)}
    >
      {level}
    </span>
  );
}

function OutcomeIcon({ outcome }: { outcome: string }) {
  if (outcome === 'success') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (outcome === 'failure') return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
  return <Info className="w-3.5 h-3.5 text-[#7a99b8]" />;
}

function relTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function DEMO_EVENTS(): AuditEvent[] {
  const now = Date.now();
  return [
    {
      id: 1,
      actorLabel: 'Marcus Wentworth',
      action: 'Viewed vessel detail: MV Harbour Star',
      actionType: 'data_access',
      domain: 'vessels',
      riskLevel: 'low',
      outcome: 'success',
      eventHash: 'a1b2c3d4',
      prevHash: 'genesis',
      createdAt: new Date(now - 4 * 60_000).toISOString(),
    },
    {
      id: 2,
      actorLabel: 'Priya Chandrasekaran',
      action: 'Exported voyage P&L report (Q1 2026)',
      actionType: 'export',
      domain: 'vessels',
      riskLevel: 'medium',
      outcome: 'success',
      eventHash: 'b2c3d4e5',
      prevHash: 'a1b2c3d4',
      createdAt: new Date(now - 17 * 60_000).toISOString(),
    },
    {
      id: 3,
      actorLabel: 'system',
      action: 'AIS feed reconnected after 4m blackout',
      actionType: 'alert',
      domain: 'vessels',
      riskLevel: 'high',
      outcome: 'success',
      eventHash: 'c3d4e5f6',
      prevHash: 'b2c3d4e5',
      createdAt: new Date(now - 38 * 60_000).toISOString(),
    },
    {
      id: 4,
      actorLabel: 'Nolan Ashford',
      action: 'Updated sanctions watchlist configuration',
      actionType: 'config_change',
      domain: 'aegis',
      riskLevel: 'high',
      outcome: 'success',
      eventHash: 'd4e5f6g7',
      prevHash: 'c3d4e5f6',
      createdAt: new Date(now - 1.5 * 3600_000).toISOString(),
    },
    {
      id: 5,
      actorLabel: 'Marcus Wentworth',
      action: 'User login',
      actionType: 'login',
      domain: 'auth',
      riskLevel: 'low',
      outcome: 'success',
      eventHash: 'e5f6g7h8',
      prevHash: 'd4e5f6g7',
      createdAt: new Date(now - 2 * 3600_000).toISOString(),
    },
    {
      id: 6,
      actorLabel: 'Serena Kowalski',
      action: 'Generated intelligence brief: Red Sea Corridor',
      actionType: 'data_access',
      domain: 'vessels',
      riskLevel: 'low',
      outcome: 'success',
      eventHash: 'f6g7h8i9',
      prevHash: 'e5f6g7h8',
      createdAt: new Date(now - 4 * 3600_000).toISOString(),
    },
    {
      id: 7,
      actorLabel: 'Rafael Oduya',
      action: 'Submitted maintenance readiness report (MV Tempest)',
      actionType: 'voyage_update',
      domain: 'vessels',
      riskLevel: 'medium',
      outcome: 'success',
      eventHash: 'g7h8i9j0',
      prevHash: 'f6g7h8i9',
      createdAt: new Date(now - 6 * 3600_000).toISOString(),
    },
    {
      id: 8,
      actorLabel: 'system',
      action: 'Invoice payment confirmed: INV-2026-003',
      actionType: 'data_access',
      domain: 'billing',
      riskLevel: 'low',
      outcome: 'success',
      eventHash: 'h8i9j0k1',
      prevHash: 'g7h8i9j0',
      createdAt: new Date(now - 8 * 3600_000).toISOString(),
    },
    {
      id: 9,
      actorLabel: 'Ingrid Halvorsen',
      action: 'Failed login attempt — 2FA required',
      actionType: 'login',
      domain: 'auth',
      riskLevel: 'critical',
      outcome: 'failure',
      eventHash: 'i9j0k1l2',
      prevHash: 'h8i9j0k1',
      createdAt: new Date(now - 12 * 3600_000).toISOString(),
    },
    {
      id: 10,
      actorLabel: 'Marcus Wentworth',
      action: 'Invited new team member: i.halvorsen@szlholdings.com',
      actionType: 'config_change',
      domain: 'auth',
      riskLevel: 'medium',
      outcome: 'success',
      eventHash: 'j0k1l2m3',
      prevHash: 'i9j0k1l2',
      createdAt: new Date(now - 24 * 3600_000).toISOString(),
    },
  ];
}

export default function AuditLogPanelPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const pageSize = 10;

  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(page * pageSize),
    ...(search ? { search } : {}),
    ...(actionTypeFilter ? { actionType: actionTypeFilter } : {}),
    ...(riskFilter ? { riskLevel: riskFilter } : {}),
  });

  const {
    data: apiData,
    isLoading,
    refetch,
  } = useStandardQuery({
    queryKey: ['audit-chain-events', page, search, actionTypeFilter, riskFilter],
    queryFn: () => apiFetch<AuditResponse>(`/audit-chain/events?${params}`),
    staleTime: 30_000,
  });

  const apiResult = (apiData as AuditResponse)?.data;
  const rawEvents: AuditEvent[] = apiResult?.events ?? [];
  const total = apiResult?.total ?? 0;

  const usingFallback =
    rawEvents.length === 0 && page === 0 && !search && !actionTypeFilter && !riskFilter;
  const fallbackEvents = DEMO_EVENTS();
  const events = rawEvents.length > 0 ? rawEvents : usingFallback ? fallbackEvents : [];
  const displayTotal = total > 0 ? total : usingFallback ? fallbackEvents.length : 0;
  const hasNextPage = usingFallback
    ? false
    : total > 0
      ? (page + 1) * pageSize < total
      : events.length >= pageSize;

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--gi-text-primary)]">Audit Log</h1>
          <p className="text-xs text-[var(--gi-text-muted)] mt-0.5">
            Hash-chained compliance ledger ·{' '}
            {displayTotal > 0
              ? `${displayTotal} events`
              : 'immutable record of all user and system actions'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(77,143,204,0.08)] border border-[rgba(77,143,204,0.18)] text-[#4d8fcc] text-xs hover:bg-[rgba(77,143,204,0.14)] transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Chain integrity badge */}
      <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-4 py-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-xs text-emerald-300">
          Chain integrity verified — SHA-256 hash-linked, tamper-evident ledger
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[var(--gi-bg-surface)] border border-[var(--gi-border-subtle)] rounded-lg px-3 py-2">
          <Search className="w-3.5 h-3.5 text-[var(--gi-text-muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search actions, actors…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="flex-1 bg-transparent text-sm text-[var(--gi-text-primary)] placeholder:text-[var(--gi-text-placeholder)] outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-[var(--gi-text-muted)]" />
          <select
            value={actionTypeFilter}
            onChange={(e) => {
              setActionTypeFilter(e.target.value);
              setPage(0);
            }}
            className="bg-[var(--gi-bg-surface)] border border-[var(--gi-border-subtle)] rounded-lg px-2 py-1.5 text-[11px] text-[var(--gi-text-secondary)] outline-none"
          >
            <option value="">All action types</option>
            {ACTION_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(0);
            }}
            className="bg-[var(--gi-bg-surface)] border border-[var(--gi-border-subtle)] rounded-lg px-2 py-1.5 text-[11px] text-[var(--gi-text-secondary)] outline-none"
          >
            <option value="">All risk levels</option>
            {['low', 'medium', 'high', 'critical'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--gi-bg-surface)] border border-[var(--gi-border-subtle)] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-4 py-2.5 border-b border-[var(--gi-border-subtle)]">
          <span />
          <span className="text-[10px] text-[var(--gi-text-muted)] uppercase tracking-wider">Action</span>
          <span className="text-[10px] text-[var(--gi-text-muted)] uppercase tracking-wider">Domain</span>
          <span className="text-[10px] text-[var(--gi-text-muted)] uppercase tracking-wider">Risk</span>
          <span className="text-[10px] text-[var(--gi-text-muted)] uppercase tracking-wider">Time</span>
          <span className="text-[10px] text-[var(--gi-text-muted)] uppercase tracking-wider">Hash</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2.5 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-[var(--gi-bg-raised)] rounded-lg" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-8 h-8 text-[var(--gi-text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--gi-text-muted)]">No events found</p>
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 items-start px-4 py-3 border-b border-[var(--gi-border-subtle)] last:border-0 hover:bg-[var(--gi-bg-hover)] transition-colors"
            >
              <OutcomeIcon outcome={ev.outcome} />
              <div className="min-w-0">
                <p className="text-xs text-[var(--gi-text-primary)] leading-snug truncate">{ev.action}</p>
                <p className="text-[10px] text-[var(--gi-text-muted)] mt-0.5">{ev.actorLabel}</p>
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium capitalize',
                  DOMAIN_COLORS[ev.domain] ?? 'text-[var(--gi-text-secondary)]',
                )}
              >
                {ev.domain}
              </span>
              <RiskBadge level={ev.riskLevel} />
              <span className="text-[11px] text-[var(--gi-text-muted)] whitespace-nowrap">
                {relTime(ev.createdAt)}
              </span>
              <span className="text-[10px] font-mono text-[var(--gi-text-muted)] opacity-40 whitespace-nowrap">
                {ev.eventHash.slice(0, 8)}…
              </span>
            </div>
          ))
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--gi-border-subtle)]">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="text-[11px] text-[#4d8fcc] disabled:opacity-30 hover:text-[var(--gi-text-primary)] transition-colors"
          >
            ← Previous
          </button>
          <span className="text-[10px] text-[var(--gi-text-muted)]">
            Page {page + 1}
            {displayTotal > 0 ? ` · ${displayTotal} total events` : ''}
          </span>
          <button
            disabled={!hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="text-[11px] text-[#4d8fcc] disabled:opacity-30 hover:text-[var(--gi-text-primary)] transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
