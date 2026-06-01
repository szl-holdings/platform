import {
  type AutonomyMode,
  AutonomyModeToggle,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
  productAccent,
  color,
} from '@szl-holdings/design-system';
import { RiskEvidenceList } from '@szl-holdings/shared-ui/risk-evidence';
import { AlertTriangle, Building2, MapPin, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const ACCENT = productAccent.terra;

const FRESH_4M = new Date(Date.now() - 4 * 60_000).toISOString();
const FRESH_12M = new Date(Date.now() - 12 * 60_000).toISOString();
const AGING_45M = new Date(Date.now() - 45 * 60_000).toISOString();

const ACQUISITION_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-t1',
    label: 'AVM Engine — 847 Meridian Ave',
    type: 'model',
    timestamp: FRESH_4M,
    excerpt:
      'Confidence-weighted AVM: $4.82M (±3.2%). 24-comp comparable set. Median price-per-sf: $1,147. Market trend: +6.2% YoY.',
  },
  {
    id: 'ev-t2',
    label: 'Distress Signal — Court Filing',
    type: 'signal',
    timestamp: FRESH_12M,
    excerpt:
      'NOD filed 14 Feb 2026. Owner-of-record: Brightfield LLC. Outstanding balance $2.3M vs $4.8M AVM. Equity gap: $2.5M.',
  },
  {
    id: 'ev-t3',
    label: 'Zoning Intelligence — City of Austin',
    type: 'api',
    timestamp: AGING_45M,
    excerpt:
      'Current: R-2 (duplex). Upzone probability: 73% within 18 months (Austin HOME II ordinance expansion). Max density: 4 units.',
  },
  {
    id: 'ev-t4',
    label: 'Climate Risk Model — FEMA + FirstStreet',
    type: 'model',
    timestamp: AGING_45M,
    excerpt:
      'Flood Zone X (minimal). Heat stress index: moderate. No material climate discount warranted at current pricing.',
  },
];

const DISTRESS_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-d1',
    label: 'Distress Radar — 12-month Backlog',
    type: 'signal',
    timestamp: FRESH_4M,
    excerpt:
      'Austin MSA distress pipeline: 847 properties. 23 new NODs this week. Avg equity cushion: $1.8M — acquisition window 60-90 days.',
  },
  {
    id: 'ev-d2',
    label: 'Seller Motivation Score',
    type: 'model',
    timestamp: FRESH_12M,
    excerpt:
      'Owner has listed twice in prior 18 months (expired). Days-on-market: 0 (off-market). Motivation composite: 8.7/10.',
  },
  {
    id: 'ev-d3',
    label: 'Portfolio Concentration Analysis',
    type: 'api',
    timestamp: AGING_45M,
    excerpt:
      'Adding this asset brings Austin exposure to 18% of portfolio (limit: 25%). Within governance bounds.',
  },
];

const RISK_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-ri1',
    label: 'Covenant Monitoring — Lender Covenants',
    type: 'document',
    timestamp: FRESH_4M,
    excerpt:
      'Portfolio LTV covenant: max 65%. Current: 61.2%. Post-acquisition (with $3.2M financing): 63.7%. Covenant headroom: 1.3%.',
  },
  {
    id: 'ev-ri2',
    label: 'Construction Cost Index — Austin MSA',
    type: 'api',
    timestamp: FRESH_12M,
    excerpt:
      'RSMeans Q1-2026: general construction +8.3% YoY. Renovation budget for value-add scenario: $380K (±12%).',
  },
  {
    id: 'ev-ri3',
    label: 'Rent Roll Comparable Analysis',
    type: 'model',
    timestamp: AGING_45M,
    excerpt:
      'Market rent for 4-unit post-conversion: $4,200–$4,800/unit. Going-in cap rate: 5.8%. IRR (5yr hold): 18.4%.',
  },
];

