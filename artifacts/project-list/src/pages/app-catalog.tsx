import { useState } from "react";
import { Search, Grid, List, Shield, Brain, Building, Ship, Zap, Palette, Activity, Globe, BarChart3, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LENS_ICONS: Record<string, string> = {
  signal: "◎",
  impact: "$",
  anticipation: "◈",
  topology: "⬡",
  posture: "◆",
  velocity: "▲",
};

const apps = [
  {
    id: "firestorm",
    name: "Firestorm",
    subtitle: "Security Operations Center",
    category: "security",
    status: "live",
    icon: Shield,
    color: "text-red-400 bg-red-400/10",
    description: "Enterprise-grade SOC with threat detection, MITRE ATT&CK mapping, incident response, and compliance monitoring",
    features: ["SOC Dashboard", "Threat Intel", "MITRE ATT&CK", "Risk Scoring"],
    postureScore: 87,
    postureLabel: "Security Posture Score",
    topSignal: "Active lateral movement — blast radius: critical",
    velocityUp: true,
    lensHighlight: { posture: 87, signal: 91, impact: 84, anticipation: 82, topology: 79, velocity: 85 },
  },
  {
    id: "inca",
    name: "INCA",
    subtitle: "AI Research Command Center",
    category: "ai",
    status: "live",
    icon: Brain,
    color: "text-violet-400 bg-violet-400/10",
    description: "AI/ML research platform with experiment tracking, model registry, convergence prediction, and compute cost intelligence",
    features: ["Experiments", "Model Registry", "Predictions", "Compute Cost"],
    postureScore: 83,
    postureLabel: "Research Pipeline Health",
    topSignal: "Training run diverging — A100 cluster at 94%",
    velocityUp: true,
    lensHighlight: { posture: 83, signal: 88, impact: 79, anticipation: 85, topology: 76, velocity: 82 },
  },
  {
    id: "terra",
    name: "Terra",
    subtitle: "Real Estate Intelligence",
    category: "intelligence",
    status: "live",
    icon: Building,
    color: "text-emerald-400 bg-emerald-400/10",
    description: "Real estate analytics with property intelligence, market trend forecasting, portfolio health scoring, and deal pipeline velocity",
    features: ["Property Intel", "Market Trends", "Portfolio", "Deal Pipeline"],
    postureScore: 90,
    postureLabel: "Portfolio Health Score",
    topSignal: "Market shift detected — 3 properties in affected zone",
    velocityUp: true,
    lensHighlight: { posture: 90, signal: 86, impact: 88, anticipation: 91, topology: 82, velocity: 85 },
  },
  {
    id: "vessels",
    name: "Vessels",
    subtitle: "Maritime Intelligence",
    category: "intelligence",
    status: "live",
    icon: Ship,
    color: "text-cyan-400 bg-cyan-400/10",
    description: "Maritime operations platform with fleet readiness scoring, voyage prediction, ETA accuracy, and cargo value-at-risk monitoring",
    features: ["Fleet Readiness", "Port Analytics", "Route Prediction", "Risk Assessment"],
    postureScore: 85,
    postureLabel: "Fleet Readiness Score",
    topSignal: "High-value cargo vessel off-route — demurrage risk flagged",
    velocityUp: false,
    lensHighlight: { posture: 85, signal: 89, impact: 83, anticipation: 90, topology: 81, velocity: 78 },
  },
  {
    id: "lyte-command-center",
    name: "Lyte",
    subtitle: "Operations Command Center",
    category: "operations",
    status: "live",
    icon: Zap,
    color: "text-blue-400 bg-blue-400/10",
    description: "Business operations command center with cross-service signal correlation, incident prediction, SLA cost tracking, and readiness scoring",
    features: ["Signal Correlation", "Incident Predict", "SLA Cost", "Playbooks"],
    postureScore: 88,
    postureLabel: "Operational Readiness Score",
    topSignal: "Service degradation — SLA breach imminent",
    velocityUp: true,
    lensHighlight: { posture: 88, signal: 92, impact: 85, anticipation: 87, topology: 83, velocity: 90 },
  },
  {
    id: "dreamscape",
    name: "Dreamscape",
    subtitle: "Creative Engine",
    category: "creative",
    status: "live",
    icon: Palette,
    color: "text-pink-400 bg-pink-400/10",
    description: "Content creation and campaign management with deadline risk scoring, missed-window cost exposure, and content production velocity tracking",
    features: ["Campaign Health", "Deadline Risk", "Content Calendar", "Brand Posture"],
    postureScore: 81,
    postureLabel: "Creative Pipeline Health",
    topSignal: "Campaign deadline at risk — 72h to launch",
    velocityUp: true,
    lensHighlight: { posture: 81, signal: 84, impact: 79, anticipation: 83, topology: 77, velocity: 86 },
  },
  {
    id: "msp",
    name: "MSP Command Center",
    subtitle: "Managed Service Operations",
    category: "operations",
    status: "live",
    icon: Activity,
    color: "text-amber-400 bg-amber-400/10",
    description: "MSP platform with MRR-ranked client health alerts, device failure prediction, NOC health scoring, and SLA breach cost exposure",
    features: ["NOC Health", "MRR at Risk", "Device Predict", "SLA Tracking"],
    postureScore: 86,
    postureLabel: "NOC Health Score",
    topSignal: "Client SLA breach — MRR at risk: $47K",
    velocityUp: true,
    lensHighlight: { posture: 86, signal: 90, impact: 84, anticipation: 88, topology: 80, velocity: 83 },
  },
  {
    id: "readiness-report",
    name: "Readiness Report",
    subtitle: "Compliance Intelligence",
    category: "compliance",
    status: "live",
    icon: FileText,
    color: "text-teal-400 bg-teal-400/10",
    description: "Compliance readiness platform with gap-to-deadline ranking, fine exposure scoring, drift forecasting, and gap closure velocity tracking",
    features: ["Compliance Score", "Fine Exposure", "Drift Forecast", "Gap Closure"],
    postureScore: 79,
    postureLabel: "Compliance Readiness Score",
    topSignal: "NIST CSF gap — audit deadline: 14 days",
    velocityUp: true,
    lensHighlight: { posture: 79, signal: 82, impact: 76, anticipation: 84, topology: 71, velocity: 80 },
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    subtitle: "Brand Consulting Intelligence",
    category: "consulting",
    status: "live",
    icon: Users,
    color: "text-rose-400 bg-rose-400/10",
    description: "Brand health platform with sentiment shift detection, brand equity valuation, competitive positioning forecasting, and brand lift velocity",
    features: ["Brand Health", "Sentiment Rank", "Equity Value", "Brand Lift"],
    postureScore: 84,
    postureLabel: "Brand Health Score",
    topSignal: "Sentiment shift detected — engagement dropping 12%",
    velocityUp: true,
    lensHighlight: { posture: 84, signal: 87, impact: 82, anticipation: 85, topology: 78, velocity: 83 },
  },
  {
    id: "admin",
    name: "Admin Panel",
    subtitle: "Meta Lens Control Plane",
    category: "platform",
    status: "live",
    icon: BarChart3,
    color: "text-slate-400 bg-slate-400/10",
    description: "Portfolio-wide lens aggregation across all 6 Lenses — portfolio posture, lens averages, real-time signal events, and infrastructure telemetry",
    features: ["Portfolio Lens", "Lens Aggregates", "Signal Feed", "Infrastructure"],
    postureScore: 88,
    postureLabel: "Portfolio Posture Score",
    topSignal: "Portfolio lens aggregate — all systems nominal",
    velocityUp: true,
    lensHighlight: { posture: 88, signal: 90, impact: 85, anticipation: 87, topology: 82, velocity: 89 },
  },
  {
    id: "szl-holdings",
    name: "SZL Holdings",
    subtitle: "Investment Ecosystem Hub",
    category: "platform",
    status: "live",
    icon: Globe,
    color: "text-indigo-400 bg-indigo-400/10",
    description: "Corporate portal built on The 6 Lenses investment philosophy — portfolio health, venture topology, capital velocity, and ecosystem posture",
    features: ["6 Lenses Thesis", "Portfolio Intel", "Venture Map", "Capital Velocity"],
    postureScore: 92,
    postureLabel: "Portfolio Health Score",
    topSignal: "Subsidiary signal — capital exposure flagged",
    velocityUp: true,
    lensHighlight: { posture: 92, signal: 88, impact: 91, anticipation: 86, topology: 90, velocity: 87 },
  },
];

const categories = ["all", "security", "ai", "intelligence", "operations", "compliance", "consulting", "creative", "platform"];

export function AppCatalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = apps.filter(a =>
    (category === "all" || a.category === category) &&
    (search === "" || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-foreground">App Catalog</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">6 Lenses Active</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">The SZL Holdings ecosystem — each application viewed through The 6 Lenses of Business Observability</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search apps..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                category === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}>{c}</button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-lg", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-lg", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(app => {
            const AppIcon = app.icon;
            return (
              <div key={app.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-all group">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", app.color)}>
                        <AppIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{app.name}</h3>
                        <p className="text-xs text-muted-foreground">{app.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black text-white">{app.postureScore}</div>
                      <div className="text-[8px] text-muted-foreground leading-none">{app.postureLabel.split(" ").slice(-2).join(" ")}</div>
                    </div>
                  </div>

                  <div className="mb-3 py-1.5 px-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-white/30 uppercase tracking-wider flex-shrink-0">◎ Top Signal</span>
                      <span className="text-xs text-white/60 truncate">{app.topSignal}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 mb-3">
                    {Object.entries(app.lensHighlight).map(([lens, score]) => {
                      const s = score as number;
                      const statusColor = s >= 80 ? "text-emerald-400 border-emerald-500/20" : s >= 60 ? "text-amber-400 border-amber-500/20" : "text-red-400 border-red-500/20";
                      return (
                        <div key={lens} className={`flex items-center gap-1 px-1.5 py-1 rounded border bg-white/[0.02] ${statusColor}`}>
                          <span className="text-[9px] opacity-60">{LENS_ICONS[lens]}</span>
                          <span className="text-[9px] text-white/30 capitalize">{lens.slice(0, 3)}</span>
                          <span className="text-[10px] font-bold ml-auto">{s}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{app.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {app.features.slice(0, 3).map(f => (
                        <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{f}</span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-emerald-400 flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> live
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(app => {
            const AppIcon = app.icon;
            return (
              <div key={app.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 transition-all">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", app.color)}>
                  <AppIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{app.name}</h3>
                    <span className="text-xs text-muted-foreground">{app.subtitle}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{app.topSignal}</p>
                </div>
                <div className="flex items-center gap-3">
                  {["signal", "posture", "velocity"].map(lens => {
                    const score = app.lensHighlight[lens as keyof typeof app.lensHighlight] as number;
                    const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400";
                    return (
                      <div key={lens} className="text-center">
                        <div className={`text-sm font-bold ${color}`}>{score}</div>
                        <div className="text-[8px] text-muted-foreground">{LENS_ICONS[lens]}</div>
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded bg-muted">{app.category}</span>
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> live
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-black text-xs">6</span>
          <h3 className="text-sm font-semibold text-white">The 6 Lenses of Business Observability</h3>
          <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">SZL Proprietary</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: "signal", desc: "What matters right now" },
            { id: "impact", desc: "The dollar sign" },
            { id: "anticipation", desc: "Know before it happens" },
            { id: "topology", desc: "Everything is connected" },
            { id: "posture", desc: "One authoritative score" },
            { id: "velocity", desc: "How fast are we improving?" },
          ].map(lens => (
            <div key={lens.id} className="text-center py-2 px-2 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="text-base font-bold text-white/60 mb-1">{LENS_ICONS[lens.id]}</div>
              <div className="text-[10px] font-semibold text-white/70 capitalize mb-0.5">{lens.id}</div>
              <div className="text-[9px] text-white/30">{lens.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
