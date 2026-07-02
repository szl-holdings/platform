// @ts-nocheck

import { useStandardQuery } from '@szl-holdings/api-client-react';
import { PolicyModeBadge } from '@szl-holdings/design-system/proof/policy-mode-badge';
import { ActionLoop, DataProvenance, RoleSelector } from '@szl-holdings/shared-ui/data-provenance';
import { DataStateBadge } from '@szl-holdings/shared-ui/data-state-badge';
import type { DataProvenanceInfo } from '@szl-holdings/shared-ui/ontology';
import { useRealtimeChannel } from '@szl-holdings/shared-ui/use-realtime-channel';
import { formatCurrency } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  ChevronRight,
  Eye,
  Globe,
  Map,
  MapPin,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { A11oySignalMesh } from '@/components/a11oy-signal-mesh';
import { AgentAvatar, RiskBadge, StageBadge } from '@/components/brokerage-ui';
import { agents } from '@/data/brokerage';
import { properties } from '@/data/portfolio';
import { useMapboxToken } from '@/hooks/use-mapbox-token';
import { metricDisplay, TERRA_PORTFOLIO_AUM } from '@/lib/claims';

const PropertyMap = lazy(() => import('@/components/property-map'));

const DS = {
  page: '#08090e',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.05)',
  borderMuted: 'rgba(255,255,255,0.03)',
  accent: { gold: '#b8943c', blue: '#8a8a8a', green: '#c9b787', red: '#8a8a8a' },
  text: {
    primary: 'rgba(255,255,255,0.85)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.62)',
    muted: 'rgba(255,255,255,0.55)',
  },
};

