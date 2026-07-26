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

test('parses escaped backticks and long backslash sequences without backtracking', () => {
  const longPattern = `global.paths: ${'\\_'.repeat(200)}`;
  const specialEntries: Entry[] = [
    {
      file: '.gitleaks.toml',
      pattern: 'global.paths: escaped`tick',
      reason: 'escaped code span',
    },
    {
      file: '.gitleaks.toml',
      pattern: longPattern,
      reason: 'stress case',
    },
  ];
  const document = [
    '| .gitleaks.toml | `global.paths: escaped\\`tick` | test | review | 2026-07-26 |',
    `| .gitleaks.toml | \`${longPattern}\` | test | review | 2026-07-26 |`,
  ].join('\n');
  assert.deepEqual(validateAllowlistCoverage(specialEntries, document), []);
});
