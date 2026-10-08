import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  evaluateGrypeReport,
  normalizeGrypeReport,
  parseStrictJsonEvidence,
  renderGrypeGateReport,
} from './gate-grype-report.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const REPOSITORY_MANIFEST = JSON.parse(
  readFileSync(path.join(ROOT, 'security', 'vulnerability-mitigations.json'), 'utf8'),
);
const NODE_FORGE = REPOSITORY_MANIFEST.mitigations.find(
  (entry) => entry.advisory === 'GHSA-86w9-cpqp-85rv',
);
const BRACES = REPOSITORY_MANIFEST.mitigations.find(
  (entry) => entry.advisory === 'GHSA-vfj7-8cjw-p6xm',
);
const PATCHED_DEPENDENCIES = {
  'braces@3.0.3': 'patches/braces@3.0.3.patch',
  'node-forge@1.4.0': 'patches/node-forge@1.4.0.patch',
};
const VERIFIED_BEHAVIORS = new Set(
  REPOSITORY_MANIFEST.mitigations.map((entry) => entry.verification),
);
const EVIDENCE_NOW = new Date('2026-10-07T10:00:00.000Z');
const DATABASE_SOURCE = `https://grype.anchore.io/databases/v6/vulnerability-db.tar.zst?checksum=sha256%3A${'a'.repeat(64)}`;

function grypeDescriptor({
  built = '2026-10-06T10:00:00Z',
  timestamp = '2026-10-07T09:59:00Z',
} = {}) {
  return {
    name: 'grype',
    version: '0.118.0',
    configuration: {
      timestamp: true,
      db: {
        'validate-age': true,
        'validate-by-hash-on-start': true,
      },
    },
    db: {
      status: {
        schemaVersion: '6.0.0',
        from: DATABASE_SOURCE,
        built,
        path: '/tmp/grype/db/6/vulnerability.db',
        valid: true,
      },
      providers: {
        github: { captured: '2026-10-06T09:00:00Z', input: 'xxh64:0123456789abcdef' },
      },
    },
    timestamp,
  };
}

function grypeMatch({
  advisories = [],
  id = NODE_FORGE.advisory,
  name = NODE_FORGE.package,
  related = [],
  severity = 'High',
  type = 'npm',
  version = NODE_FORGE.version,
} = {}) {
  return {
    vulnerability: {
      advisories: advisories.map((advisory) => ({ id: advisory, link: '' })),
      fix: { state: 'not-fixed', versions: [] },
      id,
      severity,
    },
    relatedVulnerabilities: related.map((identifier) => ({ id: identifier })),
    matchDetails: [],
    artifact: {
      id: 'package-id',
      locations: [{ path: 'pnpm-lock.yaml' }],
      name,
      type,
      version,
    },
  };
}

function grypeReport(matches = [], overrides = {}) {
  const descriptor = { ...grypeDescriptor(), ...(overrides.descriptor ?? {}) };
  return {
    matches,
    ignoredMatches: [],
    source: { type: 'directory', target: '.' },
    distro: {},
    ...overrides,
    descriptor,
  };
}

function normalizeFixtureReport(report) {
  return normalizeGrypeReport(report, '0.118.0', ROOT, EVIDENCE_NOW);
}

function manifestWithNodeForge(overrides = {}) {
  return {
    schemaVersion: 1,
    mitigations: REPOSITORY_MANIFEST.mitigations.map((entry) =>
      entry.advisory === NODE_FORGE.advisory ? { ...entry, ...overrides } : { ...entry },
    ),
  };
}

function evaluate(report, manifest = REPOSITORY_MANIFEST, options = {}) {
  return evaluateGrypeReport(normalizeFixtureReport(report), manifest, {
    now: new Date('2026-10-06T00:00:00Z'),
    patchedDependencies: PATCHED_DEPENDENCIES,
    root: ROOT,
    verifiedBehaviors: VERIFIED_BEHAVIORS,
    ...options,
  });
}

