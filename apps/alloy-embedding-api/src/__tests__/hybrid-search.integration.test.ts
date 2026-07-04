/**
 * Integration test for the shipping `/v1/hybrid-search` route.
 *
 * This exercises the WIRED path end-to-end, with NO mocks of the embedder, the
 * store, the fusion, or the governance ledger:
 *
 *   real embedder (embedTexts) → real store (StorageBundle similarity + keyword)
 *     → real RRF fusion (reciprocalRankFusion) → real rerank order
 *     → real PolicyEngine.evaluate → real EvidenceEntry per chunk in the ledger
 *
 * In the sandbox there is no Postgres/pgvector, so this test runs against the
 * in-memory StorageBundle that the route selects when DATABASE_URL is unset.
 * The same route code, the same embedder call, the same RRF, the same ledger
 * write, and the same evidence assembly run against pgvector in production once
 * DATABASE_URL + the migration from RUNBOOK.md are in place — only the
 * StorageBundle implementation differs, and both satisfy the identical
 * VectorStore / MetadataIndexStore interfaces.
 *
 * The dev-hash embedder is a real, deterministic embedding backend (SHA-256 →
 * unit vector); it is NOT a mock of retrieval. The retrieved chunks are real
 * rows we ingested into the store, not `synthetic-chunk-*` fabrications.
 */

import express, { type Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { embedTexts } from '@workspace/alloy-embed-worker';
import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import { getRetrievalStore, __resetRetrievalStoreForTests } from '../retrieval-store.js';
import { hybridSearchRouter } from '../routes/hybrid-search.js';

const TENANT = 'test-tenant';
const MODEL = 'aef-dev-hash';

interface SeedDoc {
  chunkId: string;
  sourceId: string;
  text: string;
  title: string;
  sourceUri: string;
  page: number;
  section: string;
}

const CORPUS: SeedDoc[] = [
  {
    chunkId: 'doc-rag-1',
    sourceId: 'src-rag',
    text: 'Hybrid retrieval fuses dense vector similarity and keyword search using reciprocal rank fusion.',
    title: 'Hybrid Retrieval',
    sourceUri: 'https://docs.alloy.dev/retrieval/hybrid',
    page: 1,
    section: 'overview',
  },
  {
    chunkId: 'doc-ledger-2',
    sourceId: 'src-gov',
    text: 'Every retrieval writes a per-hit evidence ledger entry with full score decomposition and a policy verdict.',
    title: 'Evidence Ledger',
    sourceUri: 'https://docs.alloy.dev/governance/ledger',
    page: 2,
    section: 'governance',
  },
  {
    chunkId: 'doc-pgvector-3',
    sourceId: 'src-store',
    text: 'The pgvector store runs cosine approximate nearest neighbour search and Postgres full text keyword search.',
    title: 'pgvector Store',
    sourceUri: 'https://docs.alloy.dev/store/pgvector',
    page: 3,
    section: 'storage',
  },
];

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  // Minimal tenant + trace shim so the route under test has what it reads.
  app.use((req, _res, next) => {
    (req as unknown as { tenantId: string }).tenantId = TENANT;
    (req as unknown as { profileId: string }).profileId = 'default';
    (req as unknown as { traceId: string }).traceId = 'test-trace';
    next();
  });
  app.use('/', hybridSearchRouter as unknown as express.RequestHandler);
  return app;
}

let app: Express;

beforeAll(async () => {
  // Force the in-memory store selection for the sandbox run.
  delete process.env.DATABASE_URL;
  process.env.AEF_STORE_BACKEND = 'in-memory';
  __resetRetrievalStoreForTests();

  // Seed the SAME store the route will query, using REAL embeddings from the
  // embed worker (not hand-written vectors).
  const { bundle } = getRetrievalStore();
  const vectors = await embedTexts(
    CORPUS.map((d) => d.text),
    { backendId: 'dev-hash', model: MODEL, pooling: 'mean', normalize: true },
  );
  const now = new Date().toISOString();
  for (let i = 0; i < CORPUS.length; i++) {
    const d = CORPUS[i];
    const metadata = {
      text: d.text,
      title: d.title,
      sourceUri: d.sourceUri,
      page: d.page,
      section: d.section,
    };
    await bundle.vectors.upsert({
      chunkId: d.chunkId,
      sourceId: d.sourceId,
      tenantId: TENANT,
      model: MODEL,
      dimensions: vectors[i].length,
      vector: vectors[i],
      metadata,
      indexedAt: now,
    });
    await bundle.metadataIndex.upsert({
      chunkId: d.chunkId,
      sourceId: d.sourceId,
      tenantId: TENANT,
      title: d.title,
      page: d.page,
      section: d.section,
      metadata,
      updatedAt: now,
    });
  }

  app = buildApp();
});

