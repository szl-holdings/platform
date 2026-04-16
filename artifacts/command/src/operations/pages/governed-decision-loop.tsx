import type { JSX } from "react";
import { useState } from "react";
import {
  Radio, Brain, Activity, Scale, CheckSquare, Play, Shield, Target,
  ChevronRight, ChevronLeft, ArrowRight, Zap, Clock, AlertTriangle,
  CheckCircle, FileText, Cpu, Eye, BarChart3, FlaskConical, BookOpen
} from "lucide-react";
import { ProofProvenancePanel, type ProofEntry } from "../components/governed-decision/proof-provenance-panel";
import { MonteCarloSimPanel, type SimulationScenario, type SensitivityDriver } from "../components/governed-decision/monte-carlo-panel";
import { PolicyGatePanel, type PolicyEvaluation, type ApprovalStep as PolicyApprovalStep, type AuditEntry } from "../components/governed-decision/policy-gate-panel";
import { OutcomePanel, type OutcomeRecord } from "../components/governed-decision/outcome-panel";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e", panel: "#0e1219" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ACCENT = "#d4a054";

interface LoopStep {
  id: string;
  label: string;
  icon: typeof Radio;
  color: string;
  description: string;
}

const LOOP_STEPS: LoopStep[] = [
  { id: "signal", label: "Signal", icon: Radio, color: "#c45a4a", description: "Inbound event detected across domain pack telemetry" },
  { id: "context", label: "Context", icon: Brain, color: "#ec4899", description: "Signal enriched with cross-domain intelligence and historical patterns" },
  { id: "recommendation", label: "Recommendation", icon: Zap, color: "#8b7ac8", description: "AI-generated action recommendation with confidence scoring" },
  { id: "simulation", label: "Simulation", icon: Activity, color: "#0ea5e9", description: "Monte Carlo scenario modeling — best / base / worst case analysis" },
  { id: "policy", label: "Policy Gate", icon: Scale, color: ACCENT, description: "Covenant Policy evaluation — automated compliance and risk assessment" },
  { id: "approval", label: "Approval", icon: CheckSquare, color: "#22c55e", description: "Human-in-the-loop approval chain with role-based gates" },
  { id: "execution", label: "Execution", icon: Play, color: "#6366f1", description: "Governed action execution via workflow engine" },
  { id: "proof", label: "Proof Chain", icon: Shield, color: "#d4a054", description: "Immutable provenance record — source, model, confidence, lineage" },
  { id: "outcome", label: "Outcome", icon: Target, color: "#6b8f71", description: "Result captured, prediction accuracy measured, feedback loop closed" },
];

const DEMO_SIGNAL = {
  id: "SIG-4821",
  title: "Fleet ETA compliance gap — 3 vessels outside SLA",
  pack: "Vessels",
  packColor: "#38bdf8",
  severity: "critical" as const,
  detectedAt: "Apr 16, 2026 · 09:11 UTC",
  source: "Vessel Telemetry · AIS Feed",
  entities: ["M/V Meridian", "M/V Catalyst", "M/V Horizon"],
  evidence: [
    { type: "signal", label: "AIS position deviation > 4hr threshold" },
    { type: "pattern", label: "Weather delay correlation — Bay of Bengal" },
    { type: "historical", label: "Similar pattern caused $1.8M SLA breach in Q3 2025" },
  ],
  riskEstimate: "$2.1M",
};

const DEMO_CONTEXT = {
  crossDomainSignals: [
    { pack: "Aegis", color: "#4f6ef7", signal: "Maritime threat advisory — Bay of Bengal piracy risk elevated to Level 3" },
    { pack: "Terra", color: "#a07848", signal: "Port congestion at Singapore — average wait 18hr (normally 6hr)" },
    { pack: "PRISM", color: "#d4a054", signal: "Client SLA contract T-2241 — penalty clause triggers at 96hr delay" },
  ],
  historicalMatches: 14,
  patternConfidence: 87,
  enrichmentSources: ["AIS Live Feed", "Weather API", "Port Authority Database", "Contract Management System"],
};

