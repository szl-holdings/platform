import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { NewsletterSubscribe } from '@szl-holdings/shared-ui/newsletter-subscribe';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Anchor,
  BarChart3,
  ChevronRight,
  DollarSign,
  MapPin,
  Navigation,
  Ship,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

const CORE_VIEWS = [
  {
    icon: MapPin,
    title: 'Fleet Map',
    desc: 'Vessel positions, route lines, port locations, and alert indicators in a single command view. Not a generic map widget — a command surface built for operational teams.',
    color: 'text-[#8a8a8a]',
  },
  {
    icon: AlertTriangle,
    title: 'Exceptions Center',
    desc: 'Prioritized exception queue with full operational context — what happened, why it matters, recommended response, and business consequence.',
    color: 'text-[#c9b787]',
  },
  {
    icon: DollarSign,
    title: 'Voyage Economics',
    desc: 'Estimated voyage revenue, operating cost, margin estimate, fuel and delay impact — per voyage, per charter, per route.',
    color: 'text-[#8a8a8a]',
  },
  {
    icon: Activity,
    title: 'Command Mode',
    desc: 'Focused operational view with map prominence, live exception stream, fleet status rail, and rapid vessel switching.',
    color: 'text-[#8a8a8a]',
  },
];

const WHAT_IT_SOLVES = [
  'Voyage exceptions that surface too late to act on',
  'Fleet utilization gaps invisible to commercial teams',
  'Maintenance windows that create unplanned downtime',
  'Sanctions exposure caught after the fixture is signed',
  'Dark vessel behavior that standard AIS cannot detect',
  'Route profitability unknown until the voyage closes',
  'Ownership ambiguity across multi-vessel operations',
  'ETA deviations with no early warning or escalation path',
];

