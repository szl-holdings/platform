/**
 * Predictive Cascade Analysis Engine
 *
 * Projects how signals in one domain propagate to others over time.
 * Implements cascading impact trees with probabilistic weights and
 * time-horizon confidence intervals.
 *
 * Inspired by epidemiological R0 propagation models and financial
 * contagion research — each signal has a "transmission coefficient"
 * to adjacent domains, decaying over time.
 */

export type DomainKey =
  | 'vessels'
  | 'firestorm'
  | 'terra'
  | 'prism-counsel'
  | 'szl-holdings'
  | 'lyte';
export type CascadeHorizon = '24h' | '7d' | '30d' | '90d';
export type CascadeImpactLevel =
  | 'negligible'
  | 'moderate'
  | 'significant'
  | 'severe'
  | 'catastrophic';

export interface CascadeNode {
  domain: DomainKey;
  impactLevel: CascadeImpactLevel;
  probability: number;
  timeToImpactDays: number;
  mechanism: string;
  mitigationOptions: string[];
  evidenceBasis: string[];
}

export interface CascadeTree {
  rootDomain: DomainKey;
  rootSignal: string;
  rootConfidence: number;
  generatedAt: string;
  horizon: CascadeHorizon;
  nodes: CascadeNode[];
  overallRiskScore: number;
  criticalPath: DomainKey[];
  summary: string;
  recommendedInterventions: string[];
}

export interface PredictiveAlert {
  id: string;
  title: string;
  summary: string;
  triggerDomain: DomainKey;
  triggerSignal: string;
  cascadeTree: CascadeTree;
  confidence: number;
  timeToMaterializedays: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedDomains: DomainKey[];
  generatedAt: string;
  expiresAt: string;
  status: 'active' | 'monitoring' | 'resolved';
  tags: string[];
}

const DOMAIN_ADJACENCY: Record<
  DomainKey,
  Array<{ target: DomainKey; transmissionCoeff: number; lagDays: number; mechanism: string }>