const DEMO_RECOMMENDATION = {
  id: "REC-0421",
  text: "Authorize fuel surcharge pass-through and reroute M/V Meridian via Strait of Malacca to recover 14hr ETA gap",
  alternativeAction: "Maintain current route and negotiate SLA extension with client",
  confidence: 82,
  modelId: "szl-ops-advisor-v3",
  modelProvider: "SZL Internal",
  reasoning: [
    "Rerouting adds $45K fuel cost but avoids $2.1M SLA penalty",
    "Weather window closing — delay of 12hr reduces reroute effectiveness to <40%",
    "Historical success rate for this reroute pattern: 91% (14 cases)",
    "Client contract permits surcharge pass-through under force majeure clause 7.2",
  ],
};

const DEMO_SIMULATION: { scenarios: SimulationScenario[]; drivers: SensitivityDriver[] } = {
  scenarios: [
    {
      id: "reroute",
      label: "Reroute (Recommended)",
      color: "#6b8f71",
      outputMetric: "Net Savings",
      outputUnit: "$",
      p5: 850000,
      p25: 1400000,
      p50: 1820000,
      p75: 2050000,
      p95: 2300000,
      mean: 1780000,
      stdDev: 340000,
      confidence: 84,
    },
    {
      id: "maintain",
      label: "Maintain Route",
      color: "#c45a4a",
      outputMetric: "Net Savings",
      outputUnit: "$",
      p5: -2100000,
      p25: -1600000,
      p50: -800000,
      p75: -200000,
      p95: 400000,
      mean: -850000,
      stdDev: 620000,
      confidence: 41,
    },
    {
      id: "negotiate",
      label: "Negotiate SLA",
      color: "#c8953c",
      outputMetric: "Net Savings",
      outputUnit: "$",
      p5: -500000,
      p25: 200000,
      p50: 600000,
      p75: 900000,
      p95: 1400000,
      mean: 580000,
      stdDev: 450000,
      confidence: 62,
    },
  ],
  drivers: [
    { input: "Weather Delay", lowValue: 0, highValue: 4, baseOutput: 1820000, lowOutput: 2100000, highOutput: 1200000, unit: "$" },
    { input: "Fuel Price", lowValue: 540, highValue: 720, baseOutput: 1820000, lowOutput: 1950000, highOutput: 1680000, unit: "$" },
    { input: "Port Wait Time", lowValue: 4, highValue: 24, baseOutput: 1820000, lowOutput: 1900000, highOutput: 1500000, unit: "$" },
    { input: "Piracy Premium", lowValue: 0, highValue: 0.08, baseOutput: 1820000, lowOutput: 1850000, highOutput: 1720000, unit: "$" },
    { input: "Client Penalty Rate", lowValue: 0.01, highValue: 0.05, baseOutput: 1820000, lowOutput: 1400000, highOutput: 2100000, unit: "$" },
  ],
};

