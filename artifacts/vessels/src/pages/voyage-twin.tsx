import { useState, useEffect } from "react";
import { Cpu, Anchor, Clock, Fuel, AlertTriangle, CheckCircle2, RefreshCw, Play, GitBranch, MapPin, TrendingUp, Navigation, RotateCcw } from "lucide-react";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { cn } from "@szl-holdings/shared-ui/utils";

const ACCENT = "#0ea5e9";
const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const KNOWN_VOYAGES = [
  { ref: "VOY-2026-001", label: "Pacific Guardian — Ras Tanura → Rotterdam" },
  { ref: "latest", label: "Latest Active Voyage (auto-resolve)" },
];

interface Snapshot {
  snapshotId: string;
  timestamp: string;
  position: { lat: number; lon: number };
  speed: number;
  heading: number;
  event: string;
  status: string;
  fuelConsumed: number;
  cargoIntact: boolean;
  weatherState: string;
  etaOriginal: string;
  etaCurrent: string;
  anomaly?: string;
}

interface WhatIf {
  id: string;
  label: string;
  etaDeltaHours: number;
  fuelDeltaMt: number;
  costDeltaUsd: number;
  feasibility: string;
}

interface TwinData {
  voyageRef: string;
  vessel: { name: string; imo: string; flag: string; type: string };
  snapshots: Snapshot[];
  summary: {
    totalSnapshots: number;
    voyageDurationDays: number;
    totalFuelConsumMt: number;
    etaDriftHours: number;
    anomaliesDetected: number;
    cargoIntactAtArrival: boolean;
    finalStatus: string;
    originPort: string;
    destinationPort: string;
  };
  whatIfScenarios: WhatIf[];
  provenance: { confidence: number; verifierApproved: boolean; attestation: string; freshness: { fetchedAt: string } };
}

const EVENT_CONFIG: Record<string, { color: string; label: string }> = {
  voyage_start: { color: "#34d399", label: "Voyage Start" },
  strait_transit: { color: "#38bdf8", label: "Strait Transit" },
  suez_anchorage: { color: "#fbbf24", label: "Anchorage" },
  suez_transit: { color: "#38bdf8", label: "Canal Transit" },
  weather_diversion: { color: "#f87171", label: "Weather Diversion" },
  resume_normal: { color: "#38bdf8", label: "Resume Normal" },
  port_approach: { color: "#a78bfa", label: "Port Approach" },
  voyage_complete: { color: "#34d399", label: "Voyage Complete" },
};

const WEATHER_ICONS: Record<string, string> = { calm: "☀️", slight_swell: "🌊", moderate: "🌊", rough: "⛈️" };

const FEASIBILITY_CONFIG: Record<string, { color: string }> = { high: { color: "#34d399" }, medium: { color: "#fbbf24" }, conditional: { color: "#f87171" } };

function SnapshotRow({ snap, isActive, onClick, isSelected }: { snap: Snapshot; isActive: boolean; onClick: () => void; isSelected: boolean }) {
  const evtCfg = EVENT_CONFIG[snap.event] ?? { color: ACCENT, label: snap.event };
  const hasAnomaly = !!snap.anomaly;
  return (
    <button onClick={onClick} className={cn("w-full text-left p-3 rounded-xl border transition-all", isSelected ? "ring-1 ring-sky-400/40" : "hover:border-sky-500/15")} style={{ background: isSelected ? "rgba(14,165,233,0.06)" : "rgba(10,22,40,0.6)", borderColor: hasAnomaly ? "rgba(248,113,113,0.25)" : isSelected ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.05)" }}>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: evtCfg.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-sky-100">{evtCfg.label}</span>
            {hasAnomaly && <AlertTriangle className="w-3 h-3 text-amber-400" />}
          </div>
          <div className="text-[9px] text-sky-400/40 mt-0.5">{new Date(snap.timestamp).toLocaleDateString()} {new Date(snap.timestamp).toLocaleTimeString()}</div>
        </div>
        <div className="text-right text-[10px]">
          <div className="text-sky-400/60">{snap.speed} kts</div>
          <div className="text-sky-400/40">{snap.fuelConsumed} mt</div>
        </div>
        <div className="text-[12px] w-6">{WEATHER_ICONS[snap.weatherState] ?? "🌊"}</div>
      </div>
      {hasAnomaly && (
        <div className="mt-1.5 text-[9px] text-amber-300/60 truncate">{snap.anomaly}</div>
      )}
    </button>
  );
}

function WhatIfCard({ scenario }: { scenario: WhatIf }) {
  const feas = FEASIBILITY_CONFIG[scenario.feasibility] ?? { color: "#888" };
  const etaSign = scenario.etaDeltaHours > 0 ? "+" : "";
  const fuelSign = scenario.fuelDeltaMt > 0 ? "+" : "";
  const costSign = scenario.costDeltaUsd > 0 ? "+" : "";
  return (
    <div className="rounded-xl p-3.5 border border-sky-500/10" style={{ background: "rgba(10,22,40,0.7)" }}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] font-medium text-sky-100 flex-1 pr-2">{scenario.label}</div>
        <span className="text-[9px] px-2 py-0.5 rounded-full border capitalize flex-shrink-0" style={{ color: feas.color, borderColor: `${feas.color}40`, background: `${feas.color}10` }}>{scenario.feasibility}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <div className="text-sky-400/40">ETA Delta</div>
          <div className="font-medium" style={{ color: scenario.etaDeltaHours > 0 ? "#fbbf24" : "#34d399" }}>{etaSign}{scenario.etaDeltaHours}h</div>
        </div>
        <div>
          <div className="text-sky-400/40">Fuel Delta</div>
          <div className="font-medium" style={{ color: scenario.fuelDeltaMt > 0 ? "#f87171" : "#34d399" }}>{fuelSign}{scenario.fuelDeltaMt} mt</div>
        </div>
        <div>
          <div className="text-sky-400/40">Cost Delta</div>
          <div className="font-medium" style={{ color: scenario.costDeltaUsd > 0 ? "#f87171" : "#34d399" }}>{costSign}${(Math.abs(scenario.costDeltaUsd) / 1000).toFixed(0)}k</div>
        </div>
      </div>
    </div>
  );
}

