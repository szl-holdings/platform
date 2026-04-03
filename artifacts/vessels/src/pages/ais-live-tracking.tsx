import { useState, useCallback, useRef } from "react";
import {
  Radio, AlertTriangle, RefreshCw,
  Globe, Search, Navigation,
} from "lucide-react";

const ACCENT = "#38bdf8";
const BG = { page: "#060a10", surface: "#090d14", elevated: "#0d1118" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)" } as const;
const TEXT = {
  primary: "rgba(255,255,255,0.88)",
  secondary: "rgba(255,255,255,0.55)",
  tertiary: "rgba(255,255,255,0.28)",
  muted: "rgba(255,255,255,0.14)",
} as const;

type VesselType = "tanker" | "bulker" | "container" | "lng" | "roro" | "other";
type VesselStatus = "underway" | "anchored" | "moored" | "drifting" | "not_under_command";
type AlertSeverity = "critical" | "high" | "medium" | "info";

interface LiveVessel {
  imo: string;
  name: string;
  vesselType: VesselType;
  flag: string;
  status: VesselStatus;
  lat: number;
  lng: number;
  speed: number;
  course: number;
  destination: string;
  eta: string;
  lastSignal: string;
  riskScore: number;
  aisDark: boolean;
  sanctionsFlag: boolean;
  alerts: AlertSeverity[];
}

const STATUS_CONFIG: Record<VesselStatus, { label: string; color: string; dot: string }> = {
  underway: { label: "Underway", color: "#22c55e", dot: "#22c55e" },
  anchored: { label: "Anchored", color: ACCENT, dot: ACCENT },
  moored: { label: "Moored", color: "#7ba3d4", dot: "#7ba3d4" },
  drifting: { label: "Drifting", color: "#f97316", dot: "#f97316" },
  not_under_command: { label: "Not Under Command", color: "#ef4444", dot: "#ef4444" },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  info: { color: ACCENT, bg: `${ACCENT}18` },
};

const MOCK_VESSELS: LiveVessel[] = [
  { imo: "9876543", name: "PACIFIC VOYAGER", vesselType: "tanker", flag: "🇧🇸", status: "underway", lat: 23.4, lng: -164.2, speed: 13.4, course: 248, destination: "LONG BEACH", eta: "Apr 12", lastSignal: "2m ago", riskScore: 82, aisDark: false, sanctionsFlag: false, alerts: ["high"] },
  { imo: "9765432", name: "MSC ZEUS", vesselType: "container", flag: "🇵🇦", status: "underway", lat: 1.2, lng: 104.8, speed: 18.2, course: 90, destination: "SINGAPORE", eta: "Apr 06", lastSignal: "1m ago", riskScore: 21, aisDark: false, sanctionsFlag: false, alerts: [] },
  { imo: "9654321", name: "ORION SPIRIT", vesselType: "lng", flag: "🇲🇭", status: "anchored", lat: 29.1, lng: 48.0, speed: 0.0, course: 0, destination: "PORTSMOUTH", eta: "TBD", lastSignal: "4m ago", riskScore: 34, aisDark: false, sanctionsFlag: false, alerts: ["info"] },
  { imo: "9543210", name: "ATLAS BULKER", vesselType: "bulker", flag: "🇲🇭", status: "underway", lat: -18.4, lng: 32.1, speed: 9.8, course: 164, destination: "DURBAN", eta: "Apr 09", lastSignal: "8m ago", riskScore: 55, aisDark: true, sanctionsFlag: false, alerts: ["critical", "medium"] },
  { imo: "9432109", name: "NEXUS PRIME", vesselType: "tanker", flag: "🇵🇦", status: "drifting", lat: 8.3, lng: -15.2, speed: 0.4, course: 22, destination: "UNKNOWN", eta: "—", lastSignal: "32m ago", riskScore: 91, aisDark: false, sanctionsFlag: true, alerts: ["critical"] },
  { imo: "9321098", name: "BLUE HORIZON", vesselType: "container", flag: "🇭🇰", status: "underway", lat: 51.8, lng: 1.4, speed: 12.1, course: 178, destination: "FELIXSTOWE", eta: "Apr 05", lastSignal: "3m ago", riskScore: 18, aisDark: false, sanctionsFlag: false, alerts: [] },
  { imo: "9210987", name: "CASPIAN TRADER", vesselType: "roro", flag: "🇬🇧", status: "moored", lat: 53.4, lng: -3.0, speed: 0.0, course: 0, destination: "—", eta: "—", lastSignal: "6m ago", riskScore: 12, aisDark: false, sanctionsFlag: false, alerts: [] },
];