test('passes complete clean Grype 0.118.0 directory evidence', () => {
  const normalized = normalizeFixtureReport(grypeReport());
  const result = evaluateGrypeReport(normalized, { schemaVersion: 1, mitigations: [] });

  assert.equal(result.passed, true);
  assert.equal(result.rawMatchCount, 0);
  assert.match(result.reason, /no raw High\/Critical findings/);
  assert.equal(normalized.databaseSchemaVersion, '6.0.0');
  assert.equal(normalized.databaseBuilt, '2026-10-06T10:00:00Z');
  assert.equal(normalized.databaseSource, DATABASE_SOURCE);
  assert.equal(normalized.reportTimestamp, '2026-10-07T09:59:00Z');

  const absoluteTarget = normalizeFixtureReport(
    grypeReport([], { source: { type: 'directory', target: ROOT } }),
  );
  assert.equal(absoluteTarget.evidenceErrors.length, 0);
});

test('rejects duplicate keys at root and nested levels before policy evaluation', () => {
  assert.throws(
    () =>
      parseStrictJsonEvidence(
        '{"matches":[{"vulnerability":{"id":"GHSA-block","severity":"Critical","advisories":[]},"relatedVulnerabilities":[],"artifact":{"name":"pkg","version":"1.0.0","type":"npm"}}],"matches":[],"ignoredMatches":[],"descriptor":{"name":"grype","version":"0.118.0"},"source":{"type":"directory","target":"."}}',
        'raw Grype report',
      ),
    /duplicate-key ambiguity/,
  );
  assert.throws(
    () =>
      parseStrictJsonEvidence(
        '{"matches":[],"ignoredMatches":[],"descriptor":{"name":"grype","name":"other","version":"0.118.0"},"source":{"type":"directory","target":"."}}',
        'raw Grype report',
      ),
    /duplicate-key ambiguity/,
  );
  assert.deepEqual(parseStrictJsonEvidence('{"matches":[]}', 'fixture'), { matches: [] });
});

test('retains duplicate raw High findings while admitting an exact verified patch', () => {
  const report = grypeReport([
    grypeMatch(),
    grypeMatch(),
    grypeMatch({ id: 'GHSA-moderate', severity: 'Medium' }),
  ]);
  const normalized = normalizeFixtureReport(report);
  const result = evaluate(report);

  assert.equal(result.passed, true);
  assert.equal(result.rawMatchCount, 3);
  assert.equal(result.counts.high, 2);
  assert.equal(result.counts.medium, 1);
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].occurrences, 2);
  assert.equal(result.findings[0].disposition, 'VERIFIED LOCAL PATCH');

  const rendered = renderGrypeGateReport(normalized, result, new Date('2026-10-06T00:00:00Z'));
  assert.match(rendered, /Raw match count:\*\* 3/);
  assert.match(rendered, /GHSA-86w9-cpqp-85rv/);
  assert.match(rendered, /VERIFIED LOCAL PATCH/);
  assert.match(rendered, /unmodified `grype-results\.json` artifact/);
});

test('verifies all correlated blocking findings in one synthetic evidence set', () => {
  const result = evaluate(
    grypeReport([
      grypeMatch(),
      grypeMatch({
        id: BRACES.advisory,
        name: BRACES.package,
        version: BRACES.version,
      }),
    ]),
  );

  assert.equal(result.passed, true);
  assert.deepEqual(
    result.findings.map((finding) => finding.mitigation.advisory).sort(),
    [BRACES.advisory, NODE_FORGE.advisory].sort(),
  );
});

test('accepts an exact GHSA correlation supplied by Grype for a primary CVE', () => {
  const result = evaluate(
    grypeReport([
      grypeMatch({
        id: 'CVE-2026-0001',
        related: [NODE_FORGE.advisory],
      }),
    ]),
  );

  assert.equal(result.passed, true);
  assert.deepEqual(result.findings[0].identifiers, ['CVE-2026-0001', NODE_FORGE.advisory]);
});

