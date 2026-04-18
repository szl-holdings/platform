/**
 * EntitySnapshot — a point-in-time snapshot of a domain entity's state.
 *
 * Entity snapshots are updated by the entity-resolve stage of the signal
 * pipeline and are used by the evidence graph to provide context about
 * what entities are involved in recommendations.
 *
 * The default `EntityRegistry` instance (`defaultEntityRegistry`) is a
 * mutable wrapper that delegates to a backend. The default backend is in
 * memory; the API server may swap in a Postgres-backed backend at boot
 * time so that snapshots survive process restarts.
 */

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { SignalDomainSchema } from "./signal.js";

export const EntityTypeSchema = z.enum([
  "vessel",
  "voyage",
  "port",
  "property",
  "property-portfolio",
  "deal",
  "matter",
  "contact",
  "organization",
  "fleet",
  "incident",
  "agent",
  "model",
  "workflow",
  "connector",
  "custom",
]);
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const EntityHealthSchema = z.enum([
  "healthy",
  "degraded",
  "at-risk",
  "critical",
  "unknown",
]);
export type EntityHealth = z.infer<typeof EntityHealthSchema>;

export const EntitySnapshotSchema = z.object({
  snapshotId: z.string().uuid(),
  entityId: z.string(),
  entityType: EntityTypeSchema,
  domain: SignalDomainSchema,

  displayName: z.string(),
  description: z.string().optional(),

  health: EntityHealthSchema.default("unknown"),
  riskScore: z.number().min(0).max(100).optional(),
  opportunityScore: z.number().min(0).max(100).optional(),

  attributes: z.record(z.unknown()).default({}),
  externalIds: z.record(z.string()).default({}),

  relatedEntityIds: z.array(z.string()).default([]),
  activeSignalIds: z.array(z.string()).default([]),
  activeRecommendationIds: z.array(z.string()).default([]),

  tenantId: z.string().optional(),
  tags: z.array(z.string()).default([]),

  snapshotAt: z.string().datetime(),
  validUntil: z.string().datetime().optional(),

  schemaVersion: z.string().default("entity-snapshot/1.0"),
});
export type EntitySnapshot = z.infer<typeof EntitySnapshotSchema>;

export type EntitySnapshotInput = Omit<EntitySnapshot, "snapshotId" | "schemaVersion">;

export function createEntitySnapshot(input: EntitySnapshotInput): EntitySnapshot {
  return EntitySnapshotSchema.parse({
    ...input,
    snapshotId: randomUUID(),
    schemaVersion: "entity-snapshot/1.0",
  });
}

export interface EntityRegistryBackend {
  upsert(snapshot: EntitySnapshot): void;
  get(entityId: string): EntitySnapshot | undefined;
  list(filter?: {
    domain?: string;
    entityType?: string;
    health?: EntityHealth;
  }): EntitySnapshot[];
  linkSignal(entityId: string, signalId: string): void;
  linkRecommendation(entityId: string, recommendationId: string): void;
  count(): number;
}

export class InMemoryEntityRegistry implements EntityRegistryBackend {
  private readonly snapshots = new Map<string, EntitySnapshot>();

  upsert(snapshot: EntitySnapshot): void {
    const existing = this.snapshots.get(snapshot.entityId);
    if (!existing || new Date(snapshot.snapshotAt) >= new Date(existing.snapshotAt)) {
      this.snapshots.set(snapshot.entityId, snapshot);
    }
  }

  get(entityId: string): EntitySnapshot | undefined {
    return this.snapshots.get(entityId);
  }

  list(filter?: { domain?: string; entityType?: string; health?: EntityHealth }): EntitySnapshot[] {
    let results = Array.from(this.snapshots.values());
    if (filter?.domain) results = results.filter((e) => e.domain === filter.domain);
    if (filter?.entityType) results = results.filter((e) => e.entityType === filter.entityType);
    if (filter?.health) results = results.filter((e) => e.health === filter.health);
    return results;
  }

  linkSignal(entityId: string, signalId: string): void {
    const snapshot = this.snapshots.get(entityId);
    if (snapshot && !snapshot.activeSignalIds.includes(signalId)) {
      snapshot.activeSignalIds.push(signalId);
    }
  }

  linkRecommendation(entityId: string, recommendationId: string): void {
    const snapshot = this.snapshots.get(entityId);
    if (snapshot && !snapshot.activeRecommendationIds.includes(recommendationId)) {
      snapshot.activeRecommendationIds.push(recommendationId);
    }
  }

  count(): number {
    return this.snapshots.size;
  }
}

/**
 * EntityRegistry — mutable wrapper over a swappable backend so the API
 * server can install a durable Postgres-backed registry at boot without
 * breaking existing imports of `defaultEntityRegistry`.
 */
export class EntityRegistry implements EntityRegistryBackend {
  private backend: EntityRegistryBackend;

  constructor(initial: EntityRegistryBackend = new InMemoryEntityRegistry()) {
    this.backend = initial;
  }

  setBackend(backend: EntityRegistryBackend): void {
    this.backend = backend;
  }

  getBackend(): EntityRegistryBackend {
    return this.backend;
  }

  upsert(snapshot: EntitySnapshot): void {
    this.backend.upsert(snapshot);
  }

  get(entityId: string): EntitySnapshot | undefined {
    return this.backend.get(entityId);
  }

  list(filter?: { domain?: string; entityType?: string; health?: EntityHealth }): EntitySnapshot[] {
    return this.backend.list(filter);
  }

  linkSignal(entityId: string, signalId: string): void {
    this.backend.linkSignal(entityId, signalId);
  }

  linkRecommendation(entityId: string, recommendationId: string): void {
    this.backend.linkRecommendation(entityId, recommendationId);
  }

  count(): number {
    return this.backend.count();
  }
}

export const defaultEntityRegistry = new EntityRegistry();
