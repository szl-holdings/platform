import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { NewsletterSubscribe } from '@szl-holdings/shared-ui/newsletter-subscribe';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Cpu,
  Lock,
  Radar,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const CORE_VIEWS = [
  {
    icon: ShieldAlert,
    title: 'Threat Overview',
    desc: 'Live threat posture across endpoints, identities, and infrastructure — every signal mapped to the asset, owner, and recovery path it touches.',
    color: 'text-red-400',
  },
  {
    icon: Cpu,
    title: 'Asset Risk Graph',
    desc: 'Every system, identity, and data store rendered as a graph — exposure, blast radius, and downstream dependencies for a single pane of glass.',
    color: 'text-orange-400',
  },
  {
    icon: RotateCcw,
    title: 'Recovery Readiness',
    desc: 'Recovery posture by tier — RTO, RPO, last-tested restore, and the gap between what was promised and what is actually rehearsed.',
    color: 'text-amber-400',
  },
  {
    icon: Activity,
    title: 'Incident Commander',
    desc: 'Focused incident view with attacker timeline, containment options, recommended actions, and the audit trail every regulator will eventually ask for.',
    color: 'text-violet-400',
  },
];

const SIGNAL_DEMO = [
  {
    time: '09:42:08',
    severity: 'critical',
    label: 'Lateral movement detected · prod-finance-vpc',
    action: 'Isolate host · escalate to commander',
  },
  {
    time: '09:41:51',
    severity: 'high',
    label: 'MFA bypass attempt · CFO identity',
    action: 'Force re-auth · session revoked',
  },
  {
    time: '09:39:14',
    severity: 'medium',
    label: 'Backup drift · 2 critical datasets > RPO',
    action: 'Trigger snapshot · notify owner',
  },
  {
    time: '09:36:02',
    severity: 'info',
    label: 'Control gap closed · firewall ruleset 14b',
    action: 'Evidence captured · audit trail signed',
  },
];

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'text-red-300 bg-red-500/15 border-red-500/30',
  high: 'text-orange-300 bg-orange-500/10 border-orange-500/25',
  medium: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  info: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
};

const WHAT_IT_SOLVES = [
  'Threat alerts that never connect to the asset that actually matters',
  'Recovery plans that look good on paper but have not been rehearsed',
  'Identity exposures that surface days after the privilege was granted',
  'Control drift between what auditors signed and what production runs',
  'Incident response that stalls because no one owns the next decision',
  'Tabletop exercises that produce slides but no measurable readiness',
  'Backups whose last successful restore no one can prove',
  'Board reporting that summarizes posture without showing exposure',
];