test('executes registered behavior verification inside the admission gate', () => {
  let requested = null;
  const result = evaluate(grypeReport([grypeMatch()]), REPOSITORY_MANIFEST, {
    behaviorRunner(ids) {
      requested = ids;
      return { errors: [], verified: new Set(ids) };
    },
    verifiedBehaviors: undefined,
  });

  assert.deepEqual(requested, [NODE_FORGE.verification]);
  assert.equal(result.passed, true);

  const failedBehavior = evaluate(grypeReport([grypeMatch()]), REPOSITORY_MANIFEST, {
    behaviorRunner: () => ({ errors: ['behavior suite failed'], verified: new Set() }),
    verifiedBehaviors: undefined,
  });
  assert.equal(failedBehavior.passed, false);
  assert.match(failedBehavior.errors.join('\n'), /behavior suite failed/);
  assert.match(failedBehavior.errors.join('\n'), /registered behavior verification did not pass/);
});

test('blocks every unregistered High or Critical finding without hiding it', () => {
  for (const severity of ['High', 'Critical']) {
    const result = evaluate(grypeReport([grypeMatch({ id: `GHSA-new-${severity}`, severity })]), {
      schemaVersion: 1,
      mitigations: [],
    });

    assert.equal(result.passed, false);
    assert.equal(result.blocked.length, 1);
    assert.equal(result.findings[0].disposition, 'BLOCKING');
    assert.match(result.findings[0].reason, /no exact advisory entry/);
  }
});

test('fails closed on ecosystem, package, version, severity, registration, digest, and expiry drift', () => {
  const fixtures = [
    {
      match: grypeMatch({ type: 'python' }),
      manifest: REPOSITORY_MANIFEST,
      pattern: /ecosystem python is not npm/,
    },
    {
      manifest: manifestWithNodeForge({ package: 'other-package' }),
      pattern: /package does not match/,
    },
    {
      manifest: manifestWithNodeForge({ version: '1.4.1' }),
      pattern: /versions do not exactly match/,
    },
    {
      manifest: manifestWithNodeForge({ severity: 'critical' }),
      pattern: /severity does not match/,
    },
    {
      manifest: manifestWithNodeForge({ patch: 'patches/not-registered.patch' }),
      pattern: /patchedDependencies registration does not match/,
    },
    {
      manifest: manifestWithNodeForge({ patchSha256: '0'.repeat(64) }),
      pattern: /SHA-256 mismatch/,
    },
    {
      manifest: manifestWithNodeForge({ expires: '2026-10-05' }),
      pattern: /expired/,
    },
  ];

  for (const fixture of fixtures) {
    const result = evaluate(grypeReport([fixture.match ?? grypeMatch()]), fixture.manifest);
    assert.equal(result.passed, false);
    assert.match(`${result.findings[0].reason}\n${result.errors.join('\n')}`, fixture.pattern);
  }
});

test('accepts the pinned presenter omission of an empty ignoredMatches slice', () => {
  const report = grypeReport([]);
  delete report.ignoredMatches;
  const result = evaluate(report, { schemaVersion: 1, mitigations: [] });
  assert.equal(result.passed, true);
  assert.deepEqual(result.errors, []);
});

