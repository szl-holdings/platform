import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareSnapshots,
  COMPLETENESS_RULE,
  fetchAssetIds,
  parseNextLink,
  SCHEMA,
  validateLegacyManifestBoundary,
  validateSnapshot,
} from './catalog.mjs';

const organization = 'SZLHOLDINGS';

function headers(link = null) {
  return { get: (name) => (name.toLowerCase() === 'link' ? link : null) };
}

function response(payload, link = null) {
  return {
    ok: true,
    status: 200,
    headers: headers(link),
    json: async () => payload,
  };
}

function snapshot(models = ['SZLHOLDINGS/a']) {
  return {
    schema: SCHEMA,
    organization,
    observedAt: '2026-07-25T00:00:00.000Z',
    evidenceLabel: 'MEASURED',
    source: {
      apiBase: 'https://huggingface.co/api',
      pagination: 'RFC_LINK_CURSOR',
      pageSize: 100,
      completenessRule: COMPLETENESS_RULE,
    },
    assets: {
      models: { count: models.length, ids: models, pages: 1 },
      datasets: { count: 1, ids: ['SZLHOLDINGS/data'], pages: 1 },
      spaces: { count: 1, ids: ['SZLHOLDINGS/space'], pages: 1 },
    },
  };
}

test('parseNextLink selects rel=next', () => {
  assert.equal(
    parseNextLink(
      '<https://huggingface.co/api/models?author=SZLHOLDINGS&limit=2&cursor=abc>; rel="next"',
    ),
    'https://huggingface.co/api/models?author=SZLHOLDINGS&limit=2&cursor=abc',
  );
});

test('fetchAssetIds follows every cursor page and returns sorted IDs', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (calls.length === 1) {
      return response(
        [{ id: 'SZLHOLDINGS/z' }, { id: 'SZLHOLDINGS/a' }],
        '<https://huggingface.co/api/models?author=SZLHOLDINGS&limit=2&cursor=abc>; rel="next"',
      );
    }
    return response([{ id: 'SZLHOLDINGS/m' }]);
  };
  const result = await fetchAssetIds('models', { pageSize: 2, fetchImpl });
  assert.deepEqual(result, {
    count: 3,
    ids: ['SZLHOLDINGS/a', 'SZLHOLDINGS/m', 'SZLHOLDINGS/z'],
    pages: 2,
  });
  assert.equal(calls.length, 2);
});

test('fetchAssetIds rejects a full page without a next cursor', async () => {
  await assert.rejects(
    fetchAssetIds('models', {
      pageSize: 2,
      fetchImpl: async () => response([{ id: 'SZLHOLDINGS/a' }, { id: 'SZLHOLDINGS/b' }]),
    }),
    /PAGINATION_COMPLETENESS_UNPROVEN/,
  );
});

test('fetchAssetIds rejects a cursor that leaves huggingface.co', async () => {
  await assert.rejects(
    fetchAssetIds('models', {
      pageSize: 2,
      fetchImpl: async () =>
        response(
          [{ id: 'SZLHOLDINGS/a' }],
          '<https://attacker.example/api/models?author=SZLHOLDINGS&limit=2&cursor=abc>; rel="next"',
        ),
    }),
    /UNTRUSTED_PAGINATION_URL/,
  );
});

test('validateSnapshot requires a canonical ISO observedAt timestamp', () => {
  assert.deepEqual(validateSnapshot(snapshot()), []);
  for (const observedAt of [
    '0',
    'July 25, 2026 00:00:00 UTC',
    '2026-02-30T00:00:00.000Z',
    '2026-07-25T00:00:00Z',
    '2026-07-25T00:00:00.000+00:00',
  ]) {
    const invalid = snapshot();
    invalid.observedAt = observedAt;
    assert.ok(
      validateSnapshot(invalid).some((error) => error.includes('canonical ISO')),
      observedAt,
    );
  }
});

test('validateSnapshot rejects count, order, and ownership drift', () => {
  const invalid = snapshot(['OTHER/a', 'SZLHOLDINGS/z', 'SZLHOLDINGS/a']);
  invalid.assets.models.count = 2;
  const errors = validateSnapshot(invalid);
  assert.ok(errors.some((error) => error.includes('count')));
  assert.ok(errors.some((error) => error.includes('SZLHOLDINGS')));
  assert.ok(errors.some((error) => error.includes('sorted')));
});

test('validateSnapshot requires exact pagination provenance', () => {
  for (const mutate of [
    (value) => {
      delete value.source.pageSize;
    },
    (value) => {
      value.source.pageSize = 0;
    },
    (value) => {
      value.source.pageSize = '100';
    },
    (value) => {
      delete value.source.completenessRule;
    },
    (value) => {
      value.source.completenessRule = 'follow some pages';
    },
  ]) {
    const invalid = snapshot();
    mutate(invalid);
    assert.notDeepEqual(validateSnapshot(invalid), []);
  }
});

test('compareSnapshots reports added and removed asset IDs', () => {
  const expected = snapshot(['SZLHOLDINGS/a', 'SZLHOLDINGS/b']);
  const actual = snapshot(['SZLHOLDINGS/b', 'SZLHOLDINGS/c']);
  assert.deepEqual(compareSnapshots(expected, actual).assets.models, {
    expectedCount: 2,
    observedCount: 2,
    added: ['SZLHOLDINGS/c'],
    removed: ['SZLHOLDINGS/a'],
  });
  assert.equal(compareSnapshots(expected, actual).status, 'DRIFT');
});

test('legacy manifest counts are explicitly historical declarations', () => {
  assert.deepEqual(
    validateLegacyManifestBoundary({
      _meta: {
        hf_org: 'SZLHOLDINGS',
        evidence_label: 'HISTORICAL',
        counts_scope: 'TRACKED_DECLARATIONS_NOT_LIVE_HUB',
        live_catalog_snapshot: 'artifacts/huggingface-public-catalog.snapshot.json',
        counts_note: 'Historical declarations are not a live Hub inventory.',
      },
    }),
    [],
  );
  assert.ok(validateLegacyManifestBoundary({ _meta: { hf_org: 'SZLHOLDINGS' } }).length > 0);
});
