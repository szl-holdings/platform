import { pool } from "@szl-holdings/db";

export interface ThreatActor {
  id: string;
  name: string;
  type: "nation_state" | "criminal" | "insider" | "hacktivist" | "competitor" | "automated";
  capability: "basic" | "intermediate" | "advanced" | "elite";
  motivation: string;
  targetedDomains: string[];
  knownTTPs: string[];
  riskLevel: number;
}

export interface AttackVector {
  id: string;
  name: string;
  category: "network" | "application" | "social" | "physical" | "supply_chain" | "insider";
  description: string;
  likelihood: number;
  impact: number;
  killChainPhase: KillChainPhase;
  mitigationIds: string[];
}

export type KillChainPhase =
  | "reconnaissance"
  | "weaponization"
  | "delivery"
  | "exploitation"
  | "installation"
  | "command_control"
  | "actions_on_objectives";

export interface Vulnerability {
  id: string;
  asset: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  cvssScore: number;
  exploitability: number;
  patchAvailable: boolean;
  compensatingControls: string[];
}

export interface Mitigation {
  id: string;
  name: string;
  type: "preventive" | "detective" | "corrective" | "compensating";
  effectiveness: number;
  cost: "low" | "medium" | "high";
  implementationTime: string;
  status: "planned" | "in_progress" | "implemented" | "verified";
}

export interface StrideAnalysis {
  spoofing: StrideCategory;
  tampering: StrideCategory;
  repudiation: StrideCategory;
  informationDisclosure: StrideCategory;
  denialOfService: StrideCategory;
  elevationOfPrivilege: StrideCategory;
}

export interface StrideCategory {
  threats: string[];
  riskLevel: number;
  mitigations: string[];
  residualRisk: number;
}

export interface RiskMatrix {
  likelihood: number;
  impact: number;
  riskScore: number;
  riskLevel: "critical" | "high" | "medium" | "low" | "negligible";
  acceptability: "unacceptable" | "tolerable" | "acceptable";
}

export interface ThreatModelResult {
  targetAsset: string;
  domain: string;
  overallRiskScore: number;
  riskLevel: string;
  threatActors: ThreatActor[];
  attackVectors: AttackVector[];
  vulnerabilities: Vulnerability[];
  mitigations: Mitigation[];
  stride: StrideAnalysis;
  killChain: KillChainMapping[];
  riskMatrix: RiskMatrix;
  recommendations: ThreatRecommendation[];
  counterIntelIndicators: CounterIntelIndicator[];
}

export interface KillChainMapping {
  phase: KillChainPhase;
  threats: string[];
  defenses: string[];
  gapScore: number;
}

export interface ThreatRecommendation {
  priority: "immediate" | "short_term" | "long_term";
  action: string;
  rationale: string;
  estimatedCost: string;
  riskReduction: number;
}

export interface CounterIntelIndicator {
  type: "network" | "behavioral" | "data" | "physical";
  indicator: string;
  confidence: number;
  actionRequired: string;
}

export class ThreatEngine {
  private domainThreatProfiles: Map<string, ThreatActor[]> = new Map();
  private domainVulnerabilities: Map<string, Vulnerability[]> = new Map();

  constructor() {
    this.initializeProfiles();
  }

  analyze(targetAsset: string, domain: string, context?: Record<string, unknown>): ThreatModelResult {
    const threatActors = this.identifyThreatActors(domain);
    const vulnerabilities = this.assessVulnerabilities(domain, targetAsset);
    const attackVectors = this.mapAttackVectors(threatActors, vulnerabilities);
    const mitigations = this.generateMitigations(attackVectors, vulnerabilities);
    const stride = this.performStrideAnalysis(domain, targetAsset);
    const killChain = this.mapKillChain(attackVectors, mitigations);
    const riskMatrix = this.calculateRiskMatrix(threatActors, vulnerabilities, mitigations);
    const recommendations = this.generateRecommendations(riskMatrix, attackVectors, mitigations);
    const counterIntelIndicators = this.generateCounterIntelIndicators(domain, threatActors);

    return {
      targetAsset,
      domain,
      overallRiskScore: riskMatrix.riskScore,
      riskLevel: riskMatrix.riskLevel,
      threatActors,
      attackVectors,
      vulnerabilities,
      mitigations,
      stride,
      killChain,
      riskMatrix,
      recommendations,
      counterIntelIndicators,
    };
  }

  private identifyThreatActors(domain: string): ThreatActor[] {
    return this.domainThreatProfiles.get(domain) || this.domainThreatProfiles.get("general") || [];
  }

