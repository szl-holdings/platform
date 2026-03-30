import { useState, useMemo } from "react";
import { Link } from "wouter";
import { vesselsDomainMockData, type VesselProfile } from "@/data/mock-data";
import { Badge } from "@workspace/shared-ui/ui/badge";
import {
  X, Ship, MapPin, Radio, Navigation, Clock, Filter, ChevronRight,
  AlertTriangle, Anchor, Wrench, Activity, TrendingUp, TrendingDown
} from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const { vessels, fleetExceptions } = vesselsDomainMockData;

const statusColors: Record<string, string> = {
  at_sea: "#22c55e",
  in_port: "#0ea5e9",
  anchored: "#f59e0b",
  maintenance: "#ef4444",
  delayed: "#f97316",
  loading: "#a78bfa",
  risk_watch: "#f59e0b",
  exception_active: "#ef4444",
};

const statusLabels: Record<string, string> = {
  at_sea: "At Sea",
  in_port: "In Port",
  anchored: "Anchored",
  maintenance: "Maintenance",
  delayed: "Delayed",
  loading: "Loading",
  risk_watch: "Risk Watch",
  exception_active: "Exception",
};

const portLocations = [
  { name: "Singapore", lat: 1.3, lon: 103.8 },
  { name: "Rotterdam", lat: 51.9, lon: 4.5 },
  { name: "Shanghai", lat: 31.2, lon: 121.5 },
  { name: "Fujairah", lat: 25.2, lon: 56.3 },
  { name: "Yokohama", lat: 35.4, lon: 139.6 },
  { name: "Mumbai", lat: 19.1, lon: 72.9 },
  { name: "Hamburg", lat: 53.5, lon: 10.0 },
  { name: "Port Hedland", lat: -20.3, lon: 118.6 },
  { name: "Murmansk", lat: 68.9, lon: 33.1 },
  { name: "Genoa", lat: 44.4, lon: 8.9 },
];

const routeLines = [
  { from: { lat: -20.3, lon: 118.6 }, to: { lat: 35.4, lon: 139.6 }, vesselId: 1, color: "#22c55e" },
  { from: { lat: 40.7, lon: -74.0 }, to: { lat: 53.5, lon: 10.0 }, vesselId: 2, color: "#0ea5e9" },
  { from: { lat: 26.5, lon: 50.2 }, to: { lat: 25.2, lon: 56.3 }, vesselId: 3, color: "#22c55e" },
  { from: { lat: 53.5, lon: 8.6 }, to: { lat: 59.9, lon: 10.7 }, vesselId: 4, color: "#f59e0b" },
  { from: { lat: -32.9, lon: 151.7 }, to: { lat: -27.5, lon: 153.0 }, vesselId: 5, color: "#22c55e" },
  { from: { lat: 44.4, lon: 22.8 }, to: { lat: 44.4, lon: 8.9 }, vesselId: 7, color: "#ef4444" },
  { from: { lat: 68.4, lon: 17.4 }, to: { lat: 68.9, lon: 33.1 }, vesselId: 8, color: "#f97316" },
  { from: { lat: 26.5, lon: 50.2 }, to: { lat: 29.9, lon: 121.6 }, vesselId: 9, color: "#a78bfa" },
  { from: { lat: -4.8, lon: 11.9 }, to: { lat: -33.9, lon: 18.4 }, vesselId: 10, color: "#f59e0b" },
];

function toMapCoords(lat: number, lon: number, W: number, H: number) {
  const x = ((lon + 180) / 360) * W;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = H / 2 - (mercN / Math.PI) * (H / 2);
  return { x, y };
}

