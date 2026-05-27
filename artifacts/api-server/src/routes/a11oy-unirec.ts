/**
 * A11oy UniRec API — Unified Briefing Recommender.
 *
 * POST /a11oy/unirec/recommend
 *   body: { items: BriefingItem[], operator: OperatorContext }
 *   200:  { ranked: ScoredItem[], topByDomain, rankSignature, formula }
 *
 * GET  /a11oy/unirec/health
 *
 * Source: docs/research/agi-stack-synthesis-2026.md §1 (UniRec → Lutar Λ axes).
 * Per-operator resonanceWeight is looked up from the sotopia calibration
 * store; default 1.0 when no calibration recorded yet.
 */
import { Router, type Request, type Response } from 'express';
import {
  rank,
  type BriefingItem,
  type OperatorContext,
  UNIREC_FABRIC_VERSION,
} from '@workspace/unirec-fabric';
import { getOperatorResonance } from '@workspace/agents-evals/operator-calibration';
import { logger } from '../lib/logger.js';

const router = Router();

function asNumber(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseItem(raw: unknown): BriefingItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.domain !== 'string') return null;
  const pri = r.priority === 'high' || r.priority === 'medium' || r.priority === 'low'
    ? r.priority : 'medium';
  return {
    id: r.id,
    domain: r.domain,
    headline: typeof r.headline === 'string' ? r.headline : '',
    priority: pri,
    confidence: asNumber(r.confidence, 0.5),
    covenantLift: asNumber(r.covenantLift, 0),
    tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string') : undefined,
    observedAt: typeof r.observedAt === 'string' ? r.observedAt : undefined,
    meta: (r.meta as Record<string, unknown>) ?? undefined,
  };
}

router.get('/a11oy/unirec/health', (_req: Request, res: Response) => {
  res.json({ ok: true, data: { version: UNIREC_FABRIC_VERSION, formula: 'UniRec = (U^0.40·C^0.30·P^0.30)·G' } });
});

router.post('/a11oy/unirec/recommend', (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    const items = itemsRaw
      .map(parseItem)
      .filter((i): i is BriefingItem => i !== null);
    if (items.length === 0) {
      res.status(400).json({ ok: false, error: { message: 'items[] required (each {id, domain, headline, priority, confidence, covenantLift}).' } });
      return;
    }
    const opRaw = (body.operator ?? {}) as Record<string, unknown>;
    const operatorId = typeof opRaw.operatorId === 'string' ? opRaw.operatorId : 'anonymous';
    const recentDomains = Array.isArray(opRaw.recentDomains)
      ? opRaw.recentDomains.filter((d): d is string => typeof d === 'string') : [];
    const affinityTags = Array.isArray(opRaw.affinityTags)
      ? opRaw.affinityTags.filter((d): d is string => typeof d === 'string') : [];

    // Per-(operator,domain) resonance weight from the sotopia calibration loop.
    // Use the operator's most-recent domain as the proxy for "current context".
    const domainKey = recentDomains[0] ?? items[0]!.domain;
    const resonanceWeight = getOperatorResonance(operatorId, domainKey);

    // Memnet recall hints (optional) — let the caller feed associative-recall
    // results in as a contextFit nudge. Bounded inside the fabric.
    const hintsRaw = Array.isArray(body.memnetHints) ? body.memnetHints : [];
    const memnetHints = hintsRaw.flatMap((h): { domain?: string; tags?: string[]; weight?: number }[] => {
      if (!h || typeof h !== 'object') return [];
      const r = h as Record<string, unknown>;
      return [{
        domain: typeof r.domain === 'string' ? r.domain : undefined,
        tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string') : undefined,
        weight: typeof r.weight === 'number' ? r.weight : undefined,
      }];
    });

    const ctx: OperatorContext = { operatorId, recentDomains, affinityTags, resonanceWeight, memnetHints };
    const result = rank(items, ctx);

    res.json({
      ok: true,
      data: {
        ...result,
        formula: 'UniRec = (userAffinity^0.40 · contextFit^0.30 · itemPriority^0.30) · governance',
        operator: { operatorId, domainKey, resonanceWeight },
        memnetHintCount: memnetHints.length,
      },
      meta: { timestamp: new Date().toISOString(), version: UNIREC_FABRIC_VERSION },
    });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-unirec] recommend');
    res.status(500).json({ ok: false, error: { message: 'Failed to score items.' } });
  }
});

export default router;
