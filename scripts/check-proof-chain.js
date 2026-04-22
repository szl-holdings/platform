#!/usr/bin/env node
/**
 * Proof-Chain Static Check
 *
 * Fails CI if:
 *   1. Any call to executeWorkflow() does not carry a policyEvaluation,
 *      policyEvaluationOverride, isDryRun, or isSimulation — ensuring every
 *      governed action carries a proof record before execution.
 *
 *   2. Any call to buildPolicyEvaluation() (the sole PolicyEvaluation factory)
 *      is missing any of the five mandatory proof-chain arguments:
 *        - evidenceChain   — array of evidence objects grounding the decision
 *        - freshnessScore  — 0–1 freshness score for the evidence set
 *        - confidence      — 0–1 confidence in the evaluation outcome
 *        - projectedImpact — human-readable statement of expected impact
 *        - projectedRisk   — human-readable risk assessment
 *      (policyResult is the sixth proof-chain field, but it is computed
 *       internally by the factory and is enforced on the return type by
 *       TypeScript — no call-site check is needed for it.)
 *
 *   3. Any call to createRecommendation() (the Recommendation factory from
 *      @workspace/ontology) is missing the required proof-chain fields:
 *        - evidenceIds     — array of evidence UUIDs grounding the recommendation
 *        - confidence      — 0–1 confidence in the recommendation
 *        - freshness       — 0–1 freshness of the source signals
 *        (and 5 others: rationale, domain, projectedImpact, projectedRisk,
 *         policyEvaluation — 8 fields total)
 *      (evidence is enforced at runtime by the Zod schema — this gate catches
 *       bypass patterns and missing fields that types alone cannot detect.)
 *
 *   4. Any `as Recommendation` type assertion in production files. These bypass
 *      createRecommendation() and can produce Recommendation objects that skip
 *      Zod proof-chain validation. Files must use the factory instead.
 *      Covers JSON.parse(...) casts, DB row mappers, and transport adapters.
 *
 * Primary enforcement layers:
 *   - TypeScript types make proof-chain fields required on PolicyEvaluation
 *     and Recommendation; compilation fails on type violations.
 *   - Zod schemas validate Recommendation evidence at runtime.
 *   - This script is a belt-and-suspenders CI gate that catches any-casts,
 *     build-system bypasses, and missing fields that types alone cannot detect.
 *
 * Parsing approach: bracket-balanced argument extraction — scans for the
 * matching closing paren of each call to avoid false positives from adjacent
 * calls or deeply nested code.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('..', import.meta.url).pathname;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SCAN_DIRS = [
  'packages',
  // Only scan api-server (the only artifact that calls executeWorkflow)
  'artifacts/api-server/src',
];

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.dist\//,
  /dist\//,
  /build\//,
  /\.next\//,
  /coverage\//,
  /playwright-report\//,
  /\.archive\//,
  /\.agents\//,
  /\.local\//,
  // Skip this script itself
  /check-proof-chain\.js/,
  // Skip test fixture files
  /\.test\.(ts|tsx|js)$/,
  /\.spec\.(ts|tsx|js)$/,
];

const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .ts/.tsx/.js files under a directory.
 */
function collectFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (TS_EXTENSIONS.has(extname(full))) {
      results.push(full);
    }
  }
  return results;
}

function shouldIgnore(filePath) {
  const rel = relative(ROOT, filePath);
  return IGNORE_PATTERNS.some((p) => p.test(rel) || p.test(filePath));
}

/**
 * Bracket-balanced argument block extractor.
 *
 * Starting from `fromIdx` (pointing at the function name, e.g.
 * `buildPolicyEvaluation(`), finds the matching closing paren by tracking
 * open/close parens while respecting string literals. Returns only the
 * text of the current call's argument list — never bleeds into adjacent calls.
 *
 * Falls back to a 5000-char window if no balanced close is found (e.g. at
 * end of a truncated file read).
 */
