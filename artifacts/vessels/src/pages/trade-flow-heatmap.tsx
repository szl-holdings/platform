import { useState } from "react";
import { useLocation } from "wouter";
import { fireBriefSignal } from "../lib/briefSignal";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { cn } from "@szl-holdings/shared-ui/utils";
import {
  BarChart3, TrendingUp, TrendingDown, Ship, AlertTriangle, Globe,
  Droplets, Fuel, Wheat, Box, Activity, Zap, Filter, ChevronRight,
  MapPin, ArrowRight, Eye
} from "lucide-react";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";

// Simple equirectangular helpers
function lonToX(lon: number, w: number) { return ((lon + 180) / 360) * w; }
function latToY(lat: number, h: number) { return ((90 - lat) / 180) * h; }

const WORLD_LAND_PATHS = [
  "M 148,48 L 162,44 L 178,42 L 192,44 L 198,52 L 196,62 L 202,68 L 208,78 L 198,90 L 188,98 L 178,104 L 168,112 L 158,118 L 148,126 L 142,118 L 136,110 L 128,102 L 122,92 L 120,82 L 126,72 L 132,62 L 138,54 Z",
  "M 178,140 L 188,136 L 196,142 L 200,154 L 202,168 L 198,182 L 192,194 L 182,202 L 172,206 L 162,200 L 158,188 L 160,174 L 162,160 L 168,148 Z",
  "M 290,42 L 304,38 L 318,40 L 326,48 L 320,56 L 310,60 L 300,56 L 292,50 Z",
  "M 296,88 L 312,82 L 326,84 L 334,96 L 336,112 L 332,128 L 324,142 L 312,152 L 298,154 L 286,148 L 280,134 L 280,118 L 284,104 L 290,94 Z",
  "M 320,32 L 360,28 L 400,30 L 430,38 L 440,48 L 420,52 L 390,50 L 360,54 L 330,52 L 318,44 Z",
  "M 326,72 L 356,68 L 380,70 L 396,78 L 400,90 L 388,98 L 368,96 L 344,90 L 330,82 Z",
  "M 400,52 L 430,48 L 458,54 L 468,66 L 460,78 L 442,86 L 420,82 L 404,72 Z",
  "M 438,96 L 452,90 L 466,94 L 472,106 L 462,114 L 448,110 L 440,104 Z",
  "M 432,144 L 452,138 L 470,142 L 480,154 L 478,168 L 464,176 L 448,174 L 436,164 L 430,152 Z",
  "M 196,24 L 214,20 L 228,24 L 224,34 L 210,38 L 198,34 Z",
];

// Trade route coordinates with commodity color and flow volume
const MAP_ROUTES = [
  { from: [56.0, 26.0], to: [103.8, 1.3], color: "#f97316", label: "Crude: PG→Asia", volume: 18.4, anomaly: false },
  { from: [-95.0, 29.7], to: [4.5, 51.9], color: "#38bdf8", label: "LNG: US→Europe", volume: 4.2, anomaly: false },
  { from: [119.2, -21.9], to: [120.4, 36.1], color: "#6b7280", label: "Iron Ore: AUS→China", volume: 64.2, anomaly: false },
  { from: [43.5, 12.5], to: [4.5, 51.9], color: "#ef4444", label: "⚠ Red Sea (Houthi)", volume: 12.0, anomaly: true },
  { from: [37.9, 44.9], to: [69.0, 22.0], color: "#a855f7", label: "⚠ Russia→India (Shadow)", volume: 2.1, anomaly: true },
  { from: [30.7, 45.4], to: [15.0, 5.0], color: "#f59e0b", label: "⚠ Black Sea Grain", volume: 0.8, anomaly: true },
];

const PORT_DOTS = [
  { lon: 103.8, lat: 1.3, name: "Singapore", congested: true },
  { lon: 4.5, lat: 51.9, name: "Rotterdam", congested: false },
  { lon: 56.3, lat: 25.1, name: "Fujairah", congested: true },
  { lon: -95.0, lat: 29.7, name: "Houston", congested: false },
  { lon: 120.4, lat: 36.1, name: "Qingdao", congested: false },
  { lon: 43.5, lat: 12.5, name: "Aden", congested: true },
];

