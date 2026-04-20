import { getProduct } from '@szl-holdings/brand-registry';
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  FileStack,
  Lock,
  Network,
  Scale,
  Shield,
  Zap,
} from 'lucide-react';

const ACCENT = '#a78bfa';
const product = getProduct('prism-counsel');

interface MarketingLandingProps {
  onSignIn: () => void;
}

const features = [
  {
    icon: <Scale className="w-5 h-5" />,
    title: 'Matter Board',
    description:
      'Pressure-scored matter cards with live obligation counts, deadlines, and privilege indicators. Your entire docket at a glance.',
  },
  {
    icon: <Network className="w-5 h-5" />,
    title: 'Obligation Graph',
    description:
      'Visualize parties, deadlines, filings, and dependencies as a dependency graph. Spot chain-reaction risks before they cascade.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Deadline Pressure Heatmap',
    description:
      "Timeline heatmap weighted by imminence and matter complexity. See where your team's capacity is about to break.",
  },
  {
    icon: <FileStack className="w-5 h-5" />,
    title: 'Proof Chain Export',
    description:
      'Generate a privilege-aware, chronologically ordered timeline bundle for any matter. Court-ready in one click.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Matter Walls',
    description:
      'Role-aware access controls with per-matter firewall configuration, redaction workflows, and ethics screen management.',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Privilege Audit Trail',
    description:
      'Immutable audit log of every access, export, redaction, and privilege reclassification across all matters.',
  },
];

const stats = [
  { label: 'Matters Tracked', value: '2,400+' },
  { label: 'Privilege Levels', value: '4-tier' },
  { label: 'Average Deadline Lead Time', value: '3.2×' },
  { label: 'Audit Events Logged', value: '100%' },
];

const trustPoints = [
  'Attorney-client privilege preserved at every layer',
  'Configurable matter walls for ethics compliance',
  'Role-aware access: partner, associate, paralegal, billing',
  'Proof chain exports include cryptographic hashes',
  'SOC 2 Type II (in progress) — zero-trust architecture',
];

