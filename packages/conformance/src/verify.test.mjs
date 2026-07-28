import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  KHIPU_PAYLOAD_TYPE,
  publicKeyFingerprint,
  signDssePayload,
  VERIFICATION_STATUS,
  verifyDsseEnvelope,
} from './verify.mjs';

function keys(type = 'ed25519') {
  const { privateKey, publicKey } =
    type === 'ec'
      ? generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
      : generateKeyPairSync('ed25519');
  return {
    privateKeyPem: privateKey.export({ format: 'pem', type: 'pkcs8' }),
    publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }),
  };
}

function fixtureSet(type = 'ed25519') {
  const signer = keys(type);
  const wrongSigner = keys(type);
  const knownGood = signDssePayload(
    { receiptId: 'receipt-1', surface: 'a11oy', parentHash: null },
    { ...signer, keyid: `fixture-${type}` },
  );
  const tampered = {
    ...knownGood,
    payload: Buffer.from(
      JSON.stringify({ receiptId: 'receipt-1', surface: 'sentra', parentHash: null }),
    ).toString('base64'),
  };
  const wrongType = { ...knownGood, payloadType: 'application/vnd.szl.khipu+json' };
  return {
    signer,
    wrongSigner,
    expectedFingerprint: publicKeyFingerprint(signer.publicKeyPem),
    knownGood,
    tampered,
    wrongType,
    unpinned: knownGood,
  };
}

test('known-good Ed25519 receipt verifies only against a pinned trust root', () => {
  const fixture = fixtureSet();
  const result = verifyDsseEnvelope(fixture.knownGood, {
    publicKeyPem: fixture.signer.publicKeyPem,
    expectedFingerprint: fixture.expectedFingerprint,
  });
  assert.equal(result.status, VERIFICATION_STATUS.VERIFIED);
  assert.equal(result.valid, true);
  assert.equal(result.algorithm, 'Ed25519');
});

test('fingerprint-only pin verifies the matching embedded key', () => {
  const fixture = fixtureSet();
  const result = verifyDsseEnvelope(fixture.knownGood, {
    expectedFingerprint: fixture.expectedFingerprint,
  });
  assert.equal(result.status, VERIFICATION_STATUS.VERIFIED);
  assert.equal(result.trust, 'pinned-embedded-key-fingerprint');
});

test('ECDSA P-256 receipt verifies with SHA-256', () => {
  const fixture = fixtureSet('ec');
  const result = verifyDsseEnvelope(fixture.knownGood, {
    publicKeyPem: fixture.signer.publicKeyPem,
  });
  assert.equal(result.status, VERIFICATION_STATUS.VERIFIED);
  assert.equal(result.algorithm, 'ECDSA-P256-SHA256');
});

test('tampered, wrong-key, and wrong-type fixtures are invalid', () => {
  const fixture = fixtureSet();
  const options = {
    publicKeyPem: fixture.signer.publicKeyPem,
    expectedFingerprint: fixture.expectedFingerprint,
  };
  assert.equal(verifyDsseEnvelope(fixture.tampered, options).status, VERIFICATION_STATUS.INVALID);
  assert.equal(
    verifyDsseEnvelope(fixture.knownGood, {
      publicKeyPem: fixture.wrongSigner.publicKeyPem,
    }).status,
    VERIFICATION_STATUS.INVALID,
  );
  assert.equal(verifyDsseEnvelope(fixture.wrongType, options).status, VERIFICATION_STATUS.INVALID);
});

test('valid self-signed receipt without an external pin is indeterminate', () => {
  const fixture = fixtureSet();
  const result = verifyDsseEnvelope(fixture.unpinned);
  assert.equal(result.valid, false);
  assert.equal(result.status, VERIFICATION_STATUS.INDETERMINATE);
  assert.equal(result.signatureValid, true);
  assert.equal(result.trust, 'embedded-key-unpinned');
});

