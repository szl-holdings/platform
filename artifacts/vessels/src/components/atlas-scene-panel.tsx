import { useState, useEffect } from "react";
import { GitBranch, Activity, Navigation, ChevronDown, ChevronRight, Anchor, Shield, Lock, RefreshCw } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = { surface: "#090d15", card: "#0e1220", inset: "#060d1a" };
const BORDER = { muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" };
const ACCENT = { blue: "#4a90b8", amber: "#c8953c", green: "#6b8f71", red: "#c45a4a" };

const BASE = (import.meta.env.BASE_URL ?? "/vessels/").replace(/\/$/, "");
const API = BASE.replace("/vessels", "/api");

const VESSELS_DEMO_SCENE = {
  sceneId: "vessels-sanctions-reroute-demo",
  domain: "maritime",
  entityType: "vessel",
  entityId: "IMO-9876543",
  driftScore: 0.61,
  state: {
    vesselName: "MV Pacific Horizon",
    imo: "9876543",
    currentRoute: "Strait of Hormuz → Rotterdam",
    sanctionsFlagged: true,
    sanctionsReason: "OFAC SDN — port call at Bandar Abbas",
    weatherSeverity: "moderate",
    voyageEtaDays: 18,
    cargoValueUsd: 14200000,
  },
  branches: [
    {
      branchId: "vessels-cape-reroute",
      branchLabel: "Cape of Good Hope Reroute",
      hypothesis: "Reroute via Cape of Good Hope to avoid OFAC-flagged port and storm system in Arabian Sea.",
      deltaState: {
        alternateRoute: "Cape Town → Rotterdam",
        sanctionsFlagged: false,
        weatherSeverity: "low",
        voyageEtaDays: 26,
        additionalFuelCostUsd: 180000,
      },
      outcomeProjections: [
        { label: "Clean transit, cargo delivered", probability: 0.88, impact: "medium — +8 day delay, +$180K fuel", metrics: { etaDays: 26, additionalCostUsd: 180000, sanctionsRisk: 0 } },
        { label: "Cape reroute, Cape Town port delay", probability: 0.12, impact: "medium — additional 4-day delay at Cape Town", metrics: { etaDays: 30, additionalCostUsd: 280000, sanctionsRisk: 0 } },
      ],
    },
    {
      branchId: "vessels-suez-hold",
      branchLabel: "Suez Canal Hold & Clearance",
      hypothesis: "Anchor at Suez anchorage while OFAC counsel obtains clearance for original route.",
      deltaState: {
        holdDurationDays: 5,
        clearanceProbability: 0.45,
        alternateRoute: null,
        additionalCostUsd: 95000,
      },
      outcomeProjections: [
        { label: "Clearance granted, original route resumes", probability: 0.45, impact: "low — +5 day delay, $95K hold cost", metrics: { etaDays: 23, additionalCostUsd: 95000, sanctionsRisk: 0.05 } },
        { label: "Clearance denied, forced Cape reroute", probability: 0.55, impact: "high — +13 days, $360K total cost", metrics: { etaDays: 31, additionalCostUsd: 360000, sanctionsRisk: 0 } },
      ],
    },
  ],
  helmsmanRecommendations: [
    { title: "Execute Cape reroute immediately", priority: "critical", rationale: "OFAC SDN exposure creates 100% cargo seizure risk on original route." },
    { title: "Notify charterer of delay and cost", priority: "high", rationale: "Charter party force majeure clause notification required within 24h." },
    { title: "File deviation notice with P&I club", priority: "high", rationale: "Hull & machinery insurance requires deviation notice for reroutes." },
  ],
};

function DriftBar({ score }: { score: number }) {
  const color = score >= 0.75 ? ACCENT.red : score >= 0.5 ? ACCENT.amber : ACCENT.green;
  const label = score >= 0.75 ? "Critical Drift" : score >= 0.5 ? "Elevated Drift" : "Nominal";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: TEXT.tertiary }}>Drift Score</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color }}>{label}</span>
          <span className="text-sm font-bold font-mono tabular-nums" style={{ color }}>{score.toFixed(2)}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score * 100}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-mono" style={{ color: TEXT.tertiary }}>0.00 baseline</span>
        <span className="text-[8px] font-mono" style={{ color: TEXT.tertiary }}>1.00 max</span>
      </div>
    </div>
  );
}

