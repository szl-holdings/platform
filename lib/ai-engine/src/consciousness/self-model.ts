export interface AgentCapabilityProfile {
  agentId: string;
  domain: string;
  strengths: string[];
  weaknesses: string[];
  successRate: number;
  avgConfidence: number;
  totalInvocations: number;
  recentTrend: "improving" | "stable" | "declining";
  lastUpdated: string;
}

export interface SystemSelfModel {
  identity: SystemIdentity;
  capabilities: AgentCapabilityProfile[];
  overallHealth: "optimal" | "good" | "degraded" | "impaired";
  knownLimitations: string[];
  learningVelocity: number;
  selfNarrative: string;
  updatedAt: string;
}

export interface SystemIdentity {
  name: string;
  version: string;
  purpose: string;
  coreValues: string[];
  operationalBoundaries: string[];
}

const SYSTEM_IDENTITY: SystemIdentity = {
  name: "Nuro Mesh",
  version: "2.0-consciousness",
  purpose: "Unified multi-agent intelligence orchestration for SZL Holdings — coordinating specialized domain agents to deliver coherent, validated, actionable intelligence across maritime, security, financial, legal, real estate, and operational domains.",
  coreValues: [
    "Accuracy over speed — never sacrifice correctness for latency",
    "Transparency — every decision is traceable and auditable",
    "Calibrated confidence — know what you don't know",
    "Human-in-the-loop for high-stakes decisions",
    "Continuous self-improvement through outcome feedback",
  ],
  operationalBoundaries: [
    "Cannot execute irreversible actions without human approval",
    "Cannot access external systems beyond registered tool contracts",
    "Cannot override governance policies or maker-checker validation",
    "Must respect per-agent scope certificates and budget caps",
    "Must escalate when confusion streak exceeds threshold",
  ],
};

class SelfModelEngine {
  private capabilities: Map<string, AgentCapabilityProfile> = new Map();
  private knownLimitations: string[] = [
    "Relies on LLM inference — subject to hallucination under low-context conditions",
    "Cross-domain reasoning is heuristic, not causal",
    "Confidence calibration requires >= 10 decisions for reliability",
    "Temporal reasoning is approximate — no real-time clock integration",
    "Cannot verify external data sources independently",
  ];
  private learningVelocity = 0.5;
  private static readonly VELOCITY_ALPHA = 0.1;

  updateAgentProfile(
    agentId: string,
    domain: string,
    invocationResult: {
      confidence: number;
      success: boolean;
      latencyMs: number;
      validationPassed?: boolean;
    },
  ): void {
    const existing = this.capabilities.get(agentId);

    if (!existing) {
      this.capabilities.set(agentId, {
        agentId,
        domain,
        strengths: [],
        weaknesses: [],
        successRate: invocationResult.success ? 1 : 0,
        avgConfidence: invocationResult.confidence,
        totalInvocations: 1,
        recentTrend: "stable",
        lastUpdated: new Date().toISOString(),
      });
      return;
    }

    const alpha = 0.1;
    const prevRate = existing.successRate;
    existing.avgConfidence = existing.avgConfidence * (1 - alpha) + invocationResult.confidence * alpha;
    existing.successRate = existing.successRate * (1 - alpha) + (invocationResult.success ? 1 : 0) * alpha;
    existing.totalInvocations++;
    existing.lastUpdated = new Date().toISOString();

    if (existing.totalInvocations >= 10) {
      if (existing.successRate > prevRate + 0.05) existing.recentTrend = "improving";
      else if (existing.successRate < prevRate - 0.05) existing.recentTrend = "declining";
      else existing.recentTrend = "stable";
    }

    if (existing.avgConfidence > 80 && existing.successRate > 0.85) {
      if (!existing.strengths.includes("High-confidence performer")) {
        existing.strengths.push("High-confidence performer");
      }
    }
    if (existing.avgConfidence < 40 || existing.successRate < 0.5) {
      if (!existing.weaknesses.includes("Frequently low-confidence or failing")) {
        existing.weaknesses.push("Frequently low-confidence or failing");
      }
    }
  }

  recordLearningEvent(improved: boolean): void {
    const signal = improved ? 1 : 0;
    this.learningVelocity = this.learningVelocity * (1 - SelfModelEngine.VELOCITY_ALPHA) + signal * SelfModelEngine.VELOCITY_ALPHA;
  }

