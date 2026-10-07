import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { resolveCorsAllowedOrigins, resolveOrchestratorAuthConfiguration } from '../security.js';
import { createApp } from '../server.js';

describe('orchestrator startup security configuration', () => {
  it('fails closed without an explicit credential', () => {
    expect(() => resolveOrchestratorAuthConfiguration({ NODE_ENV: 'production' })).toThrowError(
      /ORCHESTRATOR_API_TOKEN is required/,
    );
    expect(() => resolveOrchestratorAuthConfiguration({ NODE_ENV: 'test' })).toThrowError(
      /ORCHESTRATOR_API_TOKEN is required/,
    );
  });

  it('rejects app construction before startup when the production credential is absent', async () => {
    await expect(
      createApp({
        env: {
          NODE_ENV: 'production',
          ORCHESTRATOR_API_TENANT_ID: 'tenant-a',
          ORCHESTRATOR_AUTH_BYPASS: 'false',
        },
      }),
    ).rejects.toThrowError(/ORCHESTRATOR_API_TOKEN is required/);
  });

  it('rejects a production bypass even when production credentials are present', () => {
    expect(() =>
      resolveOrchestratorAuthConfiguration({
        NODE_ENV: 'production',
        ORCHESTRATOR_API_TOKEN: 'production-placeholder-not-a-real-secret',
        ORCHESTRATOR_API_TENANT_ID: 'tenant-a',
        ORCHESTRATOR_AUTH_BYPASS: 'true',
      }),
    ).toThrowError(/ORCHESTRATOR_AUTH_BYPASS is permitted only/);
  });

  it('requires a tenant binding for a production credential', () => {
    expect(() =>
      resolveOrchestratorAuthConfiguration({
        NODE_ENV: 'production',
        ORCHESTRATOR_API_TOKEN: 'production-placeholder-not-a-real-secret',
      }),
    ).toThrowError(/ORCHESTRATOR_API_TENANT_ID is required/);
  });

  it('requires a server-bound principal for production approval authorization', () => {
    expect(() =>
      resolveOrchestratorAuthConfiguration({
        NODE_ENV: 'production',
        ORCHESTRATOR_API_TOKEN: 'production-placeholder-not-a-real-secret',
        ORCHESTRATOR_API_TENANT_ID: 'tenant-a',
      }),
    ).toThrowError(/ORCHESTRATOR_API_ACTOR_ID and ORCHESTRATOR_API_ROLES are required/);
  });

  it('allows only an explicit development or test bypass', () => {
    expect(
      resolveOrchestratorAuthConfiguration({
        NODE_ENV: 'development',
        ORCHESTRATOR_AUTH_BYPASS: 'true',
      }),
    ).toEqual({ bypass: true });
    expect(
      resolveOrchestratorAuthConfiguration({
        NODE_ENV: 'test',
        ORCHESTRATOR_AUTH_BYPASS: 'true',
      }),
    ).toEqual({ bypass: true });
  });

  it('defaults CORS to no cross-origin access and rejects wildcards', () => {
    expect(resolveCorsAllowedOrigins({}).size).toBe(0);
    expect(() =>
      resolveCorsAllowedOrigins({ ORCHESTRATOR_CORS_ALLOWED_ORIGINS: '*' }),
    ).toThrowError(/does not permit wildcard/);
  });

  it('exposes production durability as a readiness hold', async () => {
    const app = await createApp({
      env: {
        NODE_ENV: 'production',
        ORCHESTRATOR_API_TOKEN: 'production-placeholder-not-a-real-secret',
        ORCHESTRATOR_API_TENANT_ID: 'tenant-a',
        ORCHESTRATOR_API_ACTOR_ID: 'operator-a',
        ORCHESTRATOR_API_ROLES: 'operator',
      },
    });
    const response = await request(app).get('/readyz');
    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      ready: false,
      durableState: false,
      promotionState: 'EVALUATION_HOLD',
    });

    const submission = await request(app)
      .post('/orchestrator/v1/runs')
      .set({
        authorization: 'Bearer production-placeholder-not-a-real-secret',
        'x-tenant-id': 'tenant-a',
      })
      .send({
        workflowId: 'verify_index_health',
        tenantId: 'tenant-a',
        profileId: 'default',
        input: {},
      });
    expect(submission.status).toBe(503);
    expect(submission.body.code).toBe('DURABLE_ORCHESTRATOR_STATE_REQUIRED');
  });
});
