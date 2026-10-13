import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
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

test('workflow retains scanner failure and publishes only metadata', () => {
  const workflow = readFileSync(
    new URL('../../.github/workflows/security.yml', import.meta.url),
    'utf8',
  );
  const section = workflow.split('  secret-scan:')[1].split('  lockfile-integrity:')[0];
  assert.match(section, /--redact --exit-code 1/);
  assert.match(section, /scan_args\+=\(--log-opts "\$PR_BASE_SHA\.\.\$PR_HEAD_SHA"\)/);
  assert.match(section, /scan_args\+=\(--log-opts "\$candidate_base\.\.HEAD"\)/);
  assert.match(section, /gitleaks "\$\{scan_args\[@\]\}" \|\| scan_status=\$\?/);
  assert.match(section, /exit "\$scan_status"/);
  assert.match(section, /path: \$\{\{ runner\.temp \}\}\/gitleaks-findings-metadata\.json/);
  assert.doesNotMatch(section, /path:.*gitleaks-redacted\.json/);
});