> = {
  vessels: [
    {
      target: 'szl-holdings',
      transmissionCoeff: 0.75,
      lagDays: 3,
      mechanism: 'Fleet revenue and cargo insurance claims impact portfolio cash flow',
    },
    {
      target: 'firestorm',
      transmissionCoeff: 0.6,
      lagDays: 1,
      mechanism: 'Maritime cyber targeting escalates to OT/SCADA security events',
    },
    {
      target: 'prism-counsel',
      transmissionCoeff: 0.55,
      lagDays: 7,
      mechanism: 'Vessel incidents trigger admiralty law proceedings and insurance disputes',
    },
    {
      target: 'terra',
      transmissionCoeff: 0.35,
      lagDays: 14,
      mechanism: 'Trade disruption impacts port-adjacent real estate valuations',
    },
    {
      target: 'lyte',
      transmissionCoeff: 0.3,
      lagDays: 2,
      mechanism: 'Fleet management system stress propagates to platform observability',
    },
  ],
  firestorm: [
    {
      target: 'szl-holdings',
      transmissionCoeff: 0.8,
      lagDays: 1,
      mechanism: 'Security breach creates direct financial liability and regulatory exposure',
    },
    {
      target: 'prism-counsel',
      transmissionCoeff: 0.7,
      lagDays: 3,
      mechanism: 'Breach triggers data protection litigation and regulatory notifications',
    },
    {
      target: 'vessels',
      transmissionCoeff: 0.65,
      lagDays: 2,
      mechanism: 'OT/SCADA attacks cascade to fleet operational systems',
    },
    {
      target: 'lyte',
      transmissionCoeff: 0.85,
      lagDays: 0.5,
      mechanism: 'Security incidents immediately degrade platform reliability metrics',
    },
    {
      target: 'terra',
      transmissionCoeff: 0.25,
      lagDays: 21,
      mechanism: 'Reputational damage from breach affects tenant confidence in managed properties',
    },
  ],
  terra: [
    {
      target: 'szl-holdings',
      transmissionCoeff: 0.85,
      lagDays: 7,
      mechanism: 'Property valuation changes directly update portfolio NAV and LTV covenants',
    },
    {
      target: 'prism-counsel',
      transmissionCoeff: 0.6,
      lagDays: 14,
      mechanism: 'Distressed properties trigger tenant disputes and foreclosure proceedings',
    },
    {
      target: 'vessels',
      transmissionCoeff: 0.2,
      lagDays: 30,
      mechanism: 'Port-adjacent property distress signals broader regional economic stress',
    },
    {
      target: 'lyte',
      transmissionCoeff: 0.15,
      lagDays: 5,
      mechanism: 'Property management platform operational stress',
    },
    {
      target: 'firestorm',
      transmissionCoeff: 0.1,
      lagDays: 30,
      mechanism: 'Distressed portfolio assets become attractive targets for ransomware',
    },
  ],
  'prism-counsel': [
    {
      target: 'szl-holdings',
      transmissionCoeff: 0.9,
      lagDays: 3,
      mechanism: 'Litigation creates contingent liabilities and blocks strategic transactions',
    },
    {
      target: 'terra',
      transmissionCoeff: 0.7,
      lagDays: 10,
      mechanism: 'Property litigation clouds title and halts refinancing/disposition',
    },
    {
      target: 'vessels',
      transmissionCoeff: 0.55,
      lagDays: 7,
      mechanism: 'Admiralty claims and arrest orders ground fleet assets',
    },
    {
      target: 'firestorm',
      transmissionCoeff: 0.3,
      lagDays: 14,
      mechanism: 'Data breach litigation triggers security remediation requirements',
    },
    {
      target: 'lyte',
      transmissionCoeff: 0.2,
      lagDays: 5,
      mechanism: 'Compliance directives alter platform architecture requirements',
    },
  ],
  'szl-holdings': [
    {
      target: 'terra',
      transmissionCoeff: 0.8,
      lagDays: 5,
      mechanism: 'Capital allocation decisions directly affect property acquisition pipeline',
    },
    {
      target: 'vessels',
      transmissionCoeff: 0.75,
      lagDays: 3,
      mechanism: 'Portfolio stress triggers fleet financing covenant review',
    },
    {
      target: 'prism-counsel',
      transmissionCoeff: 0.65,
      lagDays: 7,
      mechanism: 'Financial distress increases likelihood of counterparty litigation',
    },
    {
      target: 'firestorm',
      transmissionCoeff: 0.4,
      lagDays: 14,
      mechanism: 'Cost pressure leads to security budget cuts, increasing vulnerability',
    },
    {
      target: 'lyte',
      transmissionCoeff: 0.5,
      lagDays: 7,
      mechanism: 'Portfolio stress triggers platform cost optimization pressure',
    },
  ],
  lyte: [
    {
      target: 'szl-holdings',
      transmissionCoeff: 0.55,
      lagDays: 2,
      mechanism: 'Platform reliability issues disrupt portfolio monitoring and reporting',
    },
    {
      target: 'terra',
      transmissionCoeff: 0.45,
      lagDays: 1,
      mechanism: 'Property management platform outages affect tenant operations',
    },
    {
      target: 'vessels',
      transmissionCoeff: 0.4,
      lagDays: 1,
      mechanism: 'Fleet management system degradation affects operational safety protocols',
    },
    {
      target: 'firestorm',
      transmissionCoeff: 0.35,
      lagDays: 0.5,
      mechanism: 'Platform anomalies trigger security incident investigation',
    },
    {
      target: 'prism-counsel',
      transmissionCoeff: 0.15,
      lagDays: 7,
      mechanism: 'Data availability issues affect legal discovery obligations',
    },
  ],
};

const _IMPACT_LEVELS: CascadeImpactLevel[] = [
  'negligible',
  'moderate',
  'significant',
  'severe',
  'catastrophic',
];

function classifyImpact(probability: number, transmissionCoeff: number): CascadeImpactLevel {
  const score = probability * transmissionCoeff;
  if (score >= 0.75) return 'catastrophic';
  if (score >= 0.55) return 'severe';
  if (score >= 0.35) return 'significant';
  if (score >= 0.15) return 'moderate';
  return 'negligible';
}

function horizonToDays(horizon: CascadeHorizon): number {
  const map: Record<CascadeHorizon, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
  return map[horizon];
}

function computeOverallRisk(nodes: CascadeNode[]): number {
  if (nodes.length === 0) return 0;
  const weights = {
    catastrophic: 1.0,
    severe: 0.75,
    significant: 0.5,
    moderate: 0.25,
    negligible: 0.05,
  };
  const total = nodes.reduce((s, n) => s + n.probability * weights[n.impactLevel], 0);
  return Math.min(1, total / nodes.length);
}

