import {
  type AutonomyMode,
  AutonomyModeToggle,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
  productAccent,
  color,
} from '@szl-holdings/design-system';
import { AlertTriangle, BarChart3, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';

const ACCENT = productAccent.pulse;

const FRESH_6M = new Date(Date.now() - 6 * 60_000).toISOString();
const FRESH_18M = new Date(Date.now() - 18 * 60_000).toISOString();
const AGING_2H = new Date(Date.now() - 2 * 60 * 60_000).toISOString();

const BRIEFING_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-p1',
    label: 'Macro Signal Digest — Bloomberg, Reuters, FT',
    type: 'api',
    timestamp: FRESH_6M,
    excerpt:
      "Fed Chair remarks at 14:30 EST confirmed 'higher for longer' posture. 3 independent sources. Consensus interpretation: rate cut probability at June FOMC drops to 22%.",
  },
  {
    id: 'ev-p2',
    label: 'Institutional Flow Monitor',
    type: 'signal',
    timestamp: FRESH_18M,
    excerpt:
      'Unusual options activity: $2.3B put premium on S&P 500 3-week expiry. Dark pool prints: net selling $740M in financials. Consistent with de-risking thesis.',
  },
  {
    id: 'ev-p3',
    label: 'SZL Portfolio Exposure Model',
    type: 'model',
    timestamp: FRESH_6M,
    excerpt:
      'Current rate sensitivity: 1.4x duration exposure vs benchmark. 100bps rate shift → -3.8% portfolio impact (unhedged). Hedge ratio: 61%.',
  },
  {
    id: 'ev-p4',
    label: 'Analogous Period Analysis — 2018 Q4, 2022 Q1',
    type: 'document',
    timestamp: AGING_2H,
    excerpt:
      "Both prior 'higher for longer' pivots preceded equity drawdowns of 12–19% within 90 days. Recovery periods: 6 and 11 months respectively.",
  },
];

const DISSENT_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-pd1',
    label: 'Contrarian Signal — Goldman Sachs Research',
    type: 'document',
    timestamp: FRESH_18M,
    excerpt:
      'GS maintains overweight equities. Base case: soft landing. Labor market resilience cited as primary offset to rate risk. Contradicts de-risking thesis.',
  },
  {
    id: 'ev-pd2',
    label: 'Earnings Revision Momentum',
    type: 'signal',
    timestamp: FRESH_6M,
    excerpt:
      'Q1 earnings revisions: +2.3% net positive. Forward P/E compression already pricing 60% of expected rate drag. Contradicts downside severity.',
  },
  {
    id: 'ev-pd3',
    label: 'Dissent Channel — CIO Office',
    type: 'user',
    timestamp: FRESH_18M,
    excerpt:
      'CIO flagged: 2018/2022 analogies may overweight duration sensitivity; current corporate balance sheet health is materially stronger. Logged as material dissent.',
  },
];

const DECISION_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-pdc1',
    label: 'Investment Committee Charter — Section 4.2',
    type: 'document',
    timestamp: AGING_2H,
    excerpt:
      'Portfolio hedge ratio changes >10% require IC approval. Current action: +12% hedge ratio increase (61%→73%). IC meeting: Thursday 09:00.',
  },
  {
    id: 'ev-pdc2',
    label: 'Execution Cost Model',
    type: 'model',
    timestamp: FRESH_6M,
    excerpt:
      'Treasury futures hedge to 73% ratio: estimated execution cost $840K. Break-even: 23bps rate move within 60 days — current implied vol supports.',
  },
  {
    id: 'ev-pdc3',
    label: 'Risk Committee Pre-Clearance',
    type: 'user',
    timestamp: FRESH_6M,
    excerpt:
      'Risk Committee pre-cleared hedge increase up to 80% subject to IC ratification. Documentation attached.',
  },
];

