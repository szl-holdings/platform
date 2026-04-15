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

export interface AgentBeliefModel {
  agentId: string;
  domain: string;
  queryInterpretation: string;
  beliefConfidence: number;
  divergenceFromConsensus: number;
  blindSpots: string[];
  timestamp: string;
}

export interface CounterfactualScenario {
  scenarioId: string;
  originalRouting: string[];
  alternativeRouting: string[];
  predictedOutcomeDelta: number;
  reasoning: string;
  timestamp: string;
}

export interface AdversarialProbe {
  probeId: string;
  edgeCaseQuery: string;
  targetDomain: string;
  blindSpotExposed: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

export interface SystemSelfModel {
  identity: SystemIdentity;
  capabilities: AgentCapabilityProfile[];
  overallHealth: "optimal" | "good" | "degraded" | "impaired";
  knownLimitations: string[];
  learningVelocity: number;
  selfNarrative: string;
  updatedAt: string;
  theoryOfMind: AgentBeliefModel[];
  recentCounterfactuals: CounterfactualScenario[];
  adversarialProbes: AdversarialProbe[];
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
  private beliefModels: Map<string, AgentBeliefModel> = new Map();
  private counterfactuals: CounterfactualScenario[] = [];
  private probes: AdversarialProbe[] = [];
  private static readonly VELOCITY_ALPHA = 0.1;
  private static readonly MAX_BELIEFS = 50;
  private static readonly MAX_COUNTERFACTUALS = 50;
  private static readonly MAX_PROBES = 30;

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

