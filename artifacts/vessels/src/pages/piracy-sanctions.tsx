import { useState } from "react";
import { ShieldAlert, AlertTriangle, Eye, EyeOff, CheckCircle2, XCircle, Clock, Globe, FileText, Search, Radio } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

const RISK_CORRIDORS = [
  { id: "RC-001", name: "Red Sea / Bab-el-Mandeb", level: "critical", threat: "Houthi missile & drone attacks", vessels: 8, incidents30d: 7, avoidanceActive: true, lat: 13.0, lon: 43.0 },
  { id: "RC-002", name: "Gulf of Guinea", level: "critical", threat: "Armed robbery / crew kidnapping", vessels: 3, incidents30d: 4, avoidanceActive: true, lat: 4.0, lon: 3.0 },
  { id: "RC-003", name: "Gulf of Aden", level: "high", threat: "Piracy / vessel boarding", vessels: 5, incidents30d: 3, avoidanceActive: false, lat: 12.0, lon: 47.0 },
  { id: "RC-004", name: "Strait of Malacca", level: "medium", threat: "Petty theft / boarding attempts", vessels: 11, incidents30d: 2, avoidanceActive: false, lat: 2.5, lon: 103.0 },
  { id: "RC-005", name: "Indian Ocean (East Africa)", level: "medium", threat: "Piracy resurgence", vessels: 4, incidents30d: 1, avoidanceActive: false, lat: -5.0, lon: 55.0 },
  { id: "RC-006", name: "Black Sea", level: "high", threat: "Conflict zone / mine risk", vessels: 0, incidents30d: 12, avoidanceActive: true, lat: 43.0, lon: 33.0 },
];

const DARK_VESSELS = [
  { id: "DV-2026-441", mmsi: "477923841", lat: 24.8, lon: 57.4, aisOff: "18h 42m", suspicion: "STS transfer", confidence: 0.91, lastPort: "Bandar Abbas" },
  { id: "DV-2026-438", mmsi: "511901237", lat: -1.2, lon: 109.8, aisOff: "6h 15m", suspicion: "Cargo manipulation", confidence: 0.74, lastPort: "Unknown" },
  { id: "DV-2026-431", mmsi: "338472916", lat: 36.8, lon: 14.2, aisOff: "32h 05m", suspicion: "Sanctions evasion", confidence: 0.88, lastPort: "Tripoli" },
];

const SANCTIONS_HITS = [
  { entity: "Evergreen Meridian Shipping LLC", list: "OFAC SDN", match: 0.96, vessel: "Pacific Navigator", type: "Counterparty", status: "blocked", date: "Apr 14, 2026" },
  { entity: "Black Sea Cargo Partners", list: "EU Consolidated", match: 0.89, vessel: "Cape Resolute", type: "Charterer", status: "escalated", date: "Apr 13, 2026" },
  { entity: "Aurora Petroleum Trading", list: "UN Consolidated", match: 0.78, vessel: "Meridian Bulk", type: "Cargo Buyer", status: "review", date: "Apr 12, 2026" },
  { entity: "Pacific Star Marine Inc", list: "UK OFSI", match: 0.65, vessel: "Arctic Breeze", type: "Port Agent", status: "cleared", date: "Apr 11, 2026" },
];

const riskColor: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const sanctionStatusColor: Record<string, string> = {
  blocked: "text-red-400 bg-red-500/10 border-red-500/20",
  escalated: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  review: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  cleared: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

function ConfidenceBar({ val }: { val: number }) {
  const color = val > 0.85 ? "#f87171" : val > 0.7 ? "#fb923c" : "#fbbf24";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${val * 100}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono" style={{ color }}>{Math.round(val * 100)}%</span>
    </div>
  );
}