function VesselSidePanel({ vessel, onClose }: { vessel: VesselProfile; onClose: () => void }) {
  const exceptions = fleetExceptions.filter(e => e.vesselId === vessel.id && e.status === "active");
  const sc = statusColors[vessel.status] || "#666";
  const scLabel = statusLabels[vessel.status] || vessel.status;

  return (
    <div className="w-[340px] h-full bg-[#060e1a]/98 backdrop-blur-xl border-l border-sky-500/10 flex flex-col overflow-hidden shrink-0 z-20">
      <div className="p-4 border-b border-sky-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <Ship className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-sky-50">{vessel.name}</h3>
            <p className="text-[10px] text-sky-400/50 font-mono">IMO {vessel.imo} · {vessel.flag}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-sky-500/10 text-sky-400/50 hover:text-sky-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium" style={{ color: sc, borderColor: `${sc}30`, backgroundColor: `${sc}10` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: sc }} />
            {scLabel}
          </span>
          <span className="text-[10px] text-sky-400/40 font-mono">{vessel.type}</span>
          {exceptions.length > 0 && (
            <Badge variant="outline" className="text-[9px] text-red-400 border-red-500/20 bg-red-500/10">
              {exceptions.length} exception{exceptions.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Latitude", value: `${vessel.lat.toFixed(4)}°` },
            { label: "Longitude", value: `${vessel.lon.toFixed(4)}°` },
            { label: "Speed", value: `${vessel.currentSpeed} kn` },
            { label: "Heading", value: `${vessel.heading}°` },
          ].map(item => (
            <div key={item.label} className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
              <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{item.label}</p>
              <p className="text-xs font-mono text-sky-100 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10 space-y-2">
          <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Route Progress</p>
          <div className="flex items-center gap-2 text-xs text-sky-400/60">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{vessel.lastPort}</span>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="truncate">{vessel.nextPort}</span>
          </div>
          <div className="relative h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-sky-400 rounded-full transition-all" style={{ width: `${vessel.routeProgress}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-sky-400/40">{vessel.routeProgress}% complete</span>
            <span className={cn("font-mono", vessel.etaDelta < 0 ? "text-emerald-400" : vessel.etaDelta > 0 ? "text-orange-400" : "text-sky-400/50")}>
              {vessel.etaDelta < 0 ? `${Math.abs(vessel.etaDelta)}h ahead` : vessel.etaDelta > 0 ? `${vessel.etaDelta}h delayed` : "On schedule"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">TCE</p>
            <p className="text-xs font-mono text-sky-100 mt-0.5">{vessel.tce > 0 ? `$${vessel.tce.toLocaleString()}/d` : "—"}</p>
          </div>
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Utilization</p>
            <p className="text-xs font-mono text-sky-100 mt-0.5">{vessel.utilization > 0 ? `${vessel.utilization}%` : "Unavailable"}</p>
          </div>
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">CII Rating</p>
            <p className={cn("text-xs font-mono font-bold mt-0.5", vessel.ciiRating === "A" ? "text-emerald-400" : vessel.ciiRating === "B" ? "text-sky-400" : "text-amber-400")}>{vessel.ciiRating}</p>
          </div>
          <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Readiness</p>
            <p className={cn("text-xs font-mono font-bold mt-0.5", vessel.readinessScore >= 80 ? "text-emerald-400" : vessel.readinessScore >= 60 ? "text-amber-400" : "text-red-400")}>{vessel.readinessScore}/100</p>
          </div>
        </div>

        {exceptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Active Exceptions</p>
            {exceptions.map(exc => (
              <div key={exc.id} className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5">
                <p className="text-[10px] font-medium text-red-300">{exc.title}</p>
                <p className="text-[9px] text-sky-400/50 mt-0.5">{exc.description.slice(0, 80)}...</p>
              </div>
            ))}
          </div>
        )}

        <Link href={`/vessel/${vessel.id}`}>
          <button className="w-full text-xs text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/40 rounded-lg py-2 transition-all">
            View Full Detail <ChevronRight className="w-3 h-3 inline ml-1" />
          </button>
        </Link>
      </div>
    </div>
  );
}

type FilterState = {
  region: string;
  status: string;
  vesselClass: string;
};

export default function FleetMapPage() {
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile | null>(null);
  const [hoveredVessel, setHoveredVessel] = useState<VesselProfile | null>(null);
  const [filters, setFilters] = useState<FilterState>({ region: "all", status: "all", vesselClass: "all" });
  const [showFilters, setShowFilters] = useState(false);

  const W = 1200;
  const H = 560;

  const filteredVessels = useMemo(() => {
    return vessels.filter(v => {
      if (filters.region !== "all" && v.region !== filters.region) return false;
      if (filters.status !== "all" && v.status !== filters.status) return false;
      if (filters.vesselClass !== "all" && v.vesselClass !== filters.vesselClass) return false;
      return true;
    });
  }, [filters]);

  const regions = ["all", ...Array.from(new Set(vessels.map(v => v.region)))];
  const statuses = ["all", ...Array.from(new Set(vessels.map(v => v.status)))];
  const vesselClasses = ["all", ...Array.from(new Set(vessels.map(v => v.vesselClass)))];

  return (
    <div className="flex flex-col h-full bg-[#060e1a]">
      <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-3 shrink-0">
        <div>
          <h1 className="font-display text-sm font-bold text-sky-50">Fleet Map</h1>
          <p className="text-[10px] text-sky-400/40">Live vessel positions · AIS-based tracking</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-3">
            {Object.entries({ at_sea: "#22c55e", in_port: "#0ea5e9", delayed: "#f97316", maintenance: "#ef4444", exception_active: "#ef4444" }).map(([key, color]) => (
              <span key={key} className="flex items-center gap-1 text-[10px] text-sky-400/50">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {statusLabels[key]}
              </span>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] transition-all", showFilters ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/50 hover:text-sky-300")}
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="px-4 py-2 border-b border-sky-500/10 flex items-start gap-4 shrink-0 flex-wrap">
          {[
            { label: "Region", key: "region" as const, opts: regions },
            { label: "Status", key: "status" as const, opts: statuses },
            { label: "Class", key: "vesselClass" as const, opts: vesselClasses },
          ].map(({ label, key, opts }) => (
            <div key={key} className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-sky-400/40 shrink-0">{label}:</span>
              <div className="flex items-center gap-1 flex-wrap">
                {opts.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFilters(f => ({ ...f, [key]: opt }))}
                    className={cn("text-[10px] px-2 py-1 rounded border transition-all capitalize", filters[key] === opt ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}
                  >
                    {opt === "all" ? "All" : statusLabels[opt] || opt.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <span className="ml-auto text-[10px] text-sky-400/40 self-center">{filteredVessels.length} of {vessels.length} shown</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="ocean-bg" cx="50%" cy="40%" r="80%">
                <stop offset="0%" stopColor="#0d2847" />
                <stop offset="60%" stopColor="#080f1e" />
                <stop offset="100%" stopColor="#060c18" />
              </radialGradient>
              <filter id="vessel-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="port-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <rect width={W} height={H} fill="url(#ocean-bg)" />

            <g opacity="0.08" stroke="rgba(56,189,248,0.5)" strokeWidth="0.4" fill="none">
              {[-60, -30, 0, 30, 60].map(lat => {
                const { y } = toMapCoords(lat, 0, W, H);
                return <line key={`lat-${lat}`} x1={0} y1={y} x2={W} y2={y} strokeDasharray="3 5" />;
              })}
              {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
                const { x } = toMapCoords(0, lon, W, H);
                return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={H} strokeDasharray="3 5" />;
              })}
            </g>

            <g opacity="0.12" fill="rgba(56,189,248,0.05)" stroke="rgba(56,189,248,0.12)" strokeWidth="0.6">
              {[
                "M225,100 L230,95 L240,95 L245,100 L250,110 L260,115 L270,108 L280,100 L290,98 L295,100 L300,110 L305,115 L310,125 L315,135 L320,150 L325,160 L330,170 L335,175 L330,180 L320,182 L310,180 L305,175 L300,170 L295,165 L290,158 L280,155 L270,160 L260,170 L255,180 L250,185 L240,188 L235,185 L230,180 L225,170 L220,160 L215,150 L220,140 L225,130 L225,120 Z",
                "M430,85 L445,78 L460,80 L475,90 L480,105 L485,115 L490,125 L495,135 L500,145 L505,155 L510,165 L520,170 L535,172 L545,175 L550,180 L540,185 L530,190 L515,188 L500,185 L490,180 L480,170 L470,160 L460,155 L450,150 L445,140 L440,130 L435,120 L430,110 L428,100 Z",
                "M540,110 L560,105 L580,108 L600,115 L620,118 L640,120 L660,115 L680,110 L700,108 L720,112 L730,120 L740,130 L730,140 L720,148 L700,150 L680,148 L660,145 L640,140 L620,138 L600,140 L580,145 L560,148 L550,145 L545,135 L540,125 Z",
                "M620,170 L640,165 L660,168 L680,175 L700,185 L710,195 L700,210 L690,220 L680,230 L670,235 L660,230 L650,220 L640,210 L635,200 L630,190 L625,180 Z",
                "M340,230 L360,215 L380,210 L390,215 L395,225 L400,240 L395,260 L385,280 L375,295 L365,310 L355,320 L345,325 L338,315 L335,300 L332,285 L330,270 L332,255 L335,240 Z",
                "M720,240 L740,230 L760,232 L780,240 L790,255 L785,275 L775,295 L765,310 L755,320 L745,325 L735,320 L728,310 L722,295 L720,275 L718,260 Z",
                "M830,210 L855,200 L875,205 L890,215 L895,235 L890,255 L880,275 L870,290 L855,295 L845,290 L835,275 L828,255 L826,235 Z",
              ].map((d, i) => <path key={i} d={d} />)}
            </g>

            {routeLines.map(route => {
              const from = toMapCoords(route.from.lat, route.from.lon, W, H);
              const to = toMapCoords(route.to.lat, route.to.lon, W, H);
              const vessel = vessels.find(v => v.id === route.vesselId);
              if (!vessel || !filteredVessels.find(v => v.id === vessel.id)) return null;
              return (
                <line key={route.vesselId}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={route.color} strokeWidth="0.8" opacity="0.2" strokeDasharray="4 4"
                />
              );
            })}

            {portLocations.map(port => {
              const { x, y } = toMapCoords(port.lat, port.lon, W, H);
              return (
                <g key={port.name} filter="url(#port-glow)">
                  <rect x={x - 3} y={y - 3} width={6} height={6} fill="#0ea5e9" opacity={0.5} transform={`rotate(45 ${x} ${y})`} />
                  <text x={x + 6} y={y + 3} fill="rgba(56,189,248,0.4)" fontSize="7" fontFamily="monospace">{port.name}</text>
                </g>
              );
            })}

            {(() => {
              const CLUSTER_THRESHOLD = 30;
              const mapped = filteredVessels.map(v => ({ v, ...toMapCoords(v.lat, v.lon, W, H) }));
              const visited = new Set<number>();
              const clusters: { cx: number; cy: number; vessels: VesselProfile[] }[] = [];

              mapped.forEach((a, i) => {
                if (visited.has(i)) return;
                const group: typeof mapped = [a];
                visited.add(i);
                mapped.forEach((b, j) => {
                  if (i === j || visited.has(j)) return;
                  const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
                  if (dist < CLUSTER_THRESHOLD) {
                    group.push(b);
                    visited.add(j);
                  }
                });
                clusters.push({
                  cx: group.reduce((s, p) => s + p.x, 0) / group.length,
                  cy: group.reduce((s, p) => s + p.y, 0) / group.length,
                  vessels: group.map(g => g.v),
                });
              });

              return clusters.map((cluster, ci) => {
                if (cluster.vessels.length === 1) {
                  const v = cluster.vessels[0];
                  const { x, y } = toMapCoords(v.lat, v.lon, W, H);
                  const color = statusColors[v.status] || "#666";
                  const isSelected = selectedVessel?.id === v.id;
                  const isHovered = hoveredVessel?.id === v.id;
                  const hasAlert = v.alertCount > 0;
                  return (
                    <g key={v.id}
                      onMouseEnter={() => setHoveredVessel(v)}
                      onMouseLeave={() => setHoveredVessel(null)}
                      onClick={() => setSelectedVessel(isSelected ? null : v)}
                      style={{ cursor: "pointer" }}
                      role="button"
                      aria-label={`${v.name} — ${statusLabels[v.status]}`}
                    >
                      <circle cx={x} cy={y} r={20} fill="transparent" />
                      {(isSelected || isHovered) && <circle cx={x} cy={y} r={14} fill={color} opacity={0.1} />}
                      {v.status === "at_sea" && (
                        <circle cx={x} cy={y} r={6} fill="none" stroke={color} strokeWidth="0.8" opacity="0.35">
                          <animate attributeName="r" from="5" to="14" dur="2.4s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.35" to="0" dur="2.4s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {isSelected && (
                        <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth="1" opacity={0.5}>
                          <animate attributeName="r" from="10" to="20" dur="1.6s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.5" to="0" dur="1.6s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={x} cy={y} r={isSelected || isHovered ? 6 : 4} fill={color} filter={isSelected || isHovered ? "url(#vessel-glow)" : undefined} />
                      {hasAlert && !isSelected && (
                        <circle cx={x + 4} cy={y - 4} r={3} fill="#ef4444">
                          <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                }

                const { cx, cy } = cluster;
                const hasAlert = cluster.vessels.some(v => v.alertCount > 0);
                const hasCritical = cluster.vessels.some(v => ["exception_active", "maintenance"].includes(v.status));
                const clusterColor = hasCritical ? "#ef4444" : hasAlert ? "#f97316" : "#0ea5e9";
                const isSelected = cluster.vessels.some(v => selectedVessel?.id === v.id);

                return (
                  <g key={`cluster-${ci}`}
                    onClick={() => {
                      const nonSelected = cluster.vessels.find(v => selectedVessel?.id !== v.id);
                      setSelectedVessel(nonSelected || null);
                    }}
                    style={{ cursor: "pointer" }}
                    role="button"
                    aria-label={`${cluster.vessels.length} vessels clustered`}
                  >
                    <circle cx={cx} cy={cy} r={22} fill={clusterColor} opacity={0.08} />
                    <circle cx={cx} cy={cy} r={16} fill={clusterColor} opacity={0.12} />
                    <circle cx={cx} cy={cy} r={12} fill={clusterColor} opacity={0.25} />
                    {isSelected && (
                      <circle cx={cx} cy={cy} r={14} fill="none" stroke={clusterColor} strokeWidth="1" opacity={0.6}>
                        <animate attributeName="r" from="12" to="24" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <text x={cx} y={cy + 4} textAnchor="middle" fill={clusterColor} fontSize="9" fontWeight="700" fontFamily="monospace">{cluster.vessels.length}</text>
                    {hasAlert && (
                      <circle cx={cx + 10} cy={cy - 10} r={4} fill="#ef4444">
                        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              });
            })()}
          </svg>

          {hoveredVessel && !selectedVessel && (() => {
            const { x, y } = toMapCoords(hoveredVessel.lat, hoveredVessel.lon, W, H);
            const pctX = (x / W) * 100;
            const pctY = (y / H) * 100;
            const color = statusColors[hoveredVessel.status] || "#666";
            return (
              <div
                className="absolute z-10 bg-[#0a1628]/98 backdrop-blur border border-sky-500/20 rounded-xl shadow-2xl p-3 pointer-events-none"
                style={{ left: `${Math.min(Math.max(pctX, 20), 80)}%`, top: `${Math.max(pctY - 5, 5)}%`, transform: "translate(-50%, -110%)", minWidth: 220 }}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-xs font-bold text-sky-100">{hoveredVessel.name}</p>
                  <span className="text-[9px] font-mono text-sky-400/50">IMO {hoveredVessel.imo}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-sky-200/70 capitalize">{statusLabels[hoveredVessel.status]}</span>
                  {hoveredVessel.currentSpeed > 0 && <span className="text-[10px] text-sky-400/40 ml-auto font-mono">{hoveredVessel.currentSpeed} kn</span>}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-sky-400/50">
                  <Navigation className="w-2.5 h-2.5" />
                  <span>{hoveredVessel.nextPort}</span>
                  {hoveredVessel.etaDelta !== 0 && (
                    <span className={cn("ml-auto font-mono", hoveredVessel.etaDelta < 0 ? "text-emerald-400" : "text-orange-400")}>
                      {hoveredVessel.etaDelta > 0 ? `+${hoveredVessel.etaDelta}h` : `${hoveredVessel.etaDelta}h`}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="absolute bottom-3 right-3 text-[10px] text-sky-400/40 font-mono bg-[#0a1628]/80 backdrop-blur rounded-lg px-3 py-2 border border-sky-500/10">
            <Radio className="w-3 h-3 inline mr-1 text-emerald-400 animate-pulse" />
            {filteredVessels.length} vessels · AIS live
          </div>
        </div>

        {selectedVessel && (
          <VesselSidePanel vessel={selectedVessel} onClose={() => setSelectedVessel(null)} />
        )}
      </div>

      {!selectedVessel && (
        <div className="px-4 py-2 border-t border-sky-500/10 flex items-center gap-4 shrink-0">
          {vessels.map(v => {
            const color = statusColors[v.status] || "#666";
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVessel(v)}
                className="flex items-center gap-1.5 text-[10px] text-sky-400/50 hover:text-sky-200 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {v.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
