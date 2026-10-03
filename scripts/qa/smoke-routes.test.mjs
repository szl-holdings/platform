import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const runner = fileURLToPath(new URL('./smoke-routes.js', import.meta.url));

function runSmoke(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runner, ...args], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 15_000);
    child.stdout.setEncoding('utf8').on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding('utf8').on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (timedOut) reject(new Error(`Smoke runner timed out: ${args.join(' ')}`));
      else resolve({ code, stdout, stderr });
    });
  });
}

test('A11oy group probes only A11oy web routes, including replay', async (t) => {
  const requested = [];
  let failReplay = false;
  const server = createServer((request, response) => {
    requested.push(request.url);
    response.writeHead(request.url === '/a11oy/replay' && failReplay ? 503 : 200, {
      'Content-Type': 'text/plain',
    });
    response.end('ok');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();

  const env = { BASE_URL: `http://127.0.0.1:${port}` };
  const result = await runSmoke(['--group', 'a11oy', '--json'], env);
  assert.equal(result.code, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(
    report.summary.map(({ domain }) => domain),
    ['A11oy — Brand Orchestration'],
  );
  assert.equal(report.summary[0].failed, 0);
  assert.equal(report.summary[0].total, requested.length);
  assert.ok(requested.every((path) => path.startsWith('/a11oy/')));
  for (const route of ['/a11oy/start', '/a11oy/product-journey', '/a11oy/replay']) {
    assert.ok(requested.includes(route), `${route} must be probed`);
  }

  failReplay = true;
  const failure = await runSmoke(['--group', 'a11oy', '--json'], env);
  assert.equal(failure.code, 1, failure.stderr);
  assert.equal(JSON.parse(failure.stdout).summary[0].failed, 1);
});

test('missing, duplicate, and unknown groups fail before making requests', async () => {
  for (const args of [
    ['--group'],
    ['--group', '--json'],
    ['--group', 'a11oy', '--group', 'terra'],
    ['--group', 'unknown'],
  ]) {
    const result = await runSmoke(args);
    assert.equal(result.code, 2, `${args.join(' ')}: ${result.stdout} ${result.stderr}`);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /group/i);
  }
});

test('API-only cannot be combined with a web group or web-only', async () => {
  for (const args of [
    ['--group', 'a11oy', '--api-only'],
    ['--api-only', '--web-only'],
  ]) {
    const result = await runSmoke(args);
    assert.equal(result.code, 2, `${args.join(' ')}: ${result.stdout} ${result.stderr}`);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /api-only/i);
  }
});
