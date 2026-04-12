import { pool } from "@szl-holdings/db";
import crypto from "crypto";

export async function ensureCompoundIntelligenceTables(): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS alloy_ontology_entities (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      entity_id VARCHAR(128) NOT NULL,
      entity_type VARCHAR(64) NOT NULL,
      domain VARCHAR(32) NOT NULL,
      name VARCHAR(512) NOT NULL,
      properties JSONB NOT NULL DEFAULT '{}',
      embedding_vector TEXT,
      confidence REAL NOT NULL DEFAULT 0.5,
      source_system VARCHAR(64),
      first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      UNIQUE(org_id, entity_id)
    )`,
    `CREATE TABLE IF NOT EXISTS alloy_ontology_links (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      source_entity_id VARCHAR(128) NOT NULL,
      target_entity_id VARCHAR(128) NOT NULL,
      link_type VARCHAR(64) NOT NULL,
      strength REAL NOT NULL DEFAULT 0.5,
      evidence JSONB NOT NULL DEFAULT '[]',
      discovered_by VARCHAR(64) NOT NULL DEFAULT 'system',
      is_inferred BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(org_id, source_entity_id, target_entity_id, link_type)
    )`,
    `CREATE TABLE IF NOT EXISTS alloy_behavioral_genomes (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      entity_id VARCHAR(128) NOT NULL,
      domain VARCHAR(32) NOT NULL,
      genome_type VARCHAR(32) NOT NULL,
      behavioral_dna JSONB NOT NULL DEFAULT '{}',
      risk_profile JSONB NOT NULL DEFAULT '{}',
      anomaly_score REAL NOT NULL DEFAULT 0,
      pattern_signatures JSONB NOT NULL DEFAULT '[]',
      temporal_patterns JSONB NOT NULL DEFAULT '{}',
      last_behavior_at TIMESTAMPTZ,
      version INT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(org_id, entity_id, genome_type)
    )`,
    `CREATE TABLE IF NOT EXISTS alloy_decision_mesh_nodes (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      node_id VARCHAR(128) NOT NULL,
      node_type VARCHAR(32) NOT NULL,
      domain VARCHAR(32) NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'active',
      capabilities JSONB NOT NULL DEFAULT '[]',
      current_load REAL NOT NULL DEFAULT 0,
      reliability_score REAL NOT NULL DEFAULT 1.0,
      last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      mesh_connections JSONB NOT NULL DEFAULT '[]',
      decisions_made INT NOT NULL DEFAULT 0,
      avg_latency_ms REAL NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(org_id, node_id)
    )`,
    `CREATE TABLE IF NOT EXISTS alloy_cascade_predictions (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      cascade_id VARCHAR(128) NOT NULL,
      trigger_domain VARCHAR(32) NOT NULL,
      trigger_signal JSONB NOT NULL,
      predicted_cascades JSONB NOT NULL DEFAULT '[]',
      affected_domains TEXT[] NOT NULL DEFAULT '{}',
      risk_amplification REAL NOT NULL DEFAULT 1.0,
      time_to_impact_hours REAL,
      confidence REAL NOT NULL DEFAULT 0.5,
      mitigation_actions JSONB NOT NULL DEFAULT '[]',
      status VARCHAR(16) NOT NULL DEFAULT 'active',
      resolved_at TIMESTAMPTZ,
      actual_outcome JSONB,
      was_accurate BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(org_id, cascade_id)
    )`,
    `CREATE TABLE IF NOT EXISTS alloy_anticipatory_signals (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      signal_id VARCHAR(128) NOT NULL,
      entity_id VARCHAR(128),
      domain VARCHAR(32) NOT NULL,
      signal_type VARCHAR(64) NOT NULL,
      prediction TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.5,
      evidence_chain JSONB NOT NULL DEFAULT '[]',
      recommended_actions JSONB NOT NULL DEFAULT '[]',
      time_horizon VARCHAR(16) NOT NULL DEFAULT '24h',
      was_acted_on BOOLEAN NOT NULL DEFAULT FALSE,
      was_accurate BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      UNIQUE(org_id, signal_id)
    )`,
    `CREATE TABLE IF NOT EXISTS alloy_cross_domain_correlations (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      correlation_id VARCHAR(128) NOT NULL,
      domains TEXT[] NOT NULL,
      entities JSONB NOT NULL DEFAULT '[]',
      correlation_type VARCHAR(64) NOT NULL,
      strength REAL NOT NULL DEFAULT 0,
      causal_chain JSONB NOT NULL DEFAULT '[]',
      insight TEXT NOT NULL,
      actionable BOOLEAN NOT NULL DEFAULT FALSE,
      priority VARCHAR(16) NOT NULL DEFAULT 'medium',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(org_id, correlation_id)
    )`,
    `CREATE TABLE IF NOT EXISTS alloy_competitive_moat (
      id SERIAL PRIMARY KEY,
      org_id INT NOT NULL DEFAULT 1,
      capability VARCHAR(128) NOT NULL,
      category VARCHAR(64) NOT NULL,
      alloy_implementation TEXT NOT NULL,
      palantir_equivalent TEXT,
      anduril_equivalent TEXT,
      windward_equivalent TEXT,
      datadog_equivalent TEXT,
      litify_equivalent TEXT,
      reonomy_equivalent TEXT,
      our_advantage TEXT NOT NULL,
      moat_score REAL NOT NULL DEFAULT 0,
      is_unique BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(org_id, capability)
    )`,
  ];

  for (const sql of statements) {
    await pool.query(sql);
  }
}

const ENTITY_TYPES: Record<string, string[]> = {
  maritime: ["vessel", "port", "route", "cargo", "flag_state", "owner", "charterer", "insurer"],
  legal: ["case", "party", "attorney", "judge", "insurer", "court", "statute", "precedent"],
  defense: ["threat_actor", "campaign", "vulnerability", "asset", "indicator", "technique", "tool"],
  real_estate: ["property", "owner", "lien", "tax_assessment", "violation", "transaction", "market"],
  consulting: ["client", "engagement", "deliverable", "advisor", "household", "vendor", "property"],
  observability: ["service", "metric", "alert", "incident", "deployment", "slo", "workflow"],
};

const LINK_TYPES = [
  "owns", "operates", "insures", "litigates", "threatens", "correlates_with",
  "depends_on", "leases", "finances", "monitors", "investigates", "advises",
  "supplies", "regulates", "violates", "competes_with", "partners_with",
  "cascades_to", "mitigates", "amplifies", "precedes", "follows",
];

export async function upsertOntologyEntity(params: {
  orgId: number;
  entityId?: string;
  entityType: string;
  domain: string;
  name: string;
  properties?: Record<string, unknown>;
  confidence?: number;
  sourceSystem?: string;
}) {
  const entityId = params.entityId || `${params.domain}_${params.entityType}_${crypto.randomBytes(8).toString("hex")}`;

  const { rows } = await pool.query(
    `INSERT INTO alloy_ontology_entities (org_id, entity_id, entity_type, domain, name, properties, confidence, source_system)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (org_id, entity_id) DO UPDATE SET
       properties = alloy_ontology_entities.properties || $6,
       confidence = GREATEST(alloy_ontology_entities.confidence, $7),
       last_seen = NOW(),
       is_active = TRUE
     RETURNING *`,
    [params.orgId, entityId, params.entityType, params.domain, params.name,
     JSON.stringify(params.properties || {}), params.confidence || 0.5, params.sourceSystem || "alloy"]
  );
  return rows[0];
}

export async function createOntologyLink(params: {
  orgId: number;
  sourceEntityId: string;
  targetEntityId: string;
  linkType: string;
  strength?: number;
  evidence?: unknown[];
  isInferred?: boolean;
}) {
  const { rows } = await pool.query(
    `INSERT INTO alloy_ontology_links (org_id, source_entity_id, target_entity_id, link_type, strength, evidence, is_inferred)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (org_id, source_entity_id, target_entity_id, link_type) DO UPDATE SET
       strength = GREATEST(alloy_ontology_links.strength, $5),
       evidence = alloy_ontology_links.evidence || $6
     RETURNING *`,
    [params.orgId, params.sourceEntityId, params.targetEntityId, params.linkType,
     params.strength || 0.5, JSON.stringify(params.evidence || []), params.isInferred ?? false]
  );
  return rows[0];
}

export async function traverseOntologyGraph(params: {
  orgId: number;
  entityId: string;
  depth?: number;
  linkTypes?: string[];
  domains?: string[];
}) {
  const depth = Math.min(params.depth || 2, 4);
  const visited = new Set<string>();
  const nodes: Array<Record<string, unknown>> = [];
  const edges: Array<Record<string, unknown>> = [];

  async function traverse(currentId: string, currentDepth: number) {
    if (currentDepth > depth || visited.has(currentId)) return;
    visited.add(currentId);

    const { rows: entityRows } = await pool.query(
      `SELECT * FROM alloy_ontology_entities WHERE org_id = $1 AND entity_id = $2`,
      [params.orgId, currentId]
    );
    if (entityRows.length) nodes.push(entityRows[0]);

    let linkQuery = `SELECT * FROM alloy_ontology_links
      WHERE org_id = $1 AND (source_entity_id = $2 OR target_entity_id = $2)`;
    const linkParams: unknown[] = [params.orgId, currentId];

    if (params.linkTypes?.length) {
      linkParams.push(params.linkTypes);
      linkQuery += ` AND link_type = ANY($${linkParams.length})`;
    }
    linkQuery += " ORDER BY strength DESC LIMIT 20";

    const { rows: linkRows } = await pool.query(linkQuery, linkParams);
    for (const link of linkRows) {
      edges.push(link);
      const nextId = link.source_entity_id === currentId ? link.target_entity_id : link.source_entity_id;

      if (params.domains?.length) {
        const { rows: check } = await pool.query(
          `SELECT domain FROM alloy_ontology_entities WHERE org_id = $1 AND entity_id = $2`,
          [params.orgId, nextId]
        );
        if (check.length && !params.domains.includes(check[0].domain)) continue;
      }
      await traverse(nextId, currentDepth + 1);
    }
  }

  await traverse(params.entityId, 0);

  const domainBreakdown: Record<string, number> = {};
  for (const node of nodes) {
    const d = (node as { domain?: string }).domain || "unknown";
    domainBreakdown[d] = (domainBreakdown[d] || 0) + 1;
  }

  return {
    entityId: params.entityId,
    nodes,
    edges,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    domainsReached: Object.keys(domainBreakdown),
    domainBreakdown,
    maxDepthReached: depth,
    crossDomainLinks: edges.filter(e => {
      const src = nodes.find(n => (n as { entity_id: string }).entity_id === (e as { source_entity_id: string }).source_entity_id);
      const tgt = nodes.find(n => (n as { entity_id: string }).entity_id === (e as { target_entity_id: string }).target_entity_id);
      return src && tgt && (src as { domain: string }).domain !== (tgt as { domain: string }).domain;
    }).length,
  };
}

export async function buildBehavioralGenome(params: {
  orgId: number;
  entityId: string;
  domain: string;
  genomeType: string;
  behaviors: Array<{ action: string; timestamp: string; context: Record<string, unknown>; outcome?: string }>;
}) {
  const temporalBuckets: Record<string, number> = {};
  const actionFrequency: Record<string, number> = {};
  const outcomeDistribution: Record<string, number> = {};

  for (const b of params.behaviors) {
    const hour = new Date(b.timestamp).getHours();
    const bucket = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    temporalBuckets[bucket] = (temporalBuckets[bucket] || 0) + 1;
    actionFrequency[b.action] = (actionFrequency[b.action] || 0) + 1;
    if (b.outcome) outcomeDistribution[b.outcome] = (outcomeDistribution[b.outcome] || 0) + 1;
  }

  const totalActions = params.behaviors.length || 1;
  const dominantAction = Object.entries(actionFrequency).sort((a, b) => b[1] - a[1])[0];
  const entropy = -Object.values(actionFrequency).reduce((sum, freq) => {
    const p = freq / totalActions;
    return sum + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);

  const patternSignatures = detectPatternSignatures(params.behaviors, params.domain);

  const riskFactors: Record<string, number> = {};
  if (params.domain === "maritime") {
    riskFactors.ais_gap_frequency = patternSignatures.filter(p => p.type === "ais_gap").length / totalActions;
    riskFactors.dark_activity = patternSignatures.filter(p => p.type === "dark_period").length > 0 ? 0.8 : 0;
    riskFactors.route_deviation = patternSignatures.filter(p => p.type === "route_deviation").length / totalActions;
    riskFactors.sanctioned_port_visits = patternSignatures.filter(p => p.type === "sanctioned_visit").length;
  } else if (params.domain === "defense") {
    riskFactors.lateral_movement = patternSignatures.filter(p => p.type === "lateral_move").length / totalActions;
    riskFactors.privilege_escalation = patternSignatures.filter(p => p.type === "priv_esc").length > 0 ? 0.9 : 0;
    riskFactors.data_exfiltration = patternSignatures.filter(p => p.type === "exfil").length > 0 ? 0.95 : 0;
    riskFactors.persistence_mechanism = patternSignatures.filter(p => p.type === "persistence").length > 0 ? 0.7 : 0;
  } else if (params.domain === "legal") {
    riskFactors.missed_deadlines = patternSignatures.filter(p => p.type === "missed_deadline").length;
    riskFactors.settlement_pattern = patternSignatures.filter(p => p.type === "settlement_signal").length / totalActions;
    riskFactors.adversary_aggression = patternSignatures.filter(p => p.type === "aggressive_filing").length / totalActions;
  } else if (params.domain === "real_estate") {
    riskFactors.distress_signals = patternSignatures.filter(p => p.type === "distress").length / totalActions;
    riskFactors.market_correlation = patternSignatures.filter(p => p.type === "market_move").length / totalActions;
    riskFactors.ownership_complexity = patternSignatures.filter(p => p.type === "ownership_change").length;
  }

  const anomalyScore = calculateAnomalyScore(entropy, riskFactors, params.domain);

  const behavioralDna = {
    actionProfile: actionFrequency,
    temporalProfile: temporalBuckets,
    outcomeProfile: outcomeDistribution,
    entropy,
    dominantAction: dominantAction?.[0] || "none",
    dominantActionRatio: dominantAction ? dominantAction[1] / totalActions : 0,
    totalObservations: totalActions,
    uniqueActions: Object.keys(actionFrequency).length,
    behavioralFingerprint: crypto.createHash("sha256").update(JSON.stringify(actionFrequency)).digest("hex").slice(0, 16),
  };

  const { rows } = await pool.query(
    `INSERT INTO alloy_behavioral_genomes (org_id, entity_id, domain, genome_type, behavioral_dna, risk_profile, anomaly_score, pattern_signatures, temporal_patterns, last_behavior_at, version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
     ON CONFLICT (org_id, entity_id, genome_type) DO UPDATE SET
       behavioral_dna = $5, risk_profile = $6, anomaly_score = $7,
       pattern_signatures = $8, temporal_patterns = $9,
       last_behavior_at = $10, version = alloy_behavioral_genomes.version + 1,
       updated_at = NOW()
     RETURNING *`,
    [params.orgId, params.entityId, params.domain, params.genomeType,
     JSON.stringify(behavioralDna), JSON.stringify({ riskFactors, overallRisk: anomalyScore }),
     anomalyScore, JSON.stringify(patternSignatures), JSON.stringify(temporalBuckets),
     params.behaviors.length ? params.behaviors[params.behaviors.length - 1].timestamp : new Date().toISOString()]
  );

  return rows[0];
}

function detectPatternSignatures(behaviors: Array<{ action: string; timestamp: string; context: Record<string, unknown>; outcome?: string }>, domain: string) {
  const signatures: Array<{ type: string; confidence: number; evidence: string; timestamp: string }> = [];

  if (domain === "maritime") {
    for (const b of behaviors) {
      if (b.action === "ais_off" || b.context.aisStatus === "dark") {
        signatures.push({ type: "ais_gap", confidence: 0.8, evidence: `AIS gap detected at ${b.timestamp}`, timestamp: b.timestamp });
      }
      if (b.context.inSanctionedWaters || b.context.sanctionedPort) {
        signatures.push({ type: "sanctioned_visit", confidence: 0.9, evidence: `Sanctioned zone contact`, timestamp: b.timestamp });
      }
      if (b.action === "course_change" && (b.context.deviationDegrees as number || 0) > 30) {
        signatures.push({ type: "route_deviation", confidence: 0.7, evidence: `${b.context.deviationDegrees}° course change`, timestamp: b.timestamp });
      }
    }
  } else if (domain === "defense") {
    for (const b of behaviors) {
      if (b.action === "lateral_movement" || b.context.attackStage === "lateral") {
        signatures.push({ type: "lateral_move", confidence: 0.85, evidence: b.action, timestamp: b.timestamp });
      }
      if (b.action === "privilege_escalation" || b.context.privilegeChange) {
        signatures.push({ type: "priv_esc", confidence: 0.9, evidence: b.action, timestamp: b.timestamp });
      }
    }
  } else if (domain === "legal") {
    for (const b of behaviors) {
      if (b.context.deadlineMissed) {
        signatures.push({ type: "missed_deadline", confidence: 1.0, evidence: `Deadline missed: ${b.context.deadlineType}`, timestamp: b.timestamp });
      }
      if (b.action === "settlement_offer" || b.context.settlementSignal) {
        signatures.push({ type: "settlement_signal", confidence: 0.75, evidence: b.action, timestamp: b.timestamp });
      }
    }
  } else if (domain === "real_estate") {
    for (const b of behaviors) {
      if (b.context.distressLevel && (b.context.distressLevel as number) > 0.6) {
        signatures.push({ type: "distress", confidence: b.context.distressLevel as number, evidence: `Distress: ${b.context.distressType}`, timestamp: b.timestamp });
      }
      if (b.action === "ownership_transfer") {
        signatures.push({ type: "ownership_change", confidence: 0.95, evidence: "Ownership changed", timestamp: b.timestamp });
      }
    }
  }

  return signatures;
}

function calculateAnomalyScore(entropy: number, riskFactors: Record<string, number>, _domain: string): number {
  const riskValues = Object.values(riskFactors);
  if (riskValues.length === 0) return Math.min(entropy / 5, 1);

  const avgRisk = riskValues.reduce((a, b) => a + b, 0) / riskValues.length;
  const maxRisk = Math.max(...riskValues);
  const entropyFactor = Math.min(entropy / 4, 1);

  return Math.min((avgRisk * 0.4 + maxRisk * 0.4 + entropyFactor * 0.2), 1);
}

export async function predictCascadeEffects(params: {
  orgId: number;
  triggerDomain: string;
  triggerSignal: Record<string, unknown>;
  severity?: string;
}) {
  const cascadeId = `cascade_${crypto.randomBytes(8).toString("hex")}`;

  const cascadeRules: Record<string, Array<{ targetDomain: string; condition: string; amplification: number; timeToImpact: number }>> = {
    maritime: [
      { targetDomain: "defense", condition: "Vessel in sanctioned waters triggers threat assessment", amplification: 1.5, timeToImpact: 2 },
      { targetDomain: "legal", condition: "Sanctions violation creates compliance liability", amplification: 2.0, timeToImpact: 24 },
      { targetDomain: "consulting", condition: "Fleet disruption impacts UHNW client travel", amplification: 1.2, timeToImpact: 48 },
      { targetDomain: "real_estate", condition: "Port disruption affects waterfront property values", amplification: 1.1, timeToImpact: 168 },
      { targetDomain: "observability", condition: "Maritime system failure triggers platform alert", amplification: 1.3, timeToImpact: 0.5 },
    ],
    defense: [
      { targetDomain: "maritime", condition: "Cyber attack on port systems disrupts vessel operations", amplification: 1.8, timeToImpact: 1 },
      { targetDomain: "legal", condition: "Data breach creates regulatory notification obligations", amplification: 2.5, timeToImpact: 4 },
      { targetDomain: "real_estate", condition: "Infrastructure threat impacts property security ratings", amplification: 1.3, timeToImpact: 72 },
      { targetDomain: "observability", condition: "Security incident degrades platform reliability metrics", amplification: 1.4, timeToImpact: 0.25 },
      { targetDomain: "consulting", condition: "Threat escalation triggers high-net-worth client alert", amplification: 1.6, timeToImpact: 1 },
    ],
    legal: [
      { targetDomain: "real_estate", condition: "Litigation outcome affects property title clarity", amplification: 1.4, timeToImpact: 720 },
      { targetDomain: "consulting", condition: "Legal matter impacts client advisory timeline", amplification: 1.2, timeToImpact: 48 },
      { targetDomain: "observability", condition: "Compliance deadline approaching triggers workflow escalation", amplification: 1.1, timeToImpact: 24 },
      { targetDomain: "defense", condition: "Court-ordered disclosure creates information security risk", amplification: 1.3, timeToImpact: 168 },
    ],
    real_estate: [
      { targetDomain: "legal", condition: "Property distress creates foreclosure/lien litigation", amplification: 1.6, timeToImpact: 168 },
      { targetDomain: "consulting", condition: "Market shift impacts UHNW client portfolio advisory", amplification: 1.3, timeToImpact: 24 },
      { targetDomain: "observability", condition: "Property valuation change triggers portfolio rebalance workflow", amplification: 1.1, timeToImpact: 4 },
      { targetDomain: "maritime", condition: "Waterfront development affects port operations zone", amplification: 1.0, timeToImpact: 720 },
    ],
    consulting: [
      { targetDomain: "real_estate", condition: "Client relocation triggers property search workflow", amplification: 1.2, timeToImpact: 24 },
      { targetDomain: "legal", condition: "Client matter creates legal intake workflow", amplification: 1.3, timeToImpact: 8 },
      { targetDomain: "observability", condition: "Service SLA breach triggers escalation", amplification: 1.1, timeToImpact: 1 },
    ],
    observability: [
      { targetDomain: "defense", condition: "Platform anomaly could indicate cyber intrusion", amplification: 1.7, timeToImpact: 0.5 },
      { targetDomain: "maritime", condition: "Data pipeline failure affects vessel tracking reliability", amplification: 1.5, timeToImpact: 1 },
      { targetDomain: "legal", condition: "System downtime may breach SLA compliance obligations", amplification: 1.4, timeToImpact: 4 },
      { targetDomain: "consulting", condition: "Service degradation impacts client-facing deliverables", amplification: 1.2, timeToImpact: 2 },
    ],
  };

  const rules = cascadeRules[params.triggerDomain] || [];
  const severityMultiplier = params.severity === "critical" ? 2.0 : params.severity === "high" ? 1.5 : params.severity === "medium" ? 1.0 : 0.5;

  const predictedCascades = rules.map(rule => ({
    targetDomain: rule.targetDomain,
    condition: rule.condition,
    probability: Math.min(0.3 + severityMultiplier * 0.2 + (rule.amplification - 1) * 0.3, 0.98),
    amplifiedRisk: rule.amplification * severityMultiplier,
    estimatedTimeToImpactHours: rule.timeToImpact,
    mitigationAvailable: true,
    suggestedMitigation: generateMitigation(params.triggerDomain, rule.targetDomain, params.triggerSignal),
  }));

  const affectedDomains = [...new Set(predictedCascades.map(c => c.targetDomain))];
  const maxAmplification = Math.max(...predictedCascades.map(c => c.amplifiedRisk), 1);
  const minTimeToImpact = Math.min(...predictedCascades.map(c => c.estimatedTimeToImpactHours));

  const mitigationActions = predictedCascades
    .filter(c => c.probability > 0.4)
    .map(c => ({
      domain: c.targetDomain,
      action: c.suggestedMitigation,
      urgency: c.estimatedTimeToImpactHours < 4 ? "immediate" : c.estimatedTimeToImpactHours < 24 ? "urgent" : "scheduled",
      priority: c.amplifiedRisk > 2 ? "critical" : c.amplifiedRisk > 1.5 ? "high" : "medium",
    }));

  const { rows } = await pool.query(
    `INSERT INTO alloy_cascade_predictions (org_id, cascade_id, trigger_domain, trigger_signal, predicted_cascades, affected_domains, risk_amplification, time_to_impact_hours, confidence, mitigation_actions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [params.orgId, cascadeId, params.triggerDomain, JSON.stringify(params.triggerSignal),
     JSON.stringify(predictedCascades), affectedDomains, maxAmplification, minTimeToImpact,
     Math.min(0.4 + severityMultiplier * 0.15, 0.95), JSON.stringify(mitigationActions)]
  );

  return {
    cascade: rows[0],
    summary: {
      totalAffectedDomains: affectedDomains.length,
      highestRiskDomain: predictedCascades.sort((a, b) => b.amplifiedRisk - a.amplifiedRisk)[0]?.targetDomain,
      fastestImpact: `${minTimeToImpact}h`,
      immediateActions: mitigationActions.filter(m => m.urgency === "immediate").length,
    },
  };
}

