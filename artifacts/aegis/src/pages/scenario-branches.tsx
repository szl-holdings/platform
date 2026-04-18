import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { GitBranch, Zap, AlertTriangle, CheckCircle, XCircle, ChevronRight, Target, Shield, Clock, BarChart3, Play, Lock, Loader2 } from "lucide-react";
import { ExecutiveSafeModeProvider, useExecutiveSafeMode } from "../lib/executive-safe-mode-context";

type BranchOutcome = "contained" | "escalated" | "catastrophic" | "recovering";

interface ScenarioBranch {
  id: string;
  name: string;
  trigger: string;
  probability: number;
  blastRadius: number;
  assetsAffected: number;
  outcome: BranchOutcome;
  mttr: string;
  costImpact: string;
  driftFromBaseline: number;
  actions: string[];
  controlGaps: string[];
  recommended: boolean;
}

interface ApiBranch {
  id: string;
  branchName: string;
  status: string;
  twinCategory?: string;
  probability?: number;
  blastRadius?: number;
  assetsAffected?: number;
  parameters?: {
    probability?: number;
    blastRadius?: number;
    assetsAffected?: number;
    outcome?: string;
    mttr?: string;
    costImpact?: string;
    driftFromBaseline?: number;
    actions?: string[];
    controlGaps?: string[];
    recommended?: boolean;
    trigger?: string;
  };
}

const OUTCOME_CONFIG: Record<BranchOutcome, { color: string; label: string; icon: typeof CheckCircle }> = {
  contained: { color: "#10b981", label: "Contained", icon: CheckCircle },
  escalated: { color: "#f59e0b", label: "Escalated", icon: AlertTriangle },
  catastrophic: { color: "#ef4444", label: "Catastrophic", icon: XCircle },
  recovering: { color: "#8b7ac8", label: "Recovering", icon: Zap },
};

const STATUS_OUTCOME_MAP: Record<string, BranchOutcome> = {
  active: "recovering",
  completed: "contained",
  archived: "escalated",
  failed: "catastrophic",
};

const SEED_BRANCHES: ScenarioBranch[] = [
  {
    id: "br-001",
    name: "Branch A — Immediate Isolation",
    trigger: "Automated containment triggers within 8 minutes of lateral move detection",
    probability: 34,
    blastRadius: 12,
    assetsAffected: 3,
    outcome: "contained",
    mttr: "1h 22m",
    costImpact: "$240K",
    driftFromBaseline: 8,
    actions: ["Isolate WKSTN-FIN-042 via EDR", "Revoke krbtgt — force Kerberos reissue", "Enable enhanced logging on all DCs", "Page SOC Tier-2 analyst"],
    controlGaps: [],
    recommended: true,
  },
  {
    id: "br-002",
    name: "Branch B — Delayed Response",
    trigger: "Alert fatigue delays escalation by 40 minutes; C2 channel established",
    probability: 41,
    blastRadius: 47,
    assetsAffected: 14,
    outcome: "escalated",
    mttr: "6h 48m",
    costImpact: "$1.8M",
    driftFromBaseline: 31,
    actions: ["Broad network segmentation", "Full AD forest reset required", "Engage IR retainer", "Notify legal & comms"],
    controlGaps: ["Alert fatigue mitigation missing", "SIEM correlation rules not tuned", "MFA gap on DC admin accounts"],
    recommended: false,
  },
  {
    id: "br-003",
    name: "Branch C — Undetected Dwell",
    trigger: "Adversary achieves persistence undetected; exfiltrates 47GB over 3 days",
    probability: 18,
    blastRadius: 89,
    assetsAffected: 31,
    outcome: "catastrophic",
    mttr: "11d 4h",
    costImpact: "$8.4M",
    driftFromBaseline: 78,
    actions: ["Full forensic investigation", "Regulatory notification (72h GDPR)", "Executive crisis comms", "Full infrastructure rebuild", "IR + legal retainer engagement"],
    controlGaps: ["DLP not monitoring cloud egress", "No UEBA baselining on privileged accounts", "Exfil detection rules absent", "Threat hunting cadence insufficient"],
    recommended: false,
  },
  {
    id: "br-004",
    name: "Branch D — Proactive Hunt",
    trigger: "Threat hunt initiated on anomalous LDAP queries before lateral movement",
    probability: 7,
    blastRadius: 5,
    assetsAffected: 1,
    outcome: "contained",
    mttr: "0h 45m",
    costImpact: "$80K",
    driftFromBaseline: 2,
    actions: ["Hunt team identifies LDAP anomaly", "Proactive isolation of source host", "Password reset for compromised account", "Accelerated patch of exploited vector"],
    controlGaps: [],
    recommended: false,
  },
];

