import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { dataProvider } from "@/data/data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Link } from "wouter";
import { Ship, Globe, MapPin, X, ChevronRight, Radio, Shield, Clock, AlertTriangle, Eye, EyeOff, Anchor, TrendingUp, Package, BarChart3 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ExportButton } from "@workspace/shared-ui/data-export";

const statusColors: Record<string, string> = {
  at_sea: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_port: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  anchored: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  maintenance: "bg-red-500/10 text-red-400 border-red-500/20",
};

const vesselStatusDotColors: Record<string, string> = {
  at_sea: "#22c55e",
  in_port: "#0ea5e9",
  anchored: "#eab308",
  maintenance: "#ef4444",
};

function getRiskBadge(score: number) {
  if (score >= 81) return { label: "Critical", color: "text-red-400 bg-red-400/10 border-red-400/20" };
  if (score >= 61) return { label: "High", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" };
  if (score >= 31) return { label: "Medium", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
  return { label: "Low", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    let cancelled = false;
    const startTime = performance.now();
    const step = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  }, [value, duration]);
  return <>{display}</>;
}

function FleetMap({ mockVessels, onVesselClick, selectedVesselId }: { mockVessels: any[]; onVesselClick: (v: any) => void; selectedVesselId?: number }) {
  const [hoveredVessel, setHoveredVessel] = useState<any | null>(null);

  const toMapCoords = (lat: number, lon: number, width: number, height: number) => {
    const x = ((lon + 180) / 360) * width;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = height / 2 - (mercN / Math.PI) * (height / 2);
    return { x, y };
  };

  const W = 1200;
  const H = 600;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#060e1a]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="ocean-glow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0d2847" />
            <stop offset="100%" stopColor="#060e1a" />
          </radialGradient>
          <filter id="vessel-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#ocean-glow)" />
        <g opacity="0.12" stroke="rgba(56,189,248,0.4)" strokeWidth="0.5" fill="none">
          {[-60, -30, 0, 30, 60].map(lat => {
            const { y } = toMapCoords(lat, 0, W, H);
            return <line key={`lat-${lat}`} x1={0} y1={y} x2={W} y2={y} strokeDasharray="4 6" />;
          })}
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
            const { x } = toMapCoords(0, lon, W, H);
            return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={H} strokeDasharray="4 6" />;
          })}
        </g>
        <g opacity="0.15" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.15)" strokeWidth="0.5">
          {[
            "M225,100 L230,95 L240,95 L245,100 L250,110 L260,115 L270,108 L280,100 L290,98 L295,100 L300,110 L305,115 L310,125 L315,135 L320,150 L325,160 L330,170 L335,175 L330,180 L320,182 L310,180 L305,175 L300,170 L295,165 L290,158 L280,155 L270,160 L260,170 L255,180 L250,185 L240,188 L235,185 L230,180 L225,170 L220,160 L215,150 L220,140 L225,130 L225,120 Z",
            "M430,85 L445,78 L460,80 L475,90 L480,105 L485,115 L490,125 L495,135 L500,145 L505,155 L510,165 L520,170 L535,172 L545,175 L550,180 L540,185 L530,190 L515,188 L500,185 L490,180 L480,170 L470,160 L460,155 L450,150 L445,140 L440,130 L435,120 L430,110 L428,100 Z",
            "M540,110 L560,105 L580,108 L600,115 L620,118 L640,120 L660,115 L680,110 L700,108 L720,112 L730,120 L740,130 L730,140 L720,148 L700,150 L680,148 L660,145 L640,140 L620,138 L600,140 L580,145 L560,148 L550,145 L545,135 L540,125 Z",
            "M620,170 L640,165 L660,168 L680,175 L700,185 L710,195 L700,210 L690,220 L680,230 L670,235 L660,230 L650,220 L640,210 L635,200 L630,190 L625,180 Z",
            "M340,230 L360,215 L380,210 L390,215 L395,225 L400,240 L395,260 L385,280 L375,295 L365,310 L355,320 L345,325 L338,315 L335,300 L332,285 L330,270 L332,255 L335,240 Z",
            "M720,240 L740,230 L760,232 L780,240 L790,255 L785,275 L775,295 L765,310 L755,320 L745,325 L735,320 L728,310 L722,295 L720,275 L718,260 Z",
          ].map((d, i) => <path key={i} d={d} />)}
        </g>
        {[
          { name: "Singapore", lat: 1.3, lon: 103.8 },
          { name: "Rotterdam", lat: 51.9, lon: 4.5 },
          { name: "Shanghai", lat: 31.2, lon: 121.5 },
          { name: "Dubai", lat: 25.3, lon: 55.3 },
          { name: "Houston", lat: 29.8, lon: -95.4 },
          { name: "Yokohama", lat: 35.4, lon: 139.6 },
        ].map(port => {
          const { x, y } = toMapCoords(port.lat, port.lon, W, H);
          return (
            <g key={port.name}>
              <rect x={x - 2} y={y - 2} width={4} height={4} fill="#0ea5e9" opacity={0.6} transform={`rotate(45 ${x} ${y})`} />
              <text x={x + 6} y={y + 3} fill="rgba(56,189,248,0.5)" fontSize="8" fontFamily="monospace">{port.name}</text>
            </g>
          );
        })}
        {mockVessels.map((v) => {
          const { x, y } = toMapCoords(v.currentLat, v.currentLon, W, H);
          const color = vesselStatusDotColors[v.status] || "#666";
          const isHovered = hoveredVessel?.id === v.id;
          const isSelected = selectedVesselId === v.id;
          return (
            <g key={v.id} onMouseEnter={() => setHoveredVessel(v)} onMouseLeave={() => setHoveredVessel(null)} onClick={() => onVesselClick(v)} style={{ cursor: "pointer" }} data-testid={`vessel-${v.id}`} role="button" aria-label={`Vessel ${v.name}`}>
              <circle cx={x} cy={y} r={18} fill="transparent" />
              {isSelected && (
                <>
                  <circle cx={x} cy={y} r={16} fill="none" stroke={color} strokeWidth={1} opacity={0.3}>
                    <animate attributeName="r" from="12" to="22" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={x} cy={y} r={10} fill={color} opacity={0.15} />
                </>
              )}
              <circle cx={x} cy={y} r={isHovered || isSelected ? 8 : 5} fill={color} opacity={0.25} />
              {v.status === "at_sea" && !isSelected && (
                <circle cx={x} cy={y} r={5} fill="none" stroke={color} strokeWidth={0.8} opacity={0.4}>
                  <animate attributeName="r" from="5" to="14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={x} cy={y} r={isHovered || isSelected ? 5 : 3.5} fill={color} filter={isHovered || isSelected ? "url(#vessel-glow)" : undefined} />
            </g>
          );
        })}
      </svg>

      {hoveredVessel && !selectedVesselId && (() => {
        const { x, y } = toMapCoords(hoveredVessel.currentLat, hoveredVessel.currentLon, W, H);
        const pctX = (x / W) * 100;
        const pctY = (y / H) * 100;
        return (
          <div className="absolute z-10 bg-[#0a1628]/95 backdrop-blur border border-sky-500/20 rounded-lg shadow-xl p-3 pointer-events-none" style={{ left: `${Math.min(Math.max(pctX, 15), 85)}%`, top: `${Math.max(pctY - 2, 5)}%`, transform: "translate(-50%, -110%)", minWidth: 200 }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-sky-100">{hoveredVessel.name}</p>
              <span className="text-[9px] font-mono text-sky-400/60">IMO {hoveredVessel.imo}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vesselStatusDotColors[hoveredVessel.status] }} />
              <span className="text-[10px] text-sky-200/70 capitalize">{hoveredVessel.status?.replace("_", " ")}</span>
              <span className="text-[10px] text-sky-200/40 ml-auto">{hoveredVessel.currentSpeed > 0 ? `${hoveredVessel.currentSpeed} kn` : "Stationary"}</span>
            </div>
            {hoveredVessel.nextPort && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-2.5 h-2.5 text-sky-400/50" />
                <p className="text-[10px] text-sky-200/50">Next: {hoveredVessel.nextPort}</p>
              </div>
            )}
          </div>
        );
      })()}

      <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-[#0a1628]/80 backdrop-blur rounded-lg px-3 py-2 border border-sky-500/10">
        {[
          { label: "At Sea", color: "#22c55e" },
          { label: "In Port", color: "#0ea5e9" },
          { label: "Anchored", color: "#eab308" },
          { label: "Maintenance", color: "#ef4444" },
        ].map(s => (
          <span key={s.label} className="flex items-center gap-1.5 text-[10px] text-sky-200/60">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="absolute bottom-3 right-3 text-[10px] text-sky-400/40 font-mono bg-[#0a1628]/80 backdrop-blur rounded-lg px-3 py-2 border border-sky-500/10">
        <Radio className="w-3 h-3 inline mr-1 text-emerald-400" />
        {mockVessels.length} vessels tracked
      </div>
    </div>
  );
}

function seededValue(id: number, offset: number, range: number) {
  const hash = ((id * 2654435761 + offset * 40503) >>> 0) % 1000;
  return (hash / 1000) * range;
}

const darkVesselEvents = [
  { vessel: "ATLAS PIONEER", gap: "18h 42m", lastSeen: "Strait of Hormuz", confidence: 94, flagState: "Panama", risk: "critical" },
  { vessel: "SILVER HORIZON", gap: "9h 15m", lastSeen: "Gulf of Oman", confidence: 78, flagState: "Marshall Is.", risk: "high" },
  { vessel: "NORDIC STAR", gap: "6h 03m", lastSeen: "Red Sea", confidence: 62, flagState: "Liberia", risk: "medium" },
];

const sanctionsQueue = [
  { vessel: "OCEAN FORTUNE", flag: "Iran", confidence: 97, status: "OFAC Match", matched: ["SDN List", "EU Sanctions"], risk: "critical" },
  { vessel: "PACIFIC EAGLE", flag: "Russia", confidence: 84, status: "Partial Match", matched: ["EU Sanctions"], risk: "high" },
  { vessel: "GOLD PIONEER", flag: "DPRK", confidence: 91, status: "OFAC Match", matched: ["SDN List", "OFAC DPRK"], risk: "critical" },
];

const cargoFlowRoutes = [
  { route: "Persian Gulf → EU", commodity: "Crude Oil", volume: "4.2M bbl/day", trend: "+8%", color: "text-amber-400" },
  { route: "US Gulf → Asia", commodity: "LNG", volume: "1.8M tons", trend: "+12%", color: "text-sky-400" },
  { route: "Brazil → China", commodity: "Iron Ore", volume: "2.1M tons", trend: "-3%", color: "text-emerald-400" },
  { route: "Black Sea → Med", commodity: "Grain", volume: "890K tons", trend: "+5%", color: "text-violet-400" },
];

const portCongestion = [
  { port: "Singapore", waitTime: "2.4 days", vessels: 47, trend: "↑ Worsening", color: "text-red-400" },
  { port: "Rotterdam", waitTime: "1.1 days", vessels: 23, trend: "→ Stable", color: "text-amber-400" },
  { port: "Shanghai", waitTime: "3.8 days", vessels: 91, trend: "↑ Worsening", color: "text-red-400" },
  { port: "Houston", waitTime: "0.8 days", vessels: 18, trend: "↓ Improving", color: "text-emerald-400" },
];

const behavioralRiskVessels = [
  { name: "TITAN VOYAGER", score: 87, reasons: ["AIS manipulation", "Speed anomaly", "Sanctioned zone transit"], trend: "+14 pts" },
  { name: "SEA MERCURY", score: 72, reasons: ["Identity switch", "Unusual anchoring pattern"], trend: "+8 pts" },
  { name: "BLUE ODYSSEY", score: 58, reasons: ["STS transfer proximity", "Flag state change"], trend: "+22 pts" },
];

function BehavioralRiskPanel() {
  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-red-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Behavioral AI Risk Scoring</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-red-500/10 text-red-400 border-red-500/20">Windward Model</Badge>
      </div>
      <div className="divide-y divide-sky-500/5">
        {behavioralRiskVessels.map((v) => {
          const risk = getRiskBadge(v.score);
          return (
            <div key={v.name} className="px-4 py-3 hover:bg-sky-500/5 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-sky-100">{v.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-red-400">{v.trend}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border text-[10px] ${risk.color}`}>{v.score}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {v.reasons.map(r => (
                  <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400/70 border border-sky-500/10">{r}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DarkVesselPanel() {
  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Dark Vessel Detection</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20">Satellite Gaps</Badge>
      </div>
      <div className="divide-y divide-sky-500/5">
        {darkVesselEvents.map((v) => (
          <div key={v.vessel} className="px-4 py-3 hover:bg-sky-500/5 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-sky-100">{v.vessel}</span>
              <Badge variant="outline" className={`text-[9px] ${v.risk === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : v.risk === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                {v.risk}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-sky-400/60">
              <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Gap: <span className="text-amber-400 font-mono">{v.gap}</span></span>
              <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{v.lastSeen}</span>
              <span className="ml-auto font-mono text-sky-400/40">{v.flagState} · {v.confidence}% conf.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SanctionsPanel() {
  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Sanctions Screening</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-red-500/10 text-red-400 border-red-500/20">5 AIS Sources</Badge>
      </div>
      <div className="divide-y divide-sky-500/5">
        {sanctionsQueue.map((v) => (
          <div key={v.vessel} className="px-4 py-3 hover:bg-sky-500/5 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-sky-100">{v.vessel}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${v.risk === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>{v.status}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-sky-400/50 font-mono">Flag: {v.flag}</span>
              <span className="text-[10px] font-mono text-sky-400/40">Conf: {v.confidence}%</span>
              <div className="flex gap-1 ml-auto">
                {v.matched.map(m => (
                  <span key={m} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{m}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CargoFlowPanel() {
  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <Package className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Cargo Flow Intelligence</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-sky-500/10 text-sky-400 border-sky-500/20">Kpler Analytics</Badge>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {cargoFlowRoutes.map((r) => (
          <div key={r.route} className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-sky-400/50 uppercase">{r.commodity}</span>
              <span className={`text-[10px] font-bold ${r.trend.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{r.trend}</span>
            </div>
            <p className="text-[11px] text-sky-200 font-medium mb-1">{r.route}</p>
            <p className={`text-xs font-bold font-mono ${r.color}`}>{r.volume}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortCongestionPanel() {
  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <Anchor className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Port Congestion Forecast</span>
      </div>
      <div className="divide-y divide-sky-500/5">
        {portCongestion.map((p) => (
          <div key={p.port} className="px-4 py-2.5 flex items-center gap-3 hover:bg-sky-500/5 transition-colors">
            <div className="w-6 h-6 rounded bg-sky-500/10 flex items-center justify-center shrink-0">
              <Anchor className="w-3 h-3 text-sky-400/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sky-100">{p.port}</p>
              <p className="text-[10px] text-sky-400/50">{p.vessels} vessels waiting</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold font-mono text-sky-100">{p.waitTime}</p>
              <p className={`text-[10px] font-mono ${p.color}`}>{p.trend}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VesselDrawer({ vessel, onClose }: { vessel: any; onClose: () => void }) {
  const vid = vessel.id || 1;
  const riskScore = Math.floor(seededValue(vid, 0, 40) + (vessel.status === "maintenance" ? 50 : vessel.status === "anchored" ? 25 : 10));
  const risk = getRiskBadge(riskScore);

  return (
    <div className="w-[380px] h-full bg-[#0a1628]/95 backdrop-blur-xl border-l border-sky-500/10 flex flex-col overflow-hidden shrink-0">
      <div className="p-4 border-b border-sky-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <Ship className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-sky-50">{vessel.name}</h3>
            <p className="text-[10px] text-sky-400/60 font-mono">IMO {vessel.imo}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-sky-500/10 transition-colors text-sky-400/60 hover:text-sky-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={statusColors[vessel.status] || ""}>
            {vessel.status === "at_sea" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />}
            {vessel.status?.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className={risk.color}>
            <Shield className="w-3 h-3 mr-1" />
            Risk: {risk.label}
          </Badge>
        </div>

        <div className="bg-sky-500/5 rounded-lg border border-sky-500/10 p-3 space-y-2">
          <h4 className="text-[10px] font-mono text-sky-400/60 uppercase tracking-wider">Position & Navigation</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Latitude", value: `${vessel.currentLat?.toFixed(4)}°` },
              { label: "Longitude", value: `${vessel.currentLon?.toFixed(4)}°` },
              { label: "Speed", value: `${vessel.currentSpeed || 0} kn` },
              { label: "Heading", value: `${vessel.heading || Math.floor(seededValue(vid, 1, 360))}°` },
            ].map(item => (
              <div key={item.label}>
                <p className="text-[10px] text-sky-400/40">{item.label}</p>
                <p className="text-xs font-mono text-sky-100">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sky-500/5 rounded-lg border border-sky-500/10 p-3 space-y-2">
          <h4 className="text-[10px] font-mono text-sky-400/60 uppercase tracking-wider">Behavioral AI Score</h4>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-sky-500/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-red-400" style={{ width: `${riskScore}%` }} />
            </div>
            <span className={`text-sm font-bold font-mono ${risk.color.split(" ")[0]}`}>{riskScore}/100</span>
          </div>
          <p className="text-[10px] text-sky-400/40">Pattern analysis from 90-day AIS history</p>
        </div>

        <div className="bg-sky-500/5 rounded-lg border border-sky-500/10 p-3 space-y-2">
          <h4 className="text-[10px] font-mono text-sky-400/60 uppercase tracking-wider">Vessel Details</h4>
          {[
            { label: "Type", value: vessel.vesselType || vessel.shipClass || "N/A" },
            { label: "Flag", value: vessel.flag || "N/A" },
            { label: "DWT", value: vessel.deadweight ? `${Number(vessel.deadweight).toLocaleString()} t` : "N/A" },
            { label: "Year Built", value: vessel.yearBuilt || "N/A" },
            { label: "Trade Lane", value: vessel.tradeLane || "Unassigned" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[10px] text-sky-400/40 font-mono">{item.label}</span>
              <span className="text-xs text-sky-100">{item.value}</span>
            </div>
          ))}
        </div>

        {vessel.nextPort && (
          <div className="bg-sky-500/5 rounded-lg border border-sky-500/10 p-3">
            <h4 className="text-[10px] font-mono text-sky-400/60 uppercase tracking-wider mb-2">Voyage</h4>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <div>
                <p className="text-xs text-sky-100">Next: {vessel.nextPort}</p>
                <p className="text-[10px] text-sky-400/40">ETA: {new Date(Date.now() + (seededValue(vid, 2, 5) + 1) * 86400000).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-sky-500/5 rounded-lg border border-sky-500/10 p-3 space-y-2">
          <h4 className="text-[10px] font-mono text-sky-400/60 uppercase tracking-wider">Performance</h4>
          {[
            { label: "CII Rating", value: vessel.ciiRating || "B" },
            { label: "Fuel", value: `${(seededValue(vid, 3, 5) + 20).toFixed(1)} t/day` },
            { label: "Utilization", value: `${Math.floor(seededValue(vid, 4, 20) + 75)}%` },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[10px] text-sky-400/40 font-mono">{item.label}</span>
              <span className="text-xs font-mono text-sky-100">{item.value}</span>
            </div>
          ))}
        </div>

        <Link href={`/vessel/${vessel.id}`}>
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 text-xs font-medium transition-colors cursor-pointer">
            Full Vessel Profile <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}

type IntelTab = "behavioral" | "dark" | "sanctions" | "cargo" | "congestion";

export default function FleetDashboard() {
  const { data: kpis } = useQuery({ queryKey: ["fleet-kpis"], queryFn: () => dataProvider.getFleetKPIs() });
  const { data: mockVessels = [] } = useQuery({ queryKey: ["mock-vessels"], queryFn: () => dataProvider.getVessels() });
  const { data: eventLogs = [] } = useQuery({ queryKey: ["dashboard-logs"], queryFn: () => dataProvider.getEventLogs() });

  const [selectedVessel, setSelectedVessel] = useState<any | null>(null);
  const [intelTab, setIntelTab] = useState<IntelTab>("behavioral");

  const recentAlerts = eventLogs.filter((l: any) => l.severity === "Critical" || l.severity === "Warning").slice(0, 5);

  const intelTabs: { id: IntelTab; label: string; icon: any }[] = [
    { id: "behavioral", label: "Behavioral Risk", icon: Shield },
    { id: "dark", label: "Dark Vessels", icon: EyeOff },
    { id: "sanctions", label: "Sanctions", icon: AlertTriangle },
    { id: "cargo", label: "Cargo Flow", icon: Package },
    { id: "congestion", label: "Port Congestion", icon: Anchor },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          {kpis && (
            <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-sky-500/10 bg-[#0a1628]/80 backdrop-blur shrink-0 overflow-x-auto">
              <div className="flex items-center gap-2 mr-3 shrink-0">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-display text-xs font-bold text-sky-50 uppercase tracking-wider">Fleet Command</span>
                <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 ml-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE</span>
                <ExportButton
                  filename="fleet-manifest"
                  csvData={mockVessels.map((v: any) => ({
                    Name: v.name,
                    IMO: v.imoNumber || v.imo || "",
                    Flag: v.flag || "",
                    Type: v.vesselType || v.type || "",
                    Status: v.status || "",
                    "Current Port": v.currentPort || "",
                    Destination: v.destination || "",
                  }))}
                  pdfTitle="Fleet Manifest"
                  accentColor="#0ea5e9"
                />
              </div>
              <div className="h-4 w-px bg-sky-500/20 mx-1 shrink-0" />
              {[
                { label: "FLEET", value: kpis.totalVessels, color: "text-sky-200" },
                { label: "SEA", value: kpis.atSea, color: "text-emerald-400" },
                { label: "PORT", value: kpis.inPort, color: "text-sky-400" },
                { label: "ANCHOR", value: kpis.anchored, color: "text-amber-400" },
                { label: "TCE", value: `$${(kpis.averageTCE / 1000).toFixed(0)}k`, color: "text-emerald-400" },
                { label: "UTIL", value: `${kpis.averageUtilization}%`, color: "text-sky-200" },
                { label: "CO2", value: `${(kpis.totalCO2Today / 1000).toFixed(1)}k`, color: "text-amber-400" },
                { label: "HEALTH", value: kpis.fleetHealthScore, color: kpis.fleetHealthScore >= 80 ? "text-emerald-400" : "text-amber-400" },
              ].map((kpi, i) => (
                <div key={kpi.label} className="flex items-center gap-1.5 px-2 py-0.5 shrink-0">
                  <span className="text-[9px] font-mono text-sky-500/50 uppercase">{kpi.label}</span>
                  <span className={`text-sm font-bold font-display ${kpi.color}`}>
                    {typeof kpi.value === "number" ? <AnimatedCounter value={kpi.value} /> : kpi.value}
                  </span>
                  {i < 7 && <div className="h-3 w-px bg-sky-500/10 ml-1" />}
                </div>
              ))}
              {kpis.criticalAlerts > 0 && (
                <>
                  <div className="h-4 w-px bg-sky-500/20 mx-1 shrink-0" />
                  <div className="flex items-center gap-1 px-2 py-0.5 shrink-0">
                    <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-red-400/80 uppercase">ALERTS</span>
                    <span className="text-sm font-bold text-red-400"><AnimatedCounter value={kpis.criticalAlerts} /></span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex-1 relative overflow-hidden">
            {mockVessels.length > 0 ? (
              <FleetMap mockVessels={mockVessels} onVesselClick={setSelectedVessel} selectedVesselId={selectedVessel?.id} />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#060e1a]">
                <div className="text-center">
                  <Ship className="w-12 h-12 text-sky-500/20 mx-auto mb-3" />
                  <p className="text-sm text-sky-400/40">Loading fleet data...</p>
                </div>
              </div>
            )}

            {recentAlerts.length > 0 && (
              <div className="absolute top-3 left-3 w-72 bg-[#0a1628]/90 backdrop-blur-xl rounded-lg border border-sky-500/10 overflow-hidden">
                <div className="px-3 py-2 border-b border-sky-500/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-sky-400/60 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />Live Alerts
                  </span>
                  <Link href="/alerts">
                    <span className="text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer">View all</span>
                  </Link>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {recentAlerts.map((alert: any) => (
                    <div key={alert.id} className="px-3 py-2 border-b border-sky-500/5 last:border-0 hover:bg-sky-500/5 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${alert.severity === "Critical" ? "bg-red-400 animate-pulse" : "bg-amber-400"}`} />
                        <div className="min-w-0">
                          <p className="text-[11px] text-sky-100 leading-tight truncate">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-sky-400/40">{alert.vesselName}</span>
                            <span className="text-[9px] text-sky-400/30 flex items-center gap-0.5">
                              <Clock className="w-2 h-2" />
                              {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedVessel && (
          <VesselDrawer vessel={selectedVessel} onClose={() => setSelectedVessel(null)} />
        )}
      </div>

      {/* Intelligence Panel — full width bottom strip */}
      <div className="shrink-0 bg-[#060e1a] border-t border-sky-500/10" style={{ height: 260 }}>
        <div className="flex items-center gap-1 px-4 pt-2 pb-0 border-b border-sky-500/10">
          {intelTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setIntelTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono rounded-t transition-colors ${intelTab === tab.id ? "bg-sky-500/10 text-sky-300 border-b-2 border-sky-400" : "text-sky-400/50 hover:text-sky-400/80"}`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-[9px] font-mono text-sky-400/30 pr-2">Maritime Intelligence · Mock Data</span>
        </div>
        <div className="p-3 overflow-auto h-[210px]">
          {intelTab === "behavioral" && <BehavioralRiskPanel />}
          {intelTab === "dark" && <DarkVesselPanel />}
          {intelTab === "sanctions" && <SanctionsPanel />}
          {intelTab === "cargo" && <CargoFlowPanel />}
          {intelTab === "congestion" && <PortCongestionPanel />}
        </div>
      </div>
    </div>
  );
}
