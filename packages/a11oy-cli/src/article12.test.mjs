import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  createArticle12Archive,
  verifyArticle12Archive,
} from './article12.ts';

function signingKey() {
  const { privateKey } = generateKeyPairSync('ed25519');
  return privateKey.export({ type: 'pkcs8', format: 'pem' });
}

function receipt(id, article, timestampIso8601) {
  return {
    receiptId: id,
    eventType: article === '12' ? 'policy.denied' : 'policy.reviewed',
    actorId: 'a11oy.gate',
    toolName: 'policy.evaluate',
    payloadHash: `sha256:${id}`,
    prevReceiptHash: null,
    timestampIso8601,
    traceId: '0123456789abcdef0123456789abcdef',
    schemaVersion: '2.0',
    regulatory: {
      eu_ai_act: {
        article,
        obligation:
          article === '12'
            ? 'record-keeping and traceability'
            : 'transparency to deployers',
        annex_iii_category: null,
        high_risk: false,
        log_retention_class: 'lifetime',
      },
      nist_ai_rmf: {
        function: 'MEASURE',
        subcategory: 'MEASURE 2.7',
      },
      owasp_asi: ['ASI02', 'ASI06'],
      iso_42001: { control: 'A.6.2.6' },
    },
  };
}

const source = {
  receipts: [
    receipt('receipt-art12', '12', '2026-07-20T12:00:00.000Z'),
    receipt('receipt-art13', '13', '2026-07-20T13:00:00.000Z'),
    receipt('receipt-old', '12', '2026-06-01T12:00:00.000Z'),
  ],
  chainProof: {
    algorithm: 'sha256',
    firstParentHash: 'sha256:parent',
    lastReceiptHash: 'sha256:receipt-art12',
  },
  rekorInclusionProofs: [
    {
      receiptId: 'receipt-art12',
      logIndex: 1001,
      inclusionProof: { rootHash: 'sha256:root' },
    },
    {
      receiptId: 'receipt-old',
      logIndex: 900,
      inclusionProof: { rootHash: 'sha256:old-root' },
    },
  ],
  humanOversightEvents: [
    {
      eventId: 'approval-1',
      timestamp: '2026-07-20T12:01:00.000Z',
      decision: 'rejected',
    },
    {
      eventId: 'approval-old',
      timestamp: '2026-06-01T12:01:00.000Z',
      decision: 'approved',
    },
  ],
  denialLog: [
    {
      eventId: 'denial-1',
      ts: '2026-07-20T12:00:00.000Z',
      receiptId: 'receipt-art12',
    },
  ],
};

test('creates and verifies a signed, time-bounded Article 12 archive', () => {
  const created = createArticle12Archive(source, signingKey(), {
    from: '2026-07-01',
    to: '2026-07-31',
    createdAt: '2026-07-25T12:00:00.000Z',
  });

  assert.equal(created.result.receiptCount, 1);
  assert.equal(created.result.rekorProofCount, 1);
  assert.equal(created.result.humanOversightEventCount, 1);
  assert.equal(created.result.denialCount, 1);
  assert.equal(created.manifest.legal_posture.includes('not a conformity'), true);

  assert.deepEqual(verifyArticle12Archive(created.archive), {
    ok: true,
    signatureValid: true,
    checksumsValid: true,
    checkedFiles: 7,
    errors: [],
  });
});

test('tampering with an evidence file fails offline archive verification', () => {
  const created = createArticle12Archive(source, signingKey(), {
    from: '2026-07-01',
    to: '2026-07-31',
    createdAt: '2026-07-25T12:00:00.000Z',
  });
  const tampered = Buffer.from(created.archive);
  const marker = Buffer.from('"receiptId":"receipt-art12"', 'utf8');
  const at = tampered.indexOf(marker);
  assert.notEqual(at, -1);
  tampered[at + marker.length - 2] ^= 1;

  const result = verifyArticle12Archive(tampered);
  assert.equal(result.ok, false);
  assert.equal(result.signatureValid, true);
  assert.equal(result.checksumsValid, false);
  assert.match(result.errors.join('\n'), /receipts\.jsonl/);
});

test('the bundled offline instructions execute without vendor services', () => {
  const created = createArticle12Archive(source, signingKey(), {
    from: '2026-07-01',
    to: '2026-07-31',
    createdAt: '2026-07-25T12:00:00.000Z',
  });
  const directory = mkdtempSync(join(tmpdir(), 'a11oy-article12-'));
  try {
    const archivePath = join(directory, 'article12.tar');
    writeFileSync(archivePath, created.archive);
    const extract = spawnSync('tar', ['-xf', archivePath], {
      cwd: directory,
      encoding: 'utf8',
    });
    assert.equal(extract.status, 0, extract.stderr);

    const verify = spawnSync(process.execPath, ['verify.mjs'], {
      cwd: directory,
      encoding: 'utf8',
    });
    assert.equal(verify.status, 0, verify.stderr);
    assert.match(verify.stdout, /manifest signature: PASS/);
    assert.match(verify.stdout, /file checksums: PASS/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('refuses an export when a selected receipt lacks a Rekor proof', () => {
  const missingProof = {
    ...source,
    rekorInclusionProofs: [],
  };
  assert.throws(
    () =>
      createArticle12Archive(missingProof, signingKey(), {
        from: '2026-07-01',
        to: '2026-07-31',
        createdAt: '2026-07-25T12:00:00.000Z',
      }),
    /missing Rekor inclusion proof for receipts: receipt-art12/,
  );
});
