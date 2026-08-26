import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { WebSocketServer } from 'ws';
import {
  installCaptureNetworkPolicy,
  publishCaptureDirectory,
  requireOutputDirectory,
} from './series-a-proof-helpers.mjs';

test('restricts proof outputs to direct evidence directories', async (context) => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), 'series-a-proof-output-test-'));
  context.after(() => rm(repositoryRoot, { force: true, recursive: true }));

  assert.equal(
    requireOutputDirectory(repositoryRoot, 'artifacts/proof-one'),
    path.join(repositoryRoot, 'artifacts', 'proof-one'),
  );
  assert.equal(
    requireOutputDirectory(repositoryRoot, 'docs/assets/screenshots/proof-two'),
    path.join(repositoryRoot, 'docs', 'assets', 'screenshots', 'proof-two'),
  );
  for (const rejected of [
    '.',
    '..',
    '../outside',
    '.git/proof',
    'artifacts/nested/proof',
    'docs/assets/screenshots/nested/proof',
  ]) {
    assert.throws(() => requireOutputDirectory(repositoryRoot, rejected), /PROOF_OUTPUT_DIR/);
  }
});

test('publishes verified bytes without overwrite and cleans failed staging', async (context) => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), 'series-a-proof-publish-test-'));
  const captureDirectory = await mkdtemp(path.join(tmpdir(), 'series-a-proof-capture-test-'));
  context.after(() => rm(repositoryRoot, { force: true, recursive: true }));
  context.after(() => rm(captureDirectory, { force: true, recursive: true }));

  await mkdir(path.join(repositoryRoot, 'artifacts'), { recursive: true });
  await writeFile(path.join(captureDirectory, 'capture.png'), Buffer.from('exact-image-bytes'));
  await writeFile(path.join(captureDirectory, 'capture-metadata.json'), '{"status":"PASS"}\n');

  const outputDirectory = requireOutputDirectory(repositoryRoot, 'artifacts/proof-one');
  await publishCaptureDirectory(repositoryRoot, captureDirectory, outputDirectory);
  assert.equal(
    String(await readFile(path.join(outputDirectory, 'capture.png'))),
    'exact-image-bytes',
  );
  await assert.rejects(
    publishCaptureDirectory(repositoryRoot, captureDirectory, outputDirectory),
    /already exists and will not be replaced/,
  );
  assert.equal(
    String(await readFile(path.join(outputDirectory, 'capture.png'))),
    'exact-image-bytes',
  );

  const tamperedOutput = requireOutputDirectory(repositoryRoot, 'artifacts/proof-tampered');
  await assert.rejects(
    publishCaptureDirectory(repositoryRoot, captureDirectory, tamperedOutput, {
      copyFile: async (_source, destination) => writeFile(destination, 'tampered'),
    }),
    /publication digest mismatch/,
  );
  const artifactEntries = await readdir(path.join(repositoryRoot, 'artifacts'));
  assert.equal(
    artifactEntries.some((entry) => entry.includes('proof-tampered')),
    false,
  );
});

test('blocks foreign HTTP and WebSockets before a decoy server connection', async (context) => {
  const handlers = {};
  const fakeContext = {
    route: async (_pattern, handler) => {
      handlers.http = handler;
    },
    routeWebSocket: async (_pattern, handler) => {
      handlers.webSocket = handler;
    },
  };
  const policy = await installCaptureNetworkPolicy(fakeContext, 'http://127.0.0.1:43123');

  const calls = [];
  const routeFor = (url) => ({
    request: () => ({ method: () => 'GET', url: () => url }),
    continue: async () => calls.push(['continue', url]),
    fulfill: async (options) => calls.push(['fulfill', url, options.status]),
    abort: async (reason) => calls.push(['abort', url, reason]),
  });
  await handlers.http(routeFor('http://127.0.0.1:43123/a11oy/start'));
  await handlers.http(routeFor('https://fonts.googleapis.com/css2?family=Inter'));
  await handlers.http(routeFor('https://example.invalid/foreign.js'));
  assert.deepEqual(calls, [
    ['continue', 'http://127.0.0.1:43123/a11oy/start'],
    ['fulfill', 'https://fonts.googleapis.com/css2?family=Inter', 200],
    ['abort', 'https://example.invalid/foreign.js', 'blockedbyclient'],
  ]);
  assert.deepEqual(policy.blockedNetworkRequests, ['GET https://example.invalid/foreign.js']);

  const decoyServer = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  context.after(
    () =>
      new Promise((resolve) => {
        decoyServer.close(resolve);
      }),
  );
  await once(decoyServer, 'listening');
  let acceptedConnections = 0;
  decoyServer.on('connection', () => {
    acceptedConnections += 1;
  });
  const address = decoyServer.address();
  assert.equal(typeof address, 'object');
  const decoyUrl = `ws://127.0.0.1:${address.port}/decoy`;
  let connectToServerCalls = 0;
  let closeReceipt;
  await handlers.webSocket({
    url: () => decoyUrl,
    connectToServer: () => {
      connectToServerCalls += 1;
    },
    close: async (options) => {
      closeReceipt = options;
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(connectToServerCalls, 0);
  assert.equal(acceptedConnections, 0);
  assert.deepEqual(policy.webSocketRequests, [decoyUrl]);
  assert.deepEqual(closeReceipt, {
    code: 1008,
    reason: 'Exact-source evidence capture forbids WebSocket connections',
  });
});
