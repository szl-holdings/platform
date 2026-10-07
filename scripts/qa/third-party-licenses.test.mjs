import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildReport,
  classifyLicense,
  evaluateLicensePolicy,
  inventoryEntries,
  parseStrictJson,
  scanStore,
  validateLicensePolicy,
} from './generate-license-report.js';
import { writeLicensePreflightFailureReport } from './write-license-preflight-report.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

const UPSTREAM_LICENSES = Object.freeze({
  'patches/licenses/braces-3.0.3.LICENSE':
    '35bdd8a44339719441900fb50fbefc5e2dca1ca662cbaed7a687de842c8b70f2',
  'patches/licenses/node-forge-1.4.0.LICENSE':
    'f63ff0e4e239244aa79280da2dd4811a0469e5e201caf5cbc0d97c3a1dff8e82',
  'patches/licenses/storybook-8.6.18.LICENSE':
    'bc90586179d44dcb313a9a289d687a2f26226303b2066bd21dbefd2378e894e5',
  'security/schemas/cyclonedx/LICENSE':
    '6c29f22a4a7385285c6f579ec9f33c5e989f00739d6b257243a0b082ec9447ae',
});

test('vendored third-party license texts retain byte-exact upstream bytes', () => {
  for (const [relativePath, expected] of Object.entries(UPSTREAM_LICENSES)) {
    const contents = readFileSync(path.join(ROOT, relativePath));
    assert.equal(
      createHash('sha256').update(contents).digest('hex'),
      expected,
      `${relativePath} must remain the exact upstream license`,
    );
  }
});

function reviewedPolicy(overrides = {}) {
  return {
    schemaVersion: 1,
    reviews: [
      {
        package: 'reviewed-package',
        version: '1.2.3',
        license: 'MPL-2.0',
        classification: 'REVIEW',
        decision: 'allow',
        rationale: 'Exact package and license review retained for this bounded test fixture.',
        reviewedAt: '2026-10-01',
        expires: '2026-10-31',
        ...overrides,
      },
    ],
  };
}

test('license classification fails closed on blank, malformed, unknown, and restrictive input', () => {
  for (const license of [
    '',
    '   ',
    ' MIT',
    'MIT ',
    '()',
    'MIT OR',
    'MIT OR OR Apache-2.0',
    'MIT Apache-2.0',
    'MIT WITH LLVM-exception',
    'UNKNOWN',
    'LicenseRef-Proprietary',
  ]) {
    assert.equal(classifyLicense(license), 'CHECK', `${JSON.stringify(license)} must block`);
  }
  for (const license of ['MPL-2.0', 'LGPL-3.0-or-later', 'EUPL-1.2', '(MIT OR GPL-3.0-or-later)']) {
    assert.equal(classifyLicense(license), 'REVIEW', `${license} must require exact review`);
  }
  for (const license of [
    'MIT',
    'Apache-2.0',
    '(MIT)',
    '(MIT OR Apache-2.0)',
    'BSD-3-Clause AND MIT',
    'Public Domain',
  ]) {
    assert.equal(classifyLicense(license), 'OK', `${license} should be allowlisted`);
  }
});

test('license policy admits only an exact, unexpired reviewed identity', () => {
  const entry = {
    name: 'reviewed-package',
    version: '1.2.3',
    license: 'MPL-2.0',
    flag: 'REVIEW',
  };
  const now = new Date('2026-10-07T12:00:00.000Z');
  const admitted = evaluateLicensePolicy([entry], 0, reviewedPolicy(), { now });
  assert.equal(admitted.passed, true);
  assert.equal(admitted.admitted.size, 1);

  for (const overrides of [
    { package: 'another-package' },
    { version: '1.2.4' },
    { license: 'GPL-3.0', classification: 'REVIEW' },
    { classification: 'CHECK' },
    { expires: '2026-10-06' },
  ]) {
    if (overrides.classification === 'CHECK') {
      assert.throws(
        () => evaluateLicensePolicy([entry], 0, reviewedPolicy(overrides), { now }),
        /classification does not match/,
      );
      continue;
    }
    const evaluation = evaluateLicensePolicy([entry], 0, reviewedPolicy(overrides), { now });
    assert.equal(evaluation.passed, false, JSON.stringify(overrides));
    assert.equal(evaluation.admitted.size, 0);
  }
});

