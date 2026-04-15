import { useState } from "react";
import { Navigation, Wind, ShieldAlert, Anchor, DollarSign, Leaf, BarChart3, ChevronRight, RefreshCw, CheckCircle2, AlertTriangle, Zap, Clock } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

const ROUTES = [
  {
    id: "R-001",
    name: "Rotterdam → Singapore",
    vessel: "Pacific Navigator",
    distance: 10_820,
    duration: "18.4 days",
    fuelBurn: 1_247,
    fuelCost: 748_200,
    ciiImpact: "A",
    piracyRisk: "medium",
    weatherRisk: "low",
    portCongestion: "moderate",
    co2Tonnes: 3_869,
    recommended: true,
    waypoints: ["Dover Strait", "Suez Canal", "Bab-el-Mandeb", "Malacca Strait"],
    savings: { fuel: 43_200, time: 0.4, co2: 180 },
    factors: { weather: 88, piracy: 72, emissions: 91, congestion: 65, fuel: 84 },
  },
  {
    id: "R-002",
    name: "Rotterdam → Singapore (Alt: Cape of Good Hope)",
    vessel: "Pacific Navigator",
    distance: 14_680,
    duration: "24.8 days",
    fuelBurn: 1_693,
    fuelCost: 1_015_800,
    ciiImpact: "B",
    piracyRisk: "low",
    weatherRisk: "medium",
    portCongestion: "low",
    co2Tonnes: 5_248,
    recommended: false,
    waypoints: ["English Channel", "Cape Verde", "Cape of Good Hope", "Lombok Strait"],
    savings: null,
    factors: { weather: 64, piracy: 95, emissions: 62, congestion: 88, fuel: 52 },
  },
  {
    id: "R-003",
    name: "Shanghai → Los Angeles (Great Circle)",
    vessel: "Meridian Bulk",
    distance: 6_480,
    duration: "11.2 days",
    fuelBurn: 892,
    fuelCost: 535_200,
    ciiImpact: "A+",
    piracyRisk: "low",
    weatherRisk: "high",
    portCongestion: "high",
    co2Tonnes: 2_765,
    recommended: false,
    waypoints: ["East China Sea", "Kuroshio Current", "North Pacific", "SECA Zone"],
    savings: null,
    factors: { weather: 41, piracy: 98, emissions: 95, congestion: 38, fuel: 91 },
  },
];

const FACTORS = [
  { key: "weather", label: "Weather Safety", icon: Wind, color: "sky" },
  { key: "piracy", label: "Piracy Risk Score", icon: ShieldAlert, color: "red" },
  { key: "emissions", label: "Emissions Rating", icon: Leaf, color: "emerald" },
  { key: "congestion", label: "Port Congestion", icon: Anchor, color: "amber" },
  { key: "fuel", label: "Fuel Efficiency", icon: DollarSign, color: "violet" },
];

const PIRACY_ZONES = [
  { zone: "Gulf of Aden", level: "high", vessels: 3, lastIncident: "Apr 12, 2026" },
  { zone: "Gulf of Guinea", level: "critical", vessels: 1, lastIncident: "Apr 14, 2026" },
  { zone: "Strait of Malacca", level: "medium", vessels: 7, lastIncident: "Mar 28, 2026" },
  { zone: "Red Sea", level: "critical", vessels: 5, lastIncident: "Apr 15, 2026" },
  { zone: "Indian Ocean", level: "low", vessels: 12, lastIncident: "Jan 08, 2026" },
];

const ECA_ZONES = [
  { zone: "North Sea ECA", type: "SOx 0.1%", status: "active", vesselCount: 4 },
  { zone: "Baltic Sea ECA", type: "SOx 0.1%", status: "active", vesselCount: 2 },
  { zone: "California CARB", type: "DPF Required", status: "monitoring", vesselCount: 1 },
  { zone: "North American ECA", type: "NOx Tier III", status: "active", vesselCount: 3 },
];

