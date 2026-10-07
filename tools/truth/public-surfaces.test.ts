import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import YAML from 'yaml';

import { serializeManifest } from './generate-public-surfaces.js';
import {
  buildPublicSurfaceManifest,
  type PublicSurface,
  type PublicSurfaceRegistry,
  parseDuplicateFreeJson,
  validatePublicSurfaceManifest,
  validatePublicSurfaceObservationFreshness,
  validatePublicSurfaceRegistry,
  verifyLivePublicSurfaces,
} from './public-surfaces.js';

const NOW = Date.parse('2026-08-01T15:20:00Z');
const CONFIGURED_REGISTRY = JSON.parse(
  readFileSync('config/public-surfaces.json', 'utf8'),
) as PublicSurfaceRegistry;

type Deferred<T> = Readonly<{
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
}>;

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
}

function configuredDirectWebSurfaces(count: number): PublicSurface[] {
  const surfaces = CONFIGURED_REGISTRY.surfaces
    .filter(
      (candidate) =>
        candidate.kind === 'WEB' && candidate.canonical_url === candidate.observation.final_url,
    )
    .slice(0, count);
  assert.equal(surfaces.length, count, `expected ${count} configured direct WEB surfaces`);
  return surfaces;
}

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

function apiResponse(
  url: string,
  payload: unknown,
  contentType = 'application/json; charset=utf-8',
  chunks?: number[],
) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const bytes = new TextEncoder().encode(text);
  const chunkSizes = chunks ? [...chunks] : [bytes.byteLength];
  let offset = 0;
  return {
    status: 200,
    url,
    headers: {
      get: (name: string) => {
        const normalized = name.toLowerCase();
        if (normalized === 'content-type') return contentType;
        if (normalized === 'content-length') return String(bytes.byteLength);
        return null;
      },
    },
    body: {
      cancel: async () => undefined,
      getReader: () => ({
        read: async () => {
          if (offset >= bytes.byteLength) return { done: true };
          const chunkLength = chunkSizes.shift() ?? bytes.byteLength - offset;
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

function webResponse(url: string, body: string, contentType = 'text/html; charset=utf-8') {
  return apiResponse(url, body, contentType);
}

const CHAT_BOUNDARY_META =
  '<meta name="szl-evidence-boundary" content="szl.public-surface-boundary/v1;surface=a11oy-net-chat;execution=UNAVAILABLE">';
const CODE_BOUNDARY_META =
  '<meta name="szl-evidence-boundary" content="szl.public-surface-boundary/v1;surface=a11oy-net-code;execution=UNAVAILABLE">';
const KILLINCHU_BOUNDARY_META =
  '<meta name="szl-evidence-boundary" content="szl.public-surface-boundary/v1;surface=killinchu-console;effectors=SIMULATED;authorization=UNAVAILABLE">';
const COMMAND_BOUNDARY_META =
  '<meta name="szl-evidence-boundary" content="szl.public-surface-boundary/v1;surface=a11oy-command;origin=MODELED;energy=UNAVAILABLE;signer=UNAVAILABLE">';

const CHAT_GATEWAY_HTML =
  '<!doctype html><html><head><title>A11oy Chat Gateway | Governed Product Console</title>' +
  '<link rel="canonical" href="https://a11oy.net/chat/">' +
  `${CHAT_BOUNDARY_META}</head>` +
  '<body>This gateway does not execute a prompt.</body></html>';
const CODE_GATEWAY_HTML =
  '<!doctype html><html><head><title>A11oy Code Gateway | Governed Run-Loop</title>' +
  '<link rel="canonical" href="https://a11oy.net/code/">' +
  `${CODE_BOUNDARY_META}</head>` +
  '<body>this page does not execute code</body></html>';
const KILLINCHU_CONSOLE_HTML =
  '<!doctype html><html><head><title>a11oy · Killinchu</title>' +
  '<link rel="canonical" href="https://a-11-oy.com/killinchu">' +
  `${KILLINCHU_BOUNDARY_META}</head>` +
  '<body>Effectors stay SIMULATED. Awaiting observed state; no runtime claim made.</body></html>';
const COMMAND_CENTER_HTML =
  '<!doctype html><html><head><title>a11oy Command Center</title>' +
  '<link rel="canonical" href="https://a-11-oy.com/command">' +
  `${COMMAND_BOUNDARY_META}</head>` +
  '<body>Product origin a-11-oy.com · Proof a11oy.net · Energy UNAVAILABLE in this browser. · ' +
  'Signer UNSIGNED-honest · No secret values · This surface is MODELED on static origin until ' +
  'the Space runtime signs a write.</body></html>';

const KILLINCHU_BUILD_INFO_BODY = {
  status: 'OBSERVED',
  service: 'killinchu',
  build: {
    state: 'OBSERVED',
    revision: '13477c429f5742cdc718a6294a80d00c7e8dc634',
    revision_source: 'env:SZL_GIT_SHA',
  },
  receipt_minted: true,
  receipt_minted_on_request: false,
  receipt_minted_scope: 'DEPLOYMENT_RELEASE_REFERENCE',
  release_receipt: {
    state: 'GITHUB_OIDC_ATTESTED',
    source_revision: '13477c429f5742cdc718a6294a80d00c7e8dc634',
    subject: 'hf-deploy-manifest.json',
    subject_sha256: '915abaa7f910fc6822468df1d747318676962de4876222641c5231884a30f32c',
    attestation_id: '53547813',
    attestation_url: 'https://github.com/szl-holdings/killinchu/attestations/53547813',
    verification:
      'Download hf-deploy-manifest.json from the matching deployment run and run gh attestation verify hf-deploy-manifest.json -R szl-holdings/killinchu',
  },
};

const KILLINCHU_READINESS_BODY = {
  status: 'ready',
  organ: 'killinchu',
  doctrine: 'v11',
  ledger: {
    schema: 'szl.killinchu.ledger-readiness/v1',
    durability_state: 'EPHEMERAL',
    requested_mode: 'EPHEMERAL',
    ready: true,
    production_ready: false,
    production_readiness_basis: 'NOT_APPLICABLE',
    readiness_probe: 'READ_ONLY',
    persistence_scope: 'PROCESS_MEMORY',
    startup_state: 'READY',
    adapter_configured: false,
    adapter_state: 'NOT_APPLICABLE',
    integrity: { state: 'VERIFIED', verified: true, nodes: 0, root: null },
    replay: { state: 'NOT_APPLICABLE', nodes: 0 },
    recovery: { attempts: 0, retry_after_s: 0 },
    reason: 'ephemeral ledger is available for this process only',
  },
  ledger_role: 'CANONICAL_RECEIPT_LEDGER',
  backend_store_diagnostics: {
    ledger_role: 'BACKEND_HARDENING_DIAGNOSTIC_STORE',
    backend: 'sqlite',
    depth: 0,
    chain_ok: true,
    first_break_seq: -1,
    provider_persistence: 'UNKNOWN',
    production_ready: false,
  },
  receipt_minted: false,
};

function configuredSurface(id: string): PublicSurface {
  const candidate = CONFIGURED_REGISTRY.surfaces.find((surface) => surface.id === id);
  assert.ok(candidate, `missing configured surface ${id}`);
  return candidate;
}

function reachableWebContractSurface(id: string): PublicSurface {
  const candidate = configuredSurface(id);
  assert.equal(candidate.kind, 'WEB');
  return {
    ...candidate,
    mode: 'MIXED',
    availability: 'REACHABLE',
    observation: {
      ...candidate.observation,
      status: 200,
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

test('binds the configured public-surface summary to the reviewed registry', () => {
  const manifest = buildPublicSurfaceManifest(CONFIGURED_REGISTRY);
  assert.deepEqual(manifest.summary, {
    declared: 29,
    customer_facing_products: 1,
    customer_facing_routes: 15,
    by_availability: {
      REACHABLE: 20,
      REDIRECTED: 2,
      UNAVAILABLE: 7,
    },
    by_mode: {
      LIVE: 5,
      MIXED: 10,
      DOCUMENTATION: 7,
      UNAVAILABLE: 7,
    },
  });
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
        id: 'legacy-lyte-route',
        name: 'Historical Lyte route',
        canonical_url: 'https://a-11-oy.com/lyte/',
        mode: 'UNAVAILABLE',
        availability: 'UNAVAILABLE',
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
    jobs: {
      'truth-drift': { steps: Array<{ name?: string; if?: string; run?: string }> };
      'refresh-truth': {
        concurrency: { group: string; 'cancel-in-progress': boolean };
        steps: Array<{
          name?: string;
          if?: string;
          run?: string;
          with?: Record<string, unknown>;
        }>;
      };
    };
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

  assert.deepEqual(workflow.jobs['refresh-truth'].concurrency, {
    group: 'truth-evidence-refresh-${{ github.repository }}',
    'cancel-in-progress': false,
  });

  const refreshSteps = workflow.jobs['refresh-truth'].steps;
  const checkout = refreshSteps.find((step) => step.name === 'Check out exact protected source');
  assert.equal(checkout?.with?.ref, '${{ github.sha }}');

  const source = refreshSteps.find(
    (step) => step.name === 'Bind generation to exact current protected main',
  );
  assert.match(source?.run ?? '', /GITHUB_REF.*refs\/heads\/main/);
  assert.match(source?.run ?? '', /git rev-parse HEAD/);
  assert.match(source?.run ?? '', /git\/ref\/heads\/main/);

  const due = refreshSteps.find(
    (step) => step.name === 'Determine whether evidence refresh is due',
  );
  assert.match(due?.run ?? '', /generated > now/);
  assert.match(due?.run ?? '', /future-dated/);

  const packageBinding = refreshSteps.find(
    (step) => step.name === 'Bind package to unchanged protected main',
  );
  assert.match(packageBinding?.run ?? '', /current_main.*SOURCE_SHA/);
  assert.match(packageBinding?.run ?? '', /sha256sum artifacts\/SOURCE_OF_TRUTH\.json/);

  const workItem = refreshSteps.find(
    (step) => step.name === 'Open or update the protected refresh work item',
  );
  assert.match(workItem?.run ?? '', /package SHA-256/);
  assert.match(workItem?.run ?? '', /- source revision: \\`\$\{SOURCE_SHA\}\\`/);
  assert.ok(
    (workItem?.run ?? '').includes('- generated path: \\`artifacts/SOURCE_OF_TRUTH.json\\`'),
  );
  assert.match(workItem?.run ?? '', /- package SHA-256: \\`\$\{PACKAGE_SHA256\}\\`/);
  assert.ok((workItem?.run ?? '').includes('with \\`GITHUB_TOKEN\\`'));
  assert.match(workItem?.run ?? '', /number_output="\$\(/);
  assert.match(workItem?.run ?? '', /mapfile -t numbers/);
  assert.match(workItem?.run ?? '', /Multiple open protected refresh work items/);
  assert.doesNotMatch(workItem?.run ?? '', /mapfile -t numbers < <\(gh/);
  assert.doesNotMatch(workItem?.run ?? '', /head -n1/);
});

test('runs truth contracts inside the required Runtime Audit context', () => {
  const workflow = YAML.parse(readFileSync('.github/workflows/audit-full.yml', 'utf8')) as {
    jobs: {
      audit: {
        name: string;
        steps: Array<{
          name?: string;
          run?: string;
          if?: string;
          'continue-on-error'?: boolean;
        }>;
      };
    };
  };

  assert.equal(workflow.jobs.audit.name, 'Runtime Audit (audit:full)');
  const validation = workflow.jobs.audit.steps.find(
    (step) => step.name === 'Validate claims and public-surface contracts',
  );
  assert.equal(validation?.run, 'pnpm claims:validate');
  assert.equal(validation?.if, undefined);
  assert.equal(validation?.['continue-on-error'], undefined);
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

test('caps live verification at four complete surface transactions', async () => {
  const surfaces = configuredDirectWebSurfaces(8);
  const expectedByUrl = new Map(surfaces.map((candidate) => [candidate.canonical_url, candidate]));
  const release = deferred<void>();
  const atLimit = deferred<void>();
  const started: string[] = [];
  let active = 0;
  let maxActive = 0;

  const verification = verifyLivePublicSurfaces(registry(surfaces), async (url) => {
    const expected = expectedByUrl.get(url);
    assert.ok(expected, `unexpected URL ${url}`);
    started.push(url);
    active += 1;
    maxActive = Math.max(maxActive, active);
    if (active === 4) atLimit.resolve();
    await release.promise;
    active -= 1;
    return {
      status: expected.observation.status,
      url: expected.observation.final_url,
      body: null,
    };
  });

  await atLimit.promise;
  assert.equal(started.length, 4);
  assert.equal(maxActive, 4);
  release.resolve();

  assert.deepEqual(await verification, []);
  assert.equal(started.length, surfaces.length);
  assert.equal(new Set(started).size, surfaces.length);
  assert.equal(maxActive, 4);
});

test('holds one worker slot across an approved redirect transaction', async () => {
  const unavailable = surface({
    id: 'a11oy-net-chat-gap',
    name: 'A11oy.net chat gateway',
    canonical_url: 'https://a11oy.net/chat',
    mode: 'UNAVAILABLE',
    availability: 'UNAVAILABLE',
    source_owner: {
      repository: 'szl-holdings/a11oy-net',
      path: 'chat/index.html',
      role: 'REMEDIATION_OWNER',
    },
    observation: {
      method: 'GET',
      status: 503,
      final_url: 'https://a11oy.net/chat/',
    },
  });
  const direct = configuredDirectWebSurfaces(4);
  const [firstDirect, , , fourthDirect] = direct;
  assert.ok(firstDirect);
  assert.ok(fourthDirect);
  const surfaces = [unavailable, ...direct];
  const expectedByUrl = new Map(
    surfaces.flatMap((candidate) => [
      [candidate.canonical_url, candidate] as const,
      [candidate.observation.final_url, candidate] as const,
    ]),
  );
  const gates = new Map(
    [unavailable.observation.final_url, ...direct.map((candidate) => candidate.canonical_url)].map(
      (url) => [url, deferred<void>()] as const,
    ),
  );
  const atLimit = deferred<void>();
  const fifthStarted = deferred<void>();
  const requests: string[] = [];
  let active = 0;
  let maxActive = 0;

  const verification = verifyLivePublicSurfaces(registry(surfaces), async (url, init) => {
    requests.push(url);
    assert.equal(init.redirect, 'manual');
    if (url === unavailable.canonical_url) {
      return {
        status: 307,
        url,
        body: null,
        headers: {
          get: (name: string) => (name === 'location' ? unavailable.observation.final_url : null),
        },
      };
    }

    const expected = expectedByUrl.get(url);
    const gate = gates.get(url);
    assert.ok(expected, `unexpected URL ${url}`);
    assert.ok(gate, `missing gate for ${url}`);
    active += 1;
    maxActive = Math.max(maxActive, active);
    if (active === 4) atLimit.resolve();
    if (url === fourthDirect.canonical_url) fifthStarted.resolve();
    await gate.promise;
    active -= 1;
    return {
      status: expected.observation.status,
      url: expected.observation.final_url,
      body: null,
      headers: { get: () => null },
    };
  });

  await atLimit.promise;
  assert.equal(requests.filter((url) => url === unavailable.canonical_url).length, 1);
  assert.equal(requests.filter((url) => url === unavailable.observation.final_url).length, 1);
  for (const candidate of direct.slice(0, 3)) {
    assert.equal(requests.filter((url) => url === candidate.canonical_url).length, 1);
  }
  assert.equal(requests.includes(fourthDirect.canonical_url), false);

  const firstDirectGate = gates.get(firstDirect.canonical_url);
  assert.ok(firstDirectGate);
  firstDirectGate.resolve();
  await fifthStarted.promise;
  assert.equal(active, 4);
  for (const gate of gates.values()) gate.resolve();

  assert.deepEqual(await verification, []);
  assert.equal(requests.filter((url) => url === unavailable.canonical_url).length, 1);
  assert.equal(requests.filter((url) => url === unavailable.observation.final_url).length, 1);
  assert.equal(maxActive, 4);
});

test('aggregates every live failure in stable order under reverse completion', async () => {
  const surfaces = configuredDirectWebSurfaces(6);
  const [firstSurface, secondSurface] = surfaces;
  assert.ok(firstSurface);
  assert.ok(secondSurface);
  const expectedByUrl = new Map(surfaces.map((candidate) => [candidate.canonical_url, candidate]));
  const gates = new Map(surfaces.map((candidate) => [candidate.canonical_url, deferred<void>()]));
  const started: string[] = [];
  const startWaiters: Array<() => void> = [];
  let active = 0;
  let maxActive = 0;

  const waitForStarted = async (count: number): Promise<void> => {
    while (started.length < count) {
      await new Promise<void>((resolve) => startWaiters.push(resolve));
    }
  };

  const verification = verifyLivePublicSurfaces(registry(surfaces), async (url) => {
    const expected = expectedByUrl.get(url);
    const gate = gates.get(url);
    assert.ok(expected, `unexpected URL ${url}`);
    assert.ok(gate, `missing gate for ${url}`);
    const index = surfaces.indexOf(expected);
    started.push(url);
    active += 1;
    maxActive = Math.max(maxActive, active);
    while (startWaiters.length > 0) {
      const waiter = startWaiters.shift();
      assert.ok(waiter);
      waiter();
    }
    await gate.promise;
    active -= 1;
    if (index === 0) throw new Error('certificate rejected');
    if (index === 1) throw new RangeError('invalid response');
    return {
      status: expected.observation.status + 1,
      url: new URL(`/unexpected-${index}`, expected.canonical_url).toString(),
      body: null,
    };
  });

  await waitForStarted(4);
  const fourthStarted = started[3];
  assert.ok(fourthStarted);
  const fourthGate = gates.get(fourthStarted);
  assert.ok(fourthGate);
  fourthGate.resolve();
  await waitForStarted(5);
  const thirdStarted = started[2];
  assert.ok(thirdStarted);
  const thirdGate = gates.get(thirdStarted);
  assert.ok(thirdGate);
  thirdGate.resolve();
  await waitForStarted(6);
  for (const url of [...started].reverse()) {
    const gate = gates.get(url);
    assert.ok(gate);
    gate.resolve();
  }

  const expectedFailures = [
    `${firstSurface.id}: live probe failed: Error: certificate rejected`,
    `${secondSurface.id}: live probe failed: RangeError: invalid response`,
    ...surfaces.slice(2).flatMap((candidate, offset) => {
      const index = offset + 2;
      return [
        `${candidate.id}: expected HTTP ${candidate.observation.status}, observed ${candidate.observation.status + 1}`,
        `${candidate.id}: expected final URL ${candidate.observation.final_url}, observed ${new URL(`/unexpected-${index}`, candidate.canonical_url).toString()}`,
      ];
    }),
  ].sort();

  assert.deepEqual(await verification, expectedFailures);
  assert.equal(started.length, surfaces.length);
  assert.equal(maxActive, 4);
});

test('retries only transient requests within the bound and then fails closed', async () => {
  const [candidate] = configuredDirectWebSurfaces(1);
  assert.ok(candidate);

  let successfulCalls = 0;
  const successful = await verifyLivePublicSurfaces(registry([candidate]), async (url) => {
    successfulCalls += 1;
    return {
      status: candidate.observation.status,
      url,
      body: null,
    };
  });
  assert.deepEqual(successful, []);
  assert.equal(successfulCalls, 1);

  let recoveredCalls = 0;
  const recovered = await verifyLivePublicSurfaces(registry([candidate]), async (url) => {
    recoveredCalls += 1;
    if (recoveredCalls < 3) throw new TypeError('fetch failed');
    return {
      status: candidate.observation.status,
      url,
      body: null,
    };
  });
  assert.deepEqual(recovered, []);
  assert.equal(recoveredCalls, 3);

  let exhaustedCalls = 0;
  const exhausted = await verifyLivePublicSurfaces(registry([candidate]), async () => {
    exhaustedCalls += 1;
    throw new DOMException('timed out', 'TimeoutError');
  });
  assert.equal(exhaustedCalls, 3);
  assert.deepEqual(exhausted, [`${candidate.id}: live probe failed: TimeoutError: timed out`]);

  let permanentCalls = 0;
  const permanent = await verifyLivePublicSurfaces(registry([candidate]), async () => {
    permanentCalls += 1;
    throw new Error('certificate rejected');
  });
  assert.equal(permanentCalls, 1);
  assert.deepEqual(permanent, [`${candidate.id}: live probe failed: Error: certificate rejected`]);
});

test('retries direct and nested transient codes but not unknown transport codes', async () => {
  const [candidate] = configuredDirectWebSurfaces(1);
  assert.ok(candidate);
  const transientErrors = [
    Object.assign(new Error('connection reset'), { code: 'econnreset' }),
    Object.assign(new Error('wrapped transport failure'), {
      cause: Object.assign(new Error('dns retry'), { code: 'EAI_AGAIN' }),
    }),
    Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('undici connect timeout'), {
        code: 'UND_ERR_CONNECT_TIMEOUT',
      }),
    }),
    Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('undici socket reset'), {
        code: 'UND_ERR_SOCKET',
      }),
    }),
  ];

  for (const transientError of transientErrors) {
    let calls = 0;
    const failures = await verifyLivePublicSurfaces(registry([candidate]), async (url) => {
      calls += 1;
      if (calls === 1) throw transientError;
      return { status: candidate.observation.status, url, body: null };
    });
    assert.deepEqual(failures, []);
    assert.equal(calls, 2);
  }

  let unknownCalls = 0;
  const unknownError = Object.assign(new Error('permanent transport failure'), {
    code: 'EHOSTDOWN',
  });
  const unknown = await verifyLivePublicSurfaces(registry([candidate]), async () => {
    unknownCalls += 1;
    throw unknownError;
  });
  assert.equal(unknownCalls, 1);
  assert.deepEqual(unknown, [
    `${candidate.id}: live probe failed: Error: permanent transport failure`,
  ]);

  let permanentWrappedCalls = 0;
  const permanentWrappedError = Object.assign(new TypeError('fetch failed'), {
    cause: Object.assign(new Error('certificate expired'), { code: 'CERT_HAS_EXPIRED' }),
  });
  const permanentWrapped = await verifyLivePublicSurfaces(registry([candidate]), async () => {
    permanentWrappedCalls += 1;
    throw permanentWrappedError;
  });
  assert.equal(permanentWrappedCalls, 1);
  assert.deepEqual(permanentWrapped, [
    `${candidate.id}: live probe failed: TypeError: fetch failed`,
  ]);
});

test('retries transient metadata body failures with a fresh request signal', async () => {
  const metadata = surface({
    id: 'a11oy-net-robots-gap',
    name: 'A11oy.net robots metadata',
    kind: 'METADATA',
    audience: ['MACHINE'],
    mode: 'DOCUMENTATION',
    canonical_url: 'https://a11oy.net/robots.txt',
    observation: {
      method: 'GET',
      status: 200,
      final_url: 'https://a11oy.net/robots.txt',
    },
  });
  const signals: AbortSignal[] = [];
  let attempts = 0;
  let cancelled = 0;

  const failures = await verifyLivePublicSurfaces(registry([metadata]), async (_url, init) => {
    attempts += 1;
    signals.push(init.signal);
    if (attempts === 1) {
      return {
        status: 200,
        url: metadata.canonical_url,
        headers: { get: () => 'text/plain; charset=utf-8' },
        body: {
          cancel: async () => {
            cancelled += 1;
          },
          getReader: () => ({
            read: async () => {
              throw Object.assign(new TypeError('fetch failed'), {
                cause: Object.assign(new Error('peer reset during body read'), {
                  code: 'UND_ERR_SOCKET',
                }),
              });
            },
            cancel: async () => undefined,
            releaseLock: () => undefined,
          }),
        },
      };
    }
    return metadataResponse(
      'User-agent: *\nAllow: /\n\nSitemap: https://a11oy.net/sitemap.xml\n',
      'text/plain; charset=utf-8',
    );
  });

  assert.deepEqual(failures, []);
  assert.equal(attempts, 2);
  assert.equal(cancelled, 1);
  assert.equal(new Set(signals).size, 2);
});

test('validates the exact Killinchu build-info source-binding body', async () => {
  const candidate = configuredSurface('killinchu-build-info-api');
  const verify = (payload: unknown, contentType?: string) =>
    verifyLivePublicSurfaces(registry([candidate]), async (url) =>
      apiResponse(url, payload, contentType),
    );

  assert.deepEqual(await verify(KILLINCHU_BUILD_INFO_BODY), []);

  const missingAttestation = structuredClone(KILLINCHU_BUILD_INFO_BODY) as Record<string, unknown>;
  delete (missingAttestation.release_receipt as Record<string, unknown>).attestation_id;
  const mismatchedSource = structuredClone(KILLINCHU_BUILD_INFO_BODY);
  mismatchedSource.build.revision = '0'.repeat(40);
  const unexpectedField = { ...KILLINCHU_BUILD_INFO_BODY, aggregate_health: 'green' };
  const unrelatedBody = { status: 'OBSERVED' };
  const contractFailure = [
    'killinchu-build-info-api: API body does not match the exact source-binding contract',
  ];

  for (const invalid of [missingAttestation, mismatchedSource, unexpectedField, unrelatedBody]) {
    assert.deepEqual(await verify(invalid), contractFailure);
  }
  assert.deepEqual(await verify('{"status":', 'application/json'), [
    'killinchu-build-info-api: API body is not valid duplicate-free JSON',
  ]);
  assert.deepEqual(await verify(KILLINCHU_BUILD_INFO_BODY, 'text/html'), [
    'killinchu-build-info-api: expected a JSON API response, observed text/html',
  ]);
});

test('validates the exact Killinchu readiness body without freezing dynamic depth', async () => {
  const candidate = configuredSurface('killinchu-readiness-api');
  const verify = (payload: unknown) =>
    verifyLivePublicSurfaces(registry([candidate]), async (url) => apiResponse(url, payload));

  assert.deepEqual(await verify(KILLINCHU_READINESS_BODY), []);
  const dynamicDepth = structuredClone(KILLINCHU_READINESS_BODY);
  dynamicDepth.backend_store_diagnostics.depth = 7;
  dynamicDepth.ledger.integrity.nodes = 1;
  dynamicDepth.ledger.integrity.root = 'a'.repeat(64) as never;
  dynamicDepth.ledger.replay.nodes = 1;
  assert.deepEqual(await verify(dynamicDepth), []);

  const missingDoctrine = { ...KILLINCHU_READINESS_BODY } as Record<string, unknown>;
  delete missingDoctrine.doctrine;
  const unverifiedIntegrity = structuredClone(KILLINCHU_READINESS_BODY);
  unverifiedIntegrity.ledger.integrity.verified = false;
  const durableOverclaim = structuredClone(KILLINCHU_READINESS_BODY);
  durableOverclaim.ledger.production_ready = true;
  const invalidBackend = structuredClone(KILLINCHU_READINESS_BODY);
  invalidBackend.backend_store_diagnostics.chain_ok = false;
  const negativeDepth = structuredClone(KILLINCHU_READINESS_BODY);
  negativeDepth.backend_store_diagnostics.depth = -1;
  const unexpectedLedgerField = structuredClone(KILLINCHU_READINESS_BODY) as unknown as {
    ledger: Record<string, unknown>;
  };
  unexpectedLedgerField.ledger.certified = true;
  const contractFailure = [
    'killinchu-readiness-api: API body does not match the exact readiness contract',
  ];
  for (const invalid of [
    missingDoctrine,
    { ...KILLINCHU_READINESS_BODY, unexpected: true },
    unverifiedIntegrity,
    durableOverclaim,
    invalidBackend,
    negativeDepth,
    unexpectedLedgerField,
    { ...KILLINCHU_READINESS_BODY, doctrine: ['v', String(10)].join('') },
  ]) {
    assert.deepEqual(await verify(invalid), contractFailure);
  }
});

test('retries transient Killinchu API body failures inside the request boundary', async () => {
  const candidate = configuredSurface('killinchu-build-info-api');
  const signals: AbortSignal[] = [];
  let attempts = 0;
  let cancelled = 0;

  const failures = await verifyLivePublicSurfaces(registry([candidate]), async (url, init) => {
    attempts += 1;
    signals.push(init.signal);
    if (attempts === 1) {
      return {
        status: 200,
        url,
        headers: { get: () => 'application/json' },
        body: {
          cancel: async () => {
            cancelled += 1;
          },
          getReader: () => ({
            read: async () => {
              throw Object.assign(new TypeError('fetch failed'), {
                cause: Object.assign(new Error('peer reset during API body read'), {
                  code: 'UND_ERR_SOCKET',
                }),
              });
            },
            cancel: async () => undefined,
            releaseLock: () => undefined,
          }),
        },
      };
    }
    return apiResponse(url, KILLINCHU_BUILD_INFO_BODY);
  });

  assert.deepEqual(failures, []);
  assert.equal(attempts, 2);
  assert.equal(cancelled, 1);
  assert.equal(new Set(signals).size, 2);
});

test('rejects duplicate, trailing, and over-depth JSON before API contract validation', async () => {
  assert.equal(parseDuplicateFreeJson('{"source_revision":"a","source_revision":"b"}').ok, false);
  assert.equal(
    parseDuplicateFreeJson('{"source_revision":"a","source\\u005frevision":"b"}').ok,
    false,
  );
  assert.equal(
    parseDuplicateFreeJson('{"release":{"attestation_id":"1","attestation_id":"2"}}').ok,
    false,
  );
  assert.equal(parseDuplicateFreeJson('{"status":"ready"} trailing').ok, false);
  assert.equal(parseDuplicateFreeJson(`${'['.repeat(66)}null${']'.repeat(66)}`).ok, false);

  const candidate = configuredSurface('killinchu-build-info-api');
  const duplicateBody = JSON.stringify(KILLINCHU_BUILD_INFO_BODY).replace(
    '"source_revision":"13477c429f5742cdc718a6294a80d00c7e8dc634"',
    '"source_revision":"13477c429f5742cdc718a6294a80d00c7e8dc634","source\\u005frevision":"13477c429f5742cdc718a6294a80d00c7e8dc634"',
  );
  const failures = await verifyLivePublicSurfaces(registry([candidate]), async (url) =>
    apiResponse(url, duplicateBody),
  );
  assert.deepEqual(failures, [
    'killinchu-build-info-api: API body is not valid duplicate-free JSON',
  ]);
});

test('rejects Killinchu API bodies above the bounded read limit', async () => {
  const candidate = configuredSurface('killinchu-build-info-api');
  const failures = await verifyLivePublicSurfaces(registry([candidate]), async (url) =>
    apiResponse(url, 'x'.repeat(128 * 1024 + 1)),
  );
  assert.deepEqual(failures, ['killinchu-build-info-api: API body exceeds 131072 bytes']);
});

test('creates a fresh timeout signal for every transient attempt', async () => {
  const [candidate] = configuredDirectWebSurfaces(1);
  assert.ok(candidate);
  const signals: AbortSignal[] = [];
  const timeoutDurations: number[] = [];
  const originalTimeoutDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'timeout');
  assert.ok(originalTimeoutDescriptor);
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  let calls = 0;

  Object.defineProperty(AbortSignal, 'timeout', {
    configurable: true,
    writable: true,
    value: (milliseconds: number): AbortSignal => {
      timeoutDurations.push(milliseconds);
      return originalTimeout(milliseconds);
    },
  });

  let failures: string[];
  try {
    failures = await verifyLivePublicSurfaces(registry([candidate]), async (url, init) => {
      calls += 1;
      signals.push(init.signal);
      if (calls < 3) throw new TypeError('fetch failed');
      return { status: candidate.observation.status, url, body: null };
    });
  } finally {
    Object.defineProperty(AbortSignal, 'timeout', originalTimeoutDescriptor);
  }

  assert.deepEqual(failures, []);
  assert.equal(calls, 3);
  assert.equal(signals.length, 3);
  assert.equal(new Set(signals).size, 3);
  assert.deepEqual(timeoutDurations, [15_000, 15_000, 15_000]);
  assert.ok(signals.every((signal) => signal instanceof AbortSignal));
});

test('retries a transient approved redirect final hop while retaining one worker slot', {
  timeout: 5_000,
}, async () => {
  const unavailable = surface({
    id: 'a11oy-net-chat-gap',
    name: 'A11oy.net chat gateway',
    canonical_url: 'https://a11oy.net/chat',
    mode: 'UNAVAILABLE',
    availability: 'UNAVAILABLE',
    source_owner: {
      repository: 'szl-holdings/a11oy-net',
      path: 'chat/index.html',
      role: 'REMEDIATION_OWNER',
    },
    observation: {
      method: 'GET',
      status: 503,
      final_url: 'https://a11oy.net/chat/',
    },
  });
  const direct = configuredDirectWebSurfaces(4);
  const [firstDirect, , , fourthDirect] = direct;
  assert.ok(firstDirect);
  assert.ok(fourthDirect);
  const surfaces = [unavailable, ...direct];
  const directByUrl = new Map(direct.map((candidate) => [candidate.canonical_url, candidate]));
  const directGates = new Map(
    direct.map((candidate) => [candidate.canonical_url, deferred<void>()] as const),
  );
  const redirectFinalGate = deferred<void>();
  const redirectRetryStarted = deferred<void>();
  const fourthStarted = deferred<void>();
  const requests: string[] = [];
  let redirectFinalAttempts = 0;

  const verification = verifyLivePublicSurfaces(registry(surfaces), async (url) => {
    requests.push(url);
    if (url === unavailable.canonical_url) {
      return {
        status: 307,
        url,
        body: null,
        headers: {
          get: (name: string) => (name === 'location' ? unavailable.observation.final_url : null),
        },
      };
    }
    if (url === unavailable.observation.final_url) {
      redirectFinalAttempts += 1;
      if (redirectFinalAttempts === 1) {
        throw Object.assign(new Error('connection reset'), { code: 'ECONNRESET' });
      }
      redirectRetryStarted.resolve();
      await redirectFinalGate.promise;
      return { status: 503, url, body: null };
    }

    const expected = directByUrl.get(url);
    const gate = directGates.get(url);
    assert.ok(expected, `unexpected URL ${url}`);
    assert.ok(gate, `missing gate for ${url}`);
    if (url === fourthDirect.canonical_url) fourthStarted.resolve();
    await gate.promise;
    return { status: expected.observation.status, url, body: null };
  });

  await redirectRetryStarted.promise;
  assert.equal(redirectFinalAttempts, 2);
  assert.equal(requests.includes(fourthDirect.canonical_url), false);
  assert.equal(
    direct.slice(0, 3).every((candidate) => requests.includes(candidate.canonical_url)),
    true,
  );

  const firstDirectGate = directGates.get(firstDirect.canonical_url);
  assert.ok(firstDirectGate);
  firstDirectGate.resolve();
  await fourthStarted.promise;
  redirectFinalGate.resolve();
  for (const gate of directGates.values()) gate.resolve();

  assert.deepEqual(await verification, []);
  assert.equal(requests.filter((url) => url === unavailable.observation.final_url).length, 2);
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

test('accepts approved A11oy.net redirects and validates owner-backed final pages', async () => {
  const cases = [
    [configuredSurface('a11oy-net-chat-gap'), CHAT_GATEWAY_HTML],
    [configuredSurface('a11oy-net-code-gap'), CODE_GATEWAY_HTML],
  ] as const;

  for (const [redirected, finalBody] of cases) {
    const requests: string[] = [];
    const failures = await verifyLivePublicSurfaces(registry([redirected]), async (url, init) => {
      requests.push(url);
      assert.equal(init.redirect, 'manual');
      if (url === redirected.canonical_url) {
        return {
          status: 301,
          url,
          body: null,
          headers: {
            get: (name: string) =>
              name.toLowerCase() === 'location' ? redirected.observation.final_url : null,
          },
        };
      }
      return webResponse(url, finalBody);
    });

    assert.deepEqual(failures, []);
    assert.deepEqual(requests, [redirected.canonical_url, redirected.observation.final_url]);
  }
});

test('validates owner-backed direct A11oy page bodies', async () => {
  const cases = [
    [reachableWebContractSurface('killinchu-public-console'), KILLINCHU_CONSOLE_HTML],
    [reachableWebContractSurface('legacy-command-route'), COMMAND_CENTER_HTML],
  ] as const;

  for (const [candidate, body] of cases) {
    const failures = await verifyLivePublicSurfaces(registry([candidate]), async (url) =>
      webResponse(url, body),
    );
    assert.deepEqual(failures, []);
  }
});

test('accepts an explicit unavailable approved gateway redirect with a 503 final', async () => {
  const unavailable = surface({
    id: 'a11oy-net-chat-gap',
    name: 'A11oy.net chat gateway',
    canonical_url: 'https://a11oy.net/chat',
    mode: 'UNAVAILABLE',
    availability: 'UNAVAILABLE',
    source_owner: {
      repository: 'szl-holdings/a11oy-net',
      path: 'chat/index.html',
      role: 'REMEDIATION_OWNER',
    },
    observation: {
      method: 'GET',
      status: 503,
      final_url: 'https://a11oy.net/chat/',
    },
  });
  const requests: string[] = [];

  const failures = await verifyLivePublicSurfaces(registry([unavailable]), async (url, init) => {
    requests.push(url);
    assert.equal(init.redirect, 'manual');
    if (url === unavailable.canonical_url) {
      return {
        status: 301,
        url,
        body: null,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === 'location' ? unavailable.observation.final_url : null,
        },
      };
    }
    return { status: 503, url, body: null, headers: { get: () => null } };
  });

  assert.deepEqual(failures, []);
  assert.deepEqual(requests, [unavailable.canonical_url, unavailable.observation.final_url]);
});

test('rejects an unapproved A11oy.net gateway redirect target', async () => {
  const redirected = configuredSurface('a11oy-net-chat-gap');
  const requests: string[] = [];

  const failures = await verifyLivePublicSurfaces(registry([redirected]), async (url) => {
    requests.push(url);
    return {
      status: 301,
      url,
      body: null,
      headers: { get: () => 'https://example.com/unapproved' },
    };
  });

  assert.deepEqual(requests, [redirected.canonical_url]);
  assert.deepEqual(failures, [
    'a11oy-net-chat-gap: expected redirect to https://a11oy.net/chat/, observed https://example.com/unapproved',
  ]);
});

test('rejects identity, canonical, boundary, and content-type drift on owner-backed WEB pages', async () => {
  const candidate = reachableWebContractSurface('killinchu-public-console');
  const verify = (body: string, contentType = 'text/html; charset=utf-8') =>
    verifyLivePublicSurfaces(registry([candidate]), async (url) =>
      webResponse(url, body, contentType),
    );

  assert.deepEqual(await verify(KILLINCHU_CONSOLE_HTML.replace('a11oy · Killinchu', 'Other')), [
    'killinchu-public-console: WEB body has an unexpected product identity',
  ]);
  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace('</title>', '</title><title>a11oy · Killinchu</title>'),
    ),
    ['killinchu-public-console: WEB body has an unexpected product identity'],
  );
  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace(
        'https://a-11-oy.com/killinchu',
        'https://example.com/unapproved',
      ),
    ),
    ['killinchu-public-console: WEB body has an unexpected canonical URL'],
  );
  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace(
        '</head>',
        '<link rel="canonical" href="https://a-11-oy.com/killinchu"></head>',
      ),
    ),
    ['killinchu-public-console: WEB body has an unexpected canonical URL'],
  );
  assert.deepEqual(
    await verify(KILLINCHU_CONSOLE_HTML.replace('effectors=SIMULATED', 'effectors=DECLARED')),
    ['killinchu-public-console: WEB head lacks its exact evidence-boundary declaration'],
  );
  assert.deepEqual(await verify(KILLINCHU_CONSOLE_HTML.replace(KILLINCHU_BOUNDARY_META, '')), [
    'killinchu-public-console: WEB head lacks its exact evidence-boundary declaration',
  ]);
  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace(
        KILLINCHU_BOUNDARY_META,
        `${KILLINCHU_BOUNDARY_META}${KILLINCHU_BOUNDARY_META}`,
      ),
    ),
    ['killinchu-public-console: WEB head lacks its exact evidence-boundary declaration'],
  );
  assert.deepEqual(await verify(KILLINCHU_CONSOLE_HTML, 'application/json'), [
    'killinchu-public-console: expected a text/html response, observed application/json',
  ]);
});

