/**
 * ABO Doctrine — Pillar 1: Unified Telemetry Fabric (MELT+A)
 * Pillar 5: Agent Lifecycle Observability
 *
 * Agent Telemetry: reasoning traces, tool invocations, delegation chains,
 * decision confidence, and Agent Vitals — the standardized health metrics
 * for autonomous agent behavior across the SZL Holdings platform.
 */

const MAX_AGENT_SPANS = 500;
const MAX_DELEGATION_CHAINS = 100;
const MAX_TRUST_RECEIPTS = 200;
const WINDOW_MS = 300_000; // 5 minutes

// ── Agent Vitals (Pillar 5) ──────────────────────────────────────────────────

export interface AgentVitals {
  agentId: string;
  domain: string;
  /** Average ms from input to decision output */
  decisionLatencyMs: number;
  /** Estimated rate of factually incorrect or hallucinated outputs (0–1) */
  hallucinationRate: number;
  /** Tool call success rate (0–1) */
  toolReliability: number;
  /** Ratio of delegations that completed without re-delegation (0–1) */
  delegationEfficiency: number;
  /** Fraction of decisions made autonomously vs. human-escalated (0–1) */
  autonomyUtilization: number;
  /** Overall health score 0–100 */
  vitalScore: number;
  status: "healthy" | "degraded" | "critical";
  sampledAt: number;
}

// ── Agent Reasoning Span (Pillar 1 + Pillar 5) ──────────────────────────────

export type ReasoningStepType =
  | "perceive"
  | "reason"
  | "plan"
  | "tool_invoke"
  | "delegate"
  | "respond"
  | "self_correct"
  | "escalate";

export interface AgentReasoningSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  agentId: string;
  domain: string;
  step: ReasoningStepType;
  inputSummary?: string;
  outputSummary?: string;
  decisionConfidence?: number; // 0–1
  toolsInvoked?: string[];
  modelUsed?: string;
  latencyMs: number;
  status: "ok" | "error" | "escalated" | "delegated";
  error?: string;
  governancePoliciesApplied?: string[];
  trustReceiptId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ── Delegation Chain (Pillar 5) ──────────────────────────────────────────────

export interface DelegationLink {
  fromAgentId: string;
  toAgentId: string;
  fromDomain: string;
  toDomain: string;
  reason: string;
  confidenceAtDelegation: number;
  resolvedAt?: number;
  outcome?: "success" | "failure" | "re-delegated";
  latencyMs?: number;
}

export interface DelegationChain {
  chainId: string;
  traceId: string;
  originAgentId: string;
  originDomain: string;
  links: DelegationLink[];
  totalLatencyMs: number;
  finalOutcome?: "success" | "failure" | "human_escalation";
  timestamp: number;
}

// ── Trust Receipt (Pillar 4) ─────────────────────────────────────────────────

export interface TrustReceipt {
  receiptId: string;
  traceId: string;
  agentId: string;
  domain: string;
  decisionType: string;
  decisionSummary: string;
  confidenceScore: number; // 0–1
  dataSources: Array<{ id: string; type: string; label: string; freshness?: string }>;
  modelId: string;
  modelProvider: string;
  governancePoliciesApplied: string[];
  complianceFlags: string[];
  autonomyLevel: "supervised" | "semi-autonomous" | "autonomous";
  humanInLoop: boolean;
  immutableHash?: string;
  timestamp: number;
  expiresAt?: number;
}

// ── Predictive Risk Signal (Pillar 6) ────────────────────────────────────────

export interface PredictiveRiskSignal {
  signalId: string;
  domain: string;
  riskType: "system_failure" | "compliance_drift" | "agent_degradation" | "business_impact" | "security_threat";
  title: string;
  description: string;
  probability: number; // 0–1
  impact: "low" | "medium" | "high" | "critical";
  timeToMaterializeMs?: number;
  suggestedActions: string[];
  correlatedSignalIds?: string[];
  confidence: number; // 0–1
  timestamp: number;
  forecastHorizonMs: number;
}

