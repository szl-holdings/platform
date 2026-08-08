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
});
