/**
 * Primitive 80 — Entity-data-mesh receipt
 *
 * Inspired by Anduril Lattice's open-data-model: every entity is
 * created, enriched, or referenced by a named producer. The receipt
 * lift: every entity update carries a producer-identity claim and an
 * enrichment lineage. Without lineage, an entity is a rumor.
 *
 * In a tactical mesh, the same entity (e.g. a vehicle track) is
 * enriched by many sensors. Lattice keeps them coherent. We lift the
 * coherence discipline into a deterministic, auditable receipt:
 * conflicting claims must be resolved by the producer-precedence
 * policy or refused, never silently overwritten.
 *
 * Source: github.com/anduril (Lattice SDK Python/JS/Go/Rust),
 * anduril.com/lattice/lattice-sdk. License-clean — no Anduril code
 * lifted; only the architectural pattern.
 */

export interface EntityClaim {
  entityId: string;
  field: string;
  value: unknown;
  producerId: string;
  timestamp: string; // ISO
}

export interface EntityRecord {
  entityId: string;
  fields: Record<string, { value: unknown; producerId: string; timestamp: string }>;
  lineage: EntityClaim[];
}

export type ProducerPrecedence = (a: string, b: string) => number; // <0 a wins, >0 b wins

export class EntityDataMesh {
  private records = new Map<string, EntityRecord>();

  constructor(private precedence: ProducerPrecedence = (a, b) => a.localeCompare(b)) {}

  apply(claim: EntityClaim): { applied: boolean; reason: string } {
    if (!claim.entityId || !claim.field || !claim.producerId) {
      return { applied: false, reason: "entityId, field, producerId required" };
    }
    let rec = this.records.get(claim.entityId);
    if (!rec) {
      rec = { entityId: claim.entityId, fields: {}, lineage: [] };
      this.records.set(claim.entityId, rec);
    }
    const current = rec.fields[claim.field];
    if (current) {
      // Resolve by timestamp first, then by producer precedence.
      if (claim.timestamp < current.timestamp) {
        rec.lineage.push(claim);
        return { applied: false, reason: "stale timestamp; lineage recorded but field unchanged" };
      }
      if (claim.timestamp === current.timestamp) {
        const cmp = this.precedence(claim.producerId, current.producerId);
        if (cmp >= 0) {
          rec.lineage.push(claim);
          return { applied: false, reason: "tie broken in favor of incumbent; lineage recorded" };
        }
      }
    }
    rec.fields[claim.field] = { value: claim.value, producerId: claim.producerId, timestamp: claim.timestamp };
    rec.lineage.push(claim);
    return { applied: true, reason: "claim applied" };
  }

  read(entityId: string): EntityRecord | undefined {
    return this.records.get(entityId);
  }

  lineageOf(entityId: string): EntityClaim[] {
    return this.records.get(entityId)?.lineage ?? [];
  }

  size(): number {
    return this.records.size;
  }
}
