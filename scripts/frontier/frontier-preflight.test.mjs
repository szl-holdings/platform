import assert from 'node:assert/strict';
import test from 'node:test';
import { runFrontierPreflight } from './frontier-preflight.mjs';

const NOW = Date.parse('2026-07-29T16:00:00.000Z');

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function html(body = '<!doctype html><title>fallback</title>') {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function mockFetch(url) {
  if (url.includes('registry.npmjs.org')) return json({ error: 'Not found' }, 404);
  if (url.includes('zenodo.org')) {
    return json({
      links: {
        parent_doi: 'https://doi.org/10.5281/zenodo.19944926',
      },
      metadata: {
        title: 'Ouroboros Thesis v21 / PURIQ-OS',
        doi: '10.5281/zenodo.20490218',
        relations: {
          version: [{ parent: { pid_value: '10.5281/zenodo.19944926' } }],
        },
      },
    });
  }
  if (url.includes('david-leads')) {
    if (url.endsWith('/healthz') || url.endsWith('/readyz')) return json({ status: 'ready' });
    if (url.endsWith('/api/build-info')) return json({ receipt_minted: false });
    return json({ detail: 'Not Found' }, 404);
  }
  if (url.includes('killinchu')) {
    if (url.endsWith('/healthz') || url.endsWith('/readyz')) return json({ status: 'ready' });
    if (url.endsWith('/api/build-info')) {
      return json({
        receipt_minted: false,
        build: { revision: '454cfffbdb367ef6349776660457dc6979d07100' },
      });
    }
    return html();
  }
  throw new Error(`unexpected URL ${url}`);
}

async function mockExecFile(file, args) {
  if (file === 'tpmtool.exe' && args[0] === 'getdeviceinformation') {
    return {
      stdout:
        '-TPM Present: True\n-Ready For Attestation: True\n-Is Capable For Attestation: True\n',
      stderr: '',
    };
  }
  if (file === 'tpmtool.exe' && args[0] === 'comparepcr') {
    return { stdout: 'TCG Log and Hardware PCRs match!\n', stderr: '' };
  }
  throw Object.assign(new Error('not found'), { stdout: '', stderr: '' });
}

test('measures every unresolved frontier without upgrading readiness claims', async () => {
  const report = await runFrontierPreflight({
    fetchImpl: mockFetch,
    env: {},
    platform: 'win32',
    execFileImpl: mockExecFile,
    nowMs: NOW,
  });

  assert.equal(report.schemaVersion, 'szl.frontier-preflight.v1');
  assert.equal(report.checkedAt, '2026-07-29T16:00:00.000Z');
  assert.equal(report.status, 'BLOCKED');
  assert.equal(report.evidenceState, 'MEASURED');
  assert.deepEqual(report.blockers, [
    'npm',
    'doi',
    'verticalConformance',
    'hardware',
    'hostedObservability',
  ]);
  assert.deepEqual(
    report.frontiers.npm.packages.map(({ name, httpStatus, published }) => ({
      name,
      httpStatus,
      published,
    })),
    [
      { name: '@szl/mcp-governor', httpStatus: 404, published: false },
      { name: '@szl/verify', httpStatus: 404, published: false },
    ],
  );
  assert.equal(report.frontiers.doi.status, 'MISMATCH');
  assert.match(report.frontiers.doi.observedTitle, /Ouroboros Thesis/);
  assert.equal(report.frontiers.verticalConformance.verified, 0);
  assert.equal(
    report.frontiers.verticalConformance.surfaces.find(({ surface }) => surface === 'sentra')
      .evidenceState,
    'UNAVAILABLE',
  );
  assert.equal(
    report.frontiers.verticalConformance.surfaces.find(({ surface }) => surface === 'vessels')
      .endpoints['/version'].json,
    false,
  );
  assert.equal(
    report.frontiers.verticalConformance.surfaces.find(({ surface }) => surface === 'insurance')
      .endpoints['/version'].httpStatus,
    404,
  );
  assert.equal(report.frontiers.hardware.localReadinessEvidenceState, 'MEASURED');
  assert.equal(report.frontiers.hardware.tpmPresent, true);
  assert.equal(report.frontiers.hardware.tpmReadyForAttestation, true);
  assert.equal(report.frontiers.hardware.pcrLogMatchesHardware, true);
  assert.equal(report.frontiers.hardware.authorizedAttestationResultObserved, false);
  assert.equal(report.frontiers.hostedObservability.evidenceState, 'UNAVAILABLE');
});

test('reports a published package only when the exact version is present', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('registry.npmjs.org/%40szl%2Fmcp-governor')) {
      return json({
        name: '@szl/mcp-governor',
        versions: { '0.1.0': { name: '@szl/mcp-governor', version: '0.1.0' } },
      });
    }
    if (url.includes('registry.npmjs.org/%40szl%2Fverify')) {
      return json({
        name: '@szl/verify',
        versions: { '0.2.0': { name: '@szl/verify', version: '0.2.0' } },
      });
    }
    return mockFetch(url);
  };
  const report = await runFrontierPreflight({
    fetchImpl,
    env: {},
    platform: 'linux',
    nowMs: NOW,
  });
  assert.equal(report.frontiers.npm.packages[0].published, true);
  assert.equal(report.frontiers.npm.packages[1].published, false);
  assert.equal(report.frontiers.npm.operational, false);
});

test('never returns credential values in the observability report', async () => {
  const secrets = {
    DATADOG_API_KEY: 'datadog-api-secret',
    DATADOG_APP_KEY: 'datadog-app-secret',
    LANGFUSE_PUBLIC_KEY: 'langfuse-public',
    LANGFUSE_SECRET_KEY: 'langfuse-secret',
    ARIZE_API_KEY: 'arize-secret',
  };
  const report = await runFrontierPreflight({
    fetchImpl: mockFetch,
    env: secrets,
    platform: 'linux',
    nowMs: NOW,
  });
  const serialized = JSON.stringify(report);
  for (const secret of Object.values(secrets)) assert.equal(serialized.includes(secret), false);
  assert.equal(report.frontiers.hostedObservability.evidenceState, 'UNVERIFIED');
  assert.equal(
    report.frontiers.hostedObservability.providers.every(
      ({ credentialInputsPresent }) => credentialInputsPresent,
    ),
    true,
  );
});

test('rejects unbounded timeout configuration', async () => {
  await assert.rejects(
    runFrontierPreflight({ fetchImpl: mockFetch, timeoutMs: 60_001 }),
    /timeoutMs must be an integer between 1 and 60000/,
  );
});
