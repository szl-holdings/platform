import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeAuditJson,
  parseAuditJson,
  validateAuditJson,
} from './generate-vuln-report.js';

const legacyAudit = {
  advisories: {},
  metadata: {
    totalDependencies: 12,
    vulnerabilities: {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
    },
  },
};

const advisoryMap = {
  1111537: {
    id: 1111537,
    title: 'Example advisory',
    module_name: 'example-package',
    vulnerable_versions: '<1.2.3',
    severity: 'moderate',
    github_advisory_id: 'GHSA-example',
    url: 'https://github.com/advisories/GHSA-example',
  },
};

const npmV7Audit = {
  vulnerabilities: {
    axios: {
      name: 'axios',
      severity: 'high',
      range: '<1.8.2',
      via: ['GHSA-example-high'],
    },
  },
  metadata: {
    vulnerabilities: {
      critical: 0,
      high: 1,
      moderate: 0,
      low: 0,
    },
    totalDependencies: 99,
  },
};

test('parses JSON and preserves caller fallback for empty output', () => {
  assert.deepEqual(parseAuditJson(JSON.stringify({ ok: true })), { ok: true });
  assert.throws(() => parseAuditJson('', 'missing audit output'), /missing audit output/);
  assert.throws(
    () => parseAuditJson('No vulnerabilities found'),
    /Failed to parse pnpm audit JSON/,
  );
});

test('normalizes legacy advisories and metadata', () => {
  assert.doesNotThrow(() => validateAuditJson(legacyAudit));
  const normalized = normalizeAuditJson(legacyAudit);
  assert.equal(normalized.sourceShape, 'legacy-advisories');
  assert.equal(normalized.totalDependencies, 12);
  assert.equal(normalized.vulnerabilities.high, 0);
});

test('normalizes root advisory maps and clean empty output', () => {
  const normalized = normalizeAuditJson(advisoryMap);
  assert.equal(normalized.sourceShape, 'advisory-map');
  assert.equal(normalized.vulnerabilities.moderate, 1);
  assert.equal(normalized.vulnerabilities.high, 0);

  const clean = normalizeAuditJson({});
  assert.equal(clean.sourceShape, 'advisory-map');
  assert.deepEqual(clean.vulnerabilities, {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  });
});

test('normalizes npm v7+ vulnerabilities metadata shape', () => {
  const normalized = normalizeAuditJson(npmV7Audit);
  assert.equal(normalized.sourceShape, 'npm-vulnerabilities');
  assert.equal(normalized.totalDependencies, 99);
  assert.equal(normalized.vulnerabilities.high, 1);
});

test('normalizes advisory arrays', () => {
  const normalized = normalizeAuditJson([
    {
      id: 7,
      severity: 'critical',
      module_name: 'critical-package',
      vulnerable_versions: '<2.0.0',
    },
  ]);
  assert.equal(normalized.sourceShape, 'advisory-list');
  assert.equal(normalized.vulnerabilities.critical, 1);
});

test('rejects structurally unsupported payloads for detailed reporting', () => {
  assert.throws(() => validateAuditJson(null), /object or array/);
  assert.throws(
    () => validateAuditJson({ message: 'registry unavailable' }),
    /unsupported pnpm audit JSON shape/,
  );
  assert.throws(
    () => validateAuditJson({ unexpected: { foo: 'bar' } }),
    /unsupported pnpm audit JSON shape/,
  );
});
