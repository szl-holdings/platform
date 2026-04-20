#!/usr/bin/env node
/**
 * Placeholder Empty-State Lint
 *
 * Fails the build if operator-facing pages under
 *   artifacts/{aegis,vessels,terra}/src/pages
 * contain generic placeholder copy ("No data", "No results",
 * "No items found") that should instead use the shared
 * <EmptyState /> component from `@workspace/shared-ui`
 * (lib/shared-ui/src/EmptyState.tsx).
 *
 * The rule is intentionally narrow: it only flags strings that
 * look like placeholder UI copy — JSX text nodes or short
 * standalone string literals. Long-form prose that happens to
 * contain the phrase ("…no data exfiltration was confirmed…")
 * is not flagged.
 *
 * --------------------------------------------------------------
 * Allow-list mechanism
 * --------------------------------------------------------------
 * Two ways to suppress a legitimate exception:
 *
 *   1) JSON allow-list — edit
 *        scripts/check-placeholder-empty-states.allowlist.json
 *      and add an entry of the form:
 *        { "file": "artifacts/aegis/src/pages/foo.tsx",
 *          "line": 42,
 *          "match": "No data",
 *          "reason": "Quoted incident title from CISA advisory" }
 *
 *   2) Inline marker — append the comment
 *        // empty-state-lint-allow: <reason>
 *      on the same line as the offending string.
 *
 * Run:
 *    node scripts/check-placeholder-empty-states.js
 *
 * Exit 0 = clean; Exit 1 = violations (or stale allow-list entry).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const SCAN_DIRS = [
  'artifacts/aegis/src/pages',
  'artifacts/vessels/src/pages',
  'artifacts/terra/src/pages',
];

export const ALLOWLIST_PATH = path.join(__dirname, 'check-placeholder-empty-states.allowlist.json');

/**
 * Patterns that indicate a generic placeholder empty state.
 * Each pattern is anchored to the placeholder use-cases
 * (JSX text nodes, short standalone string literals) to
 * avoid false-positives on prose.
 */
const PLACEHOLDER_PHRASES = ['No data', 'No results', 'No items found'];

const INLINE_ALLOW_MARKER = /\/\/\s*empty-state-lint-allow(?::|\b)/;

/**
 * Decide whether a single source line contains a placeholder
 * empty-state string. Returns the matched phrase, or null.
 *
 * Heuristics (any of the following counts as a placeholder):
 *   - JSX text node: `>No data<` or `>  No results — try again.<`
 *   - Standalone short string literal whose entire content is
 *     the phrase, optionally followed by ≤40 chars of trailing
 *     punctuation/words: e.g. `"No data"`, `'No results found.'`,
 *     `\`No items found\``.
 *
 * Long-form prose like `"…No data exfiltration was confirmed."`
 * is NOT matched because the literal does not start with the
 * phrase.
 */
export function findPlaceholderPhrase(line) {
  for (const phrase of PLACEHOLDER_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // JSX text node: `>` then optional whitespace then phrase
    // then up to 60 chars of trailing copy then `<`.
    const jsxRe = new RegExp(`>\\s*${escaped}\\b[^<>{]{0,60}<`, 'i');
    if (jsxRe.test(line)) return phrase;

    // Standalone string literal that *starts* with the phrase
    // (case-insensitive), with up to 40 chars of trailing
    // punctuation or short copy before the closing quote.
    const strRe = new RegExp(`(["'\`])\\s*${escaped}\\b[^"'\`\\n]{0,40}\\1`, 'i');
    const m = strRe.exec(line);
    if (m) {
      // Reject if the line clearly continues prose by ending
      // with a comma followed by more string content on the
      // next token — i.e. the literal is part of a sentence.
      // We approximate: accept only when the literal is at
      // most 60 chars long.
      if (m[0].length <= 60) return phrase;
    }
  }
  return null;
}

function listSourceFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const name of fs.readdirSync(cur)) {
      const p = path.join(cur, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        stack.push(p);
      } else if (/\.(tsx?|jsx?)$/.test(name)) {
        out.push(p);
      }
    }
  }
  return out;
}

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH)) return [];
  const raw = fs.readFileSync(ALLOWLIST_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Allow-list ${ALLOWLIST_PATH} must be a JSON array of entries.`);
  }
  for (const entry of parsed) {
    if (
      typeof entry.file !== 'string' ||
      typeof entry.line !== 'number' ||
      typeof entry.match !== 'string' ||
      typeof entry.reason !== 'string'
    ) {
      throw new Error(
        `Invalid allow-list entry: ${JSON.stringify(entry)}. ` +
          `Required fields: file, line, match, reason.`,
      );
    }
  }
  return parsed;
}

/**
 * Scan a single file's contents for placeholder empty states.
 * Returns an array of `{ file, line, match, snippet }`.
 */
export function scanSource(filePath, src) {
  const violations = [];
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const phrase = findPlaceholderPhrase(line);
    if (!phrase) continue;
    if (INLINE_ALLOW_MARKER.test(line)) continue;
    violations.push({
      file: filePath,
      line: i + 1,
      match: phrase,
      snippet: line.trim().slice(0, 200),
    });
  }
  return violations;
}

/**
 * Run the scan across all configured directories. Returns
 * `{ violations, unusedAllowlist }`.
 */
export function runScan({
  repoRoot = REPO_ROOT,
  scanDirs = SCAN_DIRS,
  allowlist = loadAllowlist(),
} = {}) {
  const allViolations = [];

  for (const dir of scanDirs) {
    const abs = path.join(repoRoot, dir);
    for (const file of listSourceFiles(abs)) {
      const rel = path.relative(repoRoot, file);
      const src = fs.readFileSync(file, 'utf8');
      for (const v of scanSource(rel, src)) {
        allViolations.push(v);
      }
    }
  }

  // Filter out allow-listed entries and track which entries were used.
  const usedKeys = new Set();
  const filtered = allViolations.filter((v) => {
    const hit = allowlist.find(
      (a) => a.file === v.file && a.line === v.line && a.match === v.match,
    );
    if (hit) {
      usedKeys.add(`${hit.file}:${hit.line}:${hit.match}`);
      return false;
    }
    return true;
  });

  const unusedAllowlist = allowlist.filter((a) => !usedKeys.has(`${a.file}:${a.line}:${a.match}`));

  return { violations: filtered, unusedAllowlist };
}

function main() {
  const { violations, unusedAllowlist } = runScan();

  if (unusedAllowlist.length > 0) {
    console.error(
      `\n❌  Allow-list contains ${unusedAllowlist.length} stale entry(ies). ` +
        `Remove them from ${path.relative(REPO_ROOT, ALLOWLIST_PATH)}:\n`,
    );
    for (const a of unusedAllowlist) {
      console.error(`    ${a.file}:${a.line}  match="${a.match}"  (${a.reason})`);
    }
  }

  if (violations.length === 0 && unusedAllowlist.length === 0) {
    console.log(
      "✅  placeholder empty-state check passed — no generic 'No data' / " +
        "'No results' / 'No items found' placeholders found in operator pages.",
    );
    process.exit(0);
  }

  if (violations.length > 0) {
    console.error(
      `\n❌  Found ${violations.length} placeholder empty-state(s) in operator pages:\n`,
    );
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}  →  "${v.match}"`);
      console.error(`    ${v.snippet}\n`);
    }
    console.error(
      'Fix:\n' +
        '  • Replace the placeholder with the shared <EmptyState /> component\n' +
        '    from @workspace/shared-ui (lib/shared-ui/src/EmptyState.tsx),\n' +
        '    providing a contextual headline, description, and action.\n' +
        '  • If the string is a legitimate exception (quoted prose, test\n' +
        '    fixture, etc.), either:\n' +
        '      - Add an entry to scripts/check-placeholder-empty-states.allowlist.json, OR\n' +
        '      - Append `// empty-state-lint-allow: <reason>` to the line.\n',
    );
  }

  process.exit(1);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) main();
