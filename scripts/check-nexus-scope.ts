#!/usr/bin/env tsx
/**
 * check-nexus-scope.ts
 *
 * Enforces NEXUS (`artifacts/mockup-sandbox`) scope rules from
 * `docs/demos/nexus-scope.md`. Run via `pnpm check:nexus-scope`.
 *
 * Exits non-zero on any violation. Each violation includes the file, line,
 * the offending import or call, and a one-line "how to fix" hint.
 *
 * Single-line escape hatch: append `// nexus-scope-allow` to a line to skip
 * scanning that one line. Use sparingly; uses are audited.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname ?? process.cwd(), '..');
const ARTIFACT_DIR = join(ROOT, 'artifacts/mockup-sandbox');
const ARTIFACT_SRC = join(ARTIFACT_DIR, 'src');
const ARTIFACT_PKG = join(ARTIFACT_DIR, 'package.json');
const SCOPE_DOC = 'docs/demos/nexus-scope.md';
const ALLOW_MARKER = 'nexus-scope-allow';

interface Violation {
  file: string;
  line: number;
  rule: string;
  detail: string;
  hint: string;
}

export const BANNED_ARTIFACT_PREFIXES = [
  'artifacts/sentra',
  'artifacts/command',
  'artifacts/pulse',
  'artifacts/terra',
  'artifacts/vessels',
  'artifacts/counsel',
  'artifacts/aegis',
  'artifacts/lyte-command-center',
  'artifacts/carlota-jo',
  'artifacts/szl-holdings',
  'artifacts/szl-holdings-mobile',
  'artifacts/api-server',
  'artifacts/a11oy',
  'artifacts/conduit',
];

export const BANNED_ALLOY_PREFIXES = [
  '@szl/alloy',
  '@workspace/alloy',
  '@szl-holdings/alloy',
  'packages/alloy',
  'packages/szl-alloy',
];

export const BANNED_AI_SDK_NAMES = new Set([
  'openai',
  '@anthropic-ai/sdk',
  '@google/generative-ai',
  '@google-cloud/aiplatform',
  'pinecone',
  '@pinecone-database/pinecone',
  'weaviate-ts-client',
  'weaviate-client',
  '@weaviate/client',
  'chromadb',
  'cohere-ai',
  'replicate',
]);

export const BANNED_AUTH_BILLING_NAMES = new Set([
  'stripe',
  '@stripe/stripe-js',
  '@stripe/react-stripe-js',
  '@clerk/clerk-sdk-node',
  '@clerk/clerk-react',
  '@clerk/nextjs',
  '@clerk/express',
  'express-session',
  'passport',
  'passport-local',
]);

const VIOLATIONS: Violation[] = [];

function listFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (
        entry === 'node_modules' ||
        entry === 'dist' ||
        entry === 'build' ||
        entry === '.cache' ||
        entry === '.next' ||
        entry.startsWith('.')
      )
        continue;
      out.push(...listFiles(full, exts));
    } else if (exts.some((e) => entry.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

export function isAllowed(line: string, prevLine: string | undefined): boolean {
  // Support both same-line and previous-line forms (mirrors
  // eslint-disable-line / eslint-disable-next-line semantics).
  if (line.includes(ALLOW_MARKER)) return true;
  if (prevLine && prevLine.includes(ALLOW_MARKER)) return true;
  return false;
}

export function checkResolvedPath(absPath: string): { rule: string; hint: string } | null {
  // Path is absolute; compare to repo-relative banned prefixes.
  const relFromRoot = relative(ROOT, absPath).replace(/\\/g, '/');
  for (const banned of BANNED_ARTIFACT_PREFIXES) {
    if (relFromRoot === banned || relFromRoot.startsWith(`${banned}/`)) {
      return {
        rule: 'cross-artifact-import',
        hint: `NEXUS may not import from another artifact (resolved to "${relFromRoot}"). Move the shared code to packages/* or lib/* instead.`,
      };
    }
  }
  for (const banned of BANNED_ALLOY_PREFIXES) {
    if (relFromRoot === banned || relFromRoot.startsWith(`${banned}/`)) {
      return {
        rule: 'alloy-coupling',
        hint: `NEXUS must not couple to Alloy (resolved to "${relFromRoot}"). Reuse only design tokens / primitives from packages/* or lib/*.`,
      };
    }
  }
  return null;
}

export function classifyImport(spec: string, fromFile: string): { rule: string; hint: string } | null {
  if (spec.startsWith('node:') || spec.startsWith('virtual:')) return null;

  // Relative imports — resolve to an absolute path and check against
  // banned artifact / alloy prefixes. This closes the "../../sentra/..."
  // bypass that bare-spec checks miss.
  if (spec.startsWith('./') || spec.startsWith('../') || spec === '.' || spec === '..') {
    const fromDir = resolve(fromFile, '..');
    const abs = resolve(fromDir, spec);
    const v = checkResolvedPath(abs);
    if (v) return v;
    return null;
  }

  // src/* alias — typically maps to artifacts/mockup-sandbox/src; safe.
  if (spec.startsWith('@/')) return null;

  // Bare specifier — check banned prefixes literally.
  for (const banned of BANNED_ARTIFACT_PREFIXES) {
    if (spec === banned || spec.startsWith(`${banned}/`)) {
      return {
        rule: 'cross-artifact-import',
        hint: `NEXUS may not import from another artifact. Move the shared code to packages/* or lib/* instead.`,
      };
    }
  }
  for (const banned of BANNED_ALLOY_PREFIXES) {
    if (spec === banned || spec.startsWith(`${banned}/`)) {
      return {
        rule: 'alloy-coupling',
        hint: `NEXUS must not couple to the Alloy runtime. Reuse only design tokens / primitives from packages/* or lib/*.`,
      };
    }
  }
  if (BANNED_AI_SDK_NAMES.has(spec) || [...BANNED_AI_SDK_NAMES].some((n) => spec.startsWith(`${n}/`))) {
    return {
      rule: 'live-ai-sdk',
      hint: `NEXUS uses scripted demo data only. Replace with mock data in artifacts/mockup-sandbox/src/data/.`,
    };
  }
  if (BANNED_AUTH_BILLING_NAMES.has(spec) || [...BANNED_AUTH_BILLING_NAMES].some((n) => spec.startsWith(`${n}/`))) {
    return {
      rule: 'real-auth-billing-sdk',
      hint: `NEXUS uses the existing mock org switcher only — no real auth/billing/session SDKs in this artifact's src/.`,
    };
  }
  return null;
}

function scanImports(file: string, content: string) {
  const lines = content.split('\n');
  const importRe = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (isAllowed(line, lines[i - 1])) continue;
    let m;
    while ((m = importRe.exec(line)) !== null) {
      const cls = classifyImport(m[1]!, file);
      if (cls) {
        VIOLATIONS.push({
          file: relative(ROOT, file),
          line: i + 1,
          rule: cls.rule,
          detail: `import "${m[1]}"`,
          hint: cls.hint,
        });
      }
    }
  }
}

// Transitional allowlist: any legacy backend route this NEXUS sandbox is
// temporarily allowed to call. As of Project Task #4570 (NEXUS pages →
// /api/nexus/* only), this list is INTENTIONALLY EMPTY — every page now
// uses scripted demo data per docs/demos/nexus-scope.md. Adding an entry
// here without a corresponding scope-doc amendment is a regression and
// must be flagged in code review.
//
// Stored without trailing slash; the matcher requires the next character to
// be a path/query boundary so `/api/<prefix>-malicious` does NOT pass.
export const TRANSITIONAL_ALLOWED_PREFIXES: string[] = [];

// Template-literal URLs that begin with one of these identifiers are treated
// as same-origin nexus iff the same file declares the identifier as a string
// literal whose value starts with `/api/nexus`. We will not blindly trust
// `${API}` — we verify what `API` actually equals.
export const TEMPLATE_BASE_IDENTS = ['API', 'API_BASE', 'NEXUS_API', 'NEXUS_BASE'];

export function endsAtPathBoundary(url: string, prefixLen: number): boolean {
  if (url.length === prefixLen) return true;
  const next = url.charAt(prefixLen);
  return next === '/' || next === '?' || next === '#';
}

export function stripLineCommentsForScan(content: string): string {
  // Strip `// …` line comments to defeat commented-out fake declarations
  // like `// const API = '/api/nexus'`. We don't try to strip block
  // comments — the regex still requires a clean `const|let|var` declaration
  // at the start of the matched substring, and that's hard to fake inside
  // a `/* … */` without other syntax errors.
  return content.replace(/\/\/[^\n]*/g, '');
}

export function resolveBaseIdent(content: string, ident: string): string | null {
  // Fail-closed declaration resolver. Returns the literal value ONLY when:
  //   - exactly one `const|let|var <ident> = '<value>'` declaration exists,
  //   - the rhs is a single string literal (no `+` concatenation, no template,
  //     no function call, no shadowing).
  const stripped = stripLineCommentsForScan(content);
  const decl = new RegExp(
    `\\b(?:const|let|var)\\s+${ident}\\s*(?::[^=]+)?=\\s*(['"])([^'"]*)\\1\\s*([^;\\n]*)`,
    'g',
  );
  const matches: { value: string; trailing: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = decl.exec(stripped)) !== null) {
    matches.push({ value: m[2] ?? '', trailing: (m[3] ?? '').trim() });
  }
  if (matches.length !== 1) return null; // 0 = unknown; >1 = shadowed -> fail closed
  const only = matches[0]!;
  if (only.trailing.length > 0) {
    // anything after the literal but before `;` / newline = concatenation,
    // function call, etc. Treat as undecidable -> fail closed.
    return null;
  }
  return only.value;
}

