import assert from 'node:assert/strict';
import test from 'node:test';

import { serializeManifest } from './generate-public-surfaces.js';
import {
  buildPublicSurfaceManifest,
  type PublicSurface,
  type PublicSurfaceRegistry,
  validatePublicSurfaceManifest,
  validatePublicSurfaceRegistry,
  verifyLivePublicSurfaces,
} from './public-surfaces.js';

const NOW = Date.parse('2026-08-01T15:20:00Z');

function surface(overrides: Partial<PublicSurface> = {}): PublicSurface {
  return {
    id: 'a11oy-front-door',
    name: 'SZL Holdings and A11oy front door',
    kind: 'WEB',
    audience: ['INVESTOR', 'DEVELOPER'],
    mode: 'MIXED',
    availability: 'REACHABLE',
    canonical_url: 'https://a-11-oy.com/',
    source_owner: {
      repository: 'szl-holdings/a11oy',
      path: 'a11oy_landing.html',
      role: 'RUNTIME_OWNER',
    },
    observation: {
      method: 'GET',
      status: 200,
      final_url: 'https://a-11-oy.com/',
    },
    note: 'Reachability is measured independently from deeper capability state.',
    ...overrides,
  };
}

function registry(surfaces: PublicSurface[] = [surface()]): PublicSurfaceRegistry {
  return {
    schema: 'szl.public-surfaces.registry/v1',
    observed_at: new Date(NOW).toISOString(),
    surfaces,
  };
}

test('counts only routed customer-facing web surfaces', () => {
  const manifest = buildPublicSurfaceManifest(
    registry([
      surface(),
      surface({
        id: 'a11oy-build-info-api',
        kind: 'API',
        audience: ['DEVELOPER'],
        canonical_url: 'https://szlholdings-a11oy.hf.space/api/build-info',
        observation: {
          method: 'GET',
          status: 200,
          final_url: 'https://szlholdings-a11oy.hf.space/api/build-info',
        },
      }),
      surface({
        id: 'legacy-lyte-route',
        mode: 'UNAVAILABLE',
        availability: 'UNAVAILABLE',
        canonical_url: 'https://a-11-oy.com/lyte/',
        source_owner: {
          repository: 'szl-holdings/example',
          path: 'README.md',
          role: 'REMEDIATION_OWNER',
        },
        observation: {
          method: 'GET',
          status: 404,
          final_url: 'https://a-11-oy.com/lyte/',
        },
      }),
    ]),
  );

  assert.equal(manifest.summary.declared, 3);
  assert.equal(manifest.summary.customer_facing_products, 1);
  assert.equal(manifest.summary.customer_facing_routes, 1);
  assert.deepEqual(validatePublicSurfaceManifest(manifest, NOW), []);
});

test('counts customer-facing products independently from routed pages and repository casing', () => {
  const manifest = buildPublicSurfaceManifest(
    registry([
      surface(),
      surface({
        id: 'a11oy-docs',
        name: 'A11oy public documentation',
        mode: 'DOCUMENTATION',
        canonical_url: 'https://a-11-oy.com/docs',
        source_owner: {
          repository: 'SZL-Holdings/A11oy',
          path: 'console/docs.html',
          role: 'RUNTIME_OWNER',
        },
        observation: { method: 'GET', status: 200, final_url: 'https://a-11-oy.com/docs' },
      }),
      surface({
        id: 'killinchu-public-console',
        name: 'Killinchu public console',
        canonical_url: 'https://a-11-oy.com/killinchu',
        availability: 'REDIRECTED',
        source_owner: {
          repository: 'szl-holdings/killinchu',
          path: 'web/index.html',
          role: 'RUNTIME_OWNER',
        },
        observation: {
          method: 'GET',
          status: 200,
          final_url: 'https://szlholdings-killinchu.hf.space/',
        },
      }),
      surface({
        id: 'a11oy-net-thesis',
        name: 'A11oy technical thesis',
        mode: 'DOCUMENTATION',
        canonical_url: 'https://a11oy.net/',
        source_owner: {
          repository: 'szl-holdings/a11oy-net',
          path: 'index.html',
          role: 'RUNTIME_OWNER',
        },
        observation: { method: 'GET', status: 200, final_url: 'https://a11oy.net/' },
      }),
    ]),
  );

  assert.equal(manifest.summary.customer_facing_routes, 4);
  assert.equal(manifest.summary.customer_facing_products, 2);
  assert.deepEqual(validatePublicSurfaceManifest(manifest, NOW), []);
});

test('returns validation failures for malformed manifest surfaces without throwing', () => {
  const manifest = buildPublicSurfaceManifest(registry());
  const malformed = { ...manifest, surfaces: [null] };

  assert.deepEqual(validatePublicSurfaceManifest(malformed, NOW), [
    'surfaces[0] must be an object',
  ]);
});