export default function VesselsLandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] overflow-x-hidden">
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.03] rounded-full blur-3xl" />
          <div className="absolute top-2/3 right-1/4 w-64 h-64 bg-white/[0.02] rounded-full blur-2xl" />
          <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 1200 600">
            <g stroke="rgba(201,183,135,0.8)" strokeWidth="0.5" fill="none">
              {[-60, -30, 0, 30, 60].map((lat) => {
                const y = lat === 0 ? 300 : 300 - lat * 4;
                return <line key={lat} x1={0} y1={y} x2={1200} y2={y} strokeDasharray="4 6" />;
              })}
              {[-150, -90, -30, 30, 90, 150].map((lon) => {
                const x = ((lon + 180) / 360) * 1200;
                return <line key={lon} x1={x} y1={0} x2={x} y2={600} strokeDasharray="4 6" />;
              })}
            </g>
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Ship className="w-5 h-5 text-[#8a8a8a]" />
            </div>
            <span className="text-sm font-medium text-[#8a8a8a]">
              Vessels Maritime Command · Powered by Counsel
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-[#f5f5f5] leading-tight mb-6">
            Turn fleet visibility, voyage performance,
            <br />
            <span className="text-[#8a8a8a]">and operational exceptions into command.</span>
          </h1>

          <p className="text-lg text-[#8a8a8a] max-w-2xl mx-auto mb-10 leading-relaxed">
            Vessels is a maritime command platform for operators who need more than a position feed.
            See the exceptions that matter, understand voyage economics, and act before disruptions
            escalate.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/fleet">
              <button className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-[#d4c494] text-[#0a0a0a] font-semibold rounded-xl transition-all text-sm">
                Open Fleet Command <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/command">
              <button className="flex items-center gap-2 px-6 py-3 bg-white/[0.04] hover:bg-sky-500/15 border border-white/[0.08] text-[#8a8a8a] font-medium rounded-xl transition-all text-sm">
                View Command Mode <Activity className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: Ship, label: '10 vessels tracked' },
              { icon: Navigation, label: '9 active voyages' },
              { icon: AlertTriangle, label: '8 exceptions managed' },
              { icon: Anchor, label: '7 corridors monitored' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs text-[#8a8a8a]">
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-[#0a0a0a] border-y border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mb-3">
              What Vessels Does
            </p>
            <h2 className="font-display text-3xl font-bold text-[#f5f5f5] mb-3">
              Fleet command. Not fleet tracking.
            </h2>
            <p className="text-[#8a8a8a] mt-3 max-w-xl mx-auto text-sm">
              Most fleet tools stop at position. Vessels is built for the complete operational
              picture — from where a vessel is, to what it earns, to what needs to happen now. Every
              view is a command surface, not a status display.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: MapPin,
                title: 'Live Fleet Map',
                desc: 'Vessel positions, route lines, port locations, and alert indicators in one command view.',
                color: 'text-[#8a8a8a]',
              },
              {
                icon: AlertTriangle,
                title: 'Exceptions Center',
                desc: 'Prioritized exception queue with full operational context, recommended response, and business consequence.',
                color: 'text-[#c9b787]',
              },
              {
                icon: DollarSign,
                title: 'Voyage Economics',
                desc: 'Revenue, cost, margin, and charter performance per active voyage — not just position data.',
                color: 'text-[#8a8a8a]',
              },
              {
                icon: Wrench,
                title: 'Maintenance Readiness',
                desc: 'Asset health scores, service risk indicators, and readiness states across the fleet.',
                color: 'text-[#c9b787]',
              },
              {
                icon: Activity,
                title: 'Command Mode',
                desc: 'Focused operational dashboard with map prominence, live alert stream, and fleet status rail.',
                color: 'text-[#8a8a8a]',
              },
              {
                icon: BarChart3,
                title: 'Performance Analytics',
                desc: 'Utilization, on-time arrival trends, route profitability, and corridor analysis.',
                color: 'text-[#8a8a8a]',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[#111111]/80 border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.08] transition-all"
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
          <p className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mb-3">
            Core Views
          </p>
          <h2 className="font-display text-3xl font-bold text-[#f5f5f5]">
            Four command surfaces. One platform.
          </h2>
          <p className="text-[#8a8a8a] mt-3 max-w-xl mx-auto text-sm">
            Each view is purpose-built for a specific operational need — not a generic dashboard
            with filters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_VIEWS.map((view, _i) => (
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

      <section className="px-6 py-20 bg-[#0a0a0a] border-y border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mb-3">
              What It Solves
            </p>
            <h2 className="font-display text-3xl font-bold text-[#f5f5f5] mb-3">
              Eight problems. One command platform.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {WHAT_IT_SOLVES.map((tile, _i) => (
              <div key={tile} className="bg-[#111111]/80 border border-white/[0.06] rounded-xl p-4">
                <div className="w-3 h-3 rounded-full border-2 border-white/[0.12] mb-3" />
                <p className="text-[12px] text-[#8a8a8a] leading-snug">{tile}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mb-3">
            Why It Matters
          </p>
          <h2 className="font-display text-3xl font-bold text-[#f5f5f5] mb-4">
            From tracking to command.
          </h2>
          <p className="text-[#8a8a8a] text-sm max-w-2xl mx-auto leading-relaxed">
            Every maritime operator knows where their vessels are. Very few know what the exceptions
            mean, which voyages are profitable, which vessels are at maintenance risk, and what
            needs to happen in the next four hours. That is the gap Vessels closes.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { metric: '84%', label: 'on-time arrival rate', trend: '↑ vs 79% prior quarter' },
            { metric: '$1.2M', label: 'delay exposure mitigated', trend: 'Fleet-wide Q1 2026' },
            {
              metric: '91%',
              label: 'average fleet utilization',
              trend: 'excl. maintenance periods',
            },
            {
              metric: '3.2h',
              label: 'avg exception resolution',
              trend: 'vs 11h unmanaged baseline',
            },
          ].map((o) => (
            <div key={o.metric} className="text-center">
              <p className="text-3xl font-bold font-display text-[#8a8a8a] mb-1">{o.metric}</p>
              <p className="text-[11px] text-[#8a8a8a] leading-relaxed mb-1">{o.label}</p>
              <p className="text-[9px] font-mono text-[#8a8a8a]">{o.trend}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 bg-[#0a0a0a] border-t border-white/[0.04]">
        <div className="max-w-[560px] mx-auto">
          <NewsletterSubscribe
            utmSource="vessels"
            variant="banner"
            heading="Maritime intelligence, straight to your inbox"
            subheading="SZL Command essays on fleet operations, maritime AI, and the decision infrastructure behind Vessels — delivered weekly."
          />
        </div>
      </section>

      <section className="px-6 py-20 bg-[#0a0a0a] border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mb-3">
            Powered by Counsel · SZL Holdings
          </p>
          <h2 className="font-display text-3xl font-bold text-[#f5f5f5] mb-4">Request a Demo</h2>
          <p className="text-[#8a8a8a] mb-8 text-sm leading-relaxed max-w-xl mx-auto">
            Vessels is built for maritime operators who need more than a position feed. Request a
            demo — we will walk through the full command center with your fleet data in mind.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => setDemoOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-[#d4c494] text-[#0a0a0a] font-semibold rounded-xl transition-all text-sm"
            >
              Request a Demo <Ship className="w-4 h-4" />
            </button>
            <Link href="/fleet">
              <button className="flex items-center gap-2 px-6 py-3 border border-white/[0.08] hover:border-white/[0.03]0 text-[#8a8a8a] font-medium rounded-xl transition-all text-sm">
                Open Fleet Command <Activity className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="vessels"
        subtitle="Vessels Maritime Intelligence Platform"
      />
    </div>
  );
}
