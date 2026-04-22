import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Filter,
  Loader2,
  Minus,
  Radio,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

interface AIOpsTrace {
  traces: {
    total: number;
    reviewRequired: number;
    reviewRate: number;
    avgLatencyMs: number;
    avgConfidence: number;
    totalCostUsd: number;
    evalPassRate: number | null;
  };
  byDomain: Array<{
    domain: string;
    totalTraces: number;
    avgLatencyMs: number;
    avgConfidence: number;
    totalCostUsd: number;
    reviewRequired: number;
    evalPassRate: number | null;
  }>;
  reviewQueue: {
    total: number;
    pending: number;
    inReview: number;
    escalated: number;
    criticalPending: number;
    highPending: number;
  };
  evaluators?: {
    registered: number;
    avgPassRate: number | null;
  };
  period: string;
  generatedAt: string;
}

interface ReviewItem {
  reviewId: string;
  traceId: string;
  domain: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_review' | 'resolved' | 'escalated';
  reason: string;
  confidence: number;
  createdAt: string;
  orgId?: number;
}

interface EvaluatorStat {
  hookId: string;
  name: string;
  domain: string;
  passRate: number;
  totalRuns: number;
  passCount: number;
  failCount: number;
}

interface TraceItem {
  traceId: string;
  domain: string;
  model: string;
  status: string;
  confidence: number;
  latencyMs: number;
  costUsd: number;
  requiresReview: boolean;
  riskLevel?: string;
  createdAt: string;
}

function fmt(n: number, digits = 2) {
  return n.toFixed(digits);
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#4a90b8',
  vessels: '#38bdf8',
  terra: '#6b8f71',
  command: '#d4a054',
  default: '#8b7ac8',
};

