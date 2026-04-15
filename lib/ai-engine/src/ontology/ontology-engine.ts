/**
 * Unified Ontology Engine — Knowledge Graph Core
 *
 * Palantir-inspired entity-relationship graph for the SZL Intelligence OS.
 * Entities: Person, Organization, Vessel, Property, Case, Threat, Signal, Asset
 * Relationships: owns, operates, litigates, threatens, located_at, connected_to,
 *                sanctioned_by, employed_by, directs, invests_in
 *
 * Supports multi-hop traversal for cross-domain reasoning.
 */

import { db } from "@szl-holdings/db";
import {
  entitiesTable,
  entityRelationshipsTable,
} from "@szl-holdings/db";
import { eq, and, inArray, sql, or } from "drizzle-orm";

export type OntologyEntityType =
  | "person"
  | "organization"
  | "vessel"
  | "property"
  | "case"
  | "threat"
  | "signal"
  | "asset"
  | "port"
  | "jurisdiction";

export type RelationshipType =
  | "owns"
  | "operates"
  | "litigates"
  | "threatens"
  | "located_at"
  | "connected_to"
  | "sanctioned_by"
  | "employed_by"
  | "directs"
  | "invests_in"
  | "registered_in"
  | "affiliated_with"
  | "monitors"
  | "exposes";

export interface OntologyEntity {
  id: string;
  type: OntologyEntityType;
  name: string;
  domain: string;
  metadata: Record<string, unknown>;
  tags: string[];
  riskScore?: number;
  lastUpdated: string;
}

export interface OntologyRelationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  strength: "weak" | "moderate" | "strong";
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GraphNode {
  entity: OntologyEntity;
  relationships: OntologyRelationship[];
  connectedEntities: OntologyEntity[];
  hopDistance: number;
}

export interface GraphTraversalResult {
  origin: OntologyEntity;
  nodes: GraphNode[];
  totalNodes: number;
  evidenceChain: EvidenceLink[];
  crossDomainConnections: CrossDomainConnection[];
}

export interface EvidenceLink {
  fromEntity: string;
  toEntity: string;
  relationshipType: RelationshipType;
  domain: string;
  significance: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface CrossDomainConnection {
  fromDomain: string;
  toDomain: string;
  entityA: string;
  entityB: string;
  connectionType: RelationshipType;
  riskImplications: string[];
}

export interface GraphQueryResult {
  entities: OntologyEntity[];
  relationships: OntologyRelationship[];
  evidenceChain: EvidenceLink[];
  crossDomainConnections: CrossDomainConnection[];
  totalHops: number;
  queryDurationMs: number;
}

function mapEntityType(dbType: string): OntologyEntityType {
  const mapping: Record<string, OntologyEntityType> = {
    person: "person",
    organization: "organization",
    vessel: "vessel",
    property: "property",
    case: "case",
    incident: "threat",
    alert: "signal",
    asset: "asset",
    port: "port",
    risk_item: "threat",
    workflow: "asset",
    task: "asset",
    control: "asset",
    recommendation: "signal",
  };
  return mapping[dbType] ?? "asset";
}

function mapRelationshipStrength(strength: string | null): OntologyRelationship["strength"] {
  if (strength === "strong") return "strong";
  if (strength === "weak") return "weak";
  return "moderate";
}

function assessSignificance(rel: OntologyRelationship): EvidenceLink["significance"] {
  const highSig: RelationshipType[] = ["litigates", "threatens", "sanctioned_by", "exposes"];
  const medSig: RelationshipType[] = ["owns", "operates", "directs", "invests_in"];
  if (highSig.includes(rel.type)) return "high";
  if (medSig.includes(rel.type)) return "medium";
  return "low";
}

function buildEvidenceDescription(relType: RelationshipType, from: string, to: string): string {
  const templates: Record<RelationshipType, string> = {
    owns: `${from} has an ownership stake in ${to}`,
    operates: `${from} operates ${to}`,
    litigates: `${from} has active litigation involving ${to}`,
    threatens: `${from} poses a threat to ${to}`,
    located_at: `${from} is located at ${to}`,
    connected_to: `${from} has a documented connection to ${to}`,
    sanctioned_by: `${from} has been sanctioned in relation to ${to}`,
    employed_by: `${from} is employed by ${to}`,
    directs: `${from} holds a directorship or control position at ${to}`,
    invests_in: `${from} has investment exposure in ${to}`,
    registered_in: `${from} is registered in ${to}`,
    affiliated_with: `${from} has a known affiliation with ${to}`,
    monitors: `${from} actively monitors ${to}`,
    exposes: `${from} creates material exposure for ${to}`,
  };
  return templates[relType] ?? `${from} is related to ${to}`;
}

export class OntologyEngine {
  private entityCache = new Map<string, OntologyEntity>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  private isCacheValid(id: string): boolean {
    const expiry = this.cacheExpiry.get(id);
    return expiry !== undefined && Date.now() < expiry;
  }