function generateMitigation(sourceDomain: string, targetDomain: string, _signal: Record<string, unknown>): string {
  const mitigations: Record<string, Record<string, string>> = {
    maritime: {
      defense: "Initiate enhanced monitoring on vessel communications and port infrastructure",
      legal: "Pre-stage sanctions compliance documentation and notify counsel",
      consulting: "Alert lifestyle management team for alternative travel arrangements",
      real_estate: "Flag waterfront properties for potential value impact assessment",
      observability: "Increase data pipeline monitoring frequency for maritime feeds",
    },
    defense: {
      maritime: "Enable backup vessel tracking systems and verify AIS integrity",
      legal: "Prepare breach notification templates and regulatory filing timeline",
      real_estate: "Update security assessment scores for affected property portfolio",
      observability: "Activate incident response playbook and escalation chain",
      consulting: "Initiate client communication protocol for security advisory",
    },
    legal: {
      real_estate: "Run title search update and flag properties in litigation pipeline",
      consulting: "Update client advisory timeline and resource allocation",
      observability: "Configure compliance deadline monitoring workflow",
      defense: "Review information security protocols for court-ordered disclosures",
    },
    real_estate: {
      legal: "Review foreclosure and lien status, prepare litigation intake",
      consulting: "Prepare portfolio rebalance advisory for affected clients",
      observability: "Trigger automated valuation model update pipeline",
      maritime: "Assess port-adjacent development impact on vessel operations",
    },
    consulting: {
      real_estate: "Initiate property search and acquisition pipeline",
      legal: "Create legal intake matter and assign counsel",
      observability: "Adjust SLA monitoring thresholds for affected services",
    },
    observability: {
      defense: "Escalate anomaly to security team for threat correlation",
      maritime: "Switch to redundant data sources for vessel tracking",
      legal: "Document SLA breach timeline for compliance record",
      consulting: "Notify affected service coordinators and prepare client communication",
    },
  };

  return mitigations[sourceDomain]?.[targetDomain] || `Monitor ${targetDomain} domain for downstream impact from ${sourceDomain} event`;
}