export default function VoyageTwinPage() {
  const [voyageRef, setVoyageRef] = useState<string>("VOY-2026-001");
  const [data, setData] = useState<TwinData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSnap, setSelectedSnap] = useState<Snapshot | null>(null);
  const [view, setView] = useState<"timeline" | "whatif">("timeline");

  async function load(ref: string) {
    setLoading(true);
    setSelectedSnap(null);
    try {
      const r = await fetch(`${API_BASE}/api/vessels/cognitive/voyage-twin/${ref}`);
      if (r.ok) setData(await r.json() as TwinData);
    } catch { }
    setLoading(false);
  }

  useEffect(() => { void load(voyageRef); }, []);

  function select(ref: string) {
    setVoyageRef(ref);
    void load(ref);
  }

  const etaDrift = data?.summary.etaDriftHours ?? 0;

  return (
    <div style={{ padding: "28px 28px 48px", maxWidth: 1400, margin: "0 auto" }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold text-sky-100">Voyage Twin</h1>
            <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-400/70">COGNITIVE RUNTIME</Badge>
          </div>
          <p className="text-xs text-sky-400/60">Replays a voyage through trace-graph snapshots. Supports what-if forks for alternate routing and speed scenarios.</p>
        </div>
        <button onClick={() => load(voyageRef)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-sky-400 border border-sky-500/20 hover:border-sky-500/40 transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {KNOWN_VOYAGES.map(v => (
          <button key={v.ref} onClick={() => select(v.ref)}
            className={cn("px-3 py-1.5 rounded-lg text-[11px] border transition-colors", voyageRef === v.ref ? "bg-sky-500/15 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/50 hover:text-sky-300/70")}
          >{v.label}</button>
        ))}
      </div>

      {data && (
        <div className="grid grid-cols-6 gap-3 mb-5">
          {[
            { label: "Duration", value: `${data.summary.voyageDurationDays}d`, icon: Clock, color: ACCENT },
            { label: "Fuel Consumed", value: `${data.summary.totalFuelConsumMt} mt`, icon: Fuel, color: "#a78bfa" },
            { label: "ETA Drift", value: `${etaDrift > 0 ? "+" : ""}${etaDrift}h`, icon: TrendingUp, color: etaDrift > 0 ? "#fbbf24" : "#34d399" },
            { label: "Anomalies", value: data.summary.anomaliesDetected, icon: AlertTriangle, color: data.summary.anomaliesDetected > 0 ? "#f87171" : "#34d399" },
            { label: "Snapshots", value: data.summary.totalSnapshots, icon: RotateCcw, color: "#38bdf8" },
            { label: "Cargo", value: data.summary.cargoIntactAtArrival ? "Intact" : "Issue", icon: CheckCircle2, color: data.summary.cargoIntactAtArrival ? "#34d399" : "#f87171" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl p-3 border border-sky-500/10" style={{ background: "rgba(10,22,40,0.8)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3" style={{ color: s.color }} />
                  <div className="text-[10px] text-sky-400/50 uppercase tracking-wider">{s.label}</div>
                </div>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {data?.provenance && (
        <div className="flex items-center gap-3 mb-5 px-3 py-2 rounded-lg border border-emerald-500/15" style={{ background: "rgba(52,211,153,0.04)" }}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-300/70 font-medium">{data.provenance.attestation}</span>
          <span className="text-[10px] text-sky-400/40">·</span>
          <span className="text-[10px] text-sky-400/50">{Math.round(data.provenance.confidence * 100)}% confidence</span>
        </div>
      )}

      {data && (
        <div className="p-3.5 rounded-xl border border-sky-500/10 mb-5" style={{ background: "rgba(10,22,40,0.8)" }}>
          <div className="flex items-center gap-3">
            <Anchor className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-sm font-semibold text-sky-100">{data.vessel.name}</div>
              <div className="text-[10px] text-sky-400/50">IMO {data.vessel.imo} · {data.vessel.flag} · {data.vessel.type}</div>
            </div>
            <div className="ml-auto flex items-center gap-3 text-[10px] text-sky-400/50">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{data.summary.originPort}</span>
              <Navigation className="w-3 h-3 text-sky-400/30" />
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{data.summary.destinationPort}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {[{ k: "timeline", label: "Timeline Replay", icon: Play }, { k: "whatif", label: "What-If Forks", icon: GitBranch }].map(v => {
          const Icon = v.icon;
          return (
            <button key={v.k} onClick={() => setView(v.k as any)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border transition-colors", view === v.k ? "bg-sky-500/15 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/50 hover:text-sky-300/70")}
            ><Icon className="w-3 h-3" />{v.label}</button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-sky-400/40 text-sm">Loading voyage twin…</div>
      ) : view === "timeline" && data ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7 space-y-1.5">
            {data.snapshots.map((snap, i) => (
              <SnapshotRow key={snap.snapshotId} snap={snap} isActive={i === data.snapshots.length - 1} onClick={() => setSelectedSnap(selectedSnap?.snapshotId === snap.snapshotId ? null : snap)} isSelected={selectedSnap?.snapshotId === snap.snapshotId} />
            ))}
          </div>
          <div className="col-span-5">
            {selectedSnap ? (
              <div className="rounded-xl border border-sky-500/10 p-4 sticky top-4" style={{ background: "rgba(10,22,40,0.9)" }}>
                <div className="text-sm font-medium text-sky-100 mb-1">{(EVENT_CONFIG[selectedSnap.event] ?? { label: selectedSnap.event }).label}</div>
                <div className="text-[10px] text-sky-400/50 mb-4">{new Date(selectedSnap.timestamp).toLocaleString()}</div>
                <div className="space-y-2.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-sky-400/50">Position</span><span className="text-sky-200">{selectedSnap.position.lat.toFixed(2)}°, {selectedSnap.position.lon.toFixed(2)}°</span></div>
                  <div className="flex justify-between"><span className="text-sky-400/50">Speed</span><span className="text-sky-200">{selectedSnap.speed} kts</span></div>
                  <div className="flex justify-between"><span className="text-sky-400/50">Heading</span><span className="text-sky-200">{selectedSnap.heading}°</span></div>
                  <div className="flex justify-between"><span className="text-sky-400/50">Fuel Consumed</span><span className="text-sky-200">{selectedSnap.fuelConsumed} mt</span></div>
                  <div className="flex justify-between"><span className="text-sky-400/50">Status</span><span className="text-sky-200 capitalize">{selectedSnap.status}</span></div>
                  <div className="flex justify-between"><span className="text-sky-400/50">Weather</span><span className="text-sky-200 capitalize">{selectedSnap.weatherState.replace(/_/g, " ")} {WEATHER_ICONS[selectedSnap.weatherState] ?? ""}</span></div>
                  <div className="flex justify-between"><span className="text-sky-400/50">Cargo Intact</span><span style={{ color: selectedSnap.cargoIntact ? "#34d399" : "#f87171" }}>{selectedSnap.cargoIntact ? "Yes" : "No"}</span></div>
                  <div>
                    <div className="text-sky-400/50 mb-1">ETA Original</div>
                    <div className="text-sky-200">{new Date(selectedSnap.etaOriginal).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sky-400/50 mb-1">ETA Current</div>
                    <div className="text-sky-200">{new Date(selectedSnap.etaCurrent).toLocaleString()}</div>
                  </div>
                  {selectedSnap.anomaly && (
                    <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/05">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] text-amber-200/80">{selectedSnap.anomaly}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-sky-500/10 p-4" style={{ background: "rgba(10,22,40,0.8)" }}>
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <Play className="w-6 h-6 text-sky-400/30 mb-2" />
                  <p className="text-sky-400/40 text-sm">Select a snapshot to inspect</p>
                  <p className="text-sky-400/25 text-xs mt-1">Position, speed, fuel, ETA drift</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : view === "whatif" && data ? (
        <div>
          <div className="text-[11px] text-sky-400/50 mb-4">
            The following what-if forks were computed from snapshot S005 (weather diversion point). Each fork replays the remaining voyage under alternate parameters.
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.whatIfScenarios.map(s => <WhatIfCard key={s.id} scenario={s} />)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
