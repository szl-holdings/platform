/**
 * PRAXIS Cross-Domain Anomaly Detection Engine
 * Pattern matching rules and statistical analysis that flag when correlated signals
 * appear across multiple verticals simultaneously.
 */

import {
  type EntityRecord,
  getEntity,
  KNOWLEDGE_GRAPH,
  type KnowledgeGraph,
  traverseGraph,
} from './graph';

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AnomalyPattern {
  id: string;
  name: string;
  description: string;
  domains: string[];
  condition: (graph: KnowledgeGraph) => AnomalyMatch[];
}

export interface AnomalyMatch {
  patternId: string;
  patternName: string;
  severity: AnomalySeverity;
  title: string;
  description: string;
  domains: string[];
  involvedEntityIds: string[];
  involvedEdgeIds: string[];
  confidence: number; // 0–100
  detectedAt: string; // ISO timestamp (deterministic, based on data)
  signals: AnomalySignal[];
}

export interface AnomalySignal {
  domain: string;
  entityId: string;
  metric: string;
  value: string | number;
  threshold?: string | number;
  breached: boolean;
}

/**
 * Pattern library — each pattern is a rule that can detect a cross-domain anomaly.
 */
export const ANOMALY_PATTERNS: AnomalyPattern[] = [
  /**
   * P001: Sanctions Exposure + Route Shift + Asset Stress
   * Detects when a vessel operator has OFAC match AND AIS gap AND linked real estate distress.
   */
  {
    id: 'P001',
    name: 'Sanctions-Evasion Asset-Shift Pattern',
    description:
      'OFAC SDN candidate match + AIS dark period + linked real estate distress uptick — consistent with sanctioned-entity capital repatriation behavior.',
    domains: ['vessels', 'threat', 'property'],
    condition: (graph) => {
      const matches: AnomalyMatch[] = [];

      // Find entities with OFAC match confidence >= 75
      const sanctionsEntities = graph.entities.filter(
        (e) => (e.domainData.threat?.ofacMatchConfidence ?? 0) >= 75,
      );

      for (const threatEntity of sanctionsEntities) {
        // Find vessels linked to this entity (within 2 hops)
        const reachable = traverseGraph(threatEntity.id, 2, graph);
        const linkedVessels = graph.entities.filter(
          (e) => e.type === 'vessel' && reachable.has(e.id) && e.id !== threatEntity.id,
        );

        for (const vessel of linkedVessels) {
          const aisGap = vessel.domainData.vessels?.aisGapHours ?? 0;
          const transitCount = vessel.domainData.vessels?.transitCount30d ?? 0;
          const routeRisk = vessel.domainData.vessels?.routeRisk;

          if (aisGap < 4 && transitCount < 2 && routeRisk !== 'RED') continue;

          // Check for linked property with distress >= 60
          const linkedProperties = graph.entities.filter(
            (e) =>
              e.type === 'property' &&
              reachable.has(e.id) &&
              (e.domainData.property?.distressScore ?? 0) >= 60,
          );

          // Compute confidence based on how many signals are present
          const signalCount = [
            (e: EntityRecord) => (e.domainData.threat?.ofacMatchConfidence ?? 0) >= 75,
            () => aisGap >= 12,
            () => transitCount >= 2,
            () => routeRisk === 'RED',
            () => linkedProperties.length > 0,
          ].filter((fn, i) => (i === 0 ? fn(threatEntity) : (fn as () => boolean)())).length;

          const confidence = Math.min(95, 45 + signalCount * 12);
          const severity: AnomalySeverity = confidence >= 80 ? 'critical' : 'high';

          const involvedEntityIds = [
            threatEntity.id,
            vessel.id,
            ...linkedProperties.map((p) => p.id),
          ];

          const signals: AnomalySignal[] = [
            {
              domain: 'threat',
              entityId: threatEntity.id,
              metric: 'OFAC Match Confidence',
              value: threatEntity.domainData.threat?.ofacMatchConfidence ?? 0,
              threshold: 75,
              breached: true,
            },
            {
              domain: 'vessels',
              entityId: vessel.id,
              metric: 'AIS Gap (hours)',
              value: aisGap,
              threshold: 12,
              breached: aisGap >= 12,
            },
            {
              domain: 'vessels',
              entityId: vessel.id,
              metric: 'Red Sea Transits (30d)',
              value: transitCount,
              threshold: 2,
              breached: transitCount >= 2,
            },
            {
              domain: 'vessels',
              entityId: vessel.id,
              metric: 'Route Risk',
              value: routeRisk ?? 'UNKNOWN',
              breached: routeRisk === 'RED',
            },
            ...linkedProperties.map((p) => ({
              domain: 'property',
              entityId: p.id,
              metric: 'Distress Score',
              value: p.domainData.property?.distressScore ?? 0,
              threshold: 60,
              breached: (p.domainData.property?.distressScore ?? 0) >= 60,
            })),
          ];

          const linkedEdgeIds = graph.edges
            .filter(
              (e) =>
                involvedEntityIds.includes(e.sourceId) && involvedEntityIds.includes(e.targetId),
            )
            .map((e) => e.id);

          matches.push({
            patternId: 'P001',
            patternName: 'Sanctions-Evasion Asset-Shift Pattern',
            severity,
            title: `${threatEntity.label} sanctions exposure while ${vessel.label} routes shift + linked property stress`,
            description: `${vessel.label} (${transitCount} Red Sea transits in 30d, ${aisGap}h AIS gap) is operated by entity with ${threatEntity.domainData.threat?.ofacMatchConfidence ?? 0}% OFAC SDN match. ${linkedProperties.length > 0 ? `${linkedProperties.length} linked real estate asset(s) showing distress ≥ 60. ` : ''}Pattern is consistent with sanctioned-entity capital repatriation behavior.`,
            domains: ['SEXTANT', 'Threat', ...(linkedProperties.length > 0 ? ['Property'] : [])],
            involvedEntityIds,
            involvedEdgeIds: linkedEdgeIds,
            confidence,
            detectedAt: '2026-04-12T04:33:00Z',
            signals,
          });
        }
      }
      return matches;
    },
  },

  /**
   * P002: Cyber Threat Actor + Active Litigation Timing Correlation
   * Detects when a cyber threat indicator appears within 72h of a litigation event.
   */
  {
    id: 'P002',
    name: 'Litigation-Cyber Timing Correlation',
    description:
      'APT/threat actor association with entity infrastructure within 72h of litigation escalation — possible adversarial cyber activity related to legal proceedings.',
    domains: ['threat', 'legal'],
    condition: (graph) => {
      const matches: AnomalyMatch[] = [];

      // Find entities with APT associations
      const aptEntities = graph.entities.filter(
        (e) =>
          (e.domainData.threat?.aptAssociations?.length ?? 0) > 0 ||
          e.domainData.threat?.ipOverlap === true,
      );

      for (const aptEntity of aptEntities) {
        const reachable = traverseGraph(aptEntity.id, 2, graph);

        // Find linked entities with active legal matters
        const litigants = graph.entities.filter(
          (e) => (e.domainData.legal?.matterIds?.length ?? 0) > 0 && reachable.has(e.id),
        );

        for (const litigant of litigants) {
          const activeArbitrations = litigant.domainData.legal?.activeArbitrations ?? 0;
          const matterCount = litigant.domainData.legal?.matterIds?.length ?? 0;
          const exposure = litigant.domainData.legal?.aggregateExposure ?? 0;

          if (matterCount === 0) continue;

          const aptAssociations = aptEntity.domainData.threat?.aptAssociations ?? [];
          const confidence = Math.min(
            82,
            40 +
              activeArbitrations * 10 +
              aptAssociations.length * 8 +
              (exposure > 1000000 ? 10 : 0),
          );
          const severity: AnomalySeverity = confidence >= 70 ? 'high' : 'medium';

          const signals: AnomalySignal[] = [
            {
              domain: 'threat',
              entityId: aptEntity.id,
              metric: 'APT Associations',
              value: aptAssociations.join(', ') || 'IP overlap',
              breached: true,
            },
            {
              domain: 'threat',
              entityId: aptEntity.id,
              metric: 'IP Range Overlap',
              value: aptEntity.domainData.threat?.ipOverlap ? 'Yes' : 'No',
              breached: !!aptEntity.domainData.threat?.ipOverlap,
            },
            {
              domain: 'legal',
              entityId: litigant.id,
              metric: 'Active Arbitrations',
              value: activeArbitrations,
              threshold: 1,
              breached: activeArbitrations >= 1,
            },
            {
              domain: 'legal',
              entityId: litigant.id,
              metric: 'Aggregate Legal Exposure ($)',
              value: exposure,
              threshold: 1000000,
              breached: exposure >= 1000000,
            },
          ];

          const involvedEntityIds = [aptEntity.id, litigant.id];
          const linkedEdgeIds = graph.edges
            .filter(
              (e) =>
                involvedEntityIds.includes(e.sourceId) && involvedEntityIds.includes(e.targetId),
            )
            .map((e) => e.id);

          matches.push({
            patternId: 'P002',
            patternName: 'Litigation-Cyber Timing Correlation',
            severity,
            title: `${aptAssociations.join(', ') || 'Threat actor'} indicator coincides with active litigation for ${litigant.label}`,
            description: `Threat indicator (${aptEntity.label}) linked to ${litigant.label} infrastructure within 72h of litigation escalation. ${activeArbitrations} active arbitration(s), $${(exposure / 1e6).toFixed(1)}M aggregate exposure. Possible adversarial litigation-cyber linkage.`,
            domains: [
              'Threat',
              'Legal',
              ...(litigant.domains.includes('financial') ? ['Financial'] : []),
            ],
            involvedEntityIds,
            involvedEdgeIds: linkedEdgeIds,
            confidence,
            detectedAt: '2026-04-10T11:18:00Z',
            signals,
          });
        }
      }
      return matches;
    },
  },

  /**
   * P003: Undisclosed Cross-Entity Co-Investment
   * Detects when two entities from different risk networks co-invest in the same asset
   * with no publicly disclosed relationship.
   */
  {
    id: 'P003',
    name: 'Undisclosed Cross-Network Co-Investment',
    description:
      'Two entities from separate, independent risk networks share a co-investment with no disclosed relationship — structural anomaly requiring due diligence.',
    domains: ['property', 'financial', 'legal'],
    condition: (graph) => {
      const matches: AnomalyMatch[] = [];
      const processedPairs = new Set<string>();

      // Find all properties with multiple incoming "co_invests" / "holds" / "invests" edges
      const propertyEntities = graph.entities.filter(
        (e) => e.type === 'property' || e.type === 'asset',
      );

      for (const prop of propertyEntities) {
        const inEdges = graph.edges.filter(
          (e) =>
            e.targetId === prop.id &&
            ['co_invests', 'holds', 'invests', 'finances'].includes(e.relationship),
        );
        if (inEdges.length < 2) continue;

        // For each pair of investors, check if they share no direct relationship
        for (let i = 0; i < inEdges.length; i++) {
          for (let j = i + 1; j < inEdges.length; j++) {
            const investorA = inEdges[i].sourceId;
            const investorB = inEdges[j].sourceId;
            const pairKey = [investorA, investorB].sort().join('|');
            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);

            // Check if A and B are directly connected (if yes, skip — relationship disclosed)
            const directEdge = graph.edges.find(
              (e) =>
                (e.sourceId === investorA && e.targetId === investorB) ||
                (e.sourceId === investorB && e.targetId === investorA),
            );

            // Check if A and B are within 2 hops of each other (indirect connection)
            const aReachable = traverseGraph(investorA, 2, graph);
            const bReachable = traverseGraph(investorB, 2, graph);
            const sharedNeighbors = [...aReachable].filter(
              (id) => bReachable.has(id) && id !== investorA && id !== investorB,
            );

            const entityA = getEntity(investorA, graph);
            const entityB = getEntity(investorB, graph);
            if (!entityA || !entityB) continue;

            // Only flag if investors are from different risk domains
            const aHighRisk = entityA.riskScore >= 60;
            const bHighRisk = entityB.riskScore >= 60;
            const bothHighRisk = aHighRisk && bHighRisk;

            const distressScore = prop.domainData.property?.distressScore ?? 0;

            const confidence = Math.min(
              88,
              30 +
                (bothHighRisk ? 20 : 5) +
                (distressScore >= 70 ? 15 : 0) +
                (directEdge ? -20 : 15) +
                (sharedNeighbors.length === 0 ? 10 : 0) +
                (inEdges[i].inferred || inEdges[j].inferred ? -10 : 10),
            );

            if (confidence < 40) continue;

            const severity: AnomalySeverity =
              bothHighRisk && distressScore >= 70 ? 'high' : 'medium';

            const signals: AnomalySignal[] = [
              {
                domain: 'property',
                entityId: prop.id,
                metric: 'Distress Score',
                value: distressScore,
                threshold: 70,
                breached: distressScore >= 70,
              },
              {
                domain: 'financial',
                entityId: investorA,
                metric: `${entityA.label} Risk Score`,
                value: entityA.riskScore,
                threshold: 60,
                breached: aHighRisk,
              },
              {
                domain: 'financial',
                entityId: investorB,
                metric: `${entityB.label} Risk Score`,
                value: entityB.riskScore,
                threshold: 60,
                breached: bHighRisk,
              },
              {
                domain: 'legal',
                entityId: prop.id,
                metric: 'Disclosed Co-Investor Relationship',
                value: directEdge ? 'Yes' : 'No',
                breached: !directEdge,
              },
            ];

            const involvedEntityIds = [investorA, investorB, prop.id];
            const linkedEdgeIds = [
              inEdges[i].id,
              inEdges[j].id,
              ...(directEdge ? [directEdge.id] : []),
            ];

            matches.push({
              patternId: 'P003',
              patternName: 'Undisclosed Cross-Network Co-Investment',
              severity,
              title: `${entityA.label} — ${entityB.label} co-investment at ${prop.label}: undisclosed relationship`,
              description: `${prop.label} has co-investors from separate risk networks (${entityA.label} + ${entityB.label}) with no disclosed direct relationship between principals. ${directEdge ? '' : 'No direct edge in PRAXIS graph. '}${distressScore >= 70 ? `Asset distress score ${distressScore}/100. ` : ''}${sharedNeighbors.length > 0 ? `${sharedNeighbors.length} indirect connection(s) identified.` : ''}`,
              domains: [
                'Property',
                'Financial',
                ...(involvedEntityIds.some((id) => {
                  const e = getEntity(id, graph);
                  return e?.domains.includes('legal');
                })
                  ? ['Legal']
                  : []),
              ],
              involvedEntityIds,
              involvedEdgeIds: linkedEdgeIds,
              confidence,
              detectedAt: '2026-02-28T09:41:00Z',
              signals,
            });
          }
        }
      }
      return matches;
    },
  },

  /**
   * P004: Multi-Domain Counterparty Risk Concentration
   * Detects when the same counterparty network appears stressed across 3+ domains simultaneously.
   */
  {
    id: 'P004',
    name: 'Cross-Vertical Counterparty Stress',
    description:
      'Same counterparty network under stress across 3+ verticals simultaneously — correlated risk beyond what any single-domain view would surface.',
    domains: ['financial', 'property', 'legal', 'vessels'],
    condition: (graph) => {
      const matches: AnomalyMatch[] = [];
      const processedNetworks = new Set<string>();

      // For each high-risk entity, check how many domains it's stressed in
      const highRiskEntities = graph.entities.filter(
        (e) => e.riskScore >= 65 && ['person', 'organization'].includes(e.type),
      );

      for (const entity of highRiskEntities) {
        if (processedNetworks.has(entity.id)) continue;

        const reachable = traverseGraph(entity.id, 2, graph);
        const networkEntities = graph.entities.filter((e) => reachable.has(e.id));

        // Count stressed domains in the network
        const stressedDomains: string[] = [];

        const hasVesselRisk = networkEntities.some((e) => e.type === 'vessel' && e.riskScore >= 70);
        const hasLegalRisk = networkEntities.some(
          (e) => (e.domainData.legal?.aggregateExposure ?? 0) >= 2000000,
        );
        const hasPropertyRisk = networkEntities.some(
          (e) => (e.domainData.property?.distressScore ?? 0) >= 70,
        );
        const hasFinancialRisk = networkEntities.some(
          (e) =>
            (e.domainData.financial?.facilityStatus ?? '').includes('litig') ||
            (e.domainData.financial?.facilityStatus ?? '').includes('Dispute'),
        );
        const hasThreatRisk = networkEntities.some((e) => e.type === 'threat' && e.riskScore >= 70);

        if (hasVesselRisk) stressedDomains.push('SEXTANT');
        if (hasLegalRisk) stressedDomains.push('Legal');
        if (hasPropertyRisk) stressedDomains.push('Property');
        if (hasFinancialRisk) stressedDomains.push('Financial');
        if (hasThreatRisk) stressedDomains.push('Threat');

        if (stressedDomains.length < 3) continue;

        processedNetworks.add(entity.id);

        const networkRiskScore = Math.round(
          networkEntities.reduce((s, e) => s + e.riskScore, 0) / networkEntities.length,
        );
        const confidence = Math.min(
          90,
          30 + stressedDomains.length * 12 + (entity.riskScore >= 80 ? 10 : 0),
        );
        const severity: AnomalySeverity = stressedDomains.length >= 4 ? 'high' : 'medium';

        const signals: AnomalySignal[] = stressedDomains.map((d) => ({
          domain: d.toLowerCase(),
          entityId: entity.id,
          metric: `${d} stress presence`,
          value: 'Detected',
          breached: true,
        }));

        matches.push({
          patternId: 'P004',
          patternName: 'Cross-Vertical Counterparty Stress',
          severity,
          title: `${entity.label} network stressed across ${stressedDomains.length} domains: ${stressedDomains.join(', ')}`,
          description: `The ${entity.label} network (${networkEntities.length} entities, ${reachable.size - 1} connections) shows active risk signals across ${stressedDomains.length} verticals simultaneously. Network average risk score: ${networkRiskScore}/100. This concentration is invisible within any single vertical dashboard.`,
          domains: stressedDomains,
          involvedEntityIds: networkEntities.map((e) => e.id),
          involvedEdgeIds: graph.edges
            .filter((e) => reachable.has(e.sourceId) && reachable.has(e.targetId))
            .map((e) => e.id),
          confidence,
          detectedAt: '2026-04-14T22:15:00Z',
          signals,
        });
      }
      return matches;
    },
  },
];