export default function SentraLandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0606] text-red-50 overflow-x-hidden">
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[420px] bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute top-2/3 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-2xl" />
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.07]"
            viewBox="0 0 1200 600"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="sentra-grid" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(239,68,68,0.6)" />
                <stop offset="100%" stopColor="rgba(239,68,68,0)" />
              </radialGradient>
            </defs>
            <rect width="1200" height="600" fill="url(#sentra-grid)" />
            <g stroke="rgba(239,68,68,0.6)" strokeWidth="0.5" fill="none">
              {Array.from({ length: 13 }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1={0}
                  y1={i * 50}
                  x2={1200}
                  y2={i * 50}
                  strokeDasharray="3 8"
                />
              ))}
              {Array.from({ length: 25 }, (_, i) => (
                <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={600} strokeDasharray="3 8" />
              ))}
            </g>
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-400/60">
              TENAX Cyber Resilience Command · Powered by FORGE
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-red-50 leading-tight mb-6">
            Turn cyber posture, recovery readiness,
            <br />
            <span className="text-red-400">and live incidents into command.</span>
          </h1>

          <p className="text-lg text-red-200/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            TENAX is the cyber resilience command platform for security leaders who need more than
            a SIEM dashboard. See the exposures that map to real assets, prove the recovery you
            promised, and run incidents from a single command surface.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => setDemoOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-400 text-[#0a0606] font-semibold rounded-xl transition-all text-sm"
            >
              Request a Pilot <ChevronRight className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-200 font-medium rounded-xl transition-all text-sm">
                Open Command Center <Activity className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: Radar, label: '247 assets monitored' },
              { icon: ShieldAlert, label: '1 incident open' },
              { icon: RotateCcw, label: 'RTO 42% critical tier' },
              { icon: Lock, label: '3 control gaps tracked' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs text-red-400/80">
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-[#070404] border-y border-red-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest mb-3">
              What TENAX Does
            </p>
            <h2 className="font-display text-3xl font-bold text-red-50 mb-3">
              Cyber resilience command. Not another SIEM.
            </h2>
            <p className="text-red-300/80 mt-3 max-w-xl mx-auto text-sm">
              Most security tools stop at alert. TENAX carries every signal through to the asset it
              threatens, the recovery it endangers, and the decision someone has to make in the next
              ten minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: ShieldAlert,
                title: 'Threat Overview',
                desc: 'Live posture by asset tier, with severity, owner, and the recovery path each signal touches.',
                color: 'text-red-400',
              },
              {
                icon: Cpu,
                title: 'Asset Risk Graph',
                desc: 'Every system rendered with exposure, blast radius, and downstream dependencies in one graph.',
                color: 'text-orange-400',
              },
              {
                icon: RotateCcw,
                title: 'Recovery Readiness',
                desc: 'RTO, RPO, last-tested restore, and the gap between what was promised and what is rehearsed.',
                color: 'text-amber-400',
              },
              {
                icon: Activity,
                title: 'Incident Commander',
                desc: 'Live incident view with attacker timeline, containment options, and the audit trail regulators expect.',
                color: 'text-violet-400',
              },
              {
                icon: BarChart3,
                title: 'Exposure Board',
                desc: 'Quantified exposure by business unit — dollarized, prioritized, and tied to mitigation owners.',
                color: 'text-red-400',
              },
              {
                icon: ShieldCheck,
                title: 'Control Drift',
                desc: 'Continuous diff between attested controls and live production state, with evidence on every change.',
                color: 'text-emerald-400',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[#120a0a]/80 border border-red-500/10 rounded-xl p-5 hover:border-red-500/25 transition-all"
              >
                <feature.icon className={cn('w-5 h-5 mb-3', feature.color)} />
                <h3 className="text-sm font-bold text-red-100 mb-2">{feature.title}</h3>
                <p className="text-[11px] text-red-300/80 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest mb-3">
            Core Views
          </p>
          <h2 className="font-display text-3xl font-bold text-red-50">
            Four command surfaces. One resilience platform.
          </h2>
          <p className="text-red-300/80 mt-3 max-w-xl mx-auto text-sm">
            Each view is purpose-built for a specific decision security leaders actually have to
            make.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_VIEWS.map((view) => (
            <div
              key={view.title}
              className="bg-[#120a0a]/80 border border-red-500/10 rounded-xl p-6"
            >
              <view.icon className={cn('w-5 h-5 mb-3', view.color)} />
              <h3 className="text-sm font-bold text-red-100 mb-2">{view.title}</h3>
              <p className="text-[12px] text-red-300/85 leading-relaxed">{view.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 bg-[#070404] border-y border-red-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest mb-3">
              Live Signal Demo
            </p>
            <h2 className="font-display text-3xl font-bold text-red-50 mb-3">
              Every signal is a decision in waiting.
            </h2>
            <p className="text-red-300/80 max-w-xl mx-auto text-sm">
              A snapshot from the TENAX command stream — every event already mapped to severity,
              asset, and the next action.
            </p>
          </div>

          <div className="bg-[#120a0a]/90 border border-red-500/15 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-red-500/10 bg-[#1a0d0d]/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-red-300/70">
                  Live · Decision Stream
                </span>
              </div>
              <span className="text-[10px] font-mono text-red-400/80">
                prod-finance-vpc · region us-east-1
              </span>
            </div>
            <div className="divide-y divide-red-500/5">
              {SIGNAL_DEMO.map((row) => (
                <div key={row.time} className="grid grid-cols-12 gap-3 items-center px-5 py-3.5">
                  <div className="col-span-2 text-[10px] font-mono text-red-400/85">{row.time}</div>
                  <div className="col-span-2">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border',
                        SEVERITY_STYLE[row.severity],
                      )}
                    >
                      {row.severity}
                    </span>
                  </div>
                  <div className="col-span-5 text-[12px] text-red-100/80 leading-snug">
                    {row.label}
                  </div>
                  <div className="col-span-3 text-[11px] text-red-300/85 leading-snug text-right">
                    {row.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest mb-3">
            What It Solves
          </p>
          <h2 className="font-display text-3xl font-bold text-red-50 mb-3">
            Eight problems. One resilience command.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WHAT_IT_SOLVES.map((tile) => (
            <div key={tile} className="bg-[#120a0a]/80 border border-red-500/10 rounded-xl p-4">
              <div className="w-3 h-3 rounded-full border-2 border-red-400/30 mb-3" />
              <p className="text-[12px] text-red-200/65 leading-snug">{tile}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 bg-[#070404] border-y border-red-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest mb-3">
              Why It Matters
            </p>
            <h2 className="font-display text-3xl font-bold text-red-50 mb-4">
              From alert noise to resilience command.
            </h2>
            <p className="text-red-300/80 text-sm max-w-2xl mx-auto leading-relaxed">
              Every CISO already has alerts. Very few can prove that the controls they attested to
              are still in place, that the recovery they promised is actually rehearsed, or that the
              next incident has an owner before it happens. That is the gap TENAX closes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              {
                metric: '11m',
                label: 'median containment time',
                trend: 'vs 47m unmanaged baseline',
              },
              {
                metric: '$8.4M',
                label: 'exposure quantified & owned',
                trend: 'across 247 monitored assets',
              },
              {
                metric: '94%',
                label: 'controls continuously attested',
                trend: '↑ vs 71% prior quarter',
              },
              {
                metric: '42%',
                label: 'critical-tier recovery posture',
                trend: 'tracked to RTO commitment',
              },
            ].map((o) => (
              <div key={o.metric} className="text-center">
                <p className="text-3xl font-bold font-display text-red-300 mb-1">{o.metric}</p>
                <p className="text-[11px] text-red-300/85 leading-relaxed mb-1">{o.label}</p>
                <p className="text-[9px] font-mono text-red-400/80">{o.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-[#0a0606] border-t border-red-500/5">
        <div className="max-w-[560px] mx-auto">
          <NewsletterSubscribe
            utmSource="sentra"
            variant="banner"
            heading="Cyber resilience essays, straight to your inbox"
            subheading="SZL Command essays on incident command, recovery readiness, and the decision infrastructure behind TENAX — delivered weekly."
          />
        </div>
      </section>

      <section className="px-6 py-20 bg-[#070404] border-t border-red-500/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-mono text-red-400/80 uppercase tracking-widest mb-3">
            Powered by Alloy · SZL Holdings
          </p>
          <h2 className="font-display text-3xl font-bold text-red-50 mb-4">Request a Pilot</h2>
          <p className="text-red-300/85 mb-8 text-sm leading-relaxed max-w-xl mx-auto">
            TENAX is built for security leaders who need to command resilience, not just monitor
            it. Request a pilot — we will walk through the full command center against your
            environment.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => setDemoOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-400 text-[#0a0606] font-semibold rounded-xl transition-all text-sm"
            >
              Request a Pilot <Shield className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-6 py-3 border border-red-500/20 hover:border-red-500/40 text-red-200 font-medium rounded-xl transition-all text-sm">
                Open Command Center <Zap className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="sentra"
        subtitle="TENAX Cyber Resilience Command"
      />
    </div>
  );
}
