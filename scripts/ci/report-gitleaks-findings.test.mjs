import assert from 'node:assert/strict';
import test from 'node:test';
import { annotations, safeFindings } from './report-gitleaks-findings.mjs';

test('retains only rule, file, and line without sensitive scanner fields', () => {
  const findings = safeFindings([
    {
      RuleID: 'generic-api-key',
      File: 'fixture.txt',
      StartLine: 7,
      Secret: 'sensitive-value',
      Match: 'sensitive-match',
      Commit: 'abc',
      Author: 'private-person',
    },
  ]);
  assert.deepEqual(findings, [{ rule: 'generic-api-key', file: 'fixture.txt', line: 7 }]);
  assert.equal(
    annotations(findings),
    '::error title=Gitleaks finding::generic-api-key: fixture.txt:7',
  );
});

test('escapes workflow command injection in metadata', () => {
  const output = annotations([
    { rule: 'rule%\r\n::warning::injected', file: 'file\nname', line: 2 },
  ]);
  assert.equal(output.split('\n').length, 1);
  assert.match(output, /rule%25%0D%0A/);
  assert.match(output, /file%0Aname:2/);
});

test('rejects malformed metadata without interpreting scanner values', () => {
  for (const report of [
    {},
    [null],
    [{ RuleID: 'a', File: 'b', StartLine: 0 }],
    [{ RuleID: 'a', File: 'b', StartLine: '1' }],
  ]) {
    assert.throws(() => safeFindings(report));
  }
  assert.deepEqual(safeFindings([]), []);
});
