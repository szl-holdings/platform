import { Scale, AlertTriangle, Clock, TrendingUp, Building2, MapPin, Shield, Activity, FileText, ShieldOff, ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useNyMatters, useNyHealth } from "../../hooks/use-ny-api";
import { NY_SIGNAL_FAMILIES } from "../../data/ny-data";

const MODULES = [
  { label: "NY Command Dashboard", href: "/ny/dashboard", icon: TrendingUp, desc: "10+ widgets: deadline watchlist, demand readiness, mediation windows, reserve tracker" },
  { label: "Deadline Watchlist", href: "/ny/watchlist", icon: AlertTriangle, desc: "Deadline breach risk queue with no-fault clock intelligence" },
  { label: "Clock & Deadline Monitor", href: "/ny/deadlines", icon: Clock, desc: "All NY-specific statutory clocks with breach detection" },
  { label: "No-Fault Intelligence", href: "/ny/no-fault", icon: FileText, desc: "No-fault claims, bill cycles, EUO/IMC verification requests, arbitration status" },
  { label: "Coverage & Disclaimer", href: "/ny/coverage", icon: ShieldOff, desc: "Disclaimer timeliness, coverage positions, denial patterns, appeal tracking" },
  { label: "Mediation Command", href: "/ny/mediation", icon: Activity, desc: "Mediation readiness, conversion probability, insurer behavior, session management" },
  { label: "Forecast Engine", href: "/ny/forecast", icon: TrendingUp, desc: "8 NY forecast types with drivers, confidence, weekly delta, and next-best-action" },
  { label: "Insurer Intel", href: "/ny/insurer-intel", icon: Building2, desc: "Insurer profiles, adjuster behavior, reserve patterns, communication cadence" },
  { label: "Venue / Part Intel", href: "/ny/venue-intel", icon: MapPin, desc: "County courts, parts, judge rules, ADR patterns, venue velocity scoring" },
  { label: "Copilot NY", href: "/ny/copilot", icon: Shield, desc: "Outlook/Teams/SharePoint-native workflow surfaces and connector definitions" },
  { label: "Trust & Governance", href: "/ny/trust", icon: Shield, desc: "AI review policy, approval requirements, privilege controls, audit model" },
];

const MATTER_TYPE_LABEL: Record<string, string> = {
  auto_injury: "Auto / NF",
  premises_liability: "Premises / BI",
  insurance_coverage: "Coverage Dispute",
};

export default function NyOverviewPage() {
  const { data: matters, isLoading: mattersLoading } = useNyMatters();
  const { data: health } = useNyHealth();

  const matterCount = matters?.length ?? 0;
  const avgHealth = matters && matters.length > 0
    ? Math.round(matters.reduce((s, m) => s + (m.healthScore ?? 0), 0) / matters.length)
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-[1300px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">PRISM Counsel — NY Insurance Observability</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">NEW YORK</span>
            {health?.status === "ok" && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-green-500/10 text-green-400 border border-green-500/20">LIVE</span>
            )}
          </div>
          <p className="text-xs text-slate-500">NY-specific signal model, clock intelligence, insurer/venue intel, and 8-type forecast engine</p>
        </div>
        <Link href="/ny/dashboard">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-[#d4a054]/10 border border-[#d4a054]/30 text-[#d4a054] hover:bg-[#d4a054]/20 transition-colors">
            Open Command Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "NY Active Matters", value: mattersLoading ? "—" : String(matterCount), sub: "Auto · Premises · Coverage", color: "#d4a054" },
          { label: "Avg Matter Health", value: mattersLoading ? "—" : String(avgHealth), sub: "Across NY active matters", color: avgHealth >= 65 ? "#4a90b8" : "#d4a054" },
          { label: "API Status", value: health?.status === "ok" ? "Online" : "—", sub: "Backend NY service", color: health?.status === "ok" ? "#4a90b8" : "#d4a054" },
          { label: "Signal Families", value: String(NY_SIGNAL_FAMILIES.length), sub: "NY-specific observability layers", color: "#d4a054" },
        ].map((kpi, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{kpi.label}</div>
            <div className="text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[10px] text-slate-500 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Active NY Matters</h2>
          {mattersLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading matters from API...
            </div>
          ) : matters && matters.length > 0 ? (
            <div className="space-y-2">
              {matters.map(m => (
                <div key={m.id} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-200 truncate mr-2">{m.title}</span>
                    <span className="text-[11px] font-mono" style={{ color: (m.healthScore ?? 0) >= 65 ? "#4a90b8" : "#d4a054" }}>{m.healthScore ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.matterType && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
                        {MATTER_TYPE_LABEL[m.matterType] ?? m.matterType}
                      </span>
                    )}
                    {m.jurisdiction && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.04] text-slate-400 border border-white/[0.04]">
                        {m.jurisdiction.split(",")[0]}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.04] text-slate-500 border border-white/[0.04]">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-4">No NY matters found. Use the seed endpoint to load demo data.</div>
          )}
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h2 className="text-sm font-semibold text-slate-200 mb-3">NY Signal Families</h2>
          <div className="space-y-2">
            {NY_SIGNAL_FAMILIES.map((f, i) => (
              <div key={i} className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                <div className="text-[11px] font-medium text-[#d4a054] mb-0.5">{f.label}</div>
                <div className="text-[10px] text-slate-500">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">NY Module Map</h2>
        <div className="grid grid-cols-3 gap-3">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <Link key={i} href={mod.href}>
                <div className="rounded-lg border border-white/[0.06] p-3 hover:border-[#d4a054]/30 transition-colors cursor-pointer group" style={{ background: "#0c1220" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-[#d4a054]" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-[#d4a054] transition-colors">{mod.label}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600 ml-auto" />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{mod.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