  private assessVulnerabilities(domain: string, asset: string): Vulnerability[] {
    const base = this.domainVulnerabilities.get(domain) || this.domainVulnerabilities.get("general") || [];
    return base.map((v) => ({ ...v, asset: `${asset}/${v.asset}` }));
  }

  private mapAttackVectors(actors: ThreatActor[], vulns: Vulnerability[]): AttackVector[] {
    const vectors: AttackVector[] = [];
    const phases: KillChainPhase[] = [
      "reconnaissance", "weaponization", "delivery", "exploitation",
      "installation", "command_control", "actions_on_objectives",
    ];

    for (const actor of actors) {
      for (const ttp of actor.knownTTPs) {
        const matchingVulns = vulns.filter(
          (v) => v.severity === "critical" || v.severity === "high" || v.exploitability > 0.6
        );

        if (matchingVulns.length > 0) {
          const phase = phases[Math.min(actor.knownTTPs.indexOf(ttp), phases.length - 1)] || "exploitation";
          vectors.push({
            id: `av-${actor.id}-${ttp.replace(/\s+/g, "_").toLowerCase()}`,
            name: `${actor.name}: ${ttp}`,
            category: this.categorizeVector(ttp),
            description: `${actor.type} actor using ${ttp} against exposed vulnerabilities`,
            likelihood: actor.riskLevel * 0.1 * matchingVulns[0].exploitability,
            impact: matchingVulns.reduce((max, v) => Math.max(max, v.cvssScore / 10), 0),
            killChainPhase: phase,
            mitigationIds: [],
          });
        }
      }
    }

    return vectors;
  }

  private generateMitigations(vectors: AttackVector[], vulns: Vulnerability[]): Mitigation[] {
    const mitigations: Mitigation[] = [
      { id: "m-001", name: "Zero Trust Architecture", type: "preventive", effectiveness: 0.85, cost: "high", implementationTime: "6-12 months", status: "planned" },
      { id: "m-002", name: "Multi-Factor Authentication", type: "preventive", effectiveness: 0.90, cost: "low", implementationTime: "1-2 weeks", status: "implemented" },
      { id: "m-003", name: "Network Segmentation", type: "preventive", effectiveness: 0.75, cost: "medium", implementationTime: "2-4 months", status: "in_progress" },
      { id: "m-004", name: "SIEM/SOC Monitoring", type: "detective", effectiveness: 0.80, cost: "high", implementationTime: "3-6 months", status: "implemented" },
      { id: "m-005", name: "Incident Response Plan", type: "corrective", effectiveness: 0.70, cost: "low", implementationTime: "2-4 weeks", status: "verified" },
      { id: "m-006", name: "Data Loss Prevention", type: "preventive", effectiveness: 0.72, cost: "medium", implementationTime: "2-3 months", status: "implemented" },
      { id: "m-007", name: "Encryption at Rest/Transit", type: "preventive", effectiveness: 0.88, cost: "medium", implementationTime: "1-3 months", status: "implemented" },
      { id: "m-008", name: "Vulnerability Scanning", type: "detective", effectiveness: 0.65, cost: "low", implementationTime: "1 week", status: "verified" },
      { id: "m-009", name: "Privileged Access Management", type: "preventive", effectiveness: 0.82, cost: "medium", implementationTime: "2-4 months", status: "in_progress" },
      { id: "m-010", name: "Threat Intelligence Feed", type: "detective", effectiveness: 0.78, cost: "medium", implementationTime: "1-2 months", status: "planned" },
    ];

    for (const vector of vectors) {
      const relevant = mitigations.filter((m) => {
        if (vector.category === "network") return ["m-001", "m-003", "m-004", "m-007"].includes(m.id);
        if (vector.category === "application") return ["m-002", "m-006", "m-008", "m-009"].includes(m.id);
        if (vector.category === "social") return ["m-002", "m-005", "m-006"].includes(m.id);
        if (vector.category === "insider") return ["m-004", "m-006", "m-009"].includes(m.id);
        return true;
      });
      vector.mitigationIds = relevant.map((m) => m.id);
    }

    return mitigations;
  }