export default function PiracySanctionsPage() {
  const [tab, setTab] = useState<"corridors" | "dark" | "sanctions">("corridors");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHits = SANCTIONS_HITS.filter(h =>
    !searchQuery || h.entity.toLowerCase().includes(searchQuery.toLowerCase()) || h.vessel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">Piracy & Sanctions Intelligence</h1>
            <Badge variant="outline" className="text-[9px] text-red-400 border-red-500/30 bg-red-500/5">LIVE INTEL</Badge>
          </div>
          <p className="text-xs text-sky-400/40">Risk corridor mapping, AIS dark-vessel detection & OFAC/EU sanctions screening</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-lg font-bold font-mono text-red-400">2</p><p className="text-[9px] text-sky-400/40">Critical Zones</p></div>
          <div className="text-right"><p className="text-lg font-bold font-mono text-orange-400">{DARK_VESSELS.length}</p><p className="text-[9px] text-sky-400/40">Dark Vessels</p></div>
          <div className="text-right"><p className="text-lg font-bold font-mono text-amber-400">{SANCTIONS_HITS.filter(h => h.status !== "cleared").length}</p><p className="text-[9px] text-sky-400/40">Sanctions Flags</p></div>
        </div>
      </div>

      <div className="flex gap-1">
        {(["corridors", "dark", "sanctions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("text-xs px-4 py-1.5 rounded-lg capitalize transition-colors", tab === t ? "bg-red-500/10 text-red-300 border border-red-500/20" : "text-sky-400/50 hover:text-sky-300")}>
            {t === "corridors" ? "Risk Corridors" : t === "dark" ? "Dark Vessel Detection" : "Sanctions Screening"}
          </button>
        ))}
      </div>

      {tab === "corridors" && (
        <div className="space-y-3">
          {RISK_CORRIDORS.map(rc => (
            <div key={rc.id} className={cn("bg-[#0a1628]/80 border rounded-xl p-4", rc.level === "critical" ? "border-red-500/20" : rc.level === "high" ? "border-orange-500/15" : "border-sky-500/10")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-3.5 h-3.5 text-sky-400/60" />
                    <p className="text-sm font-semibold text-sky-100">{rc.name}</p>
                    <Badge variant="outline" className={cn("text-[9px]", riskColor[rc.level])}>{rc.level}</Badge>
                    {rc.avoidanceActive && <Badge variant="outline" className="text-[9px] text-violet-400 border-violet-500/20 bg-violet-500/5">AVOIDANCE ACTIVE</Badge>}
                  </div>
                  <p className="text-[10px] text-sky-400/50 mb-2">Threat: {rc.threat}</p>
                  <div className="flex gap-4 text-[10px]">
                    <span className="text-sky-400/40">Fleet vessels: <span className="text-sky-300 font-mono">{rc.vessels}</span></span>
                    <span className="text-sky-400/40">Incidents (30d): <span className={cn("font-mono", rc.incidents30d >= 5 ? "text-red-400" : rc.incidents30d >= 3 ? "text-orange-400" : "text-amber-400")}>{rc.incidents30d}</span></span>
                    <span className="text-sky-400/40">Coords: <span className="font-mono text-sky-400/60">{rc.lat}°N, {rc.lon}°E</span></span>
                  </div>
                </div>
                {rc.level === "critical" && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-red-400 absolute" />
                    <span className="text-[10px] text-red-400">ALERT</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />War Risk Insurance Documentation</p>
            <p className="text-[11px] text-sky-300/70">Automated compliance documentation generated for Red Sea and Black Sea transits. Joint War Committee (JWC) listed areas: 4 active. War risk premium supplements applied to 3 vessels. H&M underwriter notifications sent.</p>
          </div>
        </div>
      )}

      {tab === "dark" && (
        <div className="space-y-3">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 mb-2">
            <p className="text-xs font-semibold text-sky-200 mb-2 flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-amber-400" />AIS Dark-Vessel Detection</p>
            <p className="text-[10px] text-sky-400/50">Vessels detected via satellite AIS correlation, RF spectrum analysis, and optical imagery cross-referencing when transponder is off or manipulated.</p>
          </div>
          {DARK_VESSELS.map(dv => (
            <div key={dv.id} className="bg-[#0a1628]/80 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-sm font-semibold text-sky-100">{dv.id}</p>
                    <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/20">AIS OFF</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] mt-2">
                    <div><span className="text-sky-400/40">MMSI: </span><span className="font-mono text-sky-300">{dv.mmsi}</span></div>
                    <div><span className="text-sky-400/40">AIS Blackout: </span><span className="font-mono text-amber-400">{dv.aisOff}</span></div>
                    <div><span className="text-sky-400/40">Position: </span><span className="font-mono text-sky-300">{dv.lat}°, {dv.lon}°</span></div>
                    <div><span className="text-sky-400/40">Last Port: </span><span className="text-sky-300">{dv.lastPort}</span></div>
                    <div><span className="text-sky-400/40">Suspicion: </span><span className="text-orange-400">{dv.suspicion}</span></div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] text-sky-400/40 mb-1">Detection confidence</p>
                  <ConfidenceBar val={dv.confidence} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "sanctions" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sky-400/40" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search entity or vessel…"
              className="w-full bg-[#0a1628]/80 border border-sky-500/15 rounded-lg pl-8 pr-4 py-2 text-xs text-sky-200 placeholder:text-sky-400/30 focus:outline-none focus:border-sky-500/30"
            />
          </div>
          {filteredHits.map((hit, i) => (
            <div key={i} className={cn("bg-[#0a1628]/80 border rounded-xl p-4", hit.status === "blocked" ? "border-red-500/20" : hit.status === "escalated" ? "border-orange-500/15" : "border-sky-500/10")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-sky-100">{hit.entity}</p>
                    <Badge variant="outline" className={cn("text-[9px]", sanctionStatusColor[hit.status])}>{hit.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-sky-400/50 mt-1">
                    <span>List: <span className="text-orange-400">{hit.list}</span></span>
                    <span>Vessel: <span className="text-sky-300">{hit.vessel}</span></span>
                    <span>Role: <span className="text-sky-300">{hit.type}</span></span>
                    <span>Date: <span className="text-sky-400/40">{hit.date}</span></span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] text-sky-400/40 mb-1">Match score</p>
                  <ConfidenceBar val={hit.match} />
                  <div className="mt-1">
                    {hit.status === "cleared" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" /> : hit.status === "blocked" ? <XCircle className="w-4 h-4 text-red-400 ml-auto" /> : <AlertTriangle className="w-4 h-4 text-amber-400 ml-auto" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl p-4">
            <p className="text-xs font-semibold text-sky-200 mb-2">Screening Coverage</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {["OFAC SDN", "EU Consolidated", "UN Consolidated", "UK OFSI", "BIS Entity List", "IMO Ship List"].map(l => (
                <div key={l} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-sky-400/60">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
