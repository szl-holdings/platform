import { useState, useEffect } from "react";
import { Link } from "wouter";
import type { VesselProfile } from "@/data/types";
import { useVessels, useFleetExceptions, useMaintenance } from "@/hooks/use-vessels-data";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import {
  Ship, AlertTriangle, Clock, MapPin, Navigation, Radio, ChevronRight,
  Activity, Wrench, X, Maximize2, Fuel, TrendingUp, TrendingDown
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

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

function toMapCoords(lat: number, lon: number, W: number, H: number) {
  const x = ((lon + 180) / 360) * W;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = H / 2 - (mercN / Math.PI) * (H / 2);
  return { x, y };
}

function VesselRail({ vessel, selected, onSelect }: { vessel: VesselProfile; selected: boolean; onSelect: () => void }) {
  const color = statusColors[vessel.status] || "#666";
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-2.5 border-b border-sky-500/5 transition-all hover:bg-sky-500/5",
        selected ? "bg-sky-500/10 border-l-2 border-l-sky-400" : "border-l-2 border-l-transparent"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-medium text-sky-100 flex-1 truncate">{vessel.name}</span>
        {vessel.alertCount > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5 pl-3.5 text-[9px] text-sky-400/40">
        <span>{statusLabels[vessel.status]}</span>
        {vessel.currentSpeed > 0 && <span>· {vessel.currentSpeed} kn</span>}
        {vessel.etaDelta !== 0 && (
          <span className={cn("ml-auto", vessel.etaDelta < 0 ? "text-emerald-400/60" : "text-orange-400/60")}>
            {vessel.etaDelta > 0 ? `+${vessel.etaDelta}h` : `${vessel.etaDelta}h`}
          </span>
        )}
      </div>
    </button>
  );
}

function AlertStream({ fleetExceptions }: { fleetExceptions: ReturnType<typeof useFleetExceptions>["fleetExceptions"] }) {
  const alerts = [
    ...fleetExceptions.filter(e => e.status === "active").map(e => ({
      id: e.id, type: "exception" as const, severity: e.severity,
      vessel: e.vesselName, message: e.title, time: e.detectedAt
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  return (
    <div className="bg-[#060e1a] border border-sky-500/10 rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-sky-500/10 flex items-center gap-2">
        <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
        <span className="text-[10px] font-mono text-sky-400/50 uppercase tracking-wider">Alert Stream</span>
      </div>
      <div className="divide-y divide-sky-500/5 max-h-64 overflow-y-auto">
        {alerts.map(alert => (
          <div key={alert.id} className="px-3 py-2 hover:bg-sky-500/5 transition-colors">
            <div className="flex items-start gap-2">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1", alert.severity === "critical" ? "bg-red-400 animate-pulse" : alert.severity === "high" ? "bg-orange-400" : "bg-amber-400")} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-sky-200/80 leading-tight">{alert.message}</p>
                <p className="text-[9px] text-sky-400/40 mt-0.5">{alert.vessel} · {new Date(alert.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandMap({ selectedVessel, vessels }: { selectedVessel: VesselProfile | null; vessels: ReturnType<typeof useVessels>["vessels"] }) {
  const W = 900;
  const H = 420;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#060e1a] rounded-xl border border-sky-500/10">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="cmd-ocean" cx="50%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#0d2847" />
            <stop offset="100%" stopColor="#050c18" />
          </radialGradient>
          <filter id="cmd-glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#cmd-ocean)" />
        <g opacity="0.07" stroke="rgba(56,189,248,0.5)" strokeWidth="0.4" fill="none">
          {[-60, -30, 0, 30, 60].map(lat => {
            const { y } = toMapCoords(lat, 0, W, H);
            return <line key={`lat-${lat}`} x1={0} y1={y} x2={W} y2={y} strokeDasharray="2 4" />;
          })}
          {[-150, -90, -30, 30, 90, 150].map(lon => {
            const { x } = toMapCoords(0, lon, W, H);
            return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={H} strokeDasharray="2 4" />;
          })}
        </g>
        <g opacity="0.11" fill="rgba(56,189,248,0.05)" stroke="rgba(56,189,248,0.1)" strokeWidth="0.6">
          {[
            "M170,75 L180,72 L195,73 L205,80 L210,90 L215,100 L220,112 L225,125 L230,135 L235,140 L230,145 L220,148 L210,145 L205,138 L200,128 L195,118 L188,110 L180,105 L173,98 L170,88 Z",
            "M325,65 L340,60 L355,62 L365,70 L370,82 L375,92 L380,105 L385,115 L390,125 L400,130 L412,133 L420,135 L425,138 L418,142 L408,145 L395,143 L385,138 L375,130 L368,120 L360,108 L352,98 L345,88 L337,80 L330,73 Z",
            "M408,85 L422,80 L438,83 L450,90 L460,100 L468,110 L475,120 L482,130 L488,138 L495,144 L502,148 L510,150 L518,148 L520,142 L515,135 L508,128 L500,120 L492,110 L485,100 L478,92 L470,85 L462,80 L452,77 L442,78 L433,82 Z",
            "M465,128 L480,125 L495,128 L508,135 L515,145 L510,158 L502,168 L493,175 L483,178 L475,175 L468,168 L462,158 L460,148 L463,138 Z",
            "M255,175 L268,165 L280,162 L290,165 L295,175 L298,185 L295,200 L288,215 L278,228 L268,238 L260,243 L254,238 L250,225 L248,210 L249,196 L252,185 Z",
            "M540,185 L555,178 L568,180 L578,188 L584,200 L582,215 L575,228 L565,238 L554,244 L544,242 L538,232 L534,218 L533,203 L536,193 Z",
            "M625,162 L642,155 L660,158 L672,168 L677,182 L672,198 L663,212 L652,222 L641,227 L630,224 L622,214 L618,200 L618,185 L620,173 Z",
          ].map((d, i) => <path key={i} d={d} />)}
        </g>

        {vessels.map(v => {
          const { x, y } = toMapCoords(v.lat, v.lon, W, H);
          const color = statusColors[v.status] || "#666";
          const isSelected = selectedVessel?.id === v.id;

          return (
            <g key={v.id}>
              {isSelected && (
                <>
                  <circle cx={x} cy={y} r={15} fill={color} opacity={0.1} />
                  <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth="1" opacity={0.5}>
                    <animate attributeName="r" from="8" to="18" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
              {v.status === "at_sea" && !isSelected && (
                <circle cx={x} cy={y} r={4} fill="none" stroke={color} strokeWidth="0.8" opacity="0.3">
                  <animate attributeName="r" from="4" to="12" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="2.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={x} cy={y} r={isSelected ? 5.5 : 3.5} fill={color} filter={isSelected ? "url(#cmd-glow)" : undefined} />
              {v.alertCount > 0 && !isSelected && (
                <circle cx={x + 3} cy={y - 3} r={2.5} fill="#ef4444">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {selectedVessel && (() => {
        const { x, y } = toMapCoords(selectedVessel.lat, selectedVessel.lon, W, H);
        const pctX = (x / W) * 100;
        const pctY = (y / H) * 100;
        return (
          <div
            className="absolute z-10 bg-[#0a1628]/95 backdrop-blur border border-sky-500/20 rounded-lg p-2.5 pointer-events-none"
            style={{ left: `${Math.min(Math.max(pctX, 15), 75)}%`, top: `${Math.max(pctY - 5, 5)}%`, transform: "translate(-50%, -110%)", minWidth: 180 }}
          >
            <p className="text-[11px] font-bold text-sky-100">{selectedVessel.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors[selectedVessel.status] }} />
              <span className="text-[9px] text-sky-400/60">{statusLabels[selectedVessel.status]} · {selectedVessel.currentSpeed} kn</span>
            </div>
          </div>
        );
      })()}

      <div className="absolute bottom-2 right-2 text-[9px] text-sky-400/30 font-mono bg-[#0a1628]/80 px-2 py-1 rounded border border-sky-500/10">
        <Radio className="w-2.5 h-2.5 inline mr-1 text-emerald-400" />
        {vessels.length} vessels tracked
      </div>
    </div>
  );
}

export default function CommandModePage() {
  const { vessels } = useVessels();
  const { fleetExceptions } = useFleetExceptions();
  const { maintenanceItems } = useMaintenance();

  const defaultVessel = vessels[0] ?? null;
  const [selectedVessel, setSelectedVessel] = useState<VesselProfile | null>(null);
  const [tick, setTick] = useState(0);

  const activeVessel = selectedVessel ?? defaultVessel;

  useEffect(() => {
    if (!selectedVessel && vessels.length > 0) {
      setSelectedVessel(vessels[0]);
    }
  }, [vessels, selectedVessel]);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const vesselExceptions = activeVessel ? fleetExceptions.filter(e => e.vesselId === activeVessel.id && e.status === "active") : [];
  const vesselMaint = activeVessel ? maintenanceItems.filter(m => m.vesselId === activeVessel.id && m.status !== "completed") : [];
  const criticalCount = fleetExceptions.filter(e => e.severity === "critical" && e.status === "active").length;
  const activeExcCount = fleetExceptions.filter(e => e.status === "active").length;

  return (
    <div className="h-full flex flex-col bg-[#040c18] overflow-hidden">
      <div className="px-4 py-2 border-b border-sky-500/10 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Command Mode</span>
        </div>
        <div className="text-[10px] text-sky-400/30 font-mono">
          {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} UTC
        </div>
        <div className="ml-auto flex items-center gap-4">
          {[
            { label: "Critical", value: criticalCount, color: criticalCount > 0 ? "text-red-400" : "text-sky-400/30" },
            { label: "Active Exc.", value: activeExcCount, color: "text-orange-400" },
            { label: "At Sea", value: vessels.filter(v => v.status === "at_sea").length, color: "text-emerald-400" },
            { label: "Delayed", value: vessels.filter(v => ["delayed", "exception_active"].includes(v.status)).length, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
              <span className={cn("font-bold font-mono", s.color)}>{s.value}</span>
              <span className="text-sky-400/30">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-0">
        <div className="w-44 shrink-0 border-r border-sky-500/10 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-sky-500/5">
            <p className="text-[9px] font-mono text-sky-400/40 uppercase tracking-wider">Fleet</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {vessels.map(v => (
              <VesselRail key={v.id} vessel={v} selected={activeVessel?.id === v.id} onSelect={() => setSelectedVessel(v)} />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
          <div className="flex-1 min-h-0">
            <CommandMap selectedVessel={activeVessel} vessels={vessels} />
          </div>

          <div className="grid grid-cols-4 gap-2 shrink-0">
            {[
              { label: "At Sea", count: vessels.filter(v => v.status === "at_sea").length, color: "#22c55e" },
              { label: "In Port / Loading", count: vessels.filter(v => ["in_port", "loading"].includes(v.status)).length, color: "#0ea5e9" },
              { label: "Delayed / Exception", count: vessels.filter(v => ["delayed", "exception_active"].includes(v.status)).length, color: "#f97316" },
              { label: "Maintenance", count: vessels.filter(v => v.status === "maintenance").length, color: "#ef4444" },
            ].map(s => (
              <div key={s.label} className="bg-[#060e1a] border border-sky-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <div>
                  <p className="text-base font-bold font-mono" style={{ color: s.color }}>{s.count}</p>
                  <p className="text-[9px] text-sky-400/30">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-72 shrink-0 border-l border-sky-500/10 flex flex-col overflow-hidden">
          {activeVessel ? (
            <>
              <div className="px-3 py-2 border-b border-sky-500/10 flex items-center gap-2">
                <Ship className="w-3 h-3 text-sky-400/50" />
                <span className="text-[10px] font-mono text-sky-400/50 truncate">{activeVessel.name}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Status", value: statusLabels[activeVessel.status] ?? activeVessel.status },
                    { label: "Speed", value: `${(activeVessel as Record<string, unknown>)["currentSpeed"] ?? "—"} kn` },
                    { label: "Heading", value: `${(activeVessel as Record<string, unknown>)["heading"] ?? "—"}°` },
                    { label: "ETA", value: "—" },
                  ].map(item => (
                    <div key={item.label} className="bg-sky-500/5 rounded p-2 border border-sky-500/10">
                      <p className="text-[9px] text-sky-400/30">{item.label}</p>
                      <p className="text-[10px] font-mono text-sky-100 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Navigation className="w-3 h-3 text-sky-400/40" />
                    <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Route</p>
                  </div>
                  <p className="text-[10px] text-sky-200">
                    {(activeVessel as Record<string, unknown>)["lastPort"] as string ?? "—"} → {activeVessel.destination ?? "—"}
                  </p>
                </div>

                {vesselExceptions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Active Exceptions</p>
                    {vesselExceptions.map(exc => (
                      <div key={exc.id} className="bg-red-500/5 border border-red-500/10 rounded p-2">
                        <p className="text-[9px] font-medium text-red-300">{exc.title}</p>
                        <p className="text-[9px] text-sky-400/40 mt-0.5">{exc.ownerFunction}</p>
                      </div>
                    ))}
                  </div>
                )}

                {vesselMaint.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Maintenance</p>
                    {vesselMaint.slice(0, 2).map(m => (
                      <div key={m.id} className="bg-amber-500/5 border border-amber-500/10 rounded p-2">
                        <p className="text-[9px] font-medium text-amber-300">{m.component}</p>
                        <p className="text-[9px] text-sky-400/40">{m.daysToDue < 0 ? `${Math.abs(m.daysToDue)}d overdue` : `Due in ${m.daysToDue}d`}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Link href={`/vessel/${activeVessel.id}`}>
                  <button className="w-full text-[10px] text-sky-400 border border-sky-500/20 rounded-lg py-1.5 hover:bg-sky-500/5 transition-colors">
                    Full Detail <ChevronRight className="w-3 h-3 inline" />
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-[10px] text-sky-400/30 font-mono text-center">No vessels available.<br />Seed the fleet to begin.</p>
            </div>
          )}

          <div className="border-t border-sky-500/10 shrink-0">
            <AlertStream fleetExceptions={fleetExceptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
