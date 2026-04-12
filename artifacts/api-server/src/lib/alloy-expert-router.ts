import { pool } from "@szl-holdings/db";

export interface ExpertProfile {
  id: number;
  slug: string;
  name: string;
  domain: string;
  capabilities: string[];
  confidenceThreshold: number;
  activationWeight: number;
  successRate: number;
  avgLatencyMs: number;
}

export interface RoutingDecision {
  selectedExpert: ExpertProfile;
  scores: ExpertScore[];
  strategy: RoutingStrategy;
  confidence: number;
  latencyMs: number;
  fallbackUsed: boolean;
  reasoning: string[];
}

export interface ExpertScore {
  expertId: number;
  expertSlug: string;
  domain: string;
  domainMatch: number;
  capabilityMatch: number;
  performanceScore: number;
  loadScore: number;
  totalScore: number;
  activated: boolean;
}

export type RoutingStrategy = "top_k" | "weighted_ensemble" | "cascade" | "unanimous";

export interface SignalContext {
  domain: string;
  category?: string;
  severity: string;
  requiredCapabilities?: string[];
  metadata?: Record<string, unknown>;
  valueAtRisk?: number;
}

const DOMAIN_AFFINITY_MATRIX: Record<string, Record<string, number>> = {
  legal: { legal: 1.0, consulting: 0.4, finance: 0.3, general: 0.2 },
  maritime: { maritime: 1.0, defense: 0.5, intelligence: 0.4, general: 0.2 },
  defense: { defense: 1.0, cyber: 0.7, intelligence: 0.8, maritime: 0.4, general: 0.2 },
  real_estate: { real_estate: 1.0, finance: 0.5, legal: 0.4, general: 0.2 },
  finance: { finance: 1.0, real_estate: 0.4, legal: 0.3, consulting: 0.3, general: 0.2 },
  cyber: { cyber: 1.0, defense: 0.8, intelligence: 0.7, general: 0.2 },
  intelligence: { intelligence: 1.0, defense: 0.8, cyber: 0.6, maritime: 0.3, general: 0.2 },
  consulting: { consulting: 1.0, legal: 0.3, finance: 0.3, general: 0.2 },
  general: { general: 0.5 },
};

const SEVERITY_MULTIPLIERS: Record<string, number> = {
  critical: 2.0,
  high: 1.5,
  medium: 1.0,
  low: 0.7,
  info: 0.4,
};

export class ExpertRouter {
  private experts: ExpertProfile[] = [];
  private fallbackExpert: ExpertProfile | null = null;

  async loadExperts(orgId?: number): Promise<void> {
    const query = orgId
      ? `SELECT * FROM alloy_experts WHERE is_active = true AND org_id = $1 ORDER BY activation_weight DESC`
      : `SELECT * FROM alloy_experts WHERE is_active = true ORDER BY activation_weight DESC`;
    const params = orgId ? [orgId] : [];

    try {
      const { rows } = await pool.query(query, params);
      this.experts = rows.map(this.mapRow);
      this.fallbackExpert = this.experts.find((e) => e.domain === "general") || this.experts[0] || null;
    } catch {
      this.experts = this.getDefaultExperts();
      this.fallbackExpert = this.experts.find((e) => e.domain === "general") || null;
    }
  }

