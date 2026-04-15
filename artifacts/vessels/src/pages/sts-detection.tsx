import { useState } from "react";
import { AlertTriangle, Ship, Radio, MapPin, Clock, Eye, Zap, ShieldAlert, Activity } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";

interface StsEvent {
  id: string;
  vessels: [string, string];
  imos: [string, string];
  flags: [string, string];
  location: string;
  coords: { lat: number; lon: number };
  detectedAt: string;
  gapDuration: string;
  cargo: string;
  confidence: number;
  sanctionsLink: boolean;
  aegisLink: boolean;
  behaviorSignals: string[];
  status: "active" | "confirmed" | "investigating" | "cleared";
  ownerChains: [string, string];
}

const STS_EVENTS: StsEvent[] = [
  {
    id: "STS-001",
    vessels: ["GHOST MERIDIAN", "KAZAN SPIRIT"],
    imos: ["9821045", "9654789"],
    flags: ["Unknown", "Russia"],
    location: "Persian Gulf — 26.1°N 55.8°E",
    coords: { lat: 26.1, lon: 55.8 },
    detectedAt: "2h ago",
    gapDuration: "14h 22m",
    cargo: "Crude Oil (estimated 1.2M bbls)",
    confidence: 96,
    sanctionsLink: true,
    aegisLink: true,
    behaviorSignals: [
      "Speed <0.5kts for 6+ hours (drifting pattern)",
      "AIS transponder disabled on both vessels simultaneously",
      "Proximity <200m for 4h 18m",
      "No declared port call at either origin or destination",
      "Vessel direction reversal post-gap",
    ],
    status: "confirmed",
    ownerChains: ["3 shell companies — BVI/Cayman", "State enterprise obscured via Cyprus holding"],
  },
  {
    id: "STS-002",
    vessels: ["DELTA SPECTRE", "CALABAR EXPRESS"],
    imos: ["9445566", "9102938"],
    flags: ["Cameroon", "Benin"],
    location: "Gulf of Guinea — 1.2°N 8.4°E",
    coords: { lat: 1.2, lon: 8.4 },
    detectedAt: "6h ago",
    gapDuration: "21h 05m",
    cargo: "Unknown (fuel suspected)",
    confidence: 82,
    sanctionsLink: false,
    aegisLink: false,
    behaviorSignals: [
      "Extended AIS blackout in piracy corridor",
      "Speed drop from 11kts to 0.3kts",
      "Proximity cluster at known STS anchorage",
      "No declared cargo manifest update post-gap",
    ],
    status: "investigating",
    ownerChains: ["Atlantic Ridge Corp. — partial opacity", "Calabar Maritime Ltd. — Benin registry"],
  },
  {
    id: "STS-003",
    vessels: ["ORIENT MIRAGE", "PACIFIC DAWN"],
    imos: ["9112233", "9887654"],
    flags: ["Palau", "Hong Kong"],
    location: "South China Sea — 3.4°N 103.2°E",
    coords: { lat: 3.4, lon: 103.2 },
    detectedAt: "11h ago",
    gapDuration: "6h 55m",
    cargo: "Petrochemicals (suspected)",
    confidence: 74,
    sanctionsLink: false,
    aegisLink: true,
    behaviorSignals: [
      "AIS gap in known STS transfer zone",
      "Speed pattern: 12kts → 0kts → 11kts within 8h",
      "Proximity to ORIENT MIRAGE reported by nearby vessel",
    ],
    status: "active",
    ownerChains: ["Pacific Ventures Pte. Ltd.", "HK Maritime Holdings Ltd."],
  },
  {
    id: "STS-004",
    vessels: ["NORTHERN PHANTOM", "AZOV TRADER"],
    imos: ["9654321", "9771234"],
    flags: ["Comoros", "Russia"],
    location: "Black Sea — 42.8°N 37.4°E",
    coords: { lat: 42.8, lon: 37.4 },
    detectedAt: "3d ago",
    gapDuration: "9h 11m",
    cargo: "Grain (suspected — Russian origin)",
    confidence: 68,
    sanctionsLink: true,
    aegisLink: true,
    behaviorSignals: [
      "Repeated AIS gaps in Black Sea during wartime period",
      "Prior calls at Novorossiysk — under EU sanctions",
      "Ownership chain linked to sanctioned entity",
    ],
    status: "cleared",
    ownerChains: ["Seagate Maritime Ltd. — Comoros", "Azov State Shipping — Russia (sanctioned)"],
  },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  active:        { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", label: "Active" },
  confirmed:     { color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Confirmed" },
  investigating: { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Investigating" },
  cleared:       { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Cleared" },
};

function ConfidenceBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", score >= 90 ? "bg-red-400" : score >= 75 ? "bg-orange-400" : "bg-amber-400")}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-[10px] font-mono font-bold w-8 text-right",
        score >= 90 ? "text-red-400" : score >= 75 ? "text-orange-400" : "text-amber-400")}>
        {score}%
      </span>
    </div>
  );
}

