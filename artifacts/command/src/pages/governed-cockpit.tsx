import {
  type AutonomyMode,
  AutonomyModeToggle,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
  productAccent,
} from '@szl-holdings/design-system';
import { Activity, AlertTriangle, Command, Loader2, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const ACCENT = productAccent.command;

const FRESH_2M = new Date(Date.now() - 2 * 60_000).toISOString();
const FRESH_9M = new Date(Date.now() - 9 * 60_000).toISOString();
const AGING_35M = new Date(Date.now() - 35 * 60_000).toISOString();

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const PORTFOLIO_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-cmd1',
    label: 'Cross-Domain Signal Aggregation — Alloy',
    type: 'model',
    timestamp: FRESH_2M,
    excerpt:
      'Aegis: 3 critical threat signals. Vessels: 6 fleet alerts. Terra: 2 covenant triggers. Pulse: 1 executive dissent. Correlation matrix: 0.71 between Aegis/Vessels threat clusters.',
  },
  {
    id: 'ev-cmd2',
    label: 'Portfolio Health Monitor — 5 Ventures',
    type: 'api',
    timestamp: FRESH_9M,
    excerpt:
      'Composite health score: 7.2/10. PRISM: 8.4 (strong). Lyte: 7.1. Vessels: 6.8 (declining). Terra: 7.4. Aegis: 6.9.',
  },
  {
    id: 'ev-cmd3',
    label: 'Market Regime Classifier',
    type: 'model',
    timestamp: AGING_35M,
    excerpt:
      "Current regime: 'Late cycle / Rate stress'. Historical base rate for portfolio drawdown in this regime: 18%. Expected recovery: 8–11 months.",
  },
  {
    id: 'ev-cmd4',
    label: 'IC Decision Log — Trailing 30 Days',
    type: 'document',
    timestamp: AGING_35M,
    excerpt:
      '14 decisions surfaced. 11 approved, 2 sent for revision, 1 blocked by policy. Average time-to-decision: 4.2h. No SLA breaches.',
  },
];

const CORRELATION_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-cor1',
    label: 'Aegis Threat Signal — APT-29 Activity',
    type: 'signal',
    timestamp: FRESH_2M,
    excerpt:
      'Lateral movement detected in treasury network segment. 3 Vessels counterparties share same infrastructure provider. Possible correlated exposure.',
  },
  {
    id: 'ev-cor2',
    label: 'Vessels Counterparty Risk Data',
    type: 'api',
    timestamp: FRESH_9M,
    excerpt:
      "Sanctions flag on 'Starline Maritime SA'. Parent entity linked to 2 other active Vessels counterparties via beneficial ownership registry.",
  },
  {
    id: 'ev-cor3',
    label: 'Pulse Rate Signal',
    type: 'signal',
    timestamp: FRESH_2M,
    excerpt:
      'Rate regime shift increases credit spreads. Terra portfolio LTV covenant headroom compressed to 1.3%. Cross-domain contagion vector identified.',
  },
];

const APPROVAL_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-appr1',
    label: 'Approval Queue — 3 Pending Items',
    type: 'api',
    timestamp: FRESH_2M,
    excerpt:
      '1. Aegis: APT-29 containment (CISO needed). 2. Vessels: Horizon Star emergency port call (Ops). 3. Terra: Meridian acquisition financing (IC). Aggregate exposure: $4.7M decisions.',
  },
  {
    id: 'ev-appr2',
    label: 'Approver SLA Monitor',
    type: 'signal',
    timestamp: FRESH_9M,
    excerpt:
      'Aegis item: 2h in queue (SLA: 4h). Vessels item: 47min in queue (SLA: 2h). Terra item: 14min in queue (SLA: 48h). All within SLA.',
  },
  {
    id: 'ev-appr3',
    label: 'Policy Engine Evaluation',
    type: 'model',
    timestamp: FRESH_2M,
    excerpt:
      'All 3 items correctly routed per governance policy. No escalation required. Approval context packets generated — approvers notified.',
  },
];

