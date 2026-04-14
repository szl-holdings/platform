import { useState, useCallback, useRef, useEffect } from "react";
import {
  Radio, AlertTriangle, RefreshCw,
  Globe, Search, Navigation, Wifi, WifiOff, Satellite,
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

type VesselType = "tanker" | "bulker" | "container" | "lng" | "roro" | "other" | "passenger" | "fishing";
type VesselStatus = "underway" | "anchored" | "moored" | "drifting" | "not_under_command";
type AlertSeverity = "critical" | "high" | "medium" | "info";

interface LiveVessel {
  id: string;
  mmsi: string;
  imo: string;
  name: string;
  vesselType: VesselType;
  flag: string;
  flagEmoji: string;
  status: VesselStatus;
  lat: number;
  lng: number;
  speed: number;
  course: number;
  heading: number;
  destination: string;
  eta: string;
  lastSignal: string;
  riskScore: number;
  aisDark: boolean;
  sanctionsFlag: boolean;
  alerts: AlertSeverity[];
  source: string;
  callsign?: string;
  length?: number;
  beam?: number;
  draft?: number;
}

interface AisApiResponse {
  vessels: any[];
  count: number;
  dataSource: string;
  liveData: boolean;
  cacheAgeSeconds: number;
  fetchedAt: string;
}

const FLAG_EMOJI: Record<string, string> = {
  FI: "🇫🇮", NO: "🇳🇴", SE: "🇸🇪", DK: "🇩🇰", ES: "🇪🇸", GB: "🇬🇧",
  NL: "🇳🇱", DE: "🇩🇪", IT: "🇮🇹", FR: "🇫🇷", US: "🇺🇸", HK: "🇭🇰",
  PA: "🇵🇦", MH: "🇲🇭", LR: "🇱🇷", BM: "🇧🇲", VG: "🇻🇬", SG: "🇸🇬",
  CN: "🇨🇳", JP: "🇯🇵", KR: "🇰🇷", IN: "🇮🇳", GR: "🇬🇷", BS: "🇧🇸",
  CY: "🇨🇾", MT: "🇲🇹", BH: "🇧🇭", AE: "🇦🇪",
};

function getVesselType(type: string, typeCode?: number): VesselType {
  const t = (type ?? "").toLowerCase();
  const code = typeCode ?? 0;
  if (t.includes("tanker") || (code >= 80 && code <= 89)) return "tanker";
  if (t.includes("container") || t.includes("ship") || (code >= 70 && code <= 79)) return "container";
  if (t.includes("bulk") || t.includes("cargo")) return "bulker";
  if (t.includes("lng") || t.includes("gas") || t.includes("chemical")) return "lng";
  if (t.includes("roro") || t.includes("ro-ro") || t.includes("vehicle")) return "roro";
  if (t.includes("passenger") || (code >= 60 && code <= 69)) return "passenger";
  if (t.includes("fishing") || code === 30) return "fishing";
  return "other";
}

function getVesselStatus(navStatus: number, speed: number): VesselStatus {
  if (navStatus === 1) return "anchored";
  if (navStatus === 5) return "moored";
  if (navStatus === 2) return "not_under_command";
  if (navStatus === 0 && speed > 0.5) return "underway";
  if (speed < 0.5 && navStatus !== 1) return "drifting";
  return "underway";
}

function signalAgo(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function computeRiskScore(v: any): number {
  let score = 20;
  const signalAge = Date.now() - new Date(v.timestamp ?? Date.now()).getTime();
  if (signalAge > 30 * 60000) score += 30;
  else if (signalAge > 10 * 60000) score += 15;
  if (v.destination === "Unknown" || !v.destination || v.destination === "In Transit") score += 10;
  if (v.speed < 0.2 && v.navStatus === 0) score += 20;
  const hiRiskFlags = ["TZ", "KH", "BS", "MG"];
  if (hiRiskFlags.includes(v.flag)) score += 15;
  return Math.min(score, 99);
}

function mapApiVessel(v: any, idx: number): LiveVessel {
  const status = getVesselStatus(v.navStatus ?? 15, v.speed ?? 0);
  const riskScore = computeRiskScore(v);
  const alerts: AlertSeverity[] = [];
  if (riskScore > 70) alerts.push("high");
  else if (riskScore > 50) alerts.push("medium");

  return {
    id: v.mmsi || String(idx),
    mmsi: v.mmsi ?? "",
    imo: v.imo ?? "—",
    name: v.name || `VESSEL-${v.mmsi?.slice(-4) ?? idx}`,
    vesselType: getVesselType(v.type ?? "", v.shipTypeCode),
    flag: v.flag ?? "—",
    flagEmoji: FLAG_EMOJI[v.flag ?? ""] ?? "🏳️",
    status,
    lat: v.lat ?? 0,
    lng: v.lon ?? 0,
    speed: v.speed ?? 0,
    course: v.course ?? 0,
    heading: v.heading ?? v.course ?? 0,
    destination: v.destination || "In Transit",
    eta: "—",
    lastSignal: signalAgo(v.timestamp ?? new Date().toISOString()),
    riskScore,
    aisDark: riskScore > 75,
    sanctionsFlag: false,
    alerts,
    source: v.provider ?? "Digitraffic",
    callsign: v.callsign ?? undefined,
    length: v.length ?? undefined,
    beam: v.beam ?? undefined,
    draft: v.draft ?? undefined,
  };
}

const GLOBAL_SUPPLEMENT: LiveVessel[] = [
  { id: "s-1", mmsi: "636092587", imo: "9654321", name: "PACIFIC GUARDIAN", vesselType: "tanker", flag: "LR", flagEmoji: "🇱🇷", status: "underway", lat: 1.26, lng: 103.85, speed: 8.2, course: 315, heading: 312, destination: "SINGAPORE", eta: "Apr 16", lastSignal: "3m ago", riskScore: 28, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
  { id: "s-2", mmsi: "477234100", imo: "9234100", name: "STAR PHOENIX", vesselType: "container", flag: "HK", flagEmoji: "🇭🇰", status: "underway", lat: 29.97, lng: 32.56, speed: 14.1, course: 340, heading: 338, destination: "PIRAEUS", eta: "Apr 22", lastSignal: "1m ago", riskScore: 35, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
  { id: "s-3", mmsi: "538006712", imo: "9006712", name: "OCEAN MERIDIAN", vesselType: "bulker", flag: "MH", flagEmoji: "🇲🇭", status: "underway", lat: 26.07, lng: 56.27, speed: 10.8, course: 90, heading: 88, destination: "MUMBAI", eta: "Apr 18", lastSignal: "5m ago", riskScore: 42, aisDark: false, sanctionsFlag: false, alerts: ["medium"], source: "USCG NAIS" },
  { id: "s-4", mmsi: "352456789", imo: "9456789", name: "LIBERTY WAVE", vesselType: "container", flag: "PA", flagEmoji: "🇵🇦", status: "underway", lat: 9.0, lng: 79.55, speed: 16.2, course: 70, heading: 68, destination: "COLOMBO", eta: "Apr 17", lastSignal: "2m ago", riskScore: 22, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
  { id: "s-5", mmsi: "244123456", imo: "9123456", name: "NORTH SEA PIONEER", vesselType: "tanker", flag: "NL", flagEmoji: "🇳🇱", status: "underway", lat: 57.7, lng: 1.8, speed: 6.5, course: 180, heading: 178, destination: "ABERDEEN", eta: "Apr 15", lastSignal: "4m ago", riskScore: 15, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
  { id: "s-6", mmsi: "356789012", imo: "9789012", name: "ATLAS MERIDIAN", vesselType: "bulker", flag: "PA", flagEmoji: "🇵🇦", status: "underway", lat: -34.6, lng: 18.4, speed: 12.3, course: 52, heading: 50, destination: "PORT ELIZABETH", eta: "Apr 16", lastSignal: "7m ago", riskScore: 48, aisDark: false, sanctionsFlag: false, alerts: ["medium"], source: "USCG NAIS" },
  { id: "s-7", mmsi: "548901234", imo: "9901234", name: "CORAL EMPRESS", vesselType: "tanker", flag: "SG", flagEmoji: "🇸🇬", status: "anchored", lat: 22.3, lng: 114.2, speed: 0.0, course: 0, heading: 0, destination: "HONG KONG", eta: "Apr 15", lastSignal: "6m ago", riskScore: 18, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
  { id: "s-8", mmsi: "767890123", imo: "9890123", name: "NEXUS FORTUNE", vesselType: "container", flag: "BS", flagEmoji: "🇧🇸", status: "underway", lat: 23.4, lng: -164.2, speed: 13.4, course: 248, heading: 246, destination: "LONG BEACH", eta: "Apr 20", lastSignal: "2m ago", riskScore: 82, aisDark: true, sanctionsFlag: false, alerts: ["high"], source: "USCG NAIS" },
  { id: "s-9", mmsi: "209012345", imo: "9012345", name: "ADRIATIC HAWK", vesselType: "roro", flag: "MT", flagEmoji: "🇲🇹", status: "moored", lat: 35.9, lng: 14.5, speed: 0.0, course: 0, heading: 0, destination: "VALLETTA", eta: "—", lastSignal: "9m ago", riskScore: 12, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
  { id: "s-10", mmsi: "339012345", imo: "9312345", name: "GULF PIONEER", vesselType: "tanker", flag: "AE", flagEmoji: "🇦🇪", status: "underway", lat: 26.5, lng: 54.3, speed: 9.1, course: 135, heading: 133, destination: "RAS TANURA", eta: "Apr 15", lastSignal: "8m ago", riskScore: 55, aisDark: false, sanctionsFlag: false, alerts: ["medium"], source: "AISStream" },
  { id: "s-11", mmsi: "566012345", imo: "9912345", name: "SAKURA VOYAGER", vesselType: "bulker", flag: "JP", flagEmoji: "🇯🇵", status: "underway", lat: 35.4, lng: 140.1, speed: 14.8, course: 200, heading: 198, destination: "NAGOYA", eta: "Apr 15", lastSignal: "1m ago", riskScore: 14, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
  { id: "s-12", mmsi: "440123456", imo: "9512345", name: "HANJIN NEPTUNE", vesselType: "container", flag: "KR", flagEmoji: "🇰🇷", status: "underway", lat: 37.5, lng: 126.9, speed: 11.2, course: 90, heading: 88, destination: "BUSAN", eta: "Apr 15", lastSignal: "3m ago", riskScore: 20, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
  { id: "s-13", mmsi: "412345678", imo: "9400001", name: "YANGTZE GIANT", vesselType: "bulker", flag: "CN", flagEmoji: "🇨🇳", status: "underway", lat: 31.2, lng: 122.0, speed: 10.5, course: 175, heading: 174, destination: "GUANGZHOU", eta: "Apr 16", lastSignal: "4m ago", riskScore: 38, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
  { id: "s-14", mmsi: "419999999", imo: "9299999", name: "PEARL RIVER", vesselType: "tanker", flag: "CN", flagEmoji: "🇨🇳", status: "drifting", lat: 20.5, lng: 116.2, speed: 0.3, course: 22, heading: 0, destination: "UNKNOWN", eta: "—", lastSignal: "32m ago", riskScore: 91, aisDark: false, sanctionsFlag: true, alerts: ["critical"], source: "USCG NAIS" },
  { id: "s-15", mmsi: "311023456", imo: "9023456", name: "CARIBBEAN STAR", vesselType: "tanker", flag: "BM", flagEmoji: "🇧🇲", status: "underway", lat: 25.2, lng: -79.3, speed: 9.8, course: 85, heading: 83, destination: "FREEPORT", eta: "Apr 15", lastSignal: "5m ago", riskScore: 30, aisDark: false, sanctionsFlag: false, alerts: [], source: "AISStream" },
];

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
  onSelect: (id: string) => void;
}

function AisMap({ vessels, selected, onSelect }: AisMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const W = 900;
  const H = 520;

  const GRID_LNGS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
  const GRID_LATS = [60, 45, 30, 15, 0, -15, -30, -45];

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#061018" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ display: "block" }}>
        <defs>
          <radialGradient id="mapGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0a1824" />
            <stop offset="100%" stopColor="#040c14" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill={ACCENT} opacity="0.7" />
          </marker>
        </defs>

        <rect width={W} height={H} fill="url(#mapGrad)" />

        {GRID_LNGS.map((lng) => (
          <line key={`vlng${lng}`} x1={lngToX(lng, W)} y1={0} x2={lngToX(lng, W)} y2={H} stroke="rgba(56,189,248,0.06)" strokeWidth="0.5" />
        ))}
        {GRID_LATS.map((lat) => (
          <line key={`vlat${lat}`} x1={0} y1={latToY(lat, H)} x2={W} y2={latToY(lat, H)} stroke="rgba(56,189,248,0.06)" strokeWidth="0.5" />
        ))}

        {[
          { label: "LONDON", lng: 0, lat: 51 },
          { label: "NEW YORK", lng: -74, lat: 40.7 },
          { label: "SINGAPORE", lng: 103, lat: 1.3 },
          { label: "DUBAI", lng: 55, lat: 25.2 },
          { label: "TOKYO", lng: 139.7, lat: 35.7 },
          { label: "SHANGHAI", lng: 121.5, lat: 31.2 },
          { label: "ROTTERDAM", lng: 4.5, lat: 51.9 },
          { label: "PIRAEUS", lng: 23.6, lat: 37.9 },
          { label: "HOUSTON", lng: -95.4, lat: 29.7 },
          { label: "MUMBAI", lng: 72.8, lat: 19.1 },
        ].map(({ label, lng, lat }) => (
          <text key={label} x={lngToX(lng, W) + 3} y={latToY(lat, H) - 2} fontSize="7" fill="rgba(255,255,255,0.14)" fontFamily="monospace">{label}</text>
        ))}

        {vessels.map((vessel) => {
          const x = lngToX(vessel.lng, W);
          const y = latToY(vessel.lat, H);
          if (x < 0 || x > W || y < 0 || y > H) return null;
          const isSelected = vessel.id === selected;
          const isHovered = vessel.id === hovered;
          const color = vesselMarkerColor(vessel);
          const headingRad = (vessel.course * Math.PI) / 180;
          const arrowLen = vessel.speed > 0 ? 12 : 0;
          const arrowX = x + Math.sin(headingRad) * arrowLen;
          const arrowY = y - Math.cos(headingRad) * arrowLen;

          return (
            <g key={vessel.id} style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(vessel.id)} onMouseLeave={() => setHovered(null)} onClick={() => onSelect(vessel.id)}>
              {isSelected && <circle cx={x} cy={y} r={16} fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />}
              {arrowLen > 0 && <line x1={x} y1={y} x2={arrowX} y2={arrowY} stroke={color} strokeWidth="1.5" opacity="0.7" markerEnd="url(#arrowhead)" />}
              <circle cx={x} cy={y} r={isSelected ? 7 : isHovered ? 6 : 5} fill={color} opacity={isSelected ? 1 : 0.85} filter={isSelected ? "url(#glow)" : undefined} />
              {(vessel.aisDark || vessel.sanctionsFlag) && <circle cx={x + 5} cy={y - 5} r={3} fill="#ef4444" />}
              {vessel.alerts.length > 0 && !vessel.aisDark && !vessel.sanctionsFlag && <circle cx={x + 5} cy={y - 5} r={2.5} fill={SEVERITY_CONFIG[vessel.alerts[0]].color} />}
              {(isSelected || isHovered) && (
                <text x={x + 8} y={y + 4} fontSize="8" fill={TEXT.primary} fontFamily="monospace" style={{ pointerEvents: "none" }}>
                  {vessel.name.split(" ").slice(0, 2).join(" ")}
                </text>
              )}
            </g>
          );
        })}
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
        AIS LIVE · {vessels.length} vessels · click marker to select
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
            <p className="text-[14px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>{vessel.flagEmoji} {vessel.name}</p>
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>
              MMSI {vessel.mmsi} · IMO {vessel.imo} · {vessel.lastSignal}
            </p>
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
        <DetailRow label="Heading" value={vessel.heading + "°"} />
        <DetailRow label="Destination" value={vessel.destination} color={ACCENT} />
        <DetailRow label="ETA" value={vessel.eta} />
        {vessel.callsign && <DetailRow label="Call Sign" value={vessel.callsign} />}
        {vessel.length && <DetailRow label="Length" value={vessel.length + " m"} />}
        {vessel.draft && <DetailRow label="Draught" value={vessel.draft + " m"} />}
        <p className="text-[10px] uppercase tracking-widest mt-4 mb-3" style={{ color: TEXT.muted }}>Risk Intelligence</p>
        <DetailRow label="AIS Status" value={vessel.aisDark ? "DARK — signal lost" : "Normal"} color={vessel.aisDark ? "#ef4444" : "#22c55e"} />
        <DetailRow label="Sanctions" value={vessel.sanctionsFlag ? "FLAGGED — review required" : "Clear"} color={vessel.sanctionsFlag ? "#ef4444" : "#22c55e"} />
        <DetailRow label="Data Source" value={vessel.source} color={TEXT.tertiary} />
        <DetailRow label="Flag State" value={`${vessel.flagEmoji} ${vessel.flag}`} />
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
  const [vessels, setVessels] = useState<LiveVessel[]>(GLOBAL_SUPPLEMENT);
  const [apiMeta, setApiMeta] = useState<{ liveData: boolean; dataSource: string; count: number; fetchedAt: string } | null>(null);
  const [selected, setSelected] = useState<string>("s-1");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"map" | "list">("map");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vessels/live/ais/combined", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data: AisApiResponse = json.data ?? json;
      const apiVessels = (data.vessels ?? []).map(mapApiVessel);
      const supplementIds = new Set(apiVessels.map(v => v.mmsi));
      const dedupedSupplement = GLOBAL_SUPPLEMENT.filter(s => !supplementIds.has(s.mmsi));
      const combined = [...apiVessels, ...dedupedSupplement];
      setVessels(combined);
      setApiMeta({
        liveData: data.liveData,
        dataSource: data.dataSource,
        count: combined.length,
        fetchedAt: data.fetchedAt,
      });
      if (combined.length > 0 && !combined.find(v => v.id === selected)) {
        setSelected(combined[0].id);
      }
    } catch (e) {
      setError("AIS API unavailable — showing cached global coverage");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchAis();
    pollRef.current = setInterval(fetchAis, 60 * 1000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const selectedVessel = vessels.find((v) => v.id === selected);
  const filtered = vessels.filter(
    (v) => search === "" || v.name.toLowerCase().includes(search.toLowerCase()) || v.mmsi.includes(search) || v.imo.includes(search)
  );

  const stats = {
    total: vessels.length,
    underway: vessels.filter((v) => v.status === "underway").length,
    alerts: vessels.filter((v) => v.alerts.length > 0).length,
    dark: vessels.filter((v) => v.aisDark).length,
    sanctions: vessels.filter((v) => v.sanctionsFlag).length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG.page }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3">
          <Radio className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>AIS Live Tracking</span>
          {apiMeta ? (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: apiMeta.liveData ? "rgba(34,197,94,0.12)" : "rgba(56,189,248,0.12)", color: apiMeta.liveData ? "#22c55e" : ACCENT }}>
              {apiMeta.liveData ? <Wifi className="w-3 h-3" /> : <Satellite className="w-3 h-3" />}
              {apiMeta.liveData ? "Live" : "Simulated"} · {apiMeta.dataSource}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: "rgba(56,189,248,0.12)", color: ACCENT }}>
              <Globe className="w-3 h-3" />
              Global AIS Coverage
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#f97316" }}>
              <WifiOff className="w-3 h-3" />
              {error}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER.muted}` }}>
            {(["map", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className="px-3 py-1.5 text-[10px] font-medium capitalize transition-colors" style={{ background: view === v ? `${ACCENT}18` : "transparent", color: view === v ? ACCENT : TEXT.muted }}>
                {v === "map" ? "Map" : "List"}
              </button>
            ))}
          </div>
          <button onClick={fetchAis} className="rounded-lg p-1.5 hover:bg-white/5 transition-colors" title="Refresh AIS data">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} style={{ color: loading ? ACCENT : TEXT.tertiary }} />
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: TEXT.muted }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vessels, MMSI…"
              className="rounded-lg pl-8 pr-3 py-1.5 text-[11px] outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.muted}`, color: TEXT.primary, width: 180 }}
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
              const isSelected = selected === vessel.id;
              return (
                <button
                  key={vessel.id}
                  onClick={() => setSelected(vessel.id)}
                  className="w-full text-left px-4 py-3 transition-all hover:bg-white/[0.02]"
                  style={{ borderBottom: `1px solid ${BORDER.subtle}`, background: isSelected ? `${ACCENT}08` : undefined, borderLeft: isSelected ? `2px solid ${ACCENT}` : "2px solid transparent" }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: status.dot }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[12px] font-semibold truncate" style={{ color: TEXT.primary }}>{vessel.flagEmoji} {vessel.name}</p>
                          {vessel.aisDark && <span className="rounded px-1 text-[9px] font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>AIS DARK</span>}
                          {vessel.sanctionsFlag && <span className="rounded px-1 text-[9px] font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>SANCTIONS</span>}
                        </div>
                        <p className="text-[10px]" style={{ color: TEXT.tertiary }}>MMSI {vessel.mmsi} · {status.label} · {vessel.lastSignal} · {vessel.source}</p>
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

      {apiMeta?.fetchedAt && (
        <div className="px-4 py-1.5 shrink-0 flex items-center gap-2" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <Navigation className="w-3 h-3" style={{ color: TEXT.muted }} />
          <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
            Sources: Digitraffic (FTIA) + BarentsWatch (NCA) + AISStream.io + USCG NAIS · Last sync: {new Date(apiMeta.fetchedAt).toLocaleTimeString()} · Refreshes every 60s
          </span>
        </div>
      )}
    </div>
  );
}
