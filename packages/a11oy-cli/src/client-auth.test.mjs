import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAuthHeaders } from './client.ts';

test('omits authentication headers when no credential is configured', () => {
  assert.deepEqual(buildAuthHeaders({ apiToken: '', apiKey: '' }), {});
  assert.deepEqual(buildAuthHeaders({ apiToken: '  ', apiKey: '\t' }), {});
});

test('sends only explicitly configured credentials', () => {
  assert.deepEqual(buildAuthHeaders({ apiToken: 'token-from-secret-store' }), {
    Authorization: 'Bearer token-from-secret-store',
  });
  assert.deepEqual(buildAuthHeaders({ apiKey: 'key-from-secret-store' }), {
    'X-API-Key': 'key-from-secret-store',
  });
  assert.deepEqual(
    buildAuthHeaders({ apiToken: ' token-from-secret-store ', apiKey: ' key-from-secret-store ' }),
    {
      Authorization: 'Bearer token-from-secret-store',
      'X-API-Key': 'key-from-secret-store',
    },
  );
});
