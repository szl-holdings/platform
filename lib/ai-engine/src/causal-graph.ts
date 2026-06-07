/**
 * Cross-Domain Causal Graph Engine
 *
 * Maps known cause-effect relationships across the six primary domains:
 * maritime ↔ finance ↔ real estate ↔ security ↔ legal ↔ analytics
 *
 * When a signal changes in one domain, the engine propagates the impact through
 * the causal graph and surfaces cross-portfolio insights automatically.
 *
 * Built with ~30 core causal edges covering the most material signal pathways
 * across the SZL platform domains.
 */

export type Domain =
  | 'maritime'
  | 'financial'
  | 'real_estate'
  | 'security'
  | 'legal'
  | 'analytics'
  | 'infrastructure'
  | 'research'
  | 'creative'
  | 'client_relations'
  | 'readiness';

export type CausalStrength = 'strong' | 'moderate' | 'weak';
export type SignalDirection = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface CausalEdge {
  edgeId: string;
  fromDomain: Domain;
  toDomain: Domain;
  signal: string;
  effect: string;
  strength: CausalStrength;
  direction: SignalDirection;
  lag: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  conditions?: string;
}

export interface CausalSignal {
  signalId: string;
  domain: Domain;
  signalType: string;
  description: string;
  magnitude: number;
  direction: SignalDirection;
  timestamp: string;
}

export interface CausalImpact {
  targetDomain: Domain;
  effect: string;
  estimatedMagnitude: number;
  strength: CausalStrength;
  lag: CausalEdge['lag'];
  edge: CausalEdge;
}

export interface CausalPropagationResult {
  propagationId: string;
  triggeringSignal: CausalSignal;
  impacts: CausalImpact[];
  crossPortfolioInsights: string[];
  highPriorityAlerts: string[];
  affectedDomains: Domain[];
  timestamp: string;
}

