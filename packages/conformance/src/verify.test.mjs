import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { publicKeyFingerprint, signDssePayload, verifyDsseEnvelope } from './verify.mjs';

function keys() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privateKeyPem: privateKey.export({ format: 'pem', type: 'pkcs8' }),
    publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }),
  };
}

test('offline verifier accepts genuine and rejects tampered DSSE receipts', () => {
  const keyPair = keys();
  const envelope = signDssePayload(
    { receiptId: 'receipt-1', surface: 'a11oy', parentHash: null },
    keyPair,
  );
  const expectedFingerprint = publicKeyFingerprint(keyPair.publicKeyPem);
  assert.equal(
    verifyDsseEnvelope(envelope, {
      publicKeyPem: keyPair.publicKeyPem,
      expectedFingerprint,
    }).valid,
    true,
  );

  const tampered = {
    ...envelope,
    payload: Buffer.from(
      JSON.stringify({ receiptId: 'receipt-1', surface: 'sentra', parentHash: null }),
    ).toString('base64'),
  };
  assert.equal(
    verifyDsseEnvelope(tampered, {
      publicKeyPem: keyPair.publicKeyPem,
      expectedFingerprint,
    }).valid,
    false,
  );
});

test('CLI exits 0 genuine and 1 tampered in offline mode', async () => {
  const keyPair = keys();
  const directory = await mkdtemp(join(tmpdir(), 'szl-verify-'));
  const keyPath = join(directory, 'public.pem');
  const genuinePath = join(directory, 'genuine.json');
  const tamperedPath = join(directory, 'tampered.json');
  const envelope = signDssePayload(
    { receiptId: 'receipt-cli', surface: 'a11oy', parentHash: null },
    keyPair,
  );
  await writeFile(keyPath, keyPair.publicKeyPem);
  await writeFile(genuinePath, JSON.stringify(envelope));
  await writeFile(
    tamperedPath,
    JSON.stringify({ ...envelope, payload: `${envelope.payload.slice(0, -4)}AAAA` }),
  );

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
  assert.equal(genuine.status, 0, genuine.stderr);
  assert.equal(tampered.status, 1, tampered.stderr);
});