test('serializes deterministic repository-formatted audience arrays', () => {
  const serialized = serializeManifest(registry());
  assert.match(serialized, /"audience": \["INVESTOR", "DEVELOPER"\]/);
  assert.doesNotMatch(serialized, /"audience": \[\n/);
  assert.equal(JSON.parse(serialized).summary.customer_facing_products, 1);
  assert.equal(JSON.parse(serialized).summary.customer_facing_routes, 1);
});

test('rejects stale observations instead of carrying them forward as current', () => {
  const stale = registry();
  stale.observed_at = new Date(NOW - 7 * 24 * 60 * 60 * 1000 - 1).toISOString();
  assert.ok(
    validatePublicSurfaceRegistry(stale, NOW).includes('observed_at is older than seven days'),
  );
});

test('rejects a reachable claim backed by an HTTP failure', () => {
  const invalid = registry([
    surface({
      observation: { method: 'GET', status: 404, final_url: 'https://a-11-oy.com/' },
    }),
  ]);
  assert.ok(
    validatePublicSurfaceRegistry(invalid, NOW).some((failure) =>
      failure.includes('is routed but its observation is not successful'),
    ),
  );
});

test('rejects a routed surface without a runtime source owner', () => {
  const invalid = registry([
    surface({
      source_owner: {
        repository: 'szl-holdings/example',
        path: 'docs/claim.md',
        role: 'CLAIM_OWNER',
      },
    }),
  ]);
  assert.ok(
    validatePublicSurfaceRegistry(invalid, NOW).some((failure) =>
      failure.includes('is routed but lacks a RUNTIME_OWNER'),
    ),
  );
});

test('rejects duplicate canonical URLs', () => {
  const invalid = registry([surface(), surface({ id: 'a11oy-console' })]);
  assert.ok(
    validatePublicSurfaceRegistry(invalid, NOW).some((failure) =>
      failure.includes('canonical_url duplicates'),
    ),
  );
});

test('live verification fails closed on status or redirect drift', async () => {
  const failures = await verifyLivePublicSurfaces(registry(), async () => ({
    status: 503,
    url: 'https://a-11-oy.com/maintenance',
    body: null,
  }));
  assert.deepEqual(failures, [
    'a11oy-front-door: expected HTTP 200, observed 503',
    'a11oy-front-door: expected final URL https://a-11-oy.com/, observed https://a-11-oy.com/maintenance',
  ]);
});

test('rejects unknown, credentialed, IP, port, and final-target escape values', () => {
  const cases: Array<Partial<PublicSurface>> = [
    { id: 'unknown-surface' },
    {
      canonical_url: 'https://user:password@a-11-oy.com/',
      observation: {
        method: 'GET',
        status: 200,
        final_url: 'https://user:password@a-11-oy.com/',
      },
    },
    {
      canonical_url: 'https://127.0.0.1/internal',
      observation: { method: 'GET', status: 200, final_url: 'https://127.0.0.1/internal' },
    },
    {
      canonical_url: 'https://a-11-oy.com:444/',
      observation: { method: 'GET', status: 200, final_url: 'https://a-11-oy.com:444/' },
    },
    {
      observation: { method: 'GET', status: 200, final_url: 'https://a11oy.net/' },
    },
  ];

  for (const overrides of cases) {
    assert.notDeepEqual(validatePublicSurfaceRegistry(registry([surface(overrides)]), NOW), []);
  }
});

test('does not issue a request when file-controlled target validation fails', async () => {
  let requestCount = 0;
  const malicious = surface({
    canonical_url: 'https://127.0.0.1/internal',
    observation: { method: 'GET', status: 200, final_url: 'https://127.0.0.1/internal' },
  });

  const failures = await verifyLivePublicSurfaces(registry([malicious]), async () => {
    requestCount += 1;
    return { status: 200, url: malicious.canonical_url, body: null };
  });

  assert.equal(requestCount, 0);
  assert.ok(failures.every((failure) => failure.startsWith('registry: ')));
});

test('follows one exact approved redirect with manual redirect handling', async () => {
  const redirected = surface({
    id: 'killinchu-public-console',
    name: 'Killinchu public console',
    canonical_url: 'https://a-11-oy.com/killinchu',
    availability: 'REDIRECTED',
    observation: {
      method: 'GET',
      status: 200,
      final_url: 'https://szlholdings-killinchu.hf.space/',
    },
  });
  const requests: string[] = [];

  const failures = await verifyLivePublicSurfaces(registry([redirected]), async (url, init) => {
    requests.push(url);
    assert.equal(init.redirect, 'manual');
    if (requests.length === 1) {
      return {
        status: 307,
        url,
        body: null,
        headers: { get: () => 'https://szlholdings-killinchu.hf.space/' },
      };
    }
    return { status: 200, url, body: null, headers: { get: () => null } };
  });

  assert.deepEqual(failures, []);
  assert.deepEqual(requests, [
    'https://a-11-oy.com/killinchu',
    'https://szlholdings-killinchu.hf.space/',
  ]);
});

test('rejects a redirect escape before requesting the destination', async () => {
  const redirected = surface({
    id: 'killinchu-public-console',
    name: 'Killinchu public console',
    canonical_url: 'https://a-11-oy.com/killinchu',
    availability: 'REDIRECTED',
    observation: {
      method: 'GET',
      status: 200,
      final_url: 'https://szlholdings-killinchu.hf.space/',
    },
  });
  const requests: string[] = [];

  const failures = await verifyLivePublicSurfaces(registry([redirected]), async (url) => {
    requests.push(url);
    return {
      status: 307,
      url,
      body: null,
      headers: { get: () => 'https://127.0.0.1/internal' },
    };
  });

  assert.deepEqual(requests, ['https://a-11-oy.com/killinchu']);
  assert.deepEqual(failures, [
    'killinchu-public-console: expected redirect to https://szlholdings-killinchu.hf.space/, observed https://127.0.0.1/internal',
  ]);
});
