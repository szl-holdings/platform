import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import YAML from 'yaml';

import { serializeManifest } from './generate-public-surfaces.js';
import {
  buildPublicSurfaceManifest,
  type PublicSurface,
  type PublicSurfaceRegistry,
  validatePublicSurfaceManifest,
  validatePublicSurfaceObservationFreshness,
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

function metadataResponse(text: string, contentType: string, chunks: number[] = [text.length]) {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return {
    status: 200,
    url: 'https://a11oy.net/robots.txt',
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    body: {
      cancel: async () => undefined,
      getReader: () => ({
        read: async () => {
          if (offset >= bytes.byteLength) return { done: true };
          const chunkLength = chunks.shift() ?? bytes.byteLength - offset;
          const value = bytes.slice(offset, offset + chunkLength);
          offset += value.byteLength;
          return { done: false, value };
        },
        cancel: async () => undefined,
        releaseLock: () => undefined,
      }),
    },
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

test('counts routed products independently from pages and excludes unavailable products', () => {
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
        mode: 'UNAVAILABLE',
        availability: 'UNAVAILABLE',
        source_owner: {
          repository: 'szl-holdings/killinchu',
          path: 'web/index.html',
          role: 'REMEDIATION_OWNER',
        },
        observation: {
          method: 'GET',
          status: 503,
          final_url: 'https://a-11-oy.com/killinchu',
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

  assert.equal(manifest.summary.customer_facing_routes, 3);
  assert.equal(manifest.summary.customer_facing_products, 1);
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

test('keeps old live-compatible evidence out of the structural PR gate', async () => {
  const stale = registry();
  stale.observed_at = new Date(NOW - 7 * 24 * 60 * 60 * 1000 - 1).toISOString();
  assert.deepEqual(validatePublicSurfaceRegistry(stale, NOW), []);
  assert.deepEqual(
    await verifyLivePublicSurfaces(stale, async () => ({
      status: 200,
      url: 'https://a-11-oy.com/',
    })),
    [],
  );
  assert.deepEqual(validatePublicSurfaceObservationFreshness(stale, NOW), [
    'observed_at is older than seven days',
  ]);
});

test('enforces exact observation age and future-skew boundaries', () => {
  const sevenDaysOld = registry();
  sevenDaysOld.observed_at = new Date(NOW - 7 * 24 * 60 * 60 * 1000).toISOString();
  assert.deepEqual(validatePublicSurfaceObservationFreshness(sevenDaysOld, NOW), []);

  const stale = registry();
  stale.observed_at = new Date(NOW - 7 * 24 * 60 * 60 * 1000 - 1).toISOString();
  assert.deepEqual(validatePublicSurfaceObservationFreshness(stale, NOW), [
    'observed_at is older than seven days',
  ]);

  const fiveMinutesAhead = registry();
  fiveMinutesAhead.observed_at = new Date(NOW + 5 * 60 * 1000).toISOString();
  assert.deepEqual(validatePublicSurfaceRegistry(fiveMinutesAhead, NOW), []);
  assert.deepEqual(validatePublicSurfaceObservationFreshness(fiveMinutesAhead, NOW), []);

  const future = registry();
  future.observed_at = new Date(NOW + 5 * 60 * 1000 + 1).toISOString();
  const futureFailure = ['observed_at is more than five minutes in the future'];
  assert.deepEqual(validatePublicSurfaceRegistry(future, NOW), futureFailure);
  assert.deepEqual(validatePublicSurfaceObservationFreshness(future, NOW), futureFailure);
});

test('wires freshness only to scheduled and explicit manual events', () => {
  const workflow = YAML.parse(readFileSync('.github/workflows/truth-drift.yml', 'utf8')) as {
    on: {
      schedule: Array<{ cron: string }>;
      workflow_dispatch: {
        inputs: { require_surface_freshness: { default: boolean; type: string } };
      };
    };
    jobs: { 'truth-drift': { steps: Array<{ name?: string; if?: string; run?: string }> } };
  };

  assert.deepEqual(workflow.on.schedule, [{ cron: '17 6 * * *' }]);
  assert.deepEqual(workflow.on.workflow_dispatch.inputs.require_surface_freshness, {
    description: 'Require the public surface observation to be no older than seven days',
    required: false,
    default: false,
    type: 'boolean',
  });

  const freshness = workflow.jobs['truth-drift'].steps.find(
    (step) => step.name === 'Require a current public surface observation',
  );
  assert.equal(freshness?.run, 'pnpm surfaces:freshness');
  assert.equal(
    freshness?.if,
    "github.event_name == 'schedule' || " +
      "(github.event_name == 'workflow_dispatch' && inputs.require_surface_freshness)",
  );

  const incremental = workflow.jobs['truth-drift'].steps.find(
    (step) => step.name === 'Reject newly introduced claim drift',
  );
  assert.equal(
    incremental?.if,
    "github.event_name == 'pull_request' || github.event_name == 'push'",
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

test('accepts the measured Killinchu 503 only when declared unavailable', async () => {
  const unavailable = surface({
    id: 'killinchu-public-console',
    name: 'Killinchu public console',
    canonical_url: 'https://a-11-oy.com/killinchu',
    mode: 'UNAVAILABLE',
    availability: 'UNAVAILABLE',
    source_owner: {
      repository: 'szl-holdings/killinchu',
      path: 'web/index.html',
      role: 'REMEDIATION_OWNER',
    },
    observation: {
      method: 'GET',
      status: 503,
      final_url: 'https://a-11-oy.com/killinchu',
    },
  });
  const requests: string[] = [];

  const failures = await verifyLivePublicSurfaces(registry([unavailable]), async (url, init) => {
    requests.push(url);
    assert.equal(init.redirect, 'manual');
    return { status: 503, url, body: null, headers: { get: () => null } };
  });

  assert.deepEqual(failures, []);
  assert.deepEqual(requests, ['https://a-11-oy.com/killinchu']);
});

test('rejects obsolete Killinchu redirect truth before issuing a request', async () => {
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
    return { status: 307, url, body: null, headers: { get: () => null } };
  });

  assert.deepEqual(requests, []);
  assert.deepEqual(failures, [
    'registry: surfaces[0].observation.final_url does not match the approved target for killinchu-public-console',
  ]);
});

test('validates bounded robots metadata content rather than status alone', async () => {
  const robots = surface({
    id: 'a11oy-net-robots-gap',
    name: 'A11oy.net robots metadata',
    kind: 'METADATA',
    audience: ['MACHINE'],
    mode: 'DOCUMENTATION',
    canonical_url: 'https://a11oy.net/robots.txt',
    observation: { method: 'GET', status: 200, final_url: 'https://a11oy.net/robots.txt' },
  });

  const valid = await verifyLivePublicSurfaces(registry([robots]), async () =>
    metadataResponse(
      'User-agent: *\nAllow: /\n\nSitemap: https://a11oy.net/sitemap.xml\n',
      'text/plain; charset=utf-8',
      [5, 7, 11],
    ),
  );
  assert.deepEqual(valid, []);

  const soft404 = await verifyLivePublicSurfaces(registry([robots]), async () =>
    metadataResponse('<!doctype html><html><body>Not found</body></html>', 'text/html'),
  );
  assert.deepEqual(soft404, ['a11oy-net-robots-gap: metadata body is an HTML response']);
});

test('rejects truncated sitemap XML and accepts the canonical entry', async () => {
  const sitemap = surface({
    id: 'a11oy-net-sitemap-gap',
    name: 'A11oy.net sitemap metadata',
    kind: 'METADATA',
    audience: ['MACHINE'],
    mode: 'DOCUMENTATION',
    canonical_url: 'https://a11oy.net/sitemap.xml',
    observation: { method: 'GET', status: 200, final_url: 'https://a11oy.net/sitemap.xml' },
  });
  const validXml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    '<url><loc>https://a11oy.net/</loc></url></urlset>';

  const valid = await verifyLivePublicSurfaces(registry([sitemap]), async () => ({
    ...metadataResponse(validXml, 'application/xml'),
    url: 'https://a11oy.net/sitemap.xml',
  }));
  assert.deepEqual(valid, []);

  const truncated = await verifyLivePublicSurfaces(registry([sitemap]), async () => ({
    ...metadataResponse(validXml.replace('</urlset>', ''), 'application/xml'),
    url: 'https://a11oy.net/sitemap.xml',
  }));
  assert.deepEqual(truncated, ['a11oy-net-sitemap-gap: sitemap metadata is not well-formed XML']);

  const missingNamespace = await verifyLivePublicSurfaces(registry([sitemap]), async () => ({
    ...metadataResponse(
      validXml.replace(' xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"', ''),
      'application/xml',
    ),
    url: 'https://a11oy.net/sitemap.xml',
  }));
  assert.deepEqual(missingNamespace, [
    'a11oy-net-sitemap-gap: sitemap metadata lacks the canonical urlset entry',
  ]);

  const unescapedAmpersand = await verifyLivePublicSurfaces(registry([sitemap]), async () => ({
    ...metadataResponse(
      validXml.replace(
        '</url></urlset>',
        '</url><url><loc>https://a11oy.net/?first=1&second=2</loc></url></urlset>',
      ),
      'application/xml',
    ),
    url: 'https://a11oy.net/sitemap.xml',
  }));
  assert.deepEqual(unescapedAmpersand, [
    'a11oy-net-sitemap-gap: sitemap metadata is not well-formed XML',
  ]);

  const multipleRoots = await verifyLivePublicSurfaces(registry([sitemap]), async () => ({
    ...metadataResponse(`<evil/>${validXml}`, 'application/xml'),
    url: 'https://a11oy.net/sitemap.xml',
  }));
  assert.deepEqual(multipleRoots, [
    'a11oy-net-sitemap-gap: sitemap metadata is not well-formed XML',
  ]);

  const invalidUrlEntry = await verifyLivePublicSurfaces(registry([sitemap]), async () => ({
    ...metadataResponse(
      validXml.replace('</url></urlset>', '</url><url/><url><loc>/relative</loc></url></urlset>'),
      'application/xml',
    ),
    url: 'https://a11oy.net/sitemap.xml',
  }));
  assert.deepEqual(invalidUrlEntry, [
    'a11oy-net-sitemap-gap: sitemap metadata contains an invalid url entry',
  ]);

  const externalEntity = await verifyLivePublicSurfaces(registry([sitemap]), async () => ({
    ...metadataResponse(
      '<!DOCTYPE urlset [<!ENTITY external SYSTEM "file:///etc/passwd">]>' +
        validXml.replace('https://a11oy.net/', '&external;'),
      'application/xml',
    ),
    url: 'https://a11oy.net/sitemap.xml',
  }));
  assert.deepEqual(externalEntity, [
    'a11oy-net-sitemap-gap: sitemap metadata is not well-formed XML',
  ]);
});

test('validates the exact A11oy.net webmanifest contract', async () => {
  const webmanifest = surface({
    id: 'a11oy-net-webmanifest-gap',
    name: 'A11oy.net web app manifest',
    kind: 'METADATA',
    audience: ['MACHINE'],
    mode: 'DOCUMENTATION',
    canonical_url: 'https://a11oy.net/manifest.webmanifest',
    observation: {
      method: 'GET',
      status: 200,
      final_url: 'https://a11oy.net/manifest.webmanifest',
    },
  });
  const canonicalManifest = {
    name: 'A11oy Proof Registry',
    short_name: 'A11oy.net',
    start_url: '/',
    scope: '/',
    display: 'minimal-ui',
  };
  const verify = (body: string, contentType = 'application/manifest+json; charset=utf-8') =>
    verifyLivePublicSurfaces(registry([webmanifest]), async () => ({
      ...metadataResponse(body, contentType),
      url: 'https://a11oy.net/manifest.webmanifest',
    }));

  assert.deepEqual(await verify(JSON.stringify(canonicalManifest)), []);
  assert.deepEqual(await verify('{'), [
    'a11oy-net-webmanifest-gap: manifest metadata is not valid JSON',
  ]);
  assert.deepEqual(await verify('<html>not a manifest</html>', 'text/html'), [
    'a11oy-net-webmanifest-gap: metadata body is an HTML response',
  ]);
  assert.deepEqual(await verify(JSON.stringify(canonicalManifest), 'application/json'), [
    'a11oy-net-webmanifest-gap: expected an application/manifest+json response, observed application/json',
  ]);
  assert.deepEqual(await verify('{}'), [
    'a11oy-net-webmanifest-gap: manifest metadata has an unexpected product identity',
  ]);
  assert.deepEqual(
    await verify(JSON.stringify({ ...canonicalManifest, name: 'Different product' })),
    ['a11oy-net-webmanifest-gap: manifest metadata has an unexpected product identity'],
  );
  assert.deepEqual(
    await verify(JSON.stringify({ ...canonicalManifest, start_url: 'https://evil.example/' })),
    ['a11oy-net-webmanifest-gap: manifest start_url and scope must both equal /'],
  );
  assert.deepEqual(await verify(JSON.stringify({ ...canonicalManifest, scope: '/private/' })), [
    'a11oy-net-webmanifest-gap: manifest start_url and scope must both equal /',
  ]);
  assert.deepEqual(await verify(JSON.stringify({ ...canonicalManifest, display: 'standalone' })), [
    'a11oy-net-webmanifest-gap: manifest display must equal minimal-ui',
  ]);
  assert.deepEqual(await verify('[]'), [
    'a11oy-net-webmanifest-gap: manifest metadata must be a JSON object',
  ]);
});

test('rejects metadata bodies that exceed the bounded read limit', async () => {
  const robots = surface({
    id: 'a11oy-net-robots-gap',
    name: 'A11oy.net robots metadata',
    kind: 'METADATA',
    audience: ['MACHINE'],
    mode: 'DOCUMENTATION',
    canonical_url: 'https://a11oy.net/robots.txt',
    observation: { method: 'GET', status: 200, final_url: 'https://a11oy.net/robots.txt' },
  });
  const tooLarge = 'User-agent: *\n'.padEnd(128 * 1024 + 1, 'x');

  const failures = await verifyLivePublicSurfaces(registry([robots]), async () =>
    metadataResponse(tooLarge, 'text/plain', [64 * 1024, 64 * 1024, 1]),
  );
  assert.deepEqual(failures, ['a11oy-net-robots-gap: metadata body exceeds 131072 bytes']);
});
