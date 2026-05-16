// Integration test for the live frontier registry refresh path.
//
// Spins up an in-process HTTP server that mimics the frontier-ingest
// `operator_model_registry` payload, points the router at it, and asserts:
//   1. A newly-registered governed model is picked up in `router.registry`.
//   2. `router.plan()` selects that model when its provider env-key is set.
//   3. A failing endpoint falls back gracefully to the bundled registry.
//
// Uses node:test + node:http only — no extra deps, runs in the public install.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.A11OY_CODE_HOME = mkdtempSync(join(tmpdir(), 'a11oy-code-frontier-test-'));

const { router, refreshRegistry } = await import('../src/providers/router.mjs');

function startServer(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/` });
    });
  });
}

test('router picks up a newly-registered governed model from the frontier registry', async () => {
  router._resetForTest();
  const { server, url } = await startServer((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      models: [
        { id: 'claude-5.0', provider: 'anthropic', envKey: 'ANTHROPIC_API_KEY', weight: 1.10, kind: 'model' },
        { id: 'brand-new-frontier-model-x', provider: 'openai', envKey: 'OPENAI_API_KEY', weight: 0.99, kind: 'model' },
      ],
    }));
  });
  try {
    process.env.A11OY_FRONTIER_REGISTRY_URL = url;
    const result = await refreshRegistry();
    assert.equal(result.ok, true, `refresh failed: ${result.error}`);
    assert.equal(result.count, 2);

    const ids = router.registry.map((r) => r.id);
    assert.ok(ids.includes('brand-new-frontier-model-x'), `registry missing new model: ${ids.join(',')}`);

    // claude-5.0 should outrank claude-4.5 by weight, and selecting requires
    // the provider env-key to be present.
    const prevKey = process.env.OPENAI_API_KEY;
    const prevAnthropic = process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'test-key';
    try {
      const plan = await router.plan({ userText: 'read package.json', history: [], opts: {} });
      assert.equal(plan.provider, 'openai');
      assert.equal(plan.model, 'brand-new-frontier-model-x');
    } finally {
      if (prevKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = prevKey;
      if (prevAnthropic === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = prevAnthropic;
    }

    const status = router.registryStatus();
    assert.equal(status.lastRefreshOk, true);
    assert.equal(status.url, url);
  } finally {
    delete process.env.A11OY_FRONTIER_REGISTRY_URL;
    server.close();
    router._resetForTest();
  }
});

test('router accepts the raw frontier-ingest promoted shape', async () => {
  router._resetForTest();
  const { server, url } = await startServer((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      promoted: [
        {
          artifact: {
            id: 'art-1', externalId: 'kimi-k3', provider: 'kimi', kind: 'model',
            title: 'Kimi K3', url: 'https://example.test/k3', tags: [],
            discoveredAt: new Date().toISOString(),
          },
          target: 'operator_model_registry',
          at: new Date().toISOString(),
        },
        {
          artifact: {
            id: 'art-2', externalId: 'some-paper', provider: 'openai', kind: 'paper',
            title: 'Paper', url: 'https://example.test/p', tags: [],
            discoveredAt: new Date().toISOString(),
          },
          target: 'thesis_corpus',
          at: new Date().toISOString(),
        },
      ],
    }));
  });
  try {
    process.env.A11OY_FRONTIER_REGISTRY_URL = url;
    const result = await refreshRegistry();
    assert.equal(result.ok, true);
    // Only the model-kind artifact should land in the registry.
    assert.equal(result.count, 1);
    const ids = router.registry.map((r) => r.id);
    assert.ok(ids.includes('kimi-k3'));
    assert.ok(!ids.includes('some-paper'));
    // envKey for the kimi provider should be auto-resolved.
    const k3 = router.registry.find((r) => r.id === 'kimi-k3');
    assert.equal(k3.envKey, 'MOONSHOT_API_KEY');
  } finally {
    delete process.env.A11OY_FRONTIER_REGISTRY_URL;
    server.close();
    router._resetForTest();
  }
});

test('refresh failure falls back gracefully to the bundled registry', async () => {
  router._resetForTest();
  const bundledIds = router.registry.map((r) => r.id).sort();
  const { server, url } = await startServer((_req, res) => {
    res.statusCode = 503;
    res.end('upstream down');
  });
  try {
    process.env.A11OY_FRONTIER_REGISTRY_URL = url;
    const result = await refreshRegistry();
    assert.equal(result.ok, false);
    assert.match(String(result.error), /HTTP 503/);
    // Registry must be unchanged.
    assert.deepEqual(router.registry.map((r) => r.id).sort(), bundledIds);
    // And `plan()` must still work.
    const plan = await router.plan({ userText: 'read x', history: [], opts: {} });
    assert.ok(plan.provider);
    assert.ok(plan.model);
    const status = router.registryStatus();
    assert.equal(status.lastRefreshOk, false);
    assert.ok(status.lastRefreshError);
  } finally {
    delete process.env.A11OY_FRONTIER_REGISTRY_URL;
    server.close();
    router._resetForTest();
  }
});

test('refreshRegistry is a no-op when no URL is configured', async () => {
  router._resetForTest();
  delete process.env.A11OY_FRONTIER_REGISTRY_URL;
  const result = await refreshRegistry();
  assert.equal(result.ok, false);
  assert.equal(result.error, 'no-url-configured');
  router._resetForTest();
});
