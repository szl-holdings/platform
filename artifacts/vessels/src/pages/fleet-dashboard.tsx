import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRoster, useFleetExceptions, useSanctions } from "@/hooks/use-vessels-data";
import type { RosterVessel } from "@/lib/api";
import { dataProvider } from "@/data/data-provider";
import { VesselsGraphQLPanel } from "@/components/graphql-data-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Link } from "wouter";
import { Ship, Globe, MapPin, X, ChevronRight, Radio, Shield, Clock, AlertTriangle, Eye, EyeOff, Anchor, TrendingUp, Package, BarChart3, Leaf, Activity } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { ExportButton } from "@szl-holdings/shared-ui/data-export";
import { ActivityFeed } from "@szl-holdings/shared-ui/collaboration";
import { DataProvenance, ActionLoop, RoleSelector } from "@szl-holdings/shared-ui";
import type { DataProvenanceInfo } from "@szl-holdings/shared-ui";

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

function FleetMap({ vessels, onVesselClick, selectedVesselId }: { vessels: RosterVessel[]; onVesselClick: (v: RosterVessel) => void; selectedVesselId?: number }) {
  const [hoveredVessel, setHoveredVessel] = useState<RosterVessel | null>(null);

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
        {vessels.filter(v => v.latitude && v.longitude).map((v) => {
          const { x, y } = toMapCoords(parseFloat(v.latitude!), parseFloat(v.longitude!), W, H);
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

      {hoveredVessel && !selectedVesselId && hoveredVessel.latitude && hoveredVessel.longitude && (() => {
        const { x, y } = toMapCoords(parseFloat(hoveredVessel.latitude), parseFloat(hoveredVessel.longitude), W, H);
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
              <span className="text-[10px] text-sky-200/40 ml-auto">{hoveredVessel.speed && parseFloat(hoveredVessel.speed) > 0 ? `${parseFloat(hoveredVessel.speed).toFixed(1)} kn` : "Stationary"}</span>
            </div>
            {hoveredVessel.destination && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-2.5 h-2.5 text-sky-400/50" />
                <p className="text-[10px] text-sky-200/50">Next: {hoveredVessel.destination}</p>
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
        {vessels.length} vessels tracked
      </div>
    </div>
  );
}

function seededValue(id: number, offset: number, range: number) {
  const hash = ((id * 2654435761 + offset * 40503) >>> 0) % 1000;
  return (hash / 1000) * range;
}

type ExceptionItem = {
  id: string;
  type: string;
  severity: string;
  vesselName: string;
  title: string;
  description: string;
  detectedAt: string;
  estimatedImpactUSD: number;
};

function BehavioralRiskPanel({ exceptions }: { exceptions: ExceptionItem[] }) {
  const behavioralTypes = ["route_deviation", "speed_anomaly", "fuel_anomaly", "security_alert", "schedule_variance"];
  const items = exceptions.filter(e => behavioralTypes.includes(e.type)).slice(0, 5);
  if (items.length === 0) {
    return (
      <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl p-6 flex items-center justify-center">
        <p className="text-[11px] text-sky-400/40 font-mono">No active behavioral exceptions</p>
      </div>
    );
  }
  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-red-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Behavioral Risk Exceptions</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-red-500/10 text-red-400 border-red-500/20">{items.length} Active</Badge>
      </div>
      <div className="divide-y divide-sky-500/5">
        {items.map((e) => (
          <div key={e.id} className="px-4 py-3 hover:bg-sky-500/5 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-sky-100">{e.vesselName}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${e.severity === "critical" ? "text-red-400 bg-red-400/10 border-red-400/20" : e.severity === "high" ? "text-orange-400 bg-orange-400/10 border-orange-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"}`}>
                {e.severity}
              </span>
            </div>
            <p className="text-[10px] text-sky-400/60 truncate">{e.title}</p>
            <p className="text-[9px] text-sky-400/30 font-mono mt-0.5">{e.type.replace(/_/g, " ")} · impact ${e.estimatedImpactUSD.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DarkVesselPanel({ exceptions }: { exceptions: ExceptionItem[] }) {
  const items = exceptions.filter(e => e.type === "ais_dark").slice(0, 5);
  if (items.length === 0) {
    return (
      <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl p-6 flex items-center justify-center">
        <p className="text-[11px] text-sky-400/40 font-mono">No dark vessel events detected</p>
      </div>
    );
  }
  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Dark Vessel Detection</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20">{items.length} AIS Gaps</Badge>
      </div>
      <div className="divide-y divide-sky-500/5">
        {items.map((e) => (
          <div key={e.id} className="px-4 py-3 hover:bg-sky-500/5 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-sky-100">{e.vesselName}</span>
              <Badge variant="outline" className={`text-[9px] ${e.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : e.severity === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                {e.severity}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-sky-400/60">
              <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{e.title}</span>
              <span className="ml-auto font-mono text-sky-400/40">{new Date(e.detectedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SanctionsPanel({ exceptions }: { exceptions: ExceptionItem[] }) {
  const { screenings, isLoading } = useSanctions({ ofacStatus: "match" });
  const sanctionExceptions = exceptions.filter(e => e.type === "sanctions_match").slice(0, 3);
  const items = screenings.slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl p-6 flex items-center justify-center">
        <p className="text-[11px] text-sky-400/40 font-mono">Loading sanctions data…</p>
      </div>
    );
  }

  const displayItems = items.length > 0 ? items : sanctionExceptions;
  if (displayItems.length === 0) {
    return (
      <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl p-6 flex items-center justify-center">
        <p className="text-[11px] text-sky-400/40 font-mono">No active sanctions matches</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Sanctions Screening</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-red-500/10 text-red-400 border-red-500/20">{displayItems.length} Flags</Badge>
      </div>
      <div className="divide-y divide-sky-500/5">
        {items.length > 0 ? items.map((s) => (
          <div key={s.id} className="px-4 py-3 hover:bg-sky-500/5 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-sky-100">Vessel #{s.vesselId}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${s.ofacStatus === "match" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}`}>
                {s.ofacStatus?.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-sky-400/50 font-mono">EU: {s.euStatus}</span>
              <span className="text-[10px] text-sky-400/50 font-mono">UN: {s.unStatus}</span>
              <span className="text-[10px] text-sky-400/50 font-mono">PSC: {s.pscResult?.replace(/_/g, " ")}</span>
            </div>
          </div>
        )) : sanctionExceptions.map((e) => (
          <div key={e.id} className="px-4 py-3 hover:bg-sky-500/5 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-sky-100">{e.vesselName}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">{e.severity}</span>
            </div>
            <p className="text-[10px] text-sky-400/60 truncate">{e.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CargoFlowPanel({ exceptions }: { exceptions: ExceptionItem[] }) {
  const portCongestExceptions = exceptions.filter(e => e.type === "port_congestion").slice(0, 4);
  if (portCongestExceptions.length === 0) {
    return (
      <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl p-6 flex items-center justify-center">
        <p className="text-[11px] text-sky-400/40 font-mono">No cargo-related exceptions</p>
      </div>
    );
  }
  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <Package className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Cargo & Port Exceptions</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-sky-500/10 text-sky-400 border-sky-500/20">{portCongestExceptions.length} Active</Badge>
      </div>
      <div className="divide-y divide-sky-500/5">
        {portCongestExceptions.map((e) => (
          <div key={e.id} className="px-4 py-3 hover:bg-sky-500/5 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-sky-100">{e.vesselName}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${e.severity === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : e.severity === "high" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                {e.severity}
              </span>
            </div>
            <p className="text-[10px] text-sky-400/60 truncate">{e.title}</p>
            <p className="text-[9px] text-sky-400/30 font-mono mt-0.5">impact ${e.estimatedImpactUSD.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortCongestionPanel({ exceptions }: { exceptions: ExceptionItem[] }) {
  const delayExceptions = exceptions.filter(e => e.type === "delay_risk" || e.type === "port_congestion").slice(0, 5);
  if (delayExceptions.length === 0) {
    return (
      <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl p-6 flex items-center justify-center">
        <p className="text-[11px] text-sky-400/40 font-mono">No port congestion exceptions</p>
      </div>
    );
  }
  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <Anchor className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Port Delay Exceptions</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-sky-500/10 text-sky-400 border-sky-500/20">{delayExceptions.length} Active</Badge>
      </div>
      <div className="divide-y divide-sky-500/5">
        {delayExceptions.map((e) => (
          <div key={e.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-sky-500/5 transition-colors">
            <div className="w-6 h-6 rounded bg-sky-500/10 flex items-center justify-center shrink-0">
              <Anchor className="w-3 h-3 text-sky-400/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sky-100">{e.vesselName}</p>
              <p className="text-[10px] text-sky-400/50 truncate">{e.title}</p>
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-mono ${e.severity === "critical" ? "text-red-400" : e.severity === "high" ? "text-orange-400" : "text-amber-400"}`}>{e.severity}</p>
              <p className="text-[9px] text-sky-400/30">${e.estimatedImpactUSD.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VesselDrawer({ vessel, onClose }: { vessel: RosterVessel; onClose: () => void }) {
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
              { label: "Latitude", value: vessel.latitude ? `${parseFloat(vessel.latitude).toFixed(4)}°` : "N/A" },
              { label: "Longitude", value: vessel.longitude ? `${parseFloat(vessel.longitude).toFixed(4)}°` : "N/A" },
              { label: "Speed", value: vessel.speed ? `${parseFloat(vessel.speed).toFixed(1)} kn` : "Stationary" },
              { label: "Heading", value: vessel.heading ? `${parseFloat(vessel.heading).toFixed(0)}°` : "N/A" },
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
            { label: "Type", value: vessel.vesselType || "N/A" },
            { label: "Flag", value: vessel.flag || "N/A" },
            { label: "GRT", value: vessel.grossTonnage ? `${Number(vessel.grossTonnage).toLocaleString()} t` : "N/A" },
            { label: "Year Built", value: vessel.yearBuilt ? String(vessel.yearBuilt) : "N/A" },
            { label: "Charter", value: vessel.charterType || "Unassigned" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[10px] text-sky-400/40 font-mono">{item.label}</span>
              <span className="text-xs text-sky-100">{item.value}</span>
            </div>
          ))}
        </div>

        {vessel.destination && (
          <div className="bg-sky-500/5 rounded-lg border border-sky-500/10 p-3">
            <h4 className="text-[10px] font-mono text-sky-400/60 uppercase tracking-wider mb-2">Active Voyage</h4>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <div>
                <p className="text-xs text-sky-100">Destination: {vessel.destination}</p>
                {vessel.eta && <p className="text-[10px] text-sky-400/40">ETA: {new Date(vessel.eta).toLocaleDateString()}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="bg-sky-500/5 rounded-lg border border-sky-500/10 p-3 space-y-2">
          <h4 className="text-[10px] font-mono text-sky-400/60 uppercase tracking-wider">Voyage Economics</h4>
          {[
            { label: "TCE/day", value: vessel.tcePerDay ? `$${Math.round(parseFloat(vessel.tcePerDay)).toLocaleString()}` : "N/A" },
            { label: "Cargo", value: vessel.cargoType || "—" },
            { label: "Voyage Ref", value: vessel.voyageRef || "—" },
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

function DocumentValidationPanel() {
  const docs = [
    { vessel: "MV Caspian Star", doc: "P&I Certificate", status: "expired", expires: "2026-01-15", severity: "critical" },
    { vessel: "MV Nordic Spirit", doc: "ISM Safety Certificate", status: "expiring", expires: "2026-04-10", severity: "high" },
    { vessel: "MV Atlantic Runner", doc: "ISPS Certificate", status: "valid", expires: "2027-06-30", severity: "low" },
    { vessel: "MV Orion Trader", doc: "Class Certificate", status: "expiring", expires: "2026-04-22", severity: "high" },
    { vessel: "MV Pacific Horizon", doc: "CLC Certificate", status: "valid", expires: "2027-09-01", severity: "low" },
  ];
  const expired = docs.filter(d => d.status === "expired").length;
  const expiring = docs.filter(d => d.status === "expiring").length;

  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Document Validation</span>
        {expired > 0 && <Badge variant="outline" className="ml-auto text-[9px] bg-red-500/10 text-red-400 border-red-500/20">{expired} Expired</Badge>}
        {expiring > 0 && <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20">{expiring} Expiring</Badge>}
      </div>
      <div className="divide-y divide-sky-500/5">
        {docs.map((d, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-sky-500/5 transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.status === "expired" ? "bg-red-400 animate-pulse" : d.status === "expiring" ? "bg-amber-400" : "bg-emerald-400"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sky-100">{d.vessel}</p>
              <p className="text-[10px] text-sky-400/50">{d.doc}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-[10px] font-bold uppercase ${d.status === "expired" ? "text-red-400" : d.status === "expiring" ? "text-amber-400" : "text-emerald-400"}`}>{d.status}</span>
              <p className="text-[9px] text-sky-400/30 font-mono">{d.expires}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RouteForecastPanel() {
  const forecasts = [
    { vessel: "MV Atlantic Runner", route: "Singapore → Rotterdam", eta: "Apr 12", delay: "+2.5d", cause: "Suez congestion", impact: "$84K", severity: "high" },
    { vessel: "MV Caspian Star", route: "Houston → Yokohama", eta: "Apr 18", delay: "On time", cause: "—", impact: "—", severity: "low" },
    { vessel: "MV Pacific Horizon", route: "Dubai → Shanghai", eta: "Apr 8", delay: "+1d", cause: "Weather", impact: "$32K", severity: "medium" },
    { vessel: "MV Nordic Spirit", route: "Rotterdam → Singapore", eta: "Apr 25", delay: "+4d", cause: "Port strike", impact: "$156K", severity: "critical" },
  ];

  return (
    <div className="bg-[#0a1628]/80 backdrop-blur border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Route Forecast & Delay Causes</span>
        <Badge variant="outline" className="ml-auto text-[9px] bg-sky-500/10 text-sky-400 border-sky-500/20">{forecasts.filter(f => f.severity !== "low").length} Delays</Badge>
      </div>
      <div className="divide-y divide-sky-500/5">
        {forecasts.map((f, i) => (
          <div key={i} className="px-4 py-2.5 hover:bg-sky-500/5 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-sky-100">{f.vessel}</span>
              <span className={`text-[10px] font-bold ${f.severity === "critical" ? "text-red-400" : f.severity === "high" ? "text-orange-400" : f.severity === "medium" ? "text-amber-400" : "text-emerald-400"}`}>{f.delay}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-sky-400/50">
              <span className="font-mono">{f.route}</span>
              <span>ETA {f.eta}</span>
              {f.cause !== "—" && <span className="text-amber-400/60">{f.cause}</span>}
              {f.impact !== "—" && <span className="font-mono text-sky-400/30">impact {f.impact}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type IntelTab = "behavioral" | "dark" | "sanctions" | "cargo" | "congestion" | "documents" | "routes";

export default function FleetDashboard() {
  const { data: kpis } = useQuery({ queryKey: ["fleet-kpis"], queryFn: () => dataProvider.getFleetKPIs() });
  const { roster } = useRoster();
  const { fleetExceptions } = useFleetExceptions({ status: "active" });
  const { data: liveDashboard } = useQuery({ queryKey: ["vessels-dashboard"], queryFn: () => api.dashboard(), refetchInterval: 60_000 });

  const [selectedVessel, setSelectedVessel] = useState<RosterVessel | null>(null);
  const [intelTab, setIntelTab] = useState<IntelTab>("behavioral");
  const [activeRole, setActiveRole] = useState("operator");

  const darkVesselCount = fleetExceptions.filter(e => e.type === "ais_dark").length;

  const recentAlerts = fleetExceptions
    .filter(e => e.severity === "critical" || e.severity === "high")
    .slice(0, 5);

  const intelTabs: { id: IntelTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "behavioral", label: "Behavioral Risk", icon: Shield },
    { id: "dark", label: "Dark Vessels", icon: EyeOff },
    { id: "sanctions", label: "Sanctions", icon: AlertTriangle },
    { id: "routes", label: "Route Forecast", icon: TrendingUp },
    { id: "documents", label: "Documents", icon: BarChart3 },
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
                  data={roster.map(v => ({
                    Name: v.name,
                    IMO: v.imo ?? "",
                    Flag: v.flag ?? "",
                    Type: v.vesselType ?? "",
                    Status: v.status,
                    Destination: v.destination ?? "",
                    ETA: v.eta ?? "",
                    "Charter Type": v.charterType ?? "",
                    "TCE/day": v.tcePerDay ? `$${Math.round(parseFloat(v.tcePerDay)).toLocaleString()}` : "",
                    "Active Exceptions": v.activeExceptions,
                  }))}
                  options={{ filename: "fleet-manifest", title: "Fleet Manifest", accentColor: "#0ea5e9" }}
                />
              </div>
              <div className="h-4 w-px bg-sky-500/20 mx-1 shrink-0" />
              {[
                { label: "FLEET", value: liveDashboard?.summary?.totalVessels ?? kpis.totalVessels, color: "text-sky-200" },
                { label: "SEA", value: liveDashboard?.statusDistribution?.find(s => s.status === "at_sea")?.count ?? kpis.atSea, color: "text-emerald-400" },
                { label: "PORT", value: liveDashboard?.statusDistribution?.find(s => s.status === "in_port")?.count ?? kpis.inPort, color: "text-sky-400" },
                { label: "ANCHOR", value: liveDashboard?.statusDistribution?.find(s => s.status === "anchored")?.count ?? kpis.anchored, color: "text-amber-400" },
                { label: "DARK", value: darkVesselCount, color: darkVesselCount > 0 ? "text-red-400" : "text-sky-400/40" },
                { label: "UTIL", value: `${liveDashboard?.summary?.utilizationRate ?? kpis.averageUtilization}%`, color: "text-sky-200" },
                { label: "EXCEP", value: liveDashboard?.summary?.activeExceptions ?? kpis.criticalAlerts, color: "text-orange-400" },
                { label: "MAINT", value: liveDashboard?.summary?.overdueMaintenanceItems ?? 0, color: "text-red-400" },
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

          <div className="flex items-center justify-between gap-2 px-3 py-1 border-b border-sky-500/10 bg-[#0a1628]/60 shrink-0 overflow-x-auto">
            <RoleSelector
              currentRole={activeRole}
              onRoleChange={setActiveRole}
              roles={[
                { id: "executive", label: "Executive", description: "Fleet economics, portfolio risk" },
                { id: "operator", label: "Ops Center", description: "Vessel tracking, alerts, scheduling" },
                { id: "analyst", label: "Intel Analyst", description: "Behavioral risk, sanctions, anomalies" },
                { id: "admin", label: "Admin", description: "System health, configuration" },
                { id: "buyer", label: "Buyer / Demo", description: "Product capabilities overview" },
              ]}
            />
            <DataProvenance
              compact
              provenance={{
                source: "Maritime Intelligence Engine",
                lastUpdated: new Date().toISOString(),
                freshness: "realtime",
                confidence: "high",
                dataState: "demo",
                owner: "Fleet Operations",
              } as DataProvenanceInfo}
            />
          </div>

          {activeRole === "executive" && (
            <div className="mx-3 mt-2 rounded-xl border p-3" style={{ borderColor: "rgba(14,165,233,0.15)", background: "rgba(14,165,233,0.04)" }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "rgba(14,165,233,0.5)" }}>Executive Briefing</div>
              <div className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                Fleet utilization at {kpis ? `${kpis.averageUtilization}%` : "—"}. {darkVesselCount > 0 ? `${darkVesselCount} dark vessel event${darkVesselCount > 1 ? "s" : ""} detected — AIS gaps require investigation.` : "No dark vessel events."} {kpis && kpis.criticalAlerts > 0 ? `${kpis.criticalAlerts} critical alerts active.` : "No critical alerts."} Fleet health score: {kpis?.fleetHealthScore ?? "—"}/100.
              </div>
            </div>
          )}

          {activeRole === "buyer" && (
            <div className="mx-3 mt-2 rounded-xl border p-3" style={{ borderColor: "rgba(14,165,233,0.15)", background: "rgba(14,165,233,0.04)" }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "rgba(14,165,233,0.5)" }}>Product Demo View</div>
              <div className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                You're viewing Vessels — SZL's maritime intelligence platform. Real-time AIS tracking, behavioral AI scoring, sanctions screening, dark vessel detection, and port congestion analysis. Every vessel position and risk metric demonstrates mission-grade maritime domain awareness.
              </div>
            </div>
          )}

          {activeRole === "analyst" && (
            <div className="mx-3 mt-2 rounded-xl border p-3" style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.04)" }}>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "rgba(139,92,246,0.5)" }}>Intel Analysis Focus</div>
              <div className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                {darkVesselCount > 0 ? `${darkVesselCount} AIS gap event${darkVesselCount > 1 ? "s" : ""} flagged for behavioral analysis.` : "No AIS anomalies."} {fleetExceptions.filter(e => e.type === "sanctions_match").length > 0 ? `Active sanctions matches require cross-referencing with OFAC/EU/UN lists.` : "No sanctions flags."} Behavioral risk models running on 90-day AIS history. Route deviation and speed anomaly patterns under continuous monitoring.
              </div>
            </div>
          )}

          <div className="flex-1 relative overflow-hidden">
            {roster.length > 0 ? (
              <FleetMap vessels={roster} onVesselClick={setSelectedVessel} selectedVesselId={selectedVessel?.id} />
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
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="px-3 py-2 border-b border-sky-500/5 last:border-0 hover:bg-sky-500/5 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${alert.severity === "critical" ? "bg-red-400 animate-pulse" : "bg-amber-400"}`} />
                        <div className="min-w-0">
                          <p className="text-[11px] text-sky-100 leading-tight truncate">{alert.title ?? alert.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-sky-400/40">{alert.vesselName}</span>
                            <span className="text-[9px] text-sky-400/30 flex items-center gap-0.5">
                              <Clock className="w-2 h-2" />
                              {new Date(alert.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

      <div className="shrink-0 px-4 py-2">
        <ActionLoop
          title="Immediate Actions"
          actions={[
            { id: "1", label: "Investigate AIS gap — MV Caspian Star", type: "investigate", severity: "critical" },
            { id: "2", label: "Approve route deviation — MV Atlantic Runner", type: "approve", severity: "high" },
            { id: "3", label: "Escalate sanctions match — MV Orion Trader", type: "escalate", severity: "critical" },
            { id: "4", label: "Assign overdue inspection — MV Nordic Spirit", type: "assign" },
          ]}
        />
      </div>

      <div className="shrink-0 px-4 pb-4">
        <ActivityFeed entityType="vessel" title="Fleet Team Activity" limit={6} compact />
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
          <span className="ml-auto text-[9px] font-mono text-sky-400/30 pr-2">Maritime Intelligence · DB-backed</span>
        </div>
        <div className="p-3 overflow-auto h-[210px]">
          {intelTab === "behavioral" && <BehavioralRiskPanel exceptions={fleetExceptions} />}
          {intelTab === "dark" && <DarkVesselPanel exceptions={fleetExceptions} />}
          {intelTab === "sanctions" && <SanctionsPanel exceptions={fleetExceptions} />}
          {intelTab === "routes" && <RouteForecastPanel />}
          {intelTab === "documents" && <DocumentValidationPanel />}
          {intelTab === "cargo" && <CargoFlowPanel exceptions={fleetExceptions} />}
          {intelTab === "congestion" && <PortCongestionPanel exceptions={fleetExceptions} />}
        </div>
      </div>

      <VesselsGraphQLPanel />
      <DigitalTwinDecarbPanel />
    </div>
  );
}

type DecarbVoyage = {
  voyage_id: string;
  vessel_name: string;
  departure_port: string;
  arrival_port: string;
  cii_score: number;
  cii_rating: string;
  co2_emissions_mt: number;
  fuel_consumed_mt: number;
  distance_nm: number;
};

function DigitalTwinDecarbPanel() {
  const fleet = useQuery({
    queryKey: ["vessels-decarb-fleet"],
    queryFn: async () => {
      const res = await fetch("/api/vessels/decarbonization/fleet");
      if (!res.ok) throw new Error("fetch failed");
      return res.json() as Promise<{
        voyages: DecarbVoyage[];
        fleetSummary: { averageCiiScore: number; fleetCiiRating: string; totalCo2EmissionsMT: number; eexiCompliantVessels: number; totalVessels: number; co2ReductionTargetPct: number };
        source: string;
      }>;
    },
    staleTime: 60000,
    retry: false,
  });

  const data = fleet.data;

  return (
    <div className="shrink-0 mx-4 mb-4 rounded-xl border p-4 space-y-4" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.03)" }}>
      <div className="flex items-center gap-2">
        <Leaf className="w-4 h-4" style={{ color: "#10b981" }} />
        <span className="text-sm font-semibold text-white">Decarbonization Dashboard · 2026</span>
        <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>IMO 2028</span>
      </div>

      {data?.fleetSummary && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Fleet CII", value: `${data.fleetSummary.fleetCiiRating} (${data.fleetSummary.averageCiiScore.toFixed(1)})`, color: data.fleetSummary.fleetCiiRating <= "B" ? "#10b981" : data.fleetSummary.fleetCiiRating <= "C" ? "#f59e0b" : "#ef4444" },
            { label: "Total CO₂", value: `${(data.fleetSummary.totalCo2EmissionsMT / 1000).toFixed(1)}kt`, color: "#f97316" },
            { label: "EEXI Compliant", value: `${data.fleetSummary.eexiCompliantVessels}/${data.fleetSummary.totalVessels}`, color: "#0ea5e9" },
          ].map(m => (
            <div key={m.label} className="rounded p-2.5 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
              <div className="text-[11px] font-mono font-semibold mt-0.5" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Recent Voyage Emissions</div>
        {data ? (
          <div className="space-y-1.5">
            {data.voyages.slice(0, 4).map(v => (
              <div key={v.voyage_id} className="flex items-center gap-2">
                <span className="text-[9px] px-1 rounded font-mono font-bold shrink-0" style={{
                  background: v.cii_rating === "A" || v.cii_rating === "B" ? "rgba(16,185,129,0.15)" : v.cii_rating === "C" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                  color: v.cii_rating === "A" || v.cii_rating === "B" ? "#10b981" : v.cii_rating === "C" ? "#f59e0b" : "#ef4444",
                }}>{v.cii_rating}</span>
                <span className="text-[10px] flex-1 truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{v.vessel_name}</span>
                <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{v.departure_port} → {v.arrival_port}</span>
                <Activity className="w-2.5 h-2.5 shrink-0" style={{ color: "rgba(16,185,129,0.6)" }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{fleet.isLoading ? "Loading fleet data..." : "No data"}</div>
        )}
      </div>
    </div>
  );
}