  private performStrideAnalysis(domain: string, asset: string): StrideAnalysis {
    const domainRisk = domain === "defense" || domain === "intelligence" ? 0.8 : domain === "finance" ? 0.6 : 0.4;

    return {
      spoofing: {
        threats: ["Identity spoofing via compromised credentials", "Session hijacking through token theft", "DNS spoofing for traffic redirection"],
        riskLevel: domainRisk * 0.7,
        mitigations: ["MFA enforcement", "Certificate pinning", "DNSSEC"],
        residualRisk: domainRisk * 0.15,
      },
      tampering: {
        threats: ["Data modification in transit", "Database injection attacks", "Configuration tampering via CI/CD"],
        riskLevel: domainRisk * 0.8,
        mitigations: ["Input validation", "Integrity checksums", "Immutable audit logs"],
        residualRisk: domainRisk * 0.12,
      },
      repudiation: {
        threats: ["Action denial without audit trail", "Log tampering to cover tracks", "Shared account usage"],
        riskLevel: domainRisk * 0.5,
        mitigations: ["Immutable audit logging", "Digital signatures", "Individual accountability"],
        residualRisk: domainRisk * 0.08,
      },
      informationDisclosure: {
        threats: ["Data exfiltration via API", "Credential leakage in logs", "Side-channel information exposure"],
        riskLevel: domainRisk * 0.9,
        mitigations: ["DLP controls", "Encryption at rest", "Access control enforcement"],
        residualRisk: domainRisk * 0.18,
      },
      denialOfService: {
        threats: ["Application-layer DDoS", "Resource exhaustion via crafted queries", "Infrastructure disruption"],
        riskLevel: domainRisk * 0.6,
        mitigations: ["Rate limiting", "Auto-scaling", "DDoS protection"],
        residualRisk: domainRisk * 0.10,
      },
      elevationOfPrivilege: {
        threats: ["Horizontal privilege escalation", "Role bypass via API manipulation", "Container escape"],
        riskLevel: domainRisk * 0.85,
        mitigations: ["RBAC enforcement", "Least privilege principle", "Container hardening"],
        residualRisk: domainRisk * 0.14,
      },
    };
  }

  private mapKillChain(vectors: AttackVector[], mitigations: Mitigation[]): KillChainMapping[] {
    const phases: KillChainPhase[] = [
      "reconnaissance", "weaponization", "delivery", "exploitation",
      "installation", "command_control", "actions_on_objectives",
    ];

    return phases.map((phase) => {
      const phaseVectors = vectors.filter((v) => v.killChainPhase === phase);
      const phaseDefenses = mitigations.filter((m) => m.status === "implemented" || m.status === "verified");
      const gapScore = phaseVectors.length > 0
        ? 1 - phaseDefenses.reduce((eff, m) => Math.max(eff, m.effectiveness), 0)
        : 0;

      return {
        phase,
        threats: phaseVectors.map((v) => v.name),
        defenses: phaseDefenses.map((m) => m.name),
        gapScore: Math.max(0, gapScore),
      };
    });
  }

  private calculateRiskMatrix(
    actors: ThreatActor[],
    vulns: Vulnerability[],
    mitigations: Mitigation[]
  ): RiskMatrix {
    const avgActorRisk = actors.length > 0 ? actors.reduce((s, a) => s + a.riskLevel, 0) / actors.length : 0;
    const avgVulnSeverity = vulns.length > 0
      ? vulns.reduce((s, v) => s + v.cvssScore, 0) / vulns.length / 10
      : 0;
    const mitigationEffectiveness = mitigations.length > 0
      ? mitigations.filter((m) => m.status === "implemented" || m.status === "verified")
          .reduce((s, m) => s + m.effectiveness, 0) /
        Math.max(mitigations.length, 1)
      : 0;

    const likelihood = avgActorRisk * 0.1 * (1 - mitigationEffectiveness * 0.5);
    const impact = avgVulnSeverity * (1 - mitigationEffectiveness * 0.3);
    const riskScore = likelihood * impact;

    let riskLevel: RiskMatrix["riskLevel"];
    if (riskScore > 0.7) riskLevel = "critical";
    else if (riskScore > 0.5) riskLevel = "high";
    else if (riskScore > 0.3) riskLevel = "medium";
    else if (riskScore > 0.1) riskLevel = "low";
    else riskLevel = "negligible";

    let acceptability: RiskMatrix["acceptability"];
    if (riskScore > 0.5) acceptability = "unacceptable";
    else if (riskScore > 0.2) acceptability = "tolerable";
    else acceptability = "acceptable";

    return { likelihood, impact, riskScore, riskLevel, acceptability };
  }

  private generateRecommendations(
    risk: RiskMatrix,
    vectors: AttackVector[],
    mitigations: Mitigation[]
  ): ThreatRecommendation[] {
    const recs: ThreatRecommendation[] = [];
    const unimplemented = mitigations.filter((m) => m.status === "planned" || m.status === "in_progress");

    for (const mit of unimplemented.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 5)) {
      recs.push({
        priority: mit.effectiveness > 0.8 ? "immediate" : mit.effectiveness > 0.6 ? "short_term" : "long_term",
        action: `Implement ${mit.name}`,
        rationale: `${(mit.effectiveness * 100).toFixed(0)}% effectiveness against identified attack vectors`,
        estimatedCost: mit.cost,
        riskReduction: mit.effectiveness * risk.riskScore,
      });
    }

