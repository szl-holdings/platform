import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { NewsletterSubscribe } from '@szl-holdings/shared-ui/newsletter-subscribe';
import { cn } from '@szl-holdings/shared-ui/utils';
import { AtelierSpaceEmbed } from '../components/AtelierSpaceEmbed';
import {
  Activity,
  AlertTriangle,
  Briefcase,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Gavel,
  Network,
  Scale,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const CORE_VIEWS = [
  {
    icon: Briefcase,
    title: 'Matter Overview',
    desc: 'Every active matter on a single command surface — phase, exposure, owner, and the next decision the GC actually needs to make.',
    color: 'text-[#c9b787]',
  },
  {
    icon: Clock,
    title: 'Obligation Timeline',
    desc: 'Every contractual and regulatory deadline mapped against ownership, dependencies, and the consequence of missing it.',
    color: 'text-[#c9b787]',
  },
  {
    icon: Network,
    title: 'Dependency Graph',
    desc: 'Cross-matter dependencies — counterparties, contracts, and obligations that move together — rendered as a graph instead of a spreadsheet.',
    color: 'text-[#8a8a8a]',
  },
  {
    icon: AlertTriangle,
    title: 'Risk Exposure Desk',
    desc: 'Quantified legal exposure per matter, per business unit — what could go wrong, how much it costs, who decides next.',
    color: 'text-[#f5f5f5]',
  },
];

const EXPOSURE_DEMO = [
  {
    matter: 'Project Halcyon · M&A diligence',
    exposure: '$3.2M',
    status: 'obligation gap',
    severity: 'critical',
    next: 'Counter-warranty draft · 4 days to signing',
  },
  {
    matter: 'Indigo IP enforcement',
    exposure: '$1.8M',
    status: 'decision required',
    severity: 'high',
    next: 'Approve injunction filing · GC sign-off',
  },
  {
    matter: 'Aurora supply contract',
    exposure: '$0.9M',
    status: 'under negotiation',
    severity: 'medium',
    next: 'Counter-redline · response within 48h',
  },
  {
    matter: 'Meridian employment claim',
    exposure: '$0.5M',
    status: 'monitoring',
    severity: 'info',
    next: 'Mediation scheduled · evidence packet ready',
  },
];

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'text-[#f5f5f5] bg-[#f5f5f5]/10 border-[#f5f5f5]/20',
  high: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/20',
  medium: 'text-[#8a8a8a] bg-[#8a8a8a]/10 border-[#8a8a8a]/20',
  info: 'text-[#5e5e5e] bg-[#5e5e5e]/10 border-[#5e5e5e]/20',
};

const WHAT_IT_SOLVES = [
  'Matter status that lives in email threads instead of a system of record',
  'Obligations buried in PDFs that surface only after the deadline passes',
  'Cross-matter dependencies that no one notices until they collide',
  'Outside counsel spend with no link to the matter outcome it produced',
  'Legal exposure that is felt by the business but never quantified',
  'Approval chains that stall because the next decision has no owner',
  'Board reporting that summarizes activity instead of risk and outcome',
  'Privilege and audit trails reconstructed by hand under pressure',
];