test('rejects owner-backed WEB evidence that exists only inside HTML comments', async () => {
  const candidate = reachableWebContractSurface('killinchu-public-console');
  const verify = (body: string) =>
    verifyLivePublicSurfaces(registry([candidate]), async (url) => webResponse(url, body));

  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace(
        '<title>a11oy · Killinchu</title>',
        '<!-- <title>a11oy · Killinchu</title> -->',
      ),
    ),
    ['killinchu-public-console: WEB body has an unexpected product identity'],
  );
  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace(
        '<link rel="canonical" href="https://a-11-oy.com/killinchu">',
        '<!-- <link rel="canonical" href="https://a-11-oy.com/killinchu"> -->',
      ),
    ),
    ['killinchu-public-console: WEB body has an unexpected canonical URL'],
  );
  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace(
        KILLINCHU_BOUNDARY_META,
        `<!-- ${KILLINCHU_BOUNDARY_META} -->`,
      ),
    ),
    ['killinchu-public-console: WEB head lacks its exact evidence-boundary declaration'],
  );
  assert.deepEqual(
    await verify(KILLINCHU_CONSOLE_HTML.replace('</body>', '<!-- unterminated</body>')),
    ['killinchu-public-console: WEB body is not structurally valid HTML'],
  );
});