function ScorePill({ score, color }: { score: number; color: string }) {
  const colorMap: Record<string, string> = { sky: "bg-sky-500/10 text-sky-400 border-sky-500/20", red: "bg-red-500/10 text-red-400 border-red-500/20", emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", amber: "bg-amber-500/10 text-amber-400 border-amber-500/20", violet: "bg-violet-500/10 text-violet-400 border-violet-500/20" };
  return <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border", colorMap[color])}>{score}</span>;
}

function FactorBar({ label, score, color, icon: Icon }: { label: string; score: number; color: string; icon: React.ElementType }) {
  const colorMap: Record<string, string> = { sky: "from-sky-500/60 to-sky-400/20", red: "from-red-500/60 to-red-400/20", emerald: "from-emerald-500/60 to-emerald-400/20", amber: "from-amber-500/60 to-amber-400/20", violet: "from-violet-500/60 to-violet-400/20" };
  const iconColorMap: Record<string, string> = { sky: "text-sky-400", red: "text-red-400", emerald: "text-emerald-400", amber: "text-amber-400", violet: "text-violet-400" };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("w-3 h-3", iconColorMap[color])} />
          <span className="text-[10px] text-sky-400/50">{label}</span>
        </div>
        <span className="text-[10px] font-mono text-sky-300">{score}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full bg-gradient-to-r", colorMap[color])} style={{ width: `${score}%`, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

const riskColor: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  moderate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const ciiColor: Record<string, string> = {
  "A+": "text-emerald-400", A: "text-emerald-400", B: "text-sky-400", C: "text-amber-400", D: "text-orange-400", E: "text-red-400",
};

export default function AutonomousRoutingPage() {
  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const [recalculating, setRecalculating] = useState(false);

  const handleRecalc = () => {
    setRecalculating(true);
    setTimeout(() => setRecalculating(false), 2200);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Navigation className="w-4 h-4 text-sky-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">Autonomous Routing Intelligence</h1>
            <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5">AI-OPTIMIZED</Badge>
          </div>
          <p className="text-xs text-sky-400/40">Multi-factor route optimization — weather, piracy, emissions, port congestion & fuel arbitrage</p>
        </div>
        <button onClick={handleRecalc} disabled={recalculating} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5 text-sky-400/60 hover:text-sky-300 transition-colors disabled:opacity-50">
          <RefreshCw className={cn("w-3.5 h-3.5", recalculating && "animate-spin")} />
          {recalculating ? "Recalculating…" : "Recalculate Routes"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="space-y-3">
            {ROUTES.map(route => (
              <button key={route.id} onClick={() => setSelectedRoute(route)} className={cn("w-full text-left bg-[#0a1628]/80 border rounded-xl p-4 transition-all hover:border-sky-500/20", selectedRoute.id === route.id ? "border-sky-500/30 shadow-sky-500/5 shadow-lg" : "border-sky-500/10")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-sky-100">{route.name}</p>
                      {route.recommended && <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5">RECOMMENDED</Badge>}
                    </div>
                    <p className="text-[10px] text-sky-400/40 mb-2">{route.vessel} · {route.distance.toLocaleString()} nm · {route.duration}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {route.waypoints.map(wp => <span key={wp} className="text-[9px] text-sky-400/40 px-2 py-0.5 bg-sky-500/5 rounded border border-sky-500/10">{wp}</span>)}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <div className="flex items-center gap-1"><Leaf className="w-3 h-3 text-emerald-400" /><span className="text-[10px] text-sky-300 font-mono">{route.co2Tonnes.toLocaleString()} t CO₂</span></div>
                      <div className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-violet-400" /><span className="text-[10px] text-sky-300 font-mono">${(route.fuelCost / 1000).toFixed(0)}K fuel</span></div>
                      <div className="flex items-center gap-1"><BarChart3 className="w-3 h-3 text-sky-400" /><span className="text-[10px] font-mono text-sky-300">CII: <span className={ciiColor[route.ciiImpact] ?? ""}>{route.ciiImpact}</span></span></div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <Badge variant="outline" className={cn("text-[9px]", riskColor[route.piracyRisk])}>Piracy: {route.piracyRisk}</Badge>
                    <div><Badge variant="outline" className={cn("text-[9px]", riskColor[route.weatherRisk])}>Weather: {route.weatherRisk}</Badge></div>
                    <div><Badge variant="outline" className={cn("text-[9px]", riskColor[route.portCongestion])}>Port: {route.portCongestion}</Badge></div>
                  </div>
                </div>
                {route.savings && (
                  <div className="mt-3 pt-3 border-t border-sky-500/10 flex gap-4">
                    <div className="flex items-center gap-1 text-emerald-400 text-[10px]"><CheckCircle2 className="w-3 h-3" />Saves ${(route.savings.fuel / 1000).toFixed(0)}K vs alt route</div>
                    <div className="flex items-center gap-1 text-emerald-400 text-[10px]"><Leaf className="w-3 h-3" />{route.savings.co2}t CO₂ avoided</div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-red-400" />Active Piracy Zones</p>
              <div className="space-y-2">
                {PIRACY_ZONES.map(z => (
                  <div key={z.zone} className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-sky-200">{z.zone}</p>
                      <p className="text-[9px] text-sky-400/30">Last: {z.lastIncident}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={cn("text-[9px]", riskColor[z.level])}>{z.level}</Badge>
                      <p className="text-[9px] text-sky-400/30 mt-0.5">{z.vessels} vessel{z.vessels !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-emerald-400" />ECA Compliance Zones</p>
              <div className="space-y-2">
                {ECA_ZONES.map(z => (
                  <div key={z.zone} className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-sky-200">{z.zone}</p>
                      <p className="text-[9px] text-sky-400/30">{z.type}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={cn("text-[9px]", z.status === "active" ? "text-emerald-400 border-emerald-500/20" : "text-amber-400 border-amber-500/20")}>{z.status}</Badge>
                      <p className="text-[9px] text-sky-400/30 mt-0.5">{z.vesselCount} vessels</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0a1628]/80 border border-sky-500/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-200 mb-4 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-sky-400" />Selected Route Analysis</p>
            <p className="text-sm font-semibold text-sky-100 mb-1">{selectedRoute.name}</p>
            <p className="text-[10px] text-sky-400/40 mb-4">{selectedRoute.vessel}</p>
            <div className="space-y-3">
              {FACTORS.map(f => (
                <FactorBar key={f.key} label={f.label} score={selectedRoute.factors[f.key as keyof typeof selectedRoute.factors]} color={f.color} icon={f.icon} />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-sky-500/10 grid grid-cols-2 gap-3">
              {[
                { label: "Distance", val: `${selectedRoute.distance.toLocaleString()} nm` },
                { label: "Duration", val: selectedRoute.duration },
                { label: "Fuel Burn", val: `${selectedRoute.fuelBurn.toLocaleString()} t` },
                { label: "Fuel Cost", val: `$${(selectedRoute.fuelCost / 1000).toFixed(0)}K` },
                { label: "CO₂", val: `${selectedRoute.co2Tonnes.toLocaleString()} t` },
                { label: "CII Rating", val: selectedRoute.ciiImpact },
              ].map(m => (
                <div key={m.label} className="bg-sky-500/5 rounded-lg p-2">
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{m.label}</p>
                  <p className="text-xs font-mono text-sky-200 mt-0.5">{m.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" />Dynamic Recalculation Triggers</p>
            <div className="space-y-2">
              {[
                { trigger: "Weather system update", freq: "Every 6h", active: true },
                { trigger: "Port congestion feed", freq: "Every 2h", active: true },
                { trigger: "Bunker price change >2%", freq: "Continuous", active: true },
                { trigger: "Piracy alert broadcast", freq: "Real-time", active: true },
                { trigger: "CII threshold breach", freq: "Daily", active: false },
              ].map(t => (
                <div key={t.trigger} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", t.active ? "bg-emerald-400 animate-pulse" : "bg-sky-500/20")} />
                    <span className="text-[10px] text-sky-300/70">{t.trigger}</span>
                  </div>
                  <span className="text-[9px] font-mono text-sky-400/40">{t.freq}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-400 mb-2">Fleet Routing Savings (YTD)</p>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-[10px] text-sky-400/50">Fuel saved</span><span className="text-[10px] font-mono text-emerald-400">$2.4M</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-sky-400/50">CO₂ avoided</span><span className="text-[10px] font-mono text-emerald-400">4,820 t</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-sky-400/50">Transit days saved</span><span className="text-[10px] font-mono text-emerald-400">38 days</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-sky-400/50">Piracy diversions</span><span className="text-[10px] font-mono text-emerald-400">7 avoided</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