const DOCTRINE_MODULES = [
  {
    id: 'foundation',
    label: 'Foundation',
    icon: Building2,
    color: DS.text.tertiary,
    desc: 'Data layer',
    href: '/investor-mode',
  },
  {
    id: 'watch',
    label: 'Watch',
    icon: Eye,
    color: DS.accent.gold,
    count: 3,
    desc: 'Distress signals',
    href: '/distress-engine',
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: Activity,
    color: DS.accent.blue,
    count: 8,
    desc: 'Active deals',
    href: '/pipeline',
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: BarChart3,
    color: DS.text.tertiary,
    desc: 'Market data',
    href: '/market',
  },
  {
    id: 'action',
    label: 'Action',
    icon: ArrowRight,
    color: DS.text.tertiary,
    desc: 'Execute',
    href: '/deals',
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: DS.accent.red,
  high: DS.accent.gold,
  medium: DS.text.tertiary,
  low: DS.text.muted,
};

const FLAG_STYLES: Record<string, { color: string; label: string }> = {
  urgent: { color: DS.accent.red, label: 'Urgent' },
  active: { color: DS.accent.gold, label: 'Active' },
  watch: { color: DS.text.tertiary, label: 'Watch' },
};

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapDealToQueueItem(deal: Record<string, unknown>) {
  const price =
    typeof deal.price === 'number'
      ? deal.price
      : typeof deal.price === 'string'
        ? parseFloat(deal.price)
        : 0;
  const stage = typeof deal.stage === 'string' ? deal.stage : 'lead';
  const capStage = stage.charAt(0).toUpperCase() + stage.slice(1);
  const riskLevel = typeof deal.riskLevel === 'string' ? deal.riskLevel : 'medium';
  const flag = riskLevel === 'high' ? 'urgent' : riskLevel === 'medium' ? 'active' : 'watch';
  const prob = typeof deal.probability === 'number' ? deal.probability : 50;
  const days = typeof deal.daysInStage === 'number' ? deal.daysInStage : 0;
  return {
    address: String(deal.address ?? '—'),
    type: String(deal.type ?? 'Property'),
    owner: String(deal.ownerName ?? '—'),
    stage: capStage,
    confidence: prob,
    evidence: `${days}d in stage · ${riskLevel} risk`,
    nextAction: String(deal.nextAction ?? 'Review'),
    value: price > 0 ? `$${(price / 1e6).toFixed(1)}M` : '—',
    flag: flag as 'urgent' | 'active' | 'watch',
  };
}

function mapAlertToSignal(alert: Record<string, unknown>) {
  const sev = String(alert.severity ?? 'medium');
  const alertType = String(alert.alertType ?? 'signal');
  const borough = String(alert.borough ?? 'NYC');
  const address = alert.address ? String(alert.address) : null;
  const title = alert.title ? String(alert.title) : null;
  const text =
    title ??
    (address ? `${address} — ${alertType} (${borough})` : `${alertType} detected in ${borough}`);
  return {
    time: relativeTime((alert.triggeredAt as string) ?? null),
    text,
    severity: (['critical', 'high', 'medium', 'low'].includes(sev) ? sev : 'medium') as
      | 'critical'
      | 'high'
      | 'medium'
      | 'low',
  };
}

const _BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
const API = '/api';

export default function TerraIntelligence() {
  const qc = useQueryClient();
  const { lastMessage: wsSignal } = useRealtimeChannel('terra-signals');

  const { data: dealsData, isError: dealsError } = useStandardQuery({
    queryKey: ['terra-dashboard-deals'],
    queryFn: () =>
      fetch(`${API}/terra/pipeline/deals?limit=20`)
        .then((r) => {
          if (!r.ok) throw new Error(`API error ${r.status}`);
          return r.json();
        })
        .then((d) => d.data ?? d),
    staleTime: 60000,
    retry: 1,
    refetchInterval: 120_000,
  });

  const { data: alertsData } = useStandardQuery({
    queryKey: ['terra-dashboard-alerts'],
    queryFn: () =>
      fetch(`${API}/terra/distress/alerts?limit=10`)
        .then((r) => {
          if (!r.ok) throw new Error(`API error ${r.status}`);
          return r.json();
        })
        .then((d) => d.data ?? d),
    staleTime: 60000,
    retry: 1,
    refetchInterval: 120_000,
  });

  const dataMode: 'live' | 'demo' = !dealsError && dealsData?.dataMode === 'live' ? 'live' : 'demo';

  const liveDeals: Record<string, unknown>[] =
    Array.isArray(dealsData?.deals) && dealsData.deals.length > 0 ? dealsData.deals : [];
  const liveAlerts: Record<string, unknown>[] =
    Array.isArray(alertsData?.alerts) && alertsData.alerts.length > 0 ? alertsData.alerts : [];

  const OPPORTUNITY_QUEUE = liveDeals.slice(0, 8).map(mapDealToQueueItem);

  const MARKET_SIGNALS = liveAlerts.slice(0, 8).map(mapAlertToSignal);

  const liveDealCount = dealsData?.count ?? liveDeals.length;
  const liveListingCount = liveDeals.length;

  const stageLC = (s: string) => s.toLowerCase();
  const PIPELINE_STAGES = [
    {
      stage: 'Distress',
      color: DS.accent.red,
      deals: OPPORTUNITY_QUEUE.filter((o) => ['distress', 'lead'].includes(stageLC(o.stage)))
        .length,
    },
    {
      stage: 'Watch',
      color: DS.accent.gold,
      deals: OPPORTUNITY_QUEUE.filter((o) => ['watch', 'showing'].includes(stageLC(o.stage)))
        .length,
    },
    {
      stage: 'Negotiate',
      color: DS.accent.blue,
      deals: OPPORTUNITY_QUEUE.filter((o) =>
        ['investigate', 'offer', 'negotiation', 'negotiate'].includes(stageLC(o.stage)),
      ).length,
    },
    {
      stage: 'Qualified',
      color: DS.accent.green,
      deals: OPPORTUNITY_QUEUE.filter((o) =>
        ['qualified', 'accepted', 'under-contract'].includes(stageLC(o.stage)),
      ).length,
    },
    {
      stage: 'Closed',
      color: DS.text.secondary,
      deals: OPPORTUNITY_QUEUE.filter((o) => stageLC(o.stage) === 'closed').length,
    },
  ];
  const stageTotalDeals = PIPELINE_STAGES.reduce((s, p) => s + p.deals, 0);

  useEffect(() => {
    if (!wsSignal) return;
    qc.invalidateQueries({ queryKey: ['terra-dashboard-deals'] });
    qc.invalidateQueries({ queryKey: ['terra-dashboard-alerts'] });
    qc.invalidateQueries({ queryKey: ['terra-deals'] });
    qc.invalidateQueries({ queryKey: ['terra-signals'] });
    qc.invalidateQueries({ queryKey: ['terra-leads'] });
  }, [wsSignal, qc]);

  const [activeRole, setActiveRole] = useState('operator');
  const criticalSignals = liveAlerts.filter((a) => a.severity === 'critical');
  const topDeals = liveDeals
    .sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
    .slice(0, 5);
  const topAgents = [...agents].sort((a, b) => b.commissionMTD - a.commissionMTD).slice(0, 4);
  const { token: mapToken, isLoading: mapTokenLoading } = useMapboxToken();
  const [showMap, setShowMap] = useState(false);
  const portfolioValue = properties.reduce((s, p) => s + (p.value ?? 0), 0);
  const portfolioLabel =
    portfolioValue >= 1e9
      ? `$${(portfolioValue / 1e9).toFixed(1)}B`
      : portfolioValue >= 1e6
        ? `$${(portfolioValue / 1e6).toFixed(0)}M`
        : '—';

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-base font-bold text-white tracking-tight font-display">
              Property Intelligence
            </h1>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
              style={{
                color: DS.accent.gold,
                background: `${DS.accent.gold}10`,
                border: `1px solid ${DS.accent.gold}20`,
              }}
            >
              Terra
            </span>
          </div>
          <p className="text-[10px] mt-0.5 font-mono" style={{ color: DS.text.muted }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <PolicyModeBadge product="terra" />
          <DataStateBadge state={dataMode} label={dataMode === 'live' ? 'Live' : 'Demo'} />
          {criticalSignals.length > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
              style={{
                color: DS.accent.red,
                background: `${DS.accent.red}09`,
                border: `1px solid ${DS.accent.red}18`,
                animation: 'pulse 2s infinite',
              }}
            >
              <AlertTriangle className="w-3 h-3" />
              {criticalSignals.length} Critical
            </div>
          )}
        </div>
      </div>

      {/* Role Selector + Data Provenance row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <RoleSelector
          currentRole={activeRole}
          onRoleChange={setActiveRole}
          roles={[
            {
              id: 'executive',
              label: 'Executive',
              description: 'Portfolio health, acquisition pipeline, top-line metrics',
            },
            {
              id: 'operator',
              label: 'Analyst',
              description: 'Distress signals, opportunity queue, ownership intelligence',
            },
            {
              id: 'analyst',
              label: 'Broker',
              description: 'Deal pipeline, lead queue, SLA tracking',
            },
            {
              id: 'admin',
              label: 'Admin',
              description: 'System configuration, data freshness, audit',
            },
            { id: 'buyer', label: 'Buyer / Demo', description: 'Product capabilities overview' },
          ]}
        />
        <DataProvenance
          compact
          provenance={
            {
              source: 'Terra Property Intelligence Engine',
              lastUpdated: new Date().toISOString(),
              freshness: dataMode === 'live' ? 'realtime' : 'minutes',
              confidence: 'high',
              dataState: dataMode,
              owner: 'Terra Acquisitions',
            } as DataProvenanceInfo
          }
        />
      </div>

      {/* Role-based context bar */}
      {activeRole && (
        <div
          className="rounded-xl border px-4 py-2.5 flex items-center gap-3 flex-wrap"
          style={{
            borderColor: `rgba(${activeRole === 'executive' ? '184,148,60' : activeRole === 'analyst' ? '58,122,212' : activeRole === 'buyer' ? '58,122,212' : '64,133,106'},0.15)`,
            background: `rgba(${activeRole === 'executive' ? '184,148,60' : activeRole === 'analyst' ? '58,122,212' : activeRole === 'buyer' ? '58,122,212' : '64,133,106'},0.04)`,
          }}
        >
          <div
            className="text-[10px] uppercase tracking-wider font-semibold shrink-0"
            style={{ color: DS.text.muted }}
          >
            {activeRole === 'executive' && 'Portfolio View'}
            {activeRole === 'operator' && 'Analyst Focus'}
            {activeRole === 'analyst' && 'Broker Focus'}
            {activeRole === 'admin' && 'Admin View'}
            {activeRole === 'buyer' && 'Demo View'}
          </div>
          <div className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {activeRole === 'executive' &&
              `${liveListingCount} active listings · ${OPPORTUNITY_QUEUE.length} live acquisition targets · ${OPPORTUNITY_QUEUE.filter((o) => o.flag === 'urgent').length} urgent. Distress cluster activity detected. Total portfolio tracked: ${portfolioLabel}. ${metricDisplay(TERRA_PORTFOLIO_AUM)} assets under analysis.`}
            {activeRole === 'operator' &&
              `${criticalSignals.length} critical market signals active. ${OPPORTUNITY_QUEUE.filter((o) => o.stage === 'Distress' || o.stage === 'distress' || o.stage === 'lead').length} distress opportunities require outreach. Confidence-weighted queue ready for review.`}
            {activeRole === 'analyst' &&
              `${topDeals.length} deals in pipeline. ${topAgents.length} active brokers. ${OPPORTUNITY_QUEUE.filter((o) => o.flag === 'urgent').length} inquiries require same-day response. Broker SLA warning on aging inquiries.`}
            {activeRole === 'admin' &&
              `Data mode: ${dataMode}. All Terra intelligence sources connected. Property map token: ${mapToken ? 'Active' : 'Inactive'}.`}
            {activeRole === 'buyer' &&
              "You're viewing Terra — SZL's property intelligence platform. Distress detection, ownership stack analysis, and broker orchestration all demonstrated with sample market data."}
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: DS.border, background: DS.surface }}
      >
        <div
          style={{
            height: 2,
            background: `linear-gradient(90deg, ${DS.accent.gold}, ${DS.accent.blue}40, transparent)`,
          }}
        />
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Active Listings', value: liveListingCount.toString(), color: DS.accent.gold },
            {
              label: 'Distress Signals',
              value: (liveAlerts.length || alertsData?.count || 0).toString(),
              color: DS.accent.red,
              pulse: true,
            },
            { label: 'Deals in Motion', value: liveDealCount.toString(), color: DS.accent.blue },
            {
              label: 'Portfolio Assets',
              value: properties.length.toString(),
              color: DS.accent.gold,
            },
          ].map((c, i) => (
            <div
              key={c.label}
              className="px-3 py-3 text-center"
              style={{ borderLeft: i > 0 ? `1px solid ${DS.borderMuted}` : 'none' }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span
                  className="text-base font-bold font-mono tabular-nums"
                  style={{ color: c.color }}
                >
                  {c.value}
                </span>
                {c.pulse && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                    style={{ background: c.color }}
                  />
                )}
              </div>
              <div
                className="text-[8px] font-medium uppercase tracking-wider"
                style={{ color: DS.text.muted }}
              >
                {c.label}
              </div>
              {c.sub && (
                <div className="text-[7px] mt-0.5" style={{ color: DS.text.muted }}>
                  {c.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Opportunity Score Ranking — inspired by CoStar ranked property results */}
      {OPPORTUNITY_QUEUE.length > 0 &&
        (() => {
          const scored = OPPORTUNITY_QUEUE.slice(0, 5)
            .map((o, i) => {
              const confidenceScore = o.confidence;
              const urgencyScore = o.flag === 'urgent' ? 30 : o.flag === 'active' ? 18 : 8;
              const valueScore = (() => {
                const v = parseFloat(o.value?.replace(/[$M]/g, '') || '0');
                return Math.min(30, Math.round(v * 3));
              })();
              const total = Math.min(
                100,
                Math.round(confidenceScore * 0.4 + urgencyScore + valueScore),
              );
              return { ...o, opportunityScore: total, rank: i + 1 };
            })
            .sort((a, b) => b.opportunityScore - a.opportunityScore);

          return (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: DS.borderMuted }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: `${DS.accent.gold}99` }}
                  >
                    Opportunity Score Ranking
                  </span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: `${DS.accent.gold}10`,
                      border: `1px solid ${DS.accent.gold}20`,
                      color: DS.accent.gold,
                    }}
                  >
                    AI-scored
                  </span>
                </div>
                <Link
                  href="/pipeline"
                  className="text-[9px] font-mono"
                  style={{ color: DS.text.muted }}
                >
                  Full pipeline →
                </Link>
              </div>
              <div className="divide-y" style={{ borderColor: DS.borderMuted }}>
                {scored.map((o) => {
                  const scoreColor =
                    o.opportunityScore >= 70
                      ? DS.accent.green
                      : o.opportunityScore >= 45
                        ? DS.accent.gold
                        : DS.text.muted;
                  return (
                    <div key={o.address} className="flex items-center gap-3 px-4 py-2.5">
                      <div
                        className="text-[10px] font-mono font-bold w-4 text-right flex-shrink-0"
                        style={{ color: DS.text.muted }}
                      >
                        #{o.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[11px] font-semibold truncate"
                          style={{ color: 'rgba(255,255,255,0.8)' }}
                        >
                          {o.address}
                        </div>
                        <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                          {o.type} · {o.stage} · {o.value}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div
                          className="w-16 h-1 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${o.opportunityScore}%`, background: scoreColor }}
                          />
                        </div>
                        <div
                          className="text-[11px] font-bold font-mono w-8 text-right"
                          style={{ color: scoreColor }}
                        >
                          {o.opportunityScore}
                        </div>
                      </div>
                      <div
                        className="text-[8px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{
                          background:
                            o.flag === 'urgent'
                              ? `${DS.accent.red}10`
                              : o.flag === 'active'
                                ? `${DS.accent.gold}10`
                                : 'rgba(255,255,255,0.04)',
                          color:
                            o.flag === 'urgent'
                              ? DS.accent.red
                              : o.flag === 'active'
                                ? DS.accent.gold
                                : DS.text.muted,
                          border: `1px solid ${o.flag === 'urgent' ? DS.accent.red : o.flag === 'active' ? DS.accent.gold : 'rgba(255,255,255,0.05)'}20`,
                        }}
                      >
                        {o.nextAction}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-2 border-t" style={{ borderColor: DS.borderMuted }}>
                <div className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                  Score = distress signal weight (40%) + urgency flag (30%) + deal value (30%) ·
                  Updated on each data refresh
                </div>
              </div>
            </div>
          );
        })()}

      {/* Doctrine Modules */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {DOCTRINE_MODULES.map((mod) => (
          <Link
            key={mod.id}
            href={mod.href}
            className="group rounded-xl border p-3 transition-all hover:border-white/10 cursor-pointer"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <mod.icon className="w-3 h-3" style={{ color: mod.color }} />
              </div>
              {mod.count !== undefined && mod.count > 0 && (
                <span className="text-[9px] font-bold font-mono" style={{ color: mod.color }}>
                  {mod.count}
                </span>
              )}
            </div>
            <div className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {mod.label}
            </div>
            <div className="text-[8px] mt-0.5 hidden sm:block" style={{ color: DS.text.muted }}>
              {mod.desc}
            </div>
          </Link>
        ))}
      </div>

      {/* Pipeline Stage Visualization */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: DS.border, background: DS.surface }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2.5 border-b"
          style={{ borderColor: DS.borderMuted }}
        >
          <Activity className="w-3.5 h-3.5" style={{ color: DS.accent.blue }} />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: `${DS.accent.blue}99` }}
          >
            Stage Pipeline
          </span>
          <span className="text-[10px] font-mono ml-auto" style={{ color: DS.text.muted }}>
            {stageTotalDeals} active
          </span>
        </div>
        <div className="px-4 py-3 flex items-center gap-1.5">
          {PIPELINE_STAGES.map((ps, i) => (
            <div key={ps.stage} className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[8px] uppercase tracking-wider font-semibold"
                  style={{ color: ps.color }}
                >
                  {ps.stage}
                </span>
                <span className="text-[10px] font-bold font-mono" style={{ color: ps.color }}>
                  {ps.deals}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: `${ps.color}12`,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width:
                      stageTotalDeals > 0
                        ? `${Math.round((ps.deals / stageTotalDeals) * 100)}%`
                        : '0%',
                    background: ps.color,
                    borderRadius: 2,
                  }}
                />
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div style={{ textAlign: 'right', marginTop: 2 }}>
                  <ChevronRight className="w-2 h-2 inline" style={{ color: DS.text.muted }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Opportunity Queue */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              style={{
                height: 2,
                background: `linear-gradient(90deg, ${DS.accent.gold}, transparent)`,
              }}
            />
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b"
              style={{ borderColor: DS.borderMuted }}
            >
              <MapPin className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: `${DS.accent.gold}99` }}
              >
                Opportunity Queue
              </span>
              <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
                ({OPPORTUNITY_QUEUE.length})
              </span>
              <Link
                href="/distress-engine"
                className="ml-auto flex items-center gap-1 text-[10px] font-medium transition-opacity hover:opacity-70"
                style={{ color: DS.accent.gold }}
              >
                Full watchlist <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Table header */}
            <div
              className="hidden md:grid grid-cols-12 gap-2 px-4 py-1.5 border-b"
              style={{ borderColor: DS.borderMuted }}
            >
              {['Property', 'Owner', 'Stage', 'Conf.', 'Evidence', 'Action'].map((h, i) => (
                <div
                  key={h}
                  className={`text-[8px] font-semibold uppercase tracking-wider ${i === 0 ? 'col-span-3' : i === 1 ? 'col-span-2' : i === 4 ? 'col-span-3' : 'col-span-1'}`}
                  style={{ color: DS.text.muted }}
                >
                  {h}
                </div>
              ))}
            </div>

            <div className="divide-y" style={{ borderColor: DS.borderMuted }}>
              {OPPORTUNITY_QUEUE.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-[11px]" style={{ color: DS.text.muted }}>
                    No acquisition targets detected yet — distress engine is scanning.
                  </p>
                </div>
              )}
              {OPPORTUNITY_QUEUE.map((item, i) => {
                const flag = FLAG_STYLES[item.flag];
                const confColor =
                  item.confidence >= 80
                    ? DS.accent.green
                    : item.confidence >= 65
                      ? DS.accent.gold
                      : DS.text.tertiary;
                return (
                  <div key={i}>
                    <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 items-start hover:bg-white/[0.015] transition-colors group">
                      <div className="col-span-3 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: flag.color }}
                          />
                          <p
                            className="text-[11px] font-medium truncate"
                            style={{ color: 'rgba(255,255,255,0.8)' }}
                          >
                            {item.address}
                          </p>
                        </div>
                        <span className="text-[9px]" style={{ color: DS.text.muted }}>
                          {item.type} · {item.value}
                        </span>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <p className="text-[10px] truncate" style={{ color: DS.text.tertiary }}>
                          {item.owner}
                        </p>
                      </div>
                      <div className="col-span-1">
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ color: flag.color, background: `${flag.color}12` }}
                        >
                          {item.stage}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className="text-[11px] font-bold font-mono"
                            style={{ color: confColor }}
                          >
                            {item.confidence}%
                          </span>
                          <div
                            style={{
                              width: 24,
                              height: 3,
                              background: `${confColor}15`,
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${item.confidence}%`,
                                background: confColor,
                                borderRadius: 2,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 min-w-0">
                        <p className="text-[9px] leading-relaxed" style={{ color: DS.text.muted }}>
                          {item.evidence}
                        </p>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <p className="text-[9px] font-semibold" style={{ color: DS.accent.green }}>
                          → {item.nextAction}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 md:hidden px-4 py-3 hover:bg-white/[0.015] transition-colors">
                      <div className="flex items-start gap-2 justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                            style={{ background: flag.color }}
                          />
                          <p
                            className="text-[11px] font-medium truncate"
                            style={{ color: 'rgba(255,255,255,0.8)' }}
                          >
                            {item.address}
                          </p>
                        </div>
                        <span
                          className="text-[11px] font-bold font-mono shrink-0"
                          style={{ color: confColor }}
                        >
                          {item.confidence}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px]" style={{ color: DS.text.muted }}>
                          {item.type} · {item.value}
                        </span>
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ color: flag.color, background: `${flag.color}12` }}
                        >
                          {item.stage}
                        </span>
                      </div>
                      <p className="text-[9px] font-semibold" style={{ color: DS.accent.green }}>
                        → {item.nextAction}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deal Pipeline */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5" style={{ color: DS.accent.blue }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: `${DS.accent.blue}99` }}
              >
                Deal Pipeline
              </span>
              <Link
                href="/deals"
                className="ml-auto flex items-center gap-1 text-[10px] font-medium hover:opacity-70 transition-opacity"
                style={{ color: DS.accent.blue }}
              >
                Full pipeline <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0">
              {topDeals.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-[11px]" style={{ color: DS.text.muted }}>
                    Pipeline loading…
                  </p>
                </div>
              )}
              {topDeals.map((deal, i) => (
                <div
                  key={deal.id ?? i}
                  className="flex items-center gap-3 py-2 hover:bg-white/[0.015] transition-colors"
                  style={{ borderTop: i > 0 ? `1px solid ${DS.borderMuted}` : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-medium truncate"
                      style={{ color: 'rgba(255,255,255,0.8)' }}
                    >
                      {deal.address}
                    </p>
                    {(deal.buyerName || deal.clientName || deal.ownerName) && (
                      <span className="text-[9px]" style={{ color: DS.text.muted }}>
                        {deal.buyerName ?? deal.clientName ?? deal.ownerName}
                      </span>
                    )}
                  </div>
                  <StageBadge stage={deal.stage} />
                  <RiskBadge level={deal.riskLevel} />
                  <span
                    className="text-[11px] font-mono font-bold"
                    style={{ color: DS.accent.gold }}
                  >
                    {deal.price ? formatCurrency(Number(deal.price)) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Market Signals — severity-weighted */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              style={{
                height: 2,
                background: `linear-gradient(90deg, ${DS.accent.gold}60, transparent)`,
                margin: '-1rem -1rem 0.75rem',
                borderRadius: '10px 10px 0 0',
              }}
            />
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: `${DS.accent.gold}99` }}
              >
                Market Signals
              </span>
              <span className="text-[9px] font-mono ml-auto" style={{ color: DS.text.muted }}>
                {MARKET_SIGNALS.length} active
              </span>
            </div>
            <div className="space-y-0">
              {MARKET_SIGNALS.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-[11px]" style={{ color: DS.text.muted }}>
                    No signals yet — monitoring active.
                  </p>
                </div>
              )}
              {MARKET_SIGNALS.map((sig, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 py-2"
                  style={{ borderTop: i > 0 ? `1px solid ${DS.borderMuted}` : 'none' }}
                >
                  <div className="flex flex-col items-center shrink-0 pt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background: SEVERITY_COLORS[sig.severity],
                        boxShadow:
                          sig.severity === 'critical'
                            ? `0 0 6px ${SEVERITY_COLORS[sig.severity]}60`
                            : 'none',
                      }}
                    />
                    {i < MARKET_SIGNALS.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: DS.borderMuted }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
                      {sig.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                        {sig.time}
                      </span>
                      <span
                        className="text-[8px] px-1 py-0.5 rounded uppercase font-semibold"
                        style={{
                          color: SEVERITY_COLORS[sig.severity],
                          background: `${SEVERITY_COLORS[sig.severity]}12`,
                        }}
                      >
                        {sig.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Brokers */}
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5" style={{ color: DS.accent.blue }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: `${DS.accent.blue}99` }}
              >
                Top Brokers
              </span>
              <Link
                href="/leads"
                className="ml-auto flex items-center gap-1 text-[10px] font-medium hover:opacity-70 transition-opacity"
                style={{ color: DS.accent.blue }}
              >
                Scorecards <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {topAgents.map((agent, i) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 py-2"
                style={{ borderTop: i > 0 ? `1px solid ${DS.borderMuted}` : 'none' }}
              >
                <AgentAvatar agent={agent} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {agent.name}
                  </p>
                  <p className="text-[8px]" style={{ color: DS.text.muted }}>
                    {agent.activeDeals} deals · {agent.conversionRate}% conv
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-[10px] font-mono font-bold block"
                    style={{ color: DS.accent.green }}
                  >
                    {formatCurrency(agent.commissionMTD)}
                  </span>
                  <div
                    style={{
                      width: 40,
                      height: 3,
                      background: `${DS.accent.green}15`,
                      borderRadius: 2,
                      overflow: 'hidden',
                      marginTop: 2,
                      marginLeft: 'auto',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min((agent.commissionMTD / 30000) * 100, 100)}%`,
                        background: DS.accent.green,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* System State */}
          <div
            className="rounded-xl border p-3"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" style={{ color: DS.text.muted }} />
                <span
                  className="text-[9px] uppercase tracking-wider font-semibold"
                  style={{ color: DS.text.muted }}
                >
                  System
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: dataMode === 'live' ? DS.accent.green : '#9a7840' }}
                />
                <span
                  className="text-[9px] font-mono font-semibold"
                  style={{ color: dataMode === 'live' ? DS.accent.green : '#9a7840' }}
                >
                  {dataMode === 'live' ? 'Live' : 'Demo'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Pipeline', value: `${liveDealCount} deals`, color: DS.accent.blue },
                {
                  label: 'Alerts',
                  value: (liveAlerts.length || 0).toString(),
                  color: liveAlerts.length > 0 ? DS.accent.red : DS.text.tertiary,
                },
                {
                  label: 'Data Mode',
                  value: dataMode === 'live' ? 'Live' : 'Offline',
                  color: dataMode === 'live' ? DS.accent.green : DS.text.muted,
                },
                { label: 'Assets', value: properties.length.toString(), color: DS.accent.gold },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[8px]" style={{ color: DS.text.muted }}>
                    {s.label}
                  </div>
                  <div className="text-[10px] font-mono font-bold" style={{ color: s.color }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Context */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: `${DS.accent.gold}10`, background: DS.surface }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: DS.borderMuted }}
        >
          <div className="flex items-center gap-2">
            <Map className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: `${DS.accent.gold}80` }}
            >
              Spatial Context
            </span>
            <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
              — {properties.length} properties tracked
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5">
              {[
                {
                  label: 'Performing',
                  color: DS.accent.green,
                  count: properties.filter((p) => p.status === 'performing').length,
                },
                {
                  label: 'Watch',
                  color: DS.accent.gold,
                  count: properties.filter((p) => p.status === 'watch').length,
                },
                {
                  label: 'Critical',
                  color: DS.accent.red,
                  count: properties.filter((p) => p.status === 'critical').length,
                },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-[9px]" style={{ color: DS.text.muted }}>
                    {s.count} {s.label}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowMap((s) => !s)}
              className="text-[9px] px-2.5 py-1 rounded-lg border transition-all"
              style={{
                color: showMap ? DS.accent.gold : DS.text.tertiary,
                borderColor: showMap ? `${DS.accent.gold}25` : `rgba(255,255,255,0.07)`,
                background: showMap ? `${DS.accent.gold}06` : 'transparent',
              }}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
            <Link
              href="/property-map"
              className="text-[9px] px-2.5 py-1 rounded-lg border transition-all hover:bg-white/5"
              style={{ color: DS.accent.gold, borderColor: `${DS.accent.gold}18` }}
            >
              Full Map →
            </Link>
          </div>
        </div>
        {showMap && (
          <div style={{ height: 300 }}>
            {mapToken ? (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div
                      className="w-5 h-5 border-2 rounded-full animate-spin"
                      style={{ borderColor: `${DS.accent.gold}20`, borderTopColor: DS.accent.gold }}
                    />
                  </div>
                }
              >
                <PropertyMap
                  properties={properties}
                  token={mapToken}
                  height="300px"
                  showPanel={false}
                />
              </Suspense>
            ) : mapTokenLoading ? (
              <div className="flex items-center justify-center h-full">
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: `${DS.accent.gold}20`, borderTopColor: DS.accent.gold }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-1 px-4">
                  <Globe className="w-5 h-5 mx-auto" style={{ color: `${DS.accent.gold}30` }} />
                  <p className="text-[10px] font-medium" style={{ color: DS.text.muted }}>
                    Map unavailable
                  </p>
                  <p className="text-[9px]" style={{ color: DS.text.muted, opacity: 0.6 }}>
                    MAPBOX_ACCESS_TOKEN is not configured
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <A11oySignalMesh />

      <ActionLoop
        title="Priority Field Actions"
        actions={[
          {
            id: '1',
            label: `Initiate outreach — ${OPPORTUNITY_QUEUE[0]?.address ?? 'high-priority target'}`,
            type: 'investigate',
            severity: 'critical',
          },
          {
            id: '2',
            label: `Verify ownership — ${OPPORTUNITY_QUEUE[1]?.address ?? 'LLC entity'}`,
            type: 'assign',
            severity: 'high',
          },
          {
            id: '3',
            label: `Review broker SLA breaches — ${OPPORTUNITY_QUEUE.filter((o) => o.flag === 'urgent').length} urgent items`,
            type: 'approve',
            severity: 'high',
          },
          {
            id: '4',
            label: OPPORTUNITY_QUEUE[2]
              ? `Comp analysis on ${OPPORTUNITY_QUEUE[2].address}`
              : 'Comp analysis — price drop detected',
            type: 'investigate',
            severity: 'medium',
          },
          {
            id: '5',
            label: MARKET_SIGNALS[0]
              ? `Signal: ${MARKET_SIGNALS[0].text.slice(0, 60)}`
              : 'Review distress cluster signals',
            type: 'escalate',
            severity: 'critical',
          },
        ]}
      />
    </div>
  );
}
