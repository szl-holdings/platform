// Import directly from the underlying Lutar package rather than the
// `@szl-holdings/formulas` aggregator: the aggregator's `registry.ts`
// has unrelated pre-existing type drift that breaks our typecheck.
// These are the same exports the aggregator re-exports.
import {
  defaultWeights5,
  lutarInvariant5,
  type LutarAxes5,
} from '@workspace/lutar-formulas/lutar';
import { sigmoid } from '@workspace/lutar-formulas/xi';
import type { ArtifactKind, CodexScore, FrontierArtifact, PromotionTarget, RoutingDecision } from './types.js';

const KEYWORDS_THESIS = [
  'agent', 'agentic', 'governance', 'reasoning', 'safety', 'alignment',
  'tool-use', 'multi-agent', 'orchestration', 'evaluation', 'benchmark',
  'rag', 'retrieval', 'router', 'inference', 'distillation', 'doctrine',
];

const KEYWORDS_OUROBOROS = [
  'self-improve', 'self-improvement', 'auto-eval', 'distillation', 'rl', 'reflexion',
  'meta-learning', 'curriculum', 'feedback', 'self-train', 'self-play',
];

const KEYWORDS_LUTAR = [
  'router', 'routing', 'mixture-of-experts', 'moe', 'cascade', 'speculative',
  'cost-aware', 'latency', 'throughput', 'kv-cache',
];

const KEYWORDS_DANGER = ['jailbreak', 'uncensored', 'unsafe', 'nsfw', 'exploit', 'malware'];

function scoreKeywords(text: string, dict: string[]): number {
  const t = text.toLowerCase();
  let hits = 0;
  for (const k of dict) if (t.includes(k)) hits++;
  return Math.min(1, hits / Math.max(3, dict.length / 4));
}

function estimateCostSignal(a: FrontierArtifact): number {
  const tags = a.tags.join(' ').toLowerCase();
  const title = a.title.toLowerCase();
  if (/(opus|ultra|405b|175b|70b|grok|gpt-5)/.test(title + ' ' + tags)) return 0.85;
  if (/(sonnet|pro|34b|13b|gpt-4)/.test(title + ' ' + tags)) return 0.55;
  if (/(haiku|nano|flash|small|7b|3b|mini)/.test(title + ' ' + tags)) return 0.2;
  return 0.4;
}

function estimateSafety(a: FrontierArtifact): number {
  const text = (a.title + ' ' + (a.summary ?? '') + ' ' + a.tags.join(' ')).toLowerCase();
  for (const bad of KEYWORDS_DANGER) if (text.includes(bad)) return 0.05;
  if (a.kind === 'doctrine' || a.kind === 'paper') return 0.95;
  return 0.85;
}

/**
 * Optional thesis-corpus probe. The api-server can register a real
 * RAG implementation here; when absent we fall back to keyword
 * thesis-fit so the service stays runnable in isolation (e.g. the
 * Temporal worker process can also register its own probe). The
 * probe returns a [0,1] score plus citations that are surfaced in
 * the rationale so the proof chain stays inspectable.
 */
export interface ThesisProbe {
  (artifact: FrontierArtifact):
    | { score: number; citations?: string[] }
    | undefined
    | Promise<{ score: number; citations?: string[] } | undefined>;
}
let thesisProbe: ThesisProbe | undefined;
export function registerThesisProbe(p: ThesisProbe | undefined): void {
  thesisProbe = p;
}