function TradeFlowMap({ selectedRoute }: { selectedRoute: string | null }) {
  const W = 580;
  const H = 290;

  // Map route id to MAP_ROUTES index for highlighting
  const routeIdMap: Record<string, number> = {
    "persian-asia": 0,
    "us-europe": 1,
    "australia-china": 2,
    "red-sea": 3,
    "russia-india": 4,
    "black-sea-grain": 5,
  };

  return (
    <div className="bg-[#060e1a] border border-sky-500/15 rounded-xl overflow-hidden relative" style={{ height: 320 }}>
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-sky-400/50" />
        <span className="text-[10px] text-sky-400/40 uppercase tracking-widest">Global Commodity Flow Heatmap</span>
      </div>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-3">
        <span className="flex items-center gap-1 text-[9px] text-orange-400"><span className="w-5 h-0.5 bg-orange-400 inline-block" /> Crude</span>
        <span className="flex items-center gap-1 text-[9px] text-sky-400"><span className="w-5 h-0.5 bg-sky-400 inline-block" /> LNG</span>
        <span className="flex items-center gap-1 text-[9px] text-yellow-400"><span className="w-5 h-0.5 bg-yellow-400 inline-block" /> Grain</span>
        <span className="flex items-center gap-1 text-[9px] text-red-400"><span className="w-5 h-0.5 border-t-2 border-dashed border-red-400 inline-block" /> Anomaly</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block" }}>
        {/* Ocean */}
        <rect x={0} y={0} width={W} height={H} fill="#060e1a" />

        {/* Grid */}
        {[-60, -30, 0, 30, 60].map(lat => (
          <line key={lat} x1={0} y1={latToY(lat, H)} x2={W} y2={latToY(lat, H)}
            stroke="#1e3a5f" strokeWidth={lat === 0 ? 0.8 : 0.3} strokeDasharray={lat === 0 ? "none" : "3,6"} />
        ))}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => (
          <line key={lon} x1={lonToX(lon, W)} y1={0} x2={lonToX(lon, W)} y2={H}
            stroke="#1e3a5f" strokeWidth={0.3} strokeDasharray="3,6" />
        ))}

        {/* Continents */}
        {WORLD_LAND_PATHS.map((d, i) => (
          <path key={i} d={d} fill="#0f2844" stroke="#1e3a5f" strokeWidth={0.8} />
        ))}

        {/* Trade routes */}
        {MAP_ROUTES.map((route, i) => {
          const x1 = lonToX(route.from[0], W);
          const y1 = latToY(route.from[1], H);
          const x2 = lonToX(route.to[0], W);
          const y2 = latToY(route.to[1], H);
          const strokeW = Math.max(1, Math.min(4, route.volume / 10));
          const routeKey = Object.keys(routeIdMap).find(k => routeIdMap[k] === i) ?? "";
          const isSelected = selectedRoute !== null && routeKey === selectedRoute;
          return (
            <g key={i}>
              {/* Selection highlight ring */}
              {isSelected && (
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#ffffff" strokeWidth={strokeW + 8} strokeOpacity={0.22} strokeLinecap="round" />
              )}
              {/* Shadow glow for anomalies */}
              {route.anomaly && (
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={route.color} strokeWidth={strokeW + 4} strokeOpacity={isSelected ? 0.35 : 0.12} strokeLinecap="round" />
              )}
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={route.color}
                strokeWidth={isSelected ? strokeW + 2 : (route.anomaly ? strokeW + 0.5 : strokeW)}
                strokeOpacity={isSelected ? 1 : (route.anomaly ? 0.85 : 0.55)}
                strokeDasharray={route.anomaly ? "6,3" : "none"}
                strokeLinecap="round"
              />
              {/* Arrow at midpoint */}
              <circle
                cx={(x1 + x2) / 2}
                cy={(y1 + y2) / 2}
                r={isSelected ? 5 : (route.anomaly ? 3.5 : 2.5)}
                fill={route.color}
                fillOpacity={isSelected ? 1 : (route.anomaly ? 0.9 : 0.6)}
              />
            </g>
          );
        })}

        {/* Port dots */}
        {PORT_DOTS.map((p, i) => {
          const cx = lonToX(p.lon, W);
          const cy = latToY(p.lat, H);
          return (
            <g key={i}>
              {p.congested && (
                <circle cx={cx} cy={cy} r={6} fill="#f97316" fillOpacity={0.12}>
                  <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.15;0;0.15" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={cx} cy={cy} r={2.5} fill={p.congested ? "#f97316" : "#38bdf8"} fillOpacity={0.9} />
              <text x={cx + 4} y={cy - 3} fontSize={6} fill="#94c5e8" fillOpacity={0.7} fontFamily="monospace">{p.name}</text>
            </g>
          );
        })}
      </svg>

      {/* Anomaly legend overlay */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3">
        <span className="text-[9px] text-sky-400/30 font-mono">3 anomalous corridors detected</span>
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      </div>
    </div>
  );
}

const COMMODITIES = [
  { id: "crude", name: "Crude Oil", icon: Droplets, color: "#f97316", unit: "MB/day", volume: 82.4, change: +2.1, vessels: 347, anomalyFlag: true, anomaly: "Unusual fleet repositioning: 23 VLCCs shifted from Persian Gulf to Atlantic basin — possible demand signal ahead of summer driving season" },
  { id: "lng", name: "LNG", icon: Fuel, color: "#38bdf8", unit: "MT/month", volume: 34.1, change: -4.8, vessels: 67, anomalyFlag: true, anomaly: "Volume decline 4.8% YoY. European terminal bookings down 18% — spot LNG prices contracting. Potential overstock in NW Europe" },
  { id: "grain", name: "Grain / Dry Bulk", icon: Wheat, color: "#f59e0b", unit: "MT/week", volume: 128.7, change: +8.1, vessels: 234, anomalyFlag: true, anomaly: "Volume spike +8.1%: Black Sea grain corridor re-opened for 30-day window. Rapid charter activity observed. Price arbitrage opportunity" },
  { id: "containers", name: "Containers", icon: Box, color: "#a855f7", unit: "TEU/week", volume: 2840, change: +1.2, vessels: 89, anomalyFlag: false, anomaly: "" },
  { id: "coal", name: "Coal", icon: BarChart3, color: "#78716c", unit: "MT/month", volume: 41.2, change: -2.3, vessels: 78, anomalyFlag: false, anomaly: "" },
  { id: "iron", name: "Iron Ore", icon: Activity, color: "#6b7280", unit: "MT/month", volume: 88.6, change: +3.4, vessels: 122, anomalyFlag: false, anomaly: "" },
];

const FLOW_ROUTES = [
  {
    id: "persian-asia",
    name: "Persian Gulf → Asia",
    from: "Ras Tanura / Kharg",
    to: "Singapore / Qingdao",
    commodity: "Crude Oil",
    volumeMBD: 18.4,
    change: +1.8,
    vessels: 89,
    risk: "medium",
    anomaly: true,
    anomalyText: "Fleet concentration unusually high — 89 VLCCs vs 72 historical average. Possible demand pull from Chinese SPR build",
  },
  {
    id: "us-europe",
    name: "US Gulf Coast → NW Europe",
    from: "Houston / Corpus Christi",
    to: "Rotterdam / Hamburg",
    commodity: "LNG + Crude",
    volumeMBD: 4.2,
    change: -1.4,
    vessels: 34,
    risk: "low",
    anomaly: false,
    anomalyText: "",
  },
  {
    id: "russia-india",
    name: "Russia → India (Shadow Route)",
    from: "Novorossiysk / Primorsk",
    to: "Mundra / Sikka",
    commodity: "Sanctioned Crude",
    volumeMBD: 2.1,
    change: +14.2,
    vessels: 28,
    risk: "critical",
    anomaly: true,
    anomalyText: "Volume surge +14.2% in 60 days. Route uses ship-to-ship transfers near Kalamata and Lakshadweep. Sanctions exposure for cargo buyers",
  },
  {
    id: "australia-china",
    name: "Australia → China",
    from: "Port Hedland / Dampier",
    to: "Qingdao / Tianjin",
    commodity: "Iron Ore",
    volumeMBD: 64.2,
    change: +3.4,
    vessels: 67,
    risk: "low",
    anomaly: false,
    anomalyText: "",
  },
  {
    id: "black-sea-grain",
    name: "Black Sea → Global",
    from: "Constanta / Chornomorsk",
    to: "Various",
    commodity: "Grain / Wheat",
    volumeMBD: 0.8,
    change: +82.0,
    vessels: 41,
    risk: "high",
    anomaly: true,
    anomalyText: "Corridor opened for 30-day window. Bulk carrier bookings up 82%. Short-window arbitrage — expect rapid reversal if corridor closes. Monitor political developments",
  },
  {
    id: "red-sea",
    name: "Red Sea Transit",
    from: "Suez Canal approaches",
    to: "All directions",
    commodity: "Mixed",
    volumeMBD: 12.0,
    change: -23.4,
    vessels: 41,
    risk: "critical",
    anomaly: true,
    anomalyText: "Volume down 23.4% — active Houthi threat diverting 420+ ships via Cape of Good Hope since Jan 2024. Average voyage time +11 days",
  },
];

const TREND_DATA = [
  { month: "Oct", crude: 80.1, lng: 35.8, grain: 118.2, containers: 2760 },
  { month: "Nov", crude: 79.4, lng: 36.2, grain: 122.4, containers: 2790 },
  { month: "Dec", crude: 81.2, lng: 37.1, grain: 119.8, containers: 2810 },
  { month: "Jan", crude: 80.8, lng: 35.9, grain: 121.2, containers: 2780 },
  { month: "Feb", crude: 81.9, lng: 34.8, grain: 124.8, containers: 2800 },
  { month: "Mar", crude: 82.0, lng: 34.2, grain: 127.1, containers: 2820 },
  { month: "Apr", crude: 82.4, lng: 34.1, grain: 128.7, containers: 2840 },
];

const riskColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function AnomalyBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
      <Zap className="w-2.5 h-2.5" /> ANOMALY
    </span>
  );
}

