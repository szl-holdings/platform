import { TenantIdSchema } from '@workspace/aef-contracts';
import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import {
  defaultAuditEmitter,
  defaultCheckpointStore,
  defaultRunStore,
  devChunkStore,
  devIndexStore,
  devRawDocumentStore,
} from '@workspace/alloy-ingestion-orchestrator';
import express, { type Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { __resetRetrievalStoreForTests, getRetrievalStore } from '../retrieval-store.js';
import { evalsRouter } from '../routes/evals.js';
import { hybridSearchRouter } from '../routes/hybrid-search.js';
import { indexOpsRouter } from '../routes/index-ops.js';
import { ingestRouter } from '../routes/ingest.js';

const TENANT_ID = 'ingest-search-eval-tenant';
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalStoreBackend = process.env.AEF_STORE_BACKEND;
const originalNodeEnv = process.env.NODE_ENV;

function buildApp(tenantId = TENANT_ID): Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.traceId = 'ingest-search-eval-trace';
    req.tenantId = TenantIdSchema.parse(tenantId);
    req.profileId = 'default';
    next();
  });
  app.use('/', ingestRouter as unknown as express.RequestHandler);
  app.use('/', indexOpsRouter as unknown as express.RequestHandler);
  app.use('/', hybridSearchRouter as unknown as express.RequestHandler);
  app.use('/', evalsRouter as unknown as express.RequestHandler);
  return app;
}

beforeAll(() => {
  delete process.env.DATABASE_URL;
  process.env.AEF_STORE_BACKEND = 'in-memory';
  process.env.NODE_ENV = 'test';
  __resetRetrievalStoreForTests();
  defaultLedgerStore.clear();
  defaultRunStore.clear();
  defaultCheckpointStore.clear();
  defaultAuditEmitter.clear();
  devRawDocumentStore.clear();
  devChunkStore.clear();
  devIndexStore.clear();
});

afterAll(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalStoreBackend === undefined) delete process.env.AEF_STORE_BACKEND;
  else process.env.AEF_STORE_BACKEND = originalStoreBackend;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;

  __resetRetrievalStoreForTests();
  defaultLedgerStore.clear();
  defaultRunStore.clear();
  defaultCheckpointStore.clear();
  defaultAuditEmitter.clear();
  devRawDocumentStore.clear();
  devChunkStore.clear();
  devIndexStore.clear();
});

