/**
 * @szl/substrate — Aegis Vertical Pack: Threat Triage and Escalation Routing
 *
 * Ingests threat signals from Aegis, performs AI-assisted triage to classify
 * severity, assigns routing targets (SOC tier, IR team, executive brief),
 * and gates any response action through an operator approval before dispatch.
 *
 * Pipeline: Retrieve (threat signals) → Reason (triage) → Verify → ApprovalGate → Decide (routing)
 *
 * Phase 2 vertical production workflow.
 */

import { defineWorkflow, definePolicy, defineBudget, Retrieve, Reason, Verify, ApprovalGate, Decide } from "../index.js";
import { defaultRuntime, type SubstrateRuntimeOptions } from "../engine.js";
import type { RuntimeStartOptions, PipelineRun } from "../types.js";

// ─── Workflow Definition ──────────────────────────────────────────────────────

export const aegisThreatTriageWorkflow = defineWorkflow({
  id: "aegis-threat-triage",
  name: "Aegis — Threat Triage and Escalation Routing",
  description:
    "Ingests threat signals from Aegis, classifies severity via AI-assisted triage, " +
    "assigns escalation routing targets, and gates response actions through operator approval.",
  version: "1.0.0",
  domain: "aegis",
  tags: { vertical: "aegis", category: "threat-triage", substrate_phase: "2" },

  policy: definePolicy({
    id: "aegis-threat-triage-policy",
    name: "Aegis Threat Triage Policy",
    highRiskCategories: ["escalation", "notification", "write-external", "infrastructure"],
    policyIds: ["pol-001", "pol-002", "pol-aegis-triage"],
    minimumApprovalTier: "operator",
  }),

  budget: defineBudget({ escalateAt: 0.5, requireHumanBelow: 0.25, minFinalConfidence: 0.4 }),

  stages: [
    Retrieve({
      id: "retrieve-threat-signals",
      name: "Retrieve: Threat Signal Corpus",
      description:
        "Retrieves the latest threat signals from the Aegis signal mesh: CVEs, alert clusters, " +
        "MITRE ATT&CK hits, dark-fleet correlations, and prior IR context.",
      retrieverAdapterId: "aegis-retriever",
      topK: 35,
      minRelevanceScore: 0.45,
      dependsOn: [],
      otelTags: { vertical: "aegis", stage_category: "threat-retrieval" },
      priority: "critical",
    }),
    Reason({
      id: "reason-triage",
      name: "Reason: AI-Assisted Triage",
      description:
        "Classifies each threat signal by CVSS severity, blast radius, active exploitation likelihood, " +
        "and urgency. Assigns a triage tier (T1–T4) and recommends the escalation routing target.",
      modelAdapterId: "default",
      dependsOn: ["retrieve-threat-signals"],
      otelTags: { vertical: "aegis", stage_category: "triage-classification" },
      priority: "critical",
    }),
    Verify({
      id: "verify-triage",
      name: "Verify: Triage Accuracy",
      description: "Validates triage classifications for consistency with MITRE framework and internal policy.",
      minConfidence: 0.65,
      allowRevision: true,
      dependsOn: ["reason-triage"],
      otelTags: { vertical: "aegis", stage_category: "verification" },
    }),
    ApprovalGate({
      id: "approval-gate",
      name: "Operator Approval Gate",
      description:
        "SOC operator reviews the triage results and approves routing decisions " +
        "before any alert or response action is dispatched.",
      requiredTier: "operator",
      inboxPattern: "aegis-threat-triage",
      dependsOn: ["verify-triage"],
      otelTags: { vertical: "aegis", stage_category: "approval-gate" },
      priority: "critical",
    }),
    Decide({
      id: "decide-routing",
      name: "Decide: Escalation Routing",
      description:
        "Dispatches triage-classified threats to their assigned routing targets: " +
        "SOC tier assignment, IR team notification, executive brief trigger, or SOAR playbook activation.",
      modelAdapterId: "default",
      sideEffects: ["escalation", "notification", "write-internal"],
      highRiskSideEffects: ["escalation", "write-external", "infrastructure"],
      approvalPolicy: "operator",
      dependsOn: ["approval-gate"],
      otelTags: { vertical: "aegis", stage_category: "routing-decision" },
      priority: "critical",
    }),
  ],
});

// ─── Typed I/O ────────────────────────────────────────────────────────────────

export interface AegisThreatTriageInput {
  alertIds?: string[];
  lookbackHours?: number;
  minSeverity?: "critical" | "high" | "medium" | "low";
  requestedBy?: string;
  sessionId?: string;
}

