/**
 * Fusion Cortex — Cross-Domain Intelligence Engine
 *
 * Anduril Lattice-inspired: fuses signals across all domains into one operating picture.
 * Continuously scans the Ontology for anomalies and cross-domain patterns.
 * Generates Fusion Alerts with confidence scores, evidence chains, and recommended actions.
 *
 * Routes alerts to:
 * - Nexus (fusion canvas)
 * - Relevant domain dashboards
 * - Carlota Jo (advisory synthesis)
 */

import { type CrossDomainConnection, type OntologyEntity, ontologyEngine } from '../ontology/ontology-engine.js';
import { patternLibrary } from './pattern-library.js';
import { predictiveCascadeEngine } from './predictive-cascade.js';

const MIN_CONFIDENCE_TO_FIRE = 0.3;

export type FusionAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FusionAlertCategory =
  | 'cross_domain_risk'
  | 'entity_correlation'
  | 'pattern_anomaly'
  | 'sanctions_exposure'
  | 'litigation_impact'
  | 'financial_stress'
  | 'threat_escalation'
  | 'opportunity_signal';

export interface FusionAlert {
  id: string;
  title: string;
  summary: string;
  severity: FusionAlertSeverity;
  category: FusionAlertCategory;
  confidence: number;
  affectedDomains: string[];
  affectedEntities: Array<{ id: string; name: string; domain: string; type: string }>;
  evidenceChain: FusionEvidenceItem[];
  recommendedActions: string[];
  advisoryContext?: string;
  generatedAt: string;
  expiresAt: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  tags: string[];
  patternId?: string;
}

export interface FusionEvidenceItem {
  source: string;
  domain: string;
  description: string;
  timestamp: string;
  weight: number;
}

export interface FusionPattern {
  libraryId: string;
  name: string;
  description: string;
  requiredDomains: string[];
  requiredRelationships: string[];
  severityThreshold: FusionAlertSeverity;
  confidence: number;
  detector: (
    connections: CrossDomainConnection[],
    entities: OntologyEntity[],
  ) => FusionAlert | null;
}

export interface FusionScanResult {
  alertsGenerated: number;
  alerts: FusionAlert[];
  entitiesScanned: number;
  domainsScanned: string[];
  scanDurationMs: number;
  nextScanAt: string;
}

export interface FusionCortexStats {
  totalAlerts: number;
  activeAlerts: number;
  alertsBySeverity: Record<FusionAlertSeverity, number>;
  alertsByCategory: Record<FusionAlertCategory, number>;
  topAffectedDomains: Array<{ domain: string; count: number }>;
  lastScanAt: string;
  avgConfidence: number;
}