describe('AEF ingest → search → eval contract', () => {
  it('indexes orchestrated chunks into the shipping retrieval store and evaluates the same chunk', async () => {
    const app = buildApp();
    const sourceId = 'smoke-contract-source';
    const uniqueTerm = 'aefsmokecontractterm';

    const ingest = await request(app)
      .post('/v1/ingest')
      .send({
        requestId: 'ingest-contract-request',
        tenantId: TENANT_ID,
        documents: [
          {
            sourceId,
            profileId: 'default',
            title: 'AEF smoke contract document',
            content: `Maritime law retrieval evidence ${uniqueTerm}`,
            contentType: 'text/plain',
          },
        ],
      });

    expect(ingest.status).toBe(200);
    expect(ingest.body.totalChunksIndexed).toBeGreaterThan(0);
    expect(ingest.body.results).toHaveLength(1);
    expect(ingest.body.results[0]).toMatchObject({
      sourceId,
      runStatus: 'completed',
      chunksProduced: 1,
      chunksIndexed: 1,
    });
    expect(ingest.body.runIds).toEqual([ingest.body.results[0].runId]);

    const search = await request(app)
      .post('/v1/hybrid-search')
      .send({
        requestId: 'search-contract-request',
        tenantId: TENANT_ID,
        profileId: 'default',
        query: `${uniqueTerm} maritime law`,
        topK: 10,
        candidatePool: 100,
        rerankEnabled: false,
        includeProvenance: true,
      });

    expect(search.status).toBe(200);
    const hit = search.body.hits.find(
      (candidate: { sourceId?: string }) => candidate.sourceId === sourceId,
    );
    expect(hit).toBeDefined();
    if (!hit) throw new Error(`Expected a search hit for ${sourceId}`);
    expect(hit.chunkId).toEqual(expect.any(String));
    expect(hit.evidenceId).toEqual(expect.any(String));
    expect(hit.evidence).toMatchObject({
      tenantId: TENANT_ID,
      sourceId,
      backendId: 'dev-hash+in-memory',
      policyAllow: true,
    });

    const evaluation = await request(app)
      .post('/v1/evals/run')
      .send({
        requestId: 'eval-contract-request',
        tenantId: TENANT_ID,
        profileId: 'default',
        datasetId: 'smoke-contract-dataset',
        topK: 10,
        metrics: ['recall'],
        queries: [
          {
            queryId: 'smoke-contract-query',
            query: `${uniqueTerm} maritime law`,
            relevantChunkIds: [hit.chunkId],
          },
        ],
      });

    expect(evaluation.status).toBe(200);
    expect(evaluation.body).toMatchObject({
      status: 'completed',
      queryCount: 1,
      metrics: [{ metric: 'recall', value: 1, atK: 10 }],
    });
    expect(evaluation.body.runId).toEqual(expect.any(String));
    expect(evaluation.body.traceId).toBe('ingest-search-eval-trace');
  });

  it('returns 207 for a mixed document batch while preserving only successful retrieval writes', async () => {
    const app = buildApp();
    const indexedSourceId = 'mixed-batch-indexed-source';
    const rejectedSourceId = 'mixed-batch-rejected-source';
    const uniqueTerm = 'aefmixedbatchterm';

    const ingest = await request(app)
      .post('/v1/ingest')
      .send({
        requestId: 'mixed-batch-request',
        tenantId: TENANT_ID,
        documents: [
          {
            sourceId: indexedSourceId,
            profileId: 'default',
            content: `Maritime retrieval content ${uniqueTerm}`,
            contentType: 'text/plain',
          },
          {
            sourceId: rejectedSourceId,
            profileId: 'default',
            content: '   ',
            contentType: 'text/plain',
          },
        ],
      });

    expect(ingest.status).toBe(207);
    expect(ingest.body.totalChunksIndexed).toBe(1);
    expect(ingest.body.results).toHaveLength(2);
    expect(ingest.body.results[0]).toMatchObject({
      sourceId: indexedSourceId,
      runStatus: 'completed',
      chunksProduced: 1,
      chunksIndexed: 1,
    });
    expect(ingest.body.results[1]).toMatchObject({
      sourceId: rejectedSourceId,
      chunksProduced: 0,
      chunksIndexed: 0,
      error: expect.stringContaining('produced no policy-approved chunks'),
    });
    expect(ingest.body.runIds).toEqual([
      ingest.body.results[0].runId,
      ingest.body.results[1].runId,
    ]);

    const search = await request(app).post('/v1/hybrid-search').send({
      requestId: 'mixed-batch-search-request',
      tenantId: TENANT_ID,
      profileId: 'default',
      query: uniqueTerm,
      topK: 10,
      candidatePool: 100,
      rerankEnabled: false,
      includeProvenance: true,
    });

    expect(search.status).toBe(200);
    expect(
      search.body.hits.some(
        (candidate: { sourceId?: string }) => candidate.sourceId === indexedSourceId,
      ),
    ).toBe(true);
    expect(
      search.body.hits.some(
        (candidate: { sourceId?: string }) => candidate.sourceId === rejectedSourceId,
      ),
    ).toBe(false);
  });

  it('compensates the vector write when metadata indexing fails', async () => {
    const app = buildApp();
    const { bundle } = getRetrievalStore();
    const vectorCountBefore = await bundle.vectors.count(TENANT_ID);
    const metadataCountBefore = await bundle.metadataIndex.count(TENANT_ID);
    const originalMetadataUpsert = bundle.metadataIndex.upsert;
    bundle.metadataIndex.upsert = async () => {
      throw new Error('injected metadata write failure');
    };

    const ingest = await (async () => {
      try {
        return await request(app)
          .post('/v1/ingest')
          .send({
            requestId: 'rollback-contract-request',
            tenantId: TENANT_ID,
            documents: [
              {
                sourceId: 'rollback-contract-source',
                profileId: 'default',
                content: 'This document must not leave a vector-only retrieval row.',
                contentType: 'text/plain',
              },
            ],
          });
      } finally {
        bundle.metadataIndex.upsert = originalMetadataUpsert;
      }
    })();

    expect(ingest.status).toBe(207);
    expect(ingest.body.totalChunksIndexed).toBe(0);
    expect(ingest.body.results[0]).toMatchObject({
      sourceId: 'rollback-contract-source',
      chunksProduced: 1,
      chunksIndexed: 0,
      error: 'injected metadata write failure',
    });
    expect(await bundle.vectors.count(TENANT_ID)).toBe(vectorCountBefore);
    expect(await bundle.metadataIndex.count(TENANT_ID)).toBe(metadataCountBefore);
  });

  it('returns indistinguishable not-found responses for cross-tenant run lookups', async () => {
    const ownerApp = buildApp();
    const submitted = await request(ownerApp)
      .post('/v1/ingest')
      .send({
        requestId: 'run-ownership-request',
        tenantId: TENANT_ID,
        documents: [
          {
            sourceId: 'run-ownership-source',
            content: 'Tenant-owned run status must not cross the boundary.',
            contentType: 'text/plain',
          },
        ],
      });
    expect(submitted.status).toBe(200);
    const runId = submitted.body.runIds[0] as string;

    const ownLookup = await request(ownerApp).get(`/v1/ingest/runs/${runId}`);
    const otherTenantApp = buildApp('other-tenant');
    const crossIngestLookup = await request(otherTenantApp).get(`/v1/ingest/runs/${runId}`);
    const crossIndexLookup = await request(otherTenantApp).get(`/v1/index/runs/${runId}`);
    const unknownLookup = await request(otherTenantApp).get(
      '/v1/ingest/runs/00000000-0000-0000-0000-000000000000',
    );

    expect(ownLookup.status).toBe(200);
    expect(crossIngestLookup.status).toBe(404);
    expect(crossIndexLookup.status).toBe(404);
    expect(unknownLookup.status).toBe(404);
    expect(crossIngestLookup.body).toEqual(unknownLookup.body);
    expect(crossIndexLookup.body).toEqual(unknownLookup.body);
  });
});