const DEMO_POLICY: {
  evaluations: PolicyEvaluation[];
  approvalChain: PolicyApprovalStep[];
  auditTrail: AuditEntry[];
} = {
  evaluations: [
    { policyId: "cov-001", policyName: "High-severity actions → Human approval required", outcome: "approved", reason: "Severity = CRITICAL, routed to human approval gate", evaluatedAt: "09:12:04", durationMs: 3 },
    { policyId: "cov-002", policyName: "Financial actions > $50K → Finance review", outcome: "approved", reason: "Fuel surcharge $45K within threshold; reroute cost accepted under operational mandate", evaluatedAt: "09:12:04", durationMs: 2 },
    { policyId: "cov-003", policyName: "Compliance events → Immutable audit log", outcome: "approved", reason: "SLA-related action logged to immutable audit trail", evaluatedAt: "09:12:04", durationMs: 1 },
    { policyId: "cov-005", policyName: "Cross-domain impact → Domain lead sign-off", outcome: "approved", reason: "Vessels + PRISM domains affected; both domain leads notified", evaluatedAt: "09:12:05", durationMs: 4 },
  ],
  approvalChain: [
    { role: "Fleet Operations Lead", approver: "Marcus Chen", status: "approved", timestamp: "09:18", comment: "Confirmed weather window. Reroute is the right call." },
    { role: "Finance Controller", approver: "Aisha Kamara", status: "approved", timestamp: "09:25", comment: "Fuel surcharge within Q2 contingency budget." },
    { role: "CEO", approver: "Stephen Lutar", status: "approved", timestamp: "09:45", comment: "Approved. Protect the SLA — client relationship is strategic." },
  ],
  auditTrail: [
    { timestamp: "09:11:58", action: "Signal SIG-4821 ingested", actor: "System" },
    { timestamp: "09:12:01", action: "Context enrichment completed (4 sources)", actor: "System" },
    { timestamp: "09:12:03", action: "Recommendation REC-0421 generated (82% confidence)", actor: "szl-ops-advisor-v3" },
    { timestamp: "09:12:04", action: "Covenant Policy evaluation — 4 policies checked, all passed", actor: "Covenant Engine" },
    { timestamp: "09:12:06", action: "Monte Carlo simulation completed (10,000 iterations)", actor: "System" },
    { timestamp: "09:12:10", action: "Approval request created — routed to 3-step chain", actor: "System" },
    { timestamp: "09:18:00", action: "Fleet Ops Lead approved", actor: "Marcus Chen" },
    { timestamp: "09:25:00", action: "Finance Controller approved", actor: "Aisha Kamara" },
    { timestamp: "09:45:00", action: "CEO approved — action authorized", actor: "Stephen Lutar" },
    { timestamp: "09:45:02", action: "Execution initiated — reroute order dispatched to vessel", actor: "Workflow Engine" },
    { timestamp: "09:45:05", action: "Proof chain record created — immutable receipt generated", actor: "Proof Chain" },
    { timestamp: "Apr 17, 14:30", action: "Outcome recorded — SLA breach avoided, $2.1M protected", actor: "System" },
  ],
};

const DEMO_PROOF: ProofEntry[] = [
  {
    id: "PF-9041",
    sourceClass: "llm_generated",
    contentType: "Operational Recommendation",
    modelId: "szl-ops-advisor-v3",
    modelProvider: "SZL Internal",
    confidenceScore: 0.82,
    reviewState: "approved",
    exportSafety: "safe",
    generatedAt: "Apr 16, 09:12:03",
    reviewedBy: "Marcus Chen",
    reviewedAt: "Apr 16, 09:18",
    reviewNote: "Recommendation aligns with operational best practice",
    inputSources: [
      { type: "telemetry", label: "AIS Position Feed" },
      { type: "api", label: "Weather API — Bay of Bengal" },
      { type: "database", label: "Contract T-2241 SLA terms" },
      { type: "historical", label: "14 prior reroute decisions" },
    ],
  },
  {
    id: "PF-9042",
    sourceClass: "system_computed",
    contentType: "Monte Carlo Simulation Result",
    confidenceScore: 0.84,
    reviewState: "approved",
    exportSafety: "safe",
    generatedAt: "Apr 16, 09:12:06",
    reviewedBy: "Aisha Kamara",
    reviewedAt: "Apr 16, 09:25",
    inputSources: [
      { type: "model", label: "Voyage Cost Model v2.1" },
      { type: "market", label: "Bunker Fuel Index" },
      { type: "historical", label: "Port delay distributions" },
    ],
    parentProofId: "PF-9041",
  },
];