  modelAgentBelief(input: {
    agentId: string;
    domain: string;
    query: string;
    agentResponse: string;
    confidence: number;
    allResponses: Array<{ agentId: string; confidence: number; response: string }>;
  }): AgentBeliefModel {
    const consensusConfidence = input.allResponses.length > 0
      ? input.allResponses.reduce((s, r) => s + r.confidence, 0) / input.allResponses.length
      : input.confidence;

    const divergence = Math.abs(input.confidence - consensusConfidence) / 100;

    const profile = this.capabilities.get(input.agentId);
    const blindSpots: string[] = [];
    if (profile) {
      if (profile.weaknesses.length > 0) {
        blindSpots.push(...profile.weaknesses.slice(0, 2));
      }
      if (profile.successRate < 0.6) {
        blindSpots.push(`Low historical success rate (${(profile.successRate * 100).toFixed(0)}%)`);
      }
    }

    if (input.agentResponse.length < 150 && input.confidence > 70) {
      blindSpots.push("Overconfident on thin response — may be masking uncertainty");
    }

    const otherResponses = input.allResponses.filter(r => r.agentId !== input.agentId);
    const mentionedTerms = new Set(input.agentResponse.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    for (const other of otherResponses) {
      const otherTerms = other.response.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const unique = otherTerms.filter(t => !mentionedTerms.has(t));
      if (unique.length > otherTerms.length * 0.5) {
        blindSpots.push(`May not see perspectives from ${other.agentId}'s domain`);
        break;
      }
    }

    const interpretation = input.agentResponse.slice(0, 200);

    const belief: AgentBeliefModel = {
      agentId: input.agentId,
      domain: input.domain,
      queryInterpretation: interpretation,
      beliefConfidence: input.confidence,
      divergenceFromConsensus: divergence,
      blindSpots,
      timestamp: new Date().toISOString(),
    };

    this.beliefModels.set(input.agentId, belief);
    if (this.beliefModels.size > SelfModelEngine.MAX_BELIEFS) {
      const oldest = [...this.beliefModels.entries()]
        .sort((a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime());
      for (let i = 0; i < oldest.length - SelfModelEngine.MAX_BELIEFS; i++) {
        this.beliefModels.delete(oldest[i]![0]);
      }
    }

    return belief;
  }

  runCounterfactual(input: {
    originalRouting: string[];
    originalConfidence: number;
    alternativeRouting: string[];
    queryDomains: string[];
  }): CounterfactualScenario {
    let predictedDelta = 0;
    const reasoning: string[] = [];

    for (const altAgent of input.alternativeRouting) {
      const profile = this.capabilities.get(altAgent);
      if (profile) {
        const domainMatch = input.queryDomains.includes(profile.domain);
        const successBonus = (profile.successRate - 0.5) * 20;
        const domainBonus = domainMatch ? 10 : -5;
        predictedDelta += successBonus + domainBonus;
        reasoning.push(`${altAgent}: ${domainMatch ? "domain match" : "cross-domain"}, success ${(profile.successRate * 100).toFixed(0)}%`);
      } else {
        predictedDelta -= 5;
        reasoning.push(`${altAgent}: no profile data — uncertain improvement`);
      }
    }

    for (const origAgent of input.originalRouting) {
      const profile = this.capabilities.get(origAgent);
      if (profile) {
        predictedDelta -= (profile.successRate - 0.5) * 20;
      }
    }

    const scenario: CounterfactualScenario = {
      scenarioId: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      originalRouting: input.originalRouting,
      alternativeRouting: input.alternativeRouting,
      predictedOutcomeDelta: Math.round(predictedDelta * 10) / 10,
      reasoning: reasoning.join("; "),
      timestamp: new Date().toISOString(),
    };

    this.counterfactuals.push(scenario);
    if (this.counterfactuals.length > SelfModelEngine.MAX_COUNTERFACTUALS) {
      this.counterfactuals.splice(0, this.counterfactuals.length - SelfModelEngine.MAX_COUNTERFACTUALS);
    }

    return scenario;
  }

  generateAdversarialProbes(domains: string[]): AdversarialProbe[] {
    const probes: AdversarialProbe[] = [];
    const profiles = Array.from(this.capabilities.values());

    for (const domain of domains.slice(0, 5)) {
      const domainProfiles = profiles.filter(p => p.domain === domain);
      const weakProfiles = domainProfiles.filter(p => p.successRate < 0.6 || p.weaknesses.length > 0);

      if (weakProfiles.length > 0) {
        const target = weakProfiles[0]!;
        probes.push({
          probeId: `probe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          edgeCaseQuery: `What happens when ${domain} data contradicts established patterns? Test with ambiguous multi-domain scenario.`,
          targetDomain: domain,
          blindSpotExposed: target.weaknesses[0] ?? `Low success rate in ${domain} (${(target.successRate * 100).toFixed(0)}%)`,
          severity: target.successRate < 0.4 ? "high" : target.successRate < 0.6 ? "medium" : "low",
          timestamp: new Date().toISOString(),
        });
      }

      if (domainProfiles.length === 0) {
        probes.push({
          probeId: `probe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          edgeCaseQuery: `No agents profiled for ${domain} — what happens with a complex ${domain} query?`,
          targetDomain: domain,
          blindSpotExposed: `No tracked agents for domain: ${domain}`,
          severity: "high",
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.probes.push(...probes);
    if (this.probes.length > SelfModelEngine.MAX_PROBES) {
      this.probes.splice(0, this.probes.length - SelfModelEngine.MAX_PROBES);
    }

    return probes;
  }

  getTheoryOfMind(): AgentBeliefModel[] {
    return Array.from(this.beliefModels.values());
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
      theoryOfMind: Array.from(this.beliefModels.values()).slice(-10),
      recentCounterfactuals: this.counterfactuals.slice(-5),
      adversarialProbes: this.probes.slice(-5),
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

    if (this.beliefModels.size > 0) {
      const divergent = Array.from(this.beliefModels.values()).filter(b => b.divergenceFromConsensus > 0.3);
      if (divergent.length > 0) {
        parts.push(`Theory of Mind: ${divergent.length} agent(s) diverge significantly from consensus.`);
      }
    }

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

    if (model.theoryOfMind.length > 0) {
      const divergent = model.theoryOfMind.filter(b => b.divergenceFromConsensus > 0.3);
      if (divergent.length > 0) {
        lines.push(`ToM: ${divergent.length} agent(s) with divergent beliefs`);
      }
    }

    return lines.join("\n");
  }
}

export const selfModelEngine = new SelfModelEngine();
