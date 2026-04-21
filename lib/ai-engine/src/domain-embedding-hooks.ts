/**
 * Domain Embedding Hooks — bridges operational domain tables into the
 * knowledge graph + vector embedding pipeline.
 *
 * When domain entities (PRISM matters, Terra properties, Aegis incidents,
 * Carlota Jo services, Lyte systems) are created or updated, call the
 * appropriate hook to:
 *   1. Upsert the entity into kg_entities (dimension-aligned to 1024-dim BGE-M3)
 *   2. Schedule embedding generation via embedding_tasks queue
 *   3. Optionally ingest as an RAG document chunk for context retrieval
 *
 * All hooks are fire-and-forget (errors are logged, not thrown) so they
 * do not break the primary domain operation.
 */

import { getEmbeddingProvider, scheduleEmbeddingTask } from './embedding-pipeline.js';
import { upsertEntity, upsertRelationship } from './knowledge-graph.js';
import { ingestDocument } from './rag/knowledge-store.js';

// ─── Dimension Guard ──────────────────────────────────────────────────────────

const EXPECTED_EMBEDDING_DIM = 1024;

/**
 * Validates that the configured embedding model produces the expected number
 * of dimensions. Logs a clear error (not silent) if there is a mismatch so
 * operators know the system is misconfigured before data is corrupted.
 */
export function assertEmbeddingModelCompatibility(modelId?: string): void {
  const provider = getEmbeddingProvider(modelId);
  if (provider.dimensions !== EXPECTED_EMBEDDING_DIM) {
    throw new Error(
      `[domain-embedding-hooks] Embedding dimension mismatch: ` +
        `model="${provider.id}" produces ${provider.dimensions}-dim vectors, ` +
        `but database columns are vector(${EXPECTED_EMBEDDING_DIM}). ` +
        `Either configure HF_EMBED_MODEL to a ${EXPECTED_EMBEDDING_DIM}-dim model ` +
        `(e.g. BAAI/bge-m3) or run migration to resize the vector columns.`,
    );
  }
}

/**
 * Returns true if the configured model's dimension matches the DB schema.
 * Use this in health-check endpoints or startup checks.
 */
export function isEmbeddingModelCompatible(modelId?: string): boolean {
  try {
    assertEmbeddingModelCompatibility(modelId);
    return true;
  } catch {
    return false;
  }
}

// ─── PRISM Counsel — Legal Matter Hooks ──────────────────────────────────────

export interface PrismMatterSummary {
  id: number;
  orgId: number;
  title: string;
  matterType: string;
  status: string;
  jurisdiction?: string | null;
  notes?: string | null;
  caseNumber?: string | null;
}

/**
 * Ingest a PRISM legal matter into the knowledge graph and embedding pipeline.
 * Call this when a pc_matters row is created or updated.
 */
export async function ingestPrismMatter(
  matter: PrismMatterSummary,
  tenantId?: string,
): Promise<void> {
  try {
    const description = [
      `Matter Type: ${matter.matterType}`,
      `Status: ${matter.status}`,
      matter.jurisdiction ? `Jurisdiction: ${matter.jurisdiction}` : null,
      matter.caseNumber ? `Case: ${matter.caseNumber}` : null,
      matter.notes ?? null,
    ]
      .filter(Boolean)
      .join('. ');

    const entityId = await upsertEntity({
      name: matter.title,
      entityType: 'legal_matter',
      domain: 'prism',
      subDomain: matter.matterType,
      description,
      canonicalId: `prism_matter_${matter.id}`,
      sourceIds: [`pc_matters:${matter.id}:org:${matter.orgId}`],
      properties: {
        matterId: matter.id,
        orgId: matter.orgId,
        status: matter.status,
        matterType: matter.matterType,
        jurisdiction: matter.jurisdiction,
      },
      tenantId: tenantId ?? String(matter.orgId),
    });

    if (description && entityId) {
      await scheduleEmbeddingTask({
        targetTable: 'kg_entities',
        targetId: entityId,
        contentColumn: 'description',
        targetColumn: 'embedding',
        priority: 5,
      });
    }

    await ingestDocument({
      docId: `prism_matter_${matter.id}`,
      title: matter.title,
      content: description,
      domain: 'prism',
      sourceType: 'case_memory',
      tags: [matter.matterType, matter.status, 'legal_matter'],
      importance: 7,
      extraMetadata: { orgId: tenantId ?? String(matter.orgId) },
    });
  } catch (err) {
    console.error(`[domain-embedding-hooks] Failed to ingest PRISM matter id=${matter.id}:`, err);
  }
}