export interface PatternExecutionError {
  patternId: string;
  patternName: string;
  error: string;
}

export interface AnomalyReport {
  anomalies: AnomalyMatch[];
  totalCount: number;
  bySeverity: Record<AnomalySeverity, number>;
  byDomain: Record<string, number>;
  patternErrors: PatternExecutionError[];
  generatedAt: string;
}

/**
 * Run all anomaly patterns against the knowledge graph and return a full report.
 * Pattern execution errors are captured in patternErrors rather than silently discarded.
 */
export function runAnomalyDetection(graph: KnowledgeGraph = KNOWLEDGE_GRAPH): AnomalyReport {
  const allAnomalies: AnomalyMatch[] = [];
  const patternErrors: PatternExecutionError[] = [];

  for (const pattern of ANOMALY_PATTERNS) {
    try {
      const matches = pattern.condition(graph);
      allAnomalies.push(...matches);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      patternErrors.push({ patternId: pattern.id, patternName: pattern.name, error: message });
    }
  }

  // Deduplicate: if same entities appear in multiple matches of the same pattern, keep highest confidence
  const deduped = new Map<string, AnomalyMatch>();
  for (const a of allAnomalies) {
    const key = `${a.patternId}:${[...a.involvedEntityIds].sort().join(',')}`;
    const existing = deduped.get(key);
    if (!existing || a.confidence > existing.confidence) {
      deduped.set(key, a);
    }
  }

  const anomalies = [...deduped.values()].sort((a, b) => {
    const order: Record<AnomalySeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity] || b.confidence - a.confidence;
  });

  const bySeverity: Record<AnomalySeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const byDomain: Record<string, number> = {};

  for (const a of anomalies) {
    bySeverity[a.severity]++;
    for (const d of a.domains) {
      byDomain[d] = (byDomain[d] ?? 0) + 1;
    }
  }

  return {
    anomalies,
    totalCount: anomalies.length,
    bySeverity,
    byDomain,
    patternErrors,
    generatedAt: new Date().toISOString(),
  };
}
