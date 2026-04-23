import {
  type AutonomyMode,
  AutonomyModeToggle,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
  productAccent,
  color,
} from '@szl-holdings/design-system';
import { AlertTriangle, BarChart3, Layers, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const ACCENT = productAccent.holdings;

const FRESH_3M = new Date(Date.now() - 3 * 60_000).toISOString();
const FRESH_11M = new Date(Date.now() - 11 * 60_000).toISOString();
const AGING_40M = new Date(Date.now() - 40 * 60_000).toISOString();

const FUND_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-szl1',
    label: 'LP Capital Account Valuation — Q1 2026',
    type: 'document',
    timestamp: FRESH_11M,
    excerpt:
      'Fund NAV: $142.3M. Unrealised appreciation: $38.7M. IRR since inception: 24.1%. Benchmark (top-quartile VC): 19.8%.',
  },
  {
    id: 'ev-szl2',
    label: 'Portfolio Company Health Scores — FORGE',
    type: 'model',
    timestamp: FRESH_3M,
    excerpt:
      'PRAXIS: 8.4. KORA: 7.1. SEXTANT: 6.8. DOMAINE (fund stake): 7.4. PARAGON: 6.9. Composite: 7.3/10. Revenue growth YoY: +67% blended.',
  },
  {
    id: 'ev-szl3',
    label: 'Market Comparable Benchmarking',
    type: 'api',
    timestamp: FRESH_11M,
    excerpt:
      'LTV SAFE pricing benchmark (similar-stage enterprise SaaS): 8.2x ARR. SZL portfolio companies avg: 6.4x ARR (entry). Implied appreciation potential: 28%.',
  },
  {
    id: 'ev-szl4',
    label: 'DPI / TVPI Tracker',
    type: 'model',
    timestamp: AGING_40M,
    excerpt:
      'DPI: 0.12x (early stage — expected). TVPI: 1.42x. Implied IRR to 5x TVPI exit (3yr): 52%. Top-quartile threshold at exit: 3.5x TVPI.',
  },
];

const PRISM_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-szlp1',
    label: 'PRAXIS Matter Volume — Q1 2026',
    type: 'api',
    timestamp: FRESH_3M,
    excerpt:
      'Matter volume growth: +22% QoQ. Attorney hours saved per matter: 31%. Pilot clients: 3 AmLaw 100 firms. NDA-stage: 4 more.',
  },
  {
    id: 'ev-szlp2',
    label: 'Revenue Forecast Model',
    type: 'model',
    timestamp: FRESH_11M,
    excerpt:
      'ARR at Q1-2026: $2.4M. Path to $10M ARR: 18 months at current growth rate. Series A benchmark: $3–5M ARR. Within striking range.',
  },
  {
    id: 'ev-szlp3',
    label: 'Competitive Intelligence — LegalTech',
    type: 'document',
    timestamp: AGING_40M,
    excerpt:
      "Harvey AI raised $300M at $3B val. Contract comparison only. PRAXIS's workflow automation (matter intake to close) is structurally differentiated — adjacent, not competing.",
  },
];

