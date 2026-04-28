import { Link } from "wouter";
import { Anchor, Shield, Eye, FileCheck2, Lock, ArrowRight, Radio, Cloud, } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOVERNANCE_CONTROLS = [
  {
    icon: Eye,
    title: "Open-source maritime data only",
    body: "SEXTANT ingests from public maritime APIs — AIS transponder feeds, NWS weather data, BTS port statistics, NOAA charts. No classified, proprietary, or commercially restricted sources without explicit provenance.",
  },
  {
    icon: Radio,
    title: "Real-time signal attribution",
    body: "Every vessel position, weather alert, and port metric traces to its originating feed, reception timestamp, and processing pipeline. Signal freshness and confidence are visible on every data point.",
  },
  {
    icon: Lock,
    title: "Fleet data isolation",
    body: "Fleet configurations, vessel assignments, and operational data are scoped by organization. Cross-fleet data access is impossible at the query layer. Role-based visibility for crew, ops, and management.",
  },
  {
    icon: FileCheck2,
    title: "Operational decision logging",
    body: "Every route recommendation, weather reroute, and port scheduling decision is logged with actor identity, decision rationale, and the data state that informed it.",
  },
];

const DATA_SOURCES = [
  { name: "AIS Transponder Feeds", desc: "Automatic Identification System vessel position, heading, and status data from maritime transponder networks." },
  { name: "NWS Marine Forecasts", desc: "National Weather Service marine zone forecasts, storm warnings, and sea state predictions." },
  { name: "NOAA Nautical Charts", desc: "Chart data including navigational hazards, depth contours, and port infrastructure." },
  { name: "BTS Port Statistics", desc: "Bureau of Transportation Statistics port throughput, vessel calls, and cargo volume data." },
  { name: "Coast Guard Notices", desc: "USCG local notices to mariners, safety zones, and regulatory updates." },
  { name: "Tide & Current Data", desc: "NOAA CO-OPS tidal predictions and real-time current observations for U.S. coastal waters." },
];

export default function SolutionsVesselsTrustPage() {
  const __pageMeta = usePageMeta({
    title: "SEXTANT Trust & Data Governance · SZL Holdings",
    description: "How SEXTANT sources, processes, and governs maritime intelligence with open-source data, signal attribution, and fleet data isolation.",
    canonical: "https://szlholdings.com/solutions/vessels/trust",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen" style={{ background: "#080c14" }}>
        <SiteNav />
  
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <Anchor className="w-5 h-5 text-[#4a90b8]" />
            <span className="text-[11px] font-medium text-[#4a90b8] uppercase tracking-widest">SEXTANT · Trust</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
            Open-source data. Traceable signals.
          </h1>
          <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
            SEXTANT provides maritime operational intelligence built on public maritime data feeds with full signal attribution. Every position, forecast, and recommendation is traceable to its source and processing pipeline.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/solutions/vessels">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/20 transition-colors cursor-pointer">
                Product Overview <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/trust">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer">
                Platform Trust Center
              </span>
            </Link>
          </div>
        </section>
  
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Governance Controls</h2>
          <p className="text-sm text-slate-400 max-w-2xl mb-8">
            How SEXTANT ensures data provenance, fleet isolation, and operational accountability across maritime intelligence.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GOVERNANCE_CONTROLS.map((c) => (
              <div key={c.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <c.icon className="w-5 h-5 text-[#4a90b8]/70" />
                  <h3 className="text-sm font-semibold text-slate-200">{c.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>
  
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Verified Data Sources</h2>
          <p className="text-sm text-slate-400 max-w-2xl mb-8">
            SEXTANT ingests from authoritative public maritime data feeds. Every data point includes source attribution and signal freshness metadata.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DATA_SOURCES.map((s) => (
              <div key={s.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-4 h-4 text-[#4a90b8]/60" />
                  <span className="text-sm font-semibold text-slate-200">{s.name}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
  
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <Shield className="w-8 h-8 text-[#4a90b8] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-100 mb-2">Operational accountability</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
              Every routing decision, weather assessment, and fleet operation is logged with full attribution. Generate safety and compliance reports for regulatory review at any time.
            </p>
            <Link href="/solutions/vessels">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20 hover:bg-[#4a90b8]/20 transition-colors cursor-pointer">
                Explore SEXTANT <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </section>
  
        <SiteFooter />
      </div>
        </>
  );
}