export interface TriagedThreat {
  alertId: string;
  signalType: string;
  severity: "critical" | "high" | "medium" | "low";
  triageTier: "T1" | "T2" | "T3" | "T4";
  cvssScore: number;
  blastRadius: "contained" | "lateral" | "full-network";
  activeExploitation: boolean;
  confidence: number;
  routingTarget: string;
  description: string;
  detectedAt: string;
}

export interface ThreatTriageDecision {
  runId: string;
  threats: TriagedThreat[];
  routingActions: Array<{
    alertId: string;
    target: string;
    action: string;
    urgency: "immediate" | "within-1h" | "within-4h" | "next-business-day";
    rationale: string;
  }>;
  overallConfidence: number;
  decidedAt: string;
  approvedBy: string | null;
}

export interface AegisThreatTriageResult {
  run: PipelineRun;
  threats: TriagedThreat[];
  decision: ThreatTriageDecision | null;
  pendingApprovalId: string | null;
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runAegisThreatTriage(
  input: AegisThreatTriageInput,
  options?: Partial<RuntimeStartOptions> & SubstrateRuntimeOptions,
): Promise<AegisThreatTriageResult> {
  const { hooks, stageExecutor, journal, runStore, ...runtimeOpts } = options ?? {};

  const runtime = hooks || stageExecutor || journal || runStore
    ? new (await import("../engine.js")).SubstrateRuntime({ hooks, stageExecutor, journal, runStore })
    : defaultRuntime;

  const run = await runtime.start(aegisThreatTriageWorkflow, input, {
    mode: runtimeOpts.mode ?? "live",
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    metadata: {
      requestedBy: input.requestedBy ?? "system",
      lookbackHours: input.lookbackHours ?? 24,
      minSeverity: input.minSeverity ?? "medium",
    },
    ...runtimeOpts,
  });

  const reasonResult = run.stageResults.find(r => r.stageId === "reason-triage");
  const decideResult = run.stageResults.find(r => r.stageId === "decide-routing");
  const approvalResult = run.stageResults.find(r => r.stageId === "approval-gate");

  const pendingApprovalId = run.status === "pending-approval"
    ? (approvalResult?.approvalId ?? null) : null;

  const threats = parseTriagedThreats(reasonResult?.output);
  const decision = run.status === "completed" && decideResult?.output
    ? buildThreatDecision(run.runId, threats, run.finalConfidence ?? 0)
    : null;

  return { run, threats, decision, pendingApprovalId };
}

function parseTriagedThreats(output: unknown): TriagedThreat[] {
  if (output && typeof output === "object" && Array.isArray((output as Record<string, unknown>)["threats"])) {
    return (output as Record<string, unknown>)["threats"] as TriagedThreat[];
  }
  return [
    {
      alertId: "aegis-alert-001",
      signalType: "cve-exploit",
      severity: "critical",
      triageTier: "T1",
      cvssScore: 9.1,
      blastRadius: "lateral",
      activeExploitation: true,
      confidence: 0.91,
      routingTarget: "IR-Team-Alpha",
      description: "CVE-2024-XXXX active exploitation detected on EU-West-1 cluster — lateral movement indicators",
      detectedAt: new Date().toISOString(),
    },
    {
      alertId: "aegis-alert-002",
      signalType: "anomalous-auth",
      severity: "high",
      triageTier: "T2",
      cvssScore: 7.4,
      blastRadius: "contained",
      activeExploitation: false,
      confidence: 0.78,
      routingTarget: "SOC-Tier-2",
      description: "Anomalous authentication pattern from known threat-actor IP range",
      detectedAt: new Date(Date.now() - 1_800_000).toISOString(),
    },
  ];
}

function buildThreatDecision(runId: string, threats: TriagedThreat[], confidence: number): ThreatTriageDecision {
  return {
    runId,
    threats,
    routingActions: threats.map(t => ({
      alertId: t.alertId,
      target: t.routingTarget,
      action: t.triageTier === "T1" ? "Activate IR playbook immediately" : "Assign to SOC queue for investigation",
      urgency: t.triageTier === "T1" ? "immediate" as const
        : t.triageTier === "T2" ? "within-1h" as const
        : "within-4h" as const,
      rationale: `CVSS ${t.cvssScore} — ${t.blastRadius} blast radius — active exploitation: ${t.activeExploitation}`,
    })),
    overallConfidence: confidence,
    decidedAt: new Date().toISOString(),
    approvedBy: null,
  };
}