export function extractArgBlock(src, fromIdx) {
  const openIdx = src.indexOf('(', fromIdx);
  if (openIdx === -1) return src.slice(fromIdx, Math.min(fromIdx + 5000, src.length));

  let depth = 0;
  let inString = false;
  let stringChar = '';
  let i = openIdx;

  while (i < src.length && i < openIdx + 50_000) {
    const ch = src[i];

    if (inString) {
      if (ch === '\\' && i + 1 < src.length) {
        i += 2; // skip escaped character
        continue;
      }
      if (ch === stringChar) inString = false;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
    } else if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0) return src.slice(fromIdx, i + 1);
    }
    i++;
  }

  return src.slice(fromIdx, Math.min(fromIdx + 5000, src.length));
}

/**
 * Returns true if the line text indicates the call should be skipped
 * (it is a definition, import, comment, type declaration, or string literal).
 */
function isDefinitionOrMeta(lineText, fnName) {
  const trimmed = lineText.trimStart();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('import ') ||
    trimmed.includes(' type ') ||
    trimmed.includes(' interface ') ||
    new RegExp(`function\\s+${fnName}`).test(lineText) ||
    new RegExp(`'[^']*${fnName}`).test(lineText) ||
    new RegExp(`\`[^\`]*${fnName}`).test(lineText) ||
    new RegExp(`"[^"]*${fnName}`).test(lineText)
  );
}

// ---------------------------------------------------------------------------
// Check 1: executeWorkflow calls must carry policyEvaluation
// ---------------------------------------------------------------------------

/**
 * Finds all executeWorkflow( call sites and returns violations.
 *
 * A call is a violation if the bracket-bounded argument block contains none of:
 *   - policyEvaluation:           — real PolicyEvaluation object (production path)
 *   - policyEvaluationOverride: true  — explicit literal-true bypass (test/demo only)
 *   - isDryRun: true              — explicit literal-true dry-run bypass
 *   - isSimulation: true          — explicit literal-true simulation bypass
 *
 * IMPORTANT: dynamic expressions like `isDryRun: req.isDryRun ?? false` do NOT satisfy
 * the bypass because they may evaluate to false on the live execution path. Only the
 * literal boolean `true` is accepted for bypass markers.
 */