  private setCache(entity: OntologyEntity): void {
    this.entityCache.set(entity.id, entity);
    this.cacheExpiry.set(entity.id, Date.now() + this.CACHE_TTL_MS);
  }

  async upsertEntity(entity: Omit<OntologyEntity, "id" | "lastUpdated"> & { externalId?: string }): Promise<OntologyEntity> {
    const dbType = entity.type as string;
    const validTypes = ["person", "organization", "asset", "vessel", "port", "workflow", "task", "alert", "case", "incident", "control", "risk_item", "recommendation"];
    const mappedType = validTypes.includes(dbType) ? dbType : "asset";

    const [row] = await db
      .insert(entitiesTable)
      .values({
        entityType: mappedType as typeof entitiesTable.$inferInsert["entityType"],
        name: entity.name,
        sourceApp: entity.domain,
        externalId: entity.externalId ?? null,
        metadata: {
          ...entity.metadata,
          ontologyType: entity.type,
          riskScore: entity.riskScore ?? null,
        },
        tags: entity.tags,
      })
      .onConflictDoUpdate({
        target: [entitiesTable.name, entitiesTable.sourceApp],
        set: {
          metadata: sql`excluded.metadata`,
          tags: sql`excluded.tags`,
          updatedAt: new Date(),
        },
      })
      .returning();

    const result: OntologyEntity = {
      id: row!.id,
      type: entity.type,
      name: row!.name,
      domain: row!.sourceApp,
      metadata: (row!.metadata as Record<string, unknown>) ?? {},
      tags: row!.tags ?? [],
      riskScore: entity.riskScore,
      lastUpdated: row!.updatedAt.toISOString(),
    };

    this.setCache(result);
    return result;
  }

  async createRelationship(
    fromEntityId: string,
    toEntityId: string,
    type: RelationshipType,
    strength: OntologyRelationship["strength"] = "moderate",
    metadata: Record<string, unknown> = {},
  ): Promise<OntologyRelationship> {
    const [row] = await db
      .insert(entityRelationshipsTable)
      .values({
        fromEntityId,
        toEntityId,
        relationshipType: type,
        strength,
        metadata,
      })
      .onConflictDoNothing()
      .returning();

    return {
      id: row!.id,
      fromEntityId,
      toEntityId,
      type,
      strength,
      metadata,
      createdAt: row!.createdAt.toISOString(),
    };
  }

  async getEntity(entityId: string): Promise<OntologyEntity | null> {
    if (this.isCacheValid(entityId)) {
      return this.entityCache.get(entityId) ?? null;
    }

    const [row] = await db
      .select()
      .from(entitiesTable)
      .where(eq(entitiesTable.id, entityId));

    if (!row) return null;

    const meta = (row.metadata as Record<string, unknown>) ?? {};
    const entity: OntologyEntity = {
      id: row.id,
      type: (meta.ontologyType as OntologyEntityType) ?? mapEntityType(row.entityType),
      name: row.name,
      domain: row.sourceApp,
      metadata: meta,
      tags: row.tags ?? [],
      riskScore: meta.riskScore as number | undefined,
      lastUpdated: row.updatedAt.toISOString(),
    };

    this.setCache(entity);
    return entity;
  }