export default function GovernedCockpit() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('recommend');

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
              <Building2 className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#c8d8e8' }}>
                Terra — Governed Real Estate Intelligence
              </div>
              <div className="text-xs" style={{ color: '#4a6070' }}>
                Every acquisition signal, valuation, and risk factor carries a full proof chain
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
            Property Intelligence · Deterministic Fallback (Counsel integration active)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Deals', value: '34', icon: Building2, color: ACCENT },
            { label: 'Distress Signals', value: '847', icon: AlertTriangle, color: color.accent.amber },
            { label: 'Pipeline Value', value: '$284M', icon: TrendingUp, color: color.accent.green },
            { label: 'Markets Tracked', value: '12', icon: MapPin, color: '#7a99b8' },
          ].map(({ label, value, icon: Icon, color }) => (
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
              </div>
              <div className="text-2xl font-bold" style={{ color }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <ProofEnvelope
          title="Acquisition Signal: 847 Meridian Ave, Austin TX — Off-Market Distress Opportunity"
          accentColor={ACCENT}
          evidence={ACQUISITION_EVIDENCE}
          timestamp={FRESH_4M}
          confidence={83}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              Notice of Default filed 14 February 2026. Confidence-weighted AVM of $4.82M against
              outstanding balance of $2.3M creates a $2.5M equity cushion. 73% upzone probability
              within 18 months under Austin HOME II ordinance expansion. Off-market seller with
              motivation score of 8.7/10.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'AVM', value: '$4.82M', color: ACCENT },
                  { label: 'Equity Cushion', value: '$2.5M', color: color.accent.green },
                  { label: '5yr IRR', value: '18.4%', color: ACCENT },
                  { label: 'Cap Rate', value: '5.8%', color: '#7a99b8' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: '#4a6070' }}>
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
          title="Distress Pipeline Digest: Austin MSA — 847 Active Signals"
          accentColor={ACCENT}
          evidence={DISTRESS_EVIDENCE}
          timestamp={FRESH_4M}
          confidence={91}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              23 new Notices of Default recorded this week in Austin MSA. Average equity cushion
              across tracked distress properties is $1.8M, creating a 60–90 day acquisition window
              before foreclosure sale. Portfolio concentration headroom permits up to 7 additional
              Austin acquisitions before hitting the 25% limit.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Active Signals', value: '847', color: ACCENT },
                  { label: 'New This Week', value: '23', color: color.accent.amber },
                  { label: 'Avg Equity', value: '$1.8M', color: color.accent.green },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="text-xs" style={{ color: '#4a6070' }}>
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
          title="Portfolio Risk: LTV Covenant Headroom Compressed — Action Required"
          accentColor={color.accent.amber}
          evidence={RISK_EVIDENCE}
          timestamp={FRESH_4M}
          confidence={96}
          policyState={'requires-approval' as PolicyState}
          policyReason="Acquisition would bring LTV covenant headroom below 2% — Investment Committee approval required"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              Financing the 847 Meridian acquisition at standard 65% LTV would bring portfolio LTV
              to 63.7%, leaving only 1.3% headroom against the lender covenant maximum of 65%.
              Investment Committee approval required before committing to offer. Value-add
              renovation budget of $380K (±12%) should be stress-tested under base/bear scenarios.
            </p>
            <div
              className="mt-3 rounded-lg p-3 text-xs"
              style={{ background: '#060b12', border: '1px solid rgba(201,168,92,0.19)' }}
            >
              <span className="font-semibold" style={{ color: color.accent.amber }}>
                Risk mitigation:
              </span>
              <span style={{ color: '#7a99b8' }}>
                {' '}
                Consider equity-only acquisition or 60% LTV financing to preserve covenant headroom.
                Alternative: defer one other pipeline acquisition to reclaim LTV buffer.
              </span>
            </div>
          </div>
        </ProofEnvelope>

        <RiskEvidenceList
          domain="terra"
          domainLabel="Property Underwriting"
          accentColor={ACCENT}
          emptyHint="No risk-simulation runs have been cited yet. Open Risk Simulation and use Save run as evidence to attach percentile bands and sensitivities to a covenant or acquisition decision."
        />
      </div>
    </div>
  );
}