function buildMitigationOptions(domain: DomainKey, impactLevel: CascadeImpactLevel): string[] {
  const MITIGATIONS: Record<DomainKey, string[]> = {
    vessels: [
      'Immediate route deviation order to Helmsman agent',
      'Emergency bunker stop scheduling',
      'Flag state authority notification',
      'War risk insurance endorsement review',
    ],
    firestorm: [
      'Activate IR playbook — isolate affected systems',
      'Deploy Sentinel for TTP mapping',
      'Engage MSSP for 24/7 monitoring uplift',
      'Accelerate Zero Trust rollout',
    ],
    terra: [
      'Commission independent property appraisal',
      'Accelerate tenant retention program',
      'Review loan covenant compliance window',
      'Prepare lender amendment request',
    ],
    'prism-counsel': [
      'Engage litigation hold immediately',
      'Retain specialist counsel for cross-domain exposure',
      'Escalate to Carlota Jo for client advisory brief',
      'File protective motions to preserve strategic optionality',
    ],
    'szl-holdings': [
      'Activate portfolio stress protocol',
      'Engage credit facilities reserve drawdown review',
      'Brief investment committee — material risk update',
      'Prepare LP communication on exposure',
    ],
    lyte: [
      'Scale infrastructure capacity — prevent cascade failure',
      'Activate incident response runbook',
      'Enable circuit breakers on downstream integrations',
      'Spin up DR environment',
    ],
  };
  const options = MITIGATIONS[domain] ?? [];
  if (impactLevel === 'catastrophic' || impactLevel === 'severe') return options;
  return options.slice(0, 2);
}

export class PredictiveCascadeEngine {
  private predictiveAlerts: PredictiveAlert[] = [];
  private readonly MAX_ALERTS = 200;

  projectCascade(
    rootDomain: DomainKey,
    rootSignal: string,
    rootProbability: number,
    horizon: CascadeHorizon,
    _metadata?: Record<string, unknown>,
  ): CascadeTree {
    const maxDays = horizonToDays(horizon);
    const nodes: CascadeNode[] = [];
    const visitedDomains = new Set<DomainKey>([rootDomain]);

    const adjacencies = DOMAIN_ADJACENCY[rootDomain] ?? [];
    const filteredAdj = adjacencies.filter((a) => a.lagDays <= maxDays);

    for (const adj of filteredAdj) {
      if (visitedDomains.has(adj.target)) continue;
      visitedDomains.add(adj.target);

      const probability = rootProbability * adj.transmissionCoeff;
      const impactLevel = classifyImpact(probability, adj.transmissionCoeff);

      nodes.push({
        domain: adj.target,
        impactLevel,
        probability: Math.round(probability * 100) / 100,
        timeToImpactDays: adj.lagDays,
        mechanism: adj.mechanism,
        mitigationOptions: buildMitigationOptions(adj.target, impactLevel),
        evidenceBasis: [
          `${rootDomain} signal: ${rootSignal}`,
          `Transmission coefficient: ${adj.transmissionCoeff}`,
          `Historical pattern: ${rootDomain} → ${adj.target} cascade documented`,
        ],
      });

      if (probability > 0.4 && horizon === '90d') {
        const secondaryAdj = DOMAIN_ADJACENCY[adj.target] ?? [];
        for (const secAdj of secondaryAdj) {
          if (visitedDomains.has(secAdj.target)) continue;
          if (secAdj.lagDays + adj.lagDays > maxDays) continue;
          visitedDomains.add(secAdj.target);

          const secProbability = probability * secAdj.transmissionCoeff * 0.7;
          if (secProbability < 0.1) continue;

          nodes.push({
            domain: secAdj.target,
            impactLevel: classifyImpact(secProbability, secAdj.transmissionCoeff),
            probability: Math.round(secProbability * 100) / 100,
            timeToImpactDays: adj.lagDays + secAdj.lagDays,
            mechanism: `Secondary cascade: ${adj.target} → ${secAdj.target}. ${secAdj.mechanism}`,
            mitigationOptions: buildMitigationOptions(
              secAdj.target,
              classifyImpact(secProbability, secAdj.transmissionCoeff),
            ),
            evidenceBasis: [
              `Secondary cascade from ${adj.target}`,
              `Cumulative transmission: ${Math.round(secProbability * 100)}%`,
            ],
          });
        }
      }
    }

    nodes.sort((a, b) => {
      const levelOrder = { catastrophic: 0, severe: 1, significant: 2, moderate: 3, negligible: 4 };
      return (
        levelOrder[a.impactLevel] - levelOrder[b.impactLevel] ||
        a.timeToImpactDays - b.timeToImpactDays
      );
    });

    const overallRiskScore = computeOverallRisk(nodes);
    const criticalPath = nodes
      .filter((n) => n.impactLevel === 'catastrophic' || n.impactLevel === 'severe')
      .sort((a, b) => a.timeToImpactDays - b.timeToImpactDays)
      .map((n) => n.domain);

    const interventions: string[] = [];
    for (const node of nodes.slice(0, 3)) {
      if (node.mitigationOptions[0]) interventions.push(node.mitigationOptions[0]);
    }

    return {
      rootDomain,
      rootSignal,
      rootConfidence: rootProbability,
      generatedAt: new Date().toISOString(),
      horizon,
      nodes,
      overallRiskScore: Math.round(overallRiskScore * 100) / 100,
      criticalPath: [rootDomain, ...criticalPath],
      summary: this.buildSummary(rootDomain, rootSignal, nodes, overallRiskScore, horizon),
      recommendedInterventions: interventions,
    };
  }