export function checkExecuteWorkflowCalls(filePath, src) {
  const violations = [];
  let searchFrom = 0;

  while (true) {
    const callIdx = src.indexOf('executeWorkflow(', searchFrom);
    if (callIdx === -1) break;

    const lineStart = src.lastIndexOf('\n', callIdx) + 1;
    const lineText = src.slice(lineStart, src.indexOf('\n', callIdx));

    if (
      lineText.trimStart().startsWith('import ') ||
      lineText.trimStart().startsWith('export') ||
      lineText.trimStart().startsWith('//') ||
      lineText.trimStart().startsWith('*') ||
      lineText.includes('type ') ||
      lineText.includes('interface ') ||
      /function\s+executeWorkflow/.test(lineText)
    ) {
      searchFrom = callIdx + 1;
      continue;
    }

    // Bracket-bounded extraction — no window bleed into subsequent calls
    const block = extractArgBlock(src, callIdx);

    // Real policyEvaluation (not the Override variant) — any value is acceptable here;
    // the action-engine's Zod schema validates the shape at runtime.
    const hasPolicyEvaluation =
      /\bpolicyEvaluation\s*:(?!\s*Override)/.test(block) || /\bpolicyEvaluation\s*,/.test(block);

    // Bypass markers require the literal boolean `true` — dynamic expressions (variables,
    // ternaries, null-coalescing) do NOT qualify because they may be false on the live path.
    const hasPolicyOverride = /\bpolicyEvaluationOverride\s*:\s*true\b/.test(block);
    const hasIsDryRun = /\bisDryRun\s*:\s*true\b/.test(block);
    const hasIsSimulation = /\bisSimulation\s*:\s*true\b/.test(block);

    if (!hasPolicyEvaluation && !hasPolicyOverride && !hasIsDryRun && !hasIsSimulation) {
      const lineNum = src.slice(0, callIdx).split('\n').length;
      violations.push({
        file: relative(ROOT, filePath),
        line: lineNum,
        issue:
          'executeWorkflow() call missing policyEvaluation, policyEvaluationOverride: true, isDryRun: true, or isSimulation: true — dynamic bypass expressions (e.g. isDryRun: req.isDryRun ?? false) are not accepted because they may be false on the live execution path',
      });
    }

    searchFrom = callIdx + 1;
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Check 2: buildPolicyEvaluation() calls must supply required proof-chain fields
// ---------------------------------------------------------------------------

/**
 * Scans for `buildPolicyEvaluation({` call sites and verifies each call includes
 * the five mandatory proof-chain argument fields:
 *   - evidenceChain   — array of evidence objects grounding the decision
 *   - freshnessScore  — numeric freshness of the evidence (0–1)
 *   - confidence      — numeric confidence in the evaluation (0–1)
 *   - projectedImpact — human-readable statement of expected impact
 *   - projectedRisk   — human-readable risk assessment
 *
 * Uses bracket-balanced argument extraction for structural accuracy.
 * `policyResult` (the sixth proof-chain field) is computed internally by the
 * factory and is enforced on the return type; callers need not pass it.
 */
export function checkBuildPolicyEvaluationCalls(filePath, src) {
  const violations = [];

  const REQUIRED_ARGS = [
    'evidenceChain',
    'freshnessScore',
    'confidence',
    'projectedImpact',
    'projectedRisk',
  ];

  let searchFrom = 0;
  while (true) {
    const callIdx = src.indexOf('buildPolicyEvaluation(', searchFrom);
    if (callIdx === -1) break;

    const lineStart = src.lastIndexOf('\n', callIdx) + 1;
    const lineText = src.slice(lineStart, src.indexOf('\n', callIdx));

    if (isDefinitionOrMeta(lineText, 'buildPolicyEvaluation')) {
      searchFrom = callIdx + 1;
      continue;
    }

    // Bracket-bounded extraction
    const block = extractArgBlock(src, callIdx);

    // For each required field, look for it only at the top argument level.
    // We strip the content of nested `[...]` and inner `{...}` objects so that
    // field names inside evidence-chain items (e.g. `confidence: 0.9` inside
    // an evidenceChain element) do not count as the top-level `confidence` arg.
    const topLevel = removeNestedBraces(block);

    const missing = REQUIRED_ARGS.filter((field) => {
      const re = new RegExp(`\\b${field}\\s*:`);
      return !re.test(topLevel);
    });

    if (missing.length > 0) {
      const lineNum = src.slice(0, callIdx).split('\n').length;
      violations.push({
        file: relative(ROOT, filePath),
        line: lineNum,
        issue: `buildPolicyEvaluation() call at line ${lineNum} is missing required proof-chain arg(s): ${missing.join(', ')}`,
      });
    }

    searchFrom = callIdx + 1;
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Check 3: createRecommendation() calls must supply proof-chain fields
// ---------------------------------------------------------------------------

/**
 * Scans for `createRecommendation({` call sites (the Recommendation factory
 * from @workspace/ontology) and verifies each call includes:
 *   - evidenceIds — array of evidence UUIDs grounding the recommendation
 *   - confidence  — 0–1 confidence in the recommendation
 *   - freshness   — 0–1 freshness of the source signals
 *
 * `policyEvaluation.outcome` is set by the factory; this gate only checks
 * that callers supply the user-facing proof-chain fields.
 */
export function checkCreateRecommendationCalls(filePath, src) {
  const violations = [];

  // Full recommendation proof-chain contract (8 required fields):
  //   evidenceIds       — which evidence grounds the recommendation
  //   confidence        — model confidence in the recommendation
  //   freshness         — how fresh the evidence set is
  //   rationale         — human-readable justification (the "why")
  //   domain            — operational domain tag (traceability across systems)
  //   projectedImpact   — human-readable statement of expected impact if action is taken
  //   projectedRisk     — human-readable risk statement if action is NOT taken
  //   policyEvaluation  — explicit policy status at construction time (must not be omitted)
  const REQUIRED_ARGS = [
    'evidenceIds',
    'confidence',
    'freshness',
    'rationale',
    'domain',
    'projectedImpact',
    'projectedRisk',
    'policyEvaluation',
  ];

  let searchFrom = 0;
  while (true) {
    const callIdx = src.indexOf('createRecommendation(', searchFrom);
    if (callIdx === -1) break;

    const lineStart = src.lastIndexOf('\n', callIdx) + 1;
    const lineText = src.slice(lineStart, src.indexOf('\n', callIdx));

    if (isDefinitionOrMeta(lineText, 'createRecommendation')) {
      searchFrom = callIdx + 1;
      continue;
    }

    const block = extractArgBlock(src, callIdx);
    const topLevel = removeNestedBraces(block);

    const missing = REQUIRED_ARGS.filter((field) => {
      const re = new RegExp(`\\b${field}\\s*:`);
      return !re.test(topLevel);
    });

    if (missing.length > 0) {
      const lineNum = src.slice(0, callIdx).split('\n').length;
      violations.push({
        file: relative(ROOT, filePath),
        line: lineNum,
        issue: `createRecommendation() call at line ${lineNum} is missing required proof-chain arg(s): ${missing.join(', ')}`,
      });
    }

    searchFrom = callIdx + 1;
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Check 4: Recommendation type assertions bypass the factory and proof-chain
// ---------------------------------------------------------------------------

/**
 * Finds all `as Recommendation` type assertion patterns and flags them as
 * violations. These patterns bypass `createRecommendation()` and can produce
 * Recommendation objects that skip proof-chain validation.
 *
 * Legitimate patterns:
 *   - `param: Recommendation`    — type annotation, not an assertion (allowed)
 *   - `rec: Recommendation`      — type annotation (allowed)
 *   - `Recommendation["domain"]` — type property access (allowed)
 *
 * Flagged patterns (type assertions that could construct a Recommendation
 * without going through createRecommendation's Zod validation):
 *   - `someObj as Recommendation`  — TypeScript assertion bypass
 *   - `<Recommendation>someObj`    — legacy cast syntax
 *
 * If you need to produce a Recommendation from a DB row or transport payload,
 * deserialize the fields and pass them to createRecommendation() instead.
 */
export function checkRecommendationTypeAssertions(filePath, src) {
  const violations = [];

  // Pattern 1: `as Recommendation` — TypeScript assertion casting
  // Must be `as Recommendation` (word boundary after "Recommendation") but not
  // `as Recommendation["..."]` (type access on the type is fine).
  const asPattern = /\bas\s+Recommendation\b(?!\s*\[)/g;
  let match;
  while ((match = asPattern.exec(src)) !== null) {
    // Allow in type-only positions: function parameter type annotations (`param: Recommendation`)
    // are fine, but `as Recommendation` is always a value-space type assertion.
    const lineNum = src.slice(0, match.index).split('\n').length;
    const lineStart = src.lastIndexOf('\n', match.index) + 1;
    const lineText = src.slice(lineStart, src.indexOf('\n', match.index));

    // Skip JSDoc/comment lines and import/type lines
    if (
      lineText.trimStart().startsWith('//') ||
      lineText.trimStart().startsWith('*') ||
      lineText.includes('import ') ||
      lineText.includes('type ') ||
      lineText.includes('interface ')
    ) {
      continue;
    }

    violations.push({
      file: relative(ROOT, filePath),
      line: lineNum,
      issue:
        '`as Recommendation` type assertion bypasses createRecommendation() and proof-chain validation. ' +
        'Deserialize fields and pass them through createRecommendation() instead.',
    });
  }

  // Pattern 2: `<Recommendation>expr` — legacy TypeScript angle-bracket cast syntax
  // These are semantically identical to `expr as Recommendation` and equally bypass
  // the createRecommendation() factory and Zod proof-chain validation.
  // Must not match generic type parameters like Array<Recommendation> or Map<string, Recommendation>.
  const legacyPattern = /<Recommendation>/g;
  while ((match = legacyPattern.exec(src)) !== null) {
    const lineNum = src.slice(0, match.index).split('\n').length;
    const lineStart = src.lastIndexOf('\n', match.index) + 1;
    const lineText = src.slice(lineStart, src.indexOf('\n', match.index));

    // Skip comment/import/type lines
    if (
      lineText.trimStart().startsWith('//') ||
      lineText.trimStart().startsWith('*') ||
      lineText.includes('import ') ||
      lineText.includes('type ') ||
      lineText.includes('interface ')
    ) {
      continue;
    }

    // Skip generic type positions: Array<Recommendation>, Map<K, Recommendation> etc.
    // These are followed immediately by a word boundary, not an identifier (expression).
    // A legacy cast is `<Recommendation>someExpr` — the > is followed by a non-whitespace identifier.
    const after = src.slice(match.index + match[0].length);
    if (!after.match(/^\s*\w/)) {
      continue;
    }

    violations.push({
      file: relative(ROOT, filePath),
      line: lineNum,
      issue:
        '`<Recommendation>` legacy cast assertion bypasses createRecommendation() and proof-chain validation. ' +
        'Deserialize fields and pass them through createRecommendation() instead.',
    });
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strips nested `{...}` and `[...]` content from `src` so that field name
 * matching operates only on the top-level keys of the argument object.
 *
 * Respects string literals to avoid stripping content that happens to contain
 * brace characters inside quoted strings.
 */
export function removeNestedBraces(src) {
  // Goal: return only the text at depth 1 inside the argument object.
  //
  // Depth accounting after skipping past the outer `(`:
  //   depth 0 — between `(` and the outer `{` (or at closing `)`)
  //   depth 1 — inside the outer `{...}` argument object  ← CAPTURE HERE
  //   depth 2+ — inside nested `{...}` or `[...]`         ← skip
  //
  // This ensures that field-name searches only match top-level argument keys,
  // not identically-named fields inside nested evidence objects or arrays.

  let result = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  // Skip to just after the outer opening `(` of the function call.
  const openParen = src.indexOf('(');
  if (openParen === -1) return src;
  let i = openParen + 1;

  while (i < src.length) {
    const ch = src[i];

    if (inString) {
      if (ch === '\\' && i + 1 < src.length) {
        i += 2;
        continue;
      }
      if (ch === stringChar) inString = false;
      if (depth === 1) result += ch; // capture string content at top level
    } else if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      if (depth === 1) result += ch;
    } else if (ch === '{' || ch === '[') {
      depth++;
      // Do not emit the bracket itself — we only need the key names.
    } else if (ch === '}' || ch === ']') {
      depth--;
      if (depth < 0) break; // exited the outer argument list
    } else if (ch === ')' && depth === 0) {
      break; // end of the outer call paren
    } else if (depth === 1) {
      result += ch; // capture key names, colons, commas, scalar values
    }

    i++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main (runs only when executed directly; not when imported for testing)
// ---------------------------------------------------------------------------

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const allViolations = [];

  for (const dir of SCAN_DIRS) {
    const fullDir = join(ROOT, dir);
    const files = collectFiles(fullDir);

    for (const filePath of files) {
      if (shouldIgnore(filePath)) continue;

      let src;
      try {
        const stat = statSync(filePath);
        if (stat.size > 500_000) continue; // skip very large generated files
        src = readFileSync(filePath, 'utf8');
      } catch {
        continue;
      }

      allViolations.push(...checkExecuteWorkflowCalls(filePath, src));
      allViolations.push(...checkBuildPolicyEvaluationCalls(filePath, src));
      allViolations.push(...checkCreateRecommendationCalls(filePath, src));
      allViolations.push(...checkRecommendationTypeAssertions(filePath, src));
    }
  }

  // -------------------------------------------------------------------------
  // Report
  // -------------------------------------------------------------------------

  if (allViolations.length === 0) {
    process.exit(0);
  } else {
    for (const _v of allViolations) {
    }
    process.exit(1);
  }
}
