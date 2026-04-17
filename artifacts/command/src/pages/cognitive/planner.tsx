import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CognitiveLayout } from "./cognitive-layout";

const ACCENT = "#8b7ac8";

type StepStatus = "completed" | "running" | "pending" | "blocked" | "skipped";
type RiskLevel = "low" | "medium" | "high" | "critical";
type ApprovalStatus = "approved" | "pending" | "not-required";

interface PlanStep {
  id: string;
  label: string;
  description: string;
  model: string;
  tool?: string;
  dependsOn: string[];
  status: StepStatus;
  durationMs?: number;
  estimatedMs: number;
  risk: RiskLevel;
  value: number;
  approvalStatus: ApprovalStatus;
  approver?: string;
  output?: string;
  fallbackId?: string;
}

interface Plan {
  id: string;
  name: string;
  domain: string;
  goal: string;
  status: "active" | "completed" | "paused" | "failed";
  createdAt: string;
  totalSteps: number;
  completedSteps: number;
  overallRisk: RiskLevel;
  overallValue: number;
  estimatedTotalMs: number;
  actualTotalMs?: number;
  steps: PlanStep[];
  alternativeIds: string[];
}

const SEEDED_PLANS: Plan[] = [
  {
    id: "plan-001",
    name: "Aegis — Ransomware Containment",
    domain: "aegis",
    goal: "Contain lateral movement, isolate affected endpoints, recover clean state, notify stakeholders.",
    status: "active",
    createdAt: "2026-04-17T08:12:00Z",
    totalSteps: 6,
    completedSteps: 3,
    overallRisk: "high",
    overallValue: 92,
    estimatedTotalMs: 18000,
    steps: [
      {
        id: "s1",
        label: "Classify Threat",
        description: "Determine threat category, severity, and affected blast radius using endpoint telemetry.",
        model: "gpt-4o",
        tool: "endpoint-telemetry",
        dependsOn: [],
        status: "completed",
        durationMs: 312,
        estimatedMs: 400,
        risk: "low",
        value: 70,
        approvalStatus: "not-required",
        output: "Ransomware: LockBit 3.0 variant. 14 endpoints compromised. C2: 185.220.101.47.",
      },
      {
        id: "s2",
        label: "Isolate Endpoints",
        description: "Push network isolation policy to affected endpoint group via EDR API.",
        model: "gpt-4o",
        tool: "edr-api",
        dependsOn: ["s1"],
        status: "completed",
        durationMs: 890,
        estimatedMs: 1200,
        risk: "medium",
        value: 88,
        approvalStatus: "approved",
        approver: "James Okafor",
        output: "14/14 endpoints isolated. Network policy pushed successfully.",
      },
      {
        id: "s3",
        label: "Block C2 Communication",
        description: "Add firewall rule to block egress to identified C2 IP and related ASN.",
        model: "gpt-4o",
        tool: "firewall-api",
        dependsOn: ["s1"],
        status: "completed",
        durationMs: 420,
        estimatedMs: 500,
        risk: "medium",
        value: 82,
        approvalStatus: "approved",
        approver: "James Okafor",
        output: "Rule 1442 created. Egress to AS202425 blocked.",
      },
      {
        id: "s4",
        label: "Credential Rotation",
        description: "Force password reset and MFA re-enrollment for all accounts on isolated hosts.",
        model: "gpt-4o",
        tool: "identity-api",
        dependsOn: ["s2"],
        status: "running",
        estimatedMs: 4000,
        risk: "low",
        value: 75,
        approvalStatus: "not-required",
      },
      {
        id: "s5",
        label: "Restore from Backup",
        description: "Restore clean OS images from verified backup snapshots for confirmed infected endpoints.",
        model: "claude-3-5-sonnet",
        tool: "backup-restore-api",
        dependsOn: ["s4"],
        status: "pending",
        estimatedMs: 9000,
        risk: "high",
        value: 90,
        approvalStatus: "pending",
        approver: "James Okafor",
        fallbackId: "s5-alt",
      },
      {
        id: "s6",
        label: "Executive Notification",
        description: "Generate and dispatch incident summary to CISO, CEO, and legal counsel.",
        model: "gpt-4o",
        tool: "notification-api",
        dependsOn: ["s1", "s2", "s3"],
        status: "pending",
        estimatedMs: 800,
        risk: "low",
        value: 60,
        approvalStatus: "not-required",
      },
    ],
    alternativeIds: ["plan-001-alt"],
  },
  {
    id: "plan-002",
    name: "Vessels — Voyage Reroute MV Aurora",
    domain: "vessels",
    goal: "Reroute MV Aurora Constellation around Cyclone Halia, minimise delays, update cargo ETA.",
    status: "completed",
    createdAt: "2026-04-16T14:45:00Z",
    totalSteps: 4,
    completedSteps: 4,
    overallRisk: "medium",
    overallValue: 78,
    estimatedTotalMs: 7200,
    actualTotalMs: 6100,
    steps: [
      {
        id: "s1",
        label: "Fetch Weather Data",
        description: "Pull 5-day marine forecast and cyclone track from ECMWF and NWS APIs.",
        model: "gpt-4o",
        tool: "weather-api",
        dependsOn: [],
        status: "completed",
        durationMs: 210,
        estimatedMs: 300,
        risk: "low",
        value: 65,
        approvalStatus: "not-required",
        output: "Cyclone Halia: Cat 2. Track: 240° @ 18kn. Impact window: 48h.",
      },
      {
        id: "s2",
        label: "Route Optimisation",
        description: "Compute alternate routes satisfying safety constraints, fuel budget, and port availability.",
        model: "claude-3-5-sonnet",
        dependsOn: ["s1"],
        status: "completed",
        durationMs: 1840,
        estimatedMs: 2000,
        risk: "medium",
        value: 82,
        approvalStatus: "not-required",
        output: "Recommended: Via Colombo (+28h, +$42K fuel). Alternative: Cape of Good Hope (+6d).",
      },
      {
        id: "s3",
        label: "Operator Approval",
        description: "Present reroute options to Fleet Ops Lead for final authorisation.",
        model: "gpt-4o",
        dependsOn: ["s2"],
        status: "completed",
        durationMs: 3800,
        estimatedMs: 4000,
        risk: "low",
        value: 80,
        approvalStatus: "approved",
        approver: "Marcus Chen",
        output: "Approved: Colombo route. Departure deviation at 06:00 UTC.",
      },
      {
        id: "s4",
        label: "Update ETA & Notify",
        description: "Update cargo ETA in TMS, notify charterers and port agents at destination.",
        model: "gpt-4o",
        tool: "tms-api",
        dependsOn: ["s3"],
        status: "completed",
        durationMs: 250,
        estimatedMs: 300,
        risk: "low",
        value: 65,
        approvalStatus: "not-required",
        output: "ETA updated to Apr 22. Charterer notified. Port agent confirmed.",
      },
    ],
    alternativeIds: [],
  },
  {
    id: "plan-003",
    name: "Terra — Interest Rate Stress Analysis",
    domain: "terra",
    goal: "Model NAV impact of 200bps rate increase across NYC mid-market portfolio and recommend reallocation.",
    status: "paused",
    createdAt: "2026-04-15T09:30:00Z",
    totalSteps: 5,
    completedSteps: 2,
    overallRisk: "medium",
    overallValue: 74,
    estimatedTotalMs: 22000,
    steps: [
      {
        id: "s1",
        label: "Collect Portfolio Data",
        description: "Pull current asset valuations, cap rates, LTV, and DSCR for all portfolio assets.",
        model: "gpt-4o",
        tool: "terra-db",
        dependsOn: [],
        status: "completed",
        durationMs: 540,
        estimatedMs: 600,
        risk: "low",
        value: 60,
        approvalStatus: "not-required",
        output: "42 assets loaded. Total AUM: $1.84B.",
      },
      {
        id: "s2",
        label: "Apply Rate Shock Model",
        description: "Simulate 200bps rate increase on each asset using DCF and cap rate compression models.",
        model: "claude-3-5-sonnet",
        dependsOn: ["s1"],
        status: "completed",
        durationMs: 3200,
        estimatedMs: 4000,
        risk: "medium",
        value: 78,
        approvalStatus: "not-required",
        output: "Portfolio NAV impact: -$184M (-10.2%). 8 assets enter distress zone.",
      },
      {
        id: "s3",
        label: "Generate Reallocation Scenarios",
        description: "Produce 3 reallocation scenarios optimised for yield, stability, and exit optionality.",
        model: "claude-3-5-sonnet",
        dependsOn: ["s2"],
        status: "blocked",
        estimatedMs: 6000,
        risk: "medium",
        value: 82,
        approvalStatus: "not-required",
      },
      {
        id: "s4",
        label: "Risk Committee Review",
        description: "Present scenarios to investment committee for approval before executing reallocation.",
        model: "gpt-4o",
        dependsOn: ["s3"],
        status: "pending",
        estimatedMs: 7200,
        risk: "low",
        value: 70,
        approvalStatus: "pending",
        approver: "Sofia Reyes",
      },
      {
        id: "s5",
        label: "Execute Reallocation Orders",
        description: "Initiate asset sale mandates and acquisition targets per approved scenario.",
        model: "gpt-4o",
        tool: "deal-management-api",
        dependsOn: ["s4"],
        status: "pending",
        estimatedMs: 1800,
        risk: "critical",
        value: 90,
        approvalStatus: "pending",
        approver: "Sofia Reyes",
      },
    ],
    alternativeIds: [],
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  aegis: "#ef4444",
  vessels: "#0ea5e9",
  terra: "#22c55e",
  prism: "#a855f7",
  default: "#8b7ac8",
};

const STATUS_COLORS: Record<StepStatus, string> = {
  completed: "#22c55e",
  running: "#8b7ac8",
  pending: "#475569",
  blocked: "#ef4444",
  skipped: "#64748b",
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const STATUS_ICONS: Record<StepStatus, string> = {
  completed: "✓",
  running: "◉",
  pending: "○",
  blocked: "✕",
  skipped: "—",
};

const PLAN_STATUS_COLORS: Record<Plan["status"], string> = {
  active: "#8b7ac8",
  completed: "#22c55e",
  paused: "#f59e0b",
  failed: "#ef4444",
};

function StepNode({ step, isSelected, onClick }: { step: PlanStep; isSelected: boolean; onClick: () => void }) {
  const color = STATUS_COLORS[step.status];
  const isRunning = step.status === "running";
  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? `${color}18` : "rgba(255,255,255,0.03)",
        border: `1px solid ${isSelected ? color : "rgba(255,255,255,0.08)"}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: "10px 14px",
        cursor: "pointer",
        transition: "all 0.12s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isRunning && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, animation: "shimmer 1.5s infinite" }} />
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 18, height: 18, borderRadius: "50%", background: `${color}20`, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color, fontWeight: 700, flexShrink: 0 }}>
            {STATUS_ICONS[step.status]}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{step.label}</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: RISK_COLORS[step.risk], background: `${RISK_COLORS[step.risk]}18`, padding: "1px 6px", borderRadius: 3, textTransform: "uppercase" }}>{step.risk}</span>
          {step.approvalStatus === "pending" && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", background: "#f59e0b18", padding: "1px 6px", borderRadius: 3 }}>NEEDS APPROVAL</span>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, lineHeight: 1.4 }}>{step.description}</div>
      <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#475569" }}>
        <span style={{ color: "#8b7ac8" }}>◈ {step.model}</span>
        {step.tool && <span>⚙ {step.tool}</span>}
        <span style={{ marginLeft: "auto" }}>Value: <span style={{ color: "#22c55e", fontWeight: 600 }}>{step.value}</span></span>
        {step.durationMs ? <span>{step.durationMs}ms</span> : <span>~{(step.estimatedMs / 1000).toFixed(1)}s est.</span>}
      </div>
    </div>
  );
}

function DependencyLines({ steps }: { steps: PlanStep[] }) {
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  const deps: { from: string; to: string }[] = [];
  steps.forEach((s) => s.dependsOn.forEach((d) => deps.push({ from: d, to: s.id })));
  if (!deps.length) return null;
  return (
    <div style={{ padding: "4px 14px", fontSize: 10, color: "#334155" }}>
      {deps.map(({ from, to }) => (
        <span key={`${from}-${to}`} style={{ marginRight: 12 }}>
          {stepMap.get(from)?.label} → {stepMap.get(to)?.label}
        </span>
      ))}
    </div>
  );
}

export default function PlannerStudio() {
  const { data: apiPlans } = useQuery<Plan[]>({
    queryKey: ["cognitive", "plans"],
    queryFn: async () => {
      const res = await fetch("/plans", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Plan[]>;
    },
    retry: 0,
    staleTime: 30_000,
  });

  const plans = apiPlans ?? SEEDED_PLANS;

  const [selectedPlan, setSelectedPlan] = useState<Plan>(SEEDED_PLANS[0]!);
  const [selectedStep, setSelectedStep] = useState<PlanStep | null>(null);
  const [view, setView] = useState<"graph" | "list">("graph");
  const [replayResult, setReplayResult] = useState<Record<string, unknown> | null>(null);
  const [showReplay, setShowReplay] = useState(false);

  useEffect(() => {
    if (plans.length > 0) {
      const stillSelected = plans.find((p) => p.id === selectedPlan.id);
      setSelectedPlan(stillSelected ?? plans[0]!);
      setSelectedStep(null);
    }
  }, [plans]);

  const replayMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch(`/plans/${planId}/replay`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<Record<string, unknown>>;
    },
    onSuccess: (data) => {
      setReplayResult(data);
      setShowReplay(true);
    },
  });

  const progress = selectedPlan.completedSteps / selectedPlan.totalSteps;

  return (
    <CognitiveLayout title="Planner Studio" subtitle="Inspect plan graphs: steps, dependencies, model and tool routing, risk/value scores, approvals, and fallback alternatives.">
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 10 }}>Plans ({plans.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => { setSelectedPlan(plan); setSelectedStep(null); }}
                  style={{
                    background: selectedPlan.id === plan.id ? `${ACCENT}12` : "rgba(255,255,255,0.03)",
                    border: selectedPlan.id === plan.id ? `1px solid ${ACCENT}55` : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: DOMAIN_COLORS[plan.domain] ?? DOMAIN_COLORS.default, background: `${DOMAIN_COLORS[plan.domain] ?? DOMAIN_COLORS.default}15`, padding: "1px 6px", borderRadius: 3 }}>{plan.domain}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: PLAN_STATUS_COLORS[plan.status], background: `${PLAN_STATUS_COLORS[plan.status]}18`, padding: "1px 6px", borderRadius: 3, textTransform: "uppercase", marginLeft: "auto" }}>{plan.status}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 6, lineHeight: 1.3 }}>{plan.name}</div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ width: `${(plan.completedSteps / plan.totalSteps) * 100}%`, height: "100%", background: PLAN_STATUS_COLORS[plan.status], borderRadius: 2, transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{plan.completedSteps}/{plan.totalSteps} steps · Risk: <span style={{ color: RISK_COLORS[plan.overallRisk] }}>{plan.overallRisk}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${ACCENT}25`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{selectedPlan.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", maxWidth: 500 }}>{selectedPlan.goal}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => {
                      if (showReplay) { setShowReplay(false); return; }
                      replayMutation.mutate(selectedPlan.id);
                    }}
                    disabled={replayMutation.isPending}
                    style={{ background: showReplay ? `${ACCENT}30` : "rgba(255,255,255,0.05)", color: showReplay ? ACCENT : "#64748b", border: `1px solid ${showReplay ? ACCENT : "transparent"}`, borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    {replayMutation.isPending ? "Replaying…" : showReplay ? "Hide Replay" : "⟳ Replay"}
                  </button>
                  {(["graph", "list"] as const).map((v) => (
                    <button key={v} onClick={() => setView(v)} style={{ background: view === v ? ACCENT : "rgba(255,255,255,0.05)", color: view === v ? "#fff" : "#64748b", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{v}</button>
                  ))}
                </div>
              </div>

              {showReplay && (
                <div style={{ background: "rgba(139,122,200,0.07)", border: `1px solid ${ACCENT}30`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Plan Replay — {selectedPlan.id}</div>
                  {replayMutation.isError ? (
                    <div style={{ fontSize: 12, color: "#ef4444" }}>
                      Replay unavailable: {(replayMutation.error as Error).message}. Showing seeded step timeline.
                    </div>
                  ) : replayResult ? (
                    <pre style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", whiteSpace: "pre-wrap", margin: 0, maxHeight: 200, overflow: "auto" }}>
                      {JSON.stringify(replayResult, null, 2)}
                    </pre>
                  ) : null}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Step Execution Timeline</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {selectedPlan.steps.map((step, i) => (
                        <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                          <span style={{ color: STATUS_COLORS[step.status], fontWeight: 700, width: 8 }}>
                            {step.status === "completed" ? "✓" : step.status === "running" ? "▶" : step.status === "blocked" ? "✗" : "○"}
                          </span>
                          <span style={{ color: "#475569", width: 20, textAlign: "right" }}>{i + 1}</span>
                          <span style={{ color: "#94a3b8", flex: 1 }}>{step.label}</span>
                          {step.durationMs && <span style={{ color: "#475569" }}>{step.durationMs}ms</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Steps", value: `${selectedPlan.completedSteps}/${selectedPlan.totalSteps}`, color: ACCENT, capitalize: false },
                  { label: "Progress", value: `${(progress * 100).toFixed(0)}%`, color: "#22c55e", capitalize: false },
                  { label: "Risk", value: selectedPlan.overallRisk.toUpperCase(), color: RISK_COLORS[selectedPlan.overallRisk], capitalize: false },
                  { label: "Value Score", value: String(selectedPlan.overallValue), color: "#0ea5e9", capitalize: false },
                  { label: "Status", value: selectedPlan.status, color: PLAN_STATUS_COLORS[selectedPlan.status], capitalize: true },
                ].map((m) => (
                  <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 7, padding: "10px 12px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: m.color, textTransform: m.capitalize ? "capitalize" : "none" }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: "#475569" }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${ACCENT}, #22c55e)`, borderRadius: 2, transition: "width 0.5s" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: selectedStep ? "1fr 340px" : "1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 8 }}>
                  {view === "graph" ? "Plan Graph" : "Step List"}
                </div>

                {view === "graph" && (
                  <div>
                    <DependencyLines steps={selectedPlan.steps} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {selectedPlan.steps.map((step) => (
                        <StepNode
                          key={step.id}
                          step={step}
                          isSelected={selectedStep?.id === step.id}
                          onClick={() => setSelectedStep(selectedStep?.id === step.id ? null : step)}
                        />
                      ))}
                    </div>
                    {selectedPlan.alternativeIds.length > 0 && (
                      <div style={{ marginTop: 12, padding: "10px 14px", background: "#f59e0b08", border: "1px solid #f59e0b25", borderRadius: 8 }}>
                        <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>⎇ FALLBACK ALTERNATIVES</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>This plan has {selectedPlan.alternativeIds.length} fallback alternative(s) configured. Triggered automatically if risk threshold exceeded.</div>
                      </div>
                    )}
                  </div>
                )}

                {view === "list" && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 70px 100px 80px", gap: 8, padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {["Step", "Status", "Risk", "Value", "Model", "Duration"].map((h) => (
                        <div key={h} style={{ fontSize: 9, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
                      ))}
                    </div>
                    {selectedPlan.steps.map((step) => (
                      <div
                        key={step.id}
                        onClick={() => setSelectedStep(selectedStep?.id === step.id ? null : step)}
                        style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 70px 100px 80px", gap: 8, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: selectedStep?.id === step.id ? `${ACCENT}08` : "transparent" }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0" }}>{step.label}</div>
                          {step.dependsOn.length > 0 && <div style={{ fontSize: 10, color: "#334155" }}>Depends on: {step.dependsOn.join(", ")}</div>}
                        </div>
                        <div style={{ fontSize: 11, color: STATUS_COLORS[step.status], fontWeight: 600 }}>{step.status}</div>
                        <div style={{ fontSize: 11, color: RISK_COLORS[step.risk], fontWeight: 600 }}>{step.risk}</div>
                        <div style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 600 }}>{step.value}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{step.model}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{step.durationMs ? `${step.durationMs}ms` : `~${(step.estimatedMs / 1000).toFixed(1)}s`}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedStep && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${ACCENT}30`, borderRadius: 12, padding: 18, alignSelf: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>Step Detail</div>
                    <button onClick={() => setSelectedStep(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{selectedStep.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 14 }}>{selectedStep.description}</div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    {[
                      { label: "Status", value: selectedStep.status, color: STATUS_COLORS[selectedStep.status] },
                      { label: "Risk", value: selectedStep.risk, color: RISK_COLORS[selectedStep.risk] },
                      { label: "Value Score", value: String(selectedStep.value), color: "#0ea5e9" },
                      { label: "Model", value: selectedStep.model, color: "#8b7ac8" },
                      { label: "Tool", value: selectedStep.tool ?? "—", color: undefined },
                      { label: "Depends On", value: selectedStep.dependsOn.length ? selectedStep.dependsOn.join(", ") : "None", color: undefined },
                      { label: "Estimated", value: `${(selectedStep.estimatedMs / 1000).toFixed(1)}s`, color: undefined },
                      { label: "Actual", value: selectedStep.durationMs ? `${selectedStep.durationMs}ms` : "—", color: undefined },
                    ].map((row) => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, gap: 8 }}>
                        <span style={{ color: "#475569" }}>{row.label}</span>
                        <span style={{ color: row.color ?? "#94a3b8", fontWeight: row.color ? 600 : 400, textTransform: row.color ? "capitalize" : "none" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Approval</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: selectedStep.approvalStatus === "approved" ? "#22c55e" : selectedStep.approvalStatus === "pending" ? "#f59e0b" : "#475569" }}>
                        {selectedStep.approvalStatus === "approved" ? "✓ Approved" : selectedStep.approvalStatus === "pending" ? "⏳ Pending" : "Not Required"}
                      </span>
                      {selectedStep.approver && <span style={{ fontSize: 10, color: "#475569" }}>by {selectedStep.approver}</span>}
                    </div>
                    {selectedStep.approvalStatus === "pending" && (
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        <button style={{ flex: 1, background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Approve</button>
                        <button style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "7px 0", fontSize: 11, cursor: "pointer" }}>Reject</button>
                      </div>
                    )}
                  </div>

                  {selectedStep.output && (
                    <div>
                      <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Step Output</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: 10, lineHeight: 1.5, fontFamily: "monospace" }}>{selectedStep.output}</div>
                    </div>
                  )}

                  {selectedStep.fallbackId && (
                    <div style={{ marginTop: 12, padding: "8px 10px", background: "#f59e0b08", border: "1px solid #f59e0b25", borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: "#f59e0b" }}>⎇ Fallback: <span style={{ fontFamily: "monospace" }}>{selectedStep.fallbackId}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </CognitiveLayout>
  );
}
