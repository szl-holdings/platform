/**
 * Public read-only narrative endpoints.
 *
 * Reads live signal-mesh state for a given narrative id by querying the
 * in-process mesh stores (`defaultRecommendationStore`,
 * `defaultEvidenceStore`, `defaultSignalBus`).
 *
 * On the first request for a narrative the demo payload is published into
 * the mesh (signals → bus, evidence → evidence store, recommendation →
 * recommendation store, entity refs → entity registry). Subsequent
 * requests read those same objects back out of the live stores, so the
 * payload reflects the real mesh state — including any decisions, status
 * updates, or freshness changes that happened since the narrative was
 * first published.
 *
 * Mounted at /api/narratives/* via the public prefix
 * (see global-auth-enforcer).
 */

import { getRuntimeMode, isSeedDataAllowed } from '@szl-holdings/config';
import { defaultEvidenceStore, defaultRecommendationStore } from '@szl-holdings/evidence-graph';
import { defaultSignalBus } from '@szl-holdings/signal-mesh';
import { defaultEntityRegistry } from '@workspace/ontology';
import { type Request, type Response, Router } from 'express';
import { COUNSEL_DEADLINE_NARRATIVE } from '../../../../packages/demo-seed/src/narrative-counsel-deadline';
import {
  getNarrativeMeshEntry,
  registerNarrativeMeshEntry,
} from '../../../../packages/demo-seed/src/narrative-mesh-index';
import { SENTRA_RANSOMWARE_NARRATIVE } from '../../../../packages/demo-seed/src/narrative-sentra-ransomware';

const router = Router();

const NARRATIVES = {
  'sentra-ransomware': SENTRA_RANSOMWARE_NARRATIVE,
  'counsel-deadline': COUNSEL_DEADLINE_NARRATIVE,
} as const;

type NarrativeId = keyof typeof NARRATIVES;

/**
 * Publish a narrative into the live mesh stores. Idempotent — if the
 * narrative is already in the mesh index we do nothing.
 *
 * Mirrors the per-narrative section of `seedSignalMesh()` but skips the
 * connector adapter setup so the route is safe to run inside a request.
 */
function ensureNarrativeInMesh(narrativeId: NarrativeId): void {
  if (getNarrativeMeshEntry(narrativeId)) return;

  const narrative = NARRATIVES[narrativeId];
  const signals = narrative.buildSignals();
  const evidenceItems = narrative.buildEvidenceItems(signals);
  const recommendation = narrative.buildRecommendation(signals, evidenceItems);

  for (const s of signals) {
    defaultSignalBus.publish(s);
    for (const ref of s.entityRefs) {
      defaultEntityRegistry.linkSignal(ref.entityId, s.signalId);
    }
  }
  for (const ev of evidenceItems) {
    defaultEvidenceStore.save(ev);
  }
  defaultRecommendationStore.save(recommendation);
  for (const ref of recommendation.entityRefs) {
    defaultEntityRegistry.linkRecommendation(ref.entityId, recommendation.recommendationId);
  }

  registerNarrativeMeshEntry({
    narrativeId,
    recommendationId: recommendation.recommendationId,
    signalIds: signals.map((s) => s.signalId),
    evidenceItemIds: evidenceItems.map((e) => e.evidenceId),
    seededAt: new Date().toISOString(),
  });
}

/**
 * Production guard: in production environments, unauthenticated requests
 * are rejected with 401 so demo narratives are never injected into a
 * production mesh by an anonymous caller.
 */
function requireAuthInProduction(req: Request, res: Response): boolean {
  if (process.env.NODE_ENV === 'production' && !req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    return false;
  }
  return true;
}

router.get('/narratives/:id', (req: Request, res: Response) => {
  if (!requireAuthInProduction(req, res)) return;

  const id = req.params.id as NarrativeId | undefined;
  if (!id || !(id in NARRATIVES)) {
    res.status(404).json({ error: 'narrative_not_found', id });
    return;
  }

  // Only allow lazy seeding of demo narratives into the mesh in
  // sandbox/demo/development. In any environment where seed data is not
  // allowed, refuse to publish synthetic data and only serve narratives
  // that were already published via an explicit out-of-band seed run.
  if (!getNarrativeMeshEntry(id)) {
    if (!isSeedDataAllowed()) {
      res.status(403).json({
        error: 'demo_narrative_disabled',
        code: 'SEED_DATA_NOT_ALLOWED',
        runtimeMode: getRuntimeMode(),
        id,
      });
      return;
    }
    ensureNarrativeInMesh(id);
  }

  const entry = getNarrativeMeshEntry(id);
  if (!entry) {
    res.status(500).json({ error: 'narrative_seed_failed', id });
    return;
  }

  const recommendation = defaultRecommendationStore.get(entry.recommendationId);
  if (!recommendation) {
    res.status(503).json({
      error: 'recommendation_missing_from_mesh',
      id,
      recommendationId: entry.recommendationId,
    });
    return;
  }

  const evidenceItems = defaultEvidenceStore.getMany(entry.evidenceItemIds);

  const signalIdSet = new Set(entry.signalIds);
  const signals = defaultSignalBus
    .snapshot({ limit: defaultSignalBus.count() || 5000 })
    .filter((s) => signalIdSet.has(s.signalId))
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  const narrative = NARRATIVES[id];

  const meshFreshness = {
    seededAt: entry.seededAt,
    recommendationCreatedAt: recommendation.createdAt,
    latestSignalAt: signals.length > 0 ? signals[signals.length - 1]?.occurredAt : null,
    latestEvidenceAt:
      evidenceItems.length > 0
        ? evidenceItems
            .map((e) => e.observedAt)
            .sort()
            .slice(-1)[0]
        : null,
  };

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    id,
    title: narrative.title,
    domain: narrative.domain,
    org: narrative.org,
    scenario: narrative.scenario,
    fetchedAt: new Date().toISOString(),
    source: 'live-mesh',
    meshFreshness,
    signals,
    evidenceItems,
    recommendation,
  });
});

export default router;