const DEMO_OUTCOME: OutcomeRecord = {
  id: "OUT-2104",
  result: "achieved",
  executedAction: "Fuel surcharge authorized; M/V Meridian rerouted via Strait of Malacca",
  executedAt: "Apr 16, 09:45",
  executedBy: "Stephen Lutar",
  executedByRole: "CEO",
  outcomeRecordedAt: "Apr 17, 14:30",
  predictedImpact: "$2.1M SLA penalty avoided",
  actualImpact: "$2.1M protected — SLA compliance restored, vessel arrived 6hr ahead of revised ETA",
  accuracy: 97,
  feedbackNote: "Reroute executed cleanly. Weather window was correctly predicted. Recommend pre-authorizing surcharge for similar patterns going forward.",
  laterImpact: "Client relationship strengthened — contract renewal probability increased from 72% to 89%",
  timeToOutcome: "29h 18m",
};

function StepIndicator({ steps, activeIndex, onStepClick }: { steps: LoopStep[]; activeIndex: number; onStepClick: (i: number) => void }) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center shrink-0">
            <button
              onClick={() => onStepClick(i)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: isActive ? `${step.color}15` : isPast ? "rgba(255,255,255,0.02)" : "transparent",
                border: `1px solid ${isActive ? `${step.color}40` : isPast ? BORDER.muted : "transparent"}`,
              }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{
                  background: isActive ? `${step.color}20` : isPast ? "rgba(107,143,113,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? `${step.color}40` : isPast ? "rgba(107,143,113,0.3)" : BORDER.muted}`,
                }}
              >
                {isPast ? (
                  <CheckCircle className="w-2.5 h-2.5" style={{ color: "#6b8f71" }} />
                ) : (
                  <Icon className="w-2.5 h-2.5" style={{ color: isActive ? step.color : TEXT.muted }} />
                )}
              </div>
              <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: isActive ? step.color : isPast ? "#6b8f71" : TEXT.muted }}
              >
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <ArrowRight className="w-3 h-3 mx-0.5 shrink-0" style={{ color: isPast ? "rgba(107,143,113,0.4)" : TEXT.muted }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SignalStep() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(196,90,74,0.1)", border: "2px solid rgba(196,90,74,0.3)" }}>
            <Radio className="w-5 h-5" style={{ color: "#c45a4a" }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: "rgba(196,90,74,0.12)", color: "#c45a4a" }}>Critical</span>
              <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>{DEMO_SIGNAL.id}</span>
              <span className="text-[9px] font-mono ml-auto" style={{ color: TEXT.muted }}>{DEMO_SIGNAL.detectedAt}</span>
            </div>
            <div className="text-base font-bold mb-1" style={{ color: TEXT.primary }}>{DEMO_SIGNAL.title}</div>
            <div className="flex items-center gap-3 text-[10px]" style={{ color: TEXT.tertiary }}>
              <span className="px-1.5 py-0.5 rounded" style={{ background: `${DEMO_SIGNAL.packColor}12`, border: `1px solid ${DEMO_SIGNAL.packColor}30`, color: DEMO_SIGNAL.packColor }}>{DEMO_SIGNAL.pack}</span>
              <span>Source: {DEMO_SIGNAL.source}</span>
              <span className="font-bold" style={{ color: "#c45a4a" }}>Risk: {DEMO_SIGNAL.riskEstimate}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {DEMO_SIGNAL.entities.map(e => (
            <div key={e} className="px-3 py-2 rounded-lg text-center" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.12)" }}>
              <div className="text-[10px] font-semibold" style={{ color: "#38bdf8" }}>{e}</div>
              <div className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: TEXT.muted }}>Affected Vessel</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TEXT.muted }}>Evidence Rail</div>
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(212,160,84,0.06)", border: "1px solid rgba(212,160,84,0.14)", color: "rgba(212,160,84,0.5)" }}>
            synthetic
          </span>
        </div>
        <div className="space-y-1.5">
          {DEMO_SIGNAL.evidence.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: TEXT.tertiary }}>{ev.type}</span>
              <span className="text-[10px]" style={{ color: TEXT.secondary }}>{ev.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContextStep() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4" style={{ color: "#ec4899" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ec4899" }}>Cross-Domain Intelligence</span>
        </div>
        <div className="space-y-2">
          {DEMO_CONTEXT.crossDomainSignals.map((sig, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: `${sig.color}12`, border: `1px solid ${sig.color}30`, color: sig.color }}>{sig.pack}</span>
              <span className="text-[10px]" style={{ color: TEXT.secondary }}>{sig.signal}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
          <div className="text-2xl font-bold font-mono" style={{ color: "#ec4899" }}>{DEMO_CONTEXT.historicalMatches}</div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: TEXT.muted }}>Historical Matches</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
          <div className="text-2xl font-bold font-mono" style={{ color: "#ec4899" }}>{DEMO_CONTEXT.patternConfidence}%</div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: TEXT.muted }}>Pattern Confidence</div>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
          <div className="text-2xl font-bold font-mono" style={{ color: "#ec4899" }}>{DEMO_CONTEXT.enrichmentSources.length}</div>
          <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: TEXT.muted }}>Data Sources</div>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Enrichment Sources</div>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_CONTEXT.enrichmentSources.map(src => (
            <span key={src} className="text-[9px] px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER.muted}`, color: TEXT.secondary }}>{src}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendationStep() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,122,200,0.1)", border: "2px solid rgba(139,122,200,0.3)" }}>
            <Zap className="w-5 h-5" style={{ color: "#8b7ac8" }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>{DEMO_RECOMMENDATION.id}</span>
              <div className="flex items-center gap-1 ml-auto">
                <Cpu className="w-3 h-3" style={{ color: TEXT.tertiary }} />
                <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>{DEMO_RECOMMENDATION.modelId}</span>
              </div>
            </div>
            <div className="text-base font-bold mb-2" style={{ color: TEXT.primary }}>{DEMO_RECOMMENDATION.text}</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-full" style={{ width: `${DEMO_RECOMMENDATION.confidence}%`, background: "#8b7ac8" }} />
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: "#8b7ac8" }}>{DEMO_RECOMMENDATION.confidence}%</span>
              </div>
              <span className="text-[9px]" style={{ color: TEXT.muted }}>confidence</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TEXT.muted }}>Reasoning Chain</div>
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(212,160,84,0.06)", border: "1px solid rgba(212,160,84,0.14)", color: "rgba(212,160,84,0.5)" }}>
            synthetic
          </span>
        </div>
        <div className="space-y-1.5">
          {DEMO_RECOMMENDATION.reasoning.map((r, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(139,122,200,0.03)", border: `1px solid rgba(139,122,200,0.08)` }}>
              <span className="text-[9px] font-bold font-mono shrink-0 mt-0.5" style={{ color: "#8b7ac8" }}>{i + 1}.</span>
              <span className="text-[10px]" style={{ color: TEXT.secondary }}>{r}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "rgba(200,149,60,0.03)", border: "1px solid rgba(200,149,60,0.1)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#c8953c" }}>Alternative Considered</div>
        <div className="text-[10px]" style={{ color: TEXT.secondary }}>{DEMO_RECOMMENDATION.alternativeAction}</div>
      </div>
    </div>
  );
}

