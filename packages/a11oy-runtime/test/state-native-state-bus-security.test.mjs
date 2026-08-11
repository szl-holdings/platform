import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import {
  AlloyStateBus,
  StateNativeError,
  digestObject,
} from '../dist/state-native/index.js';

function expectCode(code) {
  return (error) => error instanceof StateNativeError && error.code === code;
}

function adapterFor(name, object) {
  return {
    name,
    async put() {},
    async get(capsuleId) {
      return object.capsule.capsuleId === capsuleId ? object : undefined;
    },
    async delete() {},
  };
}

test('state transport imports verify the complete content-addressed capsule contract', async () => {
  const sourceKey = randomBytes(32);
  const validTargetKey = randomBytes(32);
  const forgedTargetKey = randomBytes(32);
  const source = new AlloyStateBus({ masterKey: sourceKey });
  const validTarget = new AlloyStateBus({ masterKey: validTargetKey });
  const forgedTarget = new AlloyStateBus({ masterKey: forgedTargetKey });
  const compatibility = {
    schemaDigest: digestObject({ schema: 'state.transport/v1' }),
    policyDigest: digestObject({ policy: 'transport-policy' }),
    cognitiveEpoch: 'epoch_transport',
  };

  try {
    const capsule = await source.put({
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      stateType: 'structured_memory',
      portability: 'P4',
      payload: Buffer.from('{"decision":"hold"}'),
      compatibility,
      governance: {
        sensitivity: 'confidential',
        retentionClass: 'session',
        reusePolicy: 'same_session',
        evidenceTier: 'MEASURED',
      },
      provenance: { sourceActionId: 'transport-source', parentCapsuleIds: [] },
    });
    const object = await source.get(capsule.capsuleId, {
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      actionId: 'transport-source',
      compatibility,
      allowedSensitivities: ['confidential'],
    });

    const validImport = await validTarget.importFrom(
      capsule.capsuleId,
      'tenant_a',
      adapterFor('valid-transport', object),
    );
    assert.equal(validImport.capsule.capsuleId, capsule.capsuleId);
    const validRead = await validTarget.get(capsule.capsuleId, {
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      actionId: 'valid-import-read',
      compatibility,
      allowedSensitivities: ['confidential'],
    });
    assert.equal(Buffer.from(validRead.payload).toString('utf8'), '{"decision":"hold"}');

    const forgedObject = {
      capsule: {
        ...object.capsule,
        sessionId: 'attacker-session',
        compatibility: {
          ...object.capsule.compatibility,
          policyDigest: digestObject({ policy: 'weakened-policy' }),
        },
        governance: {
          ...object.capsule.governance,
          sensitivity: 'public',
          reusePolicy: 'same_tenant',
        },
      },
      payload: object.payload,
    };
    await assert.rejects(
      forgedTarget.importFrom(
        capsule.capsuleId,
        'tenant_a',
        adapterFor('forged-transport', forgedObject),
      ),
      expectCode('SIGNATURE_INVALID'),
    );
    assert.equal(forgedTarget.listMetadata('tenant_a').length, 0);
  } finally {
    source.dispose();
    validTarget.dispose();
    forgedTarget.dispose();
    sourceKey.fill(0);
    validTargetKey.fill(0);
    forgedTargetKey.fill(0);
  }
});
