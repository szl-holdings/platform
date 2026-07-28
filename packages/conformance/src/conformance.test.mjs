import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { normalizeBaseUrl, runConformance } from './conformance.mjs';
import { payloadHash, publicKeyFingerprint, signDssePayload } from './verify.mjs';

const FIXTURE_SHA = 'a'.repeat(40);
const FIXTURE_NOW = Date.parse('2026-07-25T20:00:00.000Z');

function keyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateKeyPem: privateKey.export({ format: 'pem', type: 'pkcs8' }),
    publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }),
  };
}

async function fixtureRoot(
  readme = '# Sentra\n\n> **Evidence status: MODELED.** See [SOURCE_OF_TRUTH](../../SOURCE_OF_TRUTH.md).\n',
) {
  const root = await mkdtemp(join(tmpdir(), 'szl-conformance-'));
  await mkdir(join(root, 'artifacts/sentra/.replit-artifact'), { recursive: true });
  await mkdir(join(root, 'audit'), { recursive: true });
  await writeFile(
    join(root, 'artifacts/sentra/.replit-artifact/artifact.toml'),
    'id = "artifacts/sentra"\n',
  );
  await writeFile(join(root, 'artifacts/sentra/README.md'), readme);
  await writeFile(
    join(root, 'audit/source-of-truth.json'),
    JSON.stringify({ artifacts: { registered: { list: ['artifacts/sentra'] } } }),
  );
  return root;
}

function fixtureManifest(disposition = 'CANDIDATE') {
  return {
    schemaVersion: 'szl.vertical-conformance.manifest.v1',
    surface: 'sentra',
    disposition,
    registration: {
      artifactId: 'artifacts/sentra',
      artifactManifest: 'artifacts/sentra/.replit-artifact/artifact.toml',
    },
    documentation: { readme: 'artifacts/sentra/README.md' },
    deployment: {
      baseUrlEnv: 'SENTRA_CONFORMANCE_BASE_URL',
      expectedGitShaEnv: 'SENTRA_DEPLOYED_GIT_SHA',
    },
    evidence: {
      publicKeyEnv: 'SENTRA_CONFORMANCE_PUBLIC_KEY',
      publicKeyFingerprintEnv: 'SENTRA_CONFORMANCE_PUBLIC_KEY_SHA256',
    },
  };
}

function receiptPayload({
  receiptId,
  nonce,
  surface,
  parentHash,
  decision,
  gitSha = FIXTURE_SHA,
  issuedAt = new Date(FIXTURE_NOW - 60_000).toISOString(),
  expiresAt = new Date(FIXTURE_NOW + 5 * 60_000).toISOString(),
}) {
  return {
    schemaVersion: 'szl.khipu.receipt.v1',
    receiptId,
    nonce,
    surface,
    parentHash,
    decision,
    gitSha,
    issuedAt,
    expiresAt,
  };
}

function referenceEvidence(
  keys,
  { a11oyOverrides = {}, sentraOverrides = {}, denialReceiptId = 'sentra-deny', otel = {} } = {},
) {
  const a11oyPayload = {
    ...receiptPayload({
      receiptId: 'a11oy-allow',
      nonce: 'nonce-a11oy-0001',
      surface: 'a11oy',
      parentHash: null,
      decision: 'ALLOW',
    }),
    ...a11oyOverrides,
  };
  const a11oy = signDssePayload(a11oyPayload, keys);
  const sentraPayload = {
    ...receiptPayload({
      receiptId: 'sentra-deny',
      nonce: 'nonce-sentra-0001',
      surface: 'sentra',
      parentHash: payloadHash(a11oy),
      decision: 'DENY',
    }),
    ...sentraOverrides,
  };
  const sentra = signDssePayload(sentraPayload, keys);
  return {
    receipts: [a11oy, sentra],
    denialReceiptId,
    otelSpans: [
      {
        semanticType: 'gen_ai.inference.client',
        name: 'chat test-model',
        kind: 'CLIENT',
        stability: 'development',
        traceId: '1'.repeat(32),
        spanId: '2'.repeat(16),
        startTime: new Date(FIXTURE_NOW - 5_000).toISOString(),
        endTime: new Date(FIXTURE_NOW - 4_000).toISOString(),
        attributes: {
          'gen_ai.provider.name': 'openai',
          'gen_ai.operation.name': 'chat',
          'gen_ai.request.model': 'test-model',
        },
        ...otel,
      },
    ],
  };
}