  generatePredictiveAlert(
    title: string,
    triggerDomain: DomainKey,
    triggerSignal: string,
    confidence: number,
    horizon: CascadeHorizon = '30d',
    tags: string[] = [],
  ): PredictiveAlert {
    const tree = this.projectCascade(triggerDomain, triggerSignal, confidence, horizon);

    const severity =
      tree.overallRiskScore >= 0.7
        ? 'critical'
        : tree.overallRiskScore >= 0.5
          ? 'high'
          : tree.overallRiskScore >= 0.3
            ? 'medium'
            : 'low';

    const ttlMs =
      severity === 'critical'
        ? 24 * 3600000
        : severity === 'high'
          ? 72 * 3600000
          : 7 * 24 * 3600000;

    const alert: PredictiveAlert = {
      id: `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      summary: tree.summary,
      triggerDomain,
      triggerSignal,
      cascadeTree: tree,
      confidence,
      timeToMaterializedays: horizonToDays(horizon),
      severity,
      affectedDomains: [triggerDomain, ...tree.nodes.map((n) => n.domain)] as DomainKey[],
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
      status: 'active',
      tags: [...new Set(['predictive', 'cascade', triggerDomain, ...tags])],
    };

    this.predictiveAlerts.unshift(alert);
    if (this.predictiveAlerts.length > this.MAX_ALERTS) {
      this.predictiveAlerts = this.predictiveAlerts.slice(0, this.MAX_ALERTS);
    }

    return alert;
  }

  seedDemoAlerts(): void {
    const demos: Array<[string, DomainKey, string, number, CascadeHorizon, string[]]> = [
      [
        'Bunker Fuel Spike → Rate Pressure → Tenant Default Risk',
        'vessels',
        'Bunker fuel costs up 28% over 60 days across SZL fleet',
        0.82,
        '30d',
        ['fuel', 'macro', 'tenant'],
      ],
      [
        'APT41 OT Campaign → Fleet Disruption → Portfolio Cash Flow Impact',
        'firestorm',
        'APT41 Volt Typhoon targeting maritime OT infrastructure',
        0.88,
        '7d',
        ['apt41', 'ot', 'maritime'],
      ],
      [
        'Brooklyn Property Distress → PRISM Litigation Wave → SZL Holdings LTV Breach',
        'terra',
        'Brooklyn submarket showing 15% valuation decline — 47 properties flagged',
        0.76,
        '90d',
        ['property', 'brooklyn', 'ltv'],
      ],
    ];

    for (const [title, domain, signal, conf, horizon, tags] of demos) {
      this.generatePredictiveAlert(title, domain, signal, conf, horizon, tags);
    }
  }

  getAlerts(
    options: {
      status?: PredictiveAlert['status'][];
      severity?: PredictiveAlert['severity'][];
      domains?: DomainKey[];
      limit?: number;
    } = {},
  ): PredictiveAlert[] {
    let results = this.predictiveAlerts.filter((a) => new Date(a.expiresAt) > new Date());
    if (options.status?.length) results = results.filter((a) => options.status?.includes(a.status));
    if (options.severity?.length)
      results = results.filter((a) => options.severity?.includes(a.severity));
    if (options.domains?.length)
      results = results.filter((a) => a.affectedDomains.some((d) => options.domains?.includes(d)));
    return results.slice(0, options.limit ?? 50);
  }

  resolveAlert(id: string): boolean {
    const alert = this.predictiveAlerts.find((a) => a.id === id);
    if (!alert) return false;
    alert.status = 'resolved';
    return true;
  }

  private buildSummary(
    root: DomainKey,
    signal: string,
    nodes: CascadeNode[],
    riskScore: number,
    horizon: CascadeHorizon,
  ): string {
    const critical = nodes.filter(
      (n) => n.impactLevel === 'catastrophic' || n.impactLevel === 'severe',
    );
    const riskPct = Math.round(riskScore * 100);
    const domainList =
      critical.map((n) => n.domain).join(', ') ||
      nodes
        .slice(0, 2)
        .map((n) => n.domain)
        .join(', ');

    return (
      `Cascade analysis: ${signal} originating in ${root} domain projects ${riskPct}% aggregate risk score across ${nodes.length} downstream domains within ${horizon} window. ` +
      (critical.length > 0
        ? `Critical impact expected in: ${domainList}. Earliest materialization in ${Math.min(...critical.map((n) => n.timeToImpactDays))} day(s).`
        : `Moderate cascading effects in: ${domainList}.`)
    );
  }
}

export const predictiveCascadeEngine = new PredictiveCascadeEngine();