export default function GovernedCockpit() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('draft');

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--gi-bg-base)',
        color: 'var(--gi-text-primary)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="border-b" style={{ borderColor: 'var(--gi-border-subtle)', background: 'var(--gi-bg-surface)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}
            >
              <Zap className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--gi-text-primary)' }}>
                Pulse — Governed Executive Briefing
              </div>
              <div className="text-xs" style={{ color: 'var(--gi-text-muted)' }}>
                Every briefing signal, dissent, and decision carries a full proof chain
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--gi-text-muted)' }}>
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
            style={{ color: 'var(--gi-text-muted)' }}
          >
            Executive Intelligence · Deterministic Fallback (Counsel integration active)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Today's Signals", value: '47', icon: Zap, color: ACCENT },
            { label: 'Briefings Issued', value: '3', icon: BarChart3, color: 'var(--gi-text-secondary)' },
            { label: 'Open Decisions', value: '2', icon: TrendingUp, color: color.accent.green },
            { label: 'Dissent Flags', value: '1', icon: AlertTriangle, color: color.accent.red },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-4"
              style={{ background: 'var(--gi-bg-surface)', border: '1px solid var(--gi-border-subtle)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--gi-text-muted)' }}>
                  {label}
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ color }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <ProofEnvelope
          title="Executive Brief: Macro Rate Regime Shift — De-Risk Signal"
          accentColor={ACCENT}
          evidence={BRIEFING_EVIDENCE}
          timestamp={FRESH_6M}
          confidence={78}
          contradiction={true}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--gi-text-primary)' }}>
              Fed Chair remarks confirmed a 'higher for longer' posture, reducing the June FOMC cut
              probability to 22%. Institutional flow data shows $2.3B in put premium and $740M net
              dark pool selling in financials — consistent with institutional de-risking. Portfolio
              duration exposure of 1.4x benchmark creates -3.8% sensitivity per 100bps rate shift at
              current 61% hedge ratio. Note: material dissent logged from CIO office (see dissent
              flag).
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: 'var(--gi-bg-base)', border: '1px solid var(--gi-border-default)' }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'June Cut Probability', value: '22%', color: color.accent.red },
                  { label: 'Rate Sensitivity', value: '-3.8%/100bps', color: color.accent.amber },
                  { label: 'Hedge Ratio', value: '61%', color: ACCENT },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: 'var(--gi-text-muted)' }}>
                      {label}
                    </div>
                    <div className="text-base font-bold" style={{ color }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ProofEnvelope>

        <ProofEnvelope
          title="Dissent Channel: CIO Office — Contradicting Evidence on Rate Thesis"
          accentColor={color.accent.red}
          evidence={DISSENT_EVIDENCE}
          timestamp={FRESH_18M}
          confidence={62}
          contradiction={true}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--gi-text-primary)' }}>
              Material dissent registered: Goldman Sachs maintains overweight equities with a soft
              landing base case. Q1 earnings revisions are net +2.3%, suggesting markets have
              already priced 60% of the expected rate drag. The CIO flagged that 2018/2022
              historical analogies may overstate the downside given stronger current corporate
              balance sheets. This dissent is displayed alongside the primary briefing — both views
              are evidence-backed.
            </p>
            <div
              className="mt-3 rounded-lg p-3 text-xs"
              style={{ background: 'var(--gi-bg-base)', border: '1px solid rgba(201,96,112,0.13)' }}
            >
              <span className="font-semibold" style={{ color: color.accent.red }}>
                Dissent protocol:
              </span>
              <span style={{ color: 'var(--gi-text-secondary)' }}>
                {' '}
                This view has been formally logged and will appear alongside the primary brief in
                the CIO packet. Both interpretations are presented without suppression. Investment
                Committee will adjudicate Thursday.
              </span>
            </div>
          </div>
        </ProofEnvelope>

        <ProofEnvelope
          title="Decision Draft: Increase Hedge Ratio 61%→73% — IC Approval Required"
          accentColor={ACCENT}
          evidence={DECISION_EVIDENCE}
          timestamp={FRESH_6M}
          confidence={84}
          policyState={'requires-approval' as PolicyState}
          policyReason="Hedge ratio change >10% requires Investment Committee ratification per Charter §4.2"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--gi-text-primary)' }}>
              Increasing portfolio hedge ratio from 61% to 73% via Treasury futures. Estimated
              execution cost: $840K. Break-even: 23bps rate move within 60 days — within current
              implied volatility. Risk Committee has pre-cleared up to 80% subject to IC
              ratification at Thursday 09:00 meeting. Draft IC paper attached.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: 'var(--gi-bg-base)', border: '1px solid var(--gi-border-default)' }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Hedge Increase', value: '61%→73%', color: ACCENT },
                  { label: 'Execution Cost', value: '$840K', color: color.accent.amber },
                  { label: 'Break-even Move', value: '23bps', color: 'var(--gi-text-secondary)' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: 'var(--gi-text-muted)' }}>
                      {label}
                    </div>
                    <div className="text-base font-bold" style={{ color }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ProofEnvelope>
      </div>
    </div>
  );
}