// ── Agent Identity / Governance (Pillar 3) ────────────────────────────────────

export type AgentAutonomyLevel = "supervised" | "semi-autonomous" | "autonomous" | "restricted";
export type AgentLifecycleStatus = "spawning" | "active" | "idle" | "degraded" | "retiring" | "retired";

export interface AgentGovernanceIdentity {
  agentId: string;
  domain: string;
  displayName: string;
  permissionBoundary: string[];
  autonomyLevel: AgentAutonomyLevel;
  lifecycleStatus: AgentLifecycleStatus;
  complianceTags: string[];
  humanEscalationThreshold: number; // confidence below which human is looped in
  registeredAt: number;
  lastActiveAt: number;
}

// ── Compliance-as-Code Rule (Pillar 7) ────────────────────────────────────────

export type ComplianceFramework = "EU_AI_ACT" | "SOC2" | "HIPAA" | "NIST_CSF" | "ISO27001" | "INTERNAL";

export interface ComplianceRule {
  ruleId: string;
  framework: ComplianceFramework;
  requirement: string;
  description: string;
  severity: "info" | "warning" | "critical";
  evaluate: (context: AgentComplianceContext) => ComplianceEvalResult;
}

export interface AgentComplianceContext {
  agentId: string;
  domain: string;
  autonomyLevel: AgentAutonomyLevel;
  recentDecisions: TrustReceipt[];
  vitals: AgentVitals;
  governancePoliciesApplied: string[];
}

export interface ComplianceEvalResult {
  passed: boolean;
  ruleId: string;
  finding?: string;
  remediationSteps?: string[];
  severity: "info" | "warning" | "critical";
}

// ── Collector ─────────────────────────────────────────────────────────────────

export class AgentTelemetryCollector {
  private reasoningSpans: AgentReasoningSpan[] = [];
  private delegationChains: DelegationChain[] = [];
  private trustReceipts: TrustReceipt[] = [];
  private agentIdentities = new Map<string, AgentGovernanceIdentity>();
  private predictiveSignals: PredictiveRiskSignal[] = [];
  private complianceRules: ComplianceRule[] = [];

  // ── Recording ──────────────────────────────────────────────────────────────

  recordReasoningSpan(span: AgentReasoningSpan): void {
    this.reasoningSpans.push(span);
    if (this.reasoningSpans.length > MAX_AGENT_SPANS) {
      this.reasoningSpans.splice(0, this.reasoningSpans.length - MAX_AGENT_SPANS);
    }
  }

  recordDelegationChain(chain: DelegationChain): void {
    this.delegationChains.push(chain);
    if (this.delegationChains.length > MAX_DELEGATION_CHAINS) {
      this.delegationChains.splice(0, this.delegationChains.length - MAX_DELEGATION_CHAINS);
    }
  }

  recordTrustReceipt(receipt: TrustReceipt): void {
    this.trustReceipts.push(receipt);
    if (this.trustReceipts.length > MAX_TRUST_RECEIPTS) {
      this.trustReceipts.splice(0, this.trustReceipts.length - MAX_TRUST_RECEIPTS);
    }
  }

  registerAgent(identity: AgentGovernanceIdentity): void {
    this.agentIdentities.set(identity.agentId, { ...identity, registeredAt: Date.now(), lastActiveAt: Date.now() });
  }

  recordPredictiveSignal(signal: PredictiveRiskSignal): void {
    this.predictiveSignals.push(signal);
    if (this.predictiveSignals.length > 200) {
      this.predictiveSignals.splice(0, this.predictiveSignals.length - 200);
    }
  }

  registerComplianceRule(rule: ComplianceRule): void {
    this.complianceRules.push(rule);
  }

  // ── Agent Vitals Computation ───────────────────────────────────────────────