test('does not infer the evidence declaration from presentation-dependent body content', async () => {
  const candidate = reachableWebContractSurface('killinchu-public-console');
  const verify = (body: string) =>
    verifyLivePublicSurfaces(registry([candidate]), async (url) => webResponse(url, body));
  const titleTag = '<title>a11oy · Killinchu</title>';
  const canonicalTag = '<link rel="canonical" href="https://a-11-oy.com/killinchu">';

  for (const [openTag, closeTag] of [
    ['<script type="application/json">', '</script>'],
    ['<template>', '</template>'],
  ]) {
    assert.deepEqual(
      await verify(
        KILLINCHU_CONSOLE_HTML.replace(
          titleTag,
          `<title>Compromised</title>${openTag}${titleTag}${closeTag}`,
        ),
      ),
      ['killinchu-public-console: WEB body has an unexpected product identity'],
    );
    assert.deepEqual(
      await verify(
        KILLINCHU_CONSOLE_HTML.replace(canonicalTag, `${openTag}${canonicalTag}${closeTag}`),
      ),
      ['killinchu-public-console: WEB body has an unexpected canonical URL'],
    );
  }

  for (const [openTag, closeTag] of [
    ['<script type="application/json">', '</script>'],
    ['<style>', '</style>'],
    ['<template>', '</template>'],
    ['<noscript>', '</noscript>'],
    ['<textarea>', '</textarea>'],
    ['<xmp>', '</xmp>'],
    ['<iframe>', '</iframe>'],
    ['<noembed>', '</noembed>'],
    ['<noframes>', '</noframes>'],
    ['<svg><text>', '</text></svg>'],
  ]) {
    assert.deepEqual(
      await verify(
        KILLINCHU_CONSOLE_HTML.replace(
          'Effectors stay SIMULATED.',
          `${openTag}Effectors stay SIMULATED.${closeTag}`,
        ),
      ),
      [],
    );
  }

  for (const [openTag, closeTag] of [
    ['<span hidden>', '</span>'],
    ['<span aria-hidden="true">', '</span>'],
    ['<span style="display: none !important">', '</span>'],
    ['<span style="visibility: hidden">', '</span>'],
    ['<span style="content-visibility: hidden">', '</span>'],
  ]) {
    assert.deepEqual(
      await verify(
        KILLINCHU_CONSOLE_HTML.replace(
          'Effectors stay SIMULATED.',
          `${openTag}Effectors stay SIMULATED.${closeTag}`,
        ),
      ),
      [],
    );
  }

  for (const hiddenMarker of [
    '<style>.conceal-evidence{display:none}</style><span class="conceal-evidence">Effectors stay SIMULATED.</span>',
    '<span style="display:/**/none">Effectors stay SIMULATED.</span>',
    '<span style="--concealed:none;display:var(--concealed)">Effectors stay SIMULATED.</span>',
    '<span style="opacity:0">Effectors stay SIMULATED.</span>',
    '<span style="position:absolute;left:-9999px">Effectors stay SIMULATED.</span>',
    '<span style="font-size:0">Effectors stay SIMULATED.</span>',
    '<span style="color:transparent">Effectors stay SIMULATED.</span>',
  ]) {
    assert.deepEqual(
      await verify(KILLINCHU_CONSOLE_HTML.replace('Effectors stay SIMULATED.', hiddenMarker)),
      [],
    );
  }

  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace(
        'Effectors stay SIMULATED.',
        '<style>.conceal-evidence{display:none}</style>' +
          '<span class="conceal-evidence">Effectors stay </span>' +
          '<span class="conceal-evidence">SIMULATED.</span>',
      ),
    ),
    [],
  );

  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace(
        '</head>',
        '<link rel="stylesheet" href="/assets/conceal-all-evidence.css"></head>',
      ).replace('<body>', '<body style="display:none">'),
    ),
    [],
  );

  assert.deepEqual(
    await verify(
      KILLINCHU_CONSOLE_HTML.replace(
        KILLINCHU_BOUNDARY_META,
        '<meta name="evidence" content="Effectors stay SIMULATED.">',
      ),
    ),
    ['killinchu-public-console: WEB head lacks its exact evidence-boundary declaration'],
  );
});