export default function CounselLandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] overflow-x-hidden">
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[420px] bg-white/[0.04] rounded-full blur-3xl" />
          <div className="absolute top-2/3 right-1/4 w-64 h-64 bg-white/[0.02] rounded-full blur-2xl" />
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.06]"
            viewBox="0 0 1200 600"
            aria-hidden="true"
          >
            <g stroke="rgba(139,92,246,0.7)" strokeWidth="0.5" fill="none">
              {Array.from({ length: 13 }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1={0}
                  y1={i * 50}
                  x2={1200}
                  y2={i * 50}
                  strokeDasharray="2 10"
                />
              ))}
              {Array.from({ length: 25 }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={i * 50}
                  y1={0}
                  x2={i * 50}
                  y2={600}
                  strokeDasharray="2 10"
                />
              ))}
            </g>
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Scale className="w-5 h-5 text-[#c9b787]" />
            </div>
            <span className="text-sm font-medium text-[#8a8a8a]">
              Counsel Legal Matter Command · Powered by Counsel
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-[#f5f5f5] leading-tight mb-6">
            Turn matters, obligations,
            <br />
            <span className="text-[#c9b787]">and legal exposure into command.</span>
          </h1>

          <p className="text-lg text-[#8a8a8a] max-w-2xl mx-auto mb-10 leading-relaxed">
            Counsel is a legal matter command platform for general counsel and legal ops who need
            more than a matter management tool. See exposure across every matter, the obligations
            that depend on each other, and the next decision someone has to make this week.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#f5f5f5] hover:bg-[#e0e0e0] text-[#0a0a0a] font-semibold rounded-xl transition-all text-sm"
            >
              Request a Pilot <ChevronRight className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <button type="button" className="flex items-center gap-2 px-6 py-3 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] text-[#e0e0e0] font-medium rounded-xl transition-all text-sm">
                Open Matter Command <Activity className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: Briefcase, label: '26 active matters' },
              { icon: Clock, label: '12 obligations in 30 days' },
              { icon: AlertTriangle, label: '$6.4M exposure tracked' },
              { icon: ShieldCheck, label: 'Privilege chain enforced' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs text-[#c9b787]">
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-[#0a0a0a] border-y border-white/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono text-[#c9b787] uppercase tracking-widest mb-3">
              What Counsel Does
            </p>
            <h2 className="font-display text-3xl font-bold text-[#f5f5f5] mb-3">
              Legal matter command. Not a matter database.
            </h2>
            <p className="text-[#8a8a8a] mt-3 max-w-xl mx-auto text-sm">
              Most legal tools stop at storage. Counsel carries every matter through to the
              obligation it creates, the exposure it represents, and the decision that has to land
              before the next deadline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Briefcase,
                title: 'Matter Overview',
                desc: 'Every active matter on one command surface — phase, exposure, owner, and the next decision required.',
                color: 'text-[#c9b787]',
              },
              {
                icon: Clock,
                title: 'Obligation Timeline',
                desc: 'Contractual and regulatory deadlines mapped against ownership and the consequence of missing them.',
                color: 'text-[#c9b787]',
              },
              {
                icon: Network,
                title: 'Dependency Graph',
                desc: 'Cross-matter dependencies rendered as a graph — counterparties and obligations that move together.',
                color: 'text-[#8a8a8a]',
              },
              {
                icon: AlertTriangle,
                title: 'Risk Exposure Desk',
                desc: 'Quantified legal exposure per matter and per business unit — dollarized and tied to decision owners.',
                color: 'text-[#f5f5f5]',
              },
              {
                icon: TrendingUp,
                title: 'Counsel Performance',
                desc: 'Outside counsel spend tied to matter outcome, cycle time, and recovered or avoided exposure.',
                color: 'text-[#c9b787]',
              },
              {
                icon: ShieldCheck,
                title: 'Trust & Provenance',
                desc: 'Every action signed, attributable, and privilege-aware — the audit trail boards and regulators expect.',
                color: 'text-[#c9b787]',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[#111111]/80 border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.1] transition-all"
              >
                <feature.icon className={cn('w-5 h-5 mb-3', feature.color)} />
                <h3 className="text-sm font-bold text-[#f5f5f5] mb-2">{feature.title}</h3>
                <p className="text-[11px] text-[#8a8a8a] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-[#c9b787] uppercase tracking-widest mb-3">
            Core Views
          </p>
          <h2 className="font-display text-3xl font-bold text-[#f5f5f5]">
            Four command surfaces. One legal platform.
          </h2>
          <p className="text-[#8a8a8a] mt-3 max-w-xl mx-auto text-sm">
            Each view is purpose-built for a specific decision the GC and legal ops actually have to
            make.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_VIEWS.map((view) => (
            <div
              key={view.title}
              className="bg-[#111111]/80 border border-white/[0.06] rounded-xl p-6"
            >
              <view.icon className={cn('w-5 h-5 mb-3', view.color)} />
              <h3 className="text-sm font-bold text-[#f5f5f5] mb-2">{view.title}</h3>
              <p className="text-[12px] text-[#8a8a8a] leading-relaxed">{view.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 bg-[#0a0a0a] border-y border-white/[0.03]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-mono text-[#c9b787] uppercase tracking-widest mb-3">
              Live Exposure Demo
            </p>
            <h2 className="font-display text-3xl font-bold text-[#f5f5f5] mb-3">
              Every matter is exposure with an owner.
            </h2>
            <p className="text-[#8a8a8a] max-w-xl mx-auto text-sm">
              A snapshot from the Counsel exposure desk — every matter quantified, scored, and
              routed to the next decision.
            </p>
          </div>

          <div className="bg-[#111111]/90 border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#1a0e30]/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c9b787] animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#8a8a8a]/70">
                  Live · Exposure Desk
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#c9b787]">
                Total tracked exposure · $6.4M
              </span>
            </div>
            <div className="divide-y divide-[#f5f5f5]/5">
              {EXPOSURE_DEMO.map((row) => (
                <div key={row.matter} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5">
                  <div className="col-span-4 text-[12px] text-[#f5f5f5]/85 leading-snug">
                    {row.matter}
                  </div>
                  <div className="col-span-2 text-right text-[12px] font-mono text-[#8a8a8a]">
                    {row.exposure}
                  </div>
                  <div className="col-span-2">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border',
                        SEVERITY_STYLE[row.severity],
                      )}
                    >
                      {row.status}
                    </span>
                  </div>
                  <div className="col-span-4 text-[11px] text-[#8a8a8a] leading-snug text-right">
                    {row.next}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-[#c9b787] uppercase tracking-widest mb-3">
            What It Solves
          </p>
          <h2 className="font-display text-3xl font-bold text-[#f5f5f5] mb-3">
            Eight problems. One legal command.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WHAT_IT_SOLVES.map((tile) => (
            <div key={tile} className="bg-[#111111]/80 border border-white/[0.06] rounded-xl p-4">
              <div className="w-3 h-3 rounded-full border-2 border-violet-400/30 mb-3" />
              <p className="text-[12px] text-[#e0e0e0]/65 leading-snug">{tile}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 bg-[#0a0a0a] border-y border-white/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono text-[#c9b787] uppercase tracking-widest mb-3">
              Why It Matters
            </p>
            <h2 className="font-display text-3xl font-bold text-[#f5f5f5] mb-4">
              From matter management to legal command.
            </h2>
            <p className="text-[#8a8a8a] text-sm max-w-2xl mx-auto leading-relaxed">
              Every general counsel already has matters. Very few can show the board which matters
              represent the most exposure, which obligations land next, and which decisions are
              stalled because no one owns the next move. That is the gap Counsel closes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              {
                metric: '$6.4M',
                label: 'exposure quantified & owned',
                trend: 'across 26 active matters',
              },
              {
                metric: '12',
                label: 'obligations landing in 30 days',
                trend: 'tracked to deadline & owner',
              },
              {
                metric: '31%',
                label: 'outside counsel spend reduced',
                trend: '↓ vs prior fiscal year',
              },
              {
                metric: '100%',
                label: 'privilege chain attestable',
                trend: 'every action signed and traceable',
              },
            ].map((o) => (
              <div key={o.metric} className="text-center">
                <p className="text-3xl font-bold font-display text-[#8a8a8a] mb-1">{o.metric}</p>
                <p className="text-[11px] text-[#8a8a8a] leading-relaxed mb-1">{o.label}</p>
                <p className="text-[9px] font-mono text-[#c9b787]">{o.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', background: '#0a0a0a' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.25em', color: '#c9b787', marginBottom: 12, textTransform: 'uppercase' as const }}>
              Live: Legal Discovery Agent
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#f5f5f5', marginBottom: 12 }}>
              Privilege-aware discovery, in a governed runtime.
            </h2>
            <p style={{ fontSize: 14, color: '#8a8a8a', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
              Every discovery run produces a privilege log, deadline analysis, and a proof packet
              before any document leaves the firewall.
            </p>
          </div>
          <AtelierSpaceEmbed />
        </div>
      </section>

      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', background: '#0a0a0a' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.25em', color: '#5e5e5e', marginBottom: 20, textTransform: 'uppercase' as const }}>
            Part of the SZL Holdings ecosystem
          </p>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#f5f5f5', marginBottom: 14 }}>
            Orchestrated by <span style={{ color: '#c9b787' }}>a11oy</span>
          </p>
          <p style={{ fontSize: 13, color: '#8a8a8a', lineHeight: 1.8, maxWidth: 520, margin: '0 auto' }}>
            Every decision in Counsel follows the same governed path — Signal, Context, Recommendation, Simulation, Policy, Execution, Proof, Outcome. The same proof chain. The same attribution. The same governance.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 bg-[#0a0a0a] border-t border-white/[0.03]">
        <div className="max-w-[560px] mx-auto">
          <NewsletterSubscribe
            utmSource="counsel"
            variant="banner"
            heading="Legal command essays, straight to your inbox"
            subheading="SZL Command essays on legal operations, exposure quantification, and the decision infrastructure behind Counsel — delivered weekly."
          />
        </div>
      </section>

      <section className="px-6 py-20 bg-[#0a0a0a] border-t border-white/[0.03]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-mono text-[#c9b787] uppercase tracking-widest mb-3">
            Powered by Counsel · SZL Holdings
          </p>
          <h2 className="font-display text-3xl font-bold text-[#f5f5f5] mb-4">Request a Pilot</h2>
          <p className="text-[#8a8a8a] mb-8 text-sm leading-relaxed max-w-xl mx-auto">
            Counsel is built for general counsel and legal ops who need to command exposure, not
            just track matters. Request a pilot — we will walk through the full command center
            against your active matter book.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#f5f5f5] hover:bg-[#e0e0e0] text-[#0a0a0a] font-semibold rounded-xl transition-all text-sm"
            >
              Request a Pilot <Gavel className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <button type="button" className="flex items-center gap-2 px-6 py-3 border border-white/[0.08] hover:border-white/[0.12] text-[#e0e0e0] font-medium rounded-xl transition-all text-sm">
                Open Matter Command <FileText className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <p className="text-[10px] font-mono text-[#c9b787] mt-6 inline-flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" />
            Pilot pricing tied to matter book size · onboard in two weeks
          </p>
        </div>
      </section>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="counsel"
        subtitle="Counsel Legal Matter Command"
      />
    </div>
  );
}
