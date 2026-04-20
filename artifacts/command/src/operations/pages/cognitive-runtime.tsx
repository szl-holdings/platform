import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  GitBranch,
  Layers,
  Play,
  Radio,
  RefreshCw,
  Shield,
  Target,
  TrendingDown,
  Users,
  Zap,
} from 'lucide-react';
import type { JSX } from 'react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e', panel: '#0e1219' };
const BORDER = {
  subtle: 'rgba(255,255,255,0.04)',
  muted: 'rgba(255,255,255,0.06)',
  accent: 'rgba(212,160,84,0.12)',
};
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ACCENT = '#d4a054';

type Tab =
  | 'signal-fusion'
  | 'bottlenecks'
  | 'interventions'
  | 'accountability'
  | 'var'
  | 'narrative';

const TABS: { id: Tab; label: string; icon: typeof Brain; desc: string }[] = [
  {
    id: 'signal-fusion',
    label: 'Signal Fusion',
    icon: Layers,
    desc: 'Fused entities across all Lyte sources → CONSTELLATION',
  },
  {
    id: 'bottlenecks',
    label: 'Bottleneck Intelligence',
    icon: GitBranch,
    desc: 'Flow-blockers ranked by impact and urgency',
  },
  {
    id: 'interventions',
    label: 'Interventions',
    icon: Target,
    desc: 'Ranked intervention queue with evidence and predicted VaR',
  },
  {
    id: 'accountability',
    label: 'Accountability Map',
    icon: Users,
    desc: 'Owner-bottleneck linkage with escalation paths',
  },
  {
    id: 'var',
    label: 'Value at Risk',
    icon: TrendingDown,
    desc: 'VaR aggregated per domain, owner, and period',
  },
  {
    id: 'narrative',
    label: 'Executive Narrative',
    icon: FileText,
    desc: 'Citation-backed executive brief for any time window',
  },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: `${color}20`,
        color,
      }}
    >
      {label.toUpperCase()}
    </span>
  );
}

function SeverityPill({ sev }: { sev: string }) {
  const c =
    sev === 'critical'
      ? '#ef4444'
      : sev === 'high'
        ? '#f97316'
        : sev === 'medium'
          ? ACCENT
          : '#6b7280';
  return <Pill label={sev} color={c} />;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: BG.elevated,
        border: `1px solid ${accent ? BORDER.accent : BORDER.subtle}`,
        borderRadius: 8,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: TEXT.tertiary,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ? ACCENT : TEXT.primary }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: TEXT.tertiary, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function useSignalFusion() {
  return useStandardQuery({
    queryKey: ['cognitive', 'signal-fusion'],
    queryFn: () => apiFetch<Record<string, unknown>>('/lyte/cognitive/signal-fusion'),
    staleTime: 30_000,
  });
}

function useBottlenecks() {
  return useStandardQuery({
    queryKey: ['cognitive', 'bottlenecks'],
    queryFn: () => apiFetch<Record<string, unknown>>('/lyte/cognitive/bottlenecks'),
    staleTime: 30_000,
  });
}

function useInterventions() {
  return useStandardQuery({
    queryKey: ['cognitive', 'interventions'],
    queryFn: () => apiFetch<Record<string, unknown>>('/lyte/cognitive/interventions'),
    staleTime: 30_000,
  });
}

function useAccountabilityMap() {
  return useStandardQuery({
    queryKey: ['cognitive', 'accountability-map'],
    queryFn: () => apiFetch<Record<string, unknown>>('/lyte/cognitive/accountability-map'),
    staleTime: 30_000,
  });
}

function useVaR(days: number) {
  return useStandardQuery({
    queryKey: ['cognitive', 'var', days],
    queryFn: () => apiFetch<Record<string, unknown>>(`/lyte/cognitive/value-at-risk?days=${days}`),
    staleTime: 30_000,
  });
}