test('CLI keeps verified=0, invalid=1, and indeterminate or usage=2', async () => {
  const fixture = fixtureSet();
  const directory = await mkdtemp(join(tmpdir(), 'szl-verify-'));
  const keyPath = join(directory, 'public.pem');
  const invalidKeyPath = join(directory, 'invalid-public.pem');
  const genuinePath = join(directory, 'genuine.json');
  const invalidJsonPath = join(directory, 'invalid.json');
  const tamperedPath = join(directory, 'tampered.json');
  const wrongTypePath = join(directory, 'wrong-type.json');
  await writeFile(keyPath, fixture.signer.publicKeyPem);
  await writeFile(invalidKeyPath, 'not a public key');
  await writeFile(genuinePath, JSON.stringify(fixture.knownGood));
  await writeFile(invalidJsonPath, '{');
  await writeFile(tamperedPath, JSON.stringify(fixture.tampered));
  await writeFile(wrongTypePath, JSON.stringify(fixture.wrongType));

  const cli = fileURLToPath(new URL('./verify-cli.mjs', import.meta.url));
  const genuine = spawnSync(
    process.execPath,
    [cli, '--file', genuinePath, '--public-key', keyPath, '--offline'],
    { encoding: 'utf8' },
  );
  const tampered = spawnSync(
    process.execPath,
    [cli, '--file', tamperedPath, '--public-key', keyPath, '--offline'],
    { encoding: 'utf8' },
  );
  const wrongType = spawnSync(
    process.execPath,
    [cli, '--file', wrongTypePath, '--public-key', keyPath, '--offline'],
    { encoding: 'utf8' },
  );
  const unpinned = spawnSync(process.execPath, [cli, '--file', genuinePath, '--offline'], {
    encoding: 'utf8',
  });
  const usage = spawnSync(process.execPath, [cli, '--file', genuinePath], {
    encoding: 'utf8',
  });
  const invalidTrustInput = spawnSync(
    process.execPath,
    [cli, '--file', genuinePath, '--public-key', invalidKeyPath, '--offline'],
    { encoding: 'utf8' },
  );
  const invalidJson = spawnSync(
    process.execPath,
    [cli, '--file', invalidJsonPath, '--public-key', keyPath, '--offline'],
    { encoding: 'utf8' },
  );
  assert.equal(genuine.status, 0, genuine.stderr);
  assert.equal(tampered.status, 1, tampered.stderr);
  assert.equal(wrongType.status, 1, wrongType.stderr);
  assert.equal(unpinned.status, 2, unpinned.stderr);
  assert.match(unpinned.stdout, /^INDETERMINATE /);
  assert.equal(usage.status, 2);
  assert.equal(invalidTrustInput.status, 2);
  assert.match(invalidTrustInput.stdout, /^INDETERMINATE /);
  assert.equal(invalidJson.status, 1);
});

test('CLI accepts a fingerprint-only trust root and always enforces the KHIPU type', async () => {
  const fixture = fixtureSet('ec');
  const directory = await mkdtemp(join(tmpdir(), 'szl-verify-fingerprint-'));
  const genuinePath = join(directory, 'genuine.json');
  await writeFile(genuinePath, JSON.stringify(fixture.knownGood));

  const cli = fileURLToPath(new URL('./verify-cli.mjs', import.meta.url));
  const result = spawnSync(
    process.execPath,
    [
      cli,
      '--file',
      genuinePath,
      '--expected-fingerprint',
      fixture.expectedFingerprint,
      '--offline',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^VERIFIED sha256:[0-9a-f]{64}/);
  assert.match(result.stdout, /algorithm=ECDSA-P256-SHA256/);
  assert.equal(KHIPU_PAYLOAD_TYPE, 'application/vnd.szl.khipu.receipt+json');
});

test('verifier CLI rejects every missing option value before verification', () => {
  const cli = fileURLToPath(new URL('./verify-cli.mjs', import.meta.url));
  for (const argv of [
    ['--file'],
    ['--file', '--offline'],
    ['--file', 'receipt.json', '--public-key'],
    ['--file', 'receipt.json', '--public-key', '--offline'],
    ['--file', 'receipt.json', '--expected-fingerprint'],
    ['--file', 'receipt.json', '--expected-fingerprint', '--offline'],
  ]) {
    const result = spawnSync(process.execPath, [cli, ...argv], { encoding: 'utf8' });
    assert.equal(result.status, 2, argv.join(' '));
    assert.match(result.stderr, /requires a value/, argv.join(' '));
  }
});
