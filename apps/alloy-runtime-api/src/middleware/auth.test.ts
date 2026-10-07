/**
 * Tests for the API key guard + tenant context middleware.
 */

import { request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { apiKeyGuard, assertProductionAuthConfiguration } from './auth.js';

let server: Server;
let baseUrl: string;
const savedKey = process.env.ALLOY_API_KEY;
const savedTenant = process.env.ALLOY_API_TENANT_ID;
const savedNodeEnv = process.env.NODE_ENV;

function get(headers: Record<string, string> = {}): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    const r = request(`${baseUrl}/guarded`, { method: 'GET', headers }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () =>
        resolve({ status: res.statusCode ?? 0, json: body ? JSON.parse(body) : null }),
      );
    });
    r.on('error', reject);
    r.end();
  });
}

function boot(): Promise<void> {
  const app = express();
  app.get('/guarded', apiKeyGuard, (req, res) => {
    res.status(200).json({ tenant: req.tenantCtx ?? null });
  });
  return new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
    baseUrl = '';
  }).then(() => {
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
}

afterEach(() => {
  server?.close();
  if (savedKey === undefined) delete process.env.ALLOY_API_KEY;
  else process.env.ALLOY_API_KEY = savedKey;
  if (savedTenant === undefined) delete process.env.ALLOY_API_TENANT_ID;
  else process.env.ALLOY_API_TENANT_ID = savedTenant;
  if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = savedNodeEnv;
});

describe('apiKeyGuard', () => {
  it('rejects production startup without an explicit non-empty key', () => {
    expect(() => assertProductionAuthConfiguration({ NODE_ENV: 'production' })).toThrowError(
      /ALLOY_API_KEY is required/,
    );
    expect(() =>
      assertProductionAuthConfiguration({ NODE_ENV: 'production', ALLOY_API_KEY: '   ' }),
    ).toThrowError(/ALLOY_API_KEY is required/);
    expect(() =>
      assertProductionAuthConfiguration({
        NODE_ENV: 'production',
        ALLOY_API_KEY: 'runtime-secret-value',
        ALLOY_API_TENANT_ID: 'tenant-bound-to-key',
      }),
    ).not.toThrow();
    expect(() =>
      assertProductionAuthConfiguration({
        NODE_ENV: 'production',
        ALLOY_API_KEY: 'runtime-secret-value',
      }),
    ).toThrowError(/ALLOY_API_TENANT_ID is required/);
  });

  it('passes through in non-production when no key is configured', async () => {
    delete process.env.ALLOY_API_KEY;
    process.env.NODE_ENV = 'test';
    await boot();
    const res = await get({ 'x-tenant-id': 'local-tenant' });
    expect(res.status).toBe(200);
    expect(res.json.tenant).toEqual({ tenantId: 'local-tenant' });
  });

  it('returns 503 in production when ALLOY_API_KEY is not configured', async () => {
    delete process.env.ALLOY_API_KEY;
    process.env.NODE_ENV = 'production';
    await boot();
    const res = await get();
    expect(res.status).toBe(503);
    expect(res.json.code).toBe('MISSING_API_KEY_CONFIG');
  });

  it('rejects a request with a missing/invalid key when a key is configured', async () => {
    process.env.ALLOY_API_KEY = 'secret-key-value';
    process.env.NODE_ENV = 'test';
    await boot();
    const missing = await get();
    expect(missing.status).toBe(401);
    expect(missing.json.code).toBe('INVALID_API_KEY');
    const wrong = await get({ 'x-api-key': 'nope' });
    expect(wrong.status).toBe(401);
  });

  it('accepts a valid key and populates tenant context from X-Tenant-Id', async () => {
    process.env.ALLOY_API_KEY = 'secret-key-value';
    process.env.NODE_ENV = 'test';
    await boot();
    const res = await get({ 'x-api-key': 'secret-key-value', 'x-tenant-id': 'acme' });
    expect(res.status).toBe(200);
    expect(res.json.tenant.tenantId).toBe('acme');
  });

  it('binds a production credential to its configured tenant', async () => {
    process.env.ALLOY_API_KEY = 'secret-key-value';
    process.env.ALLOY_API_TENANT_ID = 'bound-tenant';
    process.env.NODE_ENV = 'production';
    await boot();

    const accepted = await get({ 'x-api-key': 'secret-key-value' });
    expect(accepted.status).toBe(200);
    expect(accepted.json.tenant.tenantId).toBe('bound-tenant');

    const rejected = await get({
      'x-api-key': 'secret-key-value',
      'x-tenant-id': 'attacker-selected-tenant',
    });
    expect(rejected.status).toBe(403);
    expect(rejected.json.code).toBe('TENANT_SCOPE_MISMATCH');
  });

  it('defaults tenant to "default" when X-Tenant-Id is absent', async () => {
    process.env.ALLOY_API_KEY = 'secret-key-value';
    process.env.NODE_ENV = 'test';
    await boot();
    const res = await get({ 'x-api-key': 'secret-key-value' });
    expect(res.status).toBe(200);
    expect(res.json.tenant.tenantId).toBe('default');
  });
});