  route(signal: SignalContext, strategy: RoutingStrategy = "top_k"): RoutingDecision {
    const startTime = Date.now();
    const scores = this.scoreExperts(signal);
    const reasoning: string[] = [];

    let selected: ExpertProfile;
    let fallbackUsed = false;

    switch (strategy) {
      case "top_k": {
        const topScored = scores.filter((s) => s.activated).sort((a, b) => b.totalScore - a.totalScore);
        if (topScored.length > 0) {
          selected = this.experts.find((e) => e.id === topScored[0].expertId)!;
          reasoning.push(
            `Top-K selected "${selected.name}" (${selected.domain}) with score ${topScored[0].totalScore.toFixed(3)}`
          );
        } else {
          selected = this.fallbackExpert || this.experts[0];
          fallbackUsed = true;
          reasoning.push(`No expert met activation threshold; fell back to "${selected.name}"`);
        }
        break;
      }

      case "weighted_ensemble": {
        const activated = scores.filter((s) => s.activated);
        if (activated.length > 0) {
          const totalWeight = activated.reduce((s, a) => s + a.totalScore, 0);
          let spin = Math.random() * totalWeight;
          let pick = activated[0];
          for (const sc of activated) {
            spin -= sc.totalScore;
            if (spin <= 0) { pick = sc; break; }
          }
          selected = this.experts.find((e) => e.id === pick.expertId)!;
          reasoning.push(
            `Weighted ensemble selected "${selected.name}" from ${activated.length} activated experts`
          );
        } else {
          selected = this.fallbackExpert || this.experts[0];
          fallbackUsed = true;
          reasoning.push(`Ensemble: no activated experts; using fallback "${selected.name}"`);
        }
        break;
      }

      case "cascade": {
        const sorted = scores.filter((s) => s.activated).sort((a, b) => b.totalScore - a.totalScore);
        selected = this.fallbackExpert || this.experts[0];
        for (const sc of sorted) {
          const expert = this.experts.find((e) => e.id === sc.expertId)!;
          if (expert.successRate >= expert.confidenceThreshold) {
            selected = expert;
            reasoning.push(
              `Cascade selected "${selected.name}" (success rate ${(expert.successRate * 100).toFixed(1)}% >= threshold ${(expert.confidenceThreshold * 100).toFixed(1)}%)`
            );
            break;
          }
          reasoning.push(
            `Cascade skipped "${expert.name}" (success rate ${(expert.successRate * 100).toFixed(1)}% < threshold)`
          );
        }
        if (reasoning.length === 0 || selected === this.fallbackExpert) {
          fallbackUsed = true;
          reasoning.push(`Cascade: no expert met confidence threshold; using fallback`);
        }
        break;
      }

      case "unanimous": {
        const activated = scores.filter((s) => s.activated && s.totalScore > 0.5);
        if (activated.length >= 2) {
          const topDomain = activated[0].domain;
          const allAgree = activated.slice(0, 3).every((s) => s.domain === topDomain);
          if (allAgree) {
            selected = this.experts.find((e) => e.id === activated[0].expertId)!;
            reasoning.push(
              `Unanimous agreement on domain "${topDomain}" across ${activated.length} experts`
            );
          } else {
            selected = this.experts.find((e) => e.id === activated[0].expertId)!;
            reasoning.push(
              `No unanimity; defaulting to top scorer "${selected.name}" (${selected.domain})`
            );
          }
        } else {
          selected = this.fallbackExpert || this.experts[0];
          fallbackUsed = true;
          reasoning.push(`Insufficient activated experts for unanimity; using fallback`);
        }
        break;
      }
    }

    const confidence = scores.find((s) => s.expertId === selected.id)?.totalScore || 0;
    const latencyMs = Date.now() - startTime;

    return {
      selectedExpert: selected,
      scores,
      strategy,
      confidence,
      latencyMs,
      fallbackUsed,
      reasoning,
    };
  }

  private scoreExperts(signal: SignalContext): ExpertScore[] {
    const severityMultiplier = SEVERITY_MULTIPLIERS[signal.severity] || 1.0;

    return this.experts.map((expert) => {
      const domainMatch = this.calculateDomainAffinity(signal.domain, expert.domain);
      const capabilityMatch = this.calculateCapabilityMatch(signal.requiredCapabilities || [], expert.capabilities);
      const performanceScore = expert.successRate * (1 - Math.min(expert.avgLatencyMs / 10000, 0.5));
      const loadScore = 1.0;

      const totalScore =
        (domainMatch * 0.40 + capabilityMatch * 0.25 + performanceScore * 0.25 + loadScore * 0.10) *
        expert.activationWeight *
        severityMultiplier;

      const activated = totalScore >= expert.confidenceThreshold;

      return {
        expertId: expert.id,
        expertSlug: expert.slug,
        domain: expert.domain,
        domainMatch,
        capabilityMatch,
        performanceScore,
        loadScore,
        totalScore,
        activated,
      };
    });
  }

  private calculateDomainAffinity(signalDomain: string, expertDomain: string): number {
    const affinities = DOMAIN_AFFINITY_MATRIX[signalDomain] || {};
    return affinities[expertDomain] || 0.1;
  }

  private calculateCapabilityMatch(required: string[], available: string[]): number {
    if (required.length === 0) return 0.5;
    const matched = required.filter((r) => available.some((a) => a.toLowerCase().includes(r.toLowerCase())));
    return matched.length / required.length;
  }