function apiBranchToScenario(b: ApiBranch, idx: number): ScenarioBranch {
  const params = b.parameters ?? {};
  const outcome = (params.outcome as BranchOutcome) ?? STATUS_OUTCOME_MAP[b.status] ?? "recovering";
  return {
    id: b.id,
    name: b.branchName,
    trigger: params.trigger ?? `Scenario branch created for ${b.twinCategory ?? "twin"} analysis`,
    probability: params.probability ?? Math.floor(Math.random() * 40) + 5,
    blastRadius: params.blastRadius ?? Math.floor(Math.random() * 60) + 5,
    assetsAffected: params.assetsAffected ?? Math.floor(Math.random() * 10) + 1,
    outcome,
    mttr: params.mttr ?? "2h 00m",
    costImpact: params.costImpact ?? "$500K",
    driftFromBaseline: params.driftFromBaseline ?? Math.floor(Math.random() * 30) + 2,
    actions: params.actions ?? ["Review twin state", "Apply remediation playbook", "Notify stakeholders"],
    controlGaps: params.controlGaps ?? [],
    recommended: idx === 0,
  };
}

function BlastRadiusBar({ value }: { value: number }) {
  const color = value <= 15 ? "#10b981" : value <= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: `linear-gradient(to right, ${color}80, ${color})` }} />
      </div>
      <span className="text-[10px] font-bold font-mono w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

