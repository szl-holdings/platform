/**
 * Fusion Engine — Cross-Domain Intelligence Correlation
 *
 * Monitors entity updates across all feeds and automatically identifies
 * convergence patterns:
 *   - Sanctioned entity + maritime activity + legal exposure
 *   - Threat actor + infrastructure + organizational target
 *   - OSINT signal + vessel position + property owner
 *
 * Generates "Fusion Alerts" — high-priority signals surfaced to Alloy
 * and routed to the relevant domain agents.
 */

import type {
  OntologyEntity,
  OntologyRelationship,
} from '@szl-holdings/ai-engine/ontology/ontology-engine';

export type FusionPatternType =
  | 'sanction_plus_maritime'
  | 'sanction_plus_legal'
  | 'sanction_plus_maritime_plus_legal'
  | 'threat_actor_plus_target'
  | 'vessel_dark_shipping_plus_sanction'
  | 'legal_exposure_plus_financial'
  | 'multi_domain_convergence'
  | 'ownership_chain_risk';

export interface FusionAlert {
  alertId: string;
  pattern: FusionPatternType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  involvedEntities: Array<{
    entityId: string;
    entityName: string;
    entityType: string;
    domain: string;
    riskScore?: number;
  }>;
  convergingDomains: string[];
  evidenceLinks: Array<{
    fromEntity: string;
    toEntity: string;
    relationship: string;
    significance: string;
  }>;
  actionableInsights: string[];
  recommendedAgents: string[];
  generatedAt: string;
  expiresAt: string;
}

export interface FusionEngineStats {
  totalAlertsGenerated: number;
  alertsByPattern: Record<FusionPatternType, number>;
  alertsBySeverity: Record<string, number>;
  lastRunAt: string | null;
  avgProcessingMs: number;
  monitoredEntityCount: number;
}

interface EntityUpdateEvent {
  entity: OntologyEntity;
  relationships: OntologyRelationship[];
  connectedEntities: OntologyEntity[];
  source: string;
}

const ALERT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ALERTS = 500;

export class FusionEngine {
  private alerts: FusionAlert[] = [];
  private processingTimes: number[] = [];
  private stats: FusionEngineStats = {
    totalAlertsGenerated: 0,
    alertsByPattern: {} as Record<FusionPatternType, number>,
    alertsBySeverity: {},
    lastRunAt: null,
    avgProcessingMs: 0,
    monitoredEntityCount: 0,
  };

  private alertCallbacks: Array<(alert: FusionAlert) => void | Promise<void>> = [];

  onAlert(callback: (alert: FusionAlert) => void | Promise<void>): void {
    this.alertCallbacks.push(callback);
  }

  private async emitAlert(alert: FusionAlert): Promise<void> {
    this.alerts.push(alert);
    if (this.alerts.length > MAX_ALERTS) {
      this.alerts = this.alerts.filter((a) => new Date(a.expiresAt) > new Date());
      if (this.alerts.length > MAX_ALERTS) {
        this.alerts = this.alerts.slice(-MAX_ALERTS);
      }
    }

    this.stats.totalAlertsGenerated++;
    this.stats.alertsByPattern[alert.pattern] =
      (this.stats.alertsByPattern[alert.pattern] ?? 0) + 1;
    this.stats.alertsBySeverity[alert.severity] =
      (this.stats.alertsBySeverity[alert.severity] ?? 0) + 1;

    for (const cb of this.alertCallbacks) {
      try {
        await cb(alert);
      } catch (_err) {
      }
    }
  }

  async processEntityUpdate(event: EntityUpdateEvent): Promise<FusionAlert[]> {
    const start = Date.now();
    const newAlerts: FusionAlert[] = [];

    try {
      const { entity, relationships, connectedEntities } = event;

      const detections = await Promise.allSettled([
        this.detectSanctionMaritimePattern(entity, relationships, connectedEntities),
        this.detectSanctionLegalPattern(entity, relationships, connectedEntities),
        this.detectThreatActorTargetPattern(entity, relationships, connectedEntities),
        this.detectDarkShippingSanctionPattern(entity, relationships, connectedEntities),
        this.detectMultiDomainConvergence(entity, relationships, connectedEntities),
        this.detectOwnershipChainRisk(entity, relationships, connectedEntities),
      ]);

      for (const result of detections) {
        if (result.status === 'fulfilled' && result.value) {
          newAlerts.push(result.value);
          await this.emitAlert(result.value);
        }
      }

      const durationMs = Date.now() - start;
      this.recordProcessingTime(durationMs);
      this.stats.lastRunAt = new Date().toISOString();
      this.stats.monitoredEntityCount++;
    } catch (_err) {
    }

    return newAlerts;
  }

