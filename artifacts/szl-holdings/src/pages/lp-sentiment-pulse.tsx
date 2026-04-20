import { AmbientBar, type AmbientSignal } from '@szl-holdings/shared-ui/ambient-intelligence';
import {
  CorrelationFeed,
  type CrossDomainCorrelation,
} from '@szl-holdings/shared-ui/cross-domain-correlation';
import { type EnergyMetrics, EnergyPulse } from '@szl-holdings/shared-ui/energy-heartbeat';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useMemo, useState } from 'react';

interface LPProfile {
  id: string;
  name: string;
  commitmentUsd: number;
  sentimentScore: number;
  sentimentTrend: 'rising' | 'stable' | 'declining';
  portalVisitsLast30d: number;
  docDownloadsLast30d: number;
  questionsLast30d: number;
  lastEngagement: string;
  riskOfChurn: 'low' | 'medium' | 'high';
  suggestedAction: string;
  draftedComm?: string;
}

const DEMO_LPS: LPProfile[] = [
  {
    id: 'lp-001',
    name: 'Meridian Capital Partners',
    commitmentUsd: 25_000_000,
    sentimentScore: 92,
    sentimentTrend: 'rising',
    portalVisitsLast30d: 14,
    docDownloadsLast30d: 8,
    questionsLast30d: 1,
    lastEngagement: '2 days ago',
    riskOfChurn: 'low',
    suggestedAction: 'Share upcoming deal pipeline preview',
  },
  {
    id: 'lp-002',
    name: 'Helios Family Office',
    commitmentUsd: 15_000_000,
    sentimentScore: 64,
    sentimentTrend: 'declining',
    portalVisitsLast30d: 3,
    docDownloadsLast30d: 1,
    questionsLast30d: 4,
    lastEngagement: '5 days ago',
    riskOfChurn: 'high',
    suggestedAction: 'Schedule proactive call — engagement dropping, questions increasing',
    draftedComm:
      "Dear Helios team,\n\nI wanted to reach out proactively regarding our Q2 performance. While the broader market has experienced headwinds, our portfolio companies have maintained strong fundamentals. I'd love to schedule a brief call to walk through our outlook and address any questions.\n\nBest regards,\nStephen Lutar",
  },
  {
    id: 'lp-003',
    name: 'Pacific Rim Sovereign Wealth',
    commitmentUsd: 50_000_000,
    sentimentScore: 78,
    sentimentTrend: 'stable',
    portalVisitsLast30d: 8,
    docDownloadsLast30d: 12,
    questionsLast30d: 0,
    lastEngagement: '1 day ago',
    riskOfChurn: 'low',
    suggestedAction: 'No action needed — highly engaged, low questions',
  },
  {
    id: 'lp-004',
    name: 'Cascadia Pension Fund',
    commitmentUsd: 35_000_000,
    sentimentScore: 51,
    sentimentTrend: 'declining',
    portalVisitsLast30d: 1,
    docDownloadsLast30d: 0,
    questionsLast30d: 6,
    lastEngagement: '12 days ago',
    riskOfChurn: 'high',
    suggestedAction:
      'Urgent: Portal disengagement + high question volume = possible redemption risk',
    draftedComm:
      "Dear Cascadia team,\n\nThank you for your continued partnership. I noticed several questions from your team recently and wanted to ensure we address each one thoroughly. I've prepared a comprehensive update covering portfolio performance, risk metrics, and our strategic outlook.\n\nCould we connect this week for a detailed review?\n\nWarm regards,\nStephen Lutar",
  },
  {
    id: 'lp-005',
    name: 'Aegean Endowment',
    commitmentUsd: 10_000_000,
    sentimentScore: 85,
    sentimentTrend: 'rising',
    portalVisitsLast30d: 11,
    docDownloadsLast30d: 5,
    questionsLast30d: 2,
    lastEngagement: 'today',
    riskOfChurn: 'low',
    suggestedAction: 'Explore co-investment interest — high engagement signals appetite',
  },
];

