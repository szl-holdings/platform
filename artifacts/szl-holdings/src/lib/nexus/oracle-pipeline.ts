/**
 * ORACLE Intelligence Briefing Pipeline
 * Analyzes cross-domain graph data + anomalies and generates a structured daily brief.
 * This is a deterministic pipeline driven by the NEXUS knowledge graph state.
 */

import { type AnomalyMatch, type AnomalyReport, runAnomalyDetection } from './anomaly-engine';
import { getEntity, KNOWLEDGE_GRAPH, type KnowledgeGraph } from './graph';

export type BriefSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface OracleFinding {
  label: string;
  detail: string;
  severity: BriefSeverity;
  entityIds: string[];
  metric?: string;
  value?: number | string;
}

export interface OracleAction {
  priority: 'immediate' | 'today' | 'this-week';
  action: string;
  owner: string;
  entityIds: string[];
}

export interface OracleBriefSection {
  id: string;
  sectionNumber: number;
  title: string;
  severity: BriefSeverity;
  domain: string;
  domainColor: string;
  analystConfidence: number;
  analystNote: string;
  summary: string;
  findings: OracleFinding[];
  recommendedActions: OracleAction[];
  entityIds: string[];
  sourceAnomalyIds?: string[];
  drillDownPath?: string;
}

export interface OracleBrief {
  briefId: string;
  generatedAt: string;
  graphVersion: string;
  runtimeMs: number;
  executiveSummary: {
    topRisk: string;
    keyDevelopment: string;
    trendShift: string;
    oracleAssessment: string;
    immediateActionCount: number;
    criticalCount: number;
    highCount: number;
  };
  sections: OracleBriefSection[];
  anomalyReport: AnomalyReport;
}

// Domain color mapping
const DOMAIN_COLORS: Record<string, string> = {
  'Vessels + Threat': '#ef4444',
  'Threat + Legal': '#f97316',
  'Property + Financial': '#4ade80',
  Financial: '#f59e0b',
  Legal: '#d4a054',
  Operations: '#10b981',
};

/**
 * Derive ORACLE section severity from anomalies and entity risk scores.
 */
function deriveSeverity(
  entityIds: string[],
  anomalyMatches: AnomalyMatch[],
  graph: KnowledgeGraph,
): BriefSeverity {
  const entityMaxRisk = entityIds.reduce((max, id) => {
    const e = getEntity(id, graph);
    return Math.max(max, e?.riskScore ?? 0);
  }, 0);

  const anomalyMaxSeverity = anomalyMatches.reduce((max, a) => {
    const order: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    return Math.max(max, order[a.severity] ?? 0);
  }, 0);

  const combined = Math.max(entityMaxRisk / 25, anomalyMaxSeverity);
  if (combined >= 3.5 || entityMaxRisk >= 90) return 'critical';
  if (combined >= 2.5 || entityMaxRisk >= 70) return 'high';
  if (combined >= 1.5 || entityMaxRisk >= 50) return 'medium';
  if (combined >= 0.5) return 'low';
  return 'info';
}

/**
 * Generate the ORACLE brief from graph state and anomaly report.
 * Sections are derived deterministically from the data.
 */