function SimulationStep() {
  return (
    <MonteCarloSimPanel
      scenarios={DEMO_SIMULATION.scenarios}
      sensitivityDrivers={DEMO_SIMULATION.drivers}
      iterations={10000}
    />
  );
}

function PolicyStep() {
  return (
    <PolicyGatePanel
      finalOutcome="approved"
      evaluations={DEMO_POLICY.evaluations}
      approvalChain={[]}
      auditTrail={DEMO_POLICY.auditTrail.slice(0, 4)}
    />
  );
}

function ApprovalStep() {
  return (
    <PolicyGatePanel
      finalOutcome="approved"
      evaluations={[]}
      approvalChain={DEMO_POLICY.approvalChain}
      auditTrail={DEMO_POLICY.auditTrail.slice(4, 10)}
    />
  );
}

function ExecutionStep() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}>
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <Play className="w-4 h-4" style={{ color: "#6366f1" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#6366f1" }}>Workflow Execution</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#6366f1" }}>
              Action Receipt
            </span>
          </div>
          <div className="text-[9px] font-mono mt-0.5" style={{ color: TEXT.muted }}>Governed execution log — every step authorized, timed, and recorded</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(212,160,84,0.06)", border: "1px solid rgba(212,160,84,0.12)", color: "rgba(212,160,84,0.5)" }}>synthetic</span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: "rgba(107,143,113,0.12)", color: "#6b8f71" }}>COMPLETED</span>
        </div>
      </div>
      <div className="p-5">
        <div className="space-y-3">
          {[
            { step: "Authorization verified", status: "complete", time: "09:45:01", detail: "3/3 approvals confirmed" },
            { step: "Reroute order dispatched", status: "complete", time: "09:45:02", detail: "M/V Meridian — Captain notified via VSAT" },
            { step: "Fuel surcharge entry created", status: "complete", time: "09:45:03", detail: "$45K logged against contingency budget" },
            { step: "Client notification sent", status: "complete", time: "09:45:04", detail: "Revised ETA communicated — Contract T-2241" },
            { step: "Audit trail sealed", status: "complete", time: "09:45:05", detail: "Immutable proof chain record generated" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(107,143,113,0.12)", border: "1px solid rgba(107,143,113,0.3)" }}>
                <CheckCircle className="w-3 h-3" style={{ color: "#6b8f71" }} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>{s.step}</div>
                <div className="text-[9px]" style={{ color: TEXT.tertiary }}>{s.detail}</div>
              </div>
              <span className="text-[9px] font-mono shrink-0" style={{ color: TEXT.muted }}>{s.time}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: TEXT.muted }}>Total Duration</div>
              <span className="text-sm font-bold font-mono" style={{ color: "#6366f1" }}>4.2s</span>
            </div>
            <div>
              <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: TEXT.muted }}>Steps</div>
              <span className="text-sm font-bold font-mono" style={{ color: "#6366f1" }}>5/5</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: "#6b8f71" }}>
            <CheckCircle className="w-3 h-3" />
            <span className="font-bold">All steps executed successfully</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofStep() {
  return <ProofProvenancePanel entries={DEMO_PROOF} />;
}

