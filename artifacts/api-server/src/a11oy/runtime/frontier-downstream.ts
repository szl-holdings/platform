/**
 * Concrete downstream sinks for Frontier Ingestion Engine promotion events.
 *
 * Each promotion target gets a real, queryable queue (not just a log line).
 * The api-server exposes these via `/api/a11oy/frontier/downstream/:target`
 * so operators and the proof-chain UI can verify that a discovered
 * artifact actually landed in its downstream system.
 *
 * In-process today; a follow-up task migrates these to durable storage.
 */

export type DownstreamTarget =
  | 'thesis_corpus'
  | 'eval_harness'
  | 'tool_proposals'
  | 'benchmark_registry';

export interface DownstreamRecord {
  artifactId: string;
  provider: string;
  kind: string;
  title: string;
  url?: string;
  summary?: string;
  codexScore?: number;
  source: string;
  receivedAt: string;
  /** Provenance: matches the originating promotion-event id chain. */
  proofChainRef: string;
}

const stores: Record<DownstreamTarget, DownstreamRecord[]> = {
  thesis_corpus: [],
  eval_harness: [],
  tool_proposals: [],
  benchmark_registry: [],
};

const MAX_PER_STORE = 5_000;

export function appendDownstream(target: DownstreamTarget, record: DownstreamRecord): void {
  const store = stores[target];
  store.unshift(record);
  if (store.length > MAX_PER_STORE) store.length = MAX_PER_STORE;
}

export function listDownstream(
  target: DownstreamTarget,
  limit = 200,
): DownstreamRecord[] {
  return stores[target].slice(0, Math.max(1, Math.min(limit, MAX_PER_STORE)));
}

export function listAllDownstream(): Record<DownstreamTarget, DownstreamRecord[]> {
  return {
    thesis_corpus: stores.thesis_corpus.slice(0, 200),
    eval_harness: stores.eval_harness.slice(0, 200),
    tool_proposals: stores.tool_proposals.slice(0, 200),
    benchmark_registry: stores.benchmark_registry.slice(0, 200),
  };
}

export function downstreamCounts(): Record<DownstreamTarget, number> {
  return {
    thesis_corpus: stores.thesis_corpus.length,
    eval_harness: stores.eval_harness.length,
    tool_proposals: stores.tool_proposals.length,
    benchmark_registry: stores.benchmark_registry.length,
  };
}

export function _resetDownstreamForTests(): void {
  for (const k of Object.keys(stores) as DownstreamTarget[]) {
    stores[k].length = 0;
  }
}
