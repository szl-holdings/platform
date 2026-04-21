/**
 * Evidence Graph Query Layer
 *
 * Answers "why does the system believe X?" for any recommendation or entity.
 * Supports full evidence chain traversal: recommendation → evidence items → signals → entities.
 */

import type { EvidenceItem, Recommendation } from '@workspace/ontology';
import { defaultEntityRegistry } from '@workspace/ontology';
import {
  defaultEvidenceStore,
  defaultRecommendationStore,
  type EvidenceStore,
  type RecommendationStore,
} from './store.js';

type RegistryEntitySnapshot = NonNullable<ReturnType<typeof defaultEntityRegistry.get>>;

export interface EvidenceChain {
  recommendation: Recommendation;
  evidenceItems: EvidenceItem[];
  entities: RegistryEntitySnapshot[];
  summary: string;
  confidenceBreakdown: Array<{
    evidenceId: string;
    type: EvidenceItem['type'];
    summary: string;
    confidence: number;
    weight: number;
    weightedContribution: number;
  }>;
  aggregateConfidence: number;
}

export interface WhyResult {
  entityId: string;
  entitySnapshot: RegistryEntitySnapshot | null;
  activeRecommendations: EvidenceChain[];
  allEvidenceItems: EvidenceItem[];
  narrative: string;
}

export class EvidenceGraphQuery {
  constructor(
    private readonly evidenceStore: EvidenceStore = defaultEvidenceStore,
    private readonly recommendationStore: RecommendationStore = defaultRecommendationStore,
  ) {}

  getEvidenceChain(recommendationId: string): EvidenceChain | null {
    const rec = this.recommendationStore.get(recommendationId);
    if (!rec) return null;

    const evidenceItems = this.evidenceStore.getMany(rec.evidenceIds);
    const entityIds = new Set(rec.entityRefs.map((r) => r.entityId));
    for (const item of evidenceItems) {
      for (const ref of item.entityRefs) entityIds.add(ref.entityId);
    }

    const entities: RegistryEntitySnapshot[] = [];
    for (const id of entityIds) {
      const e = defaultEntityRegistry.get(id);
      if (e !== undefined) entities.push(e);
    }

    const totalWeight = evidenceItems.reduce((sum, e) => sum + e.weight, 0);
    const confidenceBreakdown = evidenceItems.map((e) => ({
      evidenceId: e.evidenceId,
      type: e.type,
      summary: e.summary,
      confidence: e.confidence,
      weight: e.weight,
      weightedContribution: totalWeight > 0 ? (e.confidence * e.weight) / totalWeight : 0,
    }));

    const aggregateConfidence =
      totalWeight > 0
        ? evidenceItems.reduce((sum, e) => sum + e.confidence * e.weight, 0) / totalWeight
        : rec.confidence;

    const entityNames = entities.map((e) => e.displayName).join(', ') || 'unknown entity';
    const summary =
      `${rec.title} — The system recommends "${rec.suggestedAction}" for ${entityNames}. ` +
      `Aggregate confidence: ${(aggregateConfidence * 100).toFixed(0)}%. ` +
      `${evidenceItems.length} evidence item(s) support this recommendation.`;

    return {
      recommendation: rec,
      evidenceItems,
      entities,
      summary,
      confidenceBreakdown,
      aggregateConfidence,
    };
  }

  why(entityId: string): WhyResult {
    const entitySnapshot = defaultEntityRegistry.get(entityId) ?? null;
    const recs = this.recommendationStore.forEntity(entityId);
    const allEvidenceItems = this.evidenceStore.forEntity(entityId);

    const activeRecommendations = recs
      .filter((r) => r.status === 'pending' || r.status === 'accepted')
      .map((r) => this.getEvidenceChain(r.recommendationId))
      .filter((chain): chain is EvidenceChain => chain !== null);

    const entityName = entitySnapshot?.displayName ?? entityId;
    const narrative =
      activeRecommendations.length > 0
        ? `${entityName} has ${activeRecommendations.length} active recommendation(s). ` +
          activeRecommendations
            .map((c) => `"${c.recommendation.suggestedAction}": ${c.recommendation.rationale}`)
            .join(' | ')
        : `No active recommendations for ${entityName}.`;

    return { entityId, entitySnapshot, activeRecommendations, allEvidenceItems, narrative };
  }

  listRecommendations(filter?: Parameters<RecommendationStore['list']>[0]): Recommendation[] {
    return this.recommendationStore.list(filter);
  }

  listEvidence(filter?: Parameters<EvidenceStore['list']>[0]): EvidenceItem[] {
    return this.evidenceStore.list(filter);
  }
}

export const defaultEvidenceGraphQuery = new EvidenceGraphQuery();
