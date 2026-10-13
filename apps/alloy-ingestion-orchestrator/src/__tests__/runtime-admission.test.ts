import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  createOrchestratorRuntimeAdmissionMiddleware,
  ORCHESTRATOR_DURABILITY_HOLD_CODE,
  resolveOrchestratorRuntimeAdmission,
} from '../runtime-admission.js';

describe('orchestrator runtime admission', () => {
  it('labels process-local state as development-only outside production', () => {
    expect(resolveOrchestratorRuntimeAdmission({ NODE_ENV: 'test' })).toMatchObject({
      ready: true,
      durableState: false,
      promotionState: 'DEVELOPMENT',
    });
  });

  it('reports an explicit production evaluation hold', () => {
    expect(resolveOrchestratorRuntimeAdmission({ NODE_ENV: 'production' })).toMatchObject({
      ready: false,
      durableState: false,
      promotionState: 'EVALUATION_HOLD',
      blockers: expect.arrayContaining([
        expect.stringContaining('requestId reservations'),
        expect.stringContaining('pending approvals'),
      ]),
    });
  });

  it('rejects production workflow execution before a handler can mutate state', async () => {
    let executed = false;
    const app = express();
    app.use(
      createOrchestratorRuntimeAdmissionMiddleware({ NODE_ENV: 'production' }),
      (_req, res) => {
        executed = true;
        res.status(202).json({ accepted: true });
      },
    );

    const response = await request(app).post('/v1/runs');
    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      code: ORCHESTRATOR_DURABILITY_HOLD_CODE,
      promotionState: 'EVALUATION_HOLD',
      durableState: false,
    });
    expect(executed).toBe(false);
  });
});