export const CAUSAL_GRAPH: CausalEdge[] = [
  {
    edgeId: 'ce_001',
    fromDomain: 'maritime',
    toDomain: 'financial',
    signal: 'shipping_rate_spike',
    effect: 'Elevated freight costs compress logistics-exposed portfolio company margins; insurance premiums rise',
    strength: 'strong',
    direction: 'negative',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_002',
    fromDomain: 'maritime',
    toDomain: 'legal',
    signal: 'sanctions_exposure',
    effect: 'Vessel flag-state violations or sanctioned port calls trigger OFAC compliance obligations and potential criminal liability',
    strength: 'strong',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_003',
    fromDomain: 'maritime',
    toDomain: 'security',
    signal: 'piracy_alert',
    effect: 'Piracy incidents in key straits elevate fleet cyber-attack risk and physical security posture requirements',
    strength: 'moderate',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_004',
    fromDomain: 'maritime',
    toDomain: 'real_estate',
    signal: 'port_congestion',
    effect: 'Extended port dwell times delay construction material delivery, increasing real estate development costs and timelines',
    strength: 'moderate',
    direction: 'negative',
    lag: 'medium_term',
  },
  {
    edgeId: 'ce_005',
    fromDomain: 'financial',
    toDomain: 'real_estate',
    signal: 'interest_rate_rise',
    effect: 'Rising rates compress cap rates, reduce property valuations, and tighten refinancing options on leveraged assets',
    strength: 'strong',
    direction: 'negative',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_006',
    fromDomain: 'financial',
    toDomain: 'legal',
    signal: 'regulatory_capital_breach',
    effect: 'Capital adequacy violations trigger mandatory regulatory disclosure, supervisory action, and potential enforcement proceedings',
    strength: 'strong',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_007',
    fromDomain: 'financial',
    toDomain: 'analytics',
    signal: 'portfolio_anomaly',
    effect: 'Unexpected portfolio performance creates statistical anomalies that analytics must investigate for systemic risk',
    strength: 'moderate',
    direction: 'mixed',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_008',
    fromDomain: 'real_estate',
    toDomain: 'financial',
    signal: 'valuation_decline',
    effect: 'Asset writedowns reduce NAV, breach LTV covenants, and may trigger margin calls on real estate credit facilities',
    strength: 'strong',
    direction: 'negative',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_009',
    fromDomain: 'real_estate',
    toDomain: 'legal',
    signal: 'title_defect',
    effect: 'Title defects on acquired assets expose the portfolio to litigation, rescission risk, and insurance gaps',
    strength: 'strong',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_010',
    fromDomain: 'security',
    toDomain: 'financial',
    signal: 'data_breach',
    effect: 'Breach events drive regulatory fines, reputational damage, and investor confidence erosion affecting fund flows',
    strength: 'strong',
    direction: 'negative',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_011',
    fromDomain: 'security',
    toDomain: 'legal',
    signal: 'critical_vulnerability',
    effect: 'Unpatched critical CVEs create regulatory compliance exposure (GDPR, CCPA, NIS2) and potential lawsuit liability',
    strength: 'moderate',
    direction: 'negative',
    lag: 'short_term',
    conditions: 'If customer data is at risk',
  },
  {
    edgeId: 'ce_012',
    fromDomain: 'security',
    toDomain: 'infrastructure',
    signal: 'ransomware_incident',
    effect: 'Ransomware attacks force emergency infrastructure isolation, degrading platform availability and SLAs',
    strength: 'strong',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_013',
    fromDomain: 'legal',
    toDomain: 'financial',
    signal: 'litigation_settlement',
    effect: 'Material litigation settlements create unexpected cash outflows affecting portfolio liquidity and return metrics',
    strength: 'moderate',
    direction: 'negative',
    lag: 'medium_term',
  },
  {
    edgeId: 'ce_014',
    fromDomain: 'legal',
    toDomain: 'maritime',
    signal: 'new_regulation',
    effect: 'New IMO or flag-state regulations require fleet compliance upgrades, affecting route economics and scheduling',
    strength: 'moderate',
    direction: 'mixed',
    lag: 'medium_term',
  },
  {
    edgeId: 'ce_015',
    fromDomain: 'analytics',
    toDomain: 'financial',
    signal: 'kpi_anomaly',
    effect: 'Detected platform KPI anomalies signal underlying operational issues that risk affecting revenue projections',
    strength: 'moderate',
    direction: 'negative',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_016',
    fromDomain: 'analytics',
    toDomain: 'security',
    signal: 'traffic_anomaly',
    effect: 'Unusual traffic patterns detected by analytics often precede or indicate active security intrusion attempts',
    strength: 'moderate',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_017',
    fromDomain: 'financial',
    toDomain: 'maritime',
    signal: 'capital_constraint',
    effect: 'Reduced available capital limits fleet maintenance and vessel acquisition, increasing operational risk and age of fleet',
    strength: 'moderate',
    direction: 'negative',
    lag: 'medium_term',
  },
  {
    edgeId: 'ce_018',
    fromDomain: 'maritime',
    toDomain: 'analytics',
    signal: 'route_disruption',
    effect: 'Route disruptions create data gaps in AIS tracking, degrading analytics model accuracy and anomaly detection',
    strength: 'weak',
    direction: 'negative',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_019',
    fromDomain: 'infrastructure',
    toDomain: 'analytics',
    signal: 'system_degradation',
    effect: 'Infrastructure degradation corrupts telemetry pipelines, reducing analytics data quality and dashboard accuracy',
    strength: 'moderate',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_020',
    fromDomain: 'infrastructure',
    toDomain: 'security',
    signal: 'misconfiguration',
    effect: 'Cloud misconfiguration events create attack surface, increasing the probability of security incidents',
    strength: 'strong',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_021',
    fromDomain: 'real_estate',
    toDomain: 'analytics',
    signal: 'market_dislocation',
    effect: 'Significant market dislocations in real estate generate statistical outliers that require analytics validation',
    strength: 'weak',
    direction: 'mixed',
    lag: 'medium_term',
  },
  {
    edgeId: 'ce_022',
    fromDomain: 'legal',
    toDomain: 'real_estate',
    signal: 'zoning_change',
    effect: 'Zoning regulation changes alter permissible use, development rights, and thus valuation of held properties',
    strength: 'strong',
    direction: 'mixed',
    lag: 'medium_term',
  },
  {
    edgeId: 'ce_023',
    fromDomain: 'security',
    toDomain: 'client_relations',
    signal: 'breach_disclosure',
    effect: 'Public breach disclosure triggers client trust erosion, contract review requests, and potential churn',
    strength: 'strong',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_024',
    fromDomain: 'financial',
    toDomain: 'client_relations',
    signal: 'returns_underperformance',
    effect: 'Underperforming returns generate client dissatisfaction, redemption risk, and require pro-active account management',
    strength: 'moderate',
    direction: 'negative',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_025',
    fromDomain: 'client_relations',
    toDomain: 'financial',
    signal: 'large_client_at_risk',
    effect: 'At-risk major client indicates potential revenue loss that could affect financial projections and fund performance metrics',
    strength: 'moderate',
    direction: 'negative',
    lag: 'medium_term',
  },
  {
    edgeId: 'ce_026',
    fromDomain: 'research',
    toDomain: 'infrastructure',
    signal: 'new_model_available',
    effect: 'Newly available superior AI models create infrastructure upgrade opportunities and potential cost optimizations',
    strength: 'weak',
    direction: 'positive',
    lag: 'long_term',
  },
  {
    edgeId: 'ce_027',
    fromDomain: 'maritime',
    toDomain: 'financial',
    signal: 'fleet_incident',
    effect: 'Fleet incident triggers insurance claims, potential charter contract cancellations, and counterparty exposure',
    strength: 'strong',
    direction: 'negative',
    lag: 'immediate',
  },
  {
    edgeId: 'ce_028',
    fromDomain: 'legal',
    toDomain: 'security',
    signal: 'regulatory_audit',
    effect: 'Regulatory audits mandate enhanced security evidence collection, expanding the scope of security posture reviews',
    strength: 'moderate',
    direction: 'mixed',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_029',
    fromDomain: 'analytics',
    toDomain: 'client_relations',
    signal: 'engagement_decline',
    effect: 'Declining platform engagement analytics signal reduced client value realization and at-risk accounts',
    strength: 'moderate',
    direction: 'negative',
    lag: 'short_term',
  },
  {
    edgeId: 'ce_030',
    fromDomain: 'readiness',
    toDomain: 'client_relations',
    signal: 'maturity_score_decline',
    effect: 'Organizational maturity decline reduces delivery quality, increasing client dissatisfaction risk',
    strength: 'weak',
    direction: 'negative',
    lag: 'medium_term',
  },
];

