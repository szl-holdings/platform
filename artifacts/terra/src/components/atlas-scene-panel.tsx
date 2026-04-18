import { useState, useEffect } from "react";
import { GitBranch, Activity, Building2, ChevronDown, ChevronRight, TrendingUp, Target, Lock, RefreshCw, AlertTriangle } from "lucide-react";

const BG = { surface: "#050a08", card: "#080e0a", inset: "#040807" };
const BORDER = { muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" };
const ACCENT = { green: "#40856a", amber: "#c8953c", red: "#c45a4a", blue: "#4a90b8" };

const BASE = (import.meta.env.BASE_URL ?? "/terra/").replace(/\/$/, "");
const API = BASE.replace("/terra", "/api");

const TERRA_DEMO_SCENE = {
  sceneId: "terra-property-distress-demo",
  domain: "real_estate",
  entityType: "property",
  entityId: "PROP-BK-2026-0142",
  driftScore: 0.74,
  state: {
    propertyId: "PROP-BK-2026-0142",
    address: "842 Atlantic Ave, Brooklyn, NY 11238",
    distressScore: 87,
    lisPendens: true,
    taxArrears: 142000,
    estimatedArv: 2800000,
    currentAskUsd: 1950000,
    daysOnMarket: 214,
  },
  branches: [
    {
      branchId: "terra-direct-acquisition",
      branchLabel: "Direct Acquisition — Pre-Foreclosure",
      hypothesis: "Acquire pre-foreclosure at 65% ARV, settle tax arrears, reposition within 18 months.",
      deltaState: {
        acquisitionPriceUsd: 1820000,
        taxArrearsSettled: true,
        projectedExitUsd: 2750000,
        holdPeriodMonths: 18,
        projectedIrr: 0.24,
      },
      outcomeProjections: [
        { label: "Successful repositioning at target price", probability: 0.66, impact: "high — 24% IRR, $930K net gain", metrics: { exitPriceUsd: 2750000, netGainUsd: 930000, irr: 0.24 } },
        { label: "Market softens, 12-month hold extension", probability: 0.28, impact: "medium — 14% IRR, $560K net gain", metrics: { exitPriceUsd: 2380000, netGainUsd: 560000, irr: 0.14 } },
        { label: "Structural issue discovered post-acquisition", probability: 0.06, impact: "high — $280K remediation, IRR breakeven", metrics: { exitPriceUsd: 2100000, netGainUsd: 0, irr: 0.0 } },
      ],
    },
    {
      branchId: "terra-note-purchase",
      branchLabel: "Distressed Note Purchase",
      hypothesis: "Purchase the delinquent mortgage note at a discount and pursue deed-in-lieu or modified foreclosure.",
      deltaState: {
        notePurchasePriceUsd: 1400000,
        deedInLieuProbability: 0.55,
        estimatedTimelineMonths: 9,
        projectedIrr: 0.31,
      },
      outcomeProjections: [
        { label: "Deed-in-lieu granted, fast close", probability: 0.55, impact: "high — 31% IRR, $1.05M net gain", metrics: { exitPriceUsd: 2450000, netGainUsd: 1050000, irr: 0.31 } },
        { label: "Foreclosure required, 9-month delay", probability: 0.45, impact: "medium — 18% IRR, $630K net gain", metrics: { exitPriceUsd: 2030000, netGainUsd: 630000, irr: 0.18 } },
      ],
    },
  ],
  acquisitionRecommendations: [
    { title: "Title search and lien clearance", priority: "critical", rationale: "Lis pendens and $142K tax arrears require clean title before acquisition." },
    { title: "Schedule Phase I environmental", priority: "high", rationale: "Atlantic Ave corridor has historic contamination flags in EPA records." },
    { title: "Contact owner pre-auction", priority: "high", rationale: "Days on market (214) and distress score (87) indicate motivated seller." },
  ],
};

function DriftBar({ score }: { score: number }) {
  const color = score >= 0.75 ? ACCENT.amber : score >= 0.5 ? ACCENT.amber : ACCENT.green;
  const label = score >= 0.75 ? "Elevated Distress" : score >= 0.5 ? "Watch" : "Nominal";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: TEXT.tertiary }}>Distress Drift</span>
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

function BranchCard({ branch, defaultOpen = false }: { branch: typeof TERRA_DEMO_SCENE.branches[0]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: BORDER.muted, background: BG.inset }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
      >
        <GitBranch className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ACCENT.green }} />
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
  propertyId?: string;
  isDemo?: boolean;
}

export function AtlasScenePanel({ propertyId, isDemo = true }: AtlasScenePanelProps) {
  const [scene] = useState(TERRA_DEMO_SCENE);
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  useEffect(() => {
    if (!propertyId || isDemo) return;
    setLoading(true);
    fetch(`${API}/real_estate/atlas/signals?entityId=${propertyId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setLiveMode(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propertyId, isDemo]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" style={{ color: ACCENT.green }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT.secondary }}>ATLAS Scene</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(64,133,106,0.12)", color: ACCENT.green, border: "1px solid rgba(64,133,106,0.2)" }}>
            {scene.entityId}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {loading && <RefreshCw className="w-3 h-3 animate-spin" style={{ color: TEXT.tertiary }} />}
          <span
            className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: liveMode ? "rgba(64,133,106,0.15)" : "rgba(184,151,90,0.12)",
              color: liveMode ? ACCENT.green : ACCENT.amber,
              border: `1px solid ${liveMode ? "rgba(64,133,106,0.25)" : "rgba(200,149,60,0.25)"}`,
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
        <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Scene State</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="col-span-2">
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Address</span>
            <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{scene.state.address}</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Distress Score</span>
            <p className="text-[11px] font-bold" style={{ color: ACCENT.amber }}>{scene.state.distressScore}/100</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Days on Market</span>
            <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{scene.state.daysOnMarket}</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Est. ARV</span>
            <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>${(scene.state.estimatedArv / 1e6).toFixed(1)}M</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Ask Price</span>
            <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>${(scene.state.currentAskUsd / 1e6).toFixed(1)}M</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Tax Arrears</span>
            <p className="text-[11px] font-semibold" style={{ color: ACCENT.red }}>${(scene.state.taxArrears / 1e3).toFixed(0)}K</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Lis Pendens</span>
            <p className="text-[11px] font-semibold" style={{ color: scene.state.lisPendens ? ACCENT.red : ACCENT.green }}>
              {scene.state.lisPendens ? "Filed" : "Clear"}
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: TEXT.tertiary }}>Acquisition Scenario Branches</p>
        <div className="space-y-2">
          {scene.branches.map((b, i) => (
            <BranchCard key={b.branchId} branch={b} defaultOpen={i === 0} />
          ))}
        </div>
      </div>

      <div className="rounded-lg p-3" style={{ background: BG.card, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Target className="w-3 h-3" style={{ color: ACCENT.green }} />
          <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Acquisition Recommendations</p>
        </div>
        <div className="space-y-1.5">
          {scene.acquisitionRecommendations.map((r, i) => {
            const col = r.priority === "critical" ? ACCENT.red : r.priority === "high" ? ACCENT.amber : ACCENT.green;
            return (
              <div key={i} className="flex items-start gap-2 rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.muted}` }}>
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: col }} />
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
        <p className="text-[9px]" style={{ color: TEXT.tertiary }}>Branch execution requires <span style={{ color: TEXT.secondary }}>investment_committee</span> approval — governed via Alloy proof chain</p>
      </div>
    </div>
  );
}
