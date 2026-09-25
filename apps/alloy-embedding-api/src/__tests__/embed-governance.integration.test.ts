import { TenantIdSchema } from '@workspace/aef-contracts';
import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import express, { type Express } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { embedRouter } from '../routes/embed.js';

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.traceId = 'trace-test';
    req.tenantId = TenantIdSchema.parse('tenant-1');
    req.profileId = 'default';
    next();
  });
  app.use('/', embedRouter as unknown as express.RequestHandler);
  return app;
}

const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
  delete process.env.SUBSTRATE_EMBED_URL;
  delete process.env.HF_EMBED_URL;
  process.env.NODE_ENV = 'test';
  defaultLedgerStore.clear();
});

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  delete process.env.SUBSTRATE_EMBED_URL;
  delete process.env.HF_EMBED_URL;
  defaultLedgerStore.clear();
});

describe('/v1/embed governance', () => {
  it('returns development vectors with truthful model identity and ledger evidence', async () => {
    const response = await request(buildApp()).post('/v1/embed').send({
      requestId: 'req-dev-1',
      tenantId: 'tenant-1',
      texts: ['proof before pitch'],
      normalize: true,
      metadata: {},
    });

    expect(response.status).toBe(200);
    expect(response.body.model).toBe('aef-dev-hash');
    expect(response.body.execution).toMatchObject({
      backendId: 'dev-hash',
      modelId: 'aef-dev-hash',
      modelRevision: 'sha256-v1',
      promotionState: 'DEVELOPMENT',
      normalized: true,
    });

    const evidence = defaultLedgerStore.query({ requestId: 'req-dev-1' });
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      backendId: 'dev-hash',
      modelId: 'aef-dev-hash',
      modelRevision: 'sha256-v1',
      promotionState: 'DEVELOPMENT',
    });
  });

  it('rejects caller-supplied model identity spoofing', async () => {
    const response = await request(buildApp()).post('/v1/embed').send({
      requestId: 'req-spoof-1',
      tenantId: 'tenant-1',
      texts: ['hello'],
      model: 'pretend/frontier-model',
      metadata: {},
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('MODEL_ID_NOT_ADMITTED');
  });

  it('fails closed in production when no real backend is configured', async () => {
    process.env.NODE_ENV = 'production';
    const response = await request(buildApp()).post('/v1/embed').send({
      requestId: 'req-prod-1',
      tenantId: 'tenant-1',
      texts: ['hello'],
      metadata: {},
    });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('REAL_EMBEDDER_REQUIRED');
  });
});