    const highImpactVectors = vectors.filter((v) => v.impact > 0.7 && v.mitigationIds.length === 0);
    for (const vec of highImpactVectors.slice(0, 3)) {
      recs.push({
        priority: "immediate",
        action: `Address unmitigated vector: ${vec.name}`,
        rationale: `Impact score ${(vec.impact * 10).toFixed(1)}/10 with no current mitigations`,
        estimatedCost: "medium",
        riskReduction: vec.impact * vec.likelihood,
      });
    }

    return recs.sort((a, b) => b.riskReduction - a.riskReduction);
  }

  private generateCounterIntelIndicators(domain: string, actors: ThreatActor[]): CounterIntelIndicator[] {
    const indicators: CounterIntelIndicator[] = [
      { type: "network", indicator: "Anomalous outbound connections to known C2 infrastructure", confidence: 0.85, actionRequired: "Isolate affected systems and initiate forensic analysis" },
      { type: "behavioral", indicator: "Unusual data access patterns outside normal business hours", confidence: 0.72, actionRequired: "Review access logs and correlate with HR schedule data" },
      { type: "data", indicator: "Bulk data export exceeding baseline by >300%", confidence: 0.90, actionRequired: "Block export and escalate to security operations" },
      { type: "network", indicator: "DNS tunneling patterns detected in outbound queries", confidence: 0.88, actionRequired: "Block suspicious DNS and investigate source hosts" },
      { type: "behavioral", indicator: "Privileged account used from previously unseen geolocation", confidence: 0.78, actionRequired: "Force re-authentication and review session history" },
    ];

    if (domain === "defense" || domain === "intelligence") {
      indicators.push(
        { type: "physical", indicator: "Unauthorized device detected on secure network segment", confidence: 0.95, actionRequired: "Physical sweep and network isolation protocol" },
        { type: "data", indicator: "Classification marker stripping detected in document pipeline", confidence: 0.92, actionRequired: "Halt pipeline and invoke insider threat protocol" }
      );
    }

    return indicators;
  }

  private categorizeVector(ttp: string): AttackVector["category"] {
    const lower = ttp.toLowerCase();
    if (lower.includes("phish") || lower.includes("social")) return "social";
    if (lower.includes("insider") || lower.includes("privilege")) return "insider";
    if (lower.includes("supply") || lower.includes("vendor")) return "supply_chain";
    if (lower.includes("sql") || lower.includes("injection") || lower.includes("xss")) return "application";
    if (lower.includes("physical") || lower.includes("usb")) return "physical";
    return "network";
  }

  private initializeProfiles(): void {
    this.domainThreatProfiles.set("defense", [
      { id: "ta-001", name: "APT-29 (Cozy Bear)", type: "nation_state", capability: "elite", motivation: "Strategic intelligence collection", targetedDomains: ["defense", "intelligence", "government"], knownTTPs: ["Spearphishing with compromised supply chain", "Zero-day exploitation", "Living-off-the-land techniques", "Cloud service abuse"], riskLevel: 9.5 },
      { id: "ta-002", name: "APT-28 (Fancy Bear)", type: "nation_state", capability: "advanced", motivation: "Military intelligence and disruption", targetedDomains: ["defense", "maritime", "intelligence"], knownTTPs: ["OAuth token theft", "VPN exploitation", "Credential harvesting", "Custom malware deployment"], riskLevel: 9.0 },
      { id: "ta-003", name: "Insider Threat Vector", type: "insider", capability: "intermediate", motivation: "Financial gain or ideological", targetedDomains: ["defense", "intelligence", "finance"], knownTTPs: ["Privileged access abuse", "Data exfiltration via removable media", "Unauthorized system modification"], riskLevel: 7.5 },
    ]);

    this.domainThreatProfiles.set("maritime", [
      { id: "ta-010", name: "Maritime APT Cluster", type: "nation_state", capability: "advanced", motivation: "Port infrastructure disruption and shipping intelligence", targetedDomains: ["maritime", "defense"], knownTTPs: ["AIS spoofing", "Port OT system exploitation", "Supply chain compromise", "GPS jamming coordination"], riskLevel: 8.0 },
      { id: "ta-011", name: "Maritime Criminal Syndicate", type: "criminal", capability: "intermediate", motivation: "Cargo theft and ransomware", targetedDomains: ["maritime", "finance"], knownTTPs: ["Ransomware deployment", "Cargo manifest manipulation", "Watering hole attacks on port systems"], riskLevel: 7.0 },
    ]);

    this.domainThreatProfiles.set("finance", [
      { id: "ta-020", name: "FIN7 / Carbanak", type: "criminal", capability: "advanced", motivation: "Financial fraud and data theft", targetedDomains: ["finance", "real_estate"], knownTTPs: ["Point-of-sale malware", "Business email compromise", "SQL injection", "Supply chain attacks"], riskLevel: 8.5 },
      { id: "ta-021", name: "Competitor Intelligence Unit", type: "competitor", capability: "intermediate", motivation: "Competitive advantage", targetedDomains: ["finance", "consulting"], knownTTPs: ["Social engineering of employees", "Open source intelligence gathering", "Insider recruitment"], riskLevel: 6.0 },
    ]);

    this.domainThreatProfiles.set("legal", [
      { id: "ta-030", name: "Litigation Adversary", type: "competitor", capability: "intermediate", motivation: "Case intelligence and privilege breach", targetedDomains: ["legal", "consulting"], knownTTPs: ["Phishing for privileged documents", "Email account compromise", "Third-party vendor exploitation"], riskLevel: 7.0 },
    ]);

    this.domainThreatProfiles.set("real_estate", [
      { id: "ta-040", name: "Wire Fraud Ring", type: "criminal", capability: "intermediate", motivation: "Real estate wire fraud", targetedDomains: ["real_estate", "finance"], knownTTPs: ["Business email compromise", "Title company impersonation", "Closing document manipulation"], riskLevel: 7.5 },
    ]);

    this.domainThreatProfiles.set("general", [
      { id: "ta-099", name: "Opportunistic Threat Actor", type: "automated", capability: "basic", motivation: "Mass exploitation for profit", targetedDomains: ["general"], knownTTPs: ["Automated vulnerability scanning", "Credential stuffing", "Phishing campaigns"], riskLevel: 5.0 },
    ]);

    const baseVulns: Vulnerability[] = [
      { id: "v-001", asset: "api-gateway", description: "API authentication bypass via malformed JWT", severity: "critical", cvssScore: 9.1, exploitability: 0.8, patchAvailable: true, compensatingControls: ["WAF rules", "Rate limiting"] },
      { id: "v-002", asset: "database-layer", description: "SQL injection in dynamic query construction", severity: "high", cvssScore: 8.2, exploitability: 0.6, patchAvailable: true, compensatingControls: ["Parameterized queries", "Input sanitization"] },
      { id: "v-003", asset: "auth-service", description: "Weak session management allows session fixation", severity: "high", cvssScore: 7.5, exploitability: 0.7, patchAvailable: false, compensatingControls: ["Session rotation on auth", "IP binding"] },
      { id: "v-004", asset: "file-storage", description: "Path traversal in file upload handler", severity: "medium", cvssScore: 6.8, exploitability: 0.5, patchAvailable: true, compensatingControls: ["Sandboxed storage", "Filename sanitization"] },
      { id: "v-005", asset: "audit-system", description: "Log injection allowing audit trail manipulation", severity: "high", cvssScore: 7.8, exploitability: 0.4, patchAvailable: false, compensatingControls: ["Append-only log store", "Log integrity monitoring"] },
    ];

    for (const domain of ["defense", "maritime", "finance", "legal", "real_estate", "general"]) {
      this.domainVulnerabilities.set(domain, baseVulns);
    }
  }
}

export async function persistThreatModel(orgId: number, result: ThreatModelResult): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO alloy_threat_models (org_id, name, target_asset, domain, threat_actors, attack_vectors,
     vulnerabilities, mitigations, risk_matrix, overall_risk_score, stride, kill_chain_mapping,
     counter_intel_indicators, status, last_assessed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', NOW())
     RETURNING id`,
    [
      orgId,
      `Threat Model: ${result.targetAsset}`,
      result.targetAsset,
      result.domain,
      JSON.stringify(result.threatActors),
      JSON.stringify(result.attackVectors),
      JSON.stringify(result.vulnerabilities),
      JSON.stringify(result.mitigations),
      JSON.stringify(result.riskMatrix),
      result.overallRiskScore,
      JSON.stringify(result.stride),
      JSON.stringify(result.killChain),
      JSON.stringify(result.counterIntelIndicators),
    ]
  );
  return rows[0].id;
}