test('license policy blocks parse failures and rejects malformed inventory or policy evidence', () => {
  const entry = {
    name: 'reviewed-package',
    version: '1.2.3',
    license: 'MPL-2.0',
    flag: 'REVIEW',
  };
  const now = new Date('2026-10-07T12:00:00.000Z');
  const parseFailure = evaluateLicensePolicy([entry], 1, reviewedPolicy(), { now });
  assert.equal(parseFailure.passed, false);
  assert.match(parseFailure.violations[0], /could not be parsed/);

  assert.throws(
    () => evaluateLicensePolicy([{ ...entry, flag: 'OK' }], 0, reviewedPolicy(), { now }),
    /flag does not match/,
  );
  assert.throws(
    () => evaluateLicensePolicy([entry, entry], 0, reviewedPolicy(), { now }),
    /duplicates package\/version/,
  );
  assert.throws(
    () => validateLicensePolicy(reviewedPolicy({ package: 'bad\u0000name' }), { now }),
    /control characters/,
  );
  assert.throws(
    () => parseStrictJson('{"schemaVersion":1,"reviews":[],"reviews":[]}'),
    /duplicate-key ambiguity/,
  );
  assert.throws(() => parseStrictJson('{not-json'), /not valid JSON/);
});

test('pnpm-store manifest parse and traversal failures cannot disappear from the gate', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'a11oy-license-store-'));
  const store = path.join(root, 'node_modules', '.pnpm');
  try {
    const validManifest = path.join(store, 'valid-package@1.0.0', 'node_modules', 'valid-package');
    const invalidManifest = path.join(
      store,
      'invalid-package@1.0.0',
      'node_modules',
      'invalid-package',
    );
    const missingManifest = path.join(
      store,
      'missing-package@1.0.0',
      'node_modules',
      'missing-package',
    );
    const missingScopedManifest = path.join(
      store,
      '@scope+missing@1.0.0',
      'node_modules',
      '@scope',
      'missing',
    );
    const ambiguousManifest = path.join(
      store,
      'ambiguous-package@1.0.0',
      'node_modules',
      'ambiguous-package',
    );
    mkdirSync(validManifest, { recursive: true });
    mkdirSync(invalidManifest, { recursive: true });
    mkdirSync(missingManifest, { recursive: true });
    mkdirSync(missingScopedManifest, { recursive: true });
    mkdirSync(ambiguousManifest, { recursive: true });
    writeFileSync(
      path.join(validManifest, 'package.json'),
      `${JSON.stringify({ name: 'valid-package', version: '1.0.0', license: 'MIT' })}\n`,
    );
    writeFileSync(path.join(invalidManifest, 'package.json'), '{not-json\n');
    writeFileSync(
      path.join(ambiguousManifest, 'package.json'),
      '{"name":"ambiguous-package","version":"1.0.0","license":"GPL-3.0-only","license":"MIT"}\n',
    );
    writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n');

    const inventory = scanStore({ root });
    assert.equal(inventory.packages.size, 1);
    assert.equal(inventory.parseErrors, 4);
    const evaluation = evaluateLicensePolicy(
      inventoryEntries(inventory.packages),
      inventory.parseErrors,
      { schemaVersion: 1, reviews: [] },
      { now: new Date('2026-10-07T12:00:00.000Z') },
    );
    assert.equal(evaluation.passed, false);
    assert.match(evaluation.violations[0], /4 installed package manifest\(s\) could not be parsed/);

    writeFileSync(path.join(store, 'unexpected-entry'), 'not a package directory\n');
    assert.throws(() => scanStore({ root }), /Unexpected non-directory entry/);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('license failure report is explicit and never renders a blocking entry as admitted', () => {
  const entry = {
    name: 'unknown-package',
    version: '9.9.9',
    license: 'UNKNOWN',
    flag: 'CHECK',
  };
  const evaluation = evaluateLicensePolicy(
    [entry],
    0,
    { schemaVersion: 1, reviews: [] },
    { now: new Date('2026-10-07T12:00:00.000Z') },
  );
  const report = buildReport([entry], 0, evaluation, new Date('2026-10-07T12:34:56.000Z'));
  assert.match(report, /\*\*Verdict:\*\* FAIL/);
  assert.match(report, /unknown-package@9\.9\.9 .* has no exact reviewed policy entry/);
  assert.match(report, /\| `unknown-package` \| 9\.9\.9 \| UNKNOWN \| BLOCKING \|/);
  assert.doesNotMatch(report, /REVIEWED ALLOW/);
});

test('license preflight replaces stale evidence with a run-specific FAIL artifact', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'a11oy-license-preflight-'));
  const output = path.join(root, 'security', 'license-report.md');
  try {
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, 'stale PASS\n');
    writeLicensePreflightFailureReport(output, new Date('2026-10-07T12:34:56.000Z'));
    const report = readFileSync(output, 'utf8');
    assert.match(report, /\*\*Generated:\*\* 2026-10-07T12:34:56\.000Z/);
    assert.match(report, /\*\*Verdict:\*\* FAIL/);
    assert.doesNotMatch(report, /stale PASS/);
    assert.deepEqual(readdirSync(path.dirname(output)), ['license-report.md']);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