const TREND_ICONS: Record<string, string> = { rising: '↑', stable: '→', declining: '↓' };
const TREND_COLORS: Record<string, string> = {
  rising: '#10b981',
  stable: '#6b7280',
  declining: '#ef4444',
};
const RISK_COLORS: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export default function LPSentimentPulse() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = DEMO_LPS.find((lp) => lp.id === selectedId);

  const ambientSignals: AmbientSignal[] = [
    {
      id: 'sig-1',
      domain: 'szl-holdings',
      title: 'LP Confidence High',
      summary: 'LP sentiment pulse shows 87% confidence across Fund III investors',
      severity: 'info',
      score: 0.32,
      timestamp: Date.now(),
    },
  ];
  const energyMetrics: EnergyMetrics = {
    apiCallsPerMinute: 42,
    wsMessagesPerMinute: 90,
    chartRendersPerMinute: 6,
    dataRefreshesPerMinute: 4,
    activeSubscriptions: 12,
    deferredUpdates: 1,
    totalBudget: 120,
    usedBudget: 34,
  };
  const correlations: CrossDomainCorrelation[] = [
    {
      id: 'cor-3',
      title: 'Litigation Reserves ↔ LP Sentiment',
      description:
        'Litigation reserve accuracy improves when LP sentiment data feeds judicial pattern models',
      domains: ['prism', 'szl-holdings'],
      confidence: 0.78,
      timestamp: Date.now(),
      signals: [
        { domain: 'prism', event: 'Reserve accuracy 91%', severity: 'info' },
        { domain: 'szl-holdings', event: 'LP confidence 87%', severity: 'info' },
      ],
      impact: 'medium',
    },
  ];

  const stats = useMemo(
    () => ({
      totalAum: DEMO_LPS.reduce((s, lp) => s + lp.commitmentUsd, 0),
      avgSentiment: Math.round(
        DEMO_LPS.reduce((s, lp) => s + lp.sentimentScore, 0) / DEMO_LPS.length,
      ),
      atRisk: DEMO_LPS.filter((lp) => lp.riskOfChurn === 'high').length,
      atRiskAum: DEMO_LPS.filter((lp) => lp.riskOfChurn === 'high').reduce(
        (s, lp) => s + lp.commitmentUsd,
        0,
      ),
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-[#060810] text-white p-6 space-y-6">
      <AmbientBar signals={ambientSignals} appDomain="szl-holdings" accentColor="#6366f1" compact />
      <div>
        <h1 className="text-2xl font-bold text-white/90">LP Sentiment Pulse</h1>
        <p className="text-sm text-white/40 mt-1">
          Track investor engagement signals and generate proactive communications before LPs ask
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Commitments', value: formatUsd(stats.totalAum), color: '#6366f1' },
          {
            label: 'Avg Sentiment',
            value: `${stats.avgSentiment}/100`,
            color: stats.avgSentiment >= 75 ? '#10b981' : '#f59e0b',
          },
          { label: 'At-Risk LPs', value: stats.atRisk.toString(), color: '#ef4444' },
          { label: 'At-Risk AUM', value: formatUsd(stats.atRiskAum), color: '#ef4444' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/30">{kpi.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-3">
          {DEMO_LPS.map((lp) => (
            <div
              key={lp.id}
              className={cn(
                'rounded-xl border p-4 cursor-pointer transition-all',
                selectedId === lp.id
                  ? 'bg-white/[0.06] border-white/15'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10',
              )}
              onClick={() => setSelectedId(lp.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white/85">{lp.name}</div>
                  <div className="text-[11px] text-white/40">
                    {formatUsd(lp.commitmentUsd)} committed
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className="text-lg font-bold"
                      style={{
                        color:
                          lp.sentimentScore >= 75
                            ? '#10b981'
                            : lp.sentimentScore >= 55
                              ? '#f59e0b'
                              : '#ef4444',
                      }}
                    >
                      {lp.sentimentScore}
                    </div>
                    <div
                      className="text-[9px] flex items-center gap-1"
                      style={{ color: TREND_COLORS[lp.sentimentTrend] }}
                    >
                      {TREND_ICONS[lp.sentimentTrend]} {lp.sentimentTrend}
                    </div>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: RISK_COLORS[lp.riskOfChurn] }}
                    title={`${lp.riskOfChurn} churn risk`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-7">
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <h2 className="text-lg font-semibold text-white/90 mb-4">{selected.name}</h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    {
                      label: 'Portal Visits (30d)',
                      value: selected.portalVisitsLast30d.toString(),
                    },
                    {
                      label: 'Doc Downloads (30d)',
                      value: selected.docDownloadsLast30d.toString(),
                    },
                    { label: 'Questions (30d)', value: selected.questionsLast30d.toString() },
                  ].map((m) => (
                    <div key={m.label} className="bg-white/5 rounded-lg p-3">
                      <div className="text-[10px] text-white/30 uppercase">{m.label}</div>
                      <div className="text-xl font-bold text-white/80 mt-1">{m.value}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-white/40">
                  Last engagement: <span className="text-white/60">{selected.lastEngagement}</span>
                </div>
              </div>

              <div
                className={cn(
                  'rounded-xl border p-4',
                  selected.riskOfChurn === 'high'
                    ? 'border-red-500/20 bg-red-500/[0.03]'
                    : 'border-white/5 bg-white/[0.02]',
                )}
              >
                <div
                  className="text-[10px] uppercase tracking-wider mb-2"
                  style={{ color: RISK_COLORS[selected.riskOfChurn] }}
                >
                  {selected.riskOfChurn} Risk — Suggested Action
                </div>
                <p className="text-sm text-white/70">{selected.suggestedAction}</p>
              </div>

              {selected.draftedComm && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] p-4">
                  <div className="text-[10px] text-indigo-400 uppercase tracking-wider mb-2">
                    Auto-Generated Proactive Communication
                  </div>
                  <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed">
                    {selected.draftedComm}
                  </pre>
                  <div className="flex gap-2 mt-3">
                    <button className="text-[11px] px-3 py-1.5 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30">
                      Send Draft
                    </button>
                    <button className="text-[11px] px-3 py-1.5 rounded bg-white/10 text-white/50 hover:bg-white/15">
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center h-full flex items-center justify-center">
              <p className="text-sm text-white/30">
                Select an LP to view sentiment details and engagement signals
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div className="md:col-span-2">
          <CorrelationFeed
            correlations={correlations}
            currentDomain="szl-holdings"
            accentColor="#6366f1"
          />
        </div>
        <div className="flex items-start justify-center">
          <EnergyPulse
            metrics={energyMetrics}
            utilization={energyMetrics.usedBudget / energyMetrics.totalBudget}
            accentColor="#6366f1"
          />
        </div>
      </div>
    </div>
  );
}
