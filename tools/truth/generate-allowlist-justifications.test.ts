import assert from 'node:assert/strict';
import test from 'node:test';

import { type Entry, validateAllowlistCoverage } from './generate-allowlist-justifications.js';

const entries: Entry[] = [
  {
    file: '.gitleaks.toml',
    pattern: 'global.paths: fixture',
    reason: 'test fixture',
  },
  {
    file: 'scripts/qa/scan-secrets.js',
    pattern: 'SKIP_FILES: generated.json',
    reason: 'generated output',
  },
];

const completeDocument = `
| File | Pattern/Line | Why false positive | Verified by | Date |
|---|---|---|---|---|
| .gitleaks.toml | \`global.paths: fixture\` | test | review | 2026-07-26 |
| scripts/qa/scan-secrets.js | \`SKIP_FILES: generated.json\` | test | review | 2026-07-26 |
`;

test('accepts exact active-suppression coverage', () => {
  assert.deepEqual(validateAllowlistCoverage(entries, completeDocument), []);
});

test('rejects a missing active-suppression justification', () => {
  const document = completeDocument.replace(
    '| .gitleaks.toml | `global.paths: fixture` | test | review | 2026-07-26 |\n',
    '',
  );
  assert.ok(
    validateAllowlistCoverage(entries, document).some((failure) =>
      failure.includes('missing justification: .gitleaks.toml: global.paths: fixture'),
    ),
  );
});

test('rejects a stale justification', () => {
  const document = `${completeDocument}| .gitleaks.toml | \`global.paths: removed\` | test | review | 2026-07-26 |\n`;
  assert.ok(
    validateAllowlistCoverage(entries, document).some((failure) =>
      failure.includes('stale justification: .gitleaks.toml: global.paths: removed'),
    ),
  );
});

test('parses escaped backticks and long backslash runs without regex backtracking', () => {
  const pattern = `global.regexes: prefix${'\\_'.repeat(200)}\\\`suffix`;
  const entry: Entry = {
    file: '.gitleaks.toml',
    pattern: pattern.replace('\\`', '`'),
    reason: 'stress fixture',
  };
  const document = `| .gitleaks.toml | \`${pattern}\` | test | review | 2026-07-26 |`;

  assert.deepEqual(validateAllowlistCoverage([entry], document), []);
});