export async function generateAnticipatorySignal(params: {
  orgId: number;
  entityId?: string;
  domain: string;
  signalType: string;
  context: Record<string, unknown>;
}) {
  const signalId = `antic_${crypto.randomBytes(8).toString("hex")}`;

  const anticipatoryRules: Record<string, Array<{ signalType: string; condition: (ctx: Record<string, unknown>) => boolean; prediction: string; confidence: number; horizon: string; actions: string[] }>> = {
    maritime: [
      {
        signalType: "vessel_risk_escalation",
        condition: (ctx) => (ctx.aisGapHours as number || 0) > 4,
        prediction: "Vessel likely engaged in unreported activity — sanctions risk will escalate within 48h",
        confidence: 0.78,
        horizon: "48h",
        actions: ["Flag vessel for enhanced monitoring", "Pre-stage compliance documentation", "Alert legal counsel on potential sanctions exposure"],
      },
      {
        signalType: "port_congestion",
        condition: (ctx) => (ctx.queueLength as number || 0) > 20,
        prediction: "Port congestion will delay 30%+ of scheduled arrivals — recommend rerouting priority cargo",
        confidence: 0.82,
        horizon: "24h",
        actions: ["Identify alternative berth assignments", "Calculate demurrage exposure", "Notify charterers of probable delays"],
      },
      {
        signalType: "weather_disruption",
        condition: (ctx) => (ctx.windSpeed as number || 0) > 50,
        prediction: "Severe weather will impact vessel operations in transit zone within 12h",
        confidence: 0.85,
        horizon: "12h",
        actions: ["Issue fleet-wide weather advisory", "Calculate safe harbor options", "Adjust ETA projections for all affected vessels"],
      },
    ],
    defense: [
      {
        signalType: "apt_campaign_emerging",
        condition: (ctx) => (ctx.indicatorCount as number || 0) > 5,
        prediction: "APT campaign indicators suggest targeted attack within 72h — recommend proactive hunt",
        confidence: 0.72,
        horizon: "72h",
        actions: ["Deploy honeypot sensors on priority assets", "Rotate privileged credentials", "Brief SOC team on threat actor TTPs"],
      },
      {
        signalType: "zero_day_exposure",
        condition: (ctx) => ctx.cvssScore && (ctx.cvssScore as number) > 9.0,
        prediction: "Critical vulnerability in deployed software — exploitation likely before vendor patch",
        confidence: 0.88,
        horizon: "24h",
        actions: ["Apply virtual patch via WAF rules", "Isolate vulnerable systems", "Initiate emergency change advisory board"],
      },
    ],
    legal: [
      {
        signalType: "settlement_window",
        condition: (ctx) => ctx.discoveryPhase === "complete" && (ctx.trialDateDays as number || 999) < 90,
        prediction: "Opposing party likely to initiate settlement discussions within 14d — prepare demand package",
        confidence: 0.74,
        horizon: "14d",
        actions: ["Prepare settlement demand package", "Calculate updated damages assessment", "Schedule client authorization meeting"],
      },
      {
        signalType: "adverse_ruling_risk",
        condition: (ctx) => (ctx.motionsPending as number || 0) > 2 && ctx.judgeHistory === "defense_leaning",
        prediction: "Summary judgment motion likely to be granted against us — prepare appellate strategy",
        confidence: 0.65,
        horizon: "30d",
        actions: ["Draft appellate brief outline", "Identify grounds for appeal", "Calculate client exposure at summary judgment"],
      },
    ],
    real_estate: [
      {
        signalType: "distress_opportunity",
        condition: (ctx) => (ctx.taxLienCount as number || 0) > 2 && (ctx.vacancyRate as number || 0) > 0.3,
        prediction: "Property showing pre-foreclosure patterns — acquisition window opening within 60d",
        confidence: 0.71,
        horizon: "60d",
        actions: ["Run comparable sales analysis", "Prepare LOI template", "Schedule physical inspection", "Check title for liens"],
      },
      {
        signalType: "market_shift",
        condition: (ctx) => Math.abs(ctx.priceChangePercent as number || 0) > 5,
        prediction: "Market correction underway — portfolio rebalancing recommended within 30d",
        confidence: 0.76,
        horizon: "30d",
        actions: ["Run stress test on portfolio", "Identify assets to de-risk", "Prepare market intelligence brief for investors"],
      },
    ],
    consulting: [
      {
        signalType: "client_needs_shift",
        condition: (ctx) => (ctx.recentInquiries as number || 0) > 3,
        prediction: "Client lifestyle needs shifting — proactive advisory outreach recommended",
        confidence: 0.68,
        horizon: "7d",
        actions: ["Schedule wellness check call", "Prepare personalized recommendations", "Review upcoming calendar for optimization"],
      },
    ],
  };

  const rules = anticipatoryRules[params.domain] || [];
  const matchedRules = rules.filter(r => r.signalType === params.signalType || r.condition(params.context));

  if (matchedRules.length === 0) {
    return { signal: null, message: "No anticipatory patterns matched for given context" };
  }

  const bestMatch = matchedRules[0];

  const { rows } = await pool.query(
    `INSERT INTO alloy_anticipatory_signals (org_id, signal_id, entity_id, domain, signal_type, prediction, confidence, evidence_chain, recommended_actions, time_horizon, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [params.orgId, signalId, params.entityId || null, params.domain, bestMatch.signalType,
     bestMatch.prediction, bestMatch.confidence,
     JSON.stringify([{ source: params.domain, context: params.context, matchedRule: bestMatch.signalType }]),
     JSON.stringify(bestMatch.actions.map(a => ({ action: a, status: "pending" }))),
     bestMatch.horizon,
     new Date(Date.now() + parseHorizon(bestMatch.horizon))]
  );

  return { signal: rows[0] };
}

function parseHorizon(horizon: string): number {
  const match = horizon.match(/^(\d+)(h|d)$/);
  if (!match) return 24 * 60 * 60 * 1000;
  const [, num, unit] = match;
  return parseInt(num) * (unit === "d" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000);
}

export async function detectCrossDomainCorrelations(params: {
  orgId: number;
  domains?: string[];
  timeWindowHours?: number;
}) {
  const correlationId = `corr_${crypto.randomBytes(8).toString("hex")}`;
  const timeWindow = params.timeWindowHours || 72;
  const cutoff = new Date(Date.now() - timeWindow * 60 * 60 * 1000);

  const { rows: recentEntities } = await pool.query(
    `SELECT entity_id, entity_type, domain, name, properties, confidence
     FROM alloy_ontology_entities
     WHERE org_id = $1 AND last_seen > $2 AND is_active = TRUE
     ORDER BY last_seen DESC LIMIT 200`,
    [params.orgId, cutoff]
  );

  const { rows: recentGenomes } = await pool.query(
    `SELECT entity_id, domain, anomaly_score, risk_profile, pattern_signatures
     FROM alloy_behavioral_genomes
     WHERE org_id = $1 AND updated_at > $2
     ORDER BY anomaly_score DESC LIMIT 100`,
    [params.orgId, cutoff]
  );

  const { rows: recentCascades } = await pool.query(
    `SELECT trigger_domain, affected_domains, risk_amplification, predicted_cascades
     FROM alloy_cascade_predictions
     WHERE org_id = $1 AND created_at > $2 AND status = 'active'
     ORDER BY risk_amplification DESC LIMIT 50`,
    [params.orgId, cutoff]
  );

  const correlations: Array<{
    type: string; domains: string[]; entities: unknown[];
    strength: number; insight: string; actionable: boolean; priority: string;
  }> = [];

  const domainEntityMap: Record<string, typeof recentEntities> = {};
  for (const entity of recentEntities) {
    const d = entity.domain;
    if (!domainEntityMap[d]) domainEntityMap[d] = [];
    domainEntityMap[d].push(entity);
  }

  const domainKeys = Object.keys(domainEntityMap);
  for (let i = 0; i < domainKeys.length; i++) {
    for (let j = i + 1; j < domainKeys.length; j++) {
      const d1 = domainKeys[i], d2 = domainKeys[j];
      if (params.domains?.length && !params.domains.includes(d1) && !params.domains.includes(d2)) continue;

      const sharedProperties = findSharedProperties(domainEntityMap[d1], domainEntityMap[d2]);
      if (sharedProperties.length > 0) {
        correlations.push({
          type: "shared_entity_property",
          domains: [d1, d2],
          entities: sharedProperties.slice(0, 5),
          strength: Math.min(sharedProperties.length * 0.15, 0.95),
          insight: `${sharedProperties.length} entities share properties across ${d1} and ${d2} domains — possible hidden relationship`,
          actionable: sharedProperties.length > 2,
          priority: sharedProperties.length > 5 ? "high" : "medium",
        });
      }
    }
  }

  const highRiskGenomes = recentGenomes.filter(g => g.anomaly_score > 0.6);
  if (highRiskGenomes.length > 1) {
    const riskDomains = [...new Set(highRiskGenomes.map(g => g.domain))];
    if (riskDomains.length > 1) {
      correlations.push({
        type: "multi_domain_risk_convergence",
        domains: riskDomains,
        entities: highRiskGenomes.map(g => ({ entityId: g.entity_id, domain: g.domain, anomalyScore: g.anomaly_score })),
        strength: Math.min(highRiskGenomes.reduce((s, g) => s + g.anomaly_score, 0) / highRiskGenomes.length, 0.98),
        insight: `High-risk behavioral patterns detected simultaneously across ${riskDomains.join(", ")} — possible coordinated activity`,
        actionable: true,
        priority: "critical",
      });
    }
  }

  if (recentCascades.length > 0) {
    const cascadeDomains = new Set<string>();
    for (const c of recentCascades) {
      cascadeDomains.add(c.trigger_domain);
      for (const d of c.affected_domains) cascadeDomains.add(d);
    }
    if (cascadeDomains.size > 2) {
      correlations.push({
        type: "cascade_convergence",
        domains: [...cascadeDomains],
        entities: recentCascades.map(c => ({ triggerDomain: c.trigger_domain, amplification: c.risk_amplification })),
        strength: Math.min(recentCascades.reduce((s, c) => s + c.risk_amplification, 0) / recentCascades.length / 3, 0.95),
        insight: `Multiple cascade predictions converging across ${cascadeDomains.size} domains — systemic risk pattern emerging`,
        actionable: true,
        priority: cascadeDomains.size > 3 ? "critical" : "high",
      });
    }
  }

  for (const c of correlations) {
    await pool.query(
      `INSERT INTO alloy_cross_domain_correlations (org_id, correlation_id, domains, entities, correlation_type, strength, causal_chain, insight, actionable, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (org_id, correlation_id) DO NOTHING`,
      [params.orgId, `${correlationId}_${correlations.indexOf(c)}`, c.domains,
       JSON.stringify(c.entities), c.type, c.strength,
       JSON.stringify([{ step: "detection", source: "compound_intelligence", domains: c.domains }]),
       c.insight, c.actionable, c.priority]
    );
  }

  return {
    correlationsFound: correlations.length,
    correlations: correlations.sort((a, b) => b.strength - a.strength),
    domainsAnalyzed: domainKeys.length,
    entitiesScanned: recentEntities.length,
    genomesAnalyzed: recentGenomes.length,
    activeCascades: recentCascades.length,
    timeWindowHours: timeWindow,
  };
}

function findSharedProperties(entities1: Array<Record<string, unknown>>, entities2: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const shared: Array<Record<string, unknown>> = [];
  for (const e1 of entities1) {
    const props1 = e1.properties as Record<string, unknown> || {};
    for (const e2 of entities2) {
      const props2 = e2.properties as Record<string, unknown> || {};
      const commonKeys = Object.keys(props1).filter(k => k in props2 && JSON.stringify(props1[k]) === JSON.stringify(props2[k]));
      if (commonKeys.length > 0) {
        shared.push({ entity1: e1.entity_id, entity2: e2.entity_id, sharedKeys: commonKeys, sharedValues: commonKeys.map(k => props1[k]) });
      }
    }
  }
  return shared;
}

export async function getCompetitiveMoatAnalysis(orgId: number) {
  const moatEntries = [
    {
      capability: "Cross-Domain Ontology Fusion",
      category: "Data Architecture",
      alloyImpl: "Real-time entity linking across 5 industries (maritime, legal, defense, real estate, advisory) with graph traversal, inferred relationships, and behavioral DNA",
      palantir: "Ontology with object types and link types — single deployment context",
      anduril: "Lattice Mesh for military domains only",
      windward: "Maritime-only entity model (vessels, ports, flags)",
      datadog: "Service/resource topology — infrastructure only",
      litify: "Legal matter and party entities — single practice area",
      reonomy: "Property and owner entities — real estate only",
      advantage: "No competitor links entities across maritime, legal, defense, real estate, AND advisory in one graph. We detect that a vessel owner is also a litigation party whose property has tax liens — in real time.",
      moatScore: 0.95,
      isUnique: true,
    },
    {
      capability: "Predictive Cascade Engine",
      category: "Risk Intelligence",
      alloyImpl: "Predicts how an event in one domain (e.g., vessel sanctions violation) cascades into legal liability, property value impact, client advisory needs, and platform health — with time-to-impact and mitigation actions",
      palantir: "Can build custom cascading logic per deployment",
      anduril: "Kill chain analysis for defense only",
      windward: "Maritime risk scoring — no cross-domain cascading",
      datadog: "Watchdog detects anomalies AFTER they happen",
      litify: "No predictive cascading",
      reonomy: "No predictive cascading",
      advantage: "We predict cascades BEFORE they happen across all domains. Datadog's Watchdog finds anomalies after the fact. Palantir requires custom logic per use case. We have it built into the platform DNA.",
      moatScore: 0.92,
      isUnique: true,
    },
    {
      capability: "Behavioral Genome Profiling",
      category: "Entity Intelligence",
      alloyImpl: "Builds behavioral DNA fingerprints for every entity — temporal patterns, action entropy, anomaly scoring, domain-specific risk factors, and pattern signatures. Tracks behavioral evolution over time.",
      palantir: "Object properties track state but not behavioral evolution",
      anduril: "Track correlation for physical assets, no behavioral modeling",
      windward: "Vessel behavioral AI — maritime entities only",
      datadog: "Service behavior baselining — infrastructure metrics only",
      litify: "No behavioral profiling",
      reonomy: "Property transaction history — not behavioral modeling",
      advantage: "Windward does behavioral AI for vessels. We do it for vessels, properties, threat actors, legal matters, clients, and services — all in one behavioral genome system with cross-domain anomaly correlation.",
      moatScore: 0.91,
      isUnique: true,
    },
    {
      capability: "Anticipatory Intelligence",
      category: "Predictive Analytics",
      alloyImpl: "Domain-specific prediction rules that anticipate what will happen NEXT — settlement windows, APT campaigns, distress opportunities, client needs shifts, weather disruptions — with evidence chains and recommended actions",
      palantir: "AIP can be configured for predictions per deployment",
      anduril: "Threat prediction for military scenarios",
      windward: "Predictive risk scoring for maritime",
      datadog: "Anomaly forecast for time-series metrics",
      litify: "No anticipatory capability",
      reonomy: "No anticipatory capability",
      advantage: "Each competitor predicts in one domain. We anticipate across ALL domains simultaneously, with cross-domain evidence fusion. A maritime anomaly automatically generates legal, defense, and advisory predictions.",
      moatScore: 0.93,
      isUnique: true,
    },
    {
      capability: "LLM-Based ML Without Infrastructure",
      category: "AI/ML Platform",
      alloyImpl: "Trains ML 'models' by evolving prompt strategies through genetic algorithms — no GPU, no training data pipeline, no model serving. 5 strategies including evolutionary optimization and chain-of-thought tuning.",
      palantir: "AIP uses LLMs but requires external model deployment for custom ML",
      anduril: "Custom ML models require dedicated infrastructure",
      windward: "Proprietary ML models with traditional training pipelines",
      datadog: "Toto foundation model — internal only, not available to customers",
      litify: "Uses Salesforce Einstein — no custom ML",
      reonomy: "ML for property matching — traditional pipeline",
      advantage: "Zero-infrastructure ML. No GPUs, no training pipelines, no model serving. We evolve prompt strategies that GET BETTER through genetic algorithms. The model IS the prompt architecture.",
      moatScore: 0.89,
      isUnique: true,
    },
    {
      capability: "Self-Evolving Platform Architecture",
      category: "Platform Intelligence",
      alloyImpl: "Real genetic algorithms with population breeding, crossover, mutation, and multi-objective fitness — the platform literally breeds better decision architectures across generations",
      palantir: "Static logic updated by engineers",
      anduril: "Autonomous systems but not self-evolving architecture",
      windward: "ML models retrained periodically by data science team",
      datadog: "ML models updated internally",
      litify: "No self-evolution",
      reonomy: "No self-evolution",
      advantage: "No competitor's platform evolves ITSELF. They all require human intervention to improve. Alloy breeds its own improvements through real genetic algorithms measured against operational fitness.",
      moatScore: 0.97,
      isUnique: true,
    },
    {
      capability: "Five-Industry Unified Command",
      category: "Market Position",
      alloyImpl: "Maritime intelligence + Cybersecurity/defense + Legal matter management + Real estate portfolio intelligence + UHNW concierge advisory — ONE platform, ONE database, ONE AI layer",
      palantir: "Government + commercial but each deployment is siloed",
      anduril: "Defense/military only",
      windward: "Maritime only",
      datadog: "Observability/infrastructure only",
      litify: "Legal only",
      reonomy: "Real estate only",
      advantage: "Every competitor owns ONE vertical. We operate across FIVE with shared intelligence. This is architecturally impossible to replicate without starting from scratch — our database has 552+ tables spanning all domains.",
      moatScore: 0.98,
      isUnique: true,
    },
    {
      capability: "Agent-to-Agent Protocol with Cross-Domain Delegation",
      category: "Agentic Infrastructure",
      alloyImpl: "7 domain-specific AI agents that delegate to each other via A2A protocol — a vessels agent can ask the legal agent about sanctions implications in real-time, the defense agent can task the maritime agent to verify vessel positions",
      palantir: "AIP Agent Studio — agents within single Ontology context",
      anduril: "Autonomous systems coordinate at tactical level",
      windward: "No multi-agent architecture",
      datadog: "Bits AI SRE Agent — single-purpose",
      litify: "10+ AI agents — all within legal domain",
      reonomy: "No agent architecture",
      advantage: "Litify has 10 legal agents. Palantir has configurable agents. We have 7 domain agents that DELEGATE ACROSS INDUSTRIES — a defense agent asks a maritime agent about a vessel, which asks a legal agent about sanctions. True cross-domain compound intelligence.",
      moatScore: 0.94,
      isUnique: true,
    },
  ];

  for (const entry of moatEntries) {
    await pool.query(
      `INSERT INTO alloy_competitive_moat (org_id, capability, category, alloy_implementation, palantir_equivalent, anduril_equivalent, windward_equivalent, datadog_equivalent, litify_equivalent, reonomy_equivalent, our_advantage, moat_score, is_unique)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (org_id, capability) DO UPDATE SET
         alloy_implementation = $4, palantir_equivalent = $5, anduril_equivalent = $6,
         windward_equivalent = $7, datadog_equivalent = $8, litify_equivalent = $9,
         reonomy_equivalent = $10, our_advantage = $11, moat_score = $12, is_unique = $13
       RETURNING *`,
      [orgId, entry.capability, entry.category, entry.alloyImpl, entry.palantir,
       entry.anduril, entry.windward, entry.datadog, entry.litify, entry.reonomy,
       entry.advantage, entry.moatScore, entry.isUnique]
    );
  }

  const { rows } = await pool.query(
    `SELECT * FROM alloy_competitive_moat WHERE org_id = $1 ORDER BY moat_score DESC`,
    [orgId]
  );

  const avgMoatScore = rows.reduce((s, r) => s + parseFloat(r.moat_score), 0) / (rows.length || 1);
  const uniqueCapabilities = rows.filter(r => r.is_unique).length;

  return {
    capabilities: rows,
    summary: {
      totalCapabilities: rows.length,
      uniqueCapabilities,
      averageMoatScore: Math.round(avgMoatScore * 100) / 100,
      competitorsAnalyzed: ["Palantir", "Anduril", "Windward", "Datadog", "Litify", "Reonomy/Cherre"],
      verdict: uniqueCapabilities >= 5 ? "ONE-OF-ONE: No single competitor can replicate this platform" : "Strong competitive position with multiple unique advantages",
    },
  };
}