// ─── Terra Real Estate — Property Hooks ──────────────────────────────────────

export interface TerraPropertySummary {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode?: string | null;
  propertyType?: string | null;
  ownerName?: string | null;
  currentValue?: number | null;
}

/**
 * Ingest a Terra real estate property into the knowledge graph.
 * Call this when a terra_properties row is created or updated.
 */
export async function ingestTerraProperty(
  property: TerraPropertySummary,
  tenantId?: string,
): Promise<void> {
  if (!tenantId) {
    console.warn(
      `[domain-embedding-hooks] ingestTerraProperty skipped — no tenant context for property id=${property.id}. Global artifact creation is not permitted from route-level hooks.`,
    );
    return;
  }
  try {
    const description = [
      `Property at ${property.address}, ${property.city}, ${property.state}${property.zipCode ? ` ${property.zipCode}` : ''}`,
      property.propertyType ? `Type: ${property.propertyType}` : null,
      property.ownerName ? `Owner: ${property.ownerName}` : null,
      property.currentValue ? `Value: $${property.currentValue.toLocaleString()}` : null,
    ]
      .filter(Boolean)
      .join('. ');

    const entityId = await upsertEntity({
      name: `${property.address}, ${property.city}`,
      entityType: 'real_estate_property',
      domain: 'terra',
      ...(property.propertyType != null ? { subDomain: property.propertyType } : {}),
      description,
      canonicalId: `terra_property_${property.id}`,
      sourceIds: [`terra_properties:${property.id}`],
      properties: {
        propertyId: property.id,
        address: property.address,
        city: property.city,
        state: property.state,
        propertyType: property.propertyType,
        currentValue: property.currentValue,
      },
      tenantId,
    });

    if (description && entityId) {
      await scheduleEmbeddingTask({
        targetTable: 'kg_entities',
        targetId: entityId,
        contentColumn: 'description',
        targetColumn: 'embedding',
        priority: 5,
      });
    }

    await ingestDocument({
      docId: `terra_property_${property.id}`,
      title: `${property.address}, ${property.city}, ${property.state}`,
      content: description,
      domain: 'terra',
      sourceType: 'document',
      tags: ['real_estate', property.propertyType ?? 'property', property.state],
      importance: 6,
      ...(tenantId ? { extraMetadata: { orgId: tenantId } } : {}),
    });
  } catch (err) {
    console.error(
      `[domain-embedding-hooks] Failed to ingest Terra property id=${property.id}:`,
      err,
    );
  }
}

// ─── Aegis — Security Incident Hooks ─────────────────────────────────────────

export interface AegisIncidentSummary {
  id: string | number;
  title: string;
  incidentType: string;
  severity: string;
  description?: string | null;
  affectedSystems?: string[];
}

/**
 * Ingest an Aegis security incident into the knowledge graph.
 * Call this when a security incident is created or updated.
 */
