import express, { type Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  bearerAuthenticationError,
  createBearerAuthentication,
  resolveAuthConfiguration,
} from '../middleware/auth.js';
import { globalRateLimit } from '../middleware/rate-limit.js';
import { enforceTenantRequestConsistency, tenantScoping } from '../middleware/tenant.js';

const API_KEY = 'aef-auth-test-only-key';

function buildProtectedApp(): Express {
  const app = express();
  app.use(globalRateLimit);
  app.use(express.json());
  app.use(
    createBearerAuthentication({
      apiKey: API_KEY,
      authorizedTenantId: 'tenant-bound-to-key',
      bypass: false,
    }),
  );
  app.use(tenantScoping);
  app.use(enforceTenantRequestConsistency);
  app.post('/protected', (req, res) => {
    res.status(200).json({ tenantId: req.tenantId });
  });
  return app;
}

describe('AEF authentication configuration', () => {
  it('fails closed when a production API key is missing', () => {
    expect(() => resolveAuthConfiguration({ NODE_ENV: 'production' })).toThrowError(
      /AEF_API_KEY is required/,
    );
    expect(() =>
      resolveAuthConfiguration({ NODE_ENV: 'production', AEF_AUTH_BYPASS: 'true' }),
    ).toThrowError(/permitted only when NODE_ENV is development or test/);
  });

  it('requires a production credential-to-tenant binding', () => {
    expect(() =>
      resolveAuthConfiguration({
        NODE_ENV: 'production',
        AEF_API_KEY: 'runtime-secret-value',
      }),
    ).toThrowError(/AEF_API_TENANT_ID is required/);
  });

  it('allows the explicit bypass only in development and test', () => {
    expect(resolveAuthConfiguration({ NODE_ENV: 'development', AEF_AUTH_BYPASS: 'true' })).toEqual({
      bypass: true,
    });
    expect(resolveAuthConfiguration({ NODE_ENV: 'test', AEF_AUTH_BYPASS: 'true' })).toEqual({
      bypass: true,
    });
  });

  it('requires an exact explicitly configured bearer token', () => {
    const config = resolveAuthConfiguration({
      NODE_ENV: 'production',
      AEF_API_KEY: 'runtime-secret-value',
      AEF_API_TENANT_ID: 'tenant-bound-to-key',
    });

    expect(bearerAuthenticationError('Bearer attacker-chosen-token', config)).toBe(
      'Bearer token is invalid',
    );
    expect(bearerAuthenticationError('Bearer runtime-secret-value', config)).toBeUndefined();
  });

  it('rejects missing headers, arbitrary tenants, and body/query tenant mismatches', async () => {
    const app = buildProtectedApp();
    const bearer = { authorization: `Bearer ${API_KEY}` };

    const missingBearer = await request(app)
      .post('/protected')
      .set('x-tenant-id', 'tenant-bound-to-key')
      .send({ tenantId: 'tenant-bound-to-key' });
    const arbitraryBearer = await request(app)
      .post('/protected')
      .set({
        authorization: 'Bearer attacker-selected-token',
        'x-tenant-id': 'tenant-bound-to-key',
      })
      .send({ tenantId: 'tenant-bound-to-key' });
    const missingHeader = await request(app).post('/protected').set(bearer).send({});
    const wrongBoundTenant = await request(app)
      .post('/protected')
      .set({ ...bearer, 'x-tenant-id': 'attacker-tenant' })
      .send({ tenantId: 'attacker-tenant' });
    const queryMismatch = await request(app)
      .post('/protected?tenantId=attacker-tenant')
      .set({ ...bearer, 'x-tenant-id': 'tenant-bound-to-key' })
      .send({ tenantId: 'tenant-bound-to-key' });
    const bodyMismatch = await request(app)
      .post('/protected')
      .set({ ...bearer, 'x-tenant-id': 'tenant-bound-to-key' })
      .send({ tenantId: 'attacker-tenant' });
    const accepted = await request(app)
      .post('/protected')
      .set({ ...bearer, 'x-tenant-id': 'tenant-bound-to-key' })
      .send({ tenantId: 'tenant-bound-to-key' });

    expect(missingBearer.status).toBe(401);
    expect(arbitraryBearer.status).toBe(401);
    expect(missingBearer.body).toEqual(arbitraryBearer.body);
    expect(missingHeader.status).toBe(400);
    expect(missingHeader.body.code).toBe('TENANT_REQUIRED');
    expect(wrongBoundTenant.status).toBe(403);
    expect(wrongBoundTenant.body.code).toBe('TENANT_SCOPE_MISMATCH');
    expect(queryMismatch.status).toBe(403);
    expect(queryMismatch.body.code).toBe('TENANT_SCOPE_MISMATCH');
    expect(bodyMismatch.status).toBe(403);
    expect(bodyMismatch.body.code).toBe('TENANT_SCOPE_MISMATCH');
    expect(accepted.status).toBe(200);
    expect(accepted.body).toEqual({ tenantId: 'tenant-bound-to-key' });
  });
});