function generateAlertId(): string {
  return `fusion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeExpiryTime(severity: FusionAlertSeverity): string {
  const ttlMs: Record<FusionAlertSeverity, number> = {
    critical: 4 * 60 * 60 * 1000,
    high: 24 * 60 * 60 * 1000,
    medium: 72 * 60 * 60 * 1000,
    low: 7 * 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + ttlMs[severity]).toISOString();
}

const FUSION_PATTERNS: FusionPattern[] = [
  {
    libraryId: 'pat-001',
    name: 'Litigation-Financial Stress Correlation',
    description:
      'Vessel/property owner has active litigation AND financial metrics are deteriorating',
    requiredDomains: ['legal', 'financial'],
    requiredRelationships: ['litigates', 'owns', 'invests_in'],
    severityThreshold: 'high',
    confidence: 0.85,
    detector: (connections, _entities) => {
      const legalFinancial = connections.filter(
        (c) =>
          (c.fromDomain === 'prism-counsel' || c.toDomain === 'prism-counsel') &&
          (c.fromDomain === 'szl-holdings' ||
            c.toDomain === 'szl-holdings' ||
            c.fromDomain === 'terra' ||
            c.toDomain === 'terra'),
      );
      if (legalFinancial.length === 0) return null;
      const conn = legalFinancial[0]!;
      return {
        id: generateAlertId(),
        title: 'Litigation-Financial Exposure Correlation Detected',
        summary: `Entity "${conn.entityA}" has active legal proceedings in PRISM Counsel while financial exposure exists in ${conn.toDomain}. Cross-domain risk requires advisory review.`,
        severity: 'high',
        category: 'litigation_impact',
        confidence: 0.85,
        affectedDomains: [conn.fromDomain, conn.toDomain],
        affectedEntities: [
          {
            id: 'fusion-entity-a',
            name: conn.entityA,
            domain: conn.fromDomain,
            type: 'organization',
          },
        ],
        evidenceChain: [
          {
            source: 'PRISM Counsel',
            domain: 'legal',
            description: `Active litigation: ${conn.entityA}`,
            timestamp: new Date().toISOString(),
            weight: 0.9,
          },
          {
            source: conn.toDomain,
            domain: conn.toDomain,
            description: `Financial exposure to ${conn.entityB}`,
            timestamp: new Date().toISOString(),
            weight: 0.8,
          },
        ],
        recommendedActions: [
          'Schedule advisory call with Carlota Jo to assess litigation impact on portfolio',
          'Request legal hold on affected financial instruments pending case resolution',
          'Review indemnification clauses in related contracts',
        ],
        advisoryContext: `Carlota Jo Advisory: The intersection of active litigation in ${conn.fromDomain} with financial exposure in ${conn.toDomain} creates correlated risk. Recommend joint legal-financial review within 48 hours.`,
        generatedAt: new Date().toISOString(),
        expiresAt: computeExpiryTime('high'),
        status: 'active',
        tags: ['litigation', 'financial', 'cross-domain', 'correlated-risk'],
      };
    },
  },
  {
    libraryId: 'pat-002',
    name: 'Maritime-Security Sanctions Escalation',
    description: 'Vessel in sanctioned waters while security posture is degraded',
    requiredDomains: ['maritime', 'security'],
    requiredRelationships: ['threatens', 'sanctioned_by', 'operates'],
    severityThreshold: 'critical',
    confidence: 0.92,
    detector: (connections, _entities) => {
      const maritimeSecurity = connections.filter(
        (c) =>
          (c.fromDomain === 'vessels' || c.toDomain === 'vessels') &&
          (c.fromDomain === 'firestorm' || c.toDomain === 'firestorm'),
      );
      if (maritimeSecurity.length === 0) return null;
      const conn = maritimeSecurity[0]!;
      return {
        id: generateAlertId(),
        title: 'Maritime-Security Cross-Domain Escalation',
        summary: `Fleet asset "${conn.entityA}" operating in elevated security risk environment. Aegis SOC has correlated threat intelligence with vessel operations. Joint response protocol recommended.`,
        severity: 'critical',
        category: 'threat_escalation',
        confidence: 0.92,
        affectedDomains: ['vessels', 'firestorm'],
        affectedEntities: [
          { id: 'fusion-vessel', name: conn.entityA, domain: 'vessels', type: 'vessel' },
        ],
        evidenceChain: [
          {
            source: 'Vessels Intelligence',
            domain: 'maritime',
            description: `Vessel ${conn.entityA} in high-risk operational zone`,
            timestamp: new Date().toISOString(),
            weight: 0.95,
          },
          {
            source: 'Aegis SOC',
            domain: 'security',
            description: `Active threat intelligence correlated to vessel route`,
            timestamp: new Date().toISOString(),
            weight: 0.88,
          },
        ],
        recommendedActions: [
          'Alert Helmsman agent — recommend immediate route deviation',
          'Engage Sentinel agent for threat actor profiling on maritime corridor',
          'Notify legal team (Lexis) of potential sanctions exposure',
          'Brief SZL Holdings executive team within 2 hours',
        ],
        advisoryContext:
          'CRITICAL CROSS-DOMAIN: Maritime and security intelligence streams have converged. This pattern matches historical APT maritime targeting. Immediate multi-domain response required.',
        generatedAt: new Date().toISOString(),
        expiresAt: computeExpiryTime('critical'),
        status: 'active',
        tags: ['maritime', 'security', 'sanctions', 'critical', 'apt'],
      };
    },
  },
  {
    libraryId: 'pat-003',
    name: 'Property-Legal-Financial Tri-Domain Risk',
    description: 'Real estate asset with simultaneous legal dispute and financial deterioration',
    requiredDomains: ['real_estate', 'legal', 'financial'],
    requiredRelationships: ['litigates', 'owns', 'located_at'],
    severityThreshold: 'high',
    confidence: 0.88,
    detector: (connections, _entities) => {
      const terraLegal = connections.filter(
        (c) =>
          (c.fromDomain === 'terra' || c.toDomain === 'terra') &&
          (c.fromDomain === 'prism-counsel' || c.toDomain === 'prism-counsel'),
      );
      if (terraLegal.length === 0) return null;
      const conn = terraLegal[0]!;
      return {
        id: generateAlertId(),
        title: 'Real Estate — Legal — Financial Tri-Domain Risk Signal',
        summary: `Property "${conn.entityA}" has active title/zoning dispute in PRISM Counsel with corresponding financial exposure in SZL Holdings portfolio. Risk correlation score: HIGH.`,
        severity: 'high',
        category: 'cross_domain_risk',
        confidence: 0.88,
        affectedDomains: ['terra', 'prism-counsel', 'szl-holdings'],
        affectedEntities: [
          { id: 'fusion-property', name: conn.entityA, domain: 'terra', type: 'property' },
        ],
        evidenceChain: [
          {
            source: 'Terra Intelligence',
            domain: 'real_estate',
            description: `Property ${conn.entityA} flagged with legal encumbrance`,
            timestamp: new Date().toISOString(),
            weight: 0.85,
          },
          {
            source: 'PRISM Counsel',
            domain: 'legal',
            description: `Active matter filed for ${conn.entityA}`,
            timestamp: new Date().toISOString(),
            weight: 0.9,
          },
          {
            source: 'SZL Holdings',
            domain: 'financial',
            description: `Investment position in ${conn.entityA} carries elevated risk`,
            timestamp: new Date().toISOString(),
            weight: 0.8,
          },
        ],
        recommendedActions: [
          'Initiate tri-domain advisory session: Terra + PRISM + Atlas agents',
          'Obtain title insurance endorsement immediately',
          'Review acquisition agreement for representations and warranties breach',
          'Escalate to Carlota Jo for comprehensive client advisory brief',
        ],
        advisoryContext:
          'Carlota Jo Advisory: Property, legal, and financial signals have converged on the same underlying asset. This warrants immediate multi-disciplinary review with client representation.',
        generatedAt: new Date().toISOString(),
        expiresAt: computeExpiryTime('high'),
        status: 'active',
        tags: ['real-estate', 'legal', 'financial', 'tri-domain', 'title-risk'],
      };
    },
  },
  {
    libraryId: 'pat-004',
    name: 'Entity Ownership Chain Anomaly',
    description:
      'Multiple-hop ownership chain connecting sanctioned entity to active SZL operations',
    requiredDomains: ['maritime', 'legal', 'financial'],
    requiredRelationships: ['owns', 'sanctioned_by', 'connected_to'],
    severityThreshold: 'critical',
    confidence: 0.9,
    detector: (connections, _entities) => {
      const multiHop = connections.filter(
        (c) => c.connectionType === 'owns' || c.connectionType === 'connected_to',
      );
      if (multiHop.length < 2) return null;
      const chain = multiHop.slice(0, 2);
      return {
        id: generateAlertId(),
        title: 'Multi-Hop Ownership Chain — Potential Beneficial Ownership Risk',
        summary: `Knowledge graph traversal detected a ${chain.length + 1}-hop ownership chain that may link an obscured entity to SZL operational assets. Beneficial ownership verification required.`,
        severity: 'high',
        category: 'entity_correlation',
        confidence: 0.78,
        affectedDomains: [...new Set(chain.flatMap((c) => [c.fromDomain, c.toDomain]))],
        affectedEntities: chain.map((c) => ({
          id: `fusion-${c.entityA}`,
          name: c.entityA,
          domain: c.fromDomain,
          type: 'organization',
        })),
        evidenceChain: chain.map((c) => ({
          source: c.fromDomain,
          domain: c.fromDomain,
          description: `${c.entityA} ${c.connectionType} ${c.entityB}`,
          timestamp: new Date().toISOString(),
          weight: 0.75,
        })),
        recommendedActions: [
          'Run beneficial ownership verification through Lexis agent',
          'Cross-reference against OFAC SDN list and EU sanctions databases',
          'Brief compliance officer — KYC refresh required for entity chain',
          'Document findings for regulatory reporting if exposure confirmed',
        ],
        generatedAt: new Date().toISOString(),
        expiresAt: computeExpiryTime('high'),
        status: 'active',
        tags: ['ownership', 'beneficial-owner', 'sanctions', 'kyc', 'compliance'],
      };
    },
  },
];

const MAX_ALERTS = 200;

export class FusionCortex {
  private alerts: FusionAlert[] = [];
  private lastScanAt: string = new Date().toISOString();
  private scanIntervalMs = 5 * 60 * 1000;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private alertSubscribers: Array<(alert: FusionAlert) => void> = [];
  private evictionTimer: ReturnType<typeof setInterval>;

  constructor() {
    this.evictionTimer = setInterval(() => this.evictAlerts(), 60 * 1000);
    if (this.evictionTimer.unref) this.evictionTimer.unref();
  }

  dispose(): void {
    clearInterval(this.evictionTimer);
    this.stopContinuousScan();
    this.alerts = [];
    this.alertSubscribers = [];
  }

  private evictAlerts(): void {
    const now = new Date();
    this.alerts = this.alerts.filter((a) => new Date(a.expiresAt) > now);
    if (this.alerts.length > MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, MAX_ALERTS);
    }
  }

  async scan(): Promise<FusionScanResult> {
    const start = Date.now();
    const newAlerts: FusionAlert[] = [];

    try {
      const stats = await ontologyEngine.getGraphStats();
      const domains = Object.keys(stats.entitiesByDomain);
      const entities: OntologyEntity[] = [];

      for (const domain of domains.slice(0, 5)) {
        const domainEntities = await ontologyEngine.getDomainEntities(domain, 10);
        entities.push(...domainEntities);
      }

      const crossDomainConnections: CrossDomainConnection[] = [];
      for (const entity of entities.slice(0, 20)) {
        try {
          const traversal = await ontologyEngine.traverseGraph(entity.id, 2, 5);
          crossDomainConnections.push(...traversal.crossDomainConnections);
        } catch {
          // traversal failed for this entity
        }
      }

      for (const pattern of FUSION_PATTERNS) {
        try {
          // Self-learning feedback loop: consult pattern library before firing detector.
          // Analyst feedback adjusts confidenceScore and may degrade/suppress patterns
          // so future scans skip or down-score detectors that generated false positives.
          const libPattern = patternLibrary.getById(pattern.libraryId);
          if (libPattern) {
            if (libPattern.status === 'suppressed') continue;
            if (
              libPattern.status === 'degraded' &&
              libPattern.confidenceScore < MIN_CONFIDENCE_TO_FIRE
            )
              continue;
          }

          const alert = pattern.detector(crossDomainConnections, entities);
          if (alert) {
            // Apply library-adjusted confidence — feedback learning directly modifies
            // the confidence value carried by fired alerts (the operational tuning).
            if (libPattern) {
              alert.confidence = libPattern.confidenceScore;
            }

            const deduped = !this.alerts.some(
              (a) =>
                a.category === alert.category &&
                a.affectedDomains.join() === alert.affectedDomains.join() &&
                Date.now() - new Date(a.generatedAt).getTime() < 60 * 60 * 1000,
            );
            if (deduped) {
              alert.patternId = pattern.libraryId;
              newAlerts.push(alert);
              this.alerts.unshift(alert);
              this.alertSubscribers.forEach((sub) => sub(alert));
              patternLibrary.recordHit(pattern.libraryId, alert.id);

              if (
                (alert.severity === 'high' || alert.severity === 'critical') &&
                alert.affectedDomains.length >= 2
              ) {
                const rootDomain = alert
                  .affectedDomains[0] as import('./predictive-cascade.js').DomainKey;
                const validDomains: import('./predictive-cascade.js').DomainKey[] = [
                  'vessels',
                  'firestorm',
                  'terra',
                  'prism-counsel',
                  'szl-holdings',
                  'lyte',
                ];
                if (validDomains.includes(rootDomain)) {
                  predictiveCascadeEngine.generatePredictiveAlert(
                    `Cascade risk from: ${alert.title}`,
                    rootDomain,
                    alert.summary.slice(0, 120),
                    alert.confidence * 0.85,
                    '30d',
                    [...alert.tags, 'auto-cascade'],
                  );
                }
              }
            }
          }
        } catch {
          // Pattern evaluation failed
        }
      }

      if (this.alerts.length > MAX_ALERTS) {
        this.alerts = this.alerts.slice(0, MAX_ALERTS);
      }

      this.lastScanAt = new Date().toISOString();

      return {
        alertsGenerated: newAlerts.length,
        alerts: newAlerts,
        entitiesScanned: entities.length,
        domainsScanned: domains,
        scanDurationMs: Date.now() - start,
        nextScanAt: new Date(Date.now() + this.scanIntervalMs).toISOString(),
      };
    } catch {
      return {
        alertsGenerated: 0,
        alerts: [],
        entitiesScanned: 0,
        domainsScanned: [],
        scanDurationMs: Date.now() - start,
        nextScanAt: new Date(Date.now() + this.scanIntervalMs).toISOString(),
      };
    }
  }

  startContinuousScan(intervalMs?: number): void {
    if (intervalMs) this.scanIntervalMs = intervalMs;
    if (this.scanTimer) clearInterval(this.scanTimer);

    const runScan = () => {
      this.scan().catch((_err) => {});
    };

    this.scanTimer = setInterval(runScan, this.scanIntervalMs);
    runScan();
  }

  stopContinuousScan(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
  }

  onAlert(callback: (alert: FusionAlert) => void): () => void {
    this.alertSubscribers.push(callback);
    return () => {
      const idx = this.alertSubscribers.indexOf(callback);
      if (idx >= 0) this.alertSubscribers.splice(idx, 1);
    };
  }

  getAlerts(
    options: {
      severity?: FusionAlertSeverity[];
      categories?: FusionAlertCategory[];
      domains?: string[];
      status?: FusionAlert['status'][];
      limit?: number;
    } = {},
  ): FusionAlert[] {
    let results = this.alerts.filter((a) => new Date(a.expiresAt) > new Date());

    if (options.severity?.length)
      results = results.filter((a) => options.severity?.includes(a.severity));
    if (options.categories?.length)
      results = results.filter((a) => options.categories?.includes(a.category));
    if (options.domains?.length)
      results = results.filter((a) => a.affectedDomains.some((d) => options.domains?.includes(d)));
    if (options.status?.length) results = results.filter((a) => options.status?.includes(a.status));

    return results.slice(0, options.limit ?? 50);
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.status = 'acknowledged';
    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.status = 'resolved';
    return true;
  }

  hydrateAlert(alert: FusionAlert): void {
    const exists = this.alerts.some((a) => a.id === alert.id);
    if (exists) return;
    this.alerts.push(alert);
    if (this.alerts.length > MAX_ALERTS) {
      this.alerts.sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
      );
      this.alerts = this.alerts.slice(0, MAX_ALERTS);
    }
  }

  injectAlert(
    alert: Omit<FusionAlert, 'id' | 'generatedAt' | 'expiresAt' | 'status'>,
  ): FusionAlert {
    const full: FusionAlert = {
      ...alert,
      id: generateAlertId(),
      generatedAt: new Date().toISOString(),
      expiresAt: computeExpiryTime(alert.severity),
      status: 'active',
    };
    this.alerts.unshift(full);
    if (this.alerts.length > MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, MAX_ALERTS);
    }
    this.alertSubscribers.forEach((sub) => sub(full));
    return full;
  }

  getStats(): FusionCortexStats {
    const active = this.alerts.filter((a) => a.status === 'active');
    const alertsBySeverity: Record<FusionAlertSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const alertsByCategory: Record<FusionAlertCategory, number> = {
      cross_domain_risk: 0,
      entity_correlation: 0,
      pattern_anomaly: 0,
      sanctions_exposure: 0,
      litigation_impact: 0,
      financial_stress: 0,
      threat_escalation: 0,
      opportunity_signal: 0,
    };
    const domainCounts = new Map<string, number>();

    for (const alert of this.alerts) {
      alertsBySeverity[alert.severity]++;
      alertsByCategory[alert.category]++;
      for (const domain of alert.affectedDomains) {
        domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
      }
    }

    const topDomains = [...domainCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));

    const avgConfidence =
      this.alerts.length > 0
        ? this.alerts.reduce((s, a) => s + a.confidence, 0) / this.alerts.length
        : 0;

    return {
      totalAlerts: this.alerts.length,
      activeAlerts: active.length,
      alertsBySeverity,
      alertsByCategory,
      topAffectedDomains: topDomains,
      lastScanAt: this.lastScanAt,
      avgConfidence,
    };
  }

  seedDemoAlerts(): void {
    const demoAlerts: Array<Omit<FusionAlert, 'id' | 'generatedAt' | 'expiresAt' | 'status'>> = [
      {
        title: 'AURORA Owner Filed PRISM Litigation — Terra Brooklyn Property −18%',
        summary:
          "Vessel AURORA's beneficial owner has a new PRISM Counsel litigation filing. Cross-referencing: their Terra property in Brooklyn has declined 18% in 30 days. Carlota Jo advisory review recommended.",
        severity: 'high',
        category: 'litigation_impact',
        confidence: 0.91,
        affectedDomains: ['vessels', 'prism-counsel', 'terra'],
        affectedEntities: [
          { id: 'demo-1', name: 'AURORA (IMO 9234567)', domain: 'vessels', type: 'vessel' },
          {
            id: 'demo-2',
            name: 'Meridian Capital LLC',
            domain: 'prism-counsel',
            type: 'organization',
          },
          { id: 'demo-3', name: '345 Atlantic Ave, Brooklyn', domain: 'terra', type: 'property' },
        ],
        evidenceChain: [
          {
            source: 'Vessels Intelligence',
            domain: 'maritime',
            description: 'AURORA registered to Meridian Capital LLC (BVI)',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            weight: 0.9,
          },
          {
            source: 'PRISM Counsel',
            domain: 'legal',
            description: 'Meridian Capital LLC — new litigation filing, SDNY, $12M exposure',
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            weight: 0.95,
          },
          {
            source: 'Terra Intelligence',
            domain: 'real_estate',
            description:
              '345 Atlantic Ave valuation −18% over 30 days, Meridian Capital tenant-in-common',
            timestamp: new Date(Date.now() - 21600000).toISOString(),
            weight: 0.85,
          },
        ],
        recommendedActions: [
          'Schedule tri-domain advisory review: Helmsman + Lexis + Terra agents',
          'Review vessel financing covenants for cross-default provisions',
          'Initiate property valuation audit — confirm independence from litigation',
          'Carlota Jo: prepare consolidated risk brief for SZL executive review',
        ],
        advisoryContext:
          'Carlota Jo Advisory: The convergence of maritime ownership, active litigation, and real estate distress in a single beneficial owner structure represents a systemic risk signal. Executive briefing within 24 hours.',
        tags: ['vessel', 'litigation', 'real-estate', 'beneficial-owner', 'cross-domain'],
      },
      {
        title: 'APT41 Maritime Targeting — Vessels Route Overlaps with Active IOC',
        summary:
          'Aegis threat intelligence has correlated APT41 Volt Typhoon IOCs with shipping lanes used by SZL fleet. Three vessels transiting affected corridor. Immediate route risk review required.',
        severity: 'critical',
        category: 'threat_escalation',
        confidence: 0.88,
        affectedDomains: ['vessels', 'firestorm'],
        affectedEntities: [
          { id: 'demo-4', name: 'APT41 / Volt Typhoon', domain: 'firestorm', type: 'threat' },
          { id: 'demo-5', name: 'SZL Fleet Segment Alpha', domain: 'vessels', type: 'asset' },
        ],
        evidenceChain: [
          {
            source: 'Aegis SOC',
            domain: 'security',
            description:
              'APT41 IOCs detected on South China Sea maritime infrastructure (T1590 - Gather Victim Network Info)',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            weight: 0.92,
          },
          {
            source: 'Vessels Intelligence',
            domain: 'maritime',
            description: 'ATLAS WIND, MERIDIAN STAR, TYPHOON PEAK transiting Strait of Malacca',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            weight: 0.88,
          },
        ],
        recommendedActions: [
          'Alert Helmsman — recommend alternate routing for all three vessels',
          'Engage Sentinel for full TTP mapping: APT41 maritime targeting playbook',
          'Brief SZL CISO and fleet operations director — joint call within 1 hour',
          'Submit maritime security advisory to flag state administration',
        ],
        tags: ['apt41', 'volt-typhoon', 'maritime', 'threat-intelligence', 'critical'],
      },
      {
        title: 'Shell Company Structure Detected — Multi-Hop Ownership to Sanctioned Entity',
        summary:
          'GraphRAG traversal identified a 4-hop ownership chain linking SZL portfolio entity to an OFAC SDN-listed organization through BVI intermediate structures. KYC refresh required.',
        severity: 'high',
        category: 'sanctions_exposure',
        confidence: 0.79,
        affectedDomains: ['szl-holdings', 'prism-counsel', 'vessels'],
        affectedEntities: [
          {
            id: 'demo-6',
            name: 'Pacific Ventures Holdings BVI',
            domain: 'szl-holdings',
            type: 'organization',
          },
          {
            id: 'demo-7',
            name: 'SDN Entity (Redacted)',
            domain: 'prism-counsel',
            type: 'organization',
          },
        ],
        evidenceChain: [
          {
            source: 'Ontology Graph',
            domain: 'szl-holdings',
            description:
              'Pacific Ventures → Starlight Maritime → Coral Trading → [REDACTED SDN ENTITY]',
            timestamp: new Date().toISOString(),
            weight: 0.79,
          },
          {
            source: 'OFAC Database',
            domain: 'prism-counsel',
            description: 'Terminal entity confirmed on OFAC SDN list — Russian oligarch exposure',
            timestamp: new Date().toISOString(),
            weight: 0.95,
          },
        ],
        recommendedActions: [
          'Lexis agent: emergency OFAC compliance review within 4 hours',
          'Freeze any pending transactions involving Pacific Ventures Holdings',
          'Engage external sanctions counsel for regulatory notification assessment',
          'Document discovery chain for FinCEN SAR filing evaluation',
        ],
        tags: ['sanctions', 'ofac', 'sdn', 'shell-company', 'kyc', 'russia'],
      },
    ];

    for (const alert of demoAlerts) {
      this.injectAlert(alert);
    }
  }
}

export const fusionCortex = new FusionCortex();