interface LiveCounts {
  signals: number | null;
  approvals: number | null;
  decisions: number | null;
  domains: number | null;
  loading: boolean;
}

function DemoBadge() {
  return (
    <span
      className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ml-1"
      style={{
        color: 'rgba(255,255,255,0.4)',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      demo
    </span>
  );
}

async function safeFetchCount(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { count?: number; total?: number }; count?: number; total?: number };
    const d = body?.data ?? body;
    return typeof d?.count === 'number'
      ? d.count
      : typeof d?.total === 'number'
        ? d.total
        : null;
  } catch {
    return null;
  }
}

function useLiveCounts(): LiveCounts {
  const [counts, setCounts] = useState<LiveCounts>({
    signals: null,
    approvals: null,
    decisions: null,
    domains: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [signals, approvals, decisions] = await Promise.all([
        safeFetchCount(`${BASE}/api/control-tower/sense/signals?limit=1`),
        safeFetchCount(`${BASE}/api/governance/pending`),
        safeFetchCount(`${BASE}/api/control-tower/decide/journal?limit=1`),
      ]);
      if (!cancelled) {
        setCounts({
          signals,
          approvals,
          decisions,
          domains: 5,
          loading: false,
        });
      }
    }
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return counts;
}

export default function GovernedCockpit() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('ask-to-act');
  const counts = useLiveCounts();

  const isDemo = (v: number | null) => v === null;

  const tiles = [
    {
      label: 'Active Signals',
      value: counts.loading ? null : (counts.signals ?? 47),
      demo: isDemo(counts.signals),
      icon: Activity,
      color: ACCENT,
    },
    {
      label: 'Open Approvals',
      value: counts.loading ? null : (counts.approvals ?? 3),
      demo: isDemo(counts.approvals),
      icon: AlertTriangle,
      color: '#ffb700',
    },
    {
      label: 'Decisions Today',
      value: counts.loading ? null : (counts.decisions ?? 14),
      demo: isDemo(counts.decisions),
      icon: TrendingUp,
      color: '#00e878',
    },
    {
      label: 'Domains Live',
      value: counts.loading ? null : (counts.domains ?? 5),
      demo: true,
      icon: Command,
      color: '#7a99b8',
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#060b12',
        color: '#c8d8e8',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="border-b" style={{ borderColor: '#1a2535', background: '#0d1520' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}
            >
              <Command className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#c8d8e8' }}>
                Command — Unified Governed Decision Surface
              </div>
              <div className="text-xs" style={{ color: '#4a6070' }}>
                Every cross-domain signal, correlation, and approval carries a full proof chain
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest" style={{ color: '#4a6070' }}>
              Autonomy Mode
            </span>
            <AutonomyModeToggle value={autonomyMode} onChange={setAutonomyMode} variant="compact" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
          <span
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: '#4a6070' }}
          >
            Cross-Domain Intelligence · Deterministic Fallback (Alloy integration active)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {tiles.map(({ label, value, demo, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: '#0d1520', border: '1px solid #1a2535' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs uppercase tracking-wide" style={{ color: '#4a6070' }}>
                  {label}
                </span>
                {demo && <DemoBadge />}
              </div>
              <div className="text-2xl font-bold" style={{ color }}>
                {value === null ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color }} />
                ) : (
                  value
                )}
              </div>
            </div>
          ))}
        </div>

        <ProofEnvelope
          title="Portfolio Briefing: 47 Cross-Domain Signals — Composite Health 7.2/10"
          accentColor={ACCENT}
          evidence={PORTFOLIO_EVIDENCE}
          timestamp={FRESH_2M}
          confidence={85}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              47 signals ingested across Aegis, Vessels, Terra, and Pulse in the last 2 minutes.
              Composite portfolio health: 7.2/10. Alloy has correlated signals across domains —
              notable overlap between Aegis threat activity and Vessels counterparty exposure.
              Market regime classified as 'Late cycle / Rate stress' with 18% base rate for
              drawdown.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'PRISM', value: '8.4', color: '#00e878' },
                  { label: 'Lyte', value: '7.1', color: '#7a99b8' },
                  { label: 'Vessels', value: '6.8', color: '#ffb700' },
                  { label: 'Terra', value: '7.4', color: ACCENT },
                  { label: 'Aegis', value: '6.9', color: '#ffb700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <div className="text-xs" style={{ color: '#4a6070' }}>
                      {label}
                    </div>
                    <div className="text-lg font-bold" style={{ color }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ProofEnvelope>

        <ProofEnvelope
          title="Cross-Domain Correlation: Aegis Threat ↔ Vessels Counterparty Exposure"
          accentColor="#ffb700"
          evidence={CORRELATION_EVIDENCE}
          timestamp={FRESH_2M}
          confidence={71}
          policyState={'requires-approval' as PolicyState}
          policyReason="Cross-domain action (Aegis + Vessels + Terra) requires multi-domain approval chain"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              Alloy has detected a correlated exposure across three domains: the APT-29
              infrastructure provider identified in the Aegis incident shares hosting with two
              active Vessels counterparties. Separately, the Pulse rate signal is compressing
              Terra's LTV covenant headroom — creating a potential cross-domain contagion vector.
              This correlation is flagged for multi-domain approval chain.
            </p>
            <div
              className="mt-3 rounded-lg p-3 text-xs"
              style={{ background: '#060b12', border: '1px solid #ffb70030' }}
            >
              <span className="font-semibold" style={{ color: '#ffb700' }}>
                Correlated domains:
              </span>
              <span style={{ color: '#7a99b8' }}>
                {' '}
                Aegis (threat infrastructure) → Vessels (counterparty hosting) → Terra (credit
                spread impact via Pulse rate signal). Recommend unified response brief for CRO
                review.
              </span>
            </div>
          </div>
        </ProofEnvelope>

        <ProofEnvelope
          title="Approval Queue: 3 Time-Sensitive Decisions — All Within SLA"
          accentColor={ACCENT}
          evidence={APPROVAL_EVIDENCE}
          timestamp={FRESH_2M}
          confidence={98}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              3 approval items are queued across domains with a combined decision exposure of $4.7M.
              All items are within their SLA windows. Policy engine has correctly routed each item
              to the appropriate approver — no escalation required. Context packets have been
              delivered to each approver.
            </p>
            <div className="mt-3 space-y-2">
              {[
                {
                  domain: 'Aegis',
                  item: 'APT-29 containment',
                  approver: 'CISO',
                  elapsed: '2h',
                  sla: '4h',
                  color: '#ff4455',
                },
                {
                  domain: 'Vessels',
                  item: 'Horizon Star emergency port call',
                  approver: 'Ops Director',
                  elapsed: '47m',
                  sla: '2h',
                  color: '#ffb700',
                },
                {
                  domain: 'Terra',
                  item: 'Meridian acquisition financing',
                  approver: 'Investment Committee',
                  elapsed: '14m',
                  sla: '48h',
                  color: ACCENT,
                },
              ].map(({ domain, item, approver, elapsed, sla, color }) => (
                <div
                  key={domain}
                  className="rounded-lg p-3 flex items-center justify-between"
                  style={{ background: '#060b12', border: '1px solid #1a2535' }}
                >
                  <div>
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded mr-2"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                    >
                      {domain}
                    </span>
                    <span className="text-xs" style={{ color: '#c8d8e8' }}>
                      {item}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: '#7a99b8' }}>
                      {approver}
                    </div>
                    <div className="text-xs" style={{ color: '#4a6070' }}>
                      {elapsed} / {sla} SLA
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ProofEnvelope>
      </div>
    </div>
  );
}