export function isAllowedFetchUrl(url: string, fileContent: string): boolean {
  // Canonical: same-origin /api/nexus
  if (url === '/api/nexus' || url.startsWith('/api/nexus/') || url.startsWith('/api/nexus?')) {
    return true;
  }
  // Transitional legacy prefixes — require boundary so partial-prefix
  // bypasses (e.g. `/api/pulse-evals-malicious`) are still flagged.
  for (const p of TRANSITIONAL_ALLOWED_PREFIXES) {
    if (url.startsWith(p) && endsAtPathBoundary(url, p.length)) return true;
  }
  // Template literal: ${IDENT}<rest>. Resolve IDENT in this file (fail-closed)
  // and require BOTH:
  //   - the resolved value is exactly `/api/nexus` or starts with `/api/nexus/`
  //   - the literal suffix after `${IDENT}` continues at a path boundary
  //     (`/`, `?`, `#`, end, or another `${`) — closes the `${API}.evil`
  //     and `${API}-evil` bypasses.
  for (const ident of TEMPLATE_BASE_IDENTS) {
    const tag = `\${${ident}}`;
    if (url.startsWith(tag)) {
      const resolved = resolveBaseIdent(fileContent, ident);
      if (!resolved) return false;
      const baseOk = resolved === '/api/nexus' || resolved.startsWith('/api/nexus/');
      if (!baseOk) return false;
      const suffix = url.slice(tag.length);
      if (suffix.length === 0) return true;
      const next = suffix.charAt(0);
      if (next === '/' || next === '?' || next === '#') return true;
      // Next interpolation tag is also boundary-safe — runtime value of
      // ${path} can be anything, but as long as the LITERAL boundary holds,
      // a malicious suffix like `.evil` cannot be silently appended.
      if (suffix.startsWith('${')) return true;
      return false;
    }
  }
  return false;
}