function OutcomeStep() {
  return <OutcomePanel outcome={DEMO_OUTCOME} />;
}

const DEMO_ROUTE_STEPS_5MIN = [
  { step: 1, label: "Signal", href: "#", time: "0:00" },
  { step: 5, label: "Policy Gate", href: "#", time: "1:30" },
  { step: 6, label: "Approval", href: "#", time: "2:15" },
  { step: 8, label: "Proof Chain", href: "#", time: "3:15" },
  { step: 9, label: "Outcome", href: "#", time: "4:00" },
];

function DemoScenarioBar({ activeStep, onStepClick }: { activeStep: number; onStepClick: (i: number) => void }) {
  const [showGuide, setShowGuide] = useState(false);
  return (
    <div
      className="rounded-xl p-3 mb-1"
      style={{ background: "rgba(212,160,84,0.04)", border: "1px solid rgba(212,160,84,0.12)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 shrink-0" style={{ color: "#d4a054" }} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: "#d4a054" }}>Demo Scenario</span>
          <span className="text-[9px] font-mono" style={{ color: "rgba(212,160,84,0.55)" }}>·</span>
          <span className="text-[9px] font-mono" style={{ color: "rgba(212,160,84,0.7)" }}>Vessels — Maritime Fleet Command</span>
          <span
            className="text-[8px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: "rgba(212,160,84,0.08)", border: "1px solid rgba(212,160,84,0.18)", color: "rgba(212,160,84,0.7)" }}
          >
            Synthetic data
          </span>
        </div>
        <button
          onClick={() => setShowGuide(v => !v)}
          className="flex items-center gap-1 text-[8px] font-mono hover:opacity-80 transition-opacity"
          style={{ color: "rgba(212,160,84,0.5)" }}
        >
          <BookOpen className="w-3 h-3" />
          {showGuide ? "Hide" : "5-min route"}
        </button>
      </div>

      {showGuide && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(212,160,84,0.1)" }}>
          <div className="text-[8px] font-mono uppercase tracking-widest mb-2" style={{ color: "rgba(212,160,84,0.5)" }}>
            5-Minute Demo Route — key beats
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {DEMO_ROUTE_STEPS_5MIN.map((r, i) => (
              <div key={r.step} className="flex items-center gap-1.5">
                <button
                  onClick={() => onStepClick(r.step - 1)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all hover:opacity-80"
                  style={{
                    background: activeStep === r.step - 1 ? "rgba(212,160,84,0.15)" : "rgba(212,160,84,0.05)",
                    border: `1px solid ${activeStep === r.step - 1 ? "rgba(212,160,84,0.35)" : "rgba(212,160,84,0.1)"}`,
                    color: activeStep === r.step - 1 ? "#d4a054" : "rgba(212,160,84,0.6)",
                  }}
                >
                  <span className="font-mono text-[8px]" style={{ color: "rgba(212,160,84,0.45)" }}>{r.time}</span>
                  {r.label}
                </button>
                {i < DEMO_ROUTE_STEPS_5MIN.length - 1 && (
                  <ArrowRight className="w-2.5 h-2.5 shrink-0" style={{ color: "rgba(212,160,84,0.2)" }} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-[8px] font-mono" style={{ color: "rgba(212,160,84,0.35)" }}>
            Click any step to jump · Full 15-min route: ops/market/demo-route-final.md
          </div>
        </div>
      )}
    </div>
  );
}

const STEP_COMPONENTS: Record<string, () => JSX.Element> = {
  signal: SignalStep,
  context: ContextStep,
  recommendation: RecommendationStep,
  simulation: SimulationStep,
  policy: PolicyStep,
  approval: ApprovalStep,
  execution: ExecutionStep,
  proof: ProofStep,
  outcome: OutcomeStep,
};

export default function GovernedDecisionLoop() {
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = LOOP_STEPS[activeStep];
  const StepComponent = STEP_COMPONENTS[currentStep.id];

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <DemoScenarioBar activeStep={activeStep} onStepClick={setActiveStep} />

      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: ACCENT }}>Lyte · Governed Decision Loop</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: TEXT.primary }}>Governed Decision Loop</h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: TEXT.tertiary }}>
          The canonical loop that makes every decision explainable. Signal enters, context is enriched,
          AI recommends, simulation quantifies risk, policy gates enforce compliance, humans approve,
          the system executes, proof is sealed, and outcomes close the feedback loop.
        </p>
      </div>

      <StepIndicator steps={LOOP_STEPS} activeIndex={activeStep} onStepClick={setActiveStep} />

      <div className="rounded-xl p-4" style={{ background: `${currentStep.color}08`, border: `1px solid ${currentStep.color}20` }}>
        <div className="flex items-center gap-3">
          {(() => { const Icon = currentStep.icon; return <Icon className="w-5 h-5" style={{ color: currentStep.color }} />; })()}
          <div>
            <div className="text-sm font-bold" style={{ color: currentStep.color }}>Step {activeStep + 1}: {currentStep.label}</div>
            <div className="text-[10px]" style={{ color: TEXT.secondary }}>{currentStep.description}</div>
          </div>
        </div>
      </div>

      <StepComponent />

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER.muted}`, color: TEXT.secondary }}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Previous
        </button>
        <div className="flex items-center gap-1">
          {LOOP_STEPS.map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === activeStep ? LOOP_STEPS[i].color : i < activeStep ? "#6b8f71" : TEXT.muted }}
              aria-label={`Go to step ${i + 1}: ${step.label}`}
              aria-current={i === activeStep ? "step" : undefined}
            />
          ))}
        </div>
        <button
          onClick={() => setActiveStep(Math.min(LOOP_STEPS.length - 1, activeStep + 1))}
          disabled={activeStep === LOOP_STEPS.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
          style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, color: ACCENT }}
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
