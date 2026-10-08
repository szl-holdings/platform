import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express, { type Request, type Response } from 'express';
import { createGlobalRateLimit, rateLimitMiddleware } from '../src/middleware/rate-limit.js';

test('aggregate limiter bounds rotating client identities before protected work', async () => {
  const app = express();
  let calls = 0;
  app.post('/protected', createGlobalRateLimit(2), (_req, res) => {
    calls += 1;
    res.json({ ok: true });
  });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    for (let index = 0; index < 2; index++) {
      const response = await fetch(`${base}/protected`, {
        method: 'POST',
        headers: { 'x-tenant-id': `tenant-${index}`, 'x-forwarded-for': `192.0.2.${index + 1}` },
      });
      assert.equal(response.status, 200);
    }
    const blocked = await fetch(`${base}/protected`, {
      method: 'POST',
      headers: { 'x-tenant-id': 'different-tenant', 'x-forwarded-for': '192.0.2.99' },
    });
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get('retry-after')) > 0);
    assert.equal(calls, 2);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test('invalid global limits fail closed during initialization', () => {
  for (const limit of [0, -1, NaN, Infinity, 1.5]) {
    assert.throws(() => createGlobalRateLimit(limit), /positive safe integer/);
  }
});

test('tenant limiter binds resolved identity, caps tenants, and expires stale windows', (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: 100000 });
  const invoke = (tenant: string, header: string) => {
    let nextCalled = false;
    let status = 200;
    let payload: { error?: string } = {};
    const headers = new Map<string, string | number>();
    const request = { ip: '127.0.0.1', headers: { 'x-tenant-id': header } } as Request;
    const response = {
      locals: { tenantId: tenant, authenticatedTenantId: tenant },
      setHeader: (key: string, value: string | number) => headers.set(key, value),
      status: (code: number) => {
        status = code;
        return response;
      },
      json: (body: { error?: string }) => {
        payload = body;
        return response;
      },
    } as unknown as Response;
    rateLimitMiddleware(request, response, () => {
      nextCalled = true;
    });
    return { nextCalled, status, payload, headers };
  };
  const first = invoke('bound-tenant', 'client-selected-0');
  assert.equal(first.nextCalled, true);
  const limit = Number(first.headers.get('x-ratelimit-limit'));
  for (let index = 1; index < limit; index++) {
    assert.equal(invoke('bound-tenant', `rotating-header-${index}`).nextCalled, true);
  }
  const exhausted = invoke('bound-tenant', 'yet-another-header');
  assert.equal(exhausted.status, 429);
  assert.equal(exhausted.nextCalled, false);
  assert.equal(exhausted.payload.error, 'rate_limit_exceeded');
  for (let index = 1; index < 4096; index++) {
    assert.equal(invoke(`distinct-${index}`, 'same-header').nextCalled, true);
  }
  const overflow = invoke('tenant-over-capacity', 'same-header');
  assert.equal(overflow.status, 429);
  assert.equal(overflow.nextCalled, false);
  assert.equal(overflow.payload.error, 'rate_limit_capacity_exceeded');
  context.mock.timers.tick(60000);
  assert.equal(invoke('tenant-over-capacity', 'same-header').nextCalled, true);
  assert.equal(invoke('bound-tenant', 'client-selected-again').nextCalled, true);
});