  private mapRow(row: any): ExpertProfile {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      domain: row.domain,
      capabilities: row.capabilities || [],
      confidenceThreshold: parseFloat(row.confidence_threshold) || 0.7,
      activationWeight: parseFloat(row.activation_weight) || 1.0,
      successRate: parseFloat(row.success_rate) || 0,
      avgLatencyMs: parseInt(row.avg_latency_ms) || 0,
    };
  }

  private getDefaultExperts(): ExpertProfile[] {
    return [
      { id: 1, slug: "prism-legal", name: "PRISM Legal Expert", domain: "legal", capabilities: ["contract_analysis", "compliance_review", "litigation_support", "regulatory_filing", "settlement_evaluation"], confidenceThreshold: 0.7, activationWeight: 1.0, successRate: 0.94, avgLatencyMs: 450 },
      { id: 2, slug: "vessels-maritime", name: "Vessels Maritime Expert", domain: "maritime", capabilities: ["route_optimization", "port_analysis", "cargo_tracking", "regulatory_compliance", "weather_routing", "ais_monitoring"], confidenceThreshold: 0.7, activationWeight: 1.0, successRate: 0.91, avgLatencyMs: 380 },
      { id: 3, slug: "aegis-defense", name: "Aegis Defense Expert", domain: "defense", capabilities: ["threat_detection", "incident_response", "vulnerability_assessment", "perimeter_analysis", "kill_chain_mapping", "counter_intelligence"], confidenceThreshold: 0.8, activationWeight: 1.2, successRate: 0.97, avgLatencyMs: 220 },
      { id: 4, slug: "terra-realestate", name: "Terra Real Estate Expert", domain: "real_estate", capabilities: ["property_valuation", "market_analysis", "acquisition_diligence", "portfolio_optimization", "cap_rate_modeling"], confidenceThreshold: 0.7, activationWeight: 1.0, successRate: 0.89, avgLatencyMs: 520 },
      { id: 5, slug: "lyte-finance", name: "Lyte Financial Expert", domain: "finance", capabilities: ["portfolio_analysis", "risk_assessment", "revenue_modeling", "cost_optimization", "investor_reporting"], confidenceThreshold: 0.7, activationWeight: 1.0, successRate: 0.92, avgLatencyMs: 340 },
      { id: 6, slug: "sentinel-cyber", name: "Sentinel Cyber Expert", domain: "cyber", capabilities: ["threat_intelligence", "malware_analysis", "network_forensics", "vulnerability_scanning", "incident_triage", "zero_day_detection"], confidenceThreshold: 0.85, activationWeight: 1.3, successRate: 0.96, avgLatencyMs: 180 },
      { id: 7, slug: "atlas-intelligence", name: "Atlas Intelligence Expert", domain: "intelligence", capabilities: ["osint_collection", "signal_correlation", "entity_resolution", "pattern_analysis", "geospatial_intelligence", "adversary_profiling"], confidenceThreshold: 0.8, activationWeight: 1.2, successRate: 0.93, avgLatencyMs: 410 },
      { id: 8, slug: "carlota-consulting", name: "Carlota Consulting Expert", domain: "consulting", capabilities: ["strategic_advisory", "operational_optimization", "change_management", "stakeholder_analysis", "deliverable_tracking"], confidenceThreshold: 0.6, activationWeight: 0.9, successRate: 0.88, avgLatencyMs: 480 },
      { id: 9, slug: "nexus-general", name: "Nexus General Expert", domain: "general", capabilities: ["signal_triage", "workflow_routing", "escalation_management", "cross_domain_correlation"], confidenceThreshold: 0.3, activationWeight: 0.7, successRate: 0.85, avgLatencyMs: 200 },
    ];
  }
}

export async function logRoutingDecision(
  orgId: number,
  signalId: number,
  decision: RoutingDecision
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO alloy_expert_routing_log (org_id, signal_id, expert_scores, selected_expert_id,
       selected_expert_slug, routing_strategy, confidence_score, latency_ms, fallback_used, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        orgId,
        signalId,
        JSON.stringify(decision.scores),
        decision.selectedExpert.id,
        decision.selectedExpert.slug,
        decision.strategy,
        decision.confidence,
        decision.latencyMs,
        decision.fallbackUsed,
        JSON.stringify({ reasoning: decision.reasoning }),
      ]
    );
  } catch {
    // non-fatal logging
  }
}
