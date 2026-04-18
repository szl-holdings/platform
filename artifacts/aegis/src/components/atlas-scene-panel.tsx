import { useState, useEffect } from "react";
import { GitBranch, Activity, AlertTriangle, ChevronDown, ChevronRight, Zap, Shield, Lock, RefreshCw } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = { surface: "#0a0d14", card: "#0f131e", inset: "#080b11" };
const BORDER = { muted: "rgba(255,255,255,0.07)", accent: "rgba(196,90,74,0.3)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)" };
const ACCENT = { red: "#c45a4a", amber: "#c8953c", green: "#6b8f71", blue: "#4a90b8" };

const BASE = (import.meta.env.BASE_URL ?? "/aegis/").replace(/\/$/, "");
const API = BASE.replace("/aegis", "/api");

const AEGIS_DEMO_SCENE = {
  sceneId: "aegis-ransomware-branch-demo",
  domain: "security",
  entityType: "incident",
  entityId: "INC-2026-001",
  driftScore: 0.82,
  state: {
    incidentId: "INC-2026-001",
    severity: "critical",
    attackVector: "phishing",
    affectedSystems: ["AD Domain Controller", "ERP Server", "File Share"],
    ransomwareFamily: "LockBit 3.0",
    encryptedVolumesGb: 2400,
    containmentStatus: "partial",
    mitreTechniques: ["T1566.001", "T1078", "T1486"],
  },
  branches: [
    {
      branchId: "aegis-isolate-branch",
      branchLabel: "Network Isolation Path",
      hypothesis: "If we isolate the ERP Server immediately, can we prevent lateral movement to financial systems?",
      deltaState: {
        containmentStatus: "full",
        isolatedSystems: ["ERP Server"],
        estimatedRecoveryHours: 48,
        financialSystemsCompromised: false,
      },
      outcomeProjections: [
        { label: "Successful isolation before financial breach", probability: 0.72, impact: "high — prevents $2.4M ransomware payout", metrics: { recoveryHours: 48, dataLossGb: 200, estimatedCostUsd: 180000 } },
        { label: "Isolation fails, lateral movement succeeds", probability: 0.28, impact: "critical — financial system breach", metrics: { recoveryHours: 120, dataLossGb: 2400, estimatedCostUsd: 2400000 } },
      ],
    },
    {
      branchId: "aegis-monitor-branch",
      branchLabel: "Monitor and Contain",
      hypothesis: "Monitor traffic patterns for 4 hours before isolation to collect additional lateral movement data.",
      deltaState: {
        containmentStatus: "monitoring",
        observationWindowHours: 4,
        additionalDataPoints: "lateral movement telemetry",
      },
      outcomeProjections: [
        { label: "Additional intel collected, targeted isolation", probability: 0.61, impact: "medium — 72-hour recovery, $340K cost", metrics: { recoveryHours: 72, dataLossGb: 800, estimatedCostUsd: 340000 } },
        { label: "Extended dwell time, wider spread", probability: 0.39, impact: "critical — financial systems breached", metrics: { recoveryHours: 168, dataLossGb: 2400, estimatedCostUsd: 2400000 } },
      ],
    },
  ],
  forgeProposals: [
    { title: "Isolate AD Domain Controller", priority: "critical", rationale: "DC compromise enables ransomware propagation to all domain-joined hosts." },
    { title: "Revoke all domain admin tokens", priority: "high", rationale: "T1078 (Valid Accounts) suggests credential compromise." },
    { title: "Engage IR retainer — on-site team", priority: "high", rationale: "Encrypted volumes at 2.4 TB scale require forensic imaging." },
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

function BranchCard({ branch, defaultOpen = false }: { branch: typeof AEGIS_DEMO_SCENE.branches[0]; defaultOpen?: boolean }) {
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
  incidentId?: string | number;
  isDemo?: boolean;
}

export function AtlasScenePanel({ incidentId, isDemo = true }: AtlasScenePanelProps) {
  const [scene, setScene] = useState(AEGIS_DEMO_SCENE);
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  useEffect(() => {
    if (!incidentId || isDemo) return;
    setLoading(true);
    fetch(`${API}/security/atlas/signals?entityId=${incidentId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setLiveMode(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [incidentId, isDemo]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" style={{ color: ACCENT.red }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: TEXT.secondary }}>ATLAS Scene</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(196,90,74,0.12)", color: ACCENT.red, border: `1px solid rgba(196,90,74,0.2)` }}>
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
        <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Scene State</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Severity</span>
            <p className="text-[11px] font-semibold capitalize" style={{ color: ACCENT.red }}>{scene.state.severity}</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Vector</span>
            <p className="text-[11px] font-semibold capitalize" style={{ color: TEXT.primary }}>{scene.state.attackVector}</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Ransomware</span>
            <p className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{scene.state.ransomwareFamily}</p>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Containment</span>
            <p className="text-[11px] font-semibold capitalize" style={{ color: ACCENT.amber }}>{scene.state.containmentStatus}</p>
          </div>
          <div className="col-span-2">
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>Affected Systems</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {scene.state.affectedSystems.map(s => (
                <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(196,90,74,0.1)", color: ACCENT.red, border: `1px solid rgba(196,90,74,0.2)` }}>{s}</span>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <span className="text-[9px]" style={{ color: TEXT.tertiary }}>MITRE ATT&CK</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {scene.state.mitreTechniques.map(t => (
                <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(74,144,184,0.1)", color: ACCENT.blue, border: `1px solid rgba(74,144,184,0.2)` }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: TEXT.tertiary }}>Scenario Forge Branches</p>
        <div className="space-y-2">
          {scene.branches.map((b, i) => (
            <BranchCard key={b.branchId} branch={b} defaultOpen={i === 0} />
          ))}
        </div>
      </div>

      <div className="rounded-lg p-3" style={{ background: BG.card, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Zap className="w-3 h-3" style={{ color: ACCENT.amber }} />
          <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: TEXT.tertiary }}>Scenario Forge Proposals</p>
        </div>
        <div className="space-y-1.5">
          {scene.forgeProposals.map((p, i) => {
            const col = p.priority === "critical" ? ACCENT.red : p.priority === "high" ? ACCENT.amber : ACCENT.green;
            return (
              <div key={i} className="flex items-start gap-2 rounded px-2 py-1.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.muted}` }}>
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: col }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>{p.title}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: TEXT.secondary }}>{p.rationale}</p>
                </div>
                <span className="text-[8px] uppercase font-mono px-1 py-0.5 rounded shrink-0" style={{ background: `${col}18`, color: col }}>{p.priority}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${BORDER.muted}` }}>
        <Lock className="w-3 h-3 shrink-0" style={{ color: TEXT.tertiary }} />
        <p className="text-[9px]" style={{ color: TEXT.tertiary }}>Branch execution requires <span style={{ color: TEXT.secondary }}>security_lead</span> approval — governed via Alloy proof chain</p>
      </div>
    </div>
  );
}