export function propagateCausalSignal(signal: CausalSignal): CausalPropagationResult {
  const propagationId = `prop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const directEdges = CAUSAL_GRAPH.filter((e) => e.fromDomain === signal.domain);
  const impacts: CausalImpact[] = directEdges.map((edge): CausalImpact => {
    const strengthMultiplier = { strong: 0.9, moderate: 0.6, weak: 0.3 }[edge.strength];
    const directionMultiplier =
      signal.direction === edge.direction
        ? 1
        : signal.direction === 'negative' && edge.direction === 'positive'
          ? 0.5
          : 0.7;
    const estimatedMagnitude = Math.min(1, signal.magnitude * strengthMultiplier * directionMultiplier);

    return {
      targetDomain: edge.toDomain,
      effect: edge.effect,
      estimatedMagnitude,
      strength: edge.strength,
      lag: edge.lag,
      edge,
    };
  });

  const sortedImpacts = impacts.sort((a, b) => b.estimatedMagnitude - a.estimatedMagnitude);
  const affectedDomains = [...new Set(sortedImpacts.map((i) => i.targetDomain))];

  const crossPortfolioInsights: string[] = [];
  const highPriorityAlerts: string[] = [];

  for (const impact of sortedImpacts) {
    const insightPrefix = impact.estimatedMagnitude > 0.7 ? '🔴 HIGH IMPACT' : impact.estimatedMagnitude > 0.4 ? '🟡 MODERATE' : '🟢 LOW';
    crossPortfolioInsights.push(
      `${insightPrefix} [${signal.domain} → ${impact.targetDomain}]: ${impact.effect} (${impact.lag.replace('_', ' ')} lag, magnitude ${(impact.estimatedMagnitude * 100).toFixed(0)}%)`,
    );

    if (impact.estimatedMagnitude > 0.65 && impact.strength === 'strong') {
      highPriorityAlerts.push(
        `ALERT: ${signal.domain} signal "${signal.signalType}" creates material ${impact.targetDomain} exposure — ${impact.effect.slice(0, 150)}`,
      );
    }
  }

  return {
    propagationId,
    triggeringSignal: signal,
    impacts: sortedImpacts,
    crossPortfolioInsights,
    highPriorityAlerts,
    affectedDomains,
    timestamp: new Date().toISOString(),
  };
}

export function createCausalSignal(
  domain: Domain,
  signalType: string,
  description: string,
  magnitude: number,
  direction: SignalDirection,
): CausalSignal {
  return {
    signalId: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    domain,
    signalType,
    description,
    magnitude: Math.max(0, Math.min(1, magnitude)),
    direction,
    timestamp: new Date().toISOString(),
  };
}

export function getAffectedDomains(fromDomain: Domain): Domain[] {
  return [...new Set(CAUSAL_GRAPH.filter((e) => e.fromDomain === fromDomain).map((e) => e.toDomain))];
}

export function getEdgesBetween(fromDomain: Domain, toDomain: Domain): CausalEdge[] {
  return CAUSAL_GRAPH.filter((e) => e.fromDomain === fromDomain && e.toDomain === toDomain);
}

export function buildCausalContext(domain: Domain): string {
  const outgoing = CAUSAL_GRAPH.filter((e) => e.fromDomain === domain);
  const incoming = CAUSAL_GRAPH.filter((e) => e.toDomain === domain);

  const lines = [`## Causal Graph Context for ${domain}`];

  if (outgoing.length > 0) {
    lines.push(`\n**Signals from ${domain} that affect other domains (${outgoing.length} edges):**`);
    for (const edge of outgoing.slice(0, 5)) {
      lines.push(`  → ${edge.toDomain} [${edge.strength}/${edge.lag.replace('_', ' ')}]: ${edge.effect.slice(0, 120)}`);
    }
  }

  if (incoming.length > 0) {
    lines.push(`\n**External signals that affect ${domain} (${incoming.length} edges):**`);
    for (const edge of incoming.slice(0, 5)) {
      lines.push(`  ← ${edge.fromDomain} [${edge.strength}/${edge.lag.replace('_', ' ')}]: ${edge.effect.slice(0, 120)}`);
    }
  }

  return lines.join('\n');
}
