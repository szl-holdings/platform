import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Radio, Layers, Brain, BarChart3, ShieldCheck, Play,
  FileCheck, Target, BookOpen, ChevronRight, ChevronLeft,
  Pause, RotateCcw, AlertTriangle, Ship, Shield, CheckCircle2,
  Clock, User, Fingerprint, TrendingUp, Zap, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDecisionEngine } from "@/hooks/useDecisionEngine";
import type { EngineState, Recommendation } from "@/hooks/useDecisionEngine";

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

function SignalStage({ engine }: { engine: EngineState }) {
  const signals = useMemo(() => {
    return engine.publishedSignals
      .filter(evt => evt.type === "domain_signal")
      .map(evt => ({
        id: evt.id,
        domain: evt.domain === "aegis" ? "Aegis" : evt.domain === "vessels" ? "Vessels" : evt.domain,
        icon: evt.domain === "aegis" ? Shield : Ship,
        color: evt.domain === "aegis" ? "#6366f1" : "#3b82f6",
        type: String(evt.payload.signalType ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        severity: evt.severity,
        title: String(evt.payload.title ?? ""),
        timestamp: new Date(evt.timestamp).toISOString(),
        details: Object.fromEntries(
          Object.entries(evt.payload).filter(([k]) => !["signalType", "title"].includes(k))
        ),
      }));
  }, [engine.publishedSignals]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Two independent domain signals fire within a 4-minute window, triggering cross-domain correlation via the Prism Event Bus.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signals.map((sig) => {
          const Icon = sig.icon;
          return (
            <div key={sig.id} className="rounded-xl border border-border/40 bg-card/60 p-5">
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
          <span className="font-semibold text-foreground">Prism Event Bus:</span>{" "}
          {engine.busStats.totalPublished} events published across {Object.keys(engine.busStats.byType).length} event types.
          {" "}{engine.busStats.subscriptionCount} active subscription(s).
        </p>
      </div>
    </div>
  );
}

function ContextStage({ engine }: { engine: EngineState }) {
  const correlation = useMemo(() => {
    const corrEvt = engine.busHistory.find(e => e.type === "cross_domain_correlation");
    if (!corrEvt) return null;
    return {
      confidence: Number(corrEvt.payload.confidence ?? 0),
      pattern: String(corrEvt.payload.pattern ?? ""),
      crossDomainLinks: (corrEvt.payload.crossDomainLinks as string[]) ?? [],
      linkedSignalIds: (corrEvt.payload.linkedSignals as string[]) ?? [],
      correlationId: corrEvt.correlationId ?? corrEvt.id,
      totalBusEvents: engine.busHistory.length,
      signalCount: engine.busHistory.filter(e => e.type === "domain_signal").length,
    };
  }, [engine.busHistory]);

  if (!correlation) return <p className="text-sm text-muted-foreground">Awaiting correlation data...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The platform correlates the Aegis and Vessels signals, identifying a coordinated threat pattern across domains.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Cross-Domain Correlation</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Confidence:</span>
            <span className="text-lg font-bold font-display text-emerald-400">{(correlation.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-amber-400 mb-4">{correlation.pattern}</p>
        <div className="space-y-2">
          {correlation.crossDomainLinks.map((link, i) => (
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
          <span className="font-semibold text-foreground">Event Fabric:</span>{" "}
          Bus history: {correlation.totalBusEvents} events ({correlation.signalCount} signals) · Correlation engine matched {correlation.crossDomainLinks.length} cross-domain evidence links across {correlation.linkedSignalIds.length} signals.
          Correlation ID: <span className="font-mono text-[10px]">{correlation.correlationId}</span>
        </p>
      </div>
    </div>
  );
}

function RecommendationStage({ engine }: { engine: EngineState }) {
  const rec = engine.recommendation;
  if (!rec) return <p className="text-sm text-muted-foreground">Generating recommendation...</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The AI Agent Gateway generates a governed recommendation with full source attribution and confidence scoring.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">{rec.title}</h3>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-pink-400" />
            <span className="text-[11px] text-muted-foreground">Confidence:</span>
            <span className="text-base font-bold text-pink-400">{(rec.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {rec.modelId} · {rec.modelProvider}
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recommended Actions</h4>
          <div className="space-y-1.5">
            {rec.actions.map((action, i) => (
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
            {rec.inputSources.map((src) => (
              <div key={src.id} className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[10px] font-semibold text-foreground">{src.label}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{src.type}:{src.id}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-border/30 bg-muted/10 px-4 py-3 flex items-center gap-3">
          <Fingerprint className="w-4 h-4 text-pink-400 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Correlation ID:</span>{" "}
            <span className="font-mono text-[10px]">{rec.correlationId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function SimulationStage({ engine }: { engine: EngineState }) {
  const mc = engine.monteCarloResult;
  if (!mc) return <p className="text-sm text-muted-foreground">Running simulation...</p>;

  const cost = mc.metrics["totalVoyageCost"];
  const fuelShare = mc.metrics["fuelCostShare"];
  const costPerDay = mc.metrics["costPerDay"];
  const totalDays = mc.metrics["totalDays"];

  const metricRows = [
    { label: "Total Voyage Cost ($K)", m: cost, isCurrency: true },
    { label: "Fuel Cost Share", m: fuelShare, isPercent: true },
    { label: "Cost per Day ($K)", m: costPerDay, isCurrency: true },
    { label: "Total Transit Days", m: totalDays },
  ].filter(r => r.m);

  const maxP95 = Math.max(...metricRows.map(r => r.m?.p95 ?? 0));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Monte Carlo engine ran <span className="font-semibold text-foreground">{mc.iterations.toLocaleString()}</span> iterations
        of the <span className="font-semibold text-foreground">{mc.title}</span> scenario
        in <span className="font-mono text-foreground">{mc.durationMs.toFixed(0)}ms</span>.
      </p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Output Distributions — {mc.scenarioId}
        </h3>
        <div className="space-y-4">
          {metricRows.map(({ label, m, isCurrency, isPercent }) => {
            if (!m) return null;
            const fmt = (v: number) => isPercent ? `${(v * 100).toFixed(1)}%` : isCurrency ? `$${v.toFixed(0)}K` : v.toFixed(1);
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-foreground">{label}</span>
                  <span className="text-sm font-bold font-display text-foreground">{fmt(m.mean)} <span className="text-[10px] text-muted-foreground font-normal">(mean)</span></span>
                </div>
                <div className="relative h-6 rounded-md bg-muted/20 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-md opacity-20 bg-amber-400"
                    style={{ width: `${maxP95 > 0 ? (m.p95 / maxP95) * 100 : 0}%` }}
                  />
                  <div
                    className="absolute top-1 bottom-1 rounded-sm bg-amber-400"
                    style={{
                      left: `${maxP95 > 0 ? (m.p5 / maxP95) * 100 : 0}%`,
                      width: `${maxP95 > 0 ? ((m.p95 - m.p5) / maxP95) * 100 : 0}%`,
                      opacity: 0.4,
                    }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white"
                    style={{ left: `${maxP95 > 0 ? (m.mean / maxP95) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
                  <span>P5: {fmt(m.p5)}</span>
                  <span>P50: {fmt(m.p50)}</span>
                  <span>P95: {fmt(m.p95)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/40 bg-card/60 p-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Input Sensitivity (Correlation to Total Cost)</h4>
          <div className="space-y-2">
            {mc.inputSensitivity.slice(0, 6).map((item) => (
              <div key={item.inputId} className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground w-36 truncate flex-shrink-0">{item.label}</span>
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
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Standard Deviation</h4>
            <p className="text-sm font-bold text-foreground">${cost?.stdDev.toFixed(0) ?? "—"}K</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">90% Confidence Band</h4>
            <p className="text-sm font-semibold text-foreground">${cost?.p5.toFixed(0) ?? "—"}K – ${cost?.p95.toFixed(0) ?? "—"}K</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Iterations</h4>
            <p className="text-sm font-semibold text-foreground font-mono">{mc.iterations.toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Execution Time</h4>
            <p className="text-sm font-semibold text-foreground font-mono">{mc.durationMs.toFixed(0)}ms</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyStage({ engine }: { engine: EngineState }) {
  const decision = engine.policyDecision;
  const simulation = engine.policySimulation;

  if (!decision) return <p className="text-sm text-muted-foreground">Evaluating policy...</p>;

  const checks = [
    { rule: `Subject roles: [${decision.subject.roles.join(", ")}]`, result: decision.allowed ? "pass" : "fail", detail: `Evaluated against ${decision.matchedPolicies.length} matched policy(ies)` },
    { rule: `Action: ${decision.action} on ${decision.resource.type}`, result: decision.allowed ? "pass" : "fail", detail: `Domain: ${decision.resource.domain ?? "global"}` },
    { rule: `Policy verdict: ${decision.effect.toUpperCase()}`, result: decision.allowed ? "pass" : "fail", detail: decision.reason ?? "No reason provided" },
    { rule: `Evaluation time: ${decision.durationMs}ms`, result: "pass", detail: `Request ID: ${decision.requestId}` },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Covenant Policy Engine evaluates the proposed action against organizational rules, role requirements, and escalation thresholds.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Policy Evaluation</h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{decision.matchedPolicies[0] ?? "default-deny"}</p>
          </div>
          <span className={cn(
            "text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border",
            decision.allowed ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
          )}>{decision.effect.toUpperCase()}</span>
        </div>
        <div className="space-y-2 mb-4">
          {checks.map((check, i) => (
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
            <span className="text-[11px] text-foreground font-semibold">{decision.subject.userId ?? "System"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Evaluated {new Date(decision.evaluatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
        </div>
      </div>
      {simulation && (
        <div className="rounded-xl border border-border/40 bg-card/60 p-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Simulation Trace</h4>
          <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
            {simulation.explanation.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExecutionStage({ engine }: { engine: EngineState }) {
  const steps = engine.executionSteps;
  const workflowId = `WF-${new Date().toISOString().slice(0, 10).replace(/-/g, "-")}-00847`;
  if (steps.length === 0) return <p className="text-sm text-muted-foreground">Awaiting execution steps...</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The Workflow Engine executes the approved response plan. Every step is instrumented with timing, executor attribution, and completion status.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-bold text-foreground">Execution Log</h3>
          <span className="text-[10px] font-mono text-muted-foreground">{workflowId}</span>
        </div>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              {i < steps.length - 1 && (
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
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{step.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProofStage({ engine }: { engine: EngineState }) {
  const pr = engine.proofRecord;
  if (!pr) return <p className="text-sm text-muted-foreground">Generating proof record...</p>;

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
              { label: "Export Safety", value: pr.exportSafetyState },
              { label: "Prompt Hash", value: pr.promptHash },
              { label: "Correlation ID", value: pr.correlationId },
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
            {[
              { actor: "system", action: "proof_created", timestamp: pr.createdAt },
              { actor: pr.modelId, action: "recommendation_generated", timestamp: pr.createdAt },
              { actor: "J. van der Berg", action: "human_review_approved", timestamp: new Date(Date.now() + 120000).toISOString() },
              { actor: "system", action: "export_safety_cleared", timestamp: new Date(Date.now() + 121000).toISOString() },
            ].map((entry, i, arr) => (
              <div key={i} className="flex items-start gap-3 relative">
                {i < arr.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border/30" />
                )}
                <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-[11px] font-semibold text-foreground">{entry.action.replace(/_/g, " ")}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{entry.actor}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
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

function OutcomeStage({ engine }: { engine: EngineState }) {
  const o = engine.outcomeRecord;
  if (!o) return <p className="text-sm text-muted-foreground">Recording outcome...</p>;

  const costVariance = ((o.actualCost - o.predictedCost) / o.predictedCost * 100);
  const hoursVariance = ((o.actualHours - o.predictedHours) / o.predictedHours * 100);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The Outcome Graph records the measured result and compares it against the prediction, building the decision memory for future calibration.</p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Predicted vs Actual</h3>
          <span className="text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
            {o.outcomeResult}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Predicted Cost", value: `$${o.predictedCost.toFixed(0)}K`, color: "#94a3b8" },
            { label: "Actual Cost", value: `$${o.actualCost.toFixed(0)}K`, color: "#10b981" },
            { label: "Predicted Resolution", value: `${o.predictedHours.toFixed(1)}h`, color: "#94a3b8" },
            { label: "Actual Resolution", value: `${o.actualHours.toFixed(1)}h`, color: "#10b981" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
              <p className="text-lg font-bold font-display" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={cn("rounded-lg border p-3 text-center", costVariance <= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}>
            <p className="text-[10px] text-muted-foreground mb-1">Cost Variance</p>
            <p className={cn("text-base font-bold", costVariance <= 0 ? "text-emerald-400" : "text-red-400")}>{costVariance.toFixed(1)}%</p>
            <p className={cn("text-[9px]", costVariance <= 0 ? "text-emerald-400/70" : "text-red-400/70")}>{costVariance <= 0 ? "Under budget" : "Over budget"}</p>
          </div>
          <div className={cn("rounded-lg border p-3 text-center", hoursVariance <= 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")}>
            <p className="text-[10px] text-muted-foreground mb-1">Resolution Variance</p>
            <p className={cn("text-base font-bold", hoursVariance <= 0 ? "text-emerald-400" : "text-red-400")}>{hoursVariance.toFixed(1)}%</p>
            <p className={cn("text-[9px]", hoursVariance <= 0 ? "text-emerald-400/70" : "text-red-400/70")}>{hoursVariance <= 0 ? "Faster than predicted" : "Slower than predicted"}</p>
          </div>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2"><span className="text-muted-foreground">Outcome ID:</span><span className="font-mono text-foreground">{o.outcomeId}</span></div>
          <div className="flex items-center gap-2"><span className="text-muted-foreground">Domain:</span><span className="text-foreground">{o.domain}</span></div>
          <div className="flex items-center gap-2"><span className="text-muted-foreground">Decision:</span><span className="text-foreground capitalize">{o.decisionStatus}</span></div>
          <div className="flex items-center gap-2"><span className="text-muted-foreground">Confidence:</span><span className="text-foreground">{(o.confidence * 100).toFixed(0)}%</span></div>
        </div>
      </div>
    </div>
  );
}

function LearningStage({ engine }: { engine: EngineState }) {
  const mc = engine.monteCarloResult;
  const pr = engine.proofRecord;
  const outcome = engine.outcomeRecord;
  const decision = engine.policyDecision;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The outcome feeds back into the platform, calibrating confidence scores, updating threat models, and validating policy thresholds.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Confidence Calibration</h3>
          <p className="text-sm text-foreground mb-4">
            {outcome
              ? `Confidence score calibrated from ${(outcome.confidence * 100).toFixed(0)}% → ${((outcome.confidence + 0.03) * 100).toFixed(0)}% based on ${outcome.outcomeResult} outcome`
              : "Pending outcome data..."}
          </p>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Detected Patterns</h4>
          <div className="space-y-2">
            {[
              `Monte Carlo standard deviation: $${mc?.metrics["totalVoyageCost"]?.stdDev.toFixed(0) ?? "—"}K — model variability within expected band`,
              `Policy engine matched ${decision?.matchedPolicies.length ?? 0} policy(ies) with ${decision?.durationMs ?? 0}ms evaluation time`,
              `Proof chain tracks ${pr?.inputSources.length ?? 0} input sources with ${pr?.sourceClass ?? "unknown"} classification`,
            ].map((p, i) => (
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
              <p className="text-[12px] text-foreground">
                {pr?.modelId ?? "szl-threat-correlation-v3"} retrained with this outcome. Next version: v3.1
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Policy Validation</h4>
              <p className="text-[12px] text-foreground">
                {decision?.matchedPolicies[0] ?? "maritime-critical-response-v2"}: {decision?.allowed ? "Thresholds validated — no changes required" : "Policy denied — review escalation rules"}
              </p>
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

const STAGE_COMPONENTS: Record<StageId, React.FC<{ engine: EngineState }>> = {
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
  const engine = useDecisionEngine();

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
            {engine.status === "running" && (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Initializing engines...
              </span>
            )}
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
              <p className="text-sm font-bold text-foreground">Cross-Domain Threat: Port Facility Breach + Vessel Route Deviation</p>
              <p className="text-[12px] text-muted-foreground mt-1">Aegis detects unauthorized network access at a partner port facility while Vessels flags an AIS anomaly on an approaching tanker. The platform correlates both signals and routes a governed response.</p>
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

          <StageComponent engine={engine} />
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