  async searchEntities(query: string, types?: OntologyEntityType[], limit = 20): Promise<OntologyEntity[]> {
    const rows = await db
      .select()
      .from(entitiesTable)
      .where(
        sql`to_tsvector('english', ${entitiesTable.name}) @@ plainto_tsquery('english', ${query})
            OR ${entitiesTable.name} ILIKE ${"%" + query + "%"}`
      )
      .limit(limit);

    return rows.map(row => {
      const meta = (row.metadata as Record<string, unknown>) ?? {};
      return {
        id: row.id,
        type: (meta.ontologyType as OntologyEntityType) ?? mapEntityType(row.entityType),
        name: row.name,
        domain: row.sourceApp,
        metadata: meta,
        tags: row.tags ?? [],
        riskScore: meta.riskScore as number | undefined,
        lastUpdated: row.updatedAt.toISOString(),
      };
    }).filter(e => !types || types.includes(e.type));
  }

  async traverseGraph(
    originEntityId: string,
    maxHops = 3,
    maxNodesPerHop = 10,
  ): Promise<GraphTraversalResult> {
    const origin = await this.getEntity(originEntityId);
    if (!origin) throw new Error(`Entity ${originEntityId} not found in ontology`);

    const visitedIds = new Set<string>([originEntityId]);
    const nodes: GraphNode[] = [];
    const evidenceChain: EvidenceLink[] = [];
    const crossDomainConnections: CrossDomainConnection[] = [];
    let currentFrontier = [originEntityId];

    for (let hop = 1; hop <= maxHops; hop++) {
      if (currentFrontier.length === 0) break;

      const rels = await db
        .select()
        .from(entityRelationshipsTable)
        .where(
          or(
            inArray(entityRelationshipsTable.fromEntityId, currentFrontier),
            inArray(entityRelationshipsTable.toEntityId, currentFrontier),
          ),
        )
        .limit(maxNodesPerHop * 5);

      const nextFrontier: string[] = [];

      for (const rel of rels) {
        const neighborId = currentFrontier.includes(rel.fromEntityId)
          ? rel.toEntityId
          : rel.fromEntityId;

        if (visitedIds.has(neighborId)) continue;
        if (nextFrontier.length >= maxNodesPerHop) break;

        visitedIds.add(neighborId);
        nextFrontier.push(neighborId);

        const neighbor = await this.getEntity(neighborId);
        if (!neighbor) continue;

        const relationship: OntologyRelationship = {
          id: rel.id,
          fromEntityId: rel.fromEntityId,
          toEntityId: rel.toEntityId,
          type: rel.relationshipType as RelationshipType,
          strength: mapRelationshipStrength(rel.strength),
          metadata: (rel.metadata as Record<string, unknown>) ?? {},
          createdAt: rel.createdAt.toISOString(),
        };

        nodes.push({
          entity: neighbor,
          relationships: [relationship],
          connectedEntities: [origin],
          hopDistance: hop,
        });

        const fromEntity = await this.getEntity(rel.fromEntityId);
        const toEntity = await this.getEntity(rel.toEntityId);

        evidenceChain.push({
          fromEntity: fromEntity?.name ?? rel.fromEntityId,
          toEntity: toEntity?.name ?? rel.toEntityId,
          relationshipType: relationship.type,
          domain: neighbor.domain,
          significance: assessSignificance(relationship),
          description: buildEvidenceDescription(relationship.type, fromEntity?.name ?? "Unknown", toEntity?.name ?? "Unknown"),
        });

        if (fromEntity && toEntity && fromEntity.domain !== toEntity.domain) {
          crossDomainConnections.push({
            fromDomain: fromEntity.domain,
            toDomain: toEntity.domain,
            entityA: fromEntity.name,
            entityB: toEntity.name,
            connectionType: relationship.type,
            riskImplications: this.assessRiskImplications(relationship.type, fromEntity, toEntity),
          });
        }
      }

      currentFrontier = nextFrontier;
    }

    return {
      origin,
      nodes,
      totalNodes: nodes.length,
      evidenceChain,
      crossDomainConnections,
    };
  }