export async function ingestAegisIncident(
  incident: AegisIncidentSummary,
  tenantId?: string,
): Promise<void> {
  if (!tenantId) {
    console.warn(
      `[domain-embedding-hooks] ingestAegisIncident skipped — no tenant context for incident id=${incident.id}`,
    );
    return;
  }
  try {
    const description = [
      `${incident.incidentType} incident — severity: ${incident.severity}`,
      incident.description ?? null,
      incident.affectedSystems?.length
        ? `Affected systems: ${incident.affectedSystems.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('. ');

    const entityId = await upsertEntity({
      name: incident.title,
      entityType: 'security_incident',
      domain: 'aegis',
      subDomain: incident.incidentType,
      description,
      canonicalId: `aegis_incident_${incident.id}`,
      sourceIds: [`aegis_incidents:${incident.id}`],
      confidence: incident.severity === 'critical' ? 1.0 : 0.85,
      properties: {
        incidentId: incident.id,
        incidentType: incident.incidentType,
        severity: incident.severity,
        affectedSystems: incident.affectedSystems ?? [],
      },
      tenantId,
    });

    if (description && entityId) {
      await scheduleEmbeddingTask({
        targetTable: 'kg_entities',
        targetId: entityId,
        contentColumn: 'description',
        targetColumn: 'embedding',
        priority: 2,
      });
    }

    await ingestDocument({
      docId: `aegis_incident_${incident.id}`,
      title: incident.title,
      content: description,
      domain: 'aegis',
      sourceType: 'incident',
      tags: [incident.incidentType, incident.severity, 'security'],
      importance: incident.severity === 'critical' ? 10 : 7,
      ...(tenantId ? { extraMetadata: { orgId: tenantId } } : {}),
    });
  } catch (err) {
    console.error(
      `[domain-embedding-hooks] Failed to ingest Aegis incident id=${incident.id}:`,
      err,
    );
  }
}

// ─── Carlota Jo — Consulting Service Hooks ───────────────────────────────────

export interface CarlotaServiceSummary {
  id: number;
  name: string;
  description?: string | null;
  tier?: string | null;
  category?: string | null;
}

/**
 * Ingest a Carlota Jo consulting service into the knowledge graph.
 * Call this when a carlota_services row is created or updated.
 */
export async function ingestCarlotaService(
  service: CarlotaServiceSummary,
  tenantId?: string,
): Promise<void> {
  if (!tenantId) {
    console.warn(
      `[domain-embedding-hooks] ingestCarlotaService skipped — no tenant context for service id=${service.id}`,
    );
    return;
  }
  try {
    const description = [
      service.description ?? `Consulting service: ${service.name}`,
      service.tier ? `Tier: ${service.tier}` : null,
      service.category ? `Category: ${service.category}` : null,
    ]
      .filter(Boolean)
      .join('. ');

    const entityId = await upsertEntity({
      name: service.name,
      entityType: 'consulting_service',
      domain: 'carlota_jo',
      ...(service.category != null ? { subDomain: service.category } : {}),
      description,
      canonicalId: `carlota_service_${service.id}`,
      sourceIds: [`carlota_services:${service.id}`],
      properties: {
        serviceId: service.id,
        tier: service.tier,
        category: service.category,
      },
      tenantId,
    });

    if (description && entityId) {
      await scheduleEmbeddingTask({
        targetTable: 'kg_entities',
        targetId: entityId,
        contentColumn: 'description',
        targetColumn: 'embedding',
        priority: 6,
      });
    }
  } catch (err) {
    console.error(
      `[domain-embedding-hooks] Failed to ingest Carlota Jo service id=${service.id}:`,
      err,
    );
  }
}

// ─── Lyte — System / Incident Hooks ──────────────────────────────────────────

export interface LyteSystemSummary {
  id: string | number;
  name: string;
  systemType: string;
  description?: string | null;
  health?: string | null;
  orgId?: number | null;
}

/**
 * Ingest a Lyte system or AIOps entity into the knowledge graph.
 */
export async function ingestLyteSystem(
  system: LyteSystemSummary,
  tenantId?: string,
): Promise<void> {
  const effectiveTenantId = tenantId ?? (system.orgId != null ? String(system.orgId) : undefined);
  if (!effectiveTenantId) {
    console.warn(
      `[domain-embedding-hooks] ingestLyteSystem skipped — no tenant context for system id=${system.id}`,
    );
    return;
  }
  try {
    const description = [
      `System type: ${system.systemType}`,
      system.description ?? null,
      system.health ? `Health: ${system.health}` : null,
    ]
      .filter(Boolean)
      .join('. ');

    const entityId = await upsertEntity({
      name: system.name,
      entityType: 'system',
      domain: 'lyte',
      subDomain: system.systemType,
      description,
      canonicalId: `lyte_system_${system.id}`,
      sourceIds: [`lyte_systems:${system.id}${system.orgId ? `:org:${system.orgId}` : ''}`],
      properties: {
        systemId: system.id,
        systemType: system.systemType,
        health: system.health,
        orgId: system.orgId,
      },
      tenantId: effectiveTenantId,
    });

    if (description && entityId) {
      await scheduleEmbeddingTask({
        targetTable: 'kg_entities',
        targetId: entityId,
        contentColumn: 'description',
        targetColumn: 'embedding',
        priority: 5,
      });
    }
  } catch (err) {
    console.error(`[domain-embedding-hooks] Failed to ingest Lyte system id=${system.id}:`, err);
  }
}

// ─── Aegis / Firestorm — Intelligence Findings, Scenarios, Alerts ────────────

export interface FirestormFindingSummary {
  id: number;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  category?: string | null;
  affectedAsset?: string | null;
  impact?: string | null;
  recommendation?: string | null;
}

export async function ingestFirestormFinding(
  finding: FirestormFindingSummary,
  tenantId?: string,
): Promise<void> {
  if (!tenantId) {
    console.warn(
      `[domain-embedding-hooks] ingestFirestormFinding skipped — no tenant context for finding id=${finding.id}`,
    );
    return;
  }
  try {
    const parts = [
      finding.description,
      finding.impact ? `Impact: ${finding.impact}` : null,
      finding.recommendation ? `Recommendation: ${finding.recommendation}` : null,
      finding.affectedAsset ? `Affected asset: ${finding.affectedAsset}` : null,
    ].filter(Boolean);
    const description = parts.join('. ') || `${finding.severity} finding: ${finding.title}`;

    const entityId = await upsertEntity({
      name: finding.title,
      entityType: 'security_finding',
      domain: 'aegis',
      subDomain: finding.category ?? 'finding',
      description,
      canonicalId: `firestorm_finding_${finding.id}`,
      sourceIds: [`firestorm_findings:${finding.id}`],
      confidence: finding.severity === 'critical' ? 1.0 : 0.8,
      properties: {
        findingId: finding.id,
        severity: finding.severity,
        status: finding.status,
        affectedAsset: finding.affectedAsset,
      },
      tenantId,
    });
    if (description && entityId) {
      await scheduleEmbeddingTask({
        targetTable: 'kg_entities',
        targetId: entityId,
        contentColumn: 'description',
        targetColumn: 'embedding',
        priority: 2,
      });
    }
    await ingestDocument({
      docId: `firestorm_finding_${finding.id}`,
      title: finding.title,
      content: description,
      domain: 'aegis',
      sourceType: 'security_finding',
      tags: [finding.severity, finding.status, 'firestorm', 'finding'],
      importance: finding.severity === 'critical' ? 10 : finding.severity === 'high' ? 8 : 5,
      ...(tenantId ? { extraMetadata: { orgId: tenantId } } : {}),
    });
  } catch (err) {
    console.error(
      `[domain-embedding-hooks] Failed to ingest Firestorm finding id=${finding.id}:`,
      err,
    );
  }
}

export interface FirestormScenarioSummary {
  id: number;
  name: string;
  description?: string | null;
  category: string;
  severity: string;
  attackVector?: string | null;
  mitreTechnique?: string | null;
}

export async function ingestFirestormScenario(
  scenario: FirestormScenarioSummary,
  tenantId?: string,
): Promise<void> {
  if (!tenantId) {
    console.warn(
      `[domain-embedding-hooks] ingestFirestormScenario skipped — no tenant context for scenario id=${scenario.id}`,
    );
    return;
  }
  try {
    const parts = [
      scenario.description,
      scenario.attackVector ? `Attack vector: ${scenario.attackVector}` : null,
      scenario.mitreTechnique ? `MITRE technique: ${scenario.mitreTechnique}` : null,
    ].filter(Boolean);
    const description =
      parts.join('. ') ||
      `${scenario.severity} ${scenario.category} threat scenario: ${scenario.name}`;

    const entityId = await upsertEntity({
      name: scenario.name,
      entityType: 'threat_scenario',
      domain: 'aegis',
      subDomain: scenario.category,
      description,
      canonicalId: `firestorm_scenario_${scenario.id}`,
      sourceIds: [`firestorm_scenarios:${scenario.id}`],
      confidence: 0.9,
      properties: {
        scenarioId: scenario.id,
        category: scenario.category,
        severity: scenario.severity,
        mitreTechnique: scenario.mitreTechnique,
      },
      tenantId,
    });
    if (description && entityId) {
      await scheduleEmbeddingTask({
        targetTable: 'kg_entities',
        targetId: entityId,
        contentColumn: 'description',
        targetColumn: 'embedding',
        priority: 3,
      });
    }
    await ingestDocument({
      docId: `firestorm_scenario_${scenario.id}`,
      title: scenario.name,
      content: description,
      domain: 'aegis',
      sourceType: 'threat_scenario',
      tags: [scenario.category, scenario.severity, 'firestorm', 'scenario'],
      importance: scenario.severity === 'critical' ? 9 : 6,
      ...(tenantId ? { extraMetadata: { orgId: tenantId } } : {}),
    });
  } catch (err) {
    console.error(
      `[domain-embedding-hooks] Failed to ingest Firestorm scenario id=${scenario.id}:`,
      err,
    );
  }
}

export interface FirestormAlertSummary {
  id: number;
  title: string;
  description?: string | null;
  severity: string;
  source: string;
  status: string;
  relatedCve?: string | null;
}

export async function ingestFirestormAlert(
  alert: FirestormAlertSummary,
  tenantId?: string,
): Promise<void> {
  if (!tenantId) {
    console.warn(
      `[domain-embedding-hooks] ingestFirestormAlert skipped — no tenant context for alert id=${alert.id}`,
    );
    return;
  }
  try {
    const parts = [
      alert.description,
      alert.relatedCve ? `Related CVE: ${alert.relatedCve}` : null,
      `Source: ${alert.source}`,
    ].filter(Boolean);
    const description = parts.join('. ') || `${alert.severity} security alert: ${alert.title}`;

    const entityId = await upsertEntity({
      name: alert.title,
      entityType: 'security_alert',
      domain: 'aegis',
      subDomain: alert.source,
      description,
      canonicalId: `firestorm_alert_${alert.id}`,
      sourceIds: [`firestorm_alerts:${alert.id}`],
      confidence: alert.severity === 'critical' ? 1.0 : 0.85,
      properties: {
        alertId: alert.id,
        severity: alert.severity,
        status: alert.status,
        relatedCve: alert.relatedCve,
        source: alert.source,
      },
      tenantId,
    });
    if (description && entityId) {
      await scheduleEmbeddingTask({
        targetTable: 'kg_entities',
        targetId: entityId,
        contentColumn: 'description',
        targetColumn: 'embedding',
        priority: 1,
      });
    }
    await ingestDocument({
      docId: `firestorm_alert_${alert.id}`,
      title: alert.title,
      content: description,
      domain: 'aegis',
      sourceType: 'security_alert',
      tags: [alert.severity, alert.source, 'firestorm', 'alert'],
      importance: alert.severity === 'critical' ? 10 : alert.severity === 'high' ? 8 : 6,
      ...(tenantId ? { extraMetadata: { orgId: tenantId } } : {}),
    });
  } catch (err) {
    console.error(`[domain-embedding-hooks] Failed to ingest Firestorm alert id=${alert.id}:`, err);
  }
}

// ─── Cross-Domain Relationship Hook ──────────────────────────────────────────

/**
 * Wire two domain entities together in the knowledge graph.
 * Example: link a PRISM matter to a Carlota Jo client.
 */
export async function linkDomainEntities(opts: {
  fromEntityId: string;
  toEntityId: string;
  fromDomain: string;
  toDomain: string;
  relationshipType: string;
  strength?: number;
  detectedBy?: string;
}): Promise<string | null> {
  try {
    return await upsertRelationship({
      fromEntityId: opts.fromEntityId,
      toEntityId: opts.toEntityId,
      fromDomain: opts.fromDomain,
      toDomain: opts.toDomain,
      relationshipType: opts.relationshipType,
      strength: opts.strength ?? 0.8,
      detectedBy: opts.detectedBy ?? 'domain_hook',
    });
  } catch (err) {
    console.error(`[domain-embedding-hooks] Failed to link entities:`, err);
    return null;
  }
}