async function listen(evidence, { gitSha = FIXTURE_SHA, evidenceStatus = 200 } = {}) {
  const server = createServer((request, response) => {
    response.setHeader('content-type', 'application/json');
    if (request.url === '/healthz') response.end(JSON.stringify({ ok: true }));
    else if (request.url === '/version') response.end(JSON.stringify({ gitSha }));
    else if (request.url === '/evidence') {
      response.statusCode = evidenceStatus;
      response.end(JSON.stringify(evidence));
    } else {
      response.statusCode = 404;
      response.end('{}');
    }
  });
  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolvePromise) => server.close(resolvePromise)),
  };
}

test('base URL normalization removes trailing slashes in linear time', () => {
  assert.equal(normalizeBaseUrl('https://example.test////'), 'https://example.test');
  assert.equal(
    normalizeBaseUrl(`https://example.test${'/'.repeat(100_000)}`),
    'https://example.test',
  );
});

async function runReference({ evidence, keys, root, serverOptions, ...overrides } = {}) {
  const resolvedKeys = keys || keyPair();
  const resolvedRoot = root || (await fixtureRoot());
  const server = await listen(evidence || referenceEvidence(resolvedKeys), serverOptions);
  try {
    return await runConformance({
      surface: 'sentra',
      root: resolvedRoot,
      manifest: fixtureManifest(),
      baseUrl: server.baseUrl,
      expectedGitSha: FIXTURE_SHA,
      publicKeyPem: resolvedKeys.publicKeyPem,
      expectedFingerprint: publicKeyFingerprint(resolvedKeys.publicKeyPem),
      nowMs: FIXTURE_NOW,
      ...overrides,
    });
  } finally {
    await server.close();
  }
}

test('reference fixture passes all seven vertical conformance gates', async () => {
  const report = await runReference();
  assert.equal(report.conformant, true);
  assert.equal(report.passed, 7);
  assert.deepEqual(
    report.checks.map((check) => check.id),
    [
      'khipu-chain',
      'runtime-endpoints',
      'denial-receipt',
      'otel-genai',
      'offline-verify',
      'readme-status',
      'product-manifest',
    ],
  );
});

test('wrong deployed SHA and non-200 evidence fail the runtime gate', async () => {
  const report = await runReference({
    serverOptions: { gitSha: 'b'.repeat(40), evidenceStatus: 503 },
  });
  assert.equal(report.checks.find((check) => check.id === 'runtime-endpoints')?.status, 'FAIL');
});

test('replayed nonce fails the receipt chain gate', async () => {
  const keys = keyPair();
  const evidence = referenceEvidence(keys, {
    sentraOverrides: { nonce: 'nonce-a11oy-0001' },
  });
  const report = await runReference({ evidence, keys });
  assert.match(
    report.checks.find((check) => check.id === 'khipu-chain')?.detail || '',
    /replays nonce/,
  );
});

test('stale receipts fail the receipt chain gate', async () => {
  const keys = keyPair();
  const stale = new Date(FIXTURE_NOW - 30 * 60_000).toISOString();
  const expired = new Date(FIXTURE_NOW - 20 * 60_000).toISOString();
  const evidence = referenceEvidence(keys, {
    a11oyOverrides: { issuedAt: stale, expiresAt: expired },
  });
  const report = await runReference({ evidence, keys });
  assert.equal(report.checks.find((check) => check.id === 'khipu-chain')?.status, 'FAIL');
});

test('a broken parent hash fails the receipt chain gate', async () => {
  const keys = keyPair();
  const evidence = referenceEvidence(keys, {
    sentraOverrides: { parentHash: `sha256:${'0'.repeat(64)}` },
  });
  const report = await runReference({ evidence, keys });
  assert.match(
    report.checks.find((check) => check.id === 'khipu-chain')?.detail || '',
    /parentHash does not match/,
  );
});

test('a missing referenced DENY receipt fails the denial gate', async () => {
  const keys = keyPair();
  const evidence = referenceEvidence(keys, { denialReceiptId: 'not-present' });
  const report = await runReference({ evidence, keys });
  assert.equal(report.checks.find((check) => check.id === 'denial-receipt')?.status, 'FAIL');
});

test('a field-only OTel claim without trace context fails the telemetry gate', async () => {
  const keys = keyPair();
  const evidence = referenceEvidence(keys, { otel: { traceId: undefined, spanId: undefined } });
  const report = await runReference({ evidence, keys });
  assert.equal(report.checks.find((check) => check.id === 'otel-genai')?.status, 'FAIL');
});