test('fails closed on malformed, cross-version, non-directory, or ignored evidence', () => {
  assert.throws(() => normalizeFixtureReport(null), /JSON object/);
  assert.throws(() => normalizeFixtureReport({}), /matches must be an array/);
  assert.throws(
    () => normalizeFixtureReport(grypeReport([], { ignoredMatches: undefined })),
    /ignoredMatches must be an array/,
  );
  for (const ignoredMatches of [null, {}, '', 0, false]) {
    assert.throws(
      () => normalizeFixtureReport(grypeReport([], { ignoredMatches })),
      /ignoredMatches must be an array/,
    );
  }
  assert.throws(
    () => normalizeFixtureReport(grypeReport([], { source: { type: 'directory' } })),
    /source\.target/,
  );
  assert.throws(
    () =>
      normalizeFixtureReport(
        grypeReport([grypeMatch()], {
          matches: [{ vulnerability: {}, artifact: {} }],
        }),
      ),
    /vulnerability\.id/,
  );

  for (const report of [
    grypeReport([], { descriptor: { name: 'grype', version: '0.117.0' } }),
    grypeReport([], { source: { type: 'sbom', target: 'report.json' } }),
    grypeReport([], { source: { type: 'directory', target: '/tmp/empty' } }),
    grypeReport([], { ignoredMatches: [{ reason: 'hidden' }] }),
  ]) {
    const result = evaluate(report, { schemaVersion: 1, mitigations: [] });
    assert.equal(result.passed, false);
    assert.ok(result.errors.length > 0);
  }

  const wrongTarget = evaluate(
    grypeReport([], { source: { type: 'directory', target: '/tmp/empty' } }),
    { schemaVersion: 1, mitigations: [] },
  );
  assert.match(wrongTarget.errors.join('\n'), /does not resolve to repository root/);
});

test('accepts pinned Grype SchemaVer output and rejects incompatible or malformed schemas', () => {
  for (const schemaVersion of ['v6.1.10', '6.1.10', 'v6.0.0', '6.0.0']) {
    const descriptor = grypeDescriptor();
    descriptor.db.status.schemaVersion = schemaVersion;
    assert.equal(
      evaluate(grypeReport([], { descriptor }), { schemaVersion: 1, mitigations: [] }).passed,
      true,
    );
  }
  for (const schemaVersion of [
    'v5.1.10',
    'v7.0.0',
    '6.1',
    'v6.1.-1',
    'v6.1.10-extra',
    'vv6.1.10',
    'v6.01.10',
  ]) {
    const descriptor = grypeDescriptor();
    descriptor.db.status.schemaVersion = schemaVersion;
    const result = evaluate(grypeReport([], { descriptor }), { schemaVersion: 1, mitigations: [] });
    assert.equal(result.passed, false);
    assert.match(result.errors.join('\n'), /not a pinned-scanner v6 schema/);
  }
});

test('fails closed on missing, stale, invalid, or unverified Grype database provenance', () => {
  const staleReport = evaluate(
    grypeReport([], { descriptor: grypeDescriptor({ timestamp: '2026-10-07T08:59:59Z' }) }),
    { schemaVersion: 1, mitigations: [] },
  );
  assert.equal(staleReport.passed, false);
  assert.match(staleReport.errors.join('\n'), /report timestamp is older than 1 hours/);

  const staleDatabase = evaluate(
    grypeReport([], { descriptor: grypeDescriptor({ built: '2026-10-02T09:59:59Z' }) }),
    { schemaVersion: 1, mitigations: [] },
  );
  assert.equal(staleDatabase.passed, false);
  assert.match(staleDatabase.errors.join('\n'), /database build is older than 120 hours/);

  const invalidDatabase = grypeDescriptor();
  invalidDatabase.db.status = {
    ...invalidDatabase.db.status,
    valid: false,
    error: 'checksum mismatch',
  };
  const invalidResult = evaluate(grypeReport([], { descriptor: invalidDatabase }), {
    schemaVersion: 1,
    mitigations: [],
  });
  assert.equal(invalidResult.passed, false);
  assert.match(invalidResult.errors.join('\n'), /status is not valid/);
  assert.match(invalidResult.errors.join('\n'), /checksum mismatch/);

  for (const descriptor of [
    { ...grypeDescriptor(), timestamp: '' },
    { ...grypeDescriptor(), configuration: undefined },
    { ...grypeDescriptor(), db: undefined },
  ]) {
    assert.throws(
      () => normalizeFixtureReport(grypeReport([], { descriptor })),
      /descriptor\.(?:timestamp|configuration|db)/,
    );
  }

  for (const mutate of [
    (descriptor) => {
      descriptor.configuration.timestamp = false;
    },
    (descriptor) => {
      descriptor.configuration.db['validate-age'] = false;
    },
    (descriptor) => {
      descriptor.configuration.db['validate-by-hash-on-start'] = false;
    },
    (descriptor) => {
      descriptor.db.status.schemaVersion = '5.0.0';
    },
    (descriptor) => {
      descriptor.db.status.from = 'http://grype.anchore.io/database.tar.zst';
    },
    (descriptor) => {
      descriptor.db.providers = {};
    },
  ]) {
    const descriptor = grypeDescriptor();
    mutate(descriptor);
    const result = evaluate(grypeReport([], { descriptor }), {
      schemaVersion: 1,
      mitigations: [],
    });
    assert.equal(result.passed, false, JSON.stringify(descriptor));
    assert.ok(result.errors.length > 0);
  }
});