const MAP_BOUNDS = { minLat: -60, maxLat: 75, minLng: -180, maxLng: 180 };

function lngToX(lng: number, width: number): number {
  return ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * width;
}

function latToY(lat: number, height: number): number {
  return ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * height;
}

function vesselMarkerColor(vessel: LiveVessel): string {
  if (vessel.sanctionsFlag) return "#ef4444";
  if (vessel.aisDark) return "#f97316";
  if (vessel.riskScore > 70) return "#f97316";
  return STATUS_CONFIG[vessel.status].color;
}

interface AisMapProps {
  vessels: LiveVessel[];
  selected: string;
  onSelect: (imo: string) => void;
}

function AisMap({ vessels, selected, onSelect }: AisMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const W = 900;
  const H = 520;

  const OCEAN_LINES = [
    { x1: 0, y1: H * 0.2, x2: W, y2: H * 0.25, opacity: 0.04 },
    { x1: 0, y1: H * 0.45, x2: W, y2: H * 0.42, opacity: 0.04 },
    { x1: 0, y1: H * 0.7, x2: W, y2: H * 0.68, opacity: 0.03 },
  ];

  const GRID_LNGS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
  const GRID_LATS = [60, 45, 30, 15, 0, -15, -30, -45];

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#061018" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        style={{ display: "block" }}
      >
        <defs>
          <radialGradient id="mapGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0a1824" />
            <stop offset="100%" stopColor="#040c14" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect width={W} height={H} fill="url(#mapGrad)" />

        {GRID_LNGS.map((lng) => (
          <line
            key={`vlng${lng}`}
            x1={lngToX(lng, W)} y1={0}
            x2={lngToX(lng, W)} y2={H}
            stroke="rgba(56,189,248,0.06)" strokeWidth="0.5"
          />
        ))}
        {GRID_LATS.map((lat) => (
          <line
            key={`vlat${lat}`}
            x1={0} y1={latToY(lat, H)}
            x2={W} y2={latToY(lat, H)}
            stroke="rgba(56,189,248,0.06)" strokeWidth="0.5"
          />
        ))}
        {OCEAN_LINES.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={`rgba(56,189,248,${l.opacity})`} strokeWidth="1" />
        ))}

        <text x={lngToX(0, W) + 3} y={latToY(51, H) - 2} fontSize="7" fill="rgba(255,255,255,0.14)" fontFamily="monospace">LONDON</text>
        <text x={lngToX(-74, W) + 3} y={latToY(40.7, H) - 2} fontSize="7" fill="rgba(255,255,255,0.14)" fontFamily="monospace">NEW YORK</text>
        <text x={lngToX(103, W) + 3} y={latToY(1.3, H) - 2} fontSize="7" fill="rgba(255,255,255,0.14)" fontFamily="monospace">SINGAPORE</text>
        <text x={lngToX(55, W) + 3} y={latToY(25.2, H) - 2} fontSize="7" fill="rgba(255,255,255,0.14)" fontFamily="monospace">DUBAI</text>
        <text x={lngToX(139.7, W) + 3} y={latToY(35.7, H) - 2} fontSize="7" fill="rgba(255,255,255,0.14)" fontFamily="monospace">TOKYO</text>
        <text x={lngToX(121.5, W) + 3} y={latToY(31.2, H) - 2} fontSize="7" fill="rgba(255,255,255,0.14)" fontFamily="monospace">SHANGHAI</text>

        {vessels.map((vessel) => {
          const x = lngToX(vessel.lng, W);
          const y = latToY(vessel.lat, H);
          const isSelected = vessel.imo === selected;
          const isHovered = vessel.imo === hovered;
          const color = vesselMarkerColor(vessel);
          const headingRad = (vessel.course * Math.PI) / 180;
          const arrowLen = vessel.speed > 0 ? 12 : 0;
          const arrowX = x + Math.sin(headingRad) * arrowLen;
          const arrowY = y - Math.cos(headingRad) * arrowLen;

          return (
            <g
              key={vessel.imo}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(vessel.imo)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(vessel.imo)}
            >
              {isSelected && (
                <circle cx={x} cy={y} r={16} fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
              )}
              {arrowLen > 0 && (
                <line x1={x} y1={y} x2={arrowX} y2={arrowY} stroke={color} strokeWidth="1.5" opacity="0.7" markerEnd="url(#arrowhead)" />
              )}
              <circle
                cx={x} cy={y} r={isSelected ? 7 : isHovered ? 6 : 5}
                fill={color}
                opacity={isSelected ? 1 : 0.85}
                filter={isSelected ? "url(#glow)" : undefined}
              />
              {(vessel.aisDark || vessel.sanctionsFlag) && (
                <circle cx={x + 5} cy={y - 5} r={3} fill="#ef4444" />
              )}
              {vessel.alerts.length > 0 && !vessel.aisDark && !vessel.sanctionsFlag && (
                <circle cx={x + 5} cy={y - 5} r={2.5} fill={SEVERITY_CONFIG[vessel.alerts[0]].color} />
              )}
              {(isSelected || isHovered) && (
                <text
                  x={x + 8} y={y + 4}
                  fontSize="8"
                  fill={TEXT.primary}
                  fontFamily="monospace"
                  style={{ pointerEvents: "none" }}
                >
                  {vessel.name.split(" ").slice(0, 2).join(" ")}
                </text>
              )}
            </g>
          );
        })}

        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill={ACCENT} opacity="0.7" />
          </marker>
        </defs>
      </svg>

      <div className="absolute top-3 left-3 flex flex-col gap-1" style={{ pointerEvents: "none" }}>
        {[
          { color: "#22c55e", label: "Underway" },
          { color: ACCENT, label: "Anchored/Moored" },
          { color: "#f97316", label: "Drifting/High Risk" },
          { color: "#ef4444", label: "Sanctions/AIS Dark" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 text-[9px] font-mono" style={{ color: TEXT.muted }}>
        AIS DEMO · {vessels.length} vessels · click marker to select
      </div>
    </div>
  );
}

interface DetailRowProps { label: string; value: string; color?: string }

function DetailRow({ label, value, color }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
      <span className="text-[11px]" style={{ color: TEXT.muted }}>{label}</span>
      <span className="text-[11px] font-mono" style={{ color: color ?? TEXT.secondary }}>{value}</span>
    </div>
  );
}