test('does not treat command body presentation as evidence authority', async () => {
  const candidate = reachableWebContractSurface('legacy-command-route');
  const verify = (body: string) =>
    verifyLivePublicSurfaces(registry([candidate]), async (url) => webResponse(url, body));

  for (const [openTag, closeTag] of [
    ['<script type="application/json">', '</script>'],
    ['<template>', '</template>'],
  ]) {
    assert.deepEqual(
      await verify(
        COMMAND_CENTER_HTML.replace('<body>', `<body>${openTag}`).replace(
          '</body>',
          `${closeTag}</body>`,
        ),
      ),
      [],
    );
  }
});

test('cancels the redirect response body when Location is malformed', async () => {
  const redirected = configuredSurface('a11oy-net-chat-gap');
  let calls = 0;
  let cancellations = 0;

  const failures = await verifyLivePublicSurfaces(registry([redirected]), async (url) => {
    calls += 1;
    return {
      status: 301,
      url,
      body: {
        cancel: async () => {
          cancellations += 1;
        },
      },
      headers: { get: () => 'http://[malformed' },
    };
  });

  assert.equal(calls, 1);
  assert.equal(cancellations, 1);
  assert.equal(failures.length, 1);
  assert.match(failures[0] ?? '', /^a11oy-net-chat-gap: live probe failed: TypeError:/);
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
    name: 'a11oy Proof Registry',
    short_name: 'a11oy.net',
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
    'a11oy-net-webmanifest-gap: manifest metadata is not valid duplicate-free JSON',
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
    await verify(
      JSON.stringify({
        ...canonicalManifest,
        name: 'A11oy Proof Registry',
        short_name: 'A11oy.net',
      }),
    ),
    ['a11oy-net-webmanifest-gap: manifest metadata has an unexpected product identity'],
  );
  assert.deepEqual(
    await verify(
      JSON.stringify(canonicalManifest).replace(
        '"name":"a11oy Proof Registry"',
        '"name":"Different product","name":"a11oy Proof Registry"',
      ),
    ),
    ['a11oy-net-webmanifest-gap: manifest metadata is not valid duplicate-free JSON'],
  );
  assert.deepEqual(
    await verify(
      JSON.stringify(canonicalManifest).replace(
        '"short_name":"a11oy.net"',
        '"short_name":"Different","short\\u005fname":"a11oy.net"',
      ),
    ),
    ['a11oy-net-webmanifest-gap: manifest metadata is not valid duplicate-free JSON'],
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
