/**
 * UniRec Fabric — tri-tower scorer for the Unified Briefing Recommender.
 *
 * Source: westlake-baichuan-mllm/bc-omni · UniRec → re-expressed as Lutar Λ axes.
 * See docs/research/agi-stack-synthesis-2026.md §1.
 *
 * Three towers feed independent embeddings which collapse to a Λ-style
 * weighted geometric mean:
 *
 *   user_aff  · context_fit · item_priority
 *      ↓             ↓              ↓
 *   resonance · cleanliness · horizon
 *
 *   score = (resonance^0.40 · cleanliness^0.30 · horizon^0.30) · governance
 *
 * Output is deterministic, hashable, and re-rankable per-operator. The full
 * rationale (per-axis breakdown) is returned so the briefing surface can show
 * the operator *why* a signal climbed.
 */

export type Priority = 'high' | 'medium' | 'low';

export interface BriefingItem {
  id: string;
  domain: string;
  headline: string;
  priority: Priority;
  /** 0..1 confidence from upstream detector. */
  confidence: number;
  /** Monetary lift in USD, used by the priority tower. */
  covenantLift: number;
  /** Tag bag used to compute user affinity. */
  tags?: readonly string[];
  /** ISO-8601 timestamp; used to compute temporal decay in the context tower. */
  observedAt?: string;
  /** Free-form metadata passed through to the rationale. */
  meta?: Record<string, unknown>;
}

export interface OperatorContext {
  /** Stable operator identifier (e.g., user id, email hash). */
  operatorId: string;
  /** Domains the operator has interacted with most (most recent first). */
  recentDomains?: readonly string[];
  /** Tag bag of recent operator engagements. */
  affinityTags?: readonly string[];
  /** Local "now" used to compute temporal decay. Defaults to Date.now(). */
  nowMs?: number;
  /** Sotopia-calibrated Λ-resonance lift for this operator (0.8..1.2). */
  resonanceWeight?: number;
  /** Memnet associative-recall hints (tags + domains the operator has touched
   * recently in similar context). When present, they nudge contextFit upward
   * for items that intersect the recalled memory bag. Bounded to +0.15 lift. */
  memnetHints?: readonly {
    domain?: string;
    tags?: readonly string[];
    /** 0..1 recallScore from memnet — heavier-recalled hints weigh more. */
    weight?: number;
  }[];
}

export interface ScoredItem {
  item: BriefingItem;
  score: number;
  gate: 'block' | 'watch' | 'show' | 'pin';
  axes: {
    userAffinity: number;
    contextFit: number;
    itemPriority: number;
    governance: number;
  };
  rationale: string;
}

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 1.0, medium: 0.65, low: 0.35 };

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function userAffinityScore(item: BriefingItem, ctx: OperatorContext): number {
  const recent = ctx.recentDomains ?? [];
  const domainRank = recent.indexOf(item.domain);
  // Recency-weighted: top of list ~0.9, fourth ~0.55, unseen 0.3.
  const domainScore =
    domainRank < 0 ? 0.3 : Math.max(0.3, 0.95 - domainRank * 0.12);

  const tags = new Set(ctx.affinityTags ?? []);
  const itemTags = item.tags ?? [];
  if (tags.size === 0 || itemTags.length === 0) {
    return clamp01(domainScore);
  }
  const overlap = itemTags.filter((t) => tags.has(t)).length;
  const tagScore = overlap / Math.max(1, itemTags.length);
  return clamp01(0.55 * domainScore + 0.45 * tagScore);
}

