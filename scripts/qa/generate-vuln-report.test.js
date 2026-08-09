import assert from 'node:assert/strict';
import test from 'node:test';

import { parseAuditJson, validateAuditJson } from './generate-vuln-report.js';

const validAudit = {
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

test('accepts a complete pnpm audit response', () => {
  const parsed = parseAuditJson(JSON.stringify(validAudit), 'missing audit output');
  assert.doesNotThrow(() => validateAuditJson(parsed));
});

test('rejects empty and non-JSON audit output', () => {
  assert.throws(() => parseAuditJson('', 'missing audit output'), /missing audit output/);
  assert.throws(
    () => parseAuditJson('No vulnerabilities found', 'missing audit output'),
    /Failed to parse pnpm audit JSON/,
  );
});

test('rejects partial or malformed audit metadata', () => {
  assert.throws(() => validateAuditJson({}), /missing metadata/);
  assert.throws(
    () =>
      validateAuditJson({
        advisories: {},
        metadata: { ...validAudit.metadata, vulnerabilities: {} },
      }),
    /invalid critical count/,
  );
  assert.throws(
    () => validateAuditJson({ metadata: validAudit.metadata }),
    /missing advisory details/,
  );
  assert.throws(
    () =>
      validateAuditJson({
        ...validAudit,
        metadata: { ...validAudit.metadata, totalDependencies: -1 },
      }),
    /invalid dependency count/,
  );
});

test('rejects malformed advisory records', () => {
  for (const malformed of [null, 'GHSA-example', 7, [], ['high']]) {
    assert.throws(
      () => validateAuditJson({ ...validAudit, advisories: { malformed } }),
      /advisory malformed must be an object/,
    );
  }
});

test('requires an exact supported severity on every advisory', () => {
  for (const severity of [undefined, null, 7, 'HIGH', 'unknown', ' high ']) {
    const advisory = severity === undefined ? {} : { severity };
    assert.throws(
      () => validateAuditJson({ ...validAudit, advisories: { 'GHSA-example': advisory } }),
      /advisory GHSA-example has an invalid severity/,
    );
  }

  for (const severity of ['critical', 'high', 'moderate', 'low']) {
    assert.doesNotThrow(() =>
      validateAuditJson({
        ...validAudit,
        advisories: { 'GHSA-example': { severity } },
      }),
    );
  }
});
