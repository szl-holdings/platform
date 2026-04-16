import { useState, useEffect, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Radio, Layers, Brain, BarChart3, ShieldCheck, Play,
  FileCheck, Target, BookOpen, ChevronRight, ChevronLeft,
  Pause, RotateCcw, AlertTriangle, Ship, Shield, CheckCircle2,
  Clock, User, Fingerprint, TrendingUp, ArrowRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LOOP_STAGES = [
  { id: "signal", label: "Signal", icon: Radio, color: "#0ea5e9", description: "Ingest raw signals from domain packs" },
  { id: "context", label: "Context", icon: Layers, color: "#8b5cf6", description: "Correlate across domains" },
  { id: "recommendation", label: "Recommendation", icon: Brain, color: "#ec4899", description: "AI-generated advisory with confidence" },
  { id: "simulation", label: "Simulation", icon: BarChart3, color: "#f59e0b", description: "Monte Carlo scenario analysis" },
  { id: "policy", label: "Policy", icon: ShieldCheck, color: "#10b981", description: "Covenant governance check" },
  { id: "execution", label: "Execution", icon: Play, color: "#6366f1", description: "Governed workflow trigger" },
  { id: "proof", label: "Proof", icon: FileCheck, color: "#14b8a6", description: "Immutable attribution chain" },
  { id: "outcome", label: "Outcome", icon: Target, color: "#ef4444", description: "Measured result vs prediction" },
  { id: "learning", label: "Learning", icon: BookOpen, color: "#f97316", description: "Decision memory & calibration" },
] as const;

type StageId = (typeof LOOP_STAGES)[number]["id"];

const DEMO_SCENARIO = {
  title: "Cross-Domain Threat: Port Facility Breach + Vessel Route Deviation",
  subtitle: "Aegis detects unauthorized network access at a partner port facility while Vessels flags an AIS anomaly on an approaching tanker. The platform correlates both signals and routes a governed response.",
  signals: [
    {
      domain: "Aegis",
      icon: Shield,
      color: "#6366f1",
      type: "Intrusion Detection",
      severity: "critical",
      title: "Unauthorized SSH access detected — Port of Rotterdam OT network",
      timestamp: "2026-04-16T08:42:17Z",
      details: { source_ip: "185.220.101.42", target: "SCADA-RTU-07", protocol: "SSH", geo: "Tor exit node (Frankfurt)" },
    },
    {
      domain: "Vessels",
      icon: Ship,
      color: "#3b82f6",
      type: "AIS Anomaly",
      severity: "high",
      title: "MV Nordic Pioneer — AIS transponder dark for 47 minutes near approach channel",
      timestamp: "2026-04-16T08:38:00Z",
      details: { vessel: "MV Nordic Pioneer", imo: "9847231", flag: "Marshall Islands", last_position: "51.95°N, 4.12°E", cargo: "Crude Oil (VLCC)" },
    },
  ],
  correlation: {
    confidence: 0.87,
    pattern: "Coordinated port intrusion + vessel approach anomaly",
    crossDomainLinks: [
      "SSH source IP previously flagged in maritime threat feed (OSINT-2026-0341)",
      "MV Nordic Pioneer scheduled berth at compromised port facility",
      "Temporal overlap: AIS dark period began 4 minutes before SSH intrusion",
      "Port SCADA target controls berth crane allocation for the vessel's assigned dock",
    ],
  },
  recommendation: {
    title: "Initiate port security lockdown and divert vessel to secondary anchorage",
    confidence: 0.82,
    model: "szl-threat-correlation-v3",
    provider: "SZL CORTEX",
    actions: [
      "Isolate SCADA-RTU-07 from OT network (Aegis automated response)",
      "Issue HOLD order for MV Nordic Pioneer via VTS channel 14",
      "Deploy incident response team to port control room",
      "Notify flag state authority (Marshall Islands MDA)",
    ],
    sources: [
      { type: "threat_intel", id: "OSINT-2026-0341", label: "Maritime Cyber Threat Feed" },
      { type: "ais_data", id: "IMO-9847231", label: "Vessel AIS Track History" },
      { type: "scada_log", id: "RTU-07-LOG", label: "Port SCADA Event Log" },
      { type: "historical", id: "OG-4821", label: "Prior similar incident (Rotterdam, 2025-11)" },
    ],
  },
  simulation: {
    scenarios: [
      { name: "Immediate Lockdown", expectedCost: 340, p5: 180, p95: 620, probability: 0.45, recommendation: "Preferred" },
      { name: "Monitor & Assess (4h delay)", expectedCost: 890, p5: 420, p95: 2100, probability: 0.35, recommendation: "Higher risk" },
      { name: "Full Port Shutdown", expectedCost: 1200, p5: 950, p95: 1800, probability: 0.20, recommendation: "Excessive" },
    ],
    sensitivity: [
      { input: "Attack sophistication", impact: 0.78 },
      { input: "Response time", impact: 0.65 },
      { input: "Cargo value exposure", impact: 0.52 },
      { input: "Insurance coverage", impact: 0.31 },
      { input: "Regulatory penalty risk", impact: 0.28 },
    ],
    costOfWaiting: "$127K per hour of delayed response",
    confidenceBand: "P10–P90: $220K – $580K total exposure",
  },
  policy: {
    result: "ALLOWED",
    policyName: "maritime-critical-response-v2",
    checks: [
      { rule: "Operator role ≥ security_lead", result: "pass", detail: "Actor: J. van der Berg (Security Director)" },
      { rule: "Dual-domain correlation required for lockdown", result: "pass", detail: "Aegis + Vessels signals correlated (r=0.87)" },
      { rule: "Cost threshold < $500K without board approval", result: "pass", detail: "Expected cost: $340K (within authority)" },
      { rule: "Regulatory notification within 72h", result: "pass", detail: "Auto-queued: EMSA, Marshall Islands MDA, Rotterdam Port Authority" },
    ],
    escalation: null,
    approver: "J. van der Berg",
    approverRole: "Security Director",
    approvalTime: "2026-04-16T08:49:32Z",
  },
  execution: {
    workflowId: "WF-2026-04-16-00847",
    steps: [
      { action: "Isolate SCADA-RTU-07", status: "completed", duration: "12s", executor: "Aegis Automated Response" },
      { action: "VTS Channel 14 — HOLD order transmitted", status: "completed", duration: "34s", executor: "Maritime Comms Gateway" },
      { action: "IR team dispatched to port control", status: "completed", duration: "4m 12s", executor: "Ops Coordinator" },
      { action: "Flag state notification queued", status: "completed", duration: "1s", executor: "Regulatory Compliance Engine" },
    ],
  },
  proof: {
    proofChainId: "PC-2026-0847",
    sourceClass: "llm_summarized",
    confidenceScore: 0.82,
    modelId: "szl-threat-correlation-v3",
    modelProvider: "SZL CORTEX",
    reviewState: "approved",
    exportSafety: "safe",
    inputSources: [
      { type: "threat_intel", id: "OSINT-2026-0341", label: "Maritime Cyber Threat Feed" },
      { type: "ais_data", id: "IMO-9847231", label: "Vessel AIS Track History" },
      { type: "scada_log", id: "RTU-07-LOG", label: "Port SCADA Event Log" },
    ],
    auditTrail: [
      { actor: "system", action: "proof_created", timestamp: "08:42:18" },
      { actor: "szl-threat-correlation-v3", action: "recommendation_generated", timestamp: "08:43:01" },
      { actor: "J. van der Berg", action: "human_review_approved", timestamp: "08:49:32" },
      { actor: "system", action: "export_safety_cleared", timestamp: "08:49:33" },
    ],
  },
  outcome: {
    result: "achieved",
    predicted: { cost: 340, resolution_hours: 6 },
    actual: { cost: 287, resolution_hours: 4.5 },
    variance: { cost: -15.6, resolution: -25 },
    notes: "Threat contained with no cargo disruption. SSH intrusion traced to APT group — intelligence shared with Europol. Vessel cleared and berthed at secondary dock within 4.5 hours.",
    relatedDecisions: [
      { id: "OG-4821", title: "Rotterdam port cyber incident (Nov 2025)", result: "achieved", similarity: 0.78 },
      { id: "OG-3102", title: "Singapore Strait AIS anomaly response", result: "partial", similarity: 0.64 },
    ],
  },
  learning: {
    calibration: "Confidence score calibrated +3% based on outcome (0.82 → 0.85 for similar pattern)",
    patterns: [
      "Coordinated OT intrusion + AIS dark periods: 3 incidents in 12 months (100% response success rate)",
      "Immediate lockdown outperforms delayed response by 62% on average cost",
      "SSH-based OT intrusions via Tor exit nodes: increasing trend (+40% YoY)",
    ],
    modelUpdate: "szl-threat-correlation-v3 retrained with this outcome. Next version: v3.1 (scheduled April 23)",
    policyUpdate: "maritime-critical-response-v2: No changes required. Thresholds validated.",
  },
};

function StageProgressBar({ currentStage, stages, onStageClick }: {
  currentStage: number;
  stages: typeof LOOP_STAGES;
  onStageClick: (idx: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const isActive = idx === currentStage;
        const isCompleted = idx < currentStage;
        return (
          <button
            key={stage.id}
            onClick={() => onStageClick(idx)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 border",
              isActive
                ? "border-current bg-current/10 text-foreground"
                : isCompleted
                ? "border-transparent bg-muted/20 text-muted-foreground"
                : "border-transparent text-muted-foreground/50 hover:text-muted-foreground"
            )}
            style={isActive ? { borderColor: `${stage.color}40`, background: `${stage.color}12`, color: stage.color } : undefined}
          >
            <Icon className="w-3.5 h-3.5" style={isActive || isCompleted ? { color: stage.color } : undefined} />
            <span className="hidden sm:inline">{stage.label}</span>
            {idx < stages.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/30 ml-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SignalStage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Two independent domain signals fire within a 4-minute window, triggering cross-domain correlation via the Prism Event Bus.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_SCENARIO.signals.map((sig) => {
          const Icon = sig.icon;
          return (
            <div key={sig.domain} className="rounded-xl border border-border/40 bg-card/60 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${sig.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: sig.color }} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: sig.color }}>{sig.domain}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{sig.type}</span>
                </div>
                <span className={cn(
                  "ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                  sig.severity === "critical" ? "bg-red-500/10 border-red-500/25 text-red-400" : "bg-orange-500/10 border-orange-500/25 text-orange-400"
                )}>{sig.severity}</span>
              </div>
              <p className="text-sm font-semibold text-foreground mb-3">{sig.title}</p>
              <div className="space-y-1">
                {Object.entries(sig.details).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-[11px]">
                    <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>
                    <span className="text-foreground font-medium font-mono text-[10px]">{String(v)}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 font-mono">
                {new Date(sig.timestamp).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
      <div className="rounded-lg border border-border/30 bg-muted/10 px-4 py-3 flex items-center gap-3">
        <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Prism Event Bus:</span> Both signals published to the cross-domain correlation queue within 4 minutes of each other.
        </p>
      </div>
    </div>
  );
}

function ContextStage() {
  const c = DEMO_SCENARIO.correlation;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The platform correlates the Aegis and Vessels signals, identifying a coordinated threat pattern across domains.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Cross-Domain Correlation</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Confidence:</span>
            <span className="text-lg font-bold font-display text-emerald-400">{(c.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-amber-400 mb-4">{c.pattern}</p>
        <div className="space-y-2">
          {c.crossDomainLinks.map((link, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-purple-400">{i + 1}</span>
              </div>
              <p className="text-[12px] text-foreground">{link}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border/30 bg-muted/10 px-4 py-3 flex items-center gap-3">
        <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Event Fabric:</span> Correlation engine matched 4 cross-domain evidence links. Escalated to recommendation pipeline.
        </p>
      </div>
    </div>
  );
}

function RecommendationStage() {
  const r = DEMO_SCENARIO.recommendation;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The AI Agent Gateway generates a governed recommendation with full source attribution and confidence scoring.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">{r.title}</h3>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-pink-400" />
            <span className="text-[11px] text-muted-foreground">Confidence:</span>
            <span className="text-base font-bold text-pink-400">{(r.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {r.model} · {r.provider}
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommended Actions</h4>
          <div className="space-y-1.5">
            {r.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-[12px] text-foreground">{action}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Source Attribution</h4>
          <div className="grid grid-cols-2 gap-2">
            {r.sources.map((src) => (
              <div key={src.id} className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[10px] font-semibold text-foreground">{src.label}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{src.type}:{src.id}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimulationStage() {
  const s = DEMO_SCENARIO.simulation;
  const maxCost = Math.max(...s.scenarios.map(sc => sc.p95));
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Monte Carlo engine runs 10,000 iterations across three response scenarios, producing risk-adjusted cost projections.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Scenario Comparison — Expected Cost ($K)</h3>
        <div className="space-y-4">
          {s.scenarios.map((sc) => (
            <div key={sc.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-foreground">{sc.name}</span>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                    sc.recommendation === "Preferred" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" :
                    sc.recommendation === "Higher risk" ? "bg-amber-500/10 border-amber-500/25 text-amber-400" :
                    "bg-red-500/10 border-red-500/25 text-red-400"
                  )}>{sc.recommendation}</span>
                </div>
                <span className="text-sm font-bold font-display text-foreground">${sc.expectedCost}K</span>
              </div>
              <div className="relative h-6 rounded-md bg-muted/20 overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-md opacity-20"
                  style={{ width: `${(sc.p95 / maxCost) * 100}%`, background: sc.recommendation === "Preferred" ? "#10b981" : sc.recommendation === "Higher risk" ? "#f59e0b" : "#ef4444" }}
                />
                <div
                  className="absolute top-1 bottom-1 rounded-sm"
                  style={{
                    left: `${(sc.p5 / maxCost) * 100}%`,
                    width: `${((sc.p95 - sc.p5) / maxCost) * 100}%`,
                    background: sc.recommendation === "Preferred" ? "#10b981" : sc.recommendation === "Higher risk" ? "#f59e0b" : "#ef4444",
                    opacity: 0.4,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5"
                  style={{ left: `${(sc.expectedCost / maxCost) * 100}%`, background: "#fff" }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
                <span>P5: ${sc.p5}K</span>
                <span>P95: ${sc.p95}K</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/40 bg-card/60 p-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sensitivity Tornado</h4>
          <div className="space-y-2">
            {s.sensitivity.map((item) => (
              <div key={item.input} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-36 truncate flex-shrink-0">{item.input}</span>
                <div className="flex-1 h-3 rounded-full bg-muted/20 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400/60" style={{ width: `${item.impact * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-foreground w-8 text-right">{(item.impact * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-4 flex flex-col gap-3">
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Cost of Waiting</h4>
            <p className="text-sm font-bold text-red-400">{s.costOfWaiting}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Confidence Band</h4>
            <p className="text-sm font-semibold text-foreground">{s.confidenceBand}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Iterations</h4>
            <p className="text-sm font-semibold text-foreground font-mono">10,000</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyStage() {
  const p = DEMO_SCENARIO.policy;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Covenant Policy Engine evaluates the proposed action against organizational rules, role requirements, and escalation thresholds.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Policy Evaluation</h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.policyName}</p>
          </div>
          <span className={cn(
            "text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border",
            p.result === "ALLOWED" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
          )}>{p.result}</span>
        </div>
        <div className="space-y-2 mb-4">
          {p.checks.map((check, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border/20 bg-muted/5 px-3 py-2.5">
              <CheckCircle2 className={cn("w-4 h-4 flex-shrink-0 mt-0.5", check.result === "pass" ? "text-emerald-400" : "text-red-400")} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground">{check.rule}</p>
                <p className="text-[11px] text-muted-foreground">{check.detail}</p>
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0",
                check.result === "pass" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
              )}>{check.result}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-foreground font-semibold">{p.approver}</span>
            <span className="text-[10px] text-muted-foreground">({p.approverRole})</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Approved {new Date(p.approvalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutionStage() {
  const e = DEMO_SCENARIO.execution;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The Workflow Engine executes the approved response plan. Every step is instrumented with timing, executor attribution, and completion status.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-bold text-foreground">Execution Log</h3>
          <span className="text-[10px] font-mono text-muted-foreground">{e.workflowId}</span>
        </div>
        <div className="space-y-0">
          {e.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              {i < e.steps.length - 1 && (
                <div className="absolute left-[11px] top-7 bottom-0 w-px bg-border/30" />
              )}
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 z-10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex-1 pb-4">
                <p className="text-[12px] font-semibold text-foreground">{step.action}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground">{step.executor}</span>
                  <span className="text-[10px] font-mono text-emerald-400">{step.duration}</span>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                    "bg-emerald-500/10 text-emerald-400"
                  )}>{step.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProofStage() {
  const pr = DEMO_SCENARIO.proof;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The Proof Chain records immutable attribution for every AI output, human decision, and data source used in this decision.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Proof Chain Record</h3>
          <div className="space-y-2.5">
            {[
              { label: "Chain ID", value: pr.proofChainId },
              { label: "Source Class", value: pr.sourceClass },
              { label: "Confidence", value: `${(pr.confidenceScore * 100).toFixed(0)}%` },
              { label: "Model", value: `${pr.modelId} (${pr.modelProvider})` },
              { label: "Review State", value: pr.reviewState },
              { label: "Export Safety", value: pr.exportSafety },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className="text-[11px] font-semibold text-foreground font-mono">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Input Sources</h4>
            {pr.inputSources.map((src) => (
              <div key={src.id} className="flex items-center gap-2 mb-1.5">
                <Fingerprint className="w-3 h-3 text-teal-400" />
                <span className="text-[11px] text-foreground">{src.label}</span>
                <span className="text-[9px] text-muted-foreground font-mono">{src.id}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Audit Trail</h3>
          <div className="space-y-0">
            {pr.auditTrail.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 relative">
                {i < pr.auditTrail.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border/30" />
                )}
                <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-[11px] font-semibold text-foreground">{entry.action.replace(/_/g, " ")}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{entry.actor}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">{entry.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OutcomeStage() {
  const o = DEMO_SCENARIO.outcome;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The Outcome Graph records the measured result and compares it against the prediction, building the decision memory for future calibration.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Predicted vs Actual</h3>
          <span className="text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            {o.result}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Predicted Cost", value: `$${o.predicted.cost}K`, color: "#94a3b8" },
            { label: "Actual Cost", value: `$${o.actual.cost}K`, color: "#10b981" },
            { label: "Predicted Resolution", value: `${o.predicted.resolution_hours}h`, color: "#94a3b8" },
            { label: "Actual Resolution", value: `${o.actual.resolution_hours}h`, color: "#10b981" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
              <p className="text-lg font-bold font-display" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Cost Variance</p>
            <p className="text-base font-bold text-emerald-400">{o.variance.cost}%</p>
            <p className="text-[9px] text-emerald-400/70">Under budget</p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Resolution Variance</p>
            <p className="text-base font-bold text-emerald-400">{o.variance.resolution}%</p>
            <p className="text-[9px] text-emerald-400/70">Faster than predicted</p>
          </div>
        </div>
        <p className="text-[12px] text-foreground mb-4">{o.notes}</p>
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Related Prior Decisions</h4>
          {o.relatedDecisions.map((dec) => (
            <div key={dec.id} className="flex items-center justify-between rounded-lg border border-border/20 bg-muted/5 px-3 py-2 mb-1.5">
              <div>
                <p className="text-[11px] font-semibold text-foreground">{dec.title}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{dec.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Similarity: {(dec.similarity * 100).toFixed(0)}%</span>
                <span className={cn(
                  "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                  dec.result === "achieved" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                )}>{dec.result}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LearningStage() {
  const l = DEMO_SCENARIO.learning;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The outcome feeds back into the platform, calibrating confidence scores, updating threat models, and validating policy thresholds.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Confidence Calibration</h3>
          <p className="text-sm text-foreground mb-4">{l.calibration}</p>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Detected Patterns</h4>
          <div className="space-y-2">
            {l.patterns.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-foreground">{p}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">System Updates</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Model Update</h4>
              <p className="text-[12px] text-foreground">{l.modelUpdate}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Policy Validation</h4>
              <p className="text-[12px] text-foreground">{l.policyUpdate}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Decision Memory Updated</span>
            </div>
            <p className="text-[11px] text-muted-foreground">This outcome is now part of the Outcome Graph and will inform future recommendations for similar threat patterns.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const STAGE_COMPONENTS: Record<StageId, React.FC> = {
  signal: SignalStage,
  context: ContextStage,
  recommendation: RecommendationStage,
  simulation: SimulationStage,
  policy: PolicyStage,
  execution: ExecutionStage,
  proof: ProofStage,
  outcome: OutcomeStage,
  learning: LearningStage,
};

export default function DecisionTheater() {
  const [currentStage, setCurrentStage] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stage = LOOP_STAGES[currentStage]!;
  const StageComponent = STAGE_COMPONENTS[stage.id];

  const goNext = useCallback(() => {
    setCurrentStage((prev) => (prev < LOOP_STAGES.length - 1 ? prev + 1 : prev));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStage((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const resetDemo = useCallback(() => {
    setCurrentStage(0);
    setDemoMode(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (demoMode) {
      intervalRef.current = setInterval(() => {
        setCurrentStage((prev) => {
          if (prev >= LOOP_STAGES.length - 1) {
            setDemoMode(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 6000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [demoMode]);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold font-display">Decision Theater</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              The canonical governed decision loop — Signal to Learning, nine steps, every domain
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (demoMode) {
                  setDemoMode(false);
                } else {
                  setCurrentStage(0);
                  setDemoMode(true);
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                demoMode
                  ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                  : "bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50"
              )}
              title={demoMode ? "Pause guided demo" : "Start guided demo"}
            >
              {demoMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {demoMode ? "Pause" : "Guided Demo"}
            </button>
            <button
              onClick={resetDemo}
              className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/40 p-4 mb-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">{DEMO_SCENARIO.title}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{DEMO_SCENARIO.subtitle}</p>
            </div>
          </div>
        </div>

        <StageProgressBar currentStage={currentStage} stages={LOOP_STAGES} onStageClick={setCurrentStage} />
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={stage.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stage.color}20` }}>
              <stage.icon className="w-4 h-4" style={{ color: stage.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: stage.color }}>Step {currentStage + 1} of 9</span>
                {demoMode && (
                  <span className="text-[9px] text-muted-foreground animate-pulse">Auto-advancing in 6s…</span>
                )}
              </div>
              <h3 className="text-lg font-bold font-display text-foreground">{stage.label}</h3>
            </div>
          </div>

          <StageComponent />
        </m.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
        <button
          onClick={goPrev}
          disabled={currentStage === 0}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all",
            currentStage === 0
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStage > 0 ? LOOP_STAGES[currentStage - 1]!.label : "Previous"}
        </button>

        <div className="flex items-center gap-1">
          {LOOP_STAGES.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                idx === currentStage ? "bg-foreground w-3" : idx < currentStage ? "bg-muted-foreground/50" : "bg-muted-foreground/20"
              )}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentStage === LOOP_STAGES.length - 1}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all",
            currentStage === LOOP_STAGES.length - 1
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-foreground bg-muted/20 hover:bg-muted/30"
          )}
        >
          {currentStage < LOOP_STAGES.length - 1 ? LOOP_STAGES[currentStage + 1]!.label : "Complete"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </m.div>
  );
}
