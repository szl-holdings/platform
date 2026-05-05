import { dbInsertDownstream } from './db-backend.js';
import type { EvidencePack, FrontierArtifact, PromotionTarget } from './types.js';

/**
 * Promotion adapters — write artifacts into downstream stores. These are
 * intentionally lightweight in-process registries; the real wiring is via
 * downstream packages (operator_model_registry, thesis-corpus, eval harness,
 * tool proposals). Each registry can subscribe via `onPromotion` so the
 * model registry, RAG corpus, and tool-proposal queue stay in sync without
 * coupling the worker to those packages directly.
 */

export interface PromotionEvent {
  artifact: FrontierArtifact;
  target: PromotionTarget;
  evidence: EvidencePack;
  at: string;
}

type Listener = (event: PromotionEvent) => void;

const listeners = new Set<Listener>();

export function onPromotion(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const modelRegistry: PromotionEvent[] = [];
const thesisCorpus: PromotionEvent[] = [];
const evalHarness: PromotionEvent[] = [];
const toolProposals: PromotionEvent[] = [];
const benchmarkRegistry: PromotionEvent[] = [];

const TARGET_TO_STORE: Record<PromotionTarget, PromotionEvent[]> = {
  operator_model_registry: modelRegistry,
  thesis_corpus: thesisCorpus,
  eval_harness: evalHarness,
  tool_proposals: toolProposals,
  benchmark_registry: benchmarkRegistry,
};

export function applyPromotion(evidence: EvidencePack): PromotionEvent | undefined {
  if (!evidence.promotionTarget) return undefined;
  const event: PromotionEvent = {
    artifact: evidence.artifact,
    target: evidence.promotionTarget,
    evidence,
    at: new Date().toISOString(),
  };
  TARGET_TO_STORE[evidence.promotionTarget].unshift(event);
  // Cross-process durable proof-chain entry: any process (api-server,
  // Temporal worker) can read the same downstream queue + proofChainRef.
  void dbInsertDownstream(
    evidence.promotionTarget,
    evidence.artifact.id,
    `evidence:${evidence.artifact.id}`,
    { artifact: evidence.artifact, score: evidence.score, decision: evidence.decision, at: event.at },
  ).catch(() => {});
  for (const l of listeners) {
    try {
      l(event);
    } catch {
      // listeners must not break promotion
    }
  }
  return event;
}

export function getPromotionStore(target: PromotionTarget): PromotionEvent[] {
  return TARGET_TO_STORE[target].slice();
}

export function listAllPromotions(): Record<PromotionTarget, PromotionEvent[]> {
  return {
    operator_model_registry: modelRegistry.slice(),
    thesis_corpus: thesisCorpus.slice(),
    eval_harness: evalHarness.slice(),
    tool_proposals: toolProposals.slice(),
    benchmark_registry: benchmarkRegistry.slice(),
  };
}

export function _resetAdaptersForTests(): void {
  modelRegistry.length = 0;
  thesisCorpus.length = 0;
  evalHarness.length = 0;
  toolProposals.length = 0;
  benchmarkRegistry.length = 0;
  listeners.clear();
}
