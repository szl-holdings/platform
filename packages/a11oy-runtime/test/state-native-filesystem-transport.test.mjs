import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  FileSystemStateTransportAdapter,
  StateNativeError,
  digestObject,
  sha256Hex,
} from '../dist/state-native/index.js';

function expectCode(code) {
  return (error) => error instanceof StateNativeError && error.code === code;
}

function portableObject(payloadText = 'durable secret payload') {
  const payload = Buffer.from(payloadText, 'utf8');
  const base = {
    tenantId: 'tenant_a',
    sessionId: 'session_a',
    stateType: 'structured_memory',
    portability: 'P4',
    contentDigest: sha256Hex(payload),
    compatibility: {
      schemaDigest: sha256Hex('schema-v1'),
      policyDigest: sha256Hex('policy-v1'),
      cognitiveEpoch: 'epoch_a',
    },
    governance: {
      sensitivity: 'restricted',
      retentionClass: 'regulated',
      reusePolicy: 'same_session',
      evidenceTier: 'MEASURED',
    },
    provenance: {
      sourceActionId: 'action_a',
      parentCapsuleIds: [],
      producerKernelId: 'kernel_a',
      producerKernelVersion: '1.0.0',
    },
  };
  const identity = digestObject({
    schema: 'szl.state-capsule-identity/v1',
    tenantId: base.tenantId,
    sessionId: base.sessionId,
    stateType: base.stateType,
    portability: base.portability,
    contentDigest: base.contentDigest,
    compatibility: base.compatibility,
    governance: base.governance,
    provenance: base.provenance,
  });
  return {
    capsule: {
      schema: 'szl.state-capsule/v1',
      capsuleId: `state_${identity}`,
      tenantId: base.tenantId,
      sessionId: base.sessionId,
      stateType: base.stateType,
      portability: base.portability,
      contentDigest: base.contentDigest,
      byteLength: payload.byteLength,
      createdAt: '2026-08-17T00:00:00.000Z',
      compatibility: base.compatibility,
      governance: base.governance,
      provenance: base.provenance,
      revocationStatus: 'ACTIVE',
    },
    payload,
  };
}

async function listFiles(path) {
  const output = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const item = join(path, entry.name);
    if (entry.isDirectory()) output.push(...(await listFiles(item)));
    else output.push(item);
  }
  return output;
}

test('durable transport encrypts, atomically deduplicates, and survives reopen', async () => {
  const root = await mkdtemp(join(tmpdir(), 'szl-state-'));
  const masterKey = randomBytes(32);
  const object = portableObject();
  try {
    const adapter = new FileSystemStateTransportAdapter({ rootDirectory: root, masterKey });
    await Promise.all([adapter.put(object), adapter.put(object), adapter.put(object)]);
    assert.equal((await adapter.inspect(object.capsule.capsuleId)).state, 'ACTIVE');

    const files = await listFiles(root);
    assert.equal(files.length, 1);
    assert.equal((await readFile(files[0], 'utf8')).includes('durable secret payload'), false);

    const reopened = new FileSystemStateTransportAdapter({ rootDirectory: root, masterKey });
    const result = await reopened.get(object.capsule.capsuleId);
    assert.ok(result);
    assert.equal(Buffer.from(result.payload).toString('utf8'), 'durable secret payload');
    assert.deepEqual(result.capsule, object.capsule);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('wrong keys and record tampering fail closed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'szl-state-'));
  const object = portableObject();
  try {
    const adapter = new FileSystemStateTransportAdapter({
      rootDirectory: root,
      masterKey: randomBytes(32),
    });
    await adapter.put(object);

    const wrongKey = new FileSystemStateTransportAdapter({
      rootDirectory: root,
      masterKey: randomBytes(32),
    });
    await assert.rejects(wrongKey.get(object.capsule.capsuleId), expectCode('SIGNATURE_INVALID'));

    const [recordPath] = await listFiles(join(root, 'objects'));
    const record = JSON.parse(await readFile(recordPath, 'utf8'));
    record.envelope.ciphertext = `${record.envelope.ciphertext.slice(0, -2)}AA`;
    await writeFile(recordPath, `${JSON.stringify(record)}\n`, 'utf8');
    await assert.rejects(adapter.get(object.capsule.capsuleId), expectCode('SIGNATURE_INVALID'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deletion receipt is terminal and prevents resurrection', async () => {
  const root = await mkdtemp(join(tmpdir(), 'szl-state-'));
  const masterKey = randomBytes(32);
  const object = portableObject();
  try {
    const adapter = new FileSystemStateTransportAdapter({
      rootDirectory: root,
      masterKey,
      clock: () => new Date('2026-08-17T12:00:00.000Z'),
    });
    await adapter.put(object);
    await adapter.delete(object.capsule.capsuleId);
    await adapter.delete(object.capsule.capsuleId);

    assert.equal(await adapter.get(object.capsule.capsuleId), undefined);
    const inspection = await adapter.inspect(object.capsule.capsuleId);
    assert.equal(inspection.state, 'DELETED');
    assert.equal(inspection.deletionReceipt?.deletedAt, '2026-08-17T12:00:00.000Z');
    assert.equal(inspection.deletionReceipt?.priorRecordDigest.length, 64);
    assert.equal(inspection.deletionReceipt?.deletionDigest.length, 64);

    const reopened = new FileSystemStateTransportAdapter({ rootDirectory: root, masterKey });
    await assert.rejects(reopened.put(object), expectCode('SHREDDED'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('invalid IDs and payload budgets fail before filesystem traversal', async () => {
  const root = await mkdtemp(join(tmpdir(), 'szl-state-'));
  try {
    const adapter = new FileSystemStateTransportAdapter({
      rootDirectory: root,
      masterKey: randomBytes(32),
      maxPayloadBytes: 4,
    });
    await assert.rejects(adapter.get('../../escape'), expectCode('INVALID_INPUT'));
    await assert.rejects(adapter.put(portableObject('too large')), expectCode('BUDGET_EXCEEDED'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
