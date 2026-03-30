import { Link } from "wouter";
import { Ship, Navigation, AlertTriangle, Wrench, DollarSign, Activity, ChevronRight, MapPin, Clock, Radio, Shield, BarChart3, TrendingUp, Users, Anchor } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const differentiators = [
  { step: 1, label: "Location", desc: "Know where your vessels are", capability: "AIS Position Tracking", color: "text-sky-400/40" },
  { step: 2, label: "Status", desc: "Know what they're doing", capability: "Fleet Status Layer", color: "text-sky-400/50" },
  { step: 3, label: "Route", desc: "Know where they're going", capability: "Voyage Route Intelligence", color: "text-sky-400/60" },
  { step: 4, label: "Exceptions", desc: "Know what's at risk right now", capability: "Exception Detection & Triage", color: "text-amber-400/70" },
  { step: 5, label: "Readiness", desc: "Know what can be deployed", capability: "Maintenance Readiness Engine", color: "text-orange-400/80" },
  { step: 6, label: "Economics", desc: "Know what each voyage earns", capability: "Voyage P&L & Charter Performance", color: "text-emerald-400/90" },
  { step: 7, label: "Action", desc: "Know what needs to happen now", capability: "Command Mode — Decisive Operations", color: "text-emerald-400" },
];

const features = [
  {
    icon: MapPin,
    title: "Live Fleet Map",
    desc: "Vessel positions, route lines, port locations, and alert indicators in a single premium oceanic command view. Not a generic map widget.",
    color: "text-sky-400"
  },
  {
    icon: AlertTriangle,
    title: "Exceptions Center",
    desc: "Prioritized exception queue with full operational context — what happened, why it matters, recommended response, and business consequence.",
    color: "text-orange-400"
  },
  {
    icon: DollarSign,
    title: "Voyage Economics",
    desc: "Estimated voyage revenue, operating cost, margin estimate, fuel and delay impact — per voyage, per charter, per route.",
    color: "text-emerald-400"
  },
  {
    icon: Wrench,
    title: "Maintenance Readiness",
    desc: "Asset health scores, service risk indicators, maintenance backlog, and readiness states across your entire fleet.",
    color: "text-amber-400"
  },
  {
    icon: Activity,
    title: "Command Mode",
    desc: "Focused operational dashboard with map prominence, live alert stream, fleet status rail, and quick vessel switching.",
    color: "text-violet-400"
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    desc: "Utilization by vessel, on-time arrival trends, route profitability, delay frequency, and corridor analysis.",
    color: "text-sky-400"
  },
];

const audiences = [
  {
    role: "Fleet Executives",
    headline: "Strategic confidence, not status updates.",
    points: ["Fleet utilization and TCE at a glance", "Voyage P&L and margin by charter type", "Exception exposure and business consequence", "Performance vs budget across active voyages"],
    icon: TrendingUp
  },
  {
    role: "Operations Teams",
    headline: "See the exceptions that matter. Act before they escalate.",
    points: ["Prioritized exception queue by severity", "Vessel status and ETA deviation in real time", "Maintenance watch and readiness state", "Alert stream with time-sensitive events"],
    icon: Radio
  },
  {
    role: "Commercial Teams",
    headline: "Voyage economics, not just vessel positions.",
    points: ["Revenue, cost, and margin per voyage", "Charter performance vs budget", "Delay exposure and port cost impact", "Route profitability comparison"],
    icon: DollarSign
  },
];

const outcomes = [
  { metric: "84%", label: "on-time arrival rate across active fleet", trend: "↑ vs 79% prior quarter" },
  { metric: "$1.2M", label: "delay exposure identified and mitigated", trend: "Fleet-wide Q1 2026" },
  { metric: "91%", label: "average fleet utilization excl. maintenance", trend: "5 of 9 active vessels" },
  { metric: "3.2h", label: "average time to exception resolution", trend: "vs 11h unmanaged baseline" },
];

