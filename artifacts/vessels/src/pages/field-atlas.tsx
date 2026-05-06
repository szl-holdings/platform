import { Link } from 'wouter';
import {
  Activity,
  Anchor,
  Brain,
  Compass,
  Eye,
  Layers,
  Network,
  Radio,
  Satellite,
  Shield,
  ShieldAlert,
  Target,
  Waves,
} from 'lucide-react';

const ALLOY_GOLD = '#c9b787';

interface AtlasPillar {
  id: string;
  code: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  governance: string;
  oneLiner: string;
  bullets: string[];
  competitors: string[];
}

const PILLARS: AtlasPillar[] = [
  {
    id: 'mifc',
    code: 'MIFC',
    name: 'Multi-INT Fusion Cortex',
    href: '/cortex/mifc',
    icon: Layers,
    governance: 'PCE Gate · Reality Score',
    oneLiner:
      'One vessel-reality engine fusing AIS, SAR, RF, EO and acoustic into a probabilistic Reality Score with provenance.',
    bullets: [
      'AIS + SAR + RF + EO + acoustic + economic priors',
      'Per-vessel Reality Score with 95% CI and dissent vector',
      'Every flag passes an A11oy PCE Gate before alerting',
    ],
    competitors: ['Spire', 'Kpler', 'Skylight (extended)'],
  },
  {
    id: 'aat',
    code: 'AAT',
    name: 'Adversarial AIS Twin',
    href: '/cortex/aat',
    icon: Brain,
    governance: 'Constitutional self-critique · Proof Packet',
    oneLiner:
      'For every dark or spoofing vessel, a "truthful twin" predicts where it actually is — and justifies itself.',
    bullets: [
      'Spoofing-pattern library (Black Sea, Hormuz, Venezuela)',
      'Route-physics + weather + port economics + counterparty intent',
      'Constitutional self-critique with challengeable Proof Packet',
    ],
    competitors: ['Windward', 'Lloyd\u2019s List', 'Pole Star'],
  },
  {
    id: 'cb-ncm',
    code: 'CB-NCM',
    name: 'Convoy Brain — Naval Coalition Mode',
    href: '/cortex/cb-ncm',
    icon: Shield,
    governance: 'Constitutions encode RoE',
    oneLiner:
      'Naval-grade escort and convoy planning for multi-fleet, multi-flag coalition operations.',
    bullets: [
      'RoE encoded as A11oy Constitutions per coalition member',
      'Live RF threat picture from MIFC, jamming/spoofing alerts',
      'PRISM-style adversary simulation, SeaVision/AMVER export',
    ],
    competitors: ['SeaVision (US Navy)', 'NATO MCCIS', 'Five Eyes fusion'],
  },
  {
    id: 'choke-point',
    code: 'PRISM',
    name: 'Choke Point PRISM',
    href: '/cortex/choke-point',
    icon: Compass,
    governance: 'Decision Twin · Workcell-gated',
    oneLiner:
      'Live disruption prediction, alt-routing and freight-rate / war-risk-premium impact for the world\u2019s eight maritime chokepoints.',
    bullets: [
      'Hormuz · Bab-el-Mandeb · Malacca · Suez · Panama · Bosporus · Taiwan · Denmark',
      'Disruption probability with adversary-action priors',
      'Re-route cost and war-risk-premium delta in one click',
    ],
    competitors: ['Kpler', 'Lloyd\u2019s List', 'Pole Star Helm'],
  },
  {
    id: 'ssm',
    code: 'SSM',
    name: 'Sovereign Sensor Mesh',
    href: '/cortex/ssm',
    icon: Satellite,
    governance: 'Covenant Key · air-gapped',
    oneLiner:
      'Bring your own coastal radar, VTS, RF and hydrophone feeds — A11oy validates, mints a Covenant Key, the feed becomes a first-class layer in MIFC.',
    bullets: [
      'Schema-validated registration of customer sensor feeds',
      'Covenant Key sealed in air-gapped Sovereign Mode',
      'Surface as a first-class layer alongside commercial sources',
    ],
    competitors: ['No commercial parallel — naval pilot bridge'],
  },
];

const BENCHMARKS: { name: string; us: string; them: string; verdict: 'win' | 'parity' | 'gap' }[] = [
  { name: 'AIS coverage', us: 'Spire S-band feed + cross-source fusion', them: 'AIS-only or AIS + light SAR', verdict: 'parity' },
  { name: 'Dark-vessel reasoning', us: 'AAT twin with constitutional self-critique', them: 'Heuristic gap detection', verdict: 'win' },
  { name: 'Naval coalition planning', us: 'CB-NCM with RoE Constitutions + PRISM sim', them: 'Single-flag tooling, no coalition layer', verdict: 'win' },
  { name: 'Sovereign / air-gapped', us: 'SSM Covenant Key, customer-supplied mesh', them: 'Cloud-only, vendor-owned data', verdict: 'win' },
  { name: 'Provenance per decision', us: 'PCE Gate + Proof Packet on every alert', them: 'Audit log only', verdict: 'win' },
  { name: 'Editorial brief output', us: 'Brief mode (B) — Anthropic-feel reading view', them: 'Dashboard exports', verdict: 'parity' },
];