  computeAgentVitals(agentId: string, windowMs = WINDOW_MS): AgentVitals | null {
    const cutoff = Date.now() - windowMs;
    const identity = this.agentIdentities.get(agentId);
    const domain = identity?.domain ?? "unknown";

    const spans = this.reasoningSpans.filter(s => s.agentId === agentId && s.timestamp >= cutoff);
    if (spans.length === 0) return null;

    const decisionSpans = spans.filter(s => s.step === "respond" || s.step === "reason");
    const decisionLatencyMs = decisionSpans.length > 0
      ? decisionSpans.reduce((s, v) => s + v.latencyMs, 0) / decisionSpans.length
      : 0;

    const toolSpans = spans.filter(s => s.step === "tool_invoke");
    const toolSuccessCount = toolSpans.filter(s => s.status === "ok").length;
    const toolReliability = toolSpans.length > 0 ? toolSuccessCount / toolSpans.length : 1;

    const selfCorrectCount = spans.filter(s => s.step === "self_correct").length;
    const totalDecisions = Math.max(decisionSpans.length, 1);
    const hallucinationRate = Math.min(selfCorrectCount / totalDecisions, 1);

    const delegateSpans = spans.filter(s => s.step === "delegate");
    const recentChains = this.delegationChains.filter(c => c.originAgentId === agentId && c.timestamp >= cutoff);
    const successfulDelegations = recentChains.filter(c => c.finalOutcome === "success").length;
    const delegationEfficiency = recentChains.length > 0
      ? successfulDelegations / recentChains.length
      : delegateSpans.length === 0 ? 1 : 0.8;

    const escalated = spans.filter(s => s.step === "escalate").length;
    const autonomyUtilization = totalDecisions > 0
      ? Math.max(0, 1 - (escalated / totalDecisions))
      : 0.9;

    const vitalScore = Math.round(
      (toolReliability * 30) +
      (autonomyUtilization * 25) +
      (delegationEfficiency * 20) +
      ((1 - hallucinationRate) * 15) +
      (decisionLatencyMs < 500 ? 10 : decisionLatencyMs < 2000 ? 5 : 0)
    );

    const status: AgentVitals["status"] = vitalScore >= 75 ? "healthy" : vitalScore >= 50 ? "degraded" : "critical";

    return {
      agentId,
      domain,
      decisionLatencyMs: Math.round(decisionLatencyMs),
      hallucinationRate: Math.round(hallucinationRate * 1000) / 1000,
      toolReliability: Math.round(toolReliability * 1000) / 1000,
      delegationEfficiency: Math.round(delegationEfficiency * 1000) / 1000,
      autonomyUtilization: Math.round(autonomyUtilization * 1000) / 1000,
      vitalScore,
      status,
      sampledAt: Date.now(),
    };
  }

  getAllAgentVitals(windowMs = WINDOW_MS): AgentVitals[] {
    const vitals: AgentVitals[] = [];
    for (const agentId of this.agentIdentities.keys()) {
      const v = this.computeAgentVitals(agentId, windowMs);
      if (v) vitals.push(v);
    }
    return vitals;
  }

  // ── Trust Mesh ────────────────────────────────────────────────────────────

  getTrustReceipts(options: { agentId?: string; domain?: string; limit?: number; windowMs?: number } = {}): TrustReceipt[] {
    const { agentId, domain, limit = 50, windowMs = WINDOW_MS * 6 } = options;
    const cutoff = Date.now() - windowMs;
    let receipts = this.trustReceipts.filter(r => r.timestamp >= cutoff);
    if (agentId) receipts = receipts.filter(r => r.agentId === agentId);
    if (domain) receipts = receipts.filter(r => r.domain === domain);
    return receipts.slice(-limit).reverse();
  }

