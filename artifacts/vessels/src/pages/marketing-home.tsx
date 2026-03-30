import { Link } from "wouter";
import { Ship, ChevronRight, Shield, BarChart3, AlertTriangle, Activity, MapPin, DollarSign, ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

const kpis = [
  { metric: "84%", label: "on-time arrival rate" },
  { metric: "$1.2M", label: "delay exposure mitigated" },
  { metric: "91%", label: "fleet utilization" },
  { metric: "3.2h", label: "avg exception resolution" },
];

const capabilities = [
  { icon: MapPin, title: "Fleet Tracking", desc: "Live AIS positions, route lines, and port data in a unified command view." },
  { icon: AlertTriangle, title: "Exception Center", desc: "Prioritized exceptions with business context and recommended responses." },
  { icon: DollarSign, title: "Voyage Economics", desc: "Revenue, cost, and margin per voyage — per charter, per route." },
  { icon: Shield, title: "Compliance", desc: "Sanctions screening, dark vessel detection, and regulatory compliance." },
  { icon: BarChart3, title: "Performance Analytics", desc: "Fleet utilization, delay frequency, and corridor-level profitability." },
  { icon: Activity, title: "Command Mode", desc: "Focused operational dashboard for time-sensitive decision-making." },
];

const useCases = [
  { role: "Fleet Executives", headline: "Strategic confidence, not status updates.", desc: "Portfolio-level margin visibility, exception exposure, and performance vs budget across active voyages." },
  { role: "Operations Teams", headline: "See what matters. Act before it escalates.", desc: "Real-time exception triage, vessel status, ETA deviation, and maintenance watch in one interface." },
  { role: "Commercial Teams", headline: "Voyage economics, not just positions.", desc: "Charter performance, delay cost impact, and route profitability comparison — per voyage." },
];

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50 overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 1200 600">
            <g stroke="rgba(56,189,248,0.8)" strokeWidth="0.5" fill="none">
              {[-60, -30, 0, 30, 60].map(lat => {
                const y = 300 - lat * 4;
                return <line key={lat} x1={0} y1={y} x2={1200} y2={y} strokeDasharray="4 6" />;
              })}
              {[-150, -90, -30, 30, 90, 150].map(lon => {
                const x = ((lon + 180) / 360) * 1200;
                return <line key={lon} x1={x} y1={0} x2={x} y2={600} strokeDasharray="4 6" />;
              })}
            </g>
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 mb-8">
            <Ship className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-medium text-sky-400/70 tracking-wide">Maritime Intelligence Platform</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-sky-50 leading-tight mb-6">
            Move from location awareness<br />
            <span className="text-sky-400">to operational command.</span>
          </h1>

          <p className="text-lg text-sky-300/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Built for fleet executives, operations teams, and commercial managers who need more than a vessel tracker — they need a command platform.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/demo">
              <button className="flex items-center gap-2 px-7 py-3.5 bg-sky-400 hover:bg-sky-300 text-[#060e1a] font-bold rounded-xl transition-all text-[14px]">
                Request a private demo <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-7 py-3.5 bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 text-sky-300 font-medium rounded-xl transition-all text-[14px]">
                Open dashboard <Activity className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Strip */}
      <section className="border-y border-sky-500/10 bg-[#0a1628]/50">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {kpis.map((k) => (
            <div key={k.label} className="text-center">
              <p className="font-display text-2xl font-bold text-sky-300 mb-1">{k.metric}</p>
              <p className="text-[12px] text-sky-400/40">{k.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">Capabilities</p>
          <h2 className="text-2xl md:text-3xl font-bold text-sky-50 mb-3">Every layer of fleet intelligence</h2>
          <p className="text-sky-300/40 text-[14px] max-w-xl mx-auto">From vessel positions to voyage economics — Vessels gives operations teams everything they need to act.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((c) => (
            <div key={c.title} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5">
              <c.icon className="w-5 h-5 text-sky-400 mb-3" />
              <h3 className="text-[14px] font-semibold text-sky-100 mb-1.5">{c.title}</h3>
              <p className="text-sky-300/40 text-[12.5px] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/capabilities" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-sky-400 hover:text-sky-300 transition-colors">
            See all capabilities <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-sky-500/10 bg-[#0a1628]/40 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">Built for</p>
            <h2 className="text-2xl md:text-3xl font-bold text-sky-50">Who uses Vessels</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((u) => (
              <div key={u.role} className="border border-sky-500/10 rounded-xl p-6">
                <p className="text-[10px] font-semibold text-sky-400/60 uppercase tracking-[0.12em] mb-2">{u.role}</p>
                <h3 className="text-[15px] font-bold text-sky-100 mb-2">{u.headline}</h3>
                <p className="text-sky-300/40 text-[12.5px] leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-sky-50 mb-4">Ready to see Vessels in action?</h2>
        <p className="text-sky-300/40 text-[14px] mb-8">Request a private demo tailored to your fleet size and operational profile.</p>
        <Link href="/demo">
          <button className="px-8 py-4 bg-sky-400 hover:bg-sky-300 text-[#060e1a] font-bold rounded-xl transition-all text-[14px]">
            Request a private demo
          </button>
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