test('blocks ambiguous advisory correlations and duplicate manifest entries', () => {
  const second = { ...NODE_FORGE, advisory: 'GHSA-second' };
  const ambiguous = evaluate(grypeReport([grypeMatch({ advisories: ['GHSA-second'] })]), {
    schemaVersion: 1,
    mitigations: [NODE_FORGE, second],
  });
  assert.equal(ambiguous.passed, false);
  assert.match(ambiguous.findings[0].reason, /multiple mitigation entries/);

  const duplicate = evaluate(grypeReport([grypeMatch()]), {
    schemaVersion: 1,
    mitigations: [NODE_FORGE, { ...NODE_FORGE }],
  });
  assert.equal(duplicate.passed, false);
  assert.match(duplicate.errors.join('\n'), /duplicate vulnerability mitigation/);
});

test('CLI exits nonzero and writes a FAIL report for blocking evidence', () => {
  const temporaryRoot = mkdtempSync(path.join(ROOT, '.grype-gate-cli-'));
  const temporaryQaRoot = path.join(temporaryRoot, 'scripts', 'qa');
  const temporarySecurityRoot = path.join(temporaryRoot, 'security');
  mkdirSync(temporaryQaRoot, { recursive: true });
  mkdirSync(temporarySecurityRoot, { recursive: true });

  try {
    copyFileSync(
      path.join(ROOT, 'scripts', 'package.json'),
      path.join(temporaryRoot, 'scripts', 'package.json'),
    );
    for (const fileName of [
      'gate-grype-report.mjs',
      'generate-vuln-report.js',
      'write-vuln-preflight-report.mjs',
    ]) {
      copyFileSync(
        path.join(ROOT, 'scripts', 'qa', fileName),
        path.join(temporaryQaRoot, fileName),
      );
    }
    writeFileSync(
      path.join(temporaryRoot, 'grype-results.json'),
      `${JSON.stringify(
        grypeReport([grypeMatch({ id: 'GHSA-unregistered-cli' })], {
          descriptor: grypeDescriptor({
            built: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            timestamp: new Date().toISOString(),
          }),
        }),
      )}\n`,
    );
    writeFileSync(
      path.join(temporarySecurityRoot, 'vulnerability-mitigations.json'),
      '{"schemaVersion":1,"mitigations":[]}\n',
    );
    writeFileSync(path.join(temporaryRoot, 'pnpm-workspace.yaml'), 'packages: []\n');

    const result = spawnSync(
      process.execPath,
      [path.join(temporaryQaRoot, 'gate-grype-report.mjs')],
      {
        cwd: temporaryRoot,
        encoding: 'utf8',
        timeout: 10_000,
      },
    );

    assert.equal(result.signal, null, result.stderr);
    assert.equal(result.status, 1, `CLI unexpectedly passed:\n${result.stdout}\n${result.stderr}`);
    assert.match(
      readFileSync(path.join(temporaryRoot, 'grype-gate-report.md'), 'utf8'),
      /\*\*Verdict:\*\* FAIL/,
    );
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
});