  getTrustScoreByAgent(): Record<string, { agentId: string; domain: string; avgConfidence: number; receiptCount: number; autonomousRate: number }> {
    const result: Record<string, { agentId: string; domain: string; avgConfidence: number; receiptCount: number; autonomousRate: number }> = {};
    const cutoff = Date.now() - WINDOW_MS * 12;
    const recent = this.trustReceipts.filter(r => r.timestamp >= cutoff);

    for (const receipt of recent) {
      if (!result[receipt.agentId]) {
        result[receipt.agentId] = { agentId: receipt.agentId, domain: receipt.domain, avgConfidence: 0, receiptCount: 0, autonomousRate: 0 };
      }
      const entry = result[receipt.agentId];
      entry.avgConfidence = (entry.avgConfidence * entry.receiptCount + receipt.confidenceScore) / (entry.receiptCount + 1);
      entry.receiptCount++;
      if (!receipt.humanInLoop) entry.autonomousRate = (entry.autonomousRate * (entry.receiptCount - 1) + 1) / entry.receiptCount;
    }

    return result;
  }

  // ── Compliance Evaluation ─────────────────────────────────────────────────

  evaluateAgentCompliance(agentId: string): ComplianceEvalResult[] {
    const identity = this.agentIdentities.get(agentId);
    if (!identity) return [];
    const vitals = this.computeAgentVitals(agentId) ?? {
      agentId, domain: identity.domain, decisionLatencyMs: 0, hallucinationRate: 0,
      toolReliability: 1, delegationEfficiency: 1, autonomyUtilization: 0.5,
      vitalScore: 75, status: "healthy" as const, sampledAt: Date.now(),
    };
    const recentDecisions = this.getTrustReceipts({ agentId, limit: 20 });
    const context: AgentComplianceContext = {
      agentId, domain: identity.domain, autonomyLevel: identity.autonomyLevel,
      recentDecisions, vitals, governancePoliciesApplied: identity.complianceTags,
    };
    return this.complianceRules.map(rule => {
      try { return rule.evaluate(context); } catch {
        return { passed: false, ruleId: rule.ruleId, finding: "Rule evaluation failed", severity: "warning" as const };
      }
    });
  }

  // ── Predictive Risk ───────────────────────────────────────────────────────

  getActivePredictiveSignals(domain?: string): PredictiveRiskSignal[] {
    const cutoff = Date.now() - WINDOW_MS * 6;
    let signals = this.predictiveSignals.filter(s => s.timestamp >= cutoff);
    if (domain) signals = signals.filter(s => s.domain === domain || s.domain === "all");
    return signals.sort((a, b) => b.probability * (b.impact === "critical" ? 4 : b.impact === "high" ? 3 : 2) -
      a.probability * (a.impact === "critical" ? 4 : a.impact === "high" ? 3 : 2));
  }

  // ── Governance Plane ──────────────────────────────────────────────────────

  getGovernancePlaneSnapshot(): {
    totalAgents: number;
    byAutonomyLevel: Record<AgentAutonomyLevel, number>;
    byLifecycleStatus: Record<AgentLifecycleStatus, number>;
    agentIdentities: AgentGovernanceIdentity[];
  } {
    const identities = Array.from(this.agentIdentities.values());
    const byAutonomyLevel: Record<AgentAutonomyLevel, number> = {
      supervised: 0, "semi-autonomous": 0, autonomous: 0, restricted: 0,
    };
    const byLifecycleStatus: Record<AgentLifecycleStatus, number> = {
      spawning: 0, active: 0, idle: 0, degraded: 0, retiring: 0, retired: 0,
    };
    for (const id of identities) {
      byAutonomyLevel[id.autonomyLevel] = (byAutonomyLevel[id.autonomyLevel] ?? 0) + 1;
      byLifecycleStatus[id.lifecycleStatus] = (byLifecycleStatus[id.lifecycleStatus] ?? 0) + 1;
    }
    return { totalAgents: identities.length, byAutonomyLevel, byLifecycleStatus, agentIdentities: identities };
  }

  // ── ABO Doctrine Snapshot ─────────────────────────────────────────────────