export default function FieldAtlasPage() {
  return (
    <div className="min-h-full" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="border-l-2 pl-6 mb-12" style={{ borderColor: ALLOY_GOLD }}>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: ALLOY_GOLD }}>
            Vessels · Field Atlas
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">
            Where Vessels stands in the field of maritime intelligence
          </h1>
          <p className="text-sm text-white/60 max-w-3xl leading-relaxed">
            A flagship maritime platform is the sum of its sensors, its reasoning and its provenance.
            This atlas names the five surfaces that move Vessels from a comprehensive dashboard to a
            navy- or major-line-grade decision system, and shows how each one stands against the
            commercial and government-grade incumbents it competes with.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                  key={p.id}
                  href={p.href}
                  className="block group rounded-lg border p-6 transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderTop: `2px solid ${ALLOY_GOLD}40`,
                  }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `${ALLOY_GOLD}10`, border: `1px solid ${ALLOY_GOLD}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: ALLOY_GOLD }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
                          style={{ background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD }}
                        >
                          {p.code}
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                          {p.governance}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-white">{p.name}</h2>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-4">{p.oneLiner}</p>
                  <ul className="space-y-1.5 mb-4">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-white/55">
                        <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: ALLOY_GOLD }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono uppercase tracking-wider">
                    <span>vs.</span>
                    {p.competitors.map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                        {c}
                      </span>
                    ))}
                  </div>
              </Link>
            );
          })}
        </div>

        <div className="mb-16">
          <h2 className="text-lg font-semibold text-white mb-1">Capability map</h2>
          <p className="text-xs text-white/50 mb-6">
            Where Vessels lands relative to the commercial and government-grade field, capability by capability.
          </p>
          <div
            className="rounded-lg border overflow-hidden"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                  <th className="text-left text-[10px] font-mono uppercase tracking-wider text-white/40 px-4 py-3">Capability</th>
                  <th className="text-left text-[10px] font-mono uppercase tracking-wider text-white/40 px-4 py-3">Vessels</th>
                  <th className="text-left text-[10px] font-mono uppercase tracking-wider text-white/40 px-4 py-3">Field</th>
                  <th className="text-right text-[10px] font-mono uppercase tracking-wider text-white/40 px-4 py-3">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARKS.map((b) => (
                  <tr key={b.name} className="border-b last:border-0" style={{ borderColor: 'hsl(var(--border))' }}>
                    <td className="px-4 py-3 text-white/80 font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-white/60">{b.us}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{b.them}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                        style={
                          b.verdict === 'win'
                            ? { background: `${ALLOY_GOLD}15`, color: ALLOY_GOLD, border: `1px solid ${ALLOY_GOLD}30` }
                            : b.verdict === 'parity'
                            ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                            : { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                        }
                      >
                        {b.verdict === 'win' ? 'lead' : b.verdict === 'parity' ? 'parity' : 'gap'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            { icon: Eye, label: 'AIS', source: 'Spire / Orbcomm' },
            { icon: Satellite, label: 'SAR', source: 'Sentinel-1 · ICEYE · Capella' },
            { icon: Radio, label: 'RF geolocation', source: 'HawkEye 360 · Unseenlabs · Spire' },
            { icon: Target, label: 'EO', source: 'BlackSky · Planet' },
            { icon: Waves, label: 'Acoustic', source: 'Hydrophone arrays' },
            { icon: Network, label: 'Ownership', source: 'Lloyd\u2019s · IHS' },
            { icon: ShieldAlert, label: 'Sanctions', source: 'OFAC · EU · UK · UN' },
            { icon: Anchor, label: 'Sovereign mesh', source: 'Customer-supplied' },
          ].map((s) => {
            const I = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-md border px-3 py-3 text-xs"
                style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
              >
                <I className="w-3.5 h-3.5 mb-2" style={{ color: ALLOY_GOLD }} />
                <div className="text-white font-medium mb-0.5">{s.label}</div>
                <div className="text-[10px] text-white/40">{s.source}</div>
              </div>
            );
          })}
        </div>

        <div
          className="rounded-md border-l-2 pl-4 py-2 text-[11px] font-mono uppercase tracking-wider"
          style={{ borderColor: ALLOY_GOLD, color: 'rgba(255,255,255,0.4)' }}
        >
          <Activity className="w-3 h-3 inline mr-2" style={{ color: ALLOY_GOLD }} />
          Atlas indexed by A11oy · Workcell registry · provenance per surface
        </div>
      </div>
    </div>
  );
}
