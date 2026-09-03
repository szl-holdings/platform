import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeAuditJson,
  parseAuditJson,
  validateAuditJson,
} from './generate-vuln-report.js';

const validLegacyAudit = {
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

const validCurrentAudit = {
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

test('accepts and normalizes legacy pnpm audit output', () => {
  const parsed = parseAuditJson(JSON.stringify(validLegacyAudit), 'missing audit output');
  assert.doesNotThrow(() => validateAuditJson(parsed));
  const normalized = normalizeAuditJson(parsed);
  assert.equal(normalized.sourceShape, 'legacy-metadata');
  assert.equal(normalized.totalDependencies, 12);
  assert.equal(normalized.vulnerabilities.high, 0);
});

test('accepts current advisory-map output and clean empty object', () => {
  const normalized = normalizeAuditJson(validCurrentAudit);
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

test('rejects empty and non-JSON audit output', () => {
  assert.throws(() => parseAuditJson('', 'missing audit output'), /missing audit output/);
  assert.throws(
    () => parseAuditJson('No vulnerabilities found', 'missing audit output'),
    /Failed to parse pnpm audit JSON/,
  );
});

test('rejects malformed legacy metadata and registry error payloads', () => {
  assert.throws(
    () =>
      validateAuditJson({
        advisories: {},
        metadata: { ...validLegacyAudit.metadata, vulnerabilities: {} },
      }),
    /invalid critical count/,
  );
  assert.throws(
    () => validateAuditJson({ metadata: validLegacyAudit.metadata }),
    /missing advisory details/,
  );
  assert.throws(
    () => validateAuditJson({ message: 'registry unavailable' }),
    /error payload/,
  );
  assert.throws(
    () => validateAuditJson({ unexpected: { foo: 'bar' } }),
    /unsupported advisory-map shape/,
  );
});