function VesselDetail({ vessel }: { vessel: LiveVessel }) {
  const status = STATUS_CONFIG[vessel.status];
  return (
    <div className="h-full overflow-y-auto" style={{ background: BG.surface, borderLeft: `1px solid ${BORDER.subtle}` }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {vessel.aisDark && <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>AIS DARK</span>}
              {vessel.sanctionsFlag && <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>SANCTIONS</span>}
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${status.color}18`, color: status.color }}>{status.label}</span>
            </div>
            <p className="text-[14px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>{vessel.flag} {vessel.name}</p>
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>IMO {vessel.imo} · Last: {vessel.lastSignal}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[22px] font-bold font-mono" style={{ color: vessel.riskScore > 70 ? "#ef4444" : vessel.riskScore > 40 ? "#f97316" : "#22c55e" }}>{vessel.riskScore}</p>
            <p className="text-[10px]" style={{ color: TEXT.muted }}>risk score</p>
          </div>
        </div>
        {vessel.riskScore > 50 && (
          <div className="rounded-lg px-3 py-2.5 flex items-center gap-2" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "#f97316" }} />
            <p className="text-[11px]" style={{ color: "#f97316" }}>Risk score {vessel.riskScore} — elevated monitoring active</p>
          </div>
        )}
      </div>
      <div className="px-5 py-4">
        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: TEXT.muted }}>Position & Navigation</p>
        <DetailRow label="Latitude" value={vessel.lat.toFixed(4) + "°"} />
        <DetailRow label="Longitude" value={vessel.lng.toFixed(4) + "°"} />
        <DetailRow label="Speed" value={vessel.speed.toFixed(1) + " kn"} color={vessel.speed > 0 ? TEXT.secondary : TEXT.muted} />
        <DetailRow label="Course" value={vessel.course + "°"} />
        <DetailRow label="Destination" value={vessel.destination} color={ACCENT} />
        <DetailRow label="ETA" value={vessel.eta} />
        <p className="text-[10px] uppercase tracking-widest mt-4 mb-3" style={{ color: TEXT.muted }}>Risk Intelligence</p>
        <DetailRow label="AIS Status" value={vessel.aisDark ? "DARK — signal lost" : "Normal"} color={vessel.aisDark ? "#ef4444" : "#22c55e"} />
        <DetailRow label="Sanctions" value={vessel.sanctionsFlag ? "FLAGGED — review required" : "Clear"} color={vessel.sanctionsFlag ? "#ef4444" : "#22c55e"} />
      </div>
      {vessel.alerts.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: TEXT.muted }}>Active Alerts</p>
          <div className="space-y-2">
            {vessel.alerts.map((sev, i) => {
              const s = SEVERITY_CONFIG[sev];
              return (
                <div key={i} className="rounded-md px-3 py-2.5 flex items-center gap-2" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: s.color }} />
                  <span className="text-[11px] capitalize" style={{ color: s.color }}>{sev} severity alert</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AisLiveTrackingPage() {
  const [selected, setSelected] = useState<string>("9876543");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"map" | "list">("map");
  const [isFetching, setIsFetching] = useState(false);

  const selectedVessel = MOCK_VESSELS.find((v) => v.imo === selected);
  const filtered = MOCK_VESSELS.filter(
    (v) => search === "" || v.name.toLowerCase().includes(search.toLowerCase()) || v.imo.includes(search)
  );

  const stats = {
    total: MOCK_VESSELS.length,
    underway: MOCK_VESSELS.filter((v) => v.status === "underway").length,
    alerts: MOCK_VESSELS.filter((v) => v.alerts.length > 0).length,
    dark: MOCK_VESSELS.filter((v) => v.aisDark).length,
    sanctions: MOCK_VESSELS.filter((v) => v.sanctionsFlag).length,
  };

  const handleRefresh = useCallback(() => {
    setIsFetching(true);
    setTimeout(() => setIsFetching(false), 800);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG.page }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3">
          <Radio className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>AIS Live Tracking</span>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {stats.underway} vessels underway
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER.muted}` }}>
            {(["map", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 text-[10px] font-medium capitalize transition-colors"
                style={{ background: view === v ? `${ACCENT}18` : "transparent", color: view === v ? ACCENT : TEXT.muted }}
              >
                {v === "map" ? "Map" : "List"}
              </button>
            ))}
          </div>
          <button onClick={handleRefresh} className="rounded-lg p-1.5 hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} style={{ color: TEXT.tertiary }} />
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: TEXT.muted }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vessels…"
              className="rounded-lg pl-8 pr-3 py-1.5 text-[11px] outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.muted}`, color: TEXT.primary, width: 160 }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-px shrink-0" style={{ background: BORDER.subtle }}>
        {[
          { label: "Vessels tracked", value: String(stats.total), color: ACCENT },
          { label: "Underway", value: String(stats.underway), color: "#22c55e" },
          { label: "Active alerts", value: String(stats.alerts), color: stats.alerts > 0 ? "#f97316" : TEXT.tertiary },
          { label: "AIS dark", value: String(stats.dark), color: stats.dark > 0 ? "#ef4444" : TEXT.tertiary },
          { label: "Sanctions flags", value: String(stats.sanctions), color: stats.sanctions > 0 ? "#ef4444" : TEXT.tertiary },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3" style={{ background: BG.page }}>
            <p className="text-[10px] mb-1" style={{ color: TEXT.muted }}>{s.label}</p>
            <p className="text-[20px] font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {view === "map" ? (
        <div className="flex-1 grid grid-cols-[1fr_300px] overflow-hidden">
          <div className="relative overflow-hidden">
            <AisMap vessels={filtered} selected={selected} onSelect={setSelected} />
          </div>
          {selectedVessel && <VesselDetail vessel={selectedVessel} />}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-[1fr_300px] overflow-hidden">
          <div className="overflow-y-auto" style={{ borderRight: `1px solid ${BORDER.subtle}` }}>
            {filtered.map((vessel) => {
              const status = STATUS_CONFIG[vessel.status];
              const isSelected = selected === vessel.imo;
              return (
                <button
                  key={vessel.imo}
                  onClick={() => setSelected(vessel.imo)}
                  className="w-full text-left px-4 py-3 transition-all hover:bg-white/[0.02]"
                  style={{
                    borderBottom: `1px solid ${BORDER.subtle}`,
                    background: isSelected ? `${ACCENT}08` : undefined,
                    borderLeft: isSelected ? `2px solid ${ACCENT}` : "2px solid transparent",
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: status.dot }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12px] font-semibold truncate" style={{ color: TEXT.primary }}>{vessel.flag} {vessel.name}</p>
                          {vessel.aisDark && <span className="rounded px-1 text-[9px] font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>AIS DARK</span>}
                          {vessel.sanctionsFlag && <span className="rounded px-1 text-[9px] font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>SANCTIONS</span>}
                        </div>
                        <p className="text-[10px]" style={{ color: TEXT.tertiary }}>IMO {vessel.imo} · {status.label} · {vessel.lastSignal}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold font-mono" style={{ color: vessel.riskScore > 70 ? "#ef4444" : vessel.riskScore > 40 ? "#f97316" : "#22c55e" }}>{vessel.riskScore}</p>
                      <p className="text-[9px]" style={{ color: TEXT.muted }}>risk</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedVessel && <VesselDetail vessel={selectedVessel} />}
        </div>
      )}
    </div>
  );
}