  async processSubgraph(
    entities: OntologyEntity[],
    relationships: OntologyRelationship[],
    source = 'graph-ingestion',
  ): Promise<FusionAlert[]> {
    const allAlerts: FusionAlert[] = [];
    const entityMap = new Map(entities.map((e) => [e.id, e]));

    for (const entity of entities) {
      const entityRels = relationships.filter(
        (r) => r.fromEntityId === entity.id || r.toEntityId === entity.id,
      );
      const connected = entityRels
        .map((r) => {
          const otherId = r.fromEntityId === entity.id ? r.toEntityId : r.fromEntityId;
          return entityMap.get(otherId);
        })
        .filter((e): e is OntologyEntity => e !== undefined);

      const alerts = await this.processEntityUpdate({
        entity,
        relationships: entityRels,
        connectedEntities: connected,
        source,
      });
      allAlerts.push(...alerts);
    }

    return allAlerts;
  }

  private async detectSanctionMaritimePattern(
    entity: OntologyEntity,
    relationships: OntologyRelationship[],
    connected: OntologyEntity[],
  ): Promise<FusionAlert | null> {
    const isSanctioned = entity.tags?.includes('sanctioned') || entity.metadata?.sanctionSource;
    const isVessel = entity.type === 'vessel' || connected.some((e) => e.type === 'vessel');
    const hasMaritimeLink =
      entity.domain === 'vessels' || connected.some((e) => e.domain === 'vessels');

    if (!isSanctioned || !isVessel || !hasMaritimeLink) return null;

    const vessels = connected.filter((e) => e.type === 'vessel');
    const involvedEntities = [entity, ...vessels].map((e) => ({
      entityId: e.id,
      entityName: e.name,
      entityType: e.type,
      domain: e.domain,
      riskScore: e.riskScore,
    }));

    return this.buildAlert({
      pattern: 'sanction_plus_maritime',
      severity: 'critical',
      title: `Sanctioned Entity Maritime Activity: ${entity.name}`,
      description: `Sanctioned entity "${entity.name}" (${entity.metadata?.sanctionSource ?? 'unknown list'}) has documented maritime connections through ${vessels.length} vessel(s). Potential sanctions evasion via maritime activity.`,
      involvedEntities,
      convergingDomains: ['security', 'vessels'],
      evidenceLinks: relationships
        .filter((r) => connected.find((c) => c.id === r.fromEntityId || c.id === r.toEntityId))
        .slice(0, 5)
        .map((r) => ({
          fromEntity: r.fromEntityId,
          toEntity: r.toEntityId,
          relationship: r.type,
          significance: 'critical',
        })),
      actionableInsights: [
        `Escalate to Helmsman for maritime compliance review`,
        `Cross-reference vessel AIS history for dark shipping patterns`,
        `File enhanced due diligence report — potential OFAC violation`,
        `Alert Counsel for sanctions compliance advisory`,
      ],
      recommendedAgents: ['helmsman', 'lexis', 'sentinel'],
    });
  }

  private async detectSanctionLegalPattern(
    entity: OntologyEntity,
    relationships: OntologyRelationship[],
    connected: OntologyEntity[],
  ): Promise<FusionAlert | null> {
    const isSanctioned = entity.tags?.includes('sanctioned');
    const hasLegalExposure =
      entity.type === 'case' ||
      connected.some((e) => e.type === 'case') ||
      relationships.some((r) => r.type === 'litigates');

    if (!isSanctioned || !hasLegalExposure) return null;

    const cases = connected.filter((e) => e.type === 'case');
    return this.buildAlert({
      pattern: 'sanction_plus_legal',
      severity: 'high',
      title: `Sanctioned Entity + Active Litigation: ${entity.name}`,
      description: `Sanctioned entity "${entity.name}" is linked to ${cases.length} active legal case(s). Combined sanctions + litigation exposure creates compounded regulatory risk.`,
      involvedEntities: [entity, ...cases].map((e) => ({
        entityId: e.id,
        entityName: e.name,
        entityType: e.type,
        domain: e.domain,
        riskScore: e.riskScore,
      })),
      convergingDomains: ['security', 'legal'],
      evidenceLinks: relationships.slice(0, 5).map((r) => ({
        fromEntity: r.fromEntityId,
        toEntity: r.toEntityId,
        relationship: r.type,
        significance: 'high',
      })),
      actionableInsights: [
        'Route to Lexis for compound risk analysis',
        'Review counterparty exposure across all PRISM matters',
        'Check OFAC license requirements for ongoing matters',
      ],
      recommendedAgents: ['lexis', 'sentinel'],
    });
  }