function contextFitScore(item: BriefingItem, ctx: OperatorContext): number {
  // Confidence × temporal decay × governance presence proxy.
  const now = ctx.nowMs ?? Date.now();
  const observed = item.observedAt ? Date.parse(item.observedAt) : now;
  const ageHours = Math.max(0, (now - observed) / 36e5);
  // 24h half-life on relevance.
  const decay = Math.pow(0.5, ageHours / 24);
  const base = 0.6 * clamp01(item.confidence) + 0.4 * decay;

  // Memnet recall lift — for each hint whose domain/tag intersects this item,
  // add a weight-scaled bonus. Total capped at +0.15 so memnet cannot dominate.
  const hints = ctx.memnetHints ?? [];
  if (hints.length === 0) return clamp01(base);
  const itemTags = new Set(item.tags ?? []);
  let lift = 0;
  for (const h of hints) {
    const tagMatch = (h.tags ?? []).some((t) => itemTags.has(t));
    const domainMatch = h.domain === item.domain;
    if (!tagMatch && !domainMatch) continue;
    const w = clamp01(typeof h.weight === 'number' ? h.weight : 0.5);
    lift += (tagMatch && domainMatch ? 0.05 : 0.03) * w;
  }
  return clamp01(base + Math.min(0.15, lift));
}

function itemPriorityScore(item: BriefingItem): number {
  // Blend tag-priority with log-scaled covenant lift; both saturate.
  const pri = PRIORITY_WEIGHT[item.priority];
  // $200k saturates at ~1.0; $0 → 0.
  const liftScore = Math.min(1, Math.log1p(Math.max(0, item.covenantLift)) / Math.log1p(2e5));
  return clamp01(0.55 * pri + 0.45 * liftScore);
}

function governanceLift(item: BriefingItem, ctx: OperatorContext): number {
  // Operator-calibrated resonance weight (from Sotopia loop) bounded to a sane band.
  const w = ctx.resonanceWeight ?? 1;
  return Math.max(0.8, Math.min(1.2, w));
}

function gateFromScore(score: number): ScoredItem['gate'] {
  if (score < 0.20) return 'block';
  if (score < 0.45) return 'watch';
  if (score < 0.75) return 'show';
  return 'pin';
}

function fmt(n: number): string {
  return n.toFixed(2);
}

export function scoreItem(item: BriefingItem, ctx: OperatorContext): ScoredItem {
  const u = userAffinityScore(item, ctx);
  const c = contextFitScore(item, ctx);
  const p = itemPriorityScore(item);
  const g = governanceLift(item, ctx);

  // Weighted geometric mean (Lutar Λ shape) — any axis crashing pulls the score down.
  const base =
    Math.pow(Math.max(1e-9, u), 0.40) *
    Math.pow(Math.max(1e-9, c), 0.30) *
    Math.pow(Math.max(1e-9, p), 0.30);
  const score = Number((base * g).toFixed(6));
  const gate = gateFromScore(score);

  const rationale = `UniRec ${fmt(score)} → ${gate}: U=${fmt(u)} (affinity) · C=${fmt(c)} (context) · P=${fmt(p)} (priority) · G=${fmt(g)} (operator-cal)`;

  return {
    item,
    score,
    gate,
    axes: { userAffinity: u, contextFit: c, itemPriority: p, governance: g },
    rationale,
  };
}

export interface RankResult {
  ranked: ScoredItem[];
  /** Highest scoring item in each domain — useful for "pinned-per-domain" surfaces. */
  topByDomain: Record<string, ScoredItem>;
  /** SHA-friendly digest of input ids in their ranked order — stable across re-renders. */
  rankSignature: string;
}

export function rank(items: readonly BriefingItem[], ctx: OperatorContext): RankResult {
  const scored = items.map((i) => scoreItem(i, ctx));
  scored.sort((a, b) => b.score - a.score);

  const topByDomain: Record<string, ScoredItem> = {};
  for (const s of scored) {
    if (!topByDomain[s.item.domain]) topByDomain[s.item.domain] = s;
  }

  const rankSignature = scored.map((s) => `${s.item.id}:${s.score.toFixed(4)}`).join('|');

  return { ranked: scored, topByDomain, rankSignature };
}

export const UNIREC_FABRIC_VERSION = '0.1.0' as const;
