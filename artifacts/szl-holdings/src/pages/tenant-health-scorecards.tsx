import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Filter,
  Minus,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const API = '/api';

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(needsCsrf ? { 'x-csrf-token': getCsrfToken() } : {}),
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

interface TenantScorecard {
  id: number;
  orgId: number;
  orgName?: string;
  orgSlug?: string;
  plan?: string;
  computedAt: string;
  periodStart: string;
  periodEnd: string;
  activeUsers: number;
  totalUsers: number;
  sessionCount: number;
  featureAdoptionPct: number;
  supportTicketVolume: number;
  slaAdherencePct: number;
  billingStatus: 'current' | 'overdue' | 'churned' | 'trial' | 'unknown';
  apiCallCount: number;
  errorRatePct: number;
  healthScore: number;
  healthTier: 'critical' | 'at_risk' | 'healthy' | 'champion';
  healthScoreDelta: number | null;
  activeUsersDelta: number | null;
  signalBreakdown?: Record<string, unknown>;
}

interface Benchmarks {
  avgHealthScore: number;
  avgActiveUsers: number;
  avgFeatureAdoptionPct: number;
  avgSlaAdherencePct: number;
  avgErrorRatePct: number;
  totalOrgs: number;
}

const TIER_CONFIG: Record<
  TenantScorecard['healthTier'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  champion: {
    label: 'Champion',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  healthy: {
    label: 'Healthy',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/20',
    dot: 'bg-sky-400',
  },
  at_risk: {
    label: 'At Risk',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  critical: {
    label: 'Critical',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
  },
};

const BILLING_BADGE: Record<
  TenantScorecard['billingStatus'],
  { label: string; className: string }
> = {
  current: {
    label: 'Current',
    className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  trial: { label: 'Trial', className: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  overdue: { label: 'Overdue', className: 'text-red-400 bg-red-500/10 border-red-500/20' },
  churned: { label: 'Churned', className: 'text-muted-foreground bg-muted border-border' },
  unknown: { label: 'Unknown', className: 'text-muted-foreground bg-muted border-border' },
};

function ScoreBar({
  value,
  max = 100,
  accentClass = 'bg-sky-500',
}: {
  value: number;
  max?: number;
  accentClass?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', accentClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-[10px] text-muted-foreground">—</span>;
  if (Math.abs(delta) < 0.5)
    return (
      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
        <Minus className="w-3 h-3" /> 0
      </span>
    );
  return (
    <span
      className={cn(
        'text-[10px] flex items-center gap-0.5 font-mono',
        delta > 0 ? 'text-emerald-400' : 'text-red-400',
      )}
    >
      {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {delta > 0 ? '+' : ''}
      {delta.toFixed(1)}
    </span>
  );
}

function HealthScoreGauge({ score, tier }: { score: number; tier: TenantScorecard['healthTier'] }) {
  const cfg = TIER_CONFIG[tier];
  const getAccent = () => {
    if (tier === 'champion') return 'bg-emerald-400';
    if (tier === 'healthy') return 'bg-sky-400';
    if (tier === 'at_risk') return 'bg-amber-400';
    return 'bg-red-400';
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border',
          cfg.bg,
          cfg.text,
          cfg.border,
        )}
      >
        {Math.round(score)}
      </div>
      <span className={cn('text-[9px] font-semibold uppercase tracking-wider', cfg.text)}>
        {cfg.label}
      </span>
    </div>
  );
}

function BenchmarkBar({
  value,
  benchmark,
  label,
  accentClass,
}: {
  value: number;
  benchmark: number;
  label: string;
  accentClass?: string;
}) {
  const max = Math.max(value, benchmark, 1);
  const tenantPct = (value / max) * 100;
  const benchmarkPct = (benchmark / max) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-mono">
          <span className={cn('font-bold', accentClass ?? 'text-foreground')}>
            {Math.round(value)}
          </span>
          <span className="text-muted-foreground"> / avg {Math.round(benchmark)}</span>
        </span>
      </div>
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', accentClass ? '' : 'bg-sky-500')}
          style={{ width: `${tenantPct}%`, background: accentClass ? undefined : undefined }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-white/30"
          style={{ left: `${benchmarkPct}%` }}
        />
      </div>
    </div>
  );
}

export default function TenantHealthScorecards() {
  const queryClient = useQueryClient();
  const [filterTier, setFilterTier] = useState<string>('all');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [selectedOrg, setSelectedOrg] = useState<TenantScorecard | null>(null);

  const { data: scorecardsData, isLoading } = useStandardQuery({
    queryKey: ['tenant-health', filterTier, sortDir],
    queryFn: () =>
      apiFetch<{ scorecards: TenantScorecard[]; total: number; period: unknown }>(
        `/tenant-health?${filterTier !== 'all' ? `tier=${filterTier}&` : ''}sortDir=${sortDir}`,
      ),
    staleTime: 60_000,
  });

  const { data: benchmarksData } = useStandardQuery({
    queryKey: ['tenant-health-benchmarks'],
    queryFn: () =>
      apiFetch<{ benchmarks: Benchmarks; tierBreakdown: Record<string, number> }>(
        '/tenant-health/benchmarks',
      ),
    staleTime: 60_000,
  });

  const computeMutation = useStandardMutation({
    mutationFn: (orgId: number) => apiFetch(`/tenant-health/${orgId}/compute`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-health'] }),
  });

  const scorecards = scorecardsData?.scorecards ?? [];
  const benchmarks = benchmarksData?.benchmarks;
  const tierBreakdown = benchmarksData?.tierBreakdown ?? {};

  const summaryStats = [
    {
      label: 'Total Tenants',
      value: benchmarks?.totalOrgs ?? '—',
      icon: Building2,
      color: 'text-foreground',
    },
    {
      label: 'Avg Health Score',
      value: benchmarks ? `${benchmarks.avgHealthScore}` : '—',
      icon: Activity,
      color: 'text-sky-400',
    },
    {
      label: 'At Risk / Critical',
      value: ((tierBreakdown.at_risk ?? 0) + (tierBreakdown.critical ?? 0)).toString(),
      icon: AlertTriangle,
      color: 'text-amber-400',
    },
    {
      label: 'Champions',
      value: (tierBreakdown.champion ?? 0).toString(),
      icon: CheckCircle,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-400" /> Tenant Health Scorecards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Per-tenant health computed from usage, billing, and support signals
          </p>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['tenant-health'] });
            queryClient.invalidateQueries({ queryKey: ['tenant-health-benchmarks'] });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm hover:bg-muted/80 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-4 h-4', color)} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Platform Benchmarks */}
      {benchmarks && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold">Platform Benchmarks — This Month</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Avg Health Score',
                value: benchmarks.avgHealthScore,
                suffix: '/100',
                color: 'text-sky-400',
              },
              {
                label: 'Avg Active Users',
                value: benchmarks.avgActiveUsers,
                suffix: '',
                color: 'text-foreground',
              },
              {
                label: 'Avg Feature Adoption',
                value: benchmarks.avgFeatureAdoptionPct,
                suffix: '%',
                color: 'text-violet-400',
              },
              {
                label: 'Avg SLA Adherence',
                value: benchmarks.avgSlaAdherencePct,
                suffix: '%',
                color: 'text-emerald-400',
              },
            ].map(({ label, value, suffix, color }) => (
              <div key={label} className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
                <p className={cn('text-xl font-bold', color)}>
                  {Math.round(value)}
                  {suffix}
                </p>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-border/40 flex flex-wrap gap-3">
            {(['critical', 'at_risk', 'healthy', 'champion'] as const).map((tier) => {
              const cfg = TIER_CONFIG[tier];
              return (
                <div key={tier} className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                  <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
                  <span className={cn('text-[10px] font-bold', cfg.text)}>
                    {tierBreakdown[tier] ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filter:</span>
        </div>
        {(['all', 'critical', 'at_risk', 'healthy', 'champion'] as const).map((tier) => (
          <button
            key={tier}
            onClick={() => setFilterTier(tier)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs border transition-colors',
              filterTier === tier
                ? tier === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : cn(TIER_CONFIG[tier]?.bg, TIER_CONFIG[tier]?.text, TIER_CONFIG[tier]?.border)
                : 'bg-muted border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {tier === 'all' ? 'All' : TIER_CONFIG[tier].label}
          </button>
        ))}
        <button
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-border bg-muted hover:bg-muted/80"
        >
          <ArrowUpDown className="w-3 h-3" />
          Score {sortDir === 'desc' ? '↓' : '↑'}
        </button>
      </div>

      {/* Scorecards Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : scorecards.length === 0 ? (
        <div className="py-16 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No scorecards yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Scorecards are computed from metering data. Ensure tenants have activity this month.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {scorecards.map((scorecard) => {
            const tierCfg = TIER_CONFIG[scorecard.healthTier];
            const billingBadge = BILLING_BADGE[scorecard.billingStatus];
            const isSelected = selectedOrg?.id === scorecard.id;

            return (
              <div
                key={scorecard.id}
                className={cn(
                  'border rounded-xl transition-all',
                  isSelected
                    ? 'border-sky-500/40 bg-sky-500/5'
                    : 'border-border bg-card hover:border-border/80',
                )}
              >
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setSelectedOrg(isSelected ? null : scorecard)}
                >
                  {/* Health Score */}
                  <HealthScoreGauge score={scorecard.healthScore} tier={scorecard.healthTier} />

                  {/* Org info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">
                        {scorecard.orgName ?? `Org #${scorecard.orgId}`}
                      </p>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded border font-medium',
                          billingBadge.className,
                        )}
                      >
                        {billingBadge.label}
                      </span>
                      {scorecard.plan && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground capitalize">
                          {scorecard.plan}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <DeltaBadge delta={scorecard.healthScoreDelta} />
                      <span className="text-[10px] text-muted-foreground">vs last month</span>
                    </div>
                  </div>

                  {/* Signal mini-bars */}
                  <div className="hidden md:flex flex-col gap-1 w-48 shrink-0">
                    <ScoreBar value={scorecard.featureAdoptionPct} accentClass="bg-violet-500" />
                    <ScoreBar value={scorecard.slaAdherencePct} accentClass="bg-emerald-500" />
                    <ScoreBar
                      value={Math.max(0, 100 - scorecard.errorRatePct * 5)}
                      accentClass="bg-sky-500"
                    />
                  </div>

                  {/* Users */}
                  <div className="hidden lg:flex flex-col items-end shrink-0 text-right">
                    <span className="text-sm font-bold">{scorecard.activeUsers}</span>
                    <span className="text-[10px] text-muted-foreground">
                      of {scorecard.totalUsers} active
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      computeMutation.mutate(scorecard.orgId);
                    }}
                    disabled={computeMutation.isPending}
                    className="shrink-0 p-1.5 rounded-lg bg-muted border border-border hover:bg-muted/80 text-muted-foreground transition-colors"
                    title="Recompute score"
                  >
                    <RefreshCw
                      className={cn('w-3 h-3', computeMutation.isPending && 'animate-spin')}
                    />
                  </button>

                  <ChevronRight
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform shrink-0',
                      isSelected && 'rotate-90',
                    )}
                  />
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/40">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {/* Signal breakdown */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Signal Breakdown
                        </p>
                        {[
                          {
                            label: 'Active User Ratio',
                            value:
                              scorecard.totalUsers > 0
                                ? Math.round((scorecard.activeUsers / scorecard.totalUsers) * 100)
                                : 0,
                            suffix: '%',
                            icon: Users,
                          },
                          {
                            label: 'Feature Adoption',
                            value: scorecard.featureAdoptionPct,
                            suffix: '%',
                            icon: Zap,
                          },
                          {
                            label: 'SLA Adherence',
                            value: scorecard.slaAdherencePct,
                            suffix: '%',
                            icon: ShieldCheck,
                          },
                          {
                            label: 'Error Rate',
                            value: scorecard.errorRatePct,
                            suffix: '%',
                            icon: AlertTriangle,
                          },
                          {
                            label: 'Session Count',
                            value: scorecard.sessionCount,
                            suffix: '',
                            icon: Activity,
                          },
                        ].map(({ label, value, suffix, icon: Icon }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                              <Icon className="w-3 h-3" />
                              {label}
                            </span>
                            <span className="text-xs font-mono font-semibold">
                              {value}
                              {suffix}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Benchmarking */}
                      {benchmarks && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            vs Platform Average
                          </p>
                          <BenchmarkBar
                            value={scorecard.healthScore}
                            benchmark={benchmarks.avgHealthScore}
                            label="Health Score"
                            accentClass="text-sky-400"
                          />
                          <BenchmarkBar
                            value={scorecard.featureAdoptionPct}
                            benchmark={benchmarks.avgFeatureAdoptionPct}
                            label="Feature Adoption %"
                            accentClass="text-violet-400"
                          />
                          <BenchmarkBar
                            value={scorecard.slaAdherencePct}
                            benchmark={benchmarks.avgSlaAdherencePct}
                            label="SLA Adherence %"
                            accentClass="text-emerald-400"
                          />
                        </div>
                      )}

                      {/* Status panel */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Status
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', tierCfg.dot)} />
                            <span className="text-xs">{tierCfg.label} health tier</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {scorecard.billingStatus === 'current' ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            ) : scorecard.billingStatus === 'overdue' ? (
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span className="text-xs capitalize">
                              {scorecard.billingStatus} billing
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs capitalize">
                              {scorecard.plan ?? 'free'} plan
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Computed {new Date(scorecard.computedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