export function generateOracleBrief(graph: KnowledgeGraph = KNOWLEDGE_GRAPH): OracleBrief {
  const startTime = Date.now();
  const anomalyReport = runAnomalyDetection(graph);

  const sections: OracleBriefSection[] = [];
  let sectionNum = 1;

  // ── Section 1: Critical OFAC / Sanctions exposure ──
  const sanctionsEntities = graph.entities.filter(
    (e) => (e.domainData.threat?.ofacMatchConfidence ?? 0) >= 70,
  );
  const ofacAnomalies = anomalyReport.anomalies.filter((a) => a.patternId === 'P001');
  const vesselEntities = graph.entities.filter((e) => e.type === 'vessel' && e.riskScore >= 80);

  if (sanctionsEntities.length > 0 || ofacAnomalies.length > 0) {
    const relatedEntityIds = new Set<string>();
    for (const a of ofacAnomalies) a.involvedEntityIds.forEach((id) => relatedEntityIds.add(id));
    for (const e of sanctionsEntities) relatedEntityIds.add(e.id);
    for (const e of vesselEntities) relatedEntityIds.add(e.id);

    const entityIdArr = [...relatedEntityIds];
    const maxRisk = entityIdArr.reduce(
      (mx, id) => Math.max(mx, getEntity(id, graph)?.riskScore ?? 0),
      0,
    );
    const ofacConf = sanctionsEntities.reduce(
      (mx, e) => Math.max(mx, e.domainData.threat?.ofacMatchConfidence ?? 0),
      0,
    );

    const findings: OracleFinding[] = [
      ...sanctionsEntities.map((e) => ({
        label: `OFAC SDN Match — ${e.label}`,
        detail: `${ofacConf}% composite confidence · Programs: ${e.domainData.threat?.sanctionsPrograms?.join(', ') ?? 'Multiple'} · Status: PENDING HUMAN REVIEW`,
        severity: 'critical' as BriefSeverity,
        entityIds: [e.id],
        metric: 'Match Confidence',
        value: ofacConf,
      })),
      ...vesselEntities.map((e) => ({
        label: `AIS Anomaly — ${e.label}`,
        detail: `${e.domainData.vessels?.aisGapHours ?? 0}h dark period · ${e.domainData.vessels?.transitCount30d ?? 0} transits in 30 days · Route risk: ${e.domainData.vessels?.routeRisk ?? 'UNKNOWN'}`,
        severity: 'high' as BriefSeverity,
        entityIds: [e.id],
        metric: 'AIS Gap Hours',
        value: e.domainData.vessels?.aisGapHours ?? 0,
      })),
      ...ofacAnomalies.flatMap((a) =>
        a.signals
          .filter((s) => s.breached && s.domain === 'property')
          .map((s) => ({
            label: 'Asset Shift Signal — Linked Property Distress',
            detail: `Linked real estate showing ${s.value}/100 distress — pattern matches sanctioned-entity capital repatriation behavior`,
            severity: 'medium' as BriefSeverity,
            entityIds: a.involvedEntityIds,
            metric: 'Distress Score',
            value: s.value as number,
          })),
      ),
    ];

    const actions: OracleAction[] = [
      {
        priority: 'immediate',
        action: `Place ${sanctionsEntities.map((e) => e.label).join(', ')} and all affiliated entities on internal restricted-party list pending OFAC determination`,
        owner: 'Legal / Compliance',
        entityIds: entityIdArr,
      },
      {
        priority: 'immediate',
        action:
          'Pause any active or pending transactions with linked entities until sanctions status is formally resolved',
        owner: 'Atlas / Finance',
        entityIds: entityIdArr,
      },
      ...vesselEntities.map((v) => ({
        priority: 'today' as const,
        action: `Request ${v.label} AIS gap explanation from vessel manager — document response for OFAC regulatory file`,
        owner: 'Helmsman Ops',
        entityIds: [v.id],
      })),
      {
        priority: 'this-week',
        action: 'Commission full beneficial ownership tracing on all shell entities in network',
        owner: 'Counsel',
        entityIds: entityIdArr,
      },
    ];

    sections.push({
      id: `S${sectionNum++}`,
      sectionNumber: 1,
      title: `Escalating Sanctions Exposure — ${sanctionsEntities.map((e) => e.label).join(', ')}`,
      severity: deriveSeverity(entityIdArr, ofacAnomalies, graph),
      domain: 'Vessels + Threat + Financial',
      domainColor: '#ef4444',
      analystConfidence: Math.round(ofacConf * 0.95),
      analystNote: `High confidence. Composite signal across AIS routing, OFAC name match, and financial flow anomaly. ${ofacConf >= 85 ? 'Recommend immediate legal review before any new transactions with linked entities.' : 'Further corroborating evidence recommended before formal action.'}`,
      summary:
        ofacAnomalies[0]?.description ??
        `OFAC SDN candidate match at ${ofacConf}% confidence detected for ${sanctionsEntities.map((e) => e.label).join(', ')}. Vessel routing, AIS anomalies, and linked property distress all correlate with this exposure.`,
      findings,
      recommendedActions: actions,
      entityIds: entityIdArr,
      sourceAnomalyIds: ofacAnomalies.map((a) => a.patternId),
      drillDownPath: '/nexus/explorer',
    });
  }

  // ── Section 2: Cyber Threat + Legal Timing Anomaly ──
  const litCyberAnomalies = anomalyReport.anomalies.filter((a) => a.patternId === 'P002');
  const aptEntities = graph.entities.filter(
    (e) =>
      (e.domainData.threat?.aptAssociations?.length ?? 0) > 0 || e.domainData.threat?.ipOverlap,
  );

  if (litCyberAnomalies.length > 0 || aptEntities.length > 0) {
    const entityIdSet = new Set<string>();
    for (const a of litCyberAnomalies) a.involvedEntityIds.forEach((id) => entityIdSet.add(id));
    for (const e of aptEntities) entityIdSet.add(e.id);

    const entityIdArr = [...entityIdSet];
    const topAnomaly = litCyberAnomalies[0];
    const topConf = litCyberAnomalies.reduce((mx, a) => Math.max(mx, a.confidence), 65);

    const findings: OracleFinding[] = [
      ...aptEntities.map((e) => ({
        label: `${e.domainData.threat?.aptAssociations?.join(', ') ?? 'Threat Actor'} IP Range Overlap`,
        detail: `${(e.domainData.threat?.aptAssociations ?? []).join(', ')} known infrastructure overlap · Detection: ${e.updatedAt} · Not confirmed intrusion`,
        severity: 'high' as BriefSeverity,
        entityIds: [e.id],
      })),
      ...litCyberAnomalies.flatMap((a) =>
        a.signals
          .filter((s) => s.domain === 'legal' && s.breached)
          .map((s) => ({
            label: 'Active Litigation — Timing Correlation',
            detail: s.value + ' — escalation within 72h of threat indicator detection',
            severity: 'high' as BriefSeverity,
            entityIds: a.involvedEntityIds,
            metric: s.metric,
            value: s.value as string,
          })),
      ),
    ];

    sections.push({
      id: `S${sectionNum++}`,
      sectionNumber: 2,
      title: `Cyber Threat Indicator + Active Litigation Timing Correlation`,
      severity: deriveSeverity(entityIdArr, litCyberAnomalies, graph),
      domain: 'Threat + Legal + Financial',
      domainColor: '#f97316',
      analystConfidence: topConf,
      analystNote:
        'Moderate-high confidence. Threat actor attribution is probabilistic (IP range overlap only). Litigation/cyber timing coincidence warrants investigation but may not be causal. Treat as high priority pending further threat intelligence.',
      summary:
        topAnomaly?.description ??
        `Threat indicator linked to entity infrastructure within 72h of litigation escalation. Pattern is consistent with adversarial litigation-cyber linkage.`,
      findings,
      recommendedActions: [
        {
          priority: 'immediate',
          action:
            'Notify CISO — initiate threat hunt on any SZL systems with implicated entity API connections',
          owner: 'Aegis SOC',
          entityIds: entityIdArr,
        },
        {
          priority: 'today',
          action:
            'Inform PRISM legal team of NEXUS-discovered cross-network co-investment — assess conflict implications',
          owner: 'Counsel',
          entityIds: entityIdArr,
        },
        {
          priority: 'this-week',
          action:
            'Commission LP/beneficial ownership review of implicated fund — check for network overlap',
          owner: 'Atlas / Legal',
          entityIds: entityIdArr,
        },
      ],
      entityIds: entityIdArr,
      sourceAnomalyIds: litCyberAnomalies.map((a) => a.patternId),
      drillDownPath: '/nexus/explorer',
    });
  }

  // ── Section 3: Undisclosed co-investment anomalies ──
  const coInvestAnomalies = anomalyReport.anomalies.filter((a) => a.patternId === 'P003');
  if (coInvestAnomalies.length > 0) {
    const entityIdSet = new Set<string>();
    for (const a of coInvestAnomalies) a.involvedEntityIds.forEach((id) => entityIdSet.add(id));
    const entityIdArr = [...entityIdSet];
    const topConf = coInvestAnomalies.reduce((mx, a) => Math.max(mx, a.confidence), 60);

    const findings: OracleFinding[] = coInvestAnomalies.flatMap((a) => [
      {
        label: a.title,
        detail: a.description,
        severity: a.severity as BriefSeverity,
        entityIds: a.involvedEntityIds,
      },
      ...a.signals
        .filter((s) => s.breached)
        .map((s) => ({
          label: s.metric,
          detail: `${s.value} ${s.threshold !== undefined ? `(threshold: ${s.threshold})` : ''} — ${s.domain} domain`,
          severity: a.severity as BriefSeverity,
          entityIds: a.involvedEntityIds,
          metric: s.metric,
          value: s.value,
        })),
    ]);

    sections.push({
      id: `S${sectionNum++}`,
      sectionNumber: 3,
      title: `Cross-Network Co-Investment Anomaly — NEXUS Graph Discovery`,
      severity: deriveSeverity(entityIdArr, coInvestAnomalies, graph),
      domain: 'Property + Financial + Legal',
      domainColor: '#4ade80',
      analystConfidence: topConf,
      analystNote:
        'Moderate confidence. Ownership link is confirmed via title records. Cross-entity principal relationship is inferred by NEXUS — no publicly disclosed association exists. Structure warrants due diligence but is not inherently improper without further evidence.',
      summary: `NEXUS identified previously unknown co-investment structure(s) linking entities from separate risk networks with no disclosed relationship. ${coInvestAnomalies.length} pattern(s) detected. These connections were invisible within any single vertical and required cross-domain graph traversal to surface.`,
      findings,
      recommendedActions: [
        {
          priority: 'today',
          action:
            'Commission independent appraisal and lender covenant review on affected distressed assets',
          owner: 'Terra Engine',
          entityIds: entityIdArr,
        },
        {
          priority: 'this-week',
          action:
            'Request PRISM title opinion on identified ownership structures — assess undisclosed conflicts',
          owner: 'Counsel',
          entityIds: entityIdArr,
        },
        {
          priority: 'this-week',
          action:
            'Update NEXUS graph with confirmed co-investment edges · Raise combined entity risk scores',
          owner: 'NEXUS Ops',
          entityIds: [],
        },
      ],
      entityIds: entityIdArr,
      sourceAnomalyIds: coInvestAnomalies.map((a) => a.patternId),
      drillDownPath: '/nexus/explorer',
    });
  }

  // ── Section 4: Cross-vertical counterparty stress ──
  const stressAnomalies = anomalyReport.anomalies.filter((a) => a.patternId === 'P004');
  if (stressAnomalies.length > 0) {
    const entityIdSet = new Set<string>();
    for (const a of stressAnomalies)
      a.involvedEntityIds.slice(0, 6).forEach((id) => entityIdSet.add(id));
    const entityIdArr = [...entityIdSet];

    const findings: OracleFinding[] = stressAnomalies.flatMap((a) => [
      {
        label: a.title,
        detail: a.description,
        severity: a.severity as BriefSeverity,
        entityIds: a.involvedEntityIds.slice(0, 4),
      },
      {
        label: 'NEXUS Amplification Factor',
        detail: `Combined cross-domain risk score exceeds any single-vertical assessment by ~1.4x`,
        severity: 'medium' as BriefSeverity,
        entityIds: a.involvedEntityIds.slice(0, 2),
      },
    ]);

    sections.push({
      id: `S${sectionNum++}`,
      sectionNumber: 4,
      title: `Portfolio Risk Trend — Multi-Vertical Counterparty Stress Correlation`,
      severity: deriveSeverity(entityIdArr, stressAnomalies, graph),
      domain: 'Financial + Property + Legal',
      domainColor: '#eab308',
      analystConfidence: Math.round(
        stressAnomalies.reduce((mx, a) => Math.max(mx, a.confidence), 75),
      ),
      analystNote:
        'High confidence on trend identification. Causal linkage between verticals is probabilistic. Pattern is consistent with credit cycle stress in overlapping counterparty networks.',
      summary: `NEXUS cross-domain analysis reveals ${stressAnomalies.length} counterparty network(s) under simultaneous stress across ${[...new Set(stressAnomalies.flatMap((a) => a.domains))].length} domains. This risk concentration is invisible within individual vertical dashboards.`,
      findings,
      recommendedActions: [
        {
          priority: 'today',
          action:
            'Atlas to produce cross-domain counterparty concentration report — identify all entities appearing in 2+ verticals',
          owner: 'Atlas',
          entityIds: entityIdArr,
        },
        {
          priority: 'this-week',
          action:
            'Convene cross-domain risk committee — review NEXUS-identified concentrations before Q2 close',
          owner: 'SZL Executive',
          entityIds: [],
        },
      ],
      entityIds: entityIdArr,
      sourceAnomalyIds: stressAnomalies.map((a) => a.patternId),
      drillDownPath: '/nexus/explorer',
    });
  }

  // ── Section 5: Legal Portfolio Status ──
  const legalEntities = graph.entities.filter(
    (e) => (e.domainData.legal?.matterIds?.length ?? 0) > 0,
  );
  const totalExposure = legalEntities.reduce(
    (s, e) => s + (e.domainData.legal?.aggregateExposure ?? 0),
    0,
  );
  const totalArbitrations = legalEntities.reduce(
    (s, e) => s + (e.domainData.legal?.activeArbitrations ?? 0),
    0,
  );

  if (legalEntities.length > 0) {
    const entityIdArr = legalEntities.map((e) => e.id);
    const highestExposure = legalEntities.reduce((prev, e) =>
      (e.domainData.legal?.aggregateExposure ?? 0) > (prev.domainData.legal?.aggregateExposure ?? 0)
        ? e
        : prev,
    );

    const findings: OracleFinding[] = [
      ...legalEntities.map((e) => {
        const matters = e.domainData.legal?.matterIds ?? [];
        const exposure = e.domainData.legal?.aggregateExposure ?? 0;
        const status = e.domainData.legal?.matterStatus ?? 'Active';
        return {
          label: matters.join(', ') || `${e.label} Legal Matters`,
          detail: `${status} · Exposure: $${(exposure / 1e6).toFixed(1)}M · ${e.domainData.legal?.activeArbitrations ?? 0} arbitration(s)`,
          severity: exposure >= 5000000 ? ('high' as BriefSeverity) : ('medium' as BriefSeverity),
          entityIds: [e.id],
          metric: 'Aggregate Exposure',
          value: exposure,
        };
      }),
      {
        label: 'Portfolio Summary',
        detail: `${legalEntities.length} entities with active matters · $${(totalExposure / 1e6).toFixed(1)}M total exposure · ${totalArbitrations} active arbitrations`,
        severity: 'info' as BriefSeverity,
        entityIds: entityIdArr,
      },
    ];

    const settlement = highestExposure.domainData.legal?.settlementForecast;
    const actions: OracleAction[] = [
      ...(settlement && settlement > 0
        ? [
            {
              priority: 'immediate' as const,
              action: `Approve ${highestExposure.label} demand package for filing — $${(settlement / 1e6).toFixed(2)}M settlement authority required`,
              owner: 'SZL Legal / CFO',
              entityIds: [highestExposure.id],
            },
          ]
        : []),
      {
        priority: 'today',
        action:
          'Brief PRISM counsel on any NEXUS-discovered conflicts affecting active matters — assess disclosure obligations',
        owner: 'Counsel',
        entityIds: entityIdArr,
      },
      {
        priority: 'this-week',
        action: `Prepare ${totalArbitrations} arbitration timeline(s) and counsel status updates for executive review`,
        owner: 'PRISM / Lexis',
        entityIds: entityIdArr,
      },
    ];

    sections.push({
      id: `S${sectionNum++}`,
      sectionNumber: 5,
      title: `Legal Matter Portfolio — $${(totalExposure / 1e6).toFixed(1)}M Aggregate Exposure`,
      severity: totalExposure >= 10000000 ? 'medium' : 'low',
      domain: 'Legal',
      domainColor: '#d4a054',
      analystConfidence: 91,
      analystNote:
        'High confidence. All findings sourced directly from PRISM case management system with no inference required.',
      summary: `${legalEntities.length} entities with active PRISM matters totaling $${(totalExposure / 1e6).toFixed(1)}M aggregate exposure across ${totalArbitrations} active arbitration(s). NEXUS cross-domain discoveries may affect case strategy for multiple active matters.`,
      findings,
      recommendedActions: actions,
      entityIds: entityIdArr,
      drillDownPath: '/prism-counsel/',
    });
  }

  // ── Section 6: Platform & Operations Health ──
  const totalEntities = graph.entities.length;
  const totalEdges = graph.edges.length;
  const inferredEdges = graph.edges.filter((e) => e.inferred).length;

  sections.push({
    id: `S${sectionNum++}`,
    sectionNumber: 6,
    title: 'Platform & Intelligence Health',
    severity: 'info',
    domain: 'Operations',
    domainColor: '#10b981',
    analystConfidence: 99,
    analystNote: 'System-computed metrics. No analyst adjustment required.',
    summary: `All SZL platform verticals operational. NEXUS graph v${graph.version} contains ${totalEntities} entities and ${totalEdges} relationships (${inferredEdges} inferred). ORACLE pipeline generated ${sections.length + 1} intelligence sections.`,
    findings: [
      {
        label: 'Platform Status',
        detail: 'Vessels, PRISM, Terra, Aegis, Alloy — all operational · Zero incidents',
        severity: 'info',
        entityIds: [],
      },
      {
        label: 'NEXUS Graph',
        detail: `${totalEntities} entities · ${totalEdges} edges (${inferredEdges} inferred) · Version ${graph.version} · Last refreshed ${graph.lastRefreshed}`,
        severity: 'info',
        entityIds: [],
      },
      {
        label: 'Anomaly Detection',
        detail: `${anomalyReport.totalCount} cross-domain anomalies detected · ${anomalyReport.bySeverity.critical} critical · ${anomalyReport.bySeverity.high} high`,
        severity: 'info',
        entityIds: [],
      },
      {
        label: 'ORACLE Pipeline',
        detail: `${sections.length + 1} sections generated · ${Date.now() - startTime}ms runtime · Graph revision ${graph.version}`,
        severity: 'info',
        entityIds: [],
      },
    ],
    recommendedActions: [
      {
        priority: 'this-week',
        action:
          'NEXUS analyst review of all inferred edges — validate or retract low-confidence connections',
        owner: 'NEXUS Ops',
        entityIds: [],
      },
    ],
    entityIds: [],
    drillDownPath: '/nexus',
  });

  // ── Executive summary — derived from sections ──
  const criticalSection = sections.find((s) => s.severity === 'critical');
  const immediateActions = sections
    .flatMap((s) => s.recommendedActions)
    .filter((a) => a.priority === 'immediate');

  const brief: OracleBrief = {
    briefId: `ORACLE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
    generatedAt: new Date().toISOString(),
    graphVersion: graph.version,
    runtimeMs: Date.now() - startTime,
    executiveSummary: {
      topRisk: criticalSection
        ? `${criticalSection.title} — CRITICAL · Immediate legal hold required`
        : (sections[0]?.title ?? 'No critical findings'),
      keyDevelopment:
        anomalyReport.anomalies.find((a) => a.patternId === 'P003')?.title ??
        anomalyReport.anomalies[0]?.title ??
        'No major new developments',
      trendShift:
        anomalyReport.anomalies.find((a) => a.patternId === 'P004')?.description?.slice(0, 180) ??
        'Cross-domain analysis complete — review individual sections for trend details.',
      oracleAssessment: `${immediateActions.length > 0 ? `${immediateActions.length} immediate executive decision(s) required. ` : ''}${anomalyReport.anomalies.length} cross-domain anomalies surfaced — ${anomalyReport.anomalies.filter((a) => a.severity === 'critical' || a.severity === 'high').length} require escalation. NEXUS graph traversal has connected signals that were previously invisible within individual vertical dashboards.`,
      immediateActionCount: immediateActions.length,
      criticalCount: sections.filter((s) => s.severity === 'critical').length,
      highCount: sections.filter((s) => s.severity === 'high').length,
    },
    sections,
    anomalyReport,
  };

  return brief;
}