function useNarrative(from: string, to: string) {
  return useStandardQuery({
    queryKey: ['cognitive', 'narrative', from, to],
    queryFn: () =>
      apiFetch<Record<string, unknown>>(
        `/lyte/cognitive/executive-narrative?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    staleTime: 60_000,
  });
}

function SignalFusionTab(): JSX.Element {
  const { data, isLoading, refetch, isFetching } = useSignalFusion();
  const qc = useQueryClient();

  const runMutation = useStandardMutation({
    mutationFn: () =>
      apiFetch<Record<string, unknown>>('/lyte/cognitive/signal-fusion/run', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cognitive', 'signal-fusion'] });
    },
  });

  if (isLoading) return <LoadingState />;
  const d = (data ?? {}) as Record<string, unknown>;
  const bySource = (d.bySource ?? {}) as Record<
    string,
    { count: number; severities: Record<string, number>; latestAt: string }
  >;
  const bySeverity = (d.bySeverity ?? {}) as Record<string, number>;
  const recentSignals = (d.recentSignals ?? []) as Array<{
    id: number;
    title: string;
    severity: string;
    source: string;
    status: string;
    receivedAt: string;
  }>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: TEXT.tertiary }}>
          Cross-domain signals fused into CONSTELLATION entity graph. Each source produces one node
          per entity.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 6,
              background: 'transparent',
              border: `1px solid ${BORDER.muted}`,
              color: TEXT.secondary,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <RefreshCw size={13} style={{ opacity: isFetching ? 0.5 : 1 }} />
            Refresh
          </button>
          <button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 6,
              background: `${ACCENT}18`,
              border: `1px solid ${ACCENT}30`,
              color: ACCENT,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Play size={13} />
            {runMutation.isPending ? 'Running...' : 'Run Fusion'}
          </button>
        </div>
      </div>

      {runMutation.data && (
        <div
          style={{
            background: '#16231a',
            border: '1px solid #22c55e30',
            borderRadius: 8,
            padding: '12px 16px',
          }}
        >
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 4 }}>
            Fusion complete
          </div>
          <div style={{ fontSize: 12, color: TEXT.secondary }}>
            {(runMutation.data as Record<string, unknown>).fusedCount as number} entities fused to
            CONSTELLATION · {(runMutation.data as Record<string, unknown>).errorCount as number}{' '}
            errors · {(runMutation.data as Record<string, unknown>).anomalyMetrics as number}{' '}
            anomaly metrics included
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Total Events" value={((d.totalEvents as number) ?? 0).toLocaleString()} />
        <StatCard
          label="Active Signals"
          value={((d.activeSignals as number) ?? 0).toLocaleString()}
          accent
        />
        <StatCard
          label="Firing Alerts"
          value={((d.firingAlerts as number) ?? 0).toLocaleString()}
        />
        <StatCard
          label="Open Escalations"
          value={((d.openEscalations as number) ?? 0).toLocaleString()}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div
          style={{
            background: BG.elevated,
            border: `1px solid ${BORDER.subtle}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: TEXT.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            By Source
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(bySource)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 10)
              .map(([src, info]) => (
                <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: TEXT.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {src}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT.tertiary }}>{info.count}</div>
                  <div
                    style={{
                      width: 60,
                      height: 4,
                      background: BORDER.muted,
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        background: ACCENT,
                        borderRadius: 2,
                        width: `${Math.min((info.count / ((d.totalEvents as number) || 1)) * 100 * 3, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div
          style={{
            background: BG.elevated,
            border: `1px solid ${BORDER.subtle}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: TEXT.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            By Severity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['critical', 'high', 'medium', 'low', 'info'].map((sev) => {
              const count = bySeverity[sev] ?? 0;
              const c =
                sev === 'critical'
                  ? '#ef4444'
                  : sev === 'high'
                    ? '#f97316'
                    : sev === 'medium'
                      ? ACCENT
                      : '#6b7280';
              return (
                <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: c,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: TEXT.primary,
                      textTransform: 'capitalize',
                    }}
                  >
                    {sev}
                  </div>
                  <div style={{ fontSize: 12, color: count > 0 ? c : TEXT.muted, fontWeight: 600 }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          background: BG.elevated,
          border: `1px solid ${BORDER.subtle}`,
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: TEXT.secondary,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Recent Signals (Pre-Fusion)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {recentSignals.length === 0 && (
            <div style={{ fontSize: 12, color: TEXT.muted, padding: '8px 0' }}>
              No signals found
            </div>
          )}
          {recentSignals.map((sig) => (
            <div
              key={sig.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: `1px solid ${BORDER.subtle}`,
              }}
            >
              <SeverityPill sev={sig.severity} />
              <div
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: TEXT.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sig.title}
              </div>
              <div style={{ fontSize: 11, color: TEXT.tertiary, flexShrink: 0 }}>{sig.source}</div>
              <div style={{ fontSize: 11, color: TEXT.muted, flexShrink: 0 }}>
                {new Date(sig.receivedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BottlenecksTab(): JSX.Element {
  const { data, isLoading, refetch, isFetching } = useBottlenecks();
  if (isLoading) return <LoadingState />;
  const d = (data ?? {}) as Record<string, unknown>;
  const rankedByOwner = (d.rankedByOwner ?? []) as Array<{
    owner: string;
    urgencyScore: number;
    level: string;
    bottlenecks: number;
    var: number;
    ageHours: number;
    items: string[];
    escalationCount: number;
  }>;
  const byDomain = (d.byDomain ?? {}) as Record<
    string,
    { count: number; var: number; level: string }
  >;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: TEXT.tertiary }}>
          Flow-blockers detected from stalled actions, blocked readiness items, and open
          escalations.
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 6,
            background: 'transparent',
            border: `1px solid ${BORDER.muted}`,
            color: TEXT.secondary,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <RefreshCw size={13} style={{ opacity: isFetching ? 0.5 : 1 }} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Total Bottlenecks" value={(d.totalBottlenecks as number) ?? 0} accent />
        <StatCard label="Blocked Items" value={(d.blockedItems as number) ?? 0} />
        <StatCard label="Stalled Actions" value={(d.stalledActions as number) ?? 0} />
        <StatCard label="Total VaR" value={fmt((d.totalVaR as number) ?? 0)} accent />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div
          style={{
            background: BG.elevated,
            border: `1px solid ${BORDER.subtle}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: TEXT.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            By Domain
          </div>
          {Object.entries(byDomain).map(([domain, info]) => {
            const c =
              info.level === 'critical'
                ? '#ef4444'
                : info.level === 'high'
                  ? '#f97316'
                  : info.level === 'medium'
                    ? ACCENT
                    : '#6b7280';
            return (
              <div
                key={domain}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 0',
                  borderBottom: `1px solid ${BORDER.subtle}`,
                }}
              >
                <div
                  style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }}
                />
                <div
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: TEXT.primary,
                    textTransform: 'capitalize',
                  }}
                >
                  {domain}
                </div>
                <div style={{ fontSize: 11, color: TEXT.tertiary }}>{info.count} items</div>
                <div style={{ fontSize: 12, color: c, fontWeight: 600 }}>{fmt(info.var)}</div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            background: BG.elevated,
            border: `1px solid ${BORDER.subtle}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: TEXT.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Top Ownership Gaps
          </div>
          {rankedByOwner
            .filter((o) => o.owner === 'Unassigned')
            .map((o) => (
              <div
                key="unassigned"
                style={{
                  padding: '8px 12px',
                  background: '#1a0a0a',
                  border: '1px solid #ef444430',
                  borderRadius: 6,
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>
                  Unassigned ownership gap
                </div>
                <div style={{ fontSize: 11, color: TEXT.secondary }}>
                  {o.bottlenecks} bottlenecks · {o.items.slice(0, 2).join(', ')}
                </div>
              </div>
            ))}
          {rankedByOwner
            .filter((o) => o.escalationCount > 0)
            .slice(0, 3)
            .map((o) => (
              <div
                key={o.owner}
                style={{ padding: '6px 0', borderBottom: `1px solid ${BORDER.subtle}` }}
              >
                <div style={{ fontSize: 12, color: TEXT.primary }}>{o.owner}</div>
                <div style={{ fontSize: 11, color: TEXT.tertiary }}>
                  {o.escalationCount} escalation{o.escalationCount > 1 ? 's' : ''} active
                </div>
              </div>
            ))}
        </div>
      </div>

      <div
        style={{
          background: BG.elevated,
          border: `1px solid ${BORDER.subtle}`,
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: TEXT.secondary,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Ranked by Owner Urgency
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rankedByOwner.length === 0 && (
            <div style={{ fontSize: 12, color: TEXT.muted }}>No active bottlenecks detected</div>
          )}
          {rankedByOwner.slice(0, 15).map((o) => {
            const c =
              o.level === 'critical'
                ? '#ef4444'
                : o.level === 'high'
                  ? '#f97316'
                  : o.level === 'medium'
                    ? ACCENT
                    : '#6b7280';
            return (
              <div
                key={o.owner}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: `1px solid ${BORDER.subtle}`,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 4,
                    background: BORDER.muted,
                    borderRadius: 2,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: c,
                      borderRadius: 2,
                      width: `${o.urgencyScore}%`,
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: c, fontWeight: 700, width: 28 }}>
                  {o.urgencyScore}
                </div>
                <div style={{ flex: 1, fontSize: 12, color: TEXT.primary }}>{o.owner}</div>
                <div style={{ fontSize: 11, color: TEXT.tertiary }}>{o.bottlenecks} blockers</div>
                <div style={{ fontSize: 11, color: TEXT.tertiary }}>{o.ageHours}h overdue</div>
                <div style={{ fontSize: 12, color: c, fontWeight: 600 }}>{fmt(o.var)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InterventionsTab(): JSX.Element {
  const { data, isLoading, refetch, isFetching } = useInterventions();
  if (isLoading) return <LoadingState />;
  const d = (data ?? {}) as Record<string, unknown>;
  const interventions = (d.interventions ?? []) as Array<{
    id: string;
    title: string;
    summary: string;
    reasoning: string;
    domain: string;
    urgency: string;
    priority: number;
    valueAtRisk: number;
    suggestedAction: string;
    suggestedOwner?: string;
    confidence: number;
    sourceSignalCount: number;
    evidence: Array<{ label: string; value: string; source?: string }>;
  }>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: TEXT.tertiary }}>
          Ranked by decision-engine: priority score, business impact, confidence, and SLA proximity.
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 6,
            background: 'transparent',
            border: `1px solid ${BORDER.muted}`,
            color: TEXT.secondary,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <RefreshCw size={13} style={{ opacity: isFetching ? 0.5 : 1 }} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Interventions" value={(d.count as number) ?? 0} />
        <StatCard label="Signals Evaluated" value={(d.totalSignalsEvaluated as number) ?? 0} />
        <StatCard label="Total VaR" value={fmt((d.totalVaR as number) ?? 0)} accent />
        <StatCard
          label="Blocked Items"
          value={(d.blockedItemsSummary as Record<string, number>)?.total ?? 0}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {interventions.length === 0 && (
          <div
            style={{
              background: BG.elevated,
              border: `1px solid ${BORDER.subtle}`,
              borderRadius: 8,
              padding: '24px',
              textAlign: 'center',
              color: TEXT.muted,
              fontSize: 13,
            }}
          >
            No active interventions required — all signals within normal parameters.
          </div>
        )}
        {interventions.map((iv, idx) => {
          const c =
            iv.urgency === 'critical'
              ? '#ef4444'
              : iv.urgency === 'urgent'
                ? '#f97316'
                : iv.urgency === 'moderate'
                  ? ACCENT
                  : '#6b7280';
          return (
            <div
              key={iv.id}
              style={{
                background: BG.elevated,
                border: `1px solid ${idx === 0 && iv.urgency === 'critical' ? '#ef444430' : BORDER.subtle}`,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: `${c}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{iv.priority}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Pill label={iv.urgency} color={c} />
                    <span
                      style={{ fontSize: 11, color: TEXT.tertiary, textTransform: 'capitalize' }}
                    >
                      {iv.domain}
                    </span>
                    <span style={{ fontSize: 11, color: TEXT.muted }}>
                      {iv.sourceSignalCount} signal{iv.sourceSignalCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary, marginBottom: 4 }}
                  >
                    {iv.title}
                  </div>
                  <div style={{ fontSize: 12, color: TEXT.secondary }}>{iv.summary}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c }}>
                    {fmt(iv.valueAtRisk)}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT.muted }}>VaR</div>
                </div>
              </div>

              <div
                style={{
                  background: BG.panel,
                  border: `1px solid ${BORDER.subtle}`,
                  borderRadius: 6,
                  padding: '10px 12px',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: TEXT.tertiary,
                    marginBottom: 6,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Evidence
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {iv.evidence.map((e, i) => (
                    <div key={i} style={{ fontSize: 11, color: TEXT.secondary }}>
                      <span style={{ color: TEXT.tertiary }}>{e.label}:</span>{' '}
                      <span style={{ color: TEXT.primary, fontWeight: 600 }}>{e.value}</span>
                      {e.source && <span style={{ color: TEXT.muted }}> [{e.source}]</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ fontSize: 11, color: TEXT.tertiary }}>
                  Action: <span style={{ color: TEXT.secondary }}>{iv.suggestedAction}</span>
                  {iv.suggestedOwner && (
                    <>
                      {' '}
                      · Owner: <span style={{ color: TEXT.secondary }}>{iv.suggestedOwner}</span>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 11, color: TEXT.tertiary }}>
                  Confidence:{' '}
                  <span style={{ color: TEXT.primary, fontWeight: 600 }}>
                    {Math.round(iv.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AccountabilityTab(): JSX.Element {
  const { data, isLoading, refetch, isFetching } = useAccountabilityMap();
  const [expanded, setExpanded] = useState<string | null>(null);
  if (isLoading) return <LoadingState />;
  const d = (data ?? {}) as Record<string, unknown>;
  const map = (d.accountabilityMap ?? []) as Array<{
    owner: string;
    ownerConfidence: string;
    urgencyScore: number;
    bottlenecks: Array<{ id: number; title: string; type: string; var: number }>;
    interventions: Array<{
      id: number;
      title: string;
      category: string;
      priority: string;
      state: string;
    }>;
    incidents: Array<{ id: number; title: string; severity: string }>;
    escalationPath: Array<{
      escalationId: number;
      title: string;
      severity: string;
      assignedTo: string | null;
    }>;
    totalVaR: number;
  }>;
  const gaps = (d.ownershipGaps ?? {}) as { count: number; estimatedVaR: number };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: TEXT.tertiary }}>
          Bottlenecks and interventions mapped to owners with escalation paths.
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 6,
            background: 'transparent',
            border: `1px solid ${BORDER.muted}`,
            color: TEXT.secondary,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <RefreshCw size={13} style={{ opacity: isFetching ? 0.5 : 1 }} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Named Owners" value={(d.ownerCount as number) ?? 0} />
        <StatCard label="Ownership Gaps" value={gaps.count} accent={gaps.count > 0} />
        <StatCard label="Gap VaR" value={fmt(gaps.estimatedVaR)} accent={gaps.estimatedVaR > 0} />
        <StatCard label="Total VaR Mapped" value={fmt((d.totalVaRMapped as number) ?? 0)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {map.length === 0 && (
          <div style={{ fontSize: 12, color: TEXT.muted }}>No accountability data found</div>
        )}
        {map.map((entry) => {
          const isExpanded = expanded === entry.owner;
          const c =
            entry.urgencyScore >= 60
              ? '#ef4444'
              : entry.urgencyScore >= 40
                ? '#f97316'
                : entry.urgencyScore >= 20
                  ? ACCENT
                  : '#6b7280';
          const confColor =
            entry.ownerConfidence === 'gap'
              ? '#ef4444'
              : entry.ownerConfidence === 'contested'
                ? ACCENT
                : '#22c55e';
          return (
            <div
              key={entry.owner}
              style={{
                background: BG.elevated,
                border: `1px solid ${BORDER.subtle}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : entry.owner)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: `${c}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: c }}>
                    {entry.urgencyScore}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary }}>
                    {entry.owner}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT.tertiary }}>
                    {entry.bottlenecks.length} blockers · {entry.interventions.length} actions ·{' '}
                    {entry.incidents.length} incidents
                  </div>
                </div>
                <Pill label={entry.ownerConfidence} color={confColor} />
                <div style={{ fontSize: 13, fontWeight: 600, color: c, marginRight: 8 }}>
                  {fmt(entry.totalVaR)}
                </div>
                <ChevronRight
                  size={14}
                  style={{
                    color: TEXT.muted,
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>

              {isExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${BORDER.subtle}` }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      paddingTop: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: TEXT.tertiary,
                          marginBottom: 8,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Bottlenecks
                      </div>
                      {entry.bottlenecks.length === 0 && (
                        <div style={{ fontSize: 11, color: TEXT.muted }}>None</div>
                      )}
                      {entry.bottlenecks.slice(0, 5).map((b) => (
                        <div
                          key={b.id}
                          style={{ fontSize: 11, color: TEXT.secondary, padding: '3px 0' }}
                        >
                          <span style={{ color: TEXT.muted }}>[{b.type}]</span> {b.title}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: TEXT.tertiary,
                          marginBottom: 8,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Active Interventions
                      </div>
                      {entry.interventions.length === 0 && (
                        <div style={{ fontSize: 11, color: TEXT.muted }}>None</div>
                      )}
                      {entry.interventions.slice(0, 5).map((iv) => (
                        <div
                          key={iv.id}
                          style={{ fontSize: 11, color: TEXT.secondary, padding: '3px 0' }}
                        >
                          <span style={{ color: iv.priority === 'urgent' ? '#ef4444' : ACCENT }}>
                            [{iv.priority}]
                          </span>{' '}
                          {iv.title}
                        </div>
                      ))}
                    </div>
                  </div>
                  {entry.escalationPath.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: TEXT.tertiary,
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Escalation Path
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {entry.escalationPath.map((ep) => (
                          <div
                            key={ep.escalationId}
                            style={{
                              fontSize: 11,
                              color: TEXT.secondary,
                              background: BG.panel,
                              border: `1px solid ${BORDER.subtle}`,
                              borderRadius: 4,
                              padding: '2px 8px',
                            }}
                          >
                            ESC-{ep.escalationId}: {ep.title.slice(0, 30)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VaRTab(): JSX.Element {
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useVaR(days);
  if (isLoading) return <LoadingState />;
  const d = (data ?? {}) as Record<string, unknown>;
  const byDomain = (d.byDomain ?? {}) as Record<
    string,
    { var: number; count: number; items: number }
  >;
  const byOwner = (d.byOwner ?? []) as Array<{
    owner: string;
    var: number;
    count: number;
    overdue: number;
  }>;
  const topRisks = (d.topRisks ?? []) as Array<{
    id: number;
    title: string;
    owner: string;
    domain: string;
    var: number;
    priority: string;
    state: string;
    category: string;
  }>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '5px 12px',
                borderRadius: 5,
                fontSize: 12,
                cursor: 'pointer',
                background: days === d ? `${ACCENT}20` : 'transparent',
                border: `1px solid ${days === d ? `${ACCENT}40` : BORDER.muted}`,
                color: days === d ? ACCENT : TEXT.secondary,
              }}
            >
              {d}d
            </button>
          ))}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 6,
            background: 'transparent',
            border: `1px solid ${BORDER.muted}`,
            color: TEXT.secondary,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <RefreshCw size={13} style={{ opacity: isFetching ? 0.5 : 1 }} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Total VaR" value={fmt((d.totalVaR as number) ?? 0)} accent />
        <StatCard label="Action VaR" value={fmt((d.actionVaR as number) ?? 0)} />
        <StatCard label="Critical Exposure" value={fmt((d.criticalExposure as number) ?? 0)} />
        <StatCard label="Active Escalations" value={(d.escalationCount as number) ?? 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div
          style={{
            background: BG.elevated,
            border: `1px solid ${BORDER.subtle}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: TEXT.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            By Domain
          </div>
          {Object.entries(byDomain)
            .sort((a, b) => b[1].var - a[1].var)
            .map(([domain, info]) => (
              <div
                key={domain}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: `1px solid ${BORDER.subtle}`,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: TEXT.primary,
                    textTransform: 'capitalize',
                  }}
                >
                  {domain}
                </div>
                <div style={{ fontSize: 11, color: TEXT.tertiary }}>{info.count} items</div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: info.var > 500_000 ? '#ef4444' : info.var > 100_000 ? '#f97316' : ACCENT,
                  }}
                >
                  {fmt(info.var)}
                </div>
              </div>
            ))}
        </div>

        <div
          style={{
            background: BG.elevated,
            border: `1px solid ${BORDER.subtle}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: TEXT.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            By Owner
          </div>
          {byOwner.slice(0, 8).map((o) => (
            <div
              key={o.owner}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: `1px solid ${BORDER.subtle}`,
              }}
            >
              <div style={{ flex: 1, fontSize: 12, color: TEXT.primary }}>{o.owner}</div>
              {o.overdue > 0 && <Pill label={`${o.overdue} overdue`} color="#ef4444" />}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: o.var > 500_000 ? '#ef4444' : ACCENT,
                }}
              >
                {fmt(o.var)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: BG.elevated,
          border: `1px solid ${BORDER.subtle}`,
          borderRadius: 8,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: TEXT.secondary,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Top Risks by VaR
        </div>
        {topRisks.length === 0 && (
          <div style={{ fontSize: 12, color: TEXT.muted }}>
            No quantified risk exposure in this period
          </div>
        )}
        {topRisks.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 0',
              borderBottom: `1px solid ${BORDER.subtle}`,
            }}
          >
            <div style={{ fontSize: 11, color: TEXT.muted, width: 16, textAlign: 'right' }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: TEXT.primary }}>{r.title}</div>
              <div style={{ fontSize: 11, color: TEXT.tertiary }}>
                {r.owner} · {r.category.replace(/_/g, ' ')} · {r.domain}
              </div>
            </div>
            <SeverityPill sev={r.priority === 'urgent' ? 'critical' : r.priority} />
            <div
              style={{ fontSize: 13, fontWeight: 700, color: r.var > 500_000 ? '#ef4444' : ACCENT }}
            >
              {fmt(r.var)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NarrativeTab(): JSX.Element {
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [applied, setApplied] = useState({ from, to });

  const { data, isLoading, isFetching } = useNarrative(applied.from, applied.to);
  if (isLoading) return <LoadingState />;
  const d = (data ?? {}) as Record<string, unknown>;
  const paragraphs = (d.paragraphs ?? []) as string[];
  const recommendations = (d.recommendations ?? []) as string[];
  const citations = (d.citations ?? []) as Array<{
    ref: string;
    source: string;
    value: string;
    at: string;
  }>;
  const headline = (d.headline ?? {}) as Record<string, number>;
  const status = (d.operationalStatus as string) ?? 'stable';
  const statusColor =
    status === 'elevated-risk' ? '#ef4444' : status === 'monitoring' ? ACCENT : '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 12, color: TEXT.tertiary }}>Window:</div>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={{
            background: BG.elevated,
            border: `1px solid ${BORDER.muted}`,
            borderRadius: 5,
            padding: '5px 10px',
            color: TEXT.primary,
            fontSize: 12,
          }}
        />
        <span style={{ color: TEXT.muted }}>–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{
            background: BG.elevated,
            border: `1px solid ${BORDER.muted}`,
            borderRadius: 5,
            padding: '5px 10px',
            color: TEXT.primary,
            fontSize: 12,
          }}
        />
        <button
          onClick={() => setApplied({ from, to })}
          disabled={isFetching}
          style={{
            padding: '5px 14px',
            borderRadius: 5,
            background: `${ACCENT}18`,
            border: `1px solid ${ACCENT}30`,
            color: ACCENT,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {isFetching ? 'Loading...' : 'Generate'}
        </button>
      </div>

      {data && (
        <>
          <div
            style={{
              background: BG.elevated,
              border: `1px solid ${statusColor}30`,
              borderRadius: 8,
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: statusColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {status.replace(/-/g, ' ')}
              </span>
              <span style={{ fontSize: 12, color: TEXT.muted }}>
                · {(d.window as Record<string, string>)?.label}
              </span>
              <span style={{ fontSize: 11, color: TEXT.muted, marginLeft: 'auto' }}>
                Brief {d.briefId as string}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                marginBottom: 4,
              }}
            >
              {[
                ['Total Signals', headline.totalSignals],
                ['Critical', headline.criticalSignals],
                ['Open Incidents', headline.openIncidents],
                ['Total VaR', fmt(headline.totalVaR ?? 0)],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div
                    style={{
                      fontSize: 10,
                      color: TEXT.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT.primary }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: BG.elevated,
              border: `1px solid ${BORDER.subtle}`,
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: TEXT.secondary,
                marginBottom: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Executive Narrative
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  style={{ fontSize: 13, color: TEXT.secondary, lineHeight: 1.65, margin: 0 }}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>

          {recommendations.length > 0 && (
            <div
              style={{
                background: BG.elevated,
                border: `1px solid ${ACCENT}20`,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: ACCENT,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Recommendations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recommendations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <Zap size={13} color={ACCENT} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: TEXT.secondary }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {citations.length > 0 && (
            <div
              style={{
                background: BG.elevated,
                border: `1px solid ${BORDER.subtle}`,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: TEXT.tertiary,
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Citations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {citations.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <code
                      style={{
                        fontSize: 11,
                        color: ACCENT,
                        background: `${ACCENT}10`,
                        padding: '1px 6px',
                        borderRadius: 3,
                      }}
                    >
                      {c.ref}
                    </code>
                    <span style={{ fontSize: 11, color: TEXT.secondary, flex: 1 }}>{c.value}</span>
                    <span style={{ fontSize: 10, color: TEXT.muted }}>{c.source}</span>
                    <span style={{ fontSize: 10, color: TEXT.muted }}>
                      {new Date(c.at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LoadingState(): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        gap: 10,
      }}
    >
      <Activity size={16} color={ACCENT} style={{ opacity: 0.7 }} />
      <span style={{ fontSize: 13, color: TEXT.tertiary }}>Loading cognitive data…</span>
    </div>
  );
}

export default function CognitiveRuntimePage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('signal-fusion');
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div
      style={{
        background: BG.page,
        minHeight: '100vh',
        padding: '24px 28px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Brain size={18} color={ACCENT} />
            <span style={{ fontSize: 18, fontWeight: 700, color: TEXT.primary }}>
              Cognitive Runtime
            </span>
            <span
              style={{
                fontSize: 11,
                color: TEXT.muted,
                background: `${ACCENT}10`,
                border: `1px solid ${ACCENT}20`,
                borderRadius: 4,
                padding: '2px 8px',
                fontWeight: 600,
                letterSpacing: '0.06em',
              }}
            >
              LYTE AI
            </span>
          </div>
          <div style={{ fontSize: 13, color: TEXT.tertiary }}>
            Six cognitive upgrade targets: signal fusion, bottleneck intelligence, intervention
            ranking, accountability mapping, value-at-risk scoring, and executive narrative
            generation.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 2,
            marginBottom: 24,
            background: BG.surface,
            borderRadius: 8,
            padding: 4,
          }}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  background: active ? `${ACCENT}18` : 'transparent',
                  color: active ? ACCENT : TEXT.secondary,
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: TEXT.muted }}>{current.desc}</div>
        </div>

        {tab === 'signal-fusion' && <SignalFusionTab />}
        {tab === 'bottlenecks' && <BottlenecksTab />}
        {tab === 'interventions' && <InterventionsTab />}
        {tab === 'accountability' && <AccountabilityTab />}
        {tab === 'var' && <VaRTab />}
        {tab === 'narrative' && <NarrativeTab />}
      </div>
    </div>
  );
}