  getABOSnapshot() {
    const allVitals = this.getAllAgentVitals();
    const trustScores = this.getTrustScoreByAgent();
    const governancePlane = this.getGovernancePlaneSnapshot();
    const activeSignals = this.getActivePredictiveSignals();
    const recentReceipts = this.getTrustReceipts({ limit: 10 });

    const trustMeshHealth = Object.values(trustScores).length > 0
      ? Math.round(Object.values(trustScores).reduce((s, v) => s + v.avgConfidence, 0) / Object.values(trustScores).length * 100)
      : 0;

    const avgVitalScore = allVitals.length > 0
      ? Math.round(allVitals.reduce((s, v) => s + v.vitalScore, 0) / allVitals.length)
      : 0;

    const criticalSignals = activeSignals.filter(s => s.impact === "critical").length;

    return {
      pillars: {
        unifiedTelemetryFabric: { status: "active", spanCount: this.reasoningSpans.length, label: "MELT+A" },
        businessSignalIntelligence: { status: "active", correlationsActive: this.delegationChains.length },
        autonomousGovernancePlane: governancePlane,
        trustMesh: { health: trustMeshHealth, receiptCount: this.trustReceipts.length, recentReceipts },
        agentLifecycleObservability: { agentVitals: allVitals, avgVitalScore },
        predictiveRisk: { activeSignals: activeSignals.slice(0, 10), criticalCount: criticalSignals },
        complianceAsCode: { rulesLoaded: this.complianceRules.length },
        cognitiveObservabilityCanvas: { status: "active", label: "ABO Canvas" },
      },
      overallABOScore: Math.round((trustMeshHealth + avgVitalScore) / 2),
      timestamp: Date.now(),
    };
  }
}

export const agentTelemetry = new AgentTelemetryCollector();

// ── Bootstrap Default Compliance Rules ────────────────────────────────────────