export default function TradeFlowHeatmap() {
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>("crude");
  const [expandedRoute, setExpandedRoute] = useState<string | null>("red-sea");
  const [, navigate] = useLocation();

  const anomalyCount = COMMODITIES.filter(c => c.anomalyFlag).length + FLOW_ROUTES.filter(r => r.anomaly).length;
  const criticalRoutes = FLOW_ROUTES.filter(r => r.risk === "critical").length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-bold text-sky-50 font-display">Trade Flow Heatmap</h1>
          <Badge variant="outline" className="text-[9px] text-purple-400 border-purple-500/20 bg-purple-500/5">AI ANOMALY DETECTION</Badge>
        </div>
        <p className="text-xs text-sky-400/50">Global commodity flows with AI-identified anomalies — unusual routes, fleet repositioning, and volume shifts that signal market moves</p>
      </div>

      {/* Trade Flow World Map */}
      <TradeFlowMap selectedRoute={expandedRoute} />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "AI Anomalies Detected", value: anomalyCount, sub: "across commodities & routes", icon: Zap, color: "text-red-400" },
          { label: "Critical Routes", value: criticalRoutes, sub: "require immediate attention", icon: AlertTriangle, color: "text-orange-400" },
          { label: "Vessels Tracked", value: COMMODITIES.reduce((s, c) => s + c.vessels, 0), sub: "across all flows", icon: Ship, color: "text-sky-400" },
          { label: "Active Trade Corridors", value: FLOW_ROUTES.length, sub: "monitored globally", icon: Globe, color: "text-purple-400" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-sky-400/40">{kpi.label}</p>
              <kpi.icon className={cn("w-4 h-4", kpi.color)} />
            </div>
            <p className={cn("text-2xl font-bold font-mono", kpi.color)}>{kpi.value}</p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Commodity tiles */}
      <div>
        <p className="text-xs font-semibold text-sky-200 mb-3">Commodity Flow Overview</p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {COMMODITIES.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCommodity(selectedCommodity === c.id ? null : c.id)}
              className={cn(
                "text-left p-3 rounded-xl border transition-all",
                selectedCommodity === c.id
                  ? "border-sky-500/40 bg-sky-500/5"
                  : "border-sky-500/10 bg-[#0a1628]/80 hover:border-sky-500/20"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <c.icon className="w-4 h-4" style={{ color: c.color }} />
                {c.anomalyFlag && <Zap className="w-3 h-3 text-red-400" />}
              </div>
              <p className="text-[10px] font-medium text-sky-200 mb-0.5">{c.name}</p>
              <p className="text-xs font-bold font-mono" style={{ color: c.color }}>{c.volume}</p>
              <p className="text-[9px] text-sky-400/40">{c.unit}</p>
              <div className={cn("flex items-center gap-0.5 mt-1 text-[9px] font-mono", c.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                {c.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {c.change >= 0 ? "+" : ""}{c.change}%
              </div>
              <p className="text-[9px] text-sky-400/30 mt-0.5">{c.vessels} vessels</p>
            </button>
          ))}
        </div>

        {/* Selected commodity anomaly card */}
        {selectedCommodity && (() => {
          const c = COMMODITIES.find(x => x.id === selectedCommodity);
          if (!c?.anomalyFlag) return null;
          return (
            <div className="mt-3 p-4 bg-red-500/5 border border-red-500/15 rounded-xl flex items-start gap-3">
              <Zap className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1 font-medium">AI Anomaly — {c.name}</p>
                <p className="text-xs text-red-300/70">{c.anomaly}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Volume trend chart */}
      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-sky-200 mb-1">Global Flow Volume Trends — 7 Month</p>
        <p className="text-[10px] text-sky-400/40 mb-4">Crude (MB/day) · LNG (MT/month ÷ 3.5) · Grain (MT/week) · Containers (TEU/week ÷ 25)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={TREND_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#4a7fa5" }} />
            <YAxis tick={{ fontSize: 9, fill: "#4a7fa5" }} domain={[0, 160]} />
            <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#4a7fa5" }} />
            <Line type="monotone" dataKey="crude" stroke="#f97316" strokeWidth={2} dot={false} name="Crude Oil" />
            <Line type="monotone" dataKey="grain" stroke="#f59e0b" strokeWidth={2} dot={false} name="Grain" />
            <Line type="monotone" dataKey="lng" stroke="#38bdf8" strokeWidth={2} dot={false} name="LNG (adj.)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Route table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-sky-200">Active Trade Corridors</p>
          <div className="flex items-center gap-1 text-[10px] text-sky-400/40">
            <Eye className="w-3 h-3" /> {FLOW_ROUTES.filter(r => r.anomaly).length} corridors with AI anomaly signals
          </div>
        </div>
        <div className="space-y-2">
          {FLOW_ROUTES.map(route => (
            <div
              key={route.id}
              className={cn(
                "border rounded-xl overflow-hidden transition-all cursor-pointer",
                expandedRoute === route.id ? "border-sky-500/30 bg-[#0a1628]/90" : "border-sky-500/10 bg-[#0a1628]/80 hover:border-sky-500/20"
              )}
              onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
            >
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-sky-400/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-sky-100">{route.name}</p>
                      <Badge variant="outline" className={cn("text-[9px]", riskColors[route.risk])}>{route.risk}</Badge>
                      <span className="text-[10px] text-sky-400/40">{route.commodity}</span>
                      {route.anomaly && <AnomalyBadge />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-sky-400/40">
                      <span>{route.from}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{route.to}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-xs font-mono font-bold", route.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {route.change >= 0 ? "+" : ""}{route.change}%
                    </p>
                    <p className="text-[9px] text-sky-400/40">{route.vessels} vessels</p>
                  </div>
                  <ChevronRight className={cn("w-3.5 h-3.5 text-sky-400/30 shrink-0 transition-transform", expandedRoute === route.id && "rotate-90")} />
                </div>
              </div>
              {expandedRoute === route.id && route.anomaly && (
                <div className="border-t border-sky-500/10 px-4 py-3 bg-red-500/3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">AI Signal Detection</p>
                      <p className="text-xs text-red-300/70">{route.anomalyText}</p>
                    </div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      fireBriefSignal({
                        query: `Generate a maritime intelligence brief for the trade corridor anomaly: ${route.name} (${route.from} → ${route.to}). Commodity: ${route.commodity}. Volume change: ${route.change >= 0 ? "+" : ""}${route.change}%. Active vessels: ${route.vessels}. Risk level: ${route.risk}. AI anomaly signal: ${route.anomalyText}. Provide a situation summary, affected parties, dollar impact estimate, and 3 recommended actions.`,
                        context: `Trade Flow Heatmap signal — ${route.risk} risk ${route.commodity} corridor anomaly`,
                        source: `Trade Flow Heatmap — ${route.name} (${route.risk} risk)`,
                      });
                      navigate("/intelligence-briefs");
                    }}
                    className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-300 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg py-2 transition-colors"
                  >
                    <Zap className="w-3 h-3" /> Generate Intelligence Brief for this Corridor
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