  private async detectThreatActorTargetPattern(
    entity: OntologyEntity,
    relationships: OntologyRelationship[],
    connected: OntologyEntity[],
  ): Promise<FusionAlert | null> {
    const isThreat = entity.type === 'threat' && entity.domain === 'security';
    const hasTargets =
      relationships.some((r) => r.type === 'threatens') ||
      connected.some((e) => e.domain === 'maritime' || e.domain === 'financial');

    if (!isThreat || !hasTargets) return null;

    const targets = connected.filter((e) => e.domain !== 'security');
    if (targets.length === 0) return null;

    return this.buildAlert({
      pattern: 'threat_actor_plus_target',
      severity: 'high',
      title: `Threat Actor Targeting Cross-Domain Assets: ${entity.name}`,
      description: `Threat actor/indicator "${entity.name}" is linked to ${targets.length} target entities across ${new Set(targets.map((t) => t.domain)).size} domains. Cross-domain attack surface detected.`,
      involvedEntities: [entity, ...targets].map((e) => ({
        entityId: e.id,
        entityName: e.name,
        entityType: e.type,
        domain: e.domain,
        riskScore: e.riskScore,
      })),
      convergingDomains: [...new Set(['security', ...targets.map((t) => t.domain)])],
      evidenceLinks: relationships.slice(0, 5).map((r) => ({
        fromEntity: r.fromEntityId,
        toEntity: r.toEntityId,
        relationship: r.type,
        significance: 'high',
      })),
      actionableInsights: [
        'Dispatch Sentinel for immediate threat assessment',
        'Cross-reference MITRE ATT&CK for attack chain prediction',
        'Notify Zeus for infrastructure hardening review',
      ],
      recommendedAgents: ['sentinel', 'zeus', 'helmsman'],
    });
  }

  private async detectDarkShippingSanctionPattern(
    entity: OntologyEntity,
    relationships: OntologyRelationship[],
    connected: OntologyEntity[],
  ): Promise<FusionAlert | null> {
    if (entity.type !== 'vessel') return null;

    const meta = entity.metadata as Record<string, unknown>;
    const navStatus = meta?.navigationStatus as string | undefined;
    const hasAISGap = meta?.aisGapDetected as boolean | undefined;
    const isSanctionedVessel = entity.tags?.includes('sanctioned');
    const connectedToSanctioned = connected.some((e) => e.tags?.includes('sanctioned'));

    if (!hasAISGap && !isSanctionedVessel && !connectedToSanctioned) return null;
    if (navStatus && ['at_anchor', 'moored'].includes(navStatus)) return null;

    return this.buildAlert({
      pattern: 'vessel_dark_shipping_plus_sanction',
      severity: isSanctionedVessel ? 'critical' : 'high',
      title: `Dark Shipping + Sanctions Pattern: ${entity.name}`,
      description: `Vessel "${entity.name}" exhibits potential dark shipping characteristics${hasAISGap ? ' (AIS gap detected)' : ''} and ${isSanctionedVessel ? 'is directly sanctioned' : 'has connections to sanctioned entities'}.`,
      involvedEntities: [entity, ...connected.filter((e) => e.tags?.includes('sanctioned'))].map(
        (e) => ({
          entityId: e.id,
          entityName: e.name,
          entityType: e.type,
          domain: e.domain,
          riskScore: e.riskScore,
        }),
      ),
      convergingDomains: ['vessels', 'security'],
      evidenceLinks: relationships.slice(0, 5).map((r) => ({
        fromEntity: r.fromEntityId,
        toEntity: r.toEntityId,
        relationship: r.type,
        significance: 'critical',
      })),
      actionableInsights: [
        'Request enhanced AIS history analysis from Helmsman',
        'Submit port state control notification if in territorial waters',
        'Block cargo handling until OFAC clearance obtained',
        'File suspicious activity report (SAR)',
      ],
      recommendedAgents: ['helmsman', 'lexis', 'sentinel'],
    });
  }

