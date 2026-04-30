import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  DollarSign,
  MapPin,
  Ship,
  Wrench,
} from 'lucide-react';
import { Link } from 'wouter';
import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';

const modules = [
  {
    icon: MapPin,
    title: 'Fleet Command Map',
    desc: 'AIS vessel positions (live public feeds plus simulated demo data) with route overlays, port locations, and dynamic alert indicators. A premium oceanic view built for command — not a generic map widget.',
    tag: 'Core',
  },
  {
    icon: AlertTriangle,
    title: 'Exceptions Center',
    desc: 'Prioritized exception queue with full operational context: what happened, why it matters, recommended response, and estimated business consequence.',
    tag: 'Core',
  },
  {
    icon: DollarSign,
    title: 'Voyage Economics',
    desc: 'Per-voyage revenue, cost, margin, fuel, and delay impact. Charter performance vs budget across every active voyage in your fleet.',
    tag: 'Core',
  },
  {
    icon: Wrench,
    title: 'Maintenance Readiness',
    desc: 'Asset health scores, service risk indicators, and readiness states across the full fleet. Know before a vessel becomes unavailable.',
    tag: 'Core',
  },
  {
    icon: Activity,
    title: 'Command Mode',
    desc: 'Focused operational dashboard with map prominence, live alert stream, fleet status rail, and rapid vessel switching for high-tempo operations.',
    tag: 'Premium',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    desc: 'Fleet utilization by vessel, on-time arrival trends, route profitability, delay frequency, and corridor analysis across time.',
    tag: 'Premium',
  },
];

export default function MarketingPlatformPage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50">
      <MarketingNav />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 mb-6">
            <Ship className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-medium text-sky-400/70">Platform Overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-sky-50 mb-4">
            Built for fleet command, not fleet tracking
          </h1>
          <p className="text-sky-300/50 text-[15px] max-w-2xl mx-auto leading-relaxed">
            Vessels is a maritime operations platform designed for the full stack of fleet
            decision-making — from exception triage to voyage economics to compliance.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          {modules.map((m) => (
            <div key={m.title} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <m.icon className="w-5 h-5 text-sky-400" />
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    m.tag === 'Core'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                  }`}
                >
                  {m.tag}
                </span>
              </div>
              <h3 className="text-[15px] font-semibold text-sky-100 mb-2">{m.title}</h3>
              <p className="text-sky-300/40 text-[13px] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center bg-[#0a1628]/60 border border-sky-500/10 rounded-2xl p-10">
          <h2 className="text-[20px] font-bold text-sky-100 mb-3">See the platform in context</h2>
          <p className="text-sky-300/40 text-[13px] mb-6">
            Request a private walkthrough configured for your fleet profile.
          </p>
          <Link href="/demo">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-sky-400 hover:bg-sky-300 text-[#060e1a] font-bold rounded-xl transition-all text-[13px]">
              Request a demo <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
