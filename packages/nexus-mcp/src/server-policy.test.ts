import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateGuardianPolicyFailClosed } from './server.js';

const context = { tenantId: 'tenant-1', actorId: 'actor-1' };

test('preserves an explicit policy decision', async () => {
  const result = await evaluateGuardianPolicyFailClosed(
    async () => ({ allowed: true, reason: 'permitted' }),
    'tool.read',
    {},
    context,
  );
  assert.deepEqual(result, { allowed: true, reason: 'permitted' });
});

test('blocks when the Guardian evaluator throws', async () => {
  const result = await evaluateGuardianPolicyFailClosed(
    async () => {
      throw new Error('policy backend unavailable');
    },
    'tool.write',
    {},
    context,
  );
  assert.deepEqual(result, {
    allowed: false,
    reason: 'Guardian policy evaluation failed',
  });
});

test('blocks a malformed Guardian decision', async () => {
  const result = await evaluateGuardianPolicyFailClosed(
    async () => undefined as never,
    'tool.write',
    {},
    context,
  );
  assert.deepEqual(result, {
    allowed: false,
    reason: 'Guardian policy returned an invalid decision',
  });
});