  private async detectMultiDomainConvergence(
    entity: OntologyEntity,
    relationships: OntologyRelationship[],
    connected: OntologyEntity[],
  ): Promise<FusionAlert | null> {
    const domains = new Set([entity.domain, ...connected.map((e) => e.domain)]);
    if (domains.size < 3) return null;

    const avgRisk = connected
      .filter((e) => e.riskScore !== undefined)
      .reduce((s, e, _, a) => s + (e.riskScore ?? 0) / a.length, 0);

    if (avgRisk < 0.5 && (entity.riskScore ?? 0) < 0.6) return null;

    return this.buildAlert({
      pattern: 'multi_domain_convergence',
      severity: avgRisk > 0.8 ? 'critical' : 'high',
      title: `Multi-Domain Intelligence Convergence: ${entity.name}`,
      description: `Entity "${entity.name}" sits at the intersection of ${domains.size} domains: ${[...domains].join(', ')}. High-risk convergence pattern with avg risk score ${avgRisk.toFixed(2)}.`,
      involvedEntities: [entity, ...connected.slice(0, 8)].map((e) => ({
        entityId: e.id,
        entityName: e.name,
        entityType: e.type,
        domain: e.domain,
        riskScore: e.riskScore,
      })),
      convergingDomains: [...domains],
      evidenceLinks: relationships.slice(0, 8).map((r) => ({
        fromEntity: r.fromEntityId,
        toEntity: r.toEntityId,
        relationship: r.type,
        significance: 'high',
      })),
      actionableInsights: [
        'Route to FORGE for full cross-domain synthesis',
        'Assign to multi-agent investigation workflow',
        'Generate comprehensive intelligence briefing',
      ],
      recommendedAgents: ['alloy', ...this.domainToAgents([...domains])],
    });
  }

  private async detectOwnershipChainRisk(
    entity: OntologyEntity,
    relationships: OntologyRelationship[],
    connected: OntologyEntity[],
  ): Promise<FusionAlert | null> {
    const ownershipRels = relationships.filter(
      (r) => r.type === 'owns' || r.type === 'directs' || r.type === 'invests_in',
    );
    if (ownershipRels.length < 2) return null;

    const ownedEntities = connected.filter((e) => ownershipRels.some((r) => r.toEntityId === e.id));
    const hasHighRiskOwned = ownedEntities.some(
      (e) => (e.riskScore ?? 0) > 0.7 || e.tags?.includes('sanctioned'),
    );
    if (!hasHighRiskOwned) return null;

    return this.buildAlert({
      pattern: 'ownership_chain_risk',
      severity: 'high',
      title: `Ownership Chain Risk: ${entity.name}`,
      description: `Entity "${entity.name}" has a ${ownershipRels.length}-hop ownership chain containing high-risk entities. Potential UBO (Ultimate Beneficial Owner) concealment or indirect sanctions exposure.`,
      involvedEntities: [entity, ...ownedEntities].map((e) => ({
        entityId: e.id,
        entityName: e.name,
        entityType: e.type,
        domain: e.domain,
        riskScore: e.riskScore,
      })),
      convergingDomains: [...new Set([entity.domain, ...ownedEntities.map((e) => e.domain)])],
      evidenceLinks: ownershipRels.map((r) => ({
        fromEntity: r.fromEntityId,
        toEntity: r.toEntityId,
        relationship: r.type,
        significance: 'high',
      })),
      actionableInsights: [
        'Conduct beneficial ownership analysis',
        'Submit KYC escalation for ownership chain review',
        'Check all nodes against OFAC SDN and EU Consolidated lists',
        'Route to Atlas for financial exposure assessment',
      ],
      recommendedAgents: ['atlas', 'lexis', 'sentinel'],
    });
  }

  private buildAlert(
    params: Omit<FusionAlert, 'alertId' | 'generatedAt' | 'expiresAt'>,
  ): FusionAlert {
    return {
      alertId: `fusion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ALERT_TTL_MS).toISOString(),
      ...params,
    };
  }

  private domainToAgents(domains: string[]): string[] {
    const mapping: Record<string, string> = {
      vessels: 'helmsman',
      maritime: 'helmsman',
      security: 'sentinel',
      legal: 'lexis',
      financial: 'atlas',
      real_estate: 'terra',
      analytics: 'beacon',
      infrastructure: 'zeus',
      client_relations: 'nexus',
    };
    return [...new Set(domains.map((d) => mapping[d]).filter(Boolean))] as string[];
  }

  private recordProcessingTime(ms: number): void {
    this.processingTimes.push(ms);
    if (this.processingTimes.length > 1000) this.processingTimes.shift();
    this.stats.avgProcessingMs = Math.round(
      this.processingTimes.reduce((s, t) => s + t, 0) / this.processingTimes.length,
    );
  }

  getActiveAlerts(severity?: FusionAlert['severity']): FusionAlert[] {
    const now = new Date();
    const active = this.alerts.filter((a) => new Date(a.expiresAt) > now);
    return severity ? active.filter((a) => a.severity === severity) : active;
  }

  getStats(): FusionEngineStats {
    return { ...this.stats };
  }
}

export const fusionEngine = new FusionEngine();