function scanNetworkCalls(file: string, content: string) {
  const lines = content.split('\n');
  const fetchRe = /\bfetch\s*\(\s*([`'"])([^`'"]+)\1/g;
  const axiosRe = /\b(?:axios|axios\.(?:get|post|put|patch|delete|request))\s*\(/g;
  const xhrRe = /\bnew\s+XMLHttpRequest\s*\(/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (isAllowed(line, lines[i - 1])) continue;

    let m;
    while ((m = fetchRe.exec(line)) !== null) {
      const url = m[2]!;
      if (!isAllowedFetchUrl(url, content)) {
        VIOLATIONS.push({
          file: relative(ROOT, file),
          line: i + 1,
          rule: 'outbound-network-call',
          detail: `fetch("${url}")`,
          hint: `NEXUS allows only same-origin /api/nexus/* fetch (plus the transitional legacy prefixes documented in docs/demos/nexus-scope.md).`,
        });
      }
    }
    if (axiosRe.test(line)) {
      axiosRe.lastIndex = 0;
      VIOLATIONS.push({
        file: relative(ROOT, file),
        line: i + 1,
        rule: 'outbound-network-call',
        detail: 'axios usage',
        hint: `NEXUS forbids axios. Use fetch against /api/nexus/* or scripted demo data instead.`,
      });
    }
    if (xhrRe.test(line)) {
      xhrRe.lastIndex = 0;
      VIOLATIONS.push({
        file: relative(ROOT, file),
        line: i + 1,
        rule: 'outbound-network-call',
        detail: 'new XMLHttpRequest()',
        hint: `NEXUS forbids XMLHttpRequest. Use fetch against /api/nexus/* or scripted demo data instead.`,
      });
    }
  }
}

function scanPackageJson() {
  if (!existsSync(ARTIFACT_PKG)) return;
  let pkg: any;
  try {
    pkg = JSON.parse(readFileSync(ARTIFACT_PKG, 'utf8'));
  } catch (err) {
    VIOLATIONS.push({
      file: relative(ROOT, ARTIFACT_PKG),
      line: 1,
      rule: 'package-json-unreadable',
      detail: String(err),
      hint: `Fix package.json syntax so the scope check can read its dependency list.`,
    });
    return;
  }
  const allDeps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
    ...(pkg.optionalDependencies ?? {}),
  };
  for (const dep of Object.keys(allDeps)) {
    if (BANNED_AI_SDK_NAMES.has(dep)) {
      VIOLATIONS.push({
        file: relative(ROOT, ARTIFACT_PKG),
        line: 1,
        rule: 'live-ai-sdk',
        detail: `dependency "${dep}"`,
        hint: `Remove ${dep} from artifacts/mockup-sandbox/package.json. Use scripted mock data instead.`,
      });
    }
    if (BANNED_AUTH_BILLING_NAMES.has(dep)) {
      VIOLATIONS.push({
        file: relative(ROOT, ARTIFACT_PKG),
        line: 1,
        rule: 'real-auth-billing-sdk',
        detail: `dependency "${dep}"`,
        hint: `Remove ${dep} from artifacts/mockup-sandbox/package.json. Use the mock org switcher only.`,
      });
    }
    for (const banned of BANNED_ALLOY_PREFIXES) {
      if (dep === banned || dep.startsWith(`${banned}/`)) {
        VIOLATIONS.push({
          file: relative(ROOT, ARTIFACT_PKG),
          line: 1,
          rule: 'alloy-coupling',
          detail: `dependency "${dep}"`,
          hint: `Remove ${dep} from artifacts/mockup-sandbox/package.json. NEXUS must not couple to Alloy.`,
        });
      }
    }
  }
}

function scanScopeDoc() {
  const docPath = join(ROOT, SCOPE_DOC);
  if (!existsSync(docPath)) {
    VIOLATIONS.push({
      file: SCOPE_DOC,
      line: 0,
      rule: 'missing-scope-doc',
      detail: 'docs/demos/nexus-scope.md not found',
      hint: `The scope source-of-truth doc is missing. Restore it before NEXUS work continues.`,
    });
  }
}

function main() {
  scanScopeDoc();
  scanPackageJson();

  if (existsSync(ARTIFACT_SRC)) {
    const files = listFiles(ARTIFACT_SRC, ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
    for (const f of files) {
      const content = readFileSync(f, 'utf8');
      scanImports(f, content);
      scanNetworkCalls(f, content);
    }
  }

  if (VIOLATIONS.length === 0) {
    console.log('check-nexus-scope: 0 violations.');
    process.exit(0);
  }

  console.error(`\ncheck-nexus-scope: ${VIOLATIONS.length} violation(s)\n`);
  const byRule = new Map<string, Violation[]>();
  for (const v of VIOLATIONS) {
    if (!byRule.has(v.rule)) byRule.set(v.rule, []);
    byRule.get(v.rule)!.push(v);
  }
  for (const [rule, list] of byRule) {
    console.error(`── ${rule} (${list.length}) ──`);
    for (const v of list) {
      console.error(`  ${v.file}:${v.line}  ${v.detail}`);
      console.error(`    fix: ${v.hint}`);
    }
    console.error('');
  }
  console.error(`See ${SCOPE_DOC} for the full scope rules.`);
  console.error(`Single-line escape hatch: append // ${ALLOW_MARKER} to the offending line (use sparingly).`);
  process.exit(1);
}

// Only auto-run when invoked directly (e.g. `tsx scripts/check-nexus-scope.ts`),
// not when imported by the regression test suite. We compare import.meta.url
// to the URL form of process.argv[1]; vitest sets argv[1] to its own runner
// binary, so this branch is skipped during test runs.
const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === 'string' &&
  import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main();
}
