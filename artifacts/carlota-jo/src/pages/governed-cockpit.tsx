import {
  type AutonomyMode,
  AutonomyModeToggle,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
  productAccent,
  color,
} from '@szl-holdings/design-system';
import { AlertTriangle, Briefcase, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { SubstrateWorkflowPanel } from '@/components/SubstrateWorkflowPanel';

const ACCENT = productAccent.carlota;

const FRESH_5M = new Date(Date.now() - 5 * 60_000).toISOString();
const FRESH_15M = new Date(Date.now() - 15 * 60_000).toISOString();
const AGING_1H = new Date(Date.now() - 60 * 60_000).toISOString();

const STRATEGY_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-cj1',
    label: 'Competitive Landscape Analysis — UK Wealth Management',
    type: 'model',
    timestamp: FRESH_5M,
    excerpt:
      '72 firms in addressable segment. Top-3 incumbents (Evelyn Partners, Brewin Dolphin, Rathbones) control 41% share. Average client NPS: 31 vs boutique average 67.',
  },
  {
    id: 'ev-cj2',
    label: 'Regulatory Filing Analysis — FCA Register',
    type: 'api',
    timestamp: FRESH_15M,
    excerpt:
      'Prospect holds full FCA authorisation. AUM: £2.1B. 3 regulatory findings in 5 years — all resolved. ESG mandate recently formalized in investment policy.',
  },
  {
    id: 'ev-cj3',
    label: 'Carlota Jo Engagement Archive — 24 prior engagements',
    type: 'document',
    timestamp: AGING_1H,
    excerpt:
      '4 comparable wealth management engagements. Avg engagement value: £280K. Common work streams: client segmentation, digital onboarding, fee transparency.',
  },
  {
    id: 'ev-cj4',
    label: 'Market Entry Timing Index — Q1 2026',
    type: 'signal',
    timestamp: FRESH_15M,
    excerpt:
      'Regulatory tailwind: Consumer Duty compliance reviews peaking Q2–Q3 2026. Budget cycle: client fiscal year starts July — engagement approval likely Q2.',
  },
];

const RISK_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-cjr1',
    label: 'Client Health Score — Pemberton Capital',
    type: 'model',
    timestamp: FRESH_5M,
    excerpt:
      'Engagement score: 7.2/10. Sponsor change 6 weeks ago — new CIO has different vendor preferences. 2 follow-up emails unanswered (14+ days).',
  },
  {
    id: 'ev-cjr2',
    label: 'Engagement Velocity Benchmark',
    type: 'document',
    timestamp: AGING_1H,
    excerpt:
      'Comparable engagements at this stage: avg 3.2 touchpoints before proposal. Pemberton: 1.4 touchpoints. Below expected velocity.',
  },
  {
    id: 'ev-cjr3',
    label: 'Revenue Impact Model',
    type: 'model',
    timestamp: FRESH_15M,
    excerpt:
      'If Pemberton engagement stalls: £180K revenue gap in Q2. Next best alternative (Fairfield AM) would take 6 weeks to qualify — misses Q2 target.',
  },
];

