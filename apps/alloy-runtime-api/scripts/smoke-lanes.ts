/**
 * Smoke test script for the AEEP runtime API — embed, rerank, and evals lanes.
 *
 * Usage (from repo root):
 *   pnpm --filter @workspace/alloy-runtime-api smoke:lanes
 *
 * Environment / arguments:
 *   API_BASE   base URL of the running API (default: http://localhost:4010)
 *   API_KEY    ALLOY_API_KEY value (default: dev-local-key)
 *   TENANT_ID  tenant to use for all requests (default: smoke-tenant)
 *
 * Or pass as positional args:
 *   tsx scripts/smoke-lanes.ts <baseUrl> <apiKey> <tenantId>
 *
 * Exits 0 if all lanes pass, 1 on any failure.
 */

const BASE = process.argv[2] ?? process.env['API_BASE'] ?? 'http://localhost:4010';
const KEY = process.argv[3] ?? process.env['API_KEY'] ?? 'dev-local-key';
const TENANT = process.argv[4] ?? process.env['TENANT_ID'] ?? 'smoke-tenant';

const HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Api-Key': KEY,
  'X-Tenant-Id': TENANT,
};

type Result = { lane: string; ok: boolean; detail: string };
const results: Result[] = [];

function pass(lane: string, detail: string): void {
  results.push({ lane, ok: true, detail });
  console.log(`  ✓ ${lane}: ${detail}`);
}

function fail(lane: string, detail: string): void {
  results.push({ lane, ok: false, detail });
  console.error(`  ✗ ${lane}: ${detail}`);
}