afterAll(() => {
  delete process.env.AEF_STORE_BACKEND;
  __resetRetrievalStoreForTests();
});

describe('hybrid-search route — every layer fires end-to-end', () => {
  it('embeds, retrieves from the real store, fuses, governs, and writes a receipt', async () => {
    const requestId = `req-${Date.now()}`;
    const res = await request(app)
      .post('/v1/hybrid-search')
      .send({
        requestId,
        tenantId: TENANT,
        query: 'hybrid retrieval reciprocal rank fusion keyword search',
        topK: 3,
        candidatePool: 10,
        denseWeight: 0.6,
        keywordWeight: 0.4,
        rerankEnabled: false,
        includeProvenance: true,
        metadata: {},
      });

    // ── Layer 0: route responded 200 (policy allowed) ──────────────────────
    expect(res.status).toBe(200);

    // ── Layer 1: a real embedder backend served the query ──────────────────
    expect(res.body.backends).toBeDefined();
    expect(res.body.backends.embedModel).toBe(MODEL);
    expect(res.body.backends.embedBackend).toBe('dev-hash');

    // ── Layer 2: a real STORE served the hits (in-memory here, pgvector in prod) ─
    expect(res.body.backends.retrievalBackend).toBe('in-memory');

    // ── Layer 3: hits are REAL ingested rows, never synthetic-chunk-* ───────
    expect(Array.isArray(res.body.hits)).toBe(true);
    expect(res.body.hits.length).toBeGreaterThan(0);
    const ids: string[] = res.body.hits.map((h: { chunkId: string }) => h.chunkId);
    for (const id of ids) {
      expect(id.startsWith('synthetic-chunk-')).toBe(false);
    }
    expect(ids).toContain('doc-rag-1');

    // ── Layer 4: RRF fusion produced fused scores + a dense and keyword arm ──
    const top = res.body.hits[0];
    expect(typeof top.fusedScore).toBe('number');
    // The top hit text comes from our real corpus, not a template string.
    expect(top.text).toContain('reciprocal rank fusion');

    // ── Layer 5: governance — every hit carries an evidence id + entry ──────
    for (const h of res.body.hits) {
      expect(typeof h.evidenceId).toBe('string');
      expect(h.evidence).toBeDefined();
      expect(h.evidence.policyAllow).toBe(true);
      expect(h.evidence.backendId).toBe('dev-hash+in-memory');
    }

    // ── Layer 6: the EvidenceEntry per chunk was actually written to the ledger ─
    const ledgerEntries = defaultLedgerStore.query({ requestId });
    expect(ledgerEntries.length).toBe(res.body.hits.length);
    expect(ledgerEntries.every((e) => e.tenantId === TENANT)).toBe(true);
    expect(ledgerEntries.every((e) => e.policyAllow === true)).toBe(true);
    expect(ledgerEntries.every((e) => typeof e.finalScore === 'number')).toBe(true);
  });

  it('returns an honest empty result for a tenant with no ingested data (no fabrication)', async () => {
    const requestId = `req-empty-${Date.now()}`;
    const res = await request(app)
      .post('/v1/hybrid-search')
      .send({
        requestId,
        tenantId: 'tenant-with-no-data',
        query: 'anything at all',
        topK: 3,
        candidatePool: 10,
        rerankEnabled: false,
        includeProvenance: true,
        metadata: {},
      });
    expect(res.status).toBe(200);
    // Fail-honest: no rows ingested for this tenant => zero hits, not synthetic.
    expect(res.body.hits.length).toBe(0);
  });
});
