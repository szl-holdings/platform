import { defaultLedgerStore } from '@workspace/aef-evidence-ledger';
import express, { type Express } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EVIDENCE_LEDGER_HOLD_CODE,
  resolveEvidenceLedgerRuntimeAdmission,
} from '../evidence-ledger-runtime.js';
import { createAefRouter } from '../router.js';

const API_KEY = 'evidence-admission-test-key';
const TENANT_ID = 'evidence-admission-tenant';

function buildProductionApp(): Express {
  const app = express();
  app.use(createAefRouter());
  return app;
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('AEF_API_KEY', API_KEY);
  vi.stubEnv('AEF_API_TENANT_ID', TENANT_ID);
  vi.stubEnv('AEF_AUTH_BYPASS', 'false');
  vi.stubEnv('ORCHESTRATOR_API_TOKEN', 'orchestrator-test-token');
  vi.stubEnv('ORCHESTRATOR_API_TENANT_ID', TENANT_ID);
  vi.stubEnv('ORCHESTRATOR_API_ACTOR_ID', 'evidence-test-operator');
  vi.stubEnv('ORCHESTRATOR_API_ROLES', 'operator');
  vi.stubEnv('ORCHESTRATOR_AUTH_BYPASS', 'false');
  defaultLedgerStore.clear();
});

afterEach(() => {
  defaultLedgerStore.clear();
  vi.unstubAllEnvs();
});

describe('evidence-ledger runtime admission', () => {
  it('keeps the process-local ledger development-only', () => {
    expect(resolveEvidenceLedgerRuntimeAdmission({ NODE_ENV: 'development' })).toMatchObject({
      ready: true,
      promotionState: 'DEVELOPMENT',
      durable: false,
      tamperEvident: false,
    });
    expect(resolveEvidenceLedgerRuntimeAdmission({ NODE_ENV: 'production' })).toMatchObject({
      ready: false,
      promotionState: 'EVALUATION_HOLD',
      durable: false,
      tamperEvident: false,
    });
  });

  it('rejects every evidence-producing production route before inference or writes', async () => {
    const app = buildProductionApp();
    const headers = {
      authorization: `Bearer ${API_KEY}`,
      'x-tenant-id': TENANT_ID,
    };

    for (const path of [
      '/v1/embed',
      '/v1/rerank',
      '/v1/hybrid-search',
      '/v1/multimodal/embed',
      '/v1/openai/embeddings',
    ]) {
      const response = await request(app).post(path).set(headers).send({});
      expect(response.status, path).toBe(503);
      expect(response.body, path).toMatchObject({
        code: EVIDENCE_LEDGER_HOLD_CODE,
        promotionState: 'EVALUATION_HOLD',
        durable: false,
        tamperEvident: false,
      });
      expect(response.body, path).not.toHaveProperty('evidenceIds');
      expect(response.body, path).not.toHaveProperty('data');
      expect(response.body, path).not.toHaveProperty('x-aef-execution');
    }

    expect(defaultLedgerStore.count()).toBe(0);
  });
});