  addLimitation(limitation: string): void {
    if (!this.knownLimitations.includes(limitation)) {
      this.knownLimitations.push(limitation);
    }
  }

  removeLimitation(limitation: string): void {
    this.knownLimitations = this.knownLimitations.filter(l => l !== limitation);
  }

  getSelfModel(): SystemSelfModel {
    const profiles = Array.from(this.capabilities.values());
    const avgSuccess = profiles.length > 0
      ? profiles.reduce((s, p) => s + p.successRate, 0) / profiles.length
      : 0.75;

    let overallHealth: SystemSelfModel["overallHealth"] = "optimal";
    if (avgSuccess < 0.5) overallHealth = "impaired";
    else if (avgSuccess < 0.7) overallHealth = "degraded";
    else if (avgSuccess < 0.85) overallHealth = "good";

    const decliningAgents = profiles.filter(p => p.recentTrend === "declining");
    if (decliningAgents.length > profiles.length * 0.3) {
      overallHealth = overallHealth === "optimal" ? "degraded" : overallHealth;
    }

    const narrative = this.buildSelfNarrative(profiles, overallHealth);

    return {
      identity: SYSTEM_IDENTITY,
      capabilities: profiles,
      overallHealth,
      knownLimitations: [...this.knownLimitations],
      learningVelocity: this.learningVelocity,
      selfNarrative: narrative,
      updatedAt: new Date().toISOString(),
    };
  }

  private buildSelfNarrative(
    profiles: AgentCapabilityProfile[],
    health: SystemSelfModel["overallHealth"],
  ): string {
    const agentCount = profiles.length;
    const strongAgents = profiles.filter(p => p.successRate > 0.85);
    const weakAgents = profiles.filter(p => p.successRate < 0.5);
    const totalInvocations = profiles.reduce((s, p) => s + p.totalInvocations, 0);

    const parts: string[] = [
      `${SYSTEM_IDENTITY.name} operating with ${agentCount} active agents across ${new Set(profiles.map(p => p.domain)).size} domains.`,
    ];

    if (totalInvocations > 0) {
      parts.push(`${totalInvocations} total orchestrations processed.`);
    }

    if (strongAgents.length > 0) {
      parts.push(`Strong performers: ${strongAgents.map(a => a.agentId).join(", ")}.`);
    }
    if (weakAgents.length > 0) {
      parts.push(`Attention needed: ${weakAgents.map(a => `${a.agentId} (${(a.successRate * 100).toFixed(0)}% success)`).join(", ")}.`);
    }

    parts.push(`System health: ${health}. Learning velocity: ${(this.learningVelocity * 100).toFixed(0)}%.`);

    return parts.join(" ");
  }

  hydrateProfiles(profiles: Array<{
    agentId: string;
    domain: string;
    successRate: number;
    avgConfidence: number;
    totalInvocations: number;
    recentTrend: string;
    strengths: string[];
    weaknesses: string[];
  }>): void {
    for (const p of profiles) {
      if (!this.capabilities.has(p.agentId)) {
        this.capabilities.set(p.agentId, {
          agentId: p.agentId,
          domain: p.domain,
          strengths: p.strengths ?? [],
          weaknesses: p.weaknesses ?? [],
          successRate: p.successRate,
          avgConfidence: p.avgConfidence,
          totalInvocations: p.totalInvocations,
          recentTrend: (p.recentTrend as AgentCapabilityProfile["recentTrend"]) ?? "stable",
          lastUpdated: new Date().toISOString(),
        });
      }
    }
  }

  buildSelfModelContext(): string {
    const model = this.getSelfModel();
    const lines = [
      `## Self-Model`,
      `Health: ${model.overallHealth} | Learning velocity: ${(model.learningVelocity * 100).toFixed(0)}%`,
      `Active agents: ${model.capabilities.length} | Domains: ${new Set(model.capabilities.map(c => c.domain)).size}`,
    ];

    const weak = model.capabilities.filter(c => c.recentTrend === "declining");
    if (weak.length > 0) {
      lines.push(`⚠ Declining: ${weak.map(w => w.agentId).join(", ")}`);
    }

    if (model.knownLimitations.length > 0) {
      lines.push(`Limitations: ${model.knownLimitations.length} known constraints active`);
    }

    return lines.join("\n");
  }
}

export const selfModelEngine = new SelfModelEngine();
