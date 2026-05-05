import { useStandardQuery } from '@szl-holdings/api-client-react';

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { fetchJson } from '../../pages/cognitive/shared';

const BG = { page: 'var(--gi-bg-base)', surface: 'var(--gi-bg-surface)', elevated: 'var(--gi-bg-raised)' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ELECTRIC = '#2dd4bf';

// API row shape from /api/guardian/audit/policy-decisions
interface PolicyDecisionAuditRow {
  id: number;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  newValues: Record<string, unknown> | null;
  decision: 'approved' | 'rejected' | string | null;
  policyEvaluationId: string | null;
  resolvedMode: string | null;
  confidence: number | null;
  blockedReason: string | null;
  projectedImpact: Record<string, unknown> | null;
  product: string | null;
  createdAt: string;
}

interface ListResponse<T> {
  data: T[];
  meta?: { total?: number };
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function decisionStyle(decision: string | null) {
  if (decision === 'approved')
    return { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'Approved' };
  if (decision === 'rejected')
    return { color: '#c45a4a', bg: 'rgba(196,90,74,0.08)', label: 'Rejected' };
  return { color: '#d4a054', bg: 'rgba(212,160,84,0.08)', label: decision ?? 'Unknown' };
}

function DecisionPill({ decision }: { decision: string | null }) {
  const cfg = decisionStyle(decision);
  return (
    <span
      className="text-[7px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

export default function TrustAuditPage() {
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');

  const params = new URLSearchParams({ limit: '100' });
  if (filterDecision !== 'all') params.set('decision', filterDecision);
  if (filterProduct !== 'all') params.set('product', filterProduct);
  if (filterMode !== 'all') params.set('mode', filterMode);

  const auditQ = useStandardQuery<ListResponse<PolicyDecisionAuditRow>>({
    queryKey: ['guardian', 'audit-policy-decisions', filterDecision, filterProduct, filterMode],
    queryFn: () => fetchJson(`/api/guardian/audit/policy-decisions?${params.toString()}`),
    refetchInterval: 30_000,
  });

  const events = auditQ.data?.data ?? [];
  const total = auditQ.data?.meta?.total ?? events.length;

  // For filter dropdowns, get unique products & modes from a wider sample
  const allEventsQ = useStandardQuery<ListResponse<PolicyDecisionAuditRow>>({
    queryKey: ['guardian', 'audit-policy-decisions-index'],
    queryFn: () => fetchJson(`/api/guardian/audit/policy-decisions?limit=200`),
    staleTime: 5 * 60_000,
  });
  const allEvents = allEventsQ.data?.data ?? [];
  const productOptions = useMemo(
    () => Array.from(new Set(allEvents.map((e) => e.product).filter((p): p is string => !!p))),
    [allEvents],
  );
  const modeOptions = useMemo(
    () => Array.from(new Set(allEvents.map((e) => e.resolvedMode).filter((m): m is string => !!m))),
    [allEvents],
  );

  const approvedCount = allEvents.filter((e) => e.decision === 'approved').length;
  const rejectedCount = allEvents.filter((e) => e.decision === 'rejected').length;
  const totalCount = allEvents.length;
  const uniqueActors = new Set(
    allEvents.map((e) => e.userId).filter((u): u is number => u !== null),
  ).size;

  const trustMetrics = [
    {
      label: 'Decisions Logged',
      value: String(totalCount),
      sub: 'Last 200 events',
      color: '#22c55e',
      icon: CheckCircle2,
    },
    {
      label: 'Rejections',
      value: String(rejectedCount),
      sub: 'Recent denials',
      color: '#c45a4a',
      icon: AlertTriangle,
    },
    {
      label: 'Approvals',
      value: String(approvedCount),
      sub: 'Recent approvals',
      color: ELECTRIC,
      icon: Activity,
    },
    {
      label: 'Approvers',
      value: String(uniqueActors),
      sub: 'Unique operators',
      color: '#8b7ac8',
      icon: User,
    },
  ];

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
          <span
            className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: '#8b7ac8' }}
          >
            Trust & Audit
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
          Proof Chain Audit
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          Immutable record of every approve / reject policy decision — replay why an action was run
          with the resolved mode, confidence, blocked reason and projected impact for each call.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {trustMetrics.map((m) => (
          <div
            key={m.label}
            className="rounded-md p-3 flex items-center gap-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ background: `${m.color}10` }}
            >
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
            </div>
            <div>
              <div className="text-base font-bold font-mono" style={{ color: m.color }}>
                {m.value}
              </div>
              <div className="text-[9px]" style={{ color: TEXT.secondary }}>
                {m.label}
              </div>
              <div className="text-[8px]" style={{ color: TEXT.tertiary }}>
                {m.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-[9px]" style={{ color: TEXT.tertiary }}>
          <Filter className="w-3 h-3" />
          <span>Decision:</span>
        </div>
        {['all', 'approved', 'rejected'].map((o) => (
          <button
            key={o}
            onClick={() => setFilterDecision(o)}
            className="px-2.5 py-1 rounded text-[9px] font-medium capitalize transition-all"
            style={{
              background: filterDecision === o ? 'rgba(45,212,191,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterDecision === o ? 'rgba(45,212,191,0.25)' : BORDER.subtle}`,
              color: filterDecision === o ? ELECTRIC : TEXT.secondary,
            }}
          >
            {o === 'all' ? 'All decisions' : o}
          </button>
        ))}
        <div className="w-px h-5 self-center" style={{ background: BORDER.subtle }} />
        <span className="text-[9px]" style={{ color: TEXT.tertiary }}>
          Product:
        </span>
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="px-2 py-1 rounded text-[9px] font-medium outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER.subtle}`,
            color: TEXT.secondary,
          }}
        >
          <option value="all">All products</option>
          {productOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <span className="text-[9px]" style={{ color: TEXT.tertiary }}>
          Mode:
        </span>
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="px-2 py-1 rounded text-[9px] font-medium outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER.subtle}`,
            color: TEXT.secondary,
          }}
        >
          <option value="all">All modes</option>
          {modeOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`/api/guardian/audit/policy-decisions?${(() => {
              const p = new URLSearchParams();
              if (filterDecision !== 'all') p.set('decision', filterDecision);
              if (filterProduct !== 'all') p.set('product', filterProduct);
              if (filterMode !== 'all') p.set('mode', filterMode);
              p.set('format', 'csv');
              return p.toString();
            })()}`}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono"
            style={{
              color: ELECTRIC,
              border: `1px solid rgba(45,212,191,0.25)`,
              background: 'rgba(45,212,191,0.06)',
            }}
            title="Download the currently filtered policy decisions as a CSV file"
          >
            <Download className="w-3 h-3" /> Export CSV
          </a>
          <button
            onClick={() => auditQ.refetch()}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-mono"
            style={{ color: TEXT.secondary, border: `1px solid ${BORDER.subtle}` }}
          >
            <RefreshCw className={`w-3 h-3 ${auditQ.isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Audit log */}
      <div
        className="rounded-md overflow-hidden"
        style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
      >
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
        >
          <Eye className="w-3 h-3" style={{ color: TEXT.tertiary }} />
          <span
            className="text-[9px] uppercase tracking-widest font-medium"
            style={{ color: TEXT.muted }}
          >
            Policy Decision Audit Log
          </span>
          <span className="text-[8px] font-mono ml-auto" style={{ color: TEXT.tertiary }}>
            {events.length} of {total} events
          </span>
        </div>

        {auditQ.isLoading && (
          <div className="px-4 py-6 text-center text-[10px]" style={{ color: TEXT.tertiary }}>
            Loading audit events…
          </div>
        )}
        {auditQ.error && (
          <div className="px-4 py-6 text-center text-[10px]" style={{ color: '#c45a4a' }}>
            Failed to load audit events: {(auditQ.error as Error).message}
          </div>
        )}
        {!auditQ.isLoading && !auditQ.error && events.length === 0 && (
          <div className="px-4 py-6 text-center text-[10px]" style={{ color: TEXT.tertiary }}>
            No policy decisions yet — approved/rejected policy actions will appear here.
          </div>
        )}

        <div>
          {events.map((ev) => {
            const newValues = ev.newValues ?? {};
            const action =
              typeof newValues.action === 'string'
                ? (newValues.action as string)
                : 'policy decision';
            const decisionReason =
              typeof newValues.decisionReason === 'string'
                ? (newValues.decisionReason as string)
                : null;
            const impact = ev.projectedImpact ?? {};
            const severity =
              typeof impact.severity === 'string' ? (impact.severity as string) : null;
            const reversible =
              typeof impact.reversible === 'boolean' ? (impact.reversible as boolean) : null;
            const conf = ev.confidence !== null ? `${(ev.confidence * 100).toFixed(0)}%` : '—';

            return (
              <div
                key={ev.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.01] transition-colors"
                style={{ borderTop: `1px solid ${BORDER.subtle}` }}
              >
                <div className="shrink-0 mt-0.5">
                  <DecisionPill decision={ev.decision} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span
                      className="text-[10px] font-mono font-medium"
                      style={{ color: TEXT.primary }}
                    >
                      {action}
                    </span>
                    {ev.product && (
                      <span
                        className="text-[8px] font-mono px-1 py-px rounded"
                        style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.06)' }}
                      >
                        {ev.product}
                      </span>
                    )}
                    {ev.resolvedMode && (
                      <span
                        className="text-[8px] font-mono px-1 py-px rounded"
                        style={{ color: '#8b7ac8', background: 'rgba(139,122,200,0.06)' }}
                      >
                        mode: {ev.resolvedMode}
                      </span>
                    )}
                    <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                      conf {conf}
                    </span>
                    {severity && (
                      <span
                        className="text-[8px] font-mono"
                        style={{
                          color:
                            severity === 'critical' || severity === 'high' ? '#ef4444' : '#d4a054',
                        }}
                      >
                        impact: {severity}
                        {reversible === false ? ' · irreversible' : ''}
                      </span>
                    )}
                  </div>
                  {ev.blockedReason && (
                    <p className="text-[10px]" style={{ color: '#f97316' }}>
                      ⚠ {ev.blockedReason}
                    </p>
                  )}
                  {decisionReason && (
                    <p className="text-[10px]" style={{ color: TEXT.secondary }}>
                      {decisionReason}
                    </p>
                  )}
                  <div
                    className="flex items-center gap-2 mt-0.5 text-[8px] font-mono"
                    style={{ color: TEXT.tertiary }}
                  >
                    {ev.userId !== null && <span>by user #{ev.userId}</span>}
                    {ev.entityId && (
                      <span style={{ color: TEXT.muted }}>
                        req {ev.entityId.substring(0, 24)}
                        {ev.entityId.length > 24 ? '…' : ''}
                      </span>
                    )}
                    {ev.policyEvaluationId && (
                      <span style={{ color: TEXT.muted }}>
                        eval {ev.policyEvaluationId.substring(0, 16)}…
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                    AUD-{String(ev.id).padStart(5, '0')}
                  </span>
                  <span
                    className="text-[8px] flex items-center gap-1"
                    style={{ color: TEXT.tertiary }}
                  >
                    <Clock className="w-2 h-2" /> {timeAgo(ev.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