function bootstrapDefaultComplianceRules(collector: AgentTelemetryCollector): void {
  // EU AI Act — High-Risk AI Requirements
  collector.registerComplianceRule({
    ruleId: "EU_AI_ACT_ART_14",
    framework: "EU_AI_ACT",
    requirement: "Article 14 — Human oversight measures",
    description: "High-risk AI systems must allow human oversight and intervention",
    severity: "critical",
    evaluate: (ctx) => {
      const autonomousWithoutHIL = ctx.recentDecisions.filter(
        d => d.autonomyLevel === "autonomous" && !d.humanInLoop && d.confidenceScore < ctx.vitals.autonomyUtilization
      ).length;
      const passed = autonomousWithoutHIL === 0 || ctx.autonomyLevel !== "autonomous";
      return {
        passed,
        ruleId: "EU_AI_ACT_ART_14",
        finding: passed ? undefined : `${autonomousWithoutHIL} autonomous decisions made without human oversight capability`,
        remediationSteps: ["Enable human-in-the-loop for critical decisions", "Lower autonomy level or raise escalation threshold"],
        severity: "critical",
      };
    },
  });

  collector.registerComplianceRule({
    ruleId: "EU_AI_ACT_ART_13",
    framework: "EU_AI_ACT",
    requirement: "Article 13 — Transparency and provision of information",
    description: "AI decisions must be explainable and carry trust receipts",
    severity: "warning",
    evaluate: (ctx) => {
      const receiptsWithNoSources = ctx.recentDecisions.filter(d => d.dataSources.length === 0).length;
      const passed = receiptsWithNoSources === 0;
      return {
        passed,
        ruleId: "EU_AI_ACT_ART_13",
        finding: passed ? undefined : `${receiptsWithNoSources} decisions lack data source documentation`,
        remediationSteps: ["Ensure all AI decisions include data provenance in trust receipt", "Enable full trust receipt generation"],
        severity: "warning",
      };
    },
  });

  // SOC 2 — Availability + Processing Integrity
  collector.registerComplianceRule({
    ruleId: "SOC2_CC7_1",
    framework: "SOC2",
    requirement: "CC7.1 — System Operations: Availability",
    description: "AI agents must maintain availability above defined thresholds",
    severity: "warning",
    evaluate: (ctx) => {
      const passed = ctx.vitals.toolReliability >= 0.85;
      return {
        passed,
        ruleId: "SOC2_CC7_1",
        finding: passed ? undefined : `Tool reliability ${(ctx.vitals.toolReliability * 100).toFixed(1)}% below 85% threshold`,
        remediationSteps: ["Investigate failing tool integrations", "Enable fallback tool routing", "Review tool permission boundaries"],
        severity: "warning",
      };
    },
  });

  collector.registerComplianceRule({
    ruleId: "SOC2_CC8_1",
    framework: "SOC2",
    requirement: "CC8.1 — Change Management",
    description: "Agent autonomy level changes must be tracked and governed",
    severity: "info",
    evaluate: (ctx) => {
      const passed = ctx.autonomyLevel !== "autonomous" || ctx.governancePoliciesApplied.length > 0;
      return {
        passed,
        ruleId: "SOC2_CC8_1",
        finding: passed ? undefined : "Autonomous agent operating without registered governance policies",
        remediationSteps: ["Register governance policy for agent", "Apply permission boundary", "Enable policy audit trail"],
        severity: "info",
      };
    },
  });

  // Internal Governance
  collector.registerComplianceRule({
    ruleId: "INTERNAL_HALLUCINATION_GATE",
    framework: "INTERNAL",
    requirement: "Hallucination Rate Control",
    description: "Agent hallucination rate must remain below 5%",
    severity: "warning",
    evaluate: (ctx) => {
      const passed = ctx.vitals.hallucinationRate < 0.05;
      return {
        passed,
        ruleId: "INTERNAL_HALLUCINATION_GATE",
        finding: passed ? undefined : `Hallucination rate ${(ctx.vitals.hallucinationRate * 100).toFixed(1)}% exceeds 5% threshold`,
        remediationSteps: ["Enable self-correction feedback loop", "Reduce model temperature", "Add retrieval-augmented grounding"],
        severity: "warning",
      };
    },
  });

  collector.registerComplianceRule({
    ruleId: "INTERNAL_DELEGATION_EFFICIENCY",
    framework: "INTERNAL",
    requirement: "Delegation Efficiency Minimum",
    description: "Agent delegation chain success rate must exceed 70%",
    severity: "info",
    evaluate: (ctx) => {
      const passed = ctx.vitals.delegationEfficiency >= 0.7;
      return {
        passed,
        ruleId: "INTERNAL_DELEGATION_EFFICIENCY",
        finding: passed ? undefined : `Delegation efficiency ${(ctx.vitals.delegationEfficiency * 100).toFixed(1)}% below 70%`,
        remediationSteps: ["Review delegation targets", "Update A2A routing policies", "Enable delegation monitoring"],
        severity: "info",
      };
    },
  });
}

bootstrapDefaultComplianceRules(agentTelemetry);

// ── Bootstrap Domain Agent Identities ─────────────────────────────────────────