const DEPLOYMENT_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-szld1',
    label: 'Available Capital Monitor',
    type: 'api',
    timestamp: FRESH_3M,
    excerpt:
      'Undeployed capital: $12.4M. Deal pipeline: 3 term sheets, 2 in diligence. Expected deployment: $6.5M in Q2 (subject to IC approval).',
  },
  {
    id: 'ev-szld2',
    label: 'Sector Valuation Monitor',
    type: 'signal',
    timestamp: FRESH_11M,
    excerpt:
      'Enterprise AI/ML valuations compressed 18% since peak (Q3 2024). Entry multiples now aligned with historical VC averages. Vintage 2026 likely to be strong.',
  },
  {
    id: 'ev-szld3',
    label: 'Portfolio Concentration Analysis',
    type: 'model',
    timestamp: AGING_40M,
    excerpt:
      'LegalTech exposure (PRAXIS): 22% of portfolio. Adding proposed deal raises to 26% (limit: 30%). Within policy bounds. Geographic diversification maintained.',
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
              <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#c8d8e8' }}>
                SZL Holdings — Governed Portfolio Intelligence
              </div>
              <div className="text-xs" style={{ color: '#4a6070' }}>
                Every fund metric, venture signal, and deployment decision carries a full proof
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
            Portfolio Intelligence · Deterministic Fallback (FORGE integration active)
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Fund NAV', value: '$142M', icon: BarChart3, color: ACCENT },
            { label: 'IRR (Inception)', value: '24.1%', icon: TrendingUp, color: color.accent.green },
            { label: 'Undeployed Capital', value: '$12.4M', icon: Layers, color: color.accent.amber },
            { label: 'Portfolio Companies', value: '5', icon: AlertTriangle, color: '#7a99b8' },
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
          title="Fund Performance Briefing: $142.3M NAV — 24.1% IRR (Inception)"
          accentColor={ACCENT}
          evidence={FUND_EVIDENCE}
          timestamp={FRESH_3M}
          confidence={94}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          domain="holdings.fund-performance"
          actionLabel="Publish LP performance briefing"
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              Fund NAV stands at $142.3M with $38.7M in unrealised appreciation across 5 portfolio
              companies. IRR since inception is 24.1%, outperforming the top-quartile VC benchmark
              of 19.8%. Composite portfolio health score is 7.3/10. Blended revenue growth across
              ventures is +67% YoY. TVPI of 1.42x is on track for top-quartile exit.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Fund NAV', value: '$142.3M', color: ACCENT },
                  { label: 'Unrealised Gains', value: '$38.7M', color: color.accent.green },
                  { label: 'IRR', value: '24.1%', color: color.accent.green },
                  { label: 'TVPI', value: '1.42x', color: ACCENT },
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
          title="Venture Intelligence: PRAXIS — Series A Window Opening"
          accentColor={ACCENT}
          evidence={PRISM_EVIDENCE}
          timestamp={FRESH_3M}
          confidence={82}
          policyState={'allowed' as PolicyState}
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          domain="holdings.venture-intelligence"
          actionLabel="Issue PRAXIS Series A readiness brief to IC"
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              PRAXIS's Q1 matter volume grew 22% QoQ, with attorney hours saved averaging 31% per
              matter across 3 AmLaw 100 pilot clients. ARR at $2.4M is approaching the $3–5M Series
              A benchmark at current growth trajectory (18 months). Harvey AI's $300M raise
              validates the market but targets a narrower feature set — PRAXIS's full workflow
              automation is structurally differentiated.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'ARR', value: '$2.4M', color: ACCENT },
                  { label: 'QoQ Growth', value: '+22%', color: color.accent.green },
                  { label: 'Series A ETA', value: '18 mo', color: '#7a99b8' },
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
          title="Capital Deployment Signal: Vintage 2026 Entry — $6.5M Q2 Pipeline"
          accentColor={ACCENT}
          evidence={DEPLOYMENT_EVIDENCE}
          timestamp={FRESH_3M}
          confidence={76}
          policyState={'requires-approval' as PolicyState}
          policyReason="Deployment >$3M per company requires Investment Committee approval per fund charter"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          domain="holdings.deal-scoring"
          actionLabel="Approve Q2 capital deployment ($6.5M)"
        >
          <div className="space-y-2">
            <p className="text-sm" style={{ color: '#c8d8e8' }}>
              $12.4M in undeployed capital. 3 term sheets active, 2 in diligence. Expected Q2
              deployment of $6.5M across 2–3 companies. Enterprise AI/ML valuations have compressed
              18% from peak — Vintage 2026 entry conditions are historically strong. LegalTech
              concentration would reach 26% with the proposed deal — within the 30% policy limit.
              Investment Committee approval required for each investment above $3M.
            </p>
            <div
              className="mt-3 rounded-lg p-3"
              style={{ background: '#060b12', border: '1px solid #243040' }}
            >
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Dry Powder', value: '$12.4M', color: ACCENT },
                  { label: 'Q2 Pipeline', value: '$6.5M', color: '#7a99b8' },
                  { label: 'Valuation Compression', value: '-18%', color: color.accent.green },
                  { label: 'Concentration (post)', value: '26%', color: color.accent.amber },
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
      </div>
    </div>
  );
}