function domainColor(d: string) {
  return DOMAIN_COLORS[d?.toLowerCase()] ?? DOMAIN_COLORS.default;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: '#c45a4a', bg: 'rgba(196,90,74,0.1)' },
  high: { label: 'High', color: '#c8953c', bg: 'rgba(200,149,60,0.1)' },
  medium: { label: 'Medium', color: '#d4a054', bg: 'rgba(212,160,84,0.1)' },
  low: { label: 'Low', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#c8953c' },
  in_review: { label: 'In Review', color: '#4a90b8' },
  resolved: { label: 'Resolved', color: '#6b8f71' },
  escalated: { label: 'Escalated', color: '#c45a4a' },
};

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-widest font-medium"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}14`, border: `1px solid ${color}22` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          {value}
        </span>
        {trend && (
          <TrendIcon
            className="w-3.5 h-3.5 mb-1"
            style={{
              color:
                trend === 'up' ? '#c45a4a' : trend === 'down' ? '#6b8f71' : 'rgba(255,255,255,0.3)',
            }}
          />
        )}
      </div>
      {sub && (
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function PassRateBar({ rate, size = 'md' }: { rate: number; size?: 'sm' | 'md' }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 90 ? '#6b8f71' : pct >= 70 ? '#d4a054' : '#c45a4a';
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: size === 'sm' ? 3 : 5, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="text-[10px] font-mono tabular-nums shrink-0"
        style={{ color, width: 32, textAlign: 'right' }}
      >
        {pct}%
      </span>
    </div>
  );
}

function ReviewQueuePanel() {
  const queryClient = useQueryClient();
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [decisionModal, setDecisionModal] = useState<ReviewItem | null>(null);
  const [verdict, setVerdict] = useState('approved');
  const [notes, setNotes] = useState('');

  const { data: queueData, isLoading } = useStandardQuery({
    queryKey: ['ai-ops-review-queue', priorityFilter],
    queryFn: () => {
      const qp = new URLSearchParams({ limit: '20' });
      if (priorityFilter !== 'all') qp.set('priority', priorityFilter);
      return apiFetch<{ items: ReviewItem[]; count: number }>(
        `/ai/ops/review-queue?${qp.toString()}`,
      );
    },
    refetchInterval: 30000,
  });

  const claimMutation = useStandardMutation({
    mutationFn: (reviewId: string) =>
      apiFetch<{ reviewId: string; status: string }>(`/ai/ops/review-queue/${reviewId}/claim`, {
        method: 'PATCH',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-ops-review-queue'] }),
  });

  const decideMutation = useStandardMutation({
    mutationFn: ({
      reviewId,
      verdict,
      notes,
    }: {
      reviewId: string;
      verdict: string;
      notes?: string;
    }) =>
      apiFetch<unknown>(`/ai/ops/review-queue/${reviewId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ verdict, reviewNotes: notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-ops-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['ai-ops-summary'] });
      setDecisionModal(null);
      setVerdict('approved');
      setNotes('');
    },
  });

  const items = queueData?.items ?? [];

  return (
    <div
      className="rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <h3
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: 'rgba(255,255,255,0.88)' }}
        >
          <ClipboardList className="w-4 h-4" style={{ color: '#c8953c' }} />
          Review Queue
        </h3>
        <div className="flex items-center gap-1">
          {['all', 'critical', 'high', 'medium'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className="text-[9px] px-2 py-0.5 rounded transition-all font-medium uppercase tracking-wider"
              style={{
                background: priorityFilter === p ? 'rgba(212,160,84,0.15)' : 'transparent',
                color: priorityFilter === p ? '#d4a054' : 'rgba(255,255,255,0.35)',
                border: `1px solid ${priorityFilter === p ? 'rgba(212,160,84,0.3)' : 'transparent'}`,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Loading queue…
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <CheckCircle className="w-6 h-6" style={{ color: '#6b8f71', opacity: 0.5 }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Review queue is clear
            </span>
          </div>
        ) : (
          items.map((item) => {
            const pc = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.low;
            const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
            return (
              <div
                key={item.reviewId}
                className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.01] transition-all"
              >
                <div
                  className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: pc.color, marginTop: 6 }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {item.traceId?.slice(0, 12)}…
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-px rounded font-medium uppercase tracking-wider"
                      style={{ background: pc.bg, color: pc.color }}
                    >
                      {pc.label}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-px rounded font-medium uppercase tracking-wider"
                      style={{ background: 'rgba(255,255,255,0.04)', color: sc.color }}
                    >
                      {sc.label}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-px rounded capitalize"
                      style={{
                        background: `${domainColor(item.domain)}14`,
                        color: domainColor(item.domain),
                      }}
                    >
                      {item.domain}
                    </span>
                  </div>
                  <p
                    className="text-[10px] mt-1 truncate"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {item.reason || 'Flagged for human review'}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      conf {fmt(item.confidence * 100, 0)}%
                    </span>
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => claimMutation.mutate(item.reviewId)}
                      disabled={claimMutation.isPending}
                      className="text-[9px] px-2 py-1 rounded transition-all font-medium flex items-center gap-1"
                      style={{
                        background: 'rgba(74,144,184,0.1)',
                        color: '#4a90b8',
                        border: '1px solid rgba(74,144,184,0.2)',
                      }}
                    >
                      {claimMutation.isPending ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-2.5 h-2.5" />
                      )}
                      Claim
                    </button>
                  )}
                  {(item.status === 'pending' || item.status === 'in_review') && (
                    <button
                      onClick={() => setDecisionModal(item)}
                      className="text-[9px] px-2 py-1 rounded transition-all font-medium flex items-center gap-1"
                      style={{
                        background: 'rgba(107,143,113,0.1)',
                        color: '#6b8f71',
                        border: '1px solid rgba(107,143,113,0.2)',
                      }}
                    >
                      <Check className="w-2.5 h-2.5" />
                      Resolve
                    </button>
                  )}
                  <Link href={`/cognitive/traces?traceId=${item.traceId}`}>
                    <button
                      title={`View trace ${item.traceId}`}
                      className="text-[9px] px-2 py-1 rounded transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.35)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {decisionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-xl p-5"
            style={{ background: '#0d1321', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                Record Decision
              </h4>
              <button
                onClick={() => setDecisionModal(null)}
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] font-mono mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Trace: {decisionModal.traceId?.slice(0, 20)}…
            </p>
            <div className="mb-3">
              <label
                className="block text-[10px] uppercase tracking-widest mb-1.5"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Verdict
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {['approved', 'rejected', 'flagged', 'deferred', 'escalated'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVerdict(v)}
                    className="text-[9px] px-2.5 py-1 rounded capitalize font-medium transition-all"
                    style={{
                      background:
                        verdict === v ? 'rgba(212,160,84,0.15)' : 'rgba(255,255,255,0.03)',
                      color: verdict === v ? '#d4a054' : 'rgba(255,255,255,0.45)',
                      border: `1px solid ${verdict === v ? 'rgba(212,160,84,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label
                className="block text-[10px] uppercase tracking-widest mb-1.5"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg px-3 py-2 text-xs resize-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.75)',
                  outline: 'none',
                }}
                placeholder="Add review notes…"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDecisionModal(null)}
                className="text-xs px-3 py-1.5 rounded"
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  decideMutation.mutate({ reviewId: decisionModal.reviewId, verdict, notes })
                }
                disabled={decideMutation.isPending}
                className="text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-all"
                style={{
                  background: 'rgba(107,143,113,0.15)',
                  color: '#6b8f71',
                  border: '1px solid rgba(107,143,113,0.25)',
                }}
              >
                {decideMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EvaluatorStatsPanel() {
  const { data, isLoading, isError, error } = useStandardQuery({
    queryKey: ['ai-ops-evaluators'],
    queryFn: () => apiFetch<{ stats: EvaluatorStat[]; count: number }>('/ai/ops/evaluators/stats'),
    refetchInterval: 60000,
    retry: false,
  });

  const stats = data?.stats ?? [];
  const isPermissionError =
    isError &&
    (String((error as { status?: number })?.status).startsWith('4') ||
      String(error).includes('403') ||
      String(error).includes('401') ||
      String(error).includes('Forbidden') ||
      String(error).includes('Unauthorized'));

  return (
    <div
      className="rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <h3
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: 'rgba(255,255,255,0.88)' }}
        >
          <BarChart3 className="w-4 h-4" style={{ color: '#8b7ac8' }} />
          Evaluator Hook Pass Rates
        </h3>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        ) : isPermissionError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Shield className="w-6 h-6 opacity-30" style={{ color: '#c8953c' }} />
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Admin access required
            </p>
            <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Evaluator stats are visible to admins only
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <AlertTriangle className="w-5 h-5 opacity-40" style={{ color: '#c45a4a' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Unable to load evaluator data
            </p>
          </div>
        ) : stats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Shield className="w-6 h-6 opacity-20" style={{ color: '#8b7ac8' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No evaluator hooks registered
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.map((s) => (
              <div key={s.hookId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: 'rgba(255,255,255,0.75)' }}
                    >
                      {s.name}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-px rounded shrink-0"
                      style={{
                        background: `${domainColor(s.domain)}14`,
                        color: domainColor(s.domain),
                      }}
                    >
                      {s.domain}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-mono shrink-0"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    {s.passCount}/{s.totalRuns} runs
                  </span>
                </div>
                <PassRateBar rate={s.passRate} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TraceListPanel() {
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const params = new URLSearchParams({ limit: '20' });
  if (domainFilter !== 'all') params.set('domain', domainFilter);
  if (statusFilter !== 'all') params.set('status', statusFilter);

  const { data, isLoading } = useStandardQuery({
    queryKey: ['ai-ops-traces', domainFilter, statusFilter],
    queryFn: () =>
      apiFetch<{ traces: TraceItem[]; count: number }>(`/ai/ops/traces?${params.toString()}`),
    refetchInterval: 30000,
  });

  const traces = data?.traces ?? [];
  const domains = ['all', 'aegis', 'vessels', 'terra', 'command'];
  const statuses = ['all', 'completed', 'flagged', 'pending_review'];

  return (
    <div
      className="rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 gap-2 flex-wrap"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        <h3
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: 'rgba(255,255,255,0.88)' }}
        >
          <Activity className="w-4 h-4" style={{ color: '#d4a054' }} />
          Recent Traces
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5">
            <Filter className="w-3 h-3 mr-1" style={{ color: 'rgba(255,255,255,0.25)' }} />
            {domains.map((d) => (
              <button
                key={d}
                onClick={() => setDomainFilter(d)}
                className="text-[9px] px-1.5 py-0.5 rounded capitalize transition-all"
                style={{
                  background: domainFilter === d ? 'rgba(212,160,84,0.12)' : 'transparent',
                  color: domainFilter === d ? '#d4a054' : 'rgba(255,255,255,0.3)',
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="text-[9px] px-1.5 py-0.5 rounded capitalize transition-all"
                style={{
                  background: statusFilter === s ? 'rgba(74,144,184,0.12)' : 'transparent',
                  color: statusFilter === s ? '#4a90b8' : 'rgba(255,255,255,0.3)',
                }}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {['Trace ID', 'Domain', 'Model', 'Status', 'Confidence', 'Latency', 'Cost', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-medium uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center">
                  <Loader2
                    className="w-4 h-4 animate-spin mx-auto"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  />
                </td>
              </tr>
            ) : traces.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-xs"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  No traces found
                </td>
              </tr>
            ) : (
              traces.map((t) => {
                const confColor =
                  t.confidence >= 0.8 ? '#6b8f71' : t.confidence >= 0.6 ? '#d4a054' : '#c45a4a';
                return (
                  <tr
                    key={t.traceId}
                    className="hover:bg-white/[0.01] transition-all"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                  >
                    <td
                      className="px-4 py-2.5 font-mono"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {t.traceId?.slice(0, 10)}…
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="px-1.5 py-px rounded capitalize text-[9px]"
                        style={{
                          background: `${domainColor(t.domain)}14`,
                          color: domainColor(t.domain),
                        }}
                      >
                        {t.domain}
                      </span>
                    </td>
                    <td
                      className="px-4 py-2.5 font-mono"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {t.model?.split('/').pop() ?? t.model}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="px-1.5 py-px rounded capitalize text-[9px] font-medium"
                        style={{
                          background: t.requiresReview
                            ? 'rgba(200,149,60,0.1)'
                            : t.status === 'flagged'
                              ? 'rgba(196,90,74,0.1)'
                              : 'rgba(107,143,113,0.1)',
                          color: t.requiresReview
                            ? '#c8953c'
                            : t.status === 'flagged'
                              ? '#c45a4a'
                              : '#6b8f71',
                        }}
                      >
                        {t.requiresReview ? 'needs review' : t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: confColor }}>
                      {fmt(t.confidence * 100, 0)}%
                    </td>
                    <td
                      className="px-4 py-2.5 font-mono"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {t.latencyMs}ms
                    </td>
                    <td
                      className="px-4 py-2.5 font-mono"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      ${t.costUsd?.toFixed(4)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/cognitive/traces?traceId=${t.traceId}`}>
                        <button
                          title={`View trace ${t.traceId}`}
                          className="text-[9px] px-2 py-0.5 rounded transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            color: 'rgba(255,255,255,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          View →
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AIQualityDashboard() {
  const queryClient = useQueryClient();

  const {
    data: summaryRaw,
    isLoading,
    isError,
    dataUpdatedAt,
  } = useStandardQuery({
    queryKey: ['ai-ops-summary'],
    queryFn: () => apiFetch<AIOpsTrace>('/ai/ops/summary'),
    refetchInterval: 30000,
  });

  const summary = summaryRaw as AIOpsTrace | undefined;

  const traces = summary?.traces;
  const reviewQueue = summary?.reviewQueue;
  const byDomain = summary?.byDomain ?? [];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-xl font-bold flex items-center gap-2.5"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(139,122,200,0.12)',
                border: '1px solid rgba(139,122,200,0.2)',
              }}
            >
              <Brain className="w-4 h-4" style={{ color: '#8b7ac8' }} />
            </div>
            AI Quality Dashboard
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Last 24h · Cost, latency, confidence, review queue, and evaluator health
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dataUpdatedAt > 0 && (
            <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Updated{' '}
              {new Date(dataUpdatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['ai-ops-summary'] })}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <span
            className="inline-flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded-full uppercase tracking-widest"
            style={{
              background: 'rgba(139,122,200,0.1)',
              color: '#8b7ac8',
              border: '1px solid rgba(139,122,200,0.2)',
            }}
          >
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {isError && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
          style={{
            background: 'rgba(196,90,74,0.08)',
            border: '1px solid rgba(196,90,74,0.2)',
            color: '#c45a4a',
          }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Unable to load AI ops data. Check authentication and API availability.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Traces"
          value={isLoading ? '—' : String(traces?.total ?? 0)}
          sub="Last 24 hours"
          icon={Activity}
          color="#d4a054"
        />
        <MetricCard
          label="Review Rate"
          value={isLoading ? '—' : pct(traces?.reviewRate ?? 0)}
          sub={`${traces?.reviewRequired ?? 0} flagged`}
          icon={AlertTriangle}
          color="#c8953c"
          trend={traces && traces.reviewRate > 0.2 ? 'up' : 'neutral'}
        />
        <MetricCard
          label="Avg Confidence"
          value={isLoading ? '—' : pct(traces?.avgConfidence ?? 0)}
          sub={`${traces?.avgLatencyMs ?? 0}ms avg latency`}
          icon={Brain}
          color="#8b7ac8"
          trend={traces && traces.avgConfidence >= 0.8 ? 'down' : 'up'}
        />
        <MetricCard
          label="Total Cost"
          value={isLoading ? '—' : `$${fmt(traces?.totalCostUsd ?? 0, 4)}`}
          sub={
            traces?.evalPassRate != null ? `${pct(traces.evalPassRate)} eval pass` : 'No eval data'
          }
          icon={DollarSign}
          color="#6b8f71"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-xl p-4 flex flex-col gap-1"
          style={{ background: 'rgba(196,90,74,0.06)', border: '1px solid rgba(196,90,74,0.15)' }}
        >
          <span
            className="text-[9px] uppercase tracking-widest font-medium"
            style={{ color: '#c45a4a' }}
          >
            Critical Pending
          </span>
          <span className="text-3xl font-bold font-mono" style={{ color: '#c45a4a' }}>
            {isLoading ? '—' : (reviewQueue?.criticalPending ?? 0)}
          </span>
        </div>
        <div
          className="rounded-xl p-4 flex flex-col gap-1"
          style={{ background: 'rgba(200,149,60,0.06)', border: '1px solid rgba(200,149,60,0.15)' }}
        >
          <span
            className="text-[9px] uppercase tracking-widest font-medium"
            style={{ color: '#c8953c' }}
          >
            High Pending
          </span>
          <span className="text-3xl font-bold font-mono" style={{ color: '#c8953c' }}>
            {isLoading ? '—' : (reviewQueue?.highPending ?? 0)}
          </span>
        </div>
        <div
          className="rounded-xl p-4 flex flex-col gap-1"
          style={{ background: 'rgba(74,144,184,0.06)', border: '1px solid rgba(74,144,184,0.15)' }}
        >
          <span
            className="text-[9px] uppercase tracking-widest font-medium"
            style={{ color: '#4a90b8' }}
          >
            In Review
          </span>
          <span className="text-3xl font-bold font-mono" style={{ color: '#4a90b8' }}>
            {isLoading ? '—' : (reviewQueue?.inReview ?? 0)}
          </span>
        </div>
        <div
          className="rounded-xl p-4 flex flex-col gap-1"
          style={{
            background: 'rgba(107,143,113,0.06)',
            border: '1px solid rgba(107,143,113,0.15)',
          }}
        >
          <span
            className="text-[9px] uppercase tracking-widest font-medium"
            style={{ color: '#6b8f71' }}
          >
            Eval Pass Rate
          </span>
          <span className="text-3xl font-bold font-mono" style={{ color: '#6b8f71' }}>
            {isLoading || traces?.evalPassRate == null ? '—' : pct(traces.evalPassRate)}
          </span>
        </div>
      </div>

      <div
        className="rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="px-4 pt-4 pb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          <h3
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.88)' }}
          >
            <Zap className="w-4 h-4" style={{ color: '#d4a054' }} />
            Per-Domain Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {[
                  'Domain',
                  'Traces',
                  'Avg Latency',
                  'Avg Confidence',
                  'Review Needed',
                  'Eval Pass',
                  'Cost (USD)',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left font-medium uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <Loader2
                      className="w-4 h-4 animate-spin mx-auto"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    />
                  </td>
                </tr>
              ) : byDomain.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-xs"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    No domain data yet
                  </td>
                </tr>
              ) : (
                byDomain.map((d) => {
                  const dc = domainColor(d.domain);
                  const _confColor =
                    d.avgConfidence >= 0.8
                      ? '#6b8f71'
                      : d.avgConfidence >= 0.6
                        ? '#d4a054'
                        : '#c45a4a';
                  return (
                    <tr
                      key={d.domain}
                      className="hover:bg-white/[0.01] transition-all"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: dc }} />
                          <span
                            className="font-medium capitalize"
                            style={{ color: 'rgba(255,255,255,0.75)' }}
                          >
                            {d.domain}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-2.5 font-mono"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                      >
                        {d.totalTraces}
                      </td>
                      <td
                        className="px-4 py-2.5 font-mono"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        {d.avgLatencyMs}ms
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <PassRateBar rate={d.avgConfidence} size="sm" />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="font-mono px-1.5 py-px rounded text-[9px]"
                          style={{
                            background:
                              d.reviewRequired > 0
                                ? 'rgba(200,149,60,0.1)'
                                : 'rgba(107,143,113,0.08)',
                            color: d.reviewRequired > 0 ? '#c8953c' : '#6b8f71',
                          }}
                        >
                          {d.reviewRequired}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {d.evalPassRate != null ? (
                          <PassRateBar rate={d.evalPassRate} size="sm" />
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-2.5 font-mono"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        ${d.totalCostUsd.toFixed(4)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ReviewQueuePanel />
        </div>
        <div>
          <EvaluatorStatsPanel />
        </div>
      </div>

      <TraceListPanel />
    </div>
  );
}
