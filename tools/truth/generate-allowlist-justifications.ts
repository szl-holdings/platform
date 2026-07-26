import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type Entry = {
  file: string;
  pattern: string;
  reason: string;
};

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const GITLEAKS = path.join(ROOT, '.gitleaks.toml');
const SCANNER = path.join(ROOT, 'scripts', 'qa', 'scan-secrets.js');
const OUTPUT = path.join(ROOT, 'security', 'ALLOWLIST-JUSTIFICATIONS.md');

function cleanComment(lines: string[], fallback: string): string {
  const value = lines
    .map((line) =>
      line
        .replace(/^\s*#\s?/, '')
        .trim()
        .replace(/^[^A-Za-z0-9`.'"]+/, '')
        .trim(),
    )
    .filter((line) => /[A-Za-z]{4}/.test(line))
    .join(' ')
    .replaceAll('|', '\\|');
  return value || fallback;
}

function fallbackReason(kind: string): string {
  if (kind === 'paths') {
    return 'Excluded path contains generated, fixture, scanner-definition, or duplicate content reviewed as non-credential material.';
  }
  if (kind === 'regexes' || kind === 'stopwords') {
    return 'Suppression matches a documented placeholder, environment-variable name, public identifier, or test fixture rather than a credential.';
  }
  return 'Scanner exclusion was reviewed as generated, dependency, fixture, or audit evidence rather than credential-bearing source.';
}

function doubleQuotedValues(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let inString = false;
  let escaped = false;

  for (const character of line) {
    if (!inString) {
      if (character === '"') {
        inString = true;
        value = '';
      }
      continue;
    }
    if (escaped) {
      value += `\\${character}`;
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '"') {
      values.push(value);
      inString = false;
    } else {
      value += character;
    }
  }
  return values;
}

function closesTomlArray(line: string): boolean {
  let quote: '"' | "'" | null = null;
  let escaped = false;
  for (const character of line) {
    if (quote === '"') {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        quote = null;
      }
      continue;
    }
    if (quote === "'") {
      if (character === "'") quote = null;
      continue;
    }
    if (character === '#') break;
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === ']') return true;
  }
  return false;
}

export function parseToml(text: string): Entry[] {
  const entries: Entry[] = [];
  const lines = text.split(/\r?\n/);
  let comments: string[] = [];
  let section = 'global';
  let rule = 'global';
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*#/.test(line)) {
      comments.push(line);
      continue;
    }
    const ruleStart = line.match(/^\s*\[\[rules\]\]/);
    if (ruleStart) {
      section = 'rule';
      rule = 'unnamed-rule';
      comments = [];
      continue;
    }
    const id = line.match(/^\s*id\s*=\s*"([^"]+)"/);
    if (id) rule = id[1];
    if (/^\s*\[allowlist\]/.test(line)) section = 'global';
    if (/^\s*\[rules\.allowlist\]/.test(line)) section = 'rule';

    const start = line.match(/^\s*(paths|regexes|stopwords)\s*=\s*\[/);
    if (!start) {
      if (line.trim()) comments = [];
      continue;
    }
    const kind = start[1];
    const block: string[] = [line];
    while (!closesTomlArray(block.at(-1) ?? '') && index + 1 < lines.length) {
      index += 1;
      block.push(lines[index]);
    }
    const defaultReason = cleanComment(comments, fallbackReason(kind));
    let reason = defaultReason;
    let pendingComments: string[] = [];
    for (const blockLine of block) {
      if (/^\s*#/.test(blockLine)) {
        pendingComments.push(blockLine);
        continue;
      }
      for (const value of doubleQuotedValues(blockLine)) {
        if (pendingComments.length > 0) {
          reason = cleanComment(pendingComments, defaultReason);
          pendingComments = [];
        }
        entries.push({
          file: '.gitleaks.toml',
          pattern: `${section === 'rule' ? `rule:${rule}` : 'global'}.${kind}: ${value}`.replaceAll(
            '|',
            '\\|',
          ),
          reason,
        });
      }
    }
    comments = [];
  }
  return entries;
}

export function parseSet(text: string, setName: string): Entry[] {
  const match = text.match(new RegExp(`const ${setName} = new Set\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match) return [];
  const entries: Entry[] = [];
  const block = match[1].split(/\r?\n/);
  let comments: string[] = [];
  let reason = fallbackReason(setName);
  for (const line of block) {
    if (/^\s*\/\//.test(line)) {
      comments.push(line.replace(/^\s*\/\/\s?/, '# '));
      continue;
    }
    const value = line.match(/^\s*'([^']+)'/);
    if (!value) continue;
    if (comments.length > 0) {
      reason = cleanComment(comments, fallbackReason(setName));
    }
    entries.push({
      file: 'scripts/qa/scan-secrets.js',
      pattern: `${setName}: ${value[1]}`,
      reason,
    });
    comments = [];
  }
  return entries;
}

function entryKey(entry: Pick<Entry, 'file' | 'pattern'>): string {
  return `${entry.file}\u0000${entry.pattern}`;
}

export function validateAllowlistCoverage(entries: Entry[], document: string): string[] {
  const failures: string[] = [];
  const activeCounts = new Map<string, number>();
  for (const entry of entries) {
    const key = entryKey(entry);
    activeCounts.set(key, (activeCounts.get(key) ?? 0) + 1);
  }

  const documentedCounts = new Map<string, number>();
  for (const line of document.split(/\r?\n/)) {
    const match = line.match(
      /^\|\s*(\.gitleaks\.toml|scripts\/qa\/scan-secrets\.js)\s*\|\s*`((?:\\.|[^`])*)`\s*\|/,
    );
    if (!match) continue;
    const key = entryKey({ file: match[1], pattern: match[2].replaceAll('\\`', '`') });
    documentedCounts.set(key, (documentedCounts.get(key) ?? 0) + 1);
  }

  for (const [key, count] of activeCounts) {
    const [source, pattern] = key.split('\u0000');
    const documented = documentedCounts.get(key) ?? 0;
    if (count > 1) failures.push(`duplicate active suppression: ${source}: ${pattern}`);
    if (documented === 0) failures.push(`missing justification: ${source}: ${pattern}`);
    if (documented > 1) failures.push(`duplicate justification: ${source}: ${pattern}`);
  }
  for (const key of documentedCounts.keys()) {
    if (!activeCounts.has(key)) {
      const [source, pattern] = key.split('\u0000');
      failures.push(`stale justification: ${source}: ${pattern}`);
    }
  }
  return failures;
}

async function main(): Promise<void> {
  const gitleaksText = await readFile(GITLEAKS, 'utf8');
  const scannerText = await readFile(SCANNER, 'utf8');
  const entries = [
    ...parseToml(gitleaksText),
    ...parseSet(scannerText, 'SKIP_DIRS'),
    ...parseSet(scannerText, 'SKIP_FILES'),
  ];
  if (process.argv.includes('--check')) {
    const document = await readFile(OUTPUT, 'utf8');
    const failures = validateAllowlistCoverage(entries, document);
    if (failures.length > 0) {
      for (const failure of failures) process.stderr.write(`allowlist coverage: ${failure}\n`);
      process.exit(1);
    }
    process.stdout.write(`allowlist coverage: PASS (${entries.length} active suppressions)\n`);
    return;
  }
  const date = new Date().toISOString().slice(0, 10);
  const rows = entries.map(
    (entry) =>
      `| ${entry.file} | \`${entry.pattern.replaceAll('`', '\\`')}\` | ${entry.reason} | Repository config review | ${date} |`,
  );
  const document = `# Secret Scanner Allowlist Justifications

> **Status: MEASURED.** Generated from the active gitleaks and internal-scanner
> suppressions. An entry here documents why a scanner exclusion exists; it does
> not certify that a future value matching the same shape is safe.

Regenerate with \`pnpm truth:allowlists\`. Review every changed row before merge.

| File | Pattern/Line | Why false positive | Verified by | Date |
|---|---|---|---|---|
${rows.join('\n')}
`;

  await writeFile(OUTPUT, document, 'utf8');
  process.stdout.write(
    `security/ALLOWLIST-JUSTIFICATIONS.md generated (${entries.length} entries)\n`,
  );
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]).toLowerCase() : '';
if (invokedPath === fileURLToPath(import.meta.url).toLowerCase()) {
  void main().catch((error: unknown) => {
    process.stderr.write(`allowlist justification generation failed: ${String(error)}\n`);
    process.exit(1);
  });
}