test('a different pinned key fails offline receipt verification', async () => {
  const signingKeys = keyPair();
  const trustKeys = keyPair();
  const evidence = referenceEvidence(signingKeys);
  const report = await runReference({
    evidence,
    keys: trustKeys,
  });
  assert.equal(report.checks.find((check) => check.id === 'offline-verify')?.status, 'FAIL');
});

test('README words without an explicit status declaration and link fail', async () => {
  const root = await fixtureRoot(
    '# Sentra\n\nThis MODELED system mentions SOURCE_OF_TRUTH but provides no evidence declaration.\n',
  );
  const report = await runReference({ root });
  assert.equal(report.checks.find((check) => check.id === 'readme-status')?.status, 'FAIL');
});

test('manifest path traversal fails closed', async () => {
  const root = await fixtureRoot();
  const manifest = fixtureManifest();
  manifest.registration.artifactManifest = '../outside.toml';
  const report = await runConformance({
    surface: 'sentra',
    root,
    manifest,
    nowMs: FIXTURE_NOW,
  });
  assert.equal(report.checks.find((check) => check.id === 'product-manifest')?.status, 'FAIL');
});

test('runtime request timeout fails closed', async () => {
  const root = await fixtureRoot();
  const keys = keyPair();
  const fetchImpl = (_url, { signal }) =>
    new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  const report = await runConformance({
    surface: 'sentra',
    root,
    manifest: fixtureManifest(),
    baseUrl: 'http://127.0.0.1:43210',
    expectedGitSha: FIXTURE_SHA,
    publicKeyPem: keys.publicKeyPem,
    expectedFingerprint: publicKeyFingerprint(keys.publicKeyPem),
    fetchImpl,
    nowMs: FIXTURE_NOW,
    requestTimeoutMs: 5,
  });
  assert.equal(report.checks.find((check) => check.id === 'runtime-endpoints')?.status, 'FAIL');
});

test('private deployment origins and private DNS answers fail closed', async () => {
  const root = await fixtureRoot();
  const unsafeScheme = await runConformance({
    surface: 'sentra',
    root,
    manifest: fixtureManifest(),
    baseUrl: 'ftp://127.0.0.1:21',
    expectedGitSha: FIXTURE_SHA,
    nowMs: FIXTURE_NOW,
  });
  assert.match(
    unsafeScheme.checks.find((check) => check.id === 'runtime-endpoints')?.detail || '',
    /must use HTTP or HTTPS/,
  );

  const mappedLoopback = await runConformance({
    surface: 'sentra',
    root,
    manifest: fixtureManifest(),
    baseUrl: 'https://[::ffff:127.0.0.1]',
    expectedGitSha: FIXTURE_SHA,
    nowMs: FIXTURE_NOW,
  });
  assert.match(
    mappedLoopback.checks.find((check) => check.id === 'runtime-endpoints')?.detail || '',
    /private or link-local/,
  );

  const privateName = await runConformance({
    surface: 'sentra',
    root,
    manifest: fixtureManifest(),
    baseUrl: 'https://metadata.google.internal',
    expectedGitSha: FIXTURE_SHA,
    nowMs: FIXTURE_NOW,
  });
  assert.match(
    privateName.checks.find((check) => check.id === 'runtime-endpoints')?.detail || '',
    /private or link-local/,
  );

  const rebinding = await runConformance({
    surface: 'sentra',
    root,
    manifest: fixtureManifest(),
    baseUrl: 'https://example.test',
    expectedGitSha: FIXTURE_SHA,
    lookupImpl: async () => [{ address: '10.1.2.3', family: 4 }],
    nowMs: FIXTURE_NOW,
  });
  assert.match(
    rebinding.checks.find((check) => check.id === 'runtime-endpoints')?.detail || '',
    /resolves to a private or link-local/,
  );
});

test('a superseded surface fails the product-manifest gate', async () => {
  const root = await fixtureRoot();
  const report = await runConformance({
    surface: 'sentra',
    root,
    manifest: fixtureManifest('SUPERSEDED'),
    nowMs: FIXTURE_NOW,
  });
  assert.equal(report.conformant, false);
  assert.equal(report.checks.find((check) => check.id === 'product-manifest')?.status, 'FAIL');
});

test('bundled manifests load independently of the evidence root and stay fail closed', async () => {
  const root = await fixtureRoot();
  const report = await runConformance({
    surface: 'sentra',
    root,
    nowMs: FIXTURE_NOW,
  });
  assert.equal(report.conformant, false);
  assert.equal(report.checks.find((check) => check.id === 'product-manifest')?.status, 'FAIL');
  assert.match(
    report.checks.find((check) => check.id === 'product-manifest')?.detail || '',
    /disposition=SUPERSEDED/,
  );
});