export default function MarketingLanding({ onSignIn }: MarketingLandingProps) {
  return (
    <div className="min-h-screen" style={{ background: '#080810', color: '#e2e8f0' }}>
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.25)',
            }}
          >
            <Scale className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <span
              className="text-sm font-semibold font-display tracking-wide"
              style={{ color: ACCENT }}
            >
              {product?.name ?? 'PRISM Counsel'}
            </span>
            <span className="text-xs text-white/20 ml-2">by SZL Holdings</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#features"
            className="text-xs text-white/40 hover:text-white/70 transition-colors hidden sm:block"
          >
            Features
          </a>
          <a
            href="#trust"
            className="text-xs text-white/40 hover:text-white/70 transition-colors hidden sm:block"
          >
            Trust & Security
          </a>
          <button
            onClick={onSignIn}
            className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all"
            style={{
              background: 'rgba(167,139,250,0.15)',
              color: ACCENT,
              border: '1px solid rgba(167,139,250,0.25)',
            }}
          >
            Sign In
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-8"
          style={{
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.2)',
            color: ACCENT,
          }}
        >
          <Zap className="w-3 h-3" />
          Legal command, governed by AI
        </div>
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold font-display leading-tight mb-6"
          style={{ letterSpacing: '-0.02em' }}
        >
          Legal intelligence
          <br />
          <span style={{ color: ACCENT }}>built for command.</span>
        </h1>
        <p className="text-base text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
          {product?.description ??
            'PRISM Counsel maps matter pressure, obligation chains, and privilege risk into a single command surface. Built for GC offices and enterprise litigation teams that operate at scale.'}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: ACCENT, color: '#08080f' }}
          >
            Request access
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              window.location.href = '?view=app';
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'rgba(167,139,250,0.08)',
              border: '1px solid rgba(167,139,250,0.2)',
              color: 'rgba(167,139,250,0.8)',
            }}
          >
            Explore demo
          </button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div
          className="rounded-2xl border border-white/5 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            {['#ef4444', '#f97316', '#22c55e'].map((c) => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
            <span className="text-[11px] font-mono text-white/20 ml-2">
              PRISM Counsel — Matter Board
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                name: 'Apex Capital — Series C',
                type: 'M&A',
                pressure: 87,
                status: 'active',
                next: 'HSR Filing · 3d',
                color: '#f97316',
              },
              {
                name: 'NeuralTech v. Prometheus',
                type: 'IP Litigation',
                pressure: 94,
                status: 'active',
                next: 'Expert Disclosure · 7d',
                color: '#ef4444',
              },
              {
                name: 'Citadel Financial — SEC',
                type: 'Regulatory',
                pressure: 96,
                status: 'escalated',
                next: 'Document Production · 2d',
                color: '#ef4444',
              },
            ].map((m) => (
              <div
                key={m.name}
                className="rounded-xl p-4 border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-white/80 leading-tight">{m.name}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{m.type}</p>
                  </div>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{
                      background:
                        m.status === 'escalated'
                          ? 'rgba(239,68,68,0.15)'
                          : 'rgba(167,139,250,0.12)',
                      color: m.status === 'escalated' ? '#ef4444' : ACCENT,
                    }}
                  >
                    {m.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/30">Pressure</span>
                    <span className="font-mono font-semibold" style={{ color: m.color }}>
                      {m.pressure}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${m.pressure}%`, background: m.color }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/30 mt-2">
                    <Clock className="w-2.5 h-2.5" />
                    {m.next}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold font-display mb-3">Four signature surfaces</h2>
          <p className="text-sm text-white/40">
            Every view purpose-built for legal command intelligence.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'rgba(167,139,250,0.10)', color: ACCENT }}
              >
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div
          className="rounded-2xl p-8 border border-white/5"
          style={{ background: 'rgba(167,139,250,0.04)' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-semibold font-display mb-1" style={{ color: ACCENT }}>
                  {s.value}
                </p>
                <p className="text-xs text-white/30">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-semibold font-display mb-4">
              Built for privilege-sensitive work
            </h2>
            <p className="text-sm text-white/40 mb-8 leading-relaxed">
              PRISM Counsel was designed from the ground up around attorney-client privilege,
              ethical walls, and audit requirements. Every action is logged. Every export includes a
              privilege attestation.
            </p>
            <ul className="space-y-3">
              {trustPoints.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-white/60">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ACCENT }} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-2xl p-6 border border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-xs text-white/30 uppercase tracking-wider mb-5 font-semibold">
              Privilege Levels
            </p>
            <div className="space-y-3">
              {[
                {
                  label: 'Restricted',
                  color: '#ef4444',
                  desc: 'Ethics wall enforced. Approved users only.',
                },
                {
                  label: 'Privileged',
                  color: '#f97316',
                  desc: 'Attorney work product. No production without review.',
                },
                {
                  label: 'Confidential',
                  color: '#eab308',
                  desc: 'Client-sensitive. Limited sharing scope.',
                },
                { label: 'Public', color: '#22c55e', desc: 'Filed or disclosed documents.' },
              ].map((p) => (
                <div key={p.label} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: p.color }}
                  />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: p.color }}>
                      {p.label}
                    </p>
                    <p className="text-[11px] text-white/30">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 py-16 text-center px-6">
        <h2 className="text-2xl font-semibold font-display mb-4">Ready to govern your docket?</h2>
        <p className="text-sm text-white/40 mb-8 max-w-lg mx-auto">
          Join the GC offices and litigation teams running PRISM Counsel as their legal command
          surface.
        </p>
        <button
          onClick={onSignIn}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{ background: ACCENT, color: '#08080f' }}
        >
          Get started
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      <footer className="border-t border-white/5 px-8 py-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Scale className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span className="text-xs text-white/30">PRISM Counsel · SZL Holdings</span>
        </div>
        <p className="text-[11px] text-white/20">
          PRISM Counsel is not a law firm and does not provide legal advice. All outputs require
          attorney review.
        </p>
      </footer>
    </div>
  );
}