export default function StsDetectionPage() {
  const [selected, setSelected] = useState<StsEvent | null>(STS_EVENTS[0]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all" ? STS_EVENTS : STS_EVENTS.filter(e => e.status === statusFilter);
  const confirmed = STS_EVENTS.filter(e => e.status === "confirmed").length;
  const sanctioned = STS_EVENTS.filter(e => e.sanctionsLink).length;
  const avgConfidence = Math.round(STS_EVENTS.reduce((a, e) => a + e.confidence, 0) / STS_EVENTS.length);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
          <Eye className="w-5 h-5 text-orange-400" />
          Ship-to-Ship Transfer Detection
        </h1>
        <p className="text-xs text-sky-400/50 mt-0.5">
          AIS behavioral pattern analysis — speed drops, proximity clusters, transponder gaps — enhanced with Aegis threat intelligence
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total STS Events", value: STS_EVENTS.length, color: "text-sky-300", icon: Ship },
          { label: "Confirmed Transfers", value: confirmed, color: "text-red-400", icon: AlertTriangle },
          { label: "Sanctions Linked", value: sanctioned, color: "text-orange-400", icon: ShieldAlert },
          { label: "Avg Confidence", value: `${avgConfidence}%`, color: "text-amber-400", icon: Activity },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn("w-3.5 h-3.5", s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn("text-xl font-bold font-display", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {["all", "confirmed", "active", "investigating", "cleared"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all",
              statusFilter === s ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
            {s === "all" ? `All (${STS_EVENTS.length})` : statusConfig[s]?.label ?? s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          {filtered.map(ev => (
            <button key={ev.id} onClick={() => setSelected(ev)}
              className={cn("w-full text-left bg-[#0a1628]/80 border rounded-xl p-4 transition-all hover:border-sky-500/20",
                selected?.id === ev.id ? "border-sky-500/30 ring-1 ring-sky-500/15" :
                ev.status === "confirmed" ? "border-red-500/20" :
                ev.status === "investigating" ? "border-amber-500/20" :
                "border-sky-500/10")}>
              <div className="flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  ev.status === "confirmed" ? "bg-red-500/10" :
                  ev.status === "active" ? "bg-orange-500/10" :
                  "bg-amber-500/10")}>
                  <Ship className={cn("w-3.5 h-3.5",
                    ev.status === "confirmed" ? "text-red-400" :
                    ev.status === "active" ? "text-orange-400" : "text-amber-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold text-sky-100">{ev.id}</span>
                    <Badge variant="outline" className={cn("text-[9px]", statusConfig[ev.status]?.color)}>
                      {statusConfig[ev.status]?.label}
                    </Badge>
                    {ev.sanctionsLink && (
                      <Badge variant="outline" className="text-[9px] text-red-400 bg-red-500/10 border-red-500/20">
                        Sanctions Link
                      </Badge>
                    )}
                    {ev.aegisLink && (
                      <Badge variant="outline" className="text-[9px] text-violet-400 bg-violet-500/10 border-violet-500/20">
                        Aegis Intel
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-mono text-sky-300">{ev.vessels.join(" ↔ ")}</p>
                  <p className="text-[10px] text-sky-400/50 mt-0.5">{ev.location}</p>
                  <div className="mt-2">
                    <p className="text-[9px] text-sky-400/30 mb-1">Detection confidence</p>
                    <ConfidenceBar score={ev.confidence} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-sky-400/40">{ev.detectedAt}</p>
                  <p className="text-[9px] text-sky-400/30 mt-0.5">Gap: {ev.gapDuration}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="space-y-4">
            <div className="bg-[#0a1628]/80 border border-sky-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-sky-200">{selected.id} — Detailed Analysis</p>
                <Badge variant="outline" className={cn("text-[9px]", statusConfig[selected.status]?.color)}>
                  {statusConfig[selected.status]?.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {selected.vessels.map((v, i) => (
                  <div key={v} className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                    <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1">Vessel {i + 1}</p>
                    <p className="text-xs font-bold text-sky-100">{v}</p>
                    <p className="text-[10px] text-sky-400/50">IMO {selected.imos[i]}</p>
                    <p className="text-[10px] text-sky-400/40">Flag: {selected.flags[i]}</p>
                    <p className="text-[9px] text-sky-400/30 mt-1 italic">{selected.ownerChains[i]}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                {[
                  { label: "Location", value: selected.location, icon: MapPin },
                  { label: "Detected", value: selected.detectedAt, icon: Clock },
                  { label: "AIS Gap", value: selected.gapDuration, icon: Radio },
                  { label: "Cargo", value: selected.cargo, icon: Ship },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-3">
                    <f.icon className="w-3 h-3 text-sky-400/30 shrink-0" />
                    <span className="text-[10px] text-sky-400/40 w-16 shrink-0">{f.label}</span>
                    <span className="text-[11px] text-sky-300">{f.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">
                  <Zap className="w-3 h-3 inline mr-1 text-amber-400" />Behavioral Signals
                </p>
                <div className="space-y-1.5">
                  {selected.behaviorSignals.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-200/80">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              {(selected.sanctionsLink || selected.aegisLink) && (
                <div className="mt-4 pt-4 border-t border-sky-500/10">
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">Intelligence Links</p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.sanctionsLink && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <ShieldAlert className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] text-red-300">OFAC / EU Sanctions Match</span>
                      </div>
                    )}
                    {selected.aegisLink && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <Eye className="w-3 h-3 text-violet-400" />
                        <span className="text-[10px] text-violet-300">Aegis Threat Intelligence</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
