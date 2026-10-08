import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { test } from 'node:test';

const holds = [
  'task-planning-and-execution',
  'memory-fabric',
  'workflow-execution',
  'hybrid-search',
  'embedding',
  'reranking',
  'openai-embedding-compat',
  'index-rebuild',
  'index-verification',
  'evaluation-runner',
  'atelier',
  'ouroboros-integrations',
  'lutar-evaluation',
];
async function smoke({
  policy = 'production-hold',
  held = true,
  brokenDependency = false,
  bypass = false,
} = {}) {
  const server = createServer((req, res) => {
    let status = 200;
    let body;
    if (req.url === '/healthz') {
      body = {
        status: 'ok',
        service: 'alloy-runtime-api',
        version: 'test',
        gitSha: 'fixture-sha',
        bootTime: new Date().toISOString(),
        uptimeSeconds: 1,
      };
    } else if (req.url === '/readyz') {
      const dependencies = ['memory-store', 'run-registry', 'workflow-runtime'].map((name) => ({
        name,
        ready: !(brokenDependency && name === 'memory-store'),
        detail: brokenDependency && name === 'memory-store' ? 'failed' : 'ok',
        latencyMs: 0,
      }));
      if (held)
        dependencies.push({
          name: 'production-capability-backends',
          ready: false,
          detail: `unwired production capabilities: ${holds.join(', ')}`,
          latencyMs: 0,
        });
      status = held || brokenDependency ? 503 : 200;
      body = {
        ready: status === 200,
        service: 'alloy-runtime-api',
        gitSha: 'fixture-sha',
        checkedAt: new Date().toISOString(),
        dependencies,
      };
    } else if (req.headers['x-api-key'] !== 'fixture-key') {
      status = 401;
      body = { code: 'INVALID_API_KEY' };
    } else if (held && !bypass) {
      status = 503;
      res.setHeader('X-Evidence-State', 'UNAVAILABLE');
      res.setHeader('Retry-After', '60');
      body = {
        ready: false,
        status: 'HOLD',
        code: 'PRODUCTION_CAPABILITY_UNAVAILABLE',
        evidenceState: 'UNAVAILABLE',
        service: 'alloy-runtime-api',
        holds,
      };
    } else {
      body = { runs: [], tenantId: req.headers['x-tenant-id'] };
    }
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['scripts/qa/smoke-product-mode.js'], {
        env: {
          ...process.env,
          API_BASE_URL: `http://127.0.0.1:${server.address().port}`,
          SMOKE_API_KEY: 'fixture-key',
          SMOKE_READINESS_POLICY: policy,
          GITHUB_SHA: 'fixture-sha',
          GITHUB_STEP_SUMMARY: '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let output = '';
      child.stdout.on('data', (chunk) => {
        output += chunk;
      });
      child.stderr.on('data', (chunk) => {
        output += chunk;
      });
      child.on('error', reject);
      child.on('close', (code) => resolve({ code, output }));
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('explicit production policy verifies liveness, auth and exact unavailable backend HOLD', async () => {
  const result = await smoke();
  assert.equal(result.code, 0, result.output);
});
test('ready policy rejects production HOLD and accepts healthy development reads', async () => {
  assert.equal((await smoke({ policy: 'ready' })).code, 1);
  const result = await smoke({ policy: 'ready', held: false });
  assert.equal(result.code, 0, result.output);
});
test('production policy rejects synthetic readiness and authenticated admission bypass', async () => {
  assert.equal((await smoke({ held: false })).code, 1);
  assert.equal((await smoke({ bypass: true })).code, 1);
});
test('production HOLD cannot conceal unrelated dependency failures or unknown policy', async () => {
  assert.equal((await smoke({ brokenDependency: true })).code, 1);
  assert.equal((await smoke({ policy: 'accept-anything' })).code, 1);
});