const DOMAIN_AGENTS: AgentGovernanceIdentity[] = [
  {
    agentId: "maritime-autonomous", domain: "vessels", displayName: "Maritime Intelligence Agent",
    permissionBoundary: ["vessels:read", "vessels:signals:write", "vessels:risk:assess"],
    autonomyLevel: "semi-autonomous", lifecycleStatus: "active",
    complianceTags: ["EU_AI_ACT", "SOC2", "INTERNAL"], humanEscalationThreshold: 0.65,
    registeredAt: Date.now() - 86400000, lastActiveAt: Date.now() - 300000,
  },
  {
    agentId: "terra-autonomous", domain: "terra", displayName: "Real Estate Intelligence Agent",
    permissionBoundary: ["terra:read", "terra:risk:assess", "terra:signals:write"],
    autonomyLevel: "semi-autonomous", lifecycleStatus: "active",
    complianceTags: ["EU_AI_ACT", "SOC2", "INTERNAL"], humanEscalationThreshold: 0.70,
    registeredAt: Date.now() - 86400000, lastActiveAt: Date.now() - 600000,
  },
  {
    agentId: "firestorm-autonomous", domain: "firestorm", displayName: "Threat Intelligence Agent",
    permissionBoundary: ["firestorm:read", "firestorm:threats:assess", "firestorm:incidents:create"],
    autonomyLevel: "supervised", lifecycleStatus: "active",
    complianceTags: ["EU_AI_ACT", "SOC2", "NIST_CSF", "INTERNAL"], humanEscalationThreshold: 0.80,
    registeredAt: Date.now() - 86400000, lastActiveAt: Date.now() - 120000,
  },
  {
    agentId: "prism-autonomous", domain: "prism-counsel", displayName: "Legal Intelligence Agent",
    permissionBoundary: ["prism:read", "prism:matters:analyze", "prism:risk:assess"],
    autonomyLevel: "supervised", lifecycleStatus: "active",
    complianceTags: ["EU_AI_ACT", "SOC2", "HIPAA", "INTERNAL"], humanEscalationThreshold: 0.85,
    registeredAt: Date.now() - 86400000, lastActiveAt: Date.now() - 900000,
  },
  {
    agentId: "lyte-autonomous", domain: "lyte", displayName: "Business Operations Agent",
    permissionBoundary: ["lyte:read", "lyte:signals:write", "lyte:actions:propose"],
    autonomyLevel: "semi-autonomous", lifecycleStatus: "active",
    complianceTags: ["EU_AI_ACT", "SOC2", "INTERNAL"], humanEscalationThreshold: 0.60,
    registeredAt: Date.now() - 86400000, lastActiveAt: Date.now() - 60000,
  },
  {
    agentId: "nexus-autonomous", domain: "nexus", displayName: "Cross-Domain Fusion Agent",
    permissionBoundary: ["nexus:read", "nexus:correlate", "nexus:proof-chain:write"],
    autonomyLevel: "autonomous", lifecycleStatus: "active",
    complianceTags: ["EU_AI_ACT", "SOC2", "INTERNAL"], humanEscalationThreshold: 0.55,
    registeredAt: Date.now() - 86400000, lastActiveAt: Date.now() - 30000,
  },
  {
    agentId: "inca-autonomous", domain: "inca-lab", displayName: "AI Model Governance Agent",
    permissionBoundary: ["inca:read", "inca:models:evaluate", "inca:drift:detect"],
    autonomyLevel: "supervised", lifecycleStatus: "active",
    complianceTags: ["EU_AI_ACT", "SOC2", "INTERNAL"], humanEscalationThreshold: 0.75,
    registeredAt: Date.now() - 86400000, lastActiveAt: Date.now() - 180000,
  },
  {
    agentId: "szl-autonomous", domain: "szl-holdings", displayName: "Portfolio Intelligence Agent",
    permissionBoundary: ["holdings:read", "holdings:risk:assess", "holdings:kpi:report"],
    autonomyLevel: "supervised", lifecycleStatus: "active",
    complianceTags: ["EU_AI_ACT", "SOC2", "INTERNAL"], humanEscalationThreshold: 0.70,
    registeredAt: Date.now() - 86400000, lastActiveAt: Date.now() - 450000,
  },
  {
    agentId: "forge-autonomous", domain: "forge", displayName: "Client & Investor Relations Agent",
    permissionBoundary: ["forge:read", "forge:clients:analyze", "forge:reports:generate"],
    autonomyLevel: "supervised", lifecycleStatus: "active",
    complianceTags: ["EU_AI_ACT", "SOC2", "INTERNAL"], humanEscalationThreshold: 0.75,
    registeredAt: Date.now() - 86400000, lastActiveAt: Date.now() - 1200000,
  },
];

for (const agent of DOMAIN_AGENTS) {
  agentTelemetry.registerAgent(agent);
}