export default function VesselsLandingPage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50 overflow-x-hidden">
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-3xl" />
          <div className="absolute top-2/3 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-2xl" />
          <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 1200 600">
            <g stroke="rgba(56,189,248,0.8)" strokeWidth="0.5" fill="none">
              {[-60, -30, 0, 30, 60].map(lat => {
                const y = (lat === 0 ? 300 : 300 - lat * 4);
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
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Ship className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-sm font-medium text-sky-400/60">Vessels Maritime Intelligence</span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold text-sky-50 leading-tight mb-6">
            Move from location awareness<br />
            <span className="text-sky-400">to operational command.</span>
          </h1>

          <p className="text-lg text-sky-300/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            See the vessels that matter, the routes under pressure, and the decisions that cannot wait. Vessels is a fleet command platform built for operational teams who need more than a map.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/fleet">
              <button className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-[#060e1a] font-semibold rounded-xl transition-all text-sm">
                Open Fleet Command <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/command">
              <button className="flex items-center gap-2 px-6 py-3 bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 text-sky-300 font-medium rounded-xl transition-all text-sm">
                Enter Command Mode <Activity className="w-4 h-4" />
              </button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: Ship, label: "10 vessels tracked" },
              { icon: Navigation, label: "9 active voyages" },
              { icon: AlertTriangle, label: "8 exceptions managed" },
              { icon: Anchor, label: "7 corridors monitored" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-xs text-sky-400/40">
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-sky-400/40 uppercase tracking-widest mb-3">From Tracking to Command</p>
          <h2 className="font-display text-3xl font-bold text-sky-50">Seven layers of operational intelligence.</h2>
          <p className="text-sky-400/50 mt-3 max-w-xl mx-auto text-sm">Most fleet tools stop at position. Vessels is built for the complete operational picture — from where a vessel is, to what it earns, to what needs to happen now.</p>
        </div>

        <div className="relative">
          <div className="absolute left-8 top-4 bottom-4 w-px bg-gradient-to-b from-sky-500/5 via-sky-500/20 to-emerald-500/30" />
          <div className="space-y-4 ml-4">
            {differentiators.map((d, i) => (
              <div key={d.step} className="flex items-center gap-6 group">
                <div className="w-8 h-8 rounded-full bg-[#0a1628] border border-sky-500/10 flex items-center justify-center shrink-0 z-10">
                  <span className="text-[10px] font-bold text-sky-400/40">{d.step}</span>
                </div>
                <div className="flex-1 flex items-center gap-6 bg-[#0a1628]/60 border border-sky-500/5 rounded-xl px-4 py-3 hover:border-sky-500/15 transition-all">
                  <div className="w-24 shrink-0">
                    <p className={cn("text-sm font-bold", d.color)}>{d.label}</p>
                  </div>
                  <p className="text-[11px] text-sky-400/40 flex-1">{d.desc}</p>
                  <p className="text-[11px] text-sky-300/50 font-medium shrink-0">{d.capability}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-[#040c18] border-y border-sky-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono text-sky-400/40 uppercase tracking-widest mb-3">Platform Capabilities</p>
            <h2 className="font-display text-3xl font-bold text-sky-50">Built for operational decisions.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(feature => (
              <div key={feature.title} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-5 hover:border-sky-500/20 transition-all">
                <feature.icon className={cn("w-5 h-5 mb-3", feature.color)} />
                <h3 className="text-sm font-bold text-sky-100 mb-2">{feature.title}</h3>
                <p className="text-[11px] text-sky-400/50 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-sky-400/40 uppercase tracking-widest mb-3">Designed for Your Role</p>
          <h2 className="font-display text-3xl font-bold text-sky-50">One platform. Three operational perspectives.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {audiences.map(aud => (
            <div key={aud.role} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-6">
              <aud.icon className="w-5 h-5 text-sky-400 mb-3" />
              <p className="text-[10px] font-mono text-sky-400/40 uppercase tracking-wider mb-1">{aud.role}</p>
              <h3 className="text-sm font-bold text-sky-100 mb-3">{aud.headline}</h3>
              <ul className="space-y-2">
                {aud.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-sky-400/50">
                    <span className="w-1 h-1 rounded-full bg-sky-400/40 mt-1.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 bg-[#040c18] border-y border-sky-500/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-mono text-sky-400/40 uppercase tracking-widest mb-3">Operational Outcomes</p>
          <h2 className="font-display text-3xl font-bold text-sky-50 mb-10">What operational command delivers.</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {outcomes.map(o => (
              <div key={o.metric} className="text-center">
                <p className="text-3xl font-bold font-display text-sky-300 mb-1">{o.metric}</p>
                <p className="text-[11px] text-sky-400/50 leading-relaxed mb-1">{o.label}</p>
                <p className="text-[9px] font-mono text-sky-400/30">{o.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] font-mono text-sky-400/40 uppercase tracking-widest mb-3">Platform Walkthrough</p>
          <h2 className="font-display text-3xl font-bold text-sky-50 mb-4">Navigate the command center.</h2>
          <p className="text-sky-400/40 text-sm max-w-xl mx-auto">Each section of the platform is designed for a specific operational need. Start with the overview or go directly to what matters to your role.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { href: "/platform", label: "Command Overview", desc: "Fleet KPIs, role-aware dashboard, and voyage P&L snapshot.", icon: BarChart3, tag: "Start here" },
            { href: "/fleet", label: "Fleet Map", desc: "Live vessel positions, route lines, filters, and selected-vessel detail panel.", icon: MapPin, tag: "Operational" },
            { href: "/exceptions", label: "Exceptions Center", desc: "Prioritized exception queue with full context and recommended response.", icon: AlertTriangle, tag: "Action required" },
            { href: "/economics", label: "Voyage Economics", desc: "Revenue, cost, margin, and charter performance per active voyage.", icon: DollarSign, tag: "Commercial" },
            { href: "/maintenance", label: "Maintenance Readiness", desc: "Asset health, service risk, readiness scores, and maintenance watchlist.", icon: Wrench, tag: "Technical" },
            { href: "/command", label: "Command Mode", desc: "Focused operational view with map, alert stream, and vessel detail rail.", icon: Activity, tag: "Operations" },
            { href: "/analytics", label: "Performance Analytics", desc: "Utilization, on-time rates, TCE trends, and corridor analysis.", icon: TrendingUp, tag: "Analytics" },
            { href: "/vessels-list", label: "Vessel Roster", desc: "Full vessel list with status, readiness, and quick navigation to detail.", icon: Ship, tag: "Reference" },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-start gap-4 bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 hover:border-sky-500/25 hover:bg-sky-500/5 cursor-pointer transition-all group">
                <item.icon className="w-5 h-5 text-sky-400/50 shrink-0 mt-0.5 group-hover:text-sky-400 transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-sky-100">{item.label}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400/50 border border-sky-500/10">{item.tag}</span>
                  </div>
                  <p className="text-[11px] text-sky-400/40 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-400/20 shrink-0 mt-0.5 group-hover:text-sky-400/60 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 bg-gradient-to-b from-[#040c18] to-[#060e1a] border-t border-sky-500/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-sky-50 mb-4">Ready to see your fleet differently?</h2>
          <p className="text-sky-400/50 mb-8 text-sm leading-relaxed">
            Vessels is a maritime command platform for operators who need more than a position feed. Move from tracking to command — see exceptions early, understand voyage economics, and act before disruptions escalate.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/fleet">
              <button className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-[#060e1a] font-semibold rounded-xl transition-all text-sm">
                Open Fleet Command <Ship className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/command">
              <button className="flex items-center gap-2 px-6 py-3 border border-sky-500/20 hover:border-sky-500/40 text-sky-300 font-medium rounded-xl transition-all text-sm">
                Enter Command Mode <Activity className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <p className="mt-6 text-[10px] text-sky-400/30 font-mono">Contact: maritime@vessels.io · Request a fleet demo</p>
        </div>
      </section>
    </div>
  );
}
