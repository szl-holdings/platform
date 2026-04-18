import { useState } from "react";
import { useSafeMode } from "../lib/use-safe-mode";
import { useQuery } from "@tanstack/react-query";
import { Layers, Activity, AlertTriangle, CheckCircle, Clock, Shield, Globe, ChevronRight, X, GitBranch, Zap, Server, Network, Eye, Lock, RefreshCw, Loader2 } from "lucide-react";

type TwinState = "stable" | "degraded" | "awaiting_approval";
type Domain = "aegis" | "terra" | "vessels" | "alloy" | "prism" | "lyte";

interface CrossDomainTwin {
  id: string;
  name: string;
  domain: Domain;
  state: TwinState;
  driftScore: number;
  lastSync: string;
  proofState: "verified" | "pending" | "unverified";
  pendingActions: number;
  worldline: string;
  summary: string;
}

interface FirestormIncident {
  id: number;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

const DOMAIN_CONFIG: Record<Domain, { label: string; color: string; icon: typeof Globe }> = {
  aegis: { label: "Aegis — Defense", color: "#ef4444", icon: Shield },
  terra: { label: "Terra — Real Estate", color: "#10b981", icon: Globe },
  vessels: { label: "Vessels — Maritime", color: "#06b6d4", icon: Network },
  alloy: { label: "Alloy — Execution", color: "#4B8BDB", icon: Zap },
  prism: { label: "Prism — Counsel", color: "#f59e0b", icon: Globe },
  lyte: { label: "Lyte — AIOps", color: "#d4a054", icon: Activity },
};

const STATE_CONFIG: Record<TwinState, { color: string; label: string; bg: string; border: string }> = {
  stable: { color: "#10b981", label: "Stable", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  degraded: { color: "#f59e0b", label: "Degraded", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  awaiting_approval: { color: "#8b7ac8", label: "Awaiting Approval", bg: "rgba(139,122,200,0.08)", border: "rgba(139,122,200,0.2)" },
};

const SEED_TWINS: CrossDomainTwin[] = [
  { id: "tw-aeg-001", name: "Aegis Posture Twin", domain: "aegis", state: "degraded", driftScore: 28, lastSync: "3m ago", proofState: "pending", pendingActions: 3, worldline: "WL-BETA", summary: "3 active incidents in AWS VPC, K8s app tier drifted from approved baseline" },
  { id: "tw-aeg-002", name: "Aegis OT/ICS Twin", domain: "aegis", state: "awaiting_approval", driftScore: 18, lastSync: "11m ago", proofState: "pending", pendingActions: 1, worldline: "WL-GAMMA", summary: "PLC firmware delta awaiting CISO approval before reconciliation" },
  { id: "tw-terra-001", name: "Terra Property Fabric", domain: "terra", state: "stable", driftScore: 4, lastSync: "45s ago", proofState: "verified", pendingActions: 0, worldline: "WL-ALPHA", summary: "All property twins synced, portfolio valuation current to market" },
  { id: "tw-vessels-001", name: "Vessels Fleet Twin", domain: "vessels", state: "stable", driftScore: 7, lastSync: "2m ago", proofState: "verified", pendingActions: 0, worldline: "WL-ALPHA", summary: "14 vessels tracked, all within geofence, AIS data nominal" },
  { id: "tw-vessels-002", name: "Vessels Cargo Twin", domain: "vessels", state: "awaiting_approval", driftScore: 12, lastSync: "8m ago", proofState: "pending", pendingActions: 2, worldline: "WL-DELTA", summary: "Cargo manifest variance on VES-MV-047, awaiting port authority confirmation" },
  { id: "tw-alloy-001", name: "Alloy Execution Fabric", domain: "alloy", state: "stable", driftScore: 2, lastSync: "30s ago", proofState: "verified", pendingActions: 0, worldline: "WL-ALPHA", summary: "247 workflows active, all executions within SLA, proof chain intact" },
  { id: "tw-prism-001", name: "Prism Counsel Twin", domain: "prism", state: "stable", driftScore: 3, lastSync: "1m ago", proofState: "verified", pendingActions: 0, worldline: "WL-ALPHA", summary: "Legal entity registry current, 2 NDA reviews in flight but on track" },
  { id: "tw-lyte-001", name: "Lyte AIOps Twin", domain: "lyte", state: "degraded", driftScore: 21, lastSync: "6m ago", proofState: "pending", pendingActions: 4, worldline: "WL-BETA", summary: "4 SLO breaches active, autonomous NOC handling 3 incidents, 1 requires human escalation" },
];

function WorldlineDrawer({ twins, onClose }: { twins: CrossDomainTwin[]; onClose: () => void }) {
  const worldlines = ["WL-ALPHA", "WL-BETA", "WL-GAMMA", "WL-DELTA"];
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      <div className="w-full max-w-sm border-l overflow-y-auto flex flex-col" style={{ background: "#0c1420", borderColor: "rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b sticky top-0" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0c1420" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#8b7ac8" }}>Worldline Overlay</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/5 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-sm font-bold text-white">Causal Branch Registry</div>
          <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Active worldlines across all domains</div>
        </div>
        <div className="p-5 space-y-4">
          {worldlines.map(wl => {
            const wlTwins = twins.filter(t => t.worldline === wl);
            if (wlTwins.length === 0) return null;
            const degraded = wlTwins.filter(t => t.state !== "stable");
            const color = degraded.length === 0 ? "#10b981" : degraded.some(t => t.state === "awaiting_approval") ? "#8b7ac8" : "#f59e0b";
            return (
              <div key={wl} className="rounded-xl border p-4" style={{ borderColor: `${color}25`, background: `${color}06` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold font-mono" style={{ color }}>{wl}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ color: degraded.length === 0 ? "#10b981" : color, background: `${color}15` }}>
                    {degraded.length === 0 ? "All stable" : `${degraded.length} need action`}
                  </span>
                </div>
                {wlTwins.map(tw => {
                  const s = STATE_CONFIG[tw.state];
                  const d = DOMAIN_CONFIG[tw.domain];
                  return (
                    <div key={tw.id} className="flex items-center gap-2 py-1.5 border-t text-[10px]" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      <d.icon className="w-3 h-3 shrink-0" style={{ color: d.color }} />
                      <span className="flex-1 truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{tw.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ color: s.color, background: s.bg }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function useAtlasBranches() {
  return useQuery<{ branches: Array<{ id: string; branchName: string; status: string; twinCategory?: string }>; count: number }>({
    queryKey: ["command-atlas-branches"],
    queryFn: () => fetch("/api/atlas/spatial/branches?limit=20").then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then(r => r.data ?? r),
    staleTime: 30000,
    retry: 1,
  });
}

function useFirestormIncidents() {
  return useQuery<FirestormIncident[]>({
    queryKey: ["command-firestorm-incidents"],
    queryFn: () => fetch("/api/firestorm/incidents").then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then(r => (Array.isArray(r.data) ? r.data : Array.isArray(r) ? r : [])),
    staleTime: 30000,
    retry: 1,
  });
}

export function AtlasRuntimePage() {
  const [showWorldline, setShowWorldline] = useState(false);
  const [selectedTwin, setSelectedTwin] = useState<CrossDomainTwin | null>(null);
  const [safeMode, setSafeMode] = useSafeMode();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: branchData, isLoading: loadingBranches, refetch: refetchBranches } = useAtlasBranches();
  const { data: incidentData, isLoading: loadingIncidents, refetch: refetchIncidents } = useFirestormIncidents();

  const apiBranchCount = branchData?.count ?? 0;
  const liveIncidents = Array.isArray(incidentData) ? incidentData : [];
  const openIncidents = liveIncidents.filter(i => i.status !== "resolved");
  const criticalIncidents = openIncidents.filter(i => i.severity === "critical");

  const TWINS: CrossDomainTwin[] = SEED_TWINS.map(tw => {
    if (tw.domain !== "aegis" || openIncidents.length === 0) return tw;
    const extraPending = criticalIncidents.length > 0 ? Math.max(0, criticalIncidents.length - tw.pendingActions) : 0;
    const liveState: TwinState = criticalIncidents.length >= 3 ? "degraded" : tw.state;
    const liveSummary = openIncidents.length > 0 && tw.id === "tw-aeg-001"
      ? `${openIncidents.length} open incident${openIncidents.length !== 1 ? "s" : ""} — ${criticalIncidents.length} critical — live from Firestorm`
      : tw.summary;
    return { ...tw, state: liveState, pendingActions: tw.pendingActions + extraPending, summary: liveSummary };
  });

  const visibleTwins = safeMode ? TWINS.filter(t => t.state === "stable" && t.proofState === "verified") : TWINS;
  const stable = TWINS.filter(t => t.state === "stable");
  const degraded = TWINS.filter(t => t.state === "degraded");
  const awaiting = TWINS.filter(t => t.state === "awaiting_approval");
  const pendingTotal = TWINS.reduce((s, t) => s + t.pendingActions, 0);

  const isLoading = loadingBranches || loadingIncidents;

  function handleSync() {
    setLastRefresh(new Date());
    refetchBranches();
    refetchIncidents();
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#8b7ac8" }}>Command · ATLAS Spatial Runtime</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Cross-Domain Atlas View</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Real-time spatial twin health across all domains with worldline registry and governed action handoff.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setSafeMode(!safeMode)}
            className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={safeMode ? { color: "#8b7ac8", borderColor: "rgba(139,122,200,0.4)", background: "rgba(139,122,200,0.1)" } : { color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <Lock className="w-3 h-3" /> {safeMode ? "Safe Mode ON" : "Safe Mode"}
          </button>
          <button
            onClick={handleSync}
            className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync
          </button>
          <button onClick={() => setShowWorldline(true)} className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "#8b7ac8", borderColor: "rgba(139,122,200,0.3)", background: "rgba(139,122,200,0.06)" }}>
            <GitBranch className="w-3 h-3" /> Worldlines
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Twins", value: TWINS.length, color: "#8b7ac8" },
          { label: "Stable", value: stable.length, color: "#10b981" },
          { label: "Degraded", value: degraded.length, color: "#f59e0b", pulse: true },
          { label: "Pending Actions", value: pendingTotal, color: "#ef4444", pulse: pendingTotal > 0 },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
              {c.pulse && c.value > 0 && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.color }} />}
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {liveIncidents.length > 0 && !safeMode && (
        <div className="rounded-xl border px-4 py-2.5 flex items-center gap-3" style={{ borderColor: "rgba(239,68,68,0.12)", background: "rgba(239,68,68,0.02)" }}>
          <Activity className="w-3 h-3 shrink-0" style={{ color: "#ef4444" }} />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Firestorm live feed: <span className="font-bold font-mono" style={{ color: "#ef4444" }}>{openIncidents.length}</span> open incident{openIncidents.length !== 1 ? "s" : ""} · <span className="font-bold font-mono" style={{ color: criticalIncidents.length > 0 ? "#ef4444" : "rgba(255,255,255,0.5)" }}>{criticalIncidents.length}</span> critical — Aegis twins updated
          </span>
          <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{lastRefresh.toLocaleTimeString()}</span>
        </div>
      )}

      {safeMode && (
        <div className="rounded-xl border p-3 flex items-center gap-3" style={{ borderColor: "rgba(139,122,200,0.25)", background: "rgba(139,122,200,0.06)" }}>
          <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: "#8b7ac8" }} />
          <div>
            <div className="text-[10px] font-bold" style={{ color: "#8b7ac8" }}>Executive Safe Mode Active</div>
            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>Only verified/stable twins shown. {TWINS.length - visibleTwins.length} degraded or unreviewed twin{TWINS.length - visibleTwins.length !== 1 ? "s" : ""} hidden.</div>
          </div>
        </div>
      )}

      {!safeMode && awaiting.length > 0 && (
        <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "rgba(139,122,200,0.2)", background: "rgba(139,122,200,0.04)" }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#8b7ac8" }} />
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-white mb-0.5">{awaiting.length} twin{awaiting.length > 1 ? "s" : ""} awaiting approval</div>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>These twins have state changes pending CISO or operator review before reconciliation can proceed.</div>
          </div>
          <button className="text-[10px] px-3 py-1.5 rounded-lg font-medium" style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.1)", border: "1px solid rgba(139,122,200,0.3)" }}>Review All</button>
        </div>
      )}

      {apiBranchCount > 0 && (
        <div className="rounded-xl border px-4 py-2.5 flex items-center gap-3" style={{ borderColor: "rgba(139,122,200,0.12)", background: "rgba(139,122,200,0.02)" }}>
          <GitBranch className="w-3 h-3 shrink-0" style={{ color: "#8b7ac8" }} />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span className="font-bold font-mono" style={{ color: "#8b7ac8" }}>{apiBranchCount}</span> live scenario branch{apiBranchCount !== 1 ? "es" : ""} in ATLAS — open Worldline Overlay for details
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleTwins.map(tw => {
          const s = STATE_CONFIG[tw.state];
          const d = DOMAIN_CONFIG[tw.domain];
          const DIcon = d.icon;
          return (
            <div key={tw.id} onClick={() => setSelectedTwin(tw === selectedTwin ? null : tw)} className="rounded-xl border cursor-pointer transition-all hover:border-white/15" style={{ borderColor: tw.state !== "stable" ? s.border : "rgba(255,255,255,0.07)", background: tw.state !== "stable" ? s.bg : "rgba(255,255,255,0.01)" }}>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-1.5 rounded-lg shrink-0" style={{ background: `${d.color}15`, border: `1px solid ${d.color}25` }}>
                    <DIcon className="w-3.5 h-3.5" style={{ color: d.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold mb-0.5" style={{ color: d.color }}>{d.label}</div>
                    <div className="text-[11px] font-semibold text-white truncate">{tw.name}</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
                      {tw.state !== "stable" && <span className="inline-block w-1 h-1 rounded-full animate-pulse mr-1 align-middle" style={{ background: s.color }} />}
                      {s.label}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] leading-snug mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>{tw.summary}</div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Drift", value: `Δ${tw.driftScore}%`, color: tw.driftScore <= 5 ? "#10b981" : tw.driftScore <= 15 ? "#f59e0b" : "#ef4444" },
                    { label: "Sync", value: tw.lastSync, color: "rgba(255,255,255,0.5)" },
                    { label: "Actions", value: `${tw.pendingActions}`, color: tw.pendingActions > 0 ? "#f59e0b" : "#10b981" },
                  ].map(s2 => (
                    <div key={s2.label} className="rounded-lg p-2 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{s2.label}</div>
                      <div className="text-[10px] font-bold font-mono" style={{ color: s2.color }}>{s2.value}</div>
                    </div>
                  ))}
                </div>

                {selectedTwin?.id === tw.id && (
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 text-[9px]">
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>Worldline:</span>
                      <span className="font-mono" style={{ color: "#8b7ac8" }}>{tw.worldline}</span>
                      <span className="ml-auto" style={{ color: "rgba(255,255,255,0.3)" }}>Proof: <span style={{ color: tw.proofState === "verified" ? "#10b981" : tw.proofState === "pending" ? "#f59e0b" : "#ef4444" }}>{tw.proofState}</span></span>
                    </div>
                    {tw.pendingActions > 0 && (
                      <button className="w-full text-[10px] px-3 py-1.5 rounded-lg font-medium text-center transition-all" style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.08)", border: "1px solid rgba(139,122,200,0.2)" }}>
                        Review {tw.pendingActions} Pending Action{tw.pendingActions > 1 ? "s" : ""}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showWorldline && <WorldlineDrawer twins={TWINS} onClose={() => setShowWorldline(false)} />}
    </div>
  );
}

export default AtlasRuntimePage;