// Seed some synthetic predictive risk signals to demonstrate the engine
function seedPredictiveSignals(collector: AgentTelemetryCollector): void {
  const now = Date.now();
  collector.recordPredictiveSignal({
    signalId: `pred-${now}-1`,
    domain: "firestorm",
    riskType: "security_threat",
    title: "Elevated lateral movement probability in threat cluster TG-2847",
    description: "Behavioral pattern analysis predicts 73% probability of lateral movement attempt within next 4 hours based on C2 beacon frequency and authentication anomalies.",
    probability: 0.73,
    impact: "high",
    timeToMaterializeMs: 4 * 3600 * 1000,
    suggestedActions: ["Isolate affected network segment", "Activate incident response protocol", "Increase monitoring frequency"],
    confidence: 0.82,
    timestamp: now - 300000,
    forecastHorizonMs: 4 * 3600 * 1000,
  });

  collector.recordPredictiveSignal({
    signalId: `pred-${now}-2`,
    domain: "vessels",
    riskType: "business_impact",
    title: "Demurrage exposure forecast: $340K additional risk over 72h",
    description: "Cross-correlating vessel ETA predictions with port congestion indices and weather patterns yields 68% probability of port delay for MV Concordia exceeding threshold.",
    probability: 0.68,
    impact: "high",
    timeToMaterializeMs: 72 * 3600 * 1000,
    suggestedActions: ["Reroute MV Concordia to alternate anchorage", "Notify charterers of delay risk", "Review demurrage provisions"],
    confidence: 0.77,
    timestamp: now - 600000,
    forecastHorizonMs: 72 * 3600 * 1000,
  });

  collector.recordPredictiveSignal({
    signalId: `pred-${now}-3`,
    domain: "inca-lab",
    riskType: "agent_degradation",
    title: "Maritime agent accuracy drift trending toward warning threshold",
    description: "Tool reliability metrics for maritime-autonomous agent trending downward at -2.1%/day. At current rate, will breach 85% SOC2 threshold in approximately 6 days.",
    probability: 0.61,
    impact: "medium",
    timeToMaterializeMs: 6 * 24 * 3600 * 1000,
    suggestedActions: ["Schedule model retraining", "Increase retrieval accuracy", "Review tool integration stability"],
    confidence: 0.71,
    timestamp: now - 900000,
    forecastHorizonMs: 6 * 24 * 3600 * 1000,
  });

  collector.recordPredictiveSignal({
    signalId: `pred-${now}-4`,
    domain: "prism-counsel",
    riskType: "compliance_drift",
    title: "EU AI Act Article 13 compliance drift detected in legal analysis pipeline",
    description: "3 of last 18 legal matter analyses generated without complete data source documentation. Trend suggests compliance drift before next regulatory audit cycle.",
    probability: 0.54,
    impact: "critical",
    timeToMaterializeMs: 30 * 24 * 3600 * 1000,
    suggestedActions: ["Enforce trust receipt generation for all PRISM outputs", "Audit data provenance pipeline", "Add compliance gate to matter analysis workflow"],
    confidence: 0.68,
    timestamp: now - 1200000,
    forecastHorizonMs: 30 * 24 * 3600 * 1000,
  });

  collector.recordPredictiveSignal({
    signalId: `pred-${now}-5`,
    domain: "all",
    riskType: "system_failure",
    title: "API heap memory trend suggests OOM risk within 48h",
    description: "Memory telemetry analysis shows heap growth rate of +12MB/hour. Extrapolating to configured limit, OOM risk materializes in approximately 46 hours without intervention.",
    probability: 0.42,
    impact: "critical",
    timeToMaterializeMs: 46 * 3600 * 1000,
    suggestedActions: ["Investigate memory leak sources", "Schedule rolling restart", "Review WebSocket connection accumulation"],
    confidence: 0.74,
    timestamp: now - 1800000,
    forecastHorizonMs: 48 * 3600 * 1000,
  });
}

seedPredictiveSignals(agentTelemetry);
