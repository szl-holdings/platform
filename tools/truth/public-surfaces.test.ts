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
    id: 'example-surface',
    name: 'Example public surface',
    kind: 'WEB',
    audience: ['INVESTOR', 'DEVELOPER'],
    mode: 'MIXED',
    availability: 'REACHABLE',
    canonical_url: 'https://example.com/surface',
    source_owner: {
      repository: 'szl-holdings/example',
      path: 'web/index.html',
      role: 'RUNTIME_OWNER',
    },
    observation: {
      method: 'GET',
      status: 200,
      final_url: 'https://example.com/surface',
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
        id: 'machine-api',
        kind: 'API',
        audience: ['DEVELOPER'],
        canonical_url: 'https://example.com/api',
        observation: { method: 'GET', status: 200, final_url: 'https://example.com/api' },
      }),
      surface({
        id: 'missing-page',
        mode: 'UNAVAILABLE',
        availability: 'UNAVAILABLE',
        canonical_url: 'https://example.com/missing',
        source_owner: {
          repository: 'szl-holdings/example',
          path: 'README.md',
          role: 'REMEDIATION_OWNER',
        },
        observation: {
          method: 'GET',
          status: 404,
          final_url: 'https://example.com/missing',
        },
      }),
    ]),
  );

  assert.equal(manifest.summary.declared, 3);
  assert.equal(manifest.summary.customer_facing_routed, 1);
  assert.deepEqual(validatePublicSurfaceManifest(manifest, NOW), []);
});

test('serializes deterministic repository-formatted audience arrays', () => {
  const serialized = serializeManifest(registry());
  assert.match(serialized, /"audience": \["INVESTOR", "DEVELOPER"\]/);
  assert.doesNotMatch(serialized, /"audience": \[\n/);
  assert.equal(JSON.parse(serialized).summary.customer_facing_routed, 1);
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
      observation: { method: 'GET', status: 404, final_url: 'https://example.com/surface' },
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
  const invalid = registry([surface(), surface({ id: 'duplicate-surface' })]);
  assert.ok(
    validatePublicSurfaceRegistry(invalid, NOW).some((failure) =>
      failure.includes('canonical_url duplicates'),
    ),
  );
});

test('live verification fails closed on status or redirect drift', async () => {
  const failures = await verifyLivePublicSurfaces(registry(), async () => ({
    status: 503,
    url: 'https://example.com/maintenance',
    body: null,
  }));
  assert.deepEqual(failures, [
    'example-surface: expected HTTP 200, observed 503',
    'example-surface: expected final URL https://example.com/surface, observed https://example.com/maintenance',
  ]);
});
