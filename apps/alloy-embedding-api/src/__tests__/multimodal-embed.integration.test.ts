import express, { type Express } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import {
  OVIS_OMNI_ARTIFACT_SET_DIGEST,
  OVIS_OMNI_MODEL_ID,
  OVIS_OMNI_REVISION,
} from '@workspace/alloy-embed-worker';
import { multimodalEmbedRouter } from '../routes/multimodal-embed.js';

const originalFetch = globalThis.fetch;
const originalNodeEnv = process.env.NODE_ENV;

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.traceId = 'trace-mm-test';
    req.tenantId = 'tenant-1';
    req.profileId = 'default';
    next();
  });
  app.use('/', multimodalEmbedRouter as unknown as express.RequestHandler);
  return app;
}

function validRequest() {
  return {
    requestId: 'req-mm-1',
    tenantId: 'tenant-1',
    modelId: OVIS_OMNI_MODEL_ID,
    modelRevision: OVIS_OMNI_REVISION,
    dimensions: 2048,
    normalize: true,
    items: [
      {
        itemId: 'item-1',
        instruction: 'Retrieve evidence relevant to this text.',
        segments: [{ kind: 'text', text: 'governed multimodal retrieval' }],
      },
    ],
    metadata: {},
  };
}

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.OVIS_OMNI_URL = 'https://ovis.internal';
  defaultLedgerStore.clear();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  delete process.env.OVIS_OMNI_URL;
  defaultLedgerStore.clear();
});

describe('/v1/multimodal/embed', () => {
  it('returns exact-revision vectors and writes immutable model evidence', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          requestId: 'req-mm-1',
          tenantId: 'tenant-1',
          modelId: OVIS_OMNI_MODEL_ID,
          modelRevision: OVIS_OMNI_REVISION,
          dimensions: 2048,
          vectors: [
            {
              itemId: 'item-1',
              vector: Array.from({ length: 2048 }, () => 0),
              inputDigest: 'a'.repeat(64),
              modalities: ['text'],
              tokenCount: 4,
            },
          ],
          execution: {
            backendId: 'ovis-omni-python',
            modelId: OVIS_OMNI_MODEL_ID,
            modelRevision: OVIS_OMNI_REVISION,
            artifactSetDigest: OVIS_OMNI_ARTIFACT_SET_DIGEST,
            processorRevision: OVIS_OMNI_REVISION,
            runtimeId: 'substrate-py-workers/ovis-omni',
            runtimeVersion: '1.0.0',
            dimensions: 2048,
            normalized: true,
            promotionState: 'EVALUATION_HOLD',
            supportedModalities: ['text', 'image', 'visual_document', 'audio', 'video', 'interleaved'],
          },
        }),
        { status: 200 },
      ),
    ) as typeof fetch;

    const response = await request(buildApp()).post('/v1/multimodal/embed').send(validRequest());
    expect(response.status).toBe(200);
    expect(response.body.execution.artifactSetDigest).toBe(OVIS_OMNI_ARTIFACT_SET_DIGEST);
    expect(response.body.execution.promotionState).toBe('EVALUATION_HOLD');

    const evidence = defaultLedgerStore.query({ requestId: 'req-mm-1' });
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      modelId: OVIS_OMNI_MODEL_ID,
      modelRevision: OVIS_OMNI_REVISION,
      artifactSetDigest: OVIS_OMNI_ARTIFACT_SET_DIGEST,
      inputDigest: 'a'.repeat(64),
      promotionState: 'EVALUATION_HOLD',
    });
  });

  it('rejects unpublished projection widths before contacting the runtime', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
    const body = validRequest();
    body.dimensions = 1024;

    const response = await request(buildApp()).post('/v1/multimodal/embed').send(body);
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('PROJECTION_ASSET_NOT_ADMITTED');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects mutable HTTP media references at the contract boundary', async () => {
    const body = validRequest();
    body.items[0].segments = [
      {
        kind: 'asset',
        asset: {
          assetId: 'asset-1',
          uri: 'https://example.com/mutable.png',
          sha256: 'a'.repeat(64),
          mediaType: 'image/png',
          byteLength: 123,
          modality: 'image',
        },
      },
    ] as never;

    const response = await request(buildApp()).post('/v1/multimodal/embed').send(body);
    expect(response.status).toBe(400);
  });
});