async function post(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function get(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function smokeEmbed(): Promise<void> {
  console.log('\n[1/5] POST /v1/embed');
  try {
    const resp = await post('/v1/embed', {
      texts: ['retrieval augmented generation pipeline', 'investor demo smoke test'],
    }) as Record<string, unknown>;

    const embeddings = resp['embeddings'] as Array<Record<string, unknown>>;
    if (!Array.isArray(embeddings) || embeddings.length !== 2)
      throw new Error('expected 2 embeddings');

    const vec = embeddings[0]?.['vector'] as number[] | undefined;
    if (!Array.isArray(vec) || vec.length === 0)
      throw new Error('vector is empty');

    const nonZero = vec.some((v) => v !== 0);
    if (!nonZero) throw new Error('all vector components are zero');

    const dims = Number(resp['dimensions']);
    if (dims <= 0) throw new Error(`dimensions is ${dims}`);

    const hasTraceId = typeof resp['traceId'] === 'string';
    const hasProcessingMs = typeof resp['processingMs'] === 'number';
    const hasPath = Array.isArray(resp['embeddingPath']) && (resp['embeddingPath'] as string[]).length > 0;

    if (!hasTraceId || !hasProcessingMs || !hasPath)
      throw new Error('missing envelope fields (traceId, processingMs, embeddingPath)');

    pass('embed', `dimensions=${dims}, vector[0..3]=${vec.slice(0, 3).map((v) => v.toFixed(4)).join(',')}`);
  } catch (e) {
    fail('embed', String(e));
  }
}

async function smokeEmbedDeterminism(): Promise<void> {
  console.log('\n[2/5] POST /v1/embed — determinism check');
  try {
    const text = 'deterministic-round-trip-check';
    const [r1, r2] = await Promise.all([
      post('/v1/embed', { texts: [text] }) as Promise<Record<string, unknown>>,
      post('/v1/embed', { texts: [text] }) as Promise<Record<string, unknown>>,
    ]);

    const v1 = ((r1['embeddings'] as Array<Record<string, unknown>>)[0]?.['vector'] as number[]);
    const v2 = ((r2['embeddings'] as Array<Record<string, unknown>>)[0]?.['vector'] as number[]);

    if (!v1 || !v2) throw new Error('missing vectors');
    const allSame = v1.every((v, i) => Math.abs(v - (v2[i] ?? 0)) < 1e-9);
    if (!allSame) throw new Error('vectors differ across calls — not deterministic');

    pass('embed:determinism', 'same input → identical vector across two calls');
  } catch (e) {
    fail('embed:determinism', String(e));
  }
}

async function smokeRerank(): Promise<void> {
  console.log('\n[3/5] POST /v1/rerank');
  try {
    const passages = [
      'Dolphins are highly intelligent marine mammals.',
      'The merger agreement includes antitrust indemnification clauses.',
      'Antitrust law governs competitive market conduct.',
      'Stock price movements reflect quarterly earnings.',
    ];
    const resp = await post('/v1/rerank', {
      query: 'antitrust merger agreement',
      passages,
      topN: 3,
    }) as Record<string, unknown>;

    const reranked = resp['reranked'] as Array<Record<string, unknown>>;
    if (!Array.isArray(reranked) || reranked.length === 0)
      throw new Error('reranked is empty');

    const scores = reranked.map((r) => Number(r['rerankerScore']));
    const allPositive = scores.some((s) => s > 0);
    if (!allPositive) throw new Error('all reranker scores are zero');

    const originalRanks = reranked.map((r) => Number(r['originalRank']));
    const sortedByOriginal = [...originalRanks].sort((a, b) => a - b);
    const wasReordered = originalRanks.join(',') !== sortedByOriginal.join(',');
    if (!wasReordered) throw new Error('passages were not reordered (same as input order)');

    const hasMeta = typeof resp['traceId'] === 'string' && typeof resp['processingMs'] === 'number';
    if (!hasMeta) throw new Error('missing envelope fields');

    pass('rerank', `top result: "${String(reranked[0]?.['text']).slice(0, 50)}..." score=${scores[0]?.toFixed(4)}`);
  } catch (e) {
    fail('rerank', String(e));
  }
}

async function smokeEvals(): Promise<void> {
  console.log('\n[4/5] POST /v1/evals/run (sync)');
  try {
    const resp = await post('/v1/evals/run', {
      suiteId: 'prism_legal_matter',
      metrics: ['context_recall', 'context_precision', 'faithfulness', 'answer_relevancy'],
      async: false,
    }) as Record<string, unknown>;

    if (resp['status'] !== 'completed') throw new Error(`status=${resp['status']}, expected completed`);

    const results = resp['results'] as Record<string, unknown> | null;
    if (!results) throw new Error('results is null');

    const sampleCount = Number(results['sampleCount']);
    if (sampleCount <= 0) throw new Error(`sampleCount=${sampleCount}`);

    const scores = results['scores'] as Record<string, number | null>;
    const nonNullScores = Object.entries(scores).filter(([, v]) => v !== null);
    if (nonNullScores.length === 0) throw new Error('all metric scores are null');

    const hasPositive = nonNullScores.some(([, v]) => (v ?? 0) > 0);
    if (!hasPositive) throw new Error('no metric score > 0');

    const hasMeta = typeof resp['traceId'] === 'string' && typeof resp['processingMs'] === 'number';
    if (!hasMeta) throw new Error('missing envelope fields');

    pass('evals:sync', `sampleCount=${sampleCount}, scores=${nonNullScores.map(([k, v]) => `${k}=${(v ?? 0).toFixed(3)}`).join(', ')}`);
  } catch (e) {
    fail('evals:sync', String(e));
  }
}

async function smokeEvalsAsync(): Promise<void> {
  console.log('\n[5/5] POST /v1/evals/run (async) + GET /v1/evals/:evalRunId');
  try {
    const resp = await post('/v1/evals/run', {
      suiteId: 'prism_legal_matter',
      metrics: ['context_recall', 'context_precision'],
      async: true,
    }) as Record<string, unknown>;

    if (resp['status'] !== 'queued') throw new Error(`initial status=${resp['status']}, expected queued`);

    const evalRunId = String(resp['evalRunId']);
    if (!evalRunId) throw new Error('no evalRunId returned');

    await new Promise((r) => setTimeout(r, 300));

    const status = await get(`/v1/evals/${evalRunId}`) as Record<string, unknown>;
    if (!['queued', 'running', 'completed'].includes(String(status['status'])))
      throw new Error(`unexpected status: ${status['status']}`);

    if (String(status['tenantId']) !== TENANT)
      throw new Error('tenantId mismatch in fetched run');

    pass('evals:async', `evalRunId=${evalRunId}, status=${status['status']}`);
  } catch (e) {
    fail('evals:async', String(e));
  }
}

async function main(): Promise<void> {
  console.log(`\nAEEP Runtime API — Lane Smoke Test`);
  console.log(`Base: ${BASE}  Tenant: ${TENANT}`);
  console.log('─'.repeat(60));

  await smokeEmbed();
  await smokeEmbedDeterminism();
  await smokeRerank();
  await smokeEvals();
  await smokeEvalsAsync();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log('\n' + '─'.repeat(60));
  console.log(`Summary: ${passed}/${results.length} lanes passed`);
  if (failed > 0) {
    console.error(`\n${failed} lane(s) FAILED:`);
    results.filter((r) => !r.ok).forEach((r) => console.error(`  ✗ ${r.lane}: ${r.detail}`));
    process.exit(1);
  } else {
    console.log('\nAll lanes operational. ✓');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