function BranchCard({ branch, selected, onSelect }: { branch: ScenarioBranch; selected: boolean; onSelect: () => void }) {
  const oc = OUTCOME_CONFIG[branch.outcome];
  const OIcon = oc.icon;

  return (
    <div
      onClick={onSelect}
      className="rounded-xl border cursor-pointer transition-all"
      style={{
        borderColor: selected ? `${oc.color}40` : branch.recommended ? "rgba(139,122,200,0.2)" : "rgba(255,255,255,0.07)",
        background: selected ? `${oc.color}06` : branch.recommended ? "rgba(139,122,200,0.03)" : "rgba(255,255,255,0.01)",
        boxShadow: selected ? `0 0 0 1px ${oc.color}30` : "none",
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-1.5 rounded-lg shrink-0 mt-0.5" style={{ background: `${oc.color}15`, border: `1px solid ${oc.color}25` }}>
            <OIcon className="w-3.5 h-3.5" style={{ color: oc.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-[11px] font-bold text-white">{branch.name}</span>
              {branch.recommended && (
                <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.15)", border: "1px solid rgba(139,122,200,0.3)" }}>RECOMMENDED</span>
              )}
            </div>
            <div className="text-[10px] leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>{branch.trigger}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold font-mono" style={{ color: branch.probability >= 40 ? "#f59e0b" : "rgba(255,255,255,0.6)" }}>{branch.probability}%</div>
            <div className="text-[8px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>prob.</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[9px]">
            <span className="w-20 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>Blast Radius</span>
            <div className="flex-1"><BlastRadiusBar value={branch.blastRadius} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Assets", value: `${branch.assetsAffected} hosts`, color: oc.color },
              { label: "MTTR", value: branch.mttr, color: "rgba(255,255,255,0.6)" },
              { label: "Cost", value: branch.costImpact, color: branch.outcome === "catastrophic" ? "#ef4444" : "rgba(255,255,255,0.6)" },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</div>
                <div className="text-[10px] font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonDrawer({ a, b, onClose }: { a: ScenarioBranch; b: ScenarioBranch; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      <div className="w-full max-w-2xl border-l overflow-y-auto" style={{ background: "#0c1420", borderColor: "rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b sticky top-0" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0c1420" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#8b7ac8" }}>Branch Comparison</span>
            <button onClick={onClose} className="text-[10px] text-slate-500 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors">✕</button>
          </div>
          <div className="text-sm font-bold text-white">{a.name} vs {b.name}</div>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: "Blast Radius", valA: `${a.blastRadius}%`, valB: `${b.blastRadius}%`, better: a.blastRadius < b.blastRadius ? "a" : "b" },
            { label: "Assets Affected", valA: `${a.assetsAffected}`, valB: `${b.assetsAffected}`, better: a.assetsAffected < b.assetsAffected ? "a" : "b" },
            { label: "MTTR", valA: a.mttr, valB: b.mttr, better: a.mttr < b.mttr ? "a" : "b" },
            { label: "Cost Impact", valA: a.costImpact, valB: b.costImpact, better: a.costImpact < b.costImpact ? "a" : "b" },
            { label: "Drift from Baseline", valA: `${a.driftFromBaseline}%`, valB: `${b.driftFromBaseline}%`, better: a.driftFromBaseline < b.driftFromBaseline ? "a" : "b" },
            { label: "Probability", valA: `${a.probability}%`, valB: `${b.probability}%`, better: null },
          ].map(row => (
            <div key={row.label} className="grid grid-cols-5 gap-3 items-center">
              <div className="col-span-1 text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{row.label}</div>
              <div className="col-span-2 rounded-lg p-2 text-center" style={{ background: row.better === "a" ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${row.better === "a" ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                <div className="text-[10px] font-bold font-mono" style={{ color: row.better === "a" ? "#10b981" : "rgba(255,255,255,0.6)" }}>{row.valA}</div>
                <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>Branch A</div>
              </div>
              <div className="col-span-2 rounded-lg p-2 text-center" style={{ background: row.better === "b" ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${row.better === "b" ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                <div className="text-[10px] font-bold font-mono" style={{ color: row.better === "b" ? "#10b981" : "rgba(255,255,255,0.6)" }}>{row.valB}</div>
                <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>Branch B</div>
              </div>
            </div>
          ))}
          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(139,122,200,0.2)", background: "rgba(139,122,200,0.04)" }}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "#8b7ac8" }}>Control Gap Delta</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Branch A gaps</div>
                {a.controlGaps.length === 0 ? <div className="text-[9px] text-emerald-400">No gaps</div> : a.controlGaps.map((g, i) => <div key={i} className="text-[9px] text-amber-400 mb-0.5">· {g}</div>)}
              </div>
              <div>
                <div className="text-[9px] mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Branch B gaps</div>
                {b.controlGaps.length === 0 ? <div className="text-[9px] text-emerald-400">No gaps</div> : b.controlGaps.map((g, i) => <div key={i} className="text-[9px] text-amber-400 mb-0.5">· {g}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AegisScenarioBranches() {
  return (
    <ExecutiveSafeModeProvider>
      <AegisScenarioBranchesContent />
    </ExecutiveSafeModeProvider>
  );
}

function AegisScenarioBranchesContent() {
  const [selected, setSelected] = useState<string[]>(["br-001"]);
  const [comparing, setComparing] = useState(false);
  const safeMode = useExecutiveSafeMode();

  const { data: branchData, isLoading } = useQuery<{ branches: ApiBranch[]; count: number }>({
    queryKey: ["aegis-atlas-branches"],
    queryFn: () => apiFetch<{ branches: ApiBranch[]; count: number }>("/atlas/spatial/branches?limit=20"),
    staleTime: 30000,
    retry: 1,
  });

  const apiBranches: ScenarioBranch[] = (branchData?.branches ?? [])
    .slice(0, 6)
    .map((b, idx) => apiBranchToScenario(b, idx));

  const BRANCHES = apiBranches.length >= 2 ? apiBranches : SEED_BRANCHES;
  const isLiveData = apiBranches.length >= 2;

  const visibleBranches = safeMode ? BRANCHES.filter(b => b.outcome === "contained" || b.outcome === "recovering") : BRANCHES;

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev.slice(-1), id]);
  }

  const selectedBranches = visibleBranches.filter(b => selected.includes(b.id));
  const canCompare = selectedBranches.length === 2;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#8b7ac8" }}>Aegis · Scenario Forge</span>
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" style={{ color: "rgba(139,122,200,0.5)" }} />}
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Blast Radius Branch Simulation</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Compare scenario branches to model blast radius, control gaps, and recommended response paths.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canCompare && (
            <button onClick={() => setComparing(true)} className="text-[11px] px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all" style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.1)", border: "1px solid rgba(139,122,200,0.3)" }}>
              <BarChart3 className="w-3 h-3" /> Compare Selected
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: "rgba(245,158,11,0.15)", background: "rgba(245,158,11,0.03)" }}>
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#f59e0b" }} />
        <div className="flex-1">
          <div className="text-[11px] font-semibold text-white mb-0.5">Scenario: APT29 Ransomware Campaign — INC-2024-0847</div>
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {isLiveData
              ? `${BRANCHES.length} live scenario branches loaded from ATLAS Spatial Runtime. Select up to 2 branches to compare blast radius and control gaps.`
              : "4 divergence points identified from initial access. Select up to 2 branches to compare blast radius and control gaps."}
          </div>
        </div>
        <div className="text-[10px] font-mono px-3 py-1.5 rounded-lg shrink-0" style={{ color: isLiveData ? "#10b981" : "#f59e0b", background: isLiveData ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${isLiveData ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}` }}>
          {isLiveData ? (
            <><GitBranch className="w-3 h-3 inline mr-1" />{BRANCHES.length} live branches</>
          ) : (
            <><Clock className="w-3 h-3 inline mr-1" />Forged 4m ago</>
          )}
        </div>
      </div>

      {safeMode && (
        <div className="rounded-xl border p-3 flex items-center gap-3" style={{ borderColor: "rgba(139,122,200,0.25)", background: "rgba(139,122,200,0.06)" }}>
          <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: "#8b7ac8" }} />
          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="font-semibold" style={{ color: "#8b7ac8" }}>Executive Safe Mode: </span>
            Escalation and catastrophic branches hidden. {BRANCHES.length - visibleBranches.length} scenario{BRANCHES.length - visibleBranches.length !== 1 ? "s" : ""} suppressed — showing only approved containment paths.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleBranches.map(branch => (
          <BranchCard key={branch.id} branch={branch} selected={selected.includes(branch.id)} onSelect={() => toggleSelect(branch.id)} />
        ))}
      </div>

      {selectedBranches.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: "rgba(139,122,200,0.12)", background: "rgba(139,122,200,0.02)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Play className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />
            <span className="text-[11px] font-semibold text-white">Recommended Actions — {selectedBranches[0].name}</span>
          </div>
          <div className="space-y-1.5">
            {selectedBranches[0].actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#8b7ac8" }} />
                {action}
              </div>
            ))}
          </div>
          {selectedBranches[0].controlGaps.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "#f59e0b" }}>Control Gaps to Address</div>
              {selectedBranches[0].controlGaps.map((gap, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] mb-1" style={{ color: "#f59e0b" }}>
                  <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                  {gap}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {comparing && canCompare && (
        <ComparisonDrawer a={selectedBranches[0]} b={selectedBranches[1]} onClose={() => setComparing(false)} />
      )}
    </div>
  );
}