  private assessRiskImplications(type: RelationshipType, from: OntologyEntity, to: OntologyEntity): string[] {
    const implications: string[] = [];
    if (type === "litigates") implications.push(`Active litigation in ${from.domain} may impact ${to.domain} exposure`);
    if (type === "threatens") implications.push(`Threat actor in ${from.domain} poses cross-domain risk to ${to.domain}`);
    if (type === "owns" && from.domain !== to.domain) implications.push(`Ownership bridge between ${from.domain} and ${to.domain} creates correlated risk`);
    if (type === "sanctioned_by") implications.push(`Sanctions designation creates compliance risk across ${from.domain} and ${to.domain}`);
    if (type === "exposes") implications.push(`Material exposure detected across ${from.domain} → ${to.domain} boundary`);
    return implications;
  }

  async getEntityConnections(entityId: string): Promise<{
    outgoing: Array<{ rel: OntologyRelationship; target: OntologyEntity }>;
    incoming: Array<{ rel: OntologyRelationship; source: OntologyEntity }>;
  }> {
    const [outgoingRels, incomingRels] = await Promise.all([
      db.select().from(entityRelationshipsTable).where(eq(entityRelationshipsTable.fromEntityId, entityId)),
      db.select().from(entityRelationshipsTable).where(eq(entityRelationshipsTable.toEntityId, entityId)),
    ]);

    const outgoing = await Promise.all(
      outgoingRels.map(async rel => {
        const target = await this.getEntity(rel.toEntityId);
        return target ? { rel: { id: rel.id, fromEntityId: rel.fromEntityId, toEntityId: rel.toEntityId, type: rel.relationshipType as RelationshipType, strength: mapRelationshipStrength(rel.strength), metadata: (rel.metadata as Record<string, unknown>) ?? {}, createdAt: rel.createdAt.toISOString() }, target } : null;
      })
    );

    const incoming = await Promise.all(
      incomingRels.map(async rel => {
        const source = await this.getEntity(rel.fromEntityId);
        return source ? { rel: { id: rel.id, fromEntityId: rel.fromEntityId, toEntityId: rel.toEntityId, type: rel.relationshipType as RelationshipType, strength: mapRelationshipStrength(rel.strength), metadata: (rel.metadata as Record<string, unknown>) ?? {}, createdAt: rel.createdAt.toISOString() }, source } : null;
      })
    );

    return {
      outgoing: outgoing.filter((x): x is NonNullable<typeof x> => x !== null),
      incoming: incoming.filter((x): x is NonNullable<typeof x> => x !== null),
    };
  }

  async getDomainEntities(domain: string, limit = 50): Promise<OntologyEntity[]> {
    const rows = await db
      .select()
      .from(entitiesTable)
      .where(eq(entitiesTable.sourceApp, domain))
      .limit(limit);

    return rows.map(row => {
      const meta = (row.metadata as Record<string, unknown>) ?? {};
      return {
        id: row.id,
        type: (meta.ontologyType as OntologyEntityType) ?? mapEntityType(row.entityType),
        name: row.name,
        domain: row.sourceApp,
        metadata: meta,
        tags: row.tags ?? [],
        riskScore: meta.riskScore as number | undefined,
        lastUpdated: row.updatedAt.toISOString(),
      };
    });
  }

  async getGraphStats(): Promise<{
    totalEntities: number;
    totalRelationships: number;
    entitiesByDomain: Record<string, number>;
    entitiesByType: Record<string, number>;
    crossDomainLinks: number;
  }> {
    const [entityRows, relRows] = await Promise.all([
      db.select({ sourceApp: entitiesTable.sourceApp, entityType: entitiesTable.entityType }).from(entitiesTable),
      db.select({ fromEntityId: entityRelationshipsTable.fromEntityId, toEntityId: entityRelationshipsTable.toEntityId }).from(entityRelationshipsTable).limit(10000),
    ]);

    const entitiesByDomain: Record<string, number> = {};
    const entitiesByType: Record<string, number> = {};

    for (const row of entityRows) {
      entitiesByDomain[row.sourceApp] = (entitiesByDomain[row.sourceApp] ?? 0) + 1;
      entitiesByType[row.entityType] = (entitiesByType[row.entityType] ?? 0) + 1;
    }

    return {
      totalEntities: entityRows.length,
      totalRelationships: relRows.length,
      entitiesByDomain,
      entitiesByType,
      crossDomainLinks: relRows.length,
    };
  }
}

export const ontologyEngine = new OntologyEngine();