function BranchCard({ branch, defaultOpen = false }: { branch: typeof VESSELS_DEMO_SCENE.branches[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: BORDER.muted, background: BG.inset }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
      >
        <GitBranch className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ACCENT.blue }} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold leading-snug" style={{ color: TEXT.primary }}>{branch.branchLabel}</p>
          <p className="text-[10px] mt-0.5 line-clamp-2" style={{ color: TEXT.secondary }}>{branch.hypothesis}</p>
        </div>
        {open ? <ChevronDown className="w-3 h-3 shrink-0 mt-0.5" style={{ color: TEXT.tertiary }} /> : <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" style={{ color: TEXT.tertiary }} />}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: BORDER.muted }}>
          <p className="text-[9px] uppercase tracking-wider font-semibold mt-2.5 mb-1.5" style={{ color: TEXT.tertiary }}>Outcome Projections</p>
          <div className="space-y-1.5">
            {branch.outcomeProjections.map((proj, i) => (
              <div key={i} className="flex items-start gap-2 rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div
                  className="text-[10px] font-bold font-mono tabular-nums mt-0.5 shrink-0 w-8 text-right"
                  style={{ color: proj.probability >= 0.6 ? ACCENT.green : proj.probability >= 0.4 ? ACCENT.amber : ACCENT.red }}
                >
                  {Math.round(proj.probability * 100)}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium leading-snug" style={{ color: TEXT.primary }}>{proj.label}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: TEXT.secondary }}>{proj.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AtlasScenePanelProps {
  vesselId?: string | number;
  isDemo?: boolean;
}

export function AtlasScenePanel({ vesselId, isDemo = true }: AtlasScenePanelProps) {
  const [scene] = useState(VESSELS_DEMO_SCENE);
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  useEffect(() => {
    if (!vesselId || isDemo) return;
    setLoading(true);
    fetch(`${API}/maritime/atlas/signals?entityId=${vesselId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setLiveMode(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vesselId, isDemo]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" style={{ color: ACCENT.blue }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT.secondary }}>ATLAS Scene</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(74,144,184,0.12)", color: ACCENT.blue, border: "1px solid rgba(74,144,184,0.2)" }}>
            {scene.entityId}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {loading && <RefreshCw className="w-3 h-3 animate-spin" style={{ color: TEXT.tertiary }} />}
          <span
            className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: liveMode ? "rgba(107,143,113,0.15)" : "rgba(184,151,90,0.12)",
              color: liveMode ? ACCENT.green : ACCENT.amber,
              border: `1px solid ${liveMode ? "rgba(107,143,113,0.25)" : "rgba(200,149,60,0.25)"}`,
            }}
          >
            {liveMode ? "Live" : "Demo"}
          </span>
        </div>
      </div>

      <div className="rounded-lg p-3" style={{ background: BG.card, border: `1px solid ${BORDER.muted}` }}>
        <DriftBar score={scene.driftScore} />
      </div>

      <div className="rounded-lg p-3 space-y-2" style={{ background: BG.card, border: `1px solid ${BORDER.muted}` }}>
        <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Scene State — {scene.state.vesselName}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>IMO</span>
            <p className="text-[11px] font-semibold font-mono" style={{ color: TEXT.primary }}>{scene.state.imo}</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>ETA</span>
            <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{scene.state.voyageEtaDays} days</p>
          </div>
          <div className="col-span-2">
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Current Route</span>
            <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{scene.state.currentRoute}</p>
          </div>
          <div className="col-span-2">
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Sanctions Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3 h-3" style={{ color: scene.state.sanctionsFlagged ? ACCENT.red : ACCENT.green }} />
              <p className="text-[11px] font-semibold" style={{ color: scene.state.sanctionsFlagged ? ACCENT.red : ACCENT.green }}>
                {scene.state.sanctionsFlagged ? "FLAGGED" : "Clear"}
              </p>
            </div>
            {scene.state.sanctionsFlagged && (
              <p className="text-[9px] mt-0.5" style={{ color: ACCENT.red }}>{scene.state.sanctionsReason}</p>
            )}
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Weather</span>
            <p className="text-[11px] font-semibold capitalize" style={{ color: scene.state.weatherSeverity === "moderate" ? ACCENT.amber : TEXT.primary }}>{scene.state.weatherSeverity}</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Cargo Value</span>
            <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>${(scene.state.cargoValueUsd / 1e6).toFixed(1)}M</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: TEXT.tertiary }}>Reroute Branches</p>
        <div className="space-y-2">
          {scene.branches.map((b, i) => (
            <BranchCard key={b.branchId} branch={b} defaultOpen={i === 0} />
          ))}
        </div>
      </div>

      <div className="rounded-lg p-3" style={{ background: BG.card, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Anchor className="w-3 h-3" style={{ color: ACCENT.blue }} />
          <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Helmsman Recommendations</p>
        </div>
        <div className="space-y-1.5">
          {scene.helmsmanRecommendations.map((r, i) => {
            const col = r.priority === "critical" ? ACCENT.red : r.priority === "high" ? ACCENT.amber : ACCENT.green;
            return (
              <div key={i} className="flex items-start gap-2 rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.muted}` }}>
                <Navigation className="w-3 h-3 mt-0.5 shrink-0" style={{ color: col }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>{r.title}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: TEXT.secondary }}>{r.rationale}</p>
                </div>
                <span className="text-[8px] uppercase font-mono px-1 py-0.5 rounded shrink-0" style={{ background: `${col}18`, color: col }}>{r.priority}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${BORDER.muted}` }}>
        <Lock className="w-3 h-3 shrink-0" style={{ color: TEXT.tertiary }} />
        <p className="text-[9px]" style={{ color: TEXT.tertiary }}>Branch execution requires <span style={{ color: TEXT.secondary }}>vessel_master</span> approval — governed via Alloy proof chain</p>
      </div>
    </div>
  );
}
