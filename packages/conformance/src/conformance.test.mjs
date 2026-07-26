import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { normalizeBaseUrl, runConformance } from './conformance.mjs';
import { payloadHash, publicKeyFingerprint, signDssePayload } from './verify.mjs';

function keyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateKeyPem: privateKey.export({ format: 'pem', type: 'pkcs8' }),
    publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }),
  };
}

async function fixtureRoot() {
  const root = await mkdtemp(join(tmpdir(), 'szl-conformance-'));
  await mkdir(join(root, 'artifacts/sentra/.replit-artifact'), { recursive: true });
  await mkdir(join(root, 'audit'), { recursive: true });
  await writeFile(
    join(root, 'artifacts/sentra/.replit-artifact/artifact.toml'),
    'id = "artifacts/sentra"\n',
  );
  await writeFile(
    join(root, 'artifacts/sentra/README.md'),
    '# Sentra\n\n> **Evidence status: MODELED.** See [SOURCE_OF_TRUTH](../../SOURCE_OF_TRUTH.md).\n',
  );
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

async function referenceEvidence(keys) {
  const a11oy = signDssePayload(
    {
      schemaVersion: 'szl.khipu.receipt.v1',
      receiptId: 'a11oy-allow',
      surface: 'a11oy',
      parentHash: null,
      decision: 'ALLOW',
    },
    keys,
  );
  const sentra = signDssePayload(
    {
      schemaVersion: 'szl.khipu.receipt.v1',
      receiptId: 'sentra-deny',
      surface: 'sentra',
      parentHash: payloadHash(a11oy),
      decision: 'DENY',
    },
    keys,
  );
  return {
    receipts: [a11oy, sentra],
    denialReceiptId: 'sentra-deny',
    otelSpans: [
      {
        semanticType: 'gen_ai.inference.client',
        name: 'chat test-model',
        kind: 'CLIENT',
        stability: 'development',
        attributes: {
          'gen_ai.provider.name': 'openai',
          'gen_ai.operation.name': 'chat',
          'gen_ai.request.model': 'test-model',
        },
      },
    ],
  };
}

async function listen(evidence) {
  const server = createServer((request, response) => {
    response.setHeader('content-type', 'application/json');
    if (request.url === '/healthz') response.end(JSON.stringify({ ok: true }));
    else if (request.url === '/version') response.end(JSON.stringify({ gitSha: 'abc123' }));
    else if (request.url === '/evidence') response.end(JSON.stringify(evidence));
    else {
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
  assert.equal(normalizeBaseUrl(`https://example.test${'/'.repeat(100_000)}`), 'https://example.test');
});

test('reference fixture passes all seven vertical conformance gates', async () => {
  const root = await fixtureRoot();
  const keys = keyPair();
  const server = await listen(await referenceEvidence(keys));
  try {
    const report = await runConformance({
      surface: 'sentra',
      root,
      manifest: fixtureManifest(),
      baseUrl: server.baseUrl,
      expectedGitSha: 'abc123',
      publicKeyPem: keys.publicKeyPem,
      expectedFingerprint: publicKeyFingerprint(keys.publicKeyPem),
    });
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
  } finally {
    await server.close();
  }
});

test('a superseded surface fails the product-manifest gate', async () => {
  const root = await fixtureRoot();
  const report = await runConformance({
    surface: 'sentra',
    root,
    manifest: fixtureManifest('SUPERSEDED'),
  });
  assert.equal(report.conformant, false);
  assert.equal(report.checks.find((check) => check.id === 'product-manifest')?.status, 'FAIL');
});