export async function scoreArtifact(a: FrontierArtifact): Promise<CodexScore> {
  const haystack = `${a.title} ${a.summary ?? ''} ${a.tags.join(' ')}`;
  const ouroborosKw = scoreKeywords(haystack, KEYWORDS_OUROBOROS);
  const lutarKw = scoreKeywords(haystack, KEYWORDS_LUTAR);
  const keywordThesisFit = scoreKeywords(haystack, KEYWORDS_THESIS);
  let probe: { score: number; citations?: string[] } | undefined;
  try {
    probe = await thesisProbe?.(a);
  } catch {
    probe = undefined;
  }
  // Blend RAG with keyword scorer: take max so the embedding signal
  // can only *lift* thesisFit. This preserves routing for artifacts
  // whose vocabulary the keyword scorer caught — they keep their
  // pre-existing score floor and the RAG cosine is additive when it
  // agrees. If the probe is absent, fall back to keyword-only.
  const thesisFit = probe ? Math.max(probe.score, keywordThesisFit) : keywordThesisFit;
  const costSignal = estimateCostSignal(a);
  const safetySignal = estimateSafety(a);

  // Real Lutar invariant Λ₅ from `@szl-holdings/formulas` — the same
  // formula stack the rest of the platform uses. Each keyword bucket
  // becomes an axis input, so the codex composite is provably bounded
  // by `min(axes)` and zero-pinned by the safety axis (axiom A2).
  //   C — cleanliness  ← safety signal
  //   H — horizon      ← freshness (newer publish dates score higher)
  //   R — resonance    ← thesis-fit (cross-source/doctrine resonance)
  //   F — frustum      ← ouroboros (self-improvement completeness)
  //   G — Gauß closure ← lutar routing affinity
  // Axiom A2 of Λ₅ says the invariant is bounded above by `min(axes)`
  // and pinned to zero if any axis is exactly zero. Keyword density is
  // a noisy proxy for axis truth — absence of keywords is not proof
  // the axis is zero — so we floor each axis at AXIS_FLOOR. This keeps
  // Λ₅ informative without violating the proof: the upper bound on Λ₅
  // is now `min(floored axes)`, which we record in the rationale.
  const AXIS_FLOOR = 0.2;
  const floor = (v: number) => Math.max(AXIS_FLOOR, clamp01(v));
  const horizon = freshnessHorizon(a.publishedAt);
  const axes: LutarAxes5 = {
    cleanliness: floor(safetySignal),
    horizon: floor(horizon),
    resonance: floor(thesisFit),
    frustum: floor(ouroborosKw),
    gaussClosure: floor(lutarKw),
  };
  const lutarReport = lutarInvariant5(axes, defaultWeights5());

  // Heuristic prior — the previous keyword-weighted composite. We
  // blend Λ₅ with the prior so the score combines (a) the formal
  // codex invariant and (b) the operational keyword evidence: this
  // retains the original cheap+safe+additive auto-promote behaviour
  // while letting Λ₅ pull the composite down when an axis collapses.
  const prior =
    0.30 * thesisFit +
    0.25 * ouroborosKw +
    0.20 * lutarKw +
    0.15 * safetySignal +
    0.10 * (1 - costSignal);

  // Cost-signal soft damping: a stronger cost doesn't outright zero
  // the score (the queue gate already pulls expensive items into the
  // inbox via `isExpensive` below) but does shrink it. Sigmoid keeps
  // it bounded, consistent with how `xi.ts` damps dialog entropy.
  const costDamp = sigmoid(2 * (1 - costSignal));
  const blended = 0.5 * lutarReport.invariant + 0.5 * prior;
  const composite = clamp01(blended * costDamp);

  const rationale: string[] = [];
  rationale.push(`Λ₅=${lutarReport.invariant.toFixed(3)} (cleanliness=${axes.cleanliness.toFixed(2)} horizon=${axes.horizon.toFixed(2)} resonance=${axes.resonance.toFixed(2)} frustum=${axes.frustum.toFixed(2)} G=${axes.gaussClosure.toFixed(2)})`);
  if (probe?.citations?.length) rationale.push(`thesis-RAG: ${probe.citations.slice(0, 3).join('; ')}`);
  if (thesisFit > 0.4) rationale.push(`thesis-fit ${thesisFit.toFixed(2)} (resonates with A11oy doctrine)`);
  if (ouroborosKw > 0.3) rationale.push(`ouroboros ${ouroborosKw.toFixed(2)} (accelerates self-improvement)`);
  if (lutarKw > 0.3) rationale.push(`lutar ${lutarKw.toFixed(2)} (improves routing)`);
  if (costSignal > 0.7) rationale.push(`cost-signal ${costSignal.toFixed(2)} (likely expensive — operator review)`);
  if (safetySignal < 0.3) rationale.push(`safety ${safetySignal.toFixed(2)} (boundary-pushing — quarantine)`);

  return { ouroboros: ouroborosKw, lutar: lutarKw, thesisFit, costSignal, safetySignal, composite, rationale };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function freshnessHorizon(publishedAt: string | undefined): number {
  if (!publishedAt) return 0.5;
  const t = Date.parse(publishedAt);
  if (!Number.isFinite(t)) return 0.5;
  const ageDays = (Date.now() - t) / (24 * 60 * 60 * 1000);
  if (ageDays <= 0) return 1;
  // Half-life of 30 days — a 60-day-old artifact scores ~0.25.
  return Math.exp(-ageDays / 30);
}

export function targetFor(kind: ArtifactKind): PromotionTarget {
  switch (kind) {
    case 'model':
      return 'operator_model_registry';
    // New tool primitives are PROPOSALS, not registry entries — they need
    // operator review and integration work before becoming live capabilities.
    case 'tool':
      return 'tool_proposals';
    case 'doctrine':
      return 'thesis_corpus';
    case 'dataset':
      return 'eval_harness';
    case 'paper':
      return 'thesis_corpus';
    case 'benchmark':
      return 'benchmark_registry';
  }
}

export interface ClassifyResult {
  decision: RoutingDecision;
  promotionTarget?: PromotionTarget;
  score: CodexScore;
}

export async function classify(a: FrontierArtifact): Promise<ClassifyResult> {
  const score = await scoreArtifact(a);
  const target = targetFor(a.kind);

  if (score.safetySignal < 0.3) return { decision: 'discard', score };
  if (score.composite < 0.18) return { decision: 'discard', score };

  // capable+expensive or doctrine-shifting → queue
  const isExpensive = score.costSignal > 0.6;
  const isDoctrineShift = a.kind === 'doctrine' || (a.kind === 'paper' && score.thesisFit > 0.5);

  if (isExpensive || isDoctrineShift) {
    return { decision: 'queue', promotionTarget: target, score };
  }
  // cheap+safe+additive → auto-promote
  return { decision: 'auto-promote', promotionTarget: target, score };
}