const PROPOSAL_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-cjp1',
    label: 'Client Discovery Notes — 3 Meetings',
    type: 'document',
    timestamp: FRESH_5M,
    excerpt:
      'Primary pain: digital client experience (14 mentions across 3 sessions). Secondary: fee transparency post-Consumer Duty. Budget signal: £200–350K range mentioned by CFO.',
  },
  {
    id: 'ev-cjp2',
    label: 'Similar Engagement Retrieval — Knowledge Vault',
    type: 'model',
    timestamp: FRESH_15M,
    excerpt:
      'Best match: Hartley Partners engagement (2024). Client profile similarity: 88%. Deliverables used: client segmentation model, digital roadmap, Consumer Duty gap analysis.',
  },
  {
    id: 'ev-cjp3',
    label: 'Capacity Planner — Q2 2026',
    type: 'api',
    timestamp: FRESH_5M,
    excerpt:
      'Carlota Jo has 1.2 FTE available from 14 April. Proposed scope (10 weeks, 2 FTE) feasible with one contractor. Utilisation impact: +18% above target.',
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
              <Briefcase className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#c8d8e8' }}>
                Carlota Jo — Governed Strategic Advisory
              </div>
              <div className="text-xs" style={{ color: '#4a6070' }}>
                Every engagement recommendation, risk signal, and proposal carries a full proof
                chain
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
            Advisory Intelligence · Deterministic Fallback (Counsel integration active)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Engagements', value: '7', icon: Briefcase, color: ACCENT },
            { label: 'Pipeline Value', value: '£1.4M', icon: TrendingUp, color: color.accent.green },
            { label: 'At-Risk Accounts', value: '2', icon: AlertTriangle, color: color.accent.red },
            { label: 'Prospects Tracked', value: '34', icon: Users, color: '#7a99b8' },
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
          title="Market Entry Signal: Apex Wealth Management — Consumer Duty Tailwind"
          accentColor={ACCENT}
          evidence={STRATEGY_EVIDENCE}
          timestamp={FRESH_5M}
          confidence={81}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              Apex Wealth Management (£2.1B AUM, FCA authorised) represents a strong market entry
              opportunity. Consumer Duty compliance reviews are peaking Q2–Q3 2026, creating a
              regulatory tailwind for Carlota Jo's core service lines. Client fiscal year starts
              July — engagement approval typically follows Q2 budget cycle. 4 comparable wealth
              management engagements in the archive provide strong proposal precedent.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Addressable Market', value: '72 firms', color: ACCENT },
                  { label: 'Engagement Value', value: '£200–350K', color: color.accent.green },
                  { label: 'Engagement Archive Match', value: '88%', color: '#7a99b8' },
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
          title="Engagement Risk: Pemberton Capital — Sponsor Change Risk"
          accentColor={color.accent.red}
          evidence={RISK_EVIDENCE}
          timestamp={FRESH_5M}
          confidence={77}
          policyState={'requires-approval' as PolicyState}
          policyReason="Revenue gap mitigation requires partner decision — accelerate or pivot"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              Pemberton Capital's new CIO (6 weeks in role) has different vendor preferences from
              the previous sponsor. Touchpoint velocity has fallen below benchmark (1.4 vs expected
              3.2 at this stage). 2 follow-up emails unanswered for 14+ days. If the engagement
              stalls, a £180K Q2 revenue gap opens; the next best alternative would take 6 weeks to
              qualify.
            </p>
            <div
              className="mt-3 rounded-lg p-3 text-xs"
              style={{ background: '#060b12', border: '1px solid rgba(201,96,112,0.19)' }}
            >
              <span className="font-semibold" style={{ color: color.accent.red }}>
                Recommended action:
              </span>
              <span style={{ color: '#7a99b8' }}>
                {' '}
                Escalate to partner-level outreach within 48h. Offer a complimentary Consumer Duty
                readiness assessment to re-engage the new CIO with immediate value.
              </span>
            </div>
          </div>
        </ProofEnvelope>

        <ProofEnvelope
          title="Proposal Readiness: Hartley Partners — Scope and Resourcing Confirmed"
          accentColor={ACCENT}
          evidence={PROPOSAL_EVIDENCE}
          timestamp={FRESH_5M}
          confidence={89}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              Three discovery sessions have surfaced digital client experience and Consumer Duty fee
              transparency as the primary pain points. CFO has signalled a budget range of
              £200–350K. Capacity planning confirms 1.2 FTE available from 14 April; proposed
              10-week, 2-FTE scope is achievable with one contractor. Archive retrieval identified
              an 88%-similar prior engagement — proposal template and deliverables are ready.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Budget Signal', value: '£200–350K', color: ACCENT },
                  { label: 'Capacity Available', value: '1.2 FTE', color: color.accent.green },
                  { label: 'Proposal Readiness', value: '89%', color: '#7a99b8' },
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

        <div className="px-1">
          <SubstrateWorkflowPanel />
        </div>
      </div>
    </div>
  );
}
