#!/usr/bin/env tsx
/**
 * aef-smoke.ts — AEF Phase 3 smoke test
 *
 * Exercises the maintained AEF API contract, including a real
 * ingest → hybrid-search → eval chain, and exits non-zero on failure.
 *
 * Usage:
 *   tsx scripts/aef-smoke.ts
 *   AEF_API_URL=http://localhost:8080/alloy-embedding-api tsx scripts/aef-smoke.ts
 */

const BASE_URL = process.env.AEF_API_URL ?? 'http://localhost:8080/alloy-embedding-api';
const API_KEY = process.env.AEF_API_KEY ?? '';
const TENANT_ID = 'smoke-test-tenant';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  'x-tenant-id': TENANT_ID,
};

let passed = 0;
let failed = 0;

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  running: ${name} ... `);
  try {
    await fn();
    process.stdout.write('PASS\n');
    passed++;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`FAIL: ${message}\n`);
    failed++;
  }
}

async function post(path: string, body: unknown): Promise<{ status: number; json: unknown }> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function get(path: string): Promise<{ status: number; text: string }> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  return { status: res.status, text };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const smokeNonce = `${Date.now()}-${process.pid}`;
  const smokeSourceId = `smoke-doc-${smokeNonce}`;
  const smokeSearchTerm = `aefsmoke${Date.now()}`;
  let ingestedChunkId = '';

  await runTest('GET /health returns 200', async () => {
    const { status, text } = await get('/health');
    assert(status === 200, `Expected 200, got ${status}: ${text}`);
    const data = JSON.parse(text) as { status: string };
    assert(data.status === 'ok', `Expected status=ok, got ${data.status}`);
  });

  await runTest('GET /docs returns OpenAPI spec', async () => {
    const { status, text } = await get('/docs');
    assert(status === 200, `Expected 200, got ${status}`);
    const data = JSON.parse(text) as { openapi: string };
    assert(data.openapi?.startsWith('3.'), `Expected OpenAPI 3.x, got ${data.openapi}`);
  });

  await runTest('POST /v1/embed returns vectors', async () => {
    const embedRequestId = `smoke-embed-${Date.now()}`;
    const { status, json } = await post('/v1/embed', {
      requestId: embedRequestId,
      tenantId: TENANT_ID,
      texts: ['What is maritime law?', 'Define force majeure clause.'],
      model: 'aef-dev-hash',
      normalize: true,
    });
    const data = json as {
      vectors: Array<{ vector: number[]; index: number }>;
      dimensions: number;
      traceId: string;
    };
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`);
    assert(Array.isArray(data.vectors), 'Expected vectors array');
    assert(data.vectors.length === 2, `Expected 2 vectors, got ${data.vectors.length}`);
    assert(data.dimensions > 0, `Expected positive dimensions, got ${data.dimensions}`);
    assert(typeof data.traceId === 'string', 'Expected traceId string');
    const v = data.vectors[0]?.vector;
    assert(Array.isArray(v) && v.length > 0, 'Expected non-empty vector');
  });

  await runTest('POST /v1/rerank returns ranked results', async () => {
    const { status, json } = await post('/v1/rerank', {
      requestId: `smoke-rerank-${Date.now()}`,
      tenantId: TENANT_ID,
      query: 'maritime law force majeure',
      candidates: [
        { id: 'c1', text: 'Force majeure is a legal concept in maritime contracts.', score: 0.8 },
        { id: 'c2', text: 'Stock market regulations differ by country.', score: 0.3 },
        { id: 'c3', text: 'Maritime law governs shipping and navigation.', score: 0.7 },
      ],
      topK: 2,
    });
    const data = json as { results: Array<{ id: string; rank: number; score: number }> };
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`);
    assert(Array.isArray(data.results), 'Expected results array');
    assert(data.results.length === 2, `Expected 2 results, got ${data.results.length}`);
    assert(data.results[0]?.rank === 1, `Expected rank=1 for top result`);
  });

  await runTest('POST /v1/ingest indexes a completed workflow', async () => {
    const { status, json } = await post('/v1/ingest', {
      requestId: `smoke-ingest-${smokeNonce}`,
      tenantId: TENANT_ID,
      documents: [
        {
          sourceId: smokeSourceId,
          profileId: 'default',
          content: `This indexed document covers maritime law and carries the unique retrieval term ${smokeSearchTerm}.`,
          contentType: 'text/plain',
          title: 'AEF smoke retrieval document',
        },
      ],
    });
    const data = json as {
      results: Array<{
        sourceId: string;
        chunksProduced: number;
        chunksIndexed: number;
        runId: string;
        runStatus: string;
      }>;
      totalChunksIndexed: number;
      runIds: string[];
      traceId: string;
    };
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`);
    assert(Array.isArray(data.results) && data.results.length === 1, 'Expected one ingest result');
    const result = data.results[0];
    assert(result !== undefined, 'Expected the ingest result to be present');
    assert(result.sourceId === smokeSourceId, `Expected sourceId=${smokeSourceId}`);
    assert(
      result.runStatus === 'completed',
      `Expected completed workflow, got ${result.runStatus}`,
    );
    assert(result.chunksProduced > 0, `Expected chunksProduced > 0, got ${result.chunksProduced}`);
    assert(
      result.chunksIndexed === result.chunksProduced,
      `Expected all produced chunks indexed, got ${result.chunksIndexed}/${result.chunksProduced}`,
    );
    assert(
      data.totalChunksIndexed === result.chunksIndexed,
      `Expected totalChunksIndexed=${result.chunksIndexed}, got ${data.totalChunksIndexed}`,
    );
    assert(
      data.runIds?.[0] === result.runId,
      'Expected response runIds to include the workflow run',
    );
    assert(typeof data.traceId === 'string', 'Expected traceId string');
  });

  await runTest('POST /v1/hybrid-search retrieves the ingested chunk with evidence', async () => {
    const { status, json } = await post('/v1/hybrid-search', {
      requestId: `smoke-search-${Date.now()}`,
      tenantId: TENANT_ID,
      profileId: 'default',
      query: `${smokeSearchTerm} maritime law`,
      topK: 10,
      candidatePool: 100,
      denseWeight: 0.6,
      keywordWeight: 0.4,
      rerankEnabled: false,
      includeProvenance: true,
    });
    const data = json as {
      hits: Array<{
        chunkId: string;
        sourceId: string;
        finalScore: number;
        evidenceId: string;
        selectedRationale: string;
      }>;
      traceId: string;
    };
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`);
    assert(Array.isArray(data.hits), 'Expected hits array');
    assert(data.hits.length > 0, 'Expected at least one hit');
    const h = data.hits.find((hit) => hit.sourceId === smokeSourceId);
    assert(h !== undefined, `Expected a hit for the just-ingested source ${smokeSourceId}`);
    assert(typeof h.chunkId === 'string', 'Expected chunkId string');
    ingestedChunkId = h.chunkId;
    assert(typeof h.finalScore === 'number', 'Expected finalScore number');
    assert(typeof h.evidenceId === 'string', 'Expected evidenceId string');
    assert(typeof h.selectedRationale === 'string', 'Expected selectedRationale string');
    assert(typeof data.traceId === 'string', 'Expected traceId string');
  });

  await runTest('POST /v1/index/rebuild returns 202 job queued', async () => {
    const { status, json } = await post('/v1/index/rebuild', {
      requestId: `smoke-rebuild-${Date.now()}`,
      tenantId: TENANT_ID,
    });
    const data = json as { status: string; jobId: string };
    assert(status === 202, `Expected 202, got ${status}: ${JSON.stringify(json)}`);
    assert(typeof data.jobId === 'string', 'Expected jobId string');
  });

  await runTest('POST /v1/index/verify returns verified', async () => {
    const { status, json } = await post('/v1/index/verify', {
      requestId: `smoke-verify-${Date.now()}`,
      tenantId: TENANT_ID,
    });
    const data = json as { verified: boolean };
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`);
    assert(typeof data.verified === 'boolean', 'Expected verified boolean');
  });

  await runTest('POST /v1/evals/run evaluates the ingested chunk', async () => {
    assert(ingestedChunkId.length > 0, 'Expected hybrid-search to capture an ingested chunk id');
    const { status, json } = await post('/v1/evals/run', {
      requestId: `smoke-evals-${Date.now()}`,
      tenantId: TENANT_ID,
      profileId: 'default',
      datasetId: 'smoke-dataset',
      topK: 10,
      metrics: ['recall'],
      queries: [
        {
          queryId: 'q1',
          query: `${smokeSearchTerm} maritime law`,
          relevantChunkIds: [ingestedChunkId],
        },
      ],
    });
    const data = json as {
      status: string;
      queryCount: number;
      metrics: Array<{ metric: string; value: number; atK: number }>;
      runId: string;
      traceId: string;
    };
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`);
    assert(data.status === 'completed', `Expected status=completed, got ${data.status}`);
    assert(data.queryCount === 1, `Expected queryCount=1, got ${data.queryCount}`);
    const recall = data.metrics.find((metric) => metric.metric === 'recall');
    assert(recall !== undefined, 'Expected a recall metric');
    assert(recall.value === 1, `Expected recall=1 for the ingested chunk, got ${recall.value}`);
    assert(recall.atK === 10, `Expected recall atK=10, got ${recall.atK}`);
    assert(typeof data.runId === 'string', 'Expected runId string');
    assert(typeof data.traceId === 'string', 'Expected traceId string');
  });

  await runTest('POST /v1/openai/embeddings (OpenAI-compat) returns embedding list', async () => {
    const { status, json } = await post('/v1/openai/embeddings', {
      input: ['maritime law', 'legal contract'],
      model: 'aef-default',
    });
    const data = json as { object: string; data: Array<{ embedding: number[] }> };
    assert(status === 200, `Expected 200, got ${status}: ${JSON.stringify(json)}`);
    assert(data.object === 'list', `Expected object=list, got ${data.object}`);
    assert(Array.isArray(data.data), 'Expected data array');
    assert(data.data.length === 2, `Expected 2 embeddings, got ${data.data.length}`);
    assert(Array.isArray(data.data[0]?.embedding), 'Expected embedding array');
  });

  process.stdout.write(`\nAEF smoke: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((_err) => {
  process.exit(1);
});
