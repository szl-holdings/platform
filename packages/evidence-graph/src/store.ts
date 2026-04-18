/**
 * Evidence Graph Store — in-memory store with schema definitions for:
 *   - EvidenceItems linked to entities and signals
 *   - Recommendations with their evidence chains
 *
 * Postgres table definitions are provided as SQL comments for future migration.
 *
 * SQL Schema (Postgres):
 *
 *   CREATE TABLE evidence_items (
 *     evidence_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     type          TEXT NOT NULL,
 *     domain        TEXT NOT NULL,
 *     signal_id     UUID REFERENCES signals(signal_id),
 *     summary       TEXT NOT NULL,
 *     detail        TEXT,
 *     confidence    FLOAT NOT NULL,
 *     freshness     FLOAT NOT NULL,
 *     weight        FLOAT NOT NULL DEFAULT 1.0,
 *     entity_refs   JSONB NOT NULL DEFAULT '[]',
 *     provenance    JSONB,
 *     tags          TEXT[] NOT NULL DEFAULT '{}',
 *     observed_at   TIMESTAMPTZ NOT NULL,
 *     expires_at    TIMESTAMPTZ,
 *     schema_version TEXT NOT NULL DEFAULT 'evidence/1.0',
 *     created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 *
 *   CREATE TABLE recommendations (
 *     recommendation_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     domain             TEXT NOT NULL,
 *     title              TEXT NOT NULL,
 *     summary            TEXT NOT NULL,
 *     rationale          TEXT NOT NULL,
 *     suggested_action   TEXT NOT NULL,
 *     action_payload     JSONB NOT NULL DEFAULT '{}',
 *     confidence         FLOAT NOT NULL,
 *     freshness          FLOAT NOT NULL,
 *     projected_impact_usd BIGINT,
 *     projected_risk_reduction_pct FLOAT,
 *     evidence_ids       UUID[] NOT NULL DEFAULT '{}',
 *     signal_ids         UUID[] NOT NULL DEFAULT '{}',
 *     entity_refs        JSONB NOT NULL DEFAULT '[]',
 *     status             TEXT NOT NULL DEFAULT 'pending',
 *     policy_evaluation  JSONB NOT NULL DEFAULT '{"outcome":"pending","policyIds":[]}',
 *     tenant_id          TEXT,
 *     generated_by       TEXT,
 *     provenance         JSONB,
 *     generated_at       TIMESTAMPTZ NOT NULL,
 *     expires_at         TIMESTAMPTZ,
 *     resolved_at        TIMESTAMPTZ,
 *     tags               TEXT[] NOT NULL DEFAULT '{}',
 *     schema_version     TEXT NOT NULL DEFAULT 'recommendation/1.0',
 *     created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 *
 *   CREATE TABLE evidence_entity_links (
 *     evidence_id   UUID NOT NULL REFERENCES evidence_items(evidence_id),
 *     entity_id     TEXT NOT NULL,
 *     entity_type   TEXT NOT NULL,
 *     domain        TEXT NOT NULL,
 *     linked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     PRIMARY KEY (evidence_id, entity_id)
 *   );
 */

import type { EvidenceItem, Recommendation } from "@workspace/ontology";

export interface EvidenceEntityLink {
  evidenceId: string;
  entityId: string;
  entityType: string;
  domain: string;
  linkedAt: string;
}

export class EvidenceStore {
  private readonly items = new Map<string, EvidenceItem>();
  private readonly entityLinks = new Map<string, Set<string>>();

  save(item: EvidenceItem): void {
    this.items.set(item.evidenceId, item);
    for (const ref of item.entityRefs) {
      const set = this.entityLinks.get(ref.entityId) ?? new Set();
      set.add(item.evidenceId);
      this.entityLinks.set(ref.entityId, set);
    }
    if (item.signalId) {
      const set = this.entityLinks.get(`signal:${item.signalId}`) ?? new Set();
      set.add(item.evidenceId);
      this.entityLinks.set(`signal:${item.signalId}`, set);
    }
  }

  get(evidenceId: string): EvidenceItem | undefined {
    return this.items.get(evidenceId);
  }

  getMany(evidenceIds: string[]): EvidenceItem[] {
    return evidenceIds.flatMap((id) => {
      const item = this.items.get(id);
      return item ? [item] : [];
    });
  }

  forEntity(entityId: string): EvidenceItem[] {
    const ids = this.entityLinks.get(entityId) ?? new Set();
    return this.getMany(Array.from(ids));
  }

  forSignal(signalId: string): EvidenceItem[] {
    const ids = this.entityLinks.get(`signal:${signalId}`) ?? new Set();
    return this.getMany(Array.from(ids));
  }

  list(filter?: {
    domain?: string;
    type?: EvidenceItem["type"];
    limit?: number;
    offset?: number;
  }): EvidenceItem[] {
    let results = Array.from(this.items.values());
    if (filter?.domain) results = results.filter((e) => e.domain === filter.domain);
    if (filter?.type) results = results.filter((e) => e.type === filter.type);
    results.sort((a, b) => b.observedAt.localeCompare(a.observedAt));
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 100;
    return results.slice(offset, offset + limit);
  }

  count(): number {
    return this.items.size;
  }
}

export class RecommendationStore {
  private readonly recs = new Map<string, Recommendation>();

  save(rec: Recommendation): void {
    this.recs.set(rec.recommendationId, rec);
  }

  get(recommendationId: string): Recommendation | undefined {
    return this.recs.get(recommendationId);
  }

  list(filter?: {
    domain?: string;
    status?: Recommendation["status"];
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Recommendation[] {
    let results = Array.from(this.recs.values());
    if (filter?.domain) results = results.filter((r) => r.domain === filter.domain);
    if (filter?.status) results = results.filter((r) => r.status === filter.status);
    if (filter?.tenantId) results = results.filter((r) => r.tenantId === filter.tenantId);
    results.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 50;
    return results.slice(offset, offset + limit);
  }

  updateStatus(recommendationId: string, status: Recommendation["status"]): boolean {
    const rec = this.recs.get(recommendationId);
    if (!rec) return false;
    this.recs.set(recommendationId, {
      ...rec,
      status,
      resolvedAt: ["accepted", "rejected", "completed", "failed"].includes(status)
        ? new Date().toISOString()
        : rec.resolvedAt,
    });
    return true;
  }

  forEntity(entityId: string): Recommendation[] {
    return Array.from(this.recs.values()).filter((r) =>
      r.entityRefs.some((ref) => ref.entityId === entityId),
    );
  }

  count(): number {
    return this.recs.size;
  }
}

export const defaultEvidenceStore = new EvidenceStore();
export const defaultRecommendationStore = new RecommendationStore();
