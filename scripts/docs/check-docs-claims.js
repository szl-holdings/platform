#!/usr/bin/env node
/**
 * check-docs-claims.js
 *
 * Strict validator for specific, high-risk documentation claims.
 * Unlike check-docs-sync.js (which is advisory), this script FAILS with a
 * non-zero exit code when a documented claim no longer matches the codebase.
 *
 * This prevents small code changes (a renamed role, a new CSRF exemption, a
 * removed middleware file) from silently invalidating investor or enterprise
 * diligence documents such as API-SPEC.md, ACCESS-CONTROL-MATRIX.md, and
 * SECURITY-CHECKLIST.md.
 *
 * Checks performed:
 *   1. Platform role enum   — ACCESS-CONTROL-MATRIX.md vs lib/db/src/schema/auth.ts
 *   2. Roles-table enum     — ACCESS-CONTROL-MATRIX.md vs lib/db/src/schema/auth.ts
 *   3. CSRF primitives      — docs/API-SPEC.md claims vs packages/auth-shared
 *   4. Public route policy  — Ouroboros prefix vs global auth enforcer
 *   5. Route module         — documented tracked route module exists
 *   6. Referenced files     — SECURITY-CHECKLIST.md file references exist on disk
 *   7. Referenced DB tables — SECURITY-CHECKLIST.md / ACCESS-CONTROL-MATRIX.md table
 *                             names exist in lib/db/src/schema/ as pgTable declarations
 *
 * CI integration:
 *   The .github/workflows/ci.yml "docs-claims-check" job runs this script.
 *   It has NO continue-on-error — a failure here blocks the PR merge.
 *   When GITHUB_STEP_SUMMARY is set a Markdown summary is written for triage.
 *
 * Exits 0 on full pass, 1 on any failure.
 */

import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

// ─── helpers ──────────────────────────────────────────────────────────────────

function readFile(relPath) {
  const abs = join(ROOT, relPath);
  try {
    return readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

function fileExists(relPath) {
  return existsSync(join(ROOT, relPath));
}

// Extract all quoted strings from a TypeScript enum array literal.
// Handles both single and double quotes and multiline arrays:
//   fieldName: text("col_name", { enum: ["a", "b"] })
//   fieldName: text('col_name', { enum: ['a',
//                                         'b'] })
// Pass the column name string as it appears (unquoted) in text("col_name", ...).
function extractTsEnumValues(src, colName) {
  const escaped = colName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`['"]${escaped}['"]\\s*,\\s*\\{[^}]*enum:\\s*\\[([^\\]]+)\\]`, 's');
  const m = src.match(re);
  if (!m) return null;
  const items = m[1].match(/['"]([^'"]+)['"]/g);
  if (!items) return [];
  return items.map((s) => s.replace(/['"]/g, ''));
}

// Extract backtick-quoted identifiers from the first column of markdown table rows
// within a section. Stops at the next heading of any level (##, ###, etc.).
// Designed to pull role enum values from tables like:
//   | `founder_admin` | Full platform access |
function extractTableFirstColRoles(mdText, sectionHeading) {
  const idx = mdText.indexOf(sectionHeading);
  if (idx === -1) return null;
  // Stop at the next heading line (any level: ##, ###, ####) that is NOT the heading itself
  const afterHeading = mdText.slice(idx + sectionHeading.length);
  const nextHeadingMatch = afterHeading.match(/\n#{2,}\s/);
  const slice = nextHeadingMatch ? afterHeading.slice(0, nextHeadingMatch.index) : afterHeading;
  // Match table rows: | `identifier` | ...
  const rows = slice.match(/^\|\s*`([a-z][a-z0-9_]*)`\s*\|/gm);
  if (!rows) return [];
  return [...new Set(rows.map((r) => r.match(/`([a-z][a-z0-9_]*)`/)[1]))];
}

// ─── GitHub Actions step summary ──────────────────────────────────────────────

const GH_SUMMARY = process.env.GITHUB_STEP_SUMMARY || null;
const summaryLines = [];
function addSummary(line) {
  summaryLines.push(line);
}

// ─── result tracking ──────────────────────────────────────────────────────────

let failures = 0;
let passes = 0;

function pass(label, detail) {
  passes++;
  const msg = `  \u2713  ${label}${detail ? `  (${detail})` : ''}`;
  console.log(msg);
  addSummary(`| \u2705 Pass | ${label} | ${detail || ''} |`);
}

function fail(label, detail) {
  failures++;
  const msg = `  \u2717  ${label}${detail ? `\n       \u21b3 ${detail}` : ''}`;
  console.error(msg);
  addSummary(`| \u274c Fail | ${label} | ${detail || ''} |`);
}

function skip(label, reason) {
  const msg = `  \u2014  ${label} (skipped: ${reason})`;
  console.log(msg);
  addSummary(`| \u23ed Skip | ${label} | ${reason} |`);
}

function section(title) {
  console.log(`\n── ${title}`);
}

// ─── load source files ────────────────────────────────────────────────────────

const authSchema = readFile('lib/db/src/schema/auth.ts');
const csrfMiddleware = readFile('packages/auth-shared/src/server/csrf.ts');
const globalAuthEnforcer = readFile('artifacts/api-server/src/middlewares/global-auth-enforcer.ts');
const ouroborosRoutes = readFile('artifacts/api-server/src/routes/ouroboros.ts');
const accessMatrix = readFile('ACCESS-CONTROL-MATRIX.md');
const apiSpec = readFile('docs/API-SPEC.md');
const _securityChecklist = readFile('SECURITY-CHECKLIST.md');

addSummary('## Strict Documentation Claims Check');
addSummary('');
addSummary('| Status | Check | Detail |');
addSummary('|--------|-------|--------|');

// ─── CHECK 1: Platform role enum ──────────────────────────────────────────────
// ACCESS-CONTROL-MATRIX.md §"Platform Roles" must match the platform_role enum
// in lib/db/src/schema/auth.ts usersTable.

section('Platform roles — ACCESS-CONTROL-MATRIX.md vs lib/db/src/schema/auth.ts');

if (!authSchema) {
  fail('Cannot read lib/db/src/schema/auth.ts', 'file not found or unreadable');
} else if (!accessMatrix) {
  skip(
    'Platform role enum check',
    'ACCESS-CONTROL-MATRIX.md not found — create the file to enable this check',
  );
} else {
  const liveRoles = extractTsEnumValues(authSchema, 'platform_role');
  if (!liveRoles || liveRoles.length === 0) {
    fail('Could not parse platform_role enum from auth.ts', 'regex found no match');
  } else {
    const docRoles = extractTableFirstColRoles(accessMatrix, '### Platform Roles');
    if (!docRoles) {
      fail('Could not find "### Platform Roles" section in ACCESS-CONTROL-MATRIX.md');
    } else {
      const inDocNotCode = docRoles.filter((r) => !liveRoles.includes(r));
      const inCodeNotDoc = liveRoles.filter((r) => !docRoles.includes(r));

      if (inDocNotCode.length > 0) {
        fail(
          'ACCESS-CONTROL-MATRIX.md documents platform roles not found in auth.ts enum',
          `Missing from code: ${inDocNotCode.join(', ')}`,
        );
      }
      if (inCodeNotDoc.length > 0) {
        fail(
          'auth.ts platform_role enum has values not documented in ACCESS-CONTROL-MATRIX.md',
          `Undocumented roles: ${inCodeNotDoc.join(', ')}`,
        );
      }
      if (inDocNotCode.length === 0 && inCodeNotDoc.length === 0) {
        pass('Platform role enum matches ACCESS-CONTROL-MATRIX.md', liveRoles.join(', '));
      }
    }
  }
}

// ─── CHECK 2: Roles-table enum ────────────────────────────────────────────────
// ACCESS-CONTROL-MATRIX.md §"Extended Roles Table" lists roles.name enum values.
// These must match rolesTable in auth.ts.

section('Roles-table enum — ACCESS-CONTROL-MATRIX.md §"Extended Roles Table" vs auth.ts');

if (!authSchema) {
  skip('Roles-table enum check', 'auth.ts not readable (see check 1)');
} else if (!accessMatrix) {
  skip('Roles-table enum check', 'ACCESS-CONTROL-MATRIX.md not readable (see check 1)');
} else {
  // The rolesTable name enum: name: text("name", { enum: [...] })
  const liveRoles = extractTsEnumValues(authSchema, 'name');
  if (!liveRoles) {
    fail('Could not parse rolesTable name enum from auth.ts', 'regex found no match');
  } else {
    // Extract from the "Roles include: …" sentence in the Extended Roles Table section.
    // That sentence enumerates every role — targeting it avoids picking up table/schema
    // names (like `roles`, `user_roles`) that appear in surrounding prose.
    const rolesIncludeLine = (() => {
      const idx = accessMatrix.indexOf('Extended Roles Table');
      if (idx === -1) return null;
      const slice = accessMatrix.slice(idx, idx + 1000);
      return slice.split('\n').find((l) => l.includes('Roles include:')) || null;
    })();

    if (!rolesIncludeLine) {
      fail(
        'Could not find "Roles include:" sentence in Extended Roles Table section of ACCESS-CONTROL-MATRIX.md',
      );
    }

    // Extract only the portion of the line that comes AFTER "Roles include:" so that
    // table/schema names mentioned earlier in the same sentence are not captured.
    const docRoles = rolesIncludeLine
      ? (() => {
          const afterMarker = rolesIncludeLine.slice(
            rolesIncludeLine.indexOf('Roles include:') + 'Roles include:'.length,
          );
          return (afterMarker.match(/`([a-z][a-z0-9_]+)`/g) || []).map((s) => s.replace(/`/g, ''));
        })()
      : [];

    if (docRoles.length === 0) {
      fail(
        'Could not extract role names from "Extended Roles Table" section',
        'no backtick-quoted role identifiers found in the "Roles include:" sentence',
      );
    } else {
      const inDocNotCode = docRoles.filter((r) => !liveRoles.includes(r));
      const inCodeNotDoc = liveRoles.filter((r) => !docRoles.includes(r));

      if (inDocNotCode.length > 0) {
        fail(
          'ACCESS-CONTROL-MATRIX.md Extended Roles Table lists roles absent from auth.ts',
          `Missing from code: ${inDocNotCode.join(', ')}`,
        );
      }
      if (inCodeNotDoc.length > 0) {
        fail(
          'auth.ts rolesTable has values not listed in ACCESS-CONTROL-MATRIX.md Extended Roles Table',
          `Undocumented: ${inCodeNotDoc.join(', ')}`,
        );
      }
      if (inDocNotCode.length === 0 && inCodeNotDoc.length === 0) {
        pass('Roles-table enum matches ACCESS-CONTROL-MATRIX.md', liveRoles.join(', '));
      }
    }
  }
}

// ─── CHECK 3: CSRF primitives ─────────────────────────────────────────────────
// The current API spec claims only helpers proven by the tracked package.

section('CSRF primitives — docs/API-SPEC.md vs packages/auth-shared');
const DOCUMENTED_CSRF_PRIMITIVES = [
  { desc: 'safe-method classification', pattern: /function isSafeMethod\(/ },
  { desc: 'timing-safe pair comparison', pattern: /function csrfTimingSafeEqual\(/ },
  { desc: 'double-submit pair validation', pattern: /function validateCsrfPair\(/ },
  { desc: 'cookie options factory', pattern: /function csrfCookieOptions\(/ },
];

if (!csrfMiddleware) {
  fail('Cannot read packages/auth-shared/src/server/csrf.ts', 'file not found or unreadable');
} else if (!apiSpec) {
  fail('Cannot read docs/API-SPEC.md', 'file not found or unreadable');
} else {
  for (const { desc, pattern } of DOCUMENTED_CSRF_PRIMITIVES) {
    if (pattern.test(csrfMiddleware)) pass(`CSRF primitive present: ${desc}`);
    else fail('Documented CSRF primitive not found', desc);
  }
}

// ─── CHECK 4: Public route policy ─────────────────────────────────────────────

section('Public route policy — Ouroboros prefix vs global auth enforcer');

if (!globalAuthEnforcer) {
  fail(
    'Cannot read artifacts/api-server/src/middlewares/global-auth-enforcer.ts',
    'file not found or unreadable',
  );
} else if (/"\/api\/ouroboros\/"/.test(globalAuthEnforcer)) {
  pass('Documented Ouroboros public prefix is present');
} else {
  fail('Documented Ouroboros public prefix is absent from global auth enforcer');
}

// ─── CHECK 5: Tracked route module ────────────────────────────────────────────

section('Tracked route module — docs/API-SPEC.md vs repository tree');

if (!ouroborosRoutes) {
  fail('Cannot read artifacts/api-server/src/routes/ouroboros.ts', 'file not found or unreadable');
} else {
  pass('Tracked Ouroboros route module exists');
}

// ─── CHECK 6: Referenced files exist ─────────────────────────────────────────
// SECURITY-CHECKLIST.md cites specific source files as evidence for controls.
// Verify those files exist on disk.

section('Referenced source files — SECURITY-CHECKLIST.md evidence files exist on disk');

const SECURITY_REFERENCED_FILES = [
  'apps/alloy-runtime-api/src/middleware/auth.ts',
  'apps/alloy-embedding-api/src/middleware/auth.ts',
  'packages/auth-shared/src/server/csrf.ts',
  'packages/auth-shared/src/client/csrf.ts',
  'artifacts/api-server/src/middlewares/global-auth-enforcer.ts',
  'artifacts/api-server/src/routes/ouroboros.ts',
  'lib/db/src/schema/auth.ts',
  'lib/db/src/schema/rag_knowledge.ts',
];

for (const relPath of SECURITY_REFERENCED_FILES) {
  if (fileExists(relPath)) {
    pass(`File exists: ${relPath}`);
  } else {
    fail(
      'File referenced in SECURITY-CHECKLIST.md no longer exists',
      `${relPath} — update SECURITY-CHECKLIST.md evidence column if the file was moved or renamed`,
    );
  }
}

// ─── CHECK 7: Referenced DB tables exist in schema ───────────────────────────
// SECURITY-CHECKLIST.md and ACCESS-CONTROL-MATRIX.md reference specific table
// names. Verify each is declared as a pgTable in lib/db/src/schema/.

section('DB table references — docs-cited table names exist in lib/db/src/schema/');

// Map: table name → which doc cited it.
const DOCUMENTED_TABLES = {
  sessions: 'ACCESS-CONTROL-MATRIX.md (session management)',
  users: 'ACCESS-CONTROL-MATRIX.md / SECURITY-CHECKLIST.md',
  roles: 'ACCESS-CONTROL-MATRIX.md (roles-table section)',
  user_roles: 'ACCESS-CONTROL-MATRIX.md (user_roles join)',
  rag_knowledge_chunks: 'SECURITY-CHECKLIST.md (T6 — tenant isolation migration)',
};

for (const [tableName, citation] of Object.entries(DOCUMENTED_TABLES)) {
  // pgTable("table_name", ...) — search across schema files via string presence in auth.ts
  // and a wider grep-like scan via reading all schema TS files is expensive here;
  // instead we rely on each table being grep-able via a known pattern in the schema dir.
  // We do a direct string search across all .ts files we can find via require patterns.
  // Since we can't do a true recursive grep here, we search through known schema file paths
  // and the main auth.ts that we already loaded.

  // Accept both single-quoted and double-quoted table names in pgTable() declarations
  const doubleQuoted = `"${tableName}"`;
  const singleQuoted = `'${tableName}'`;
  let found = false;

  // Check in the already-loaded auth.ts
  if (authSchema?.includes(doubleQuoted) || authSchema?.includes(singleQuoted)) {
    found = true;
  }

  // For tables not in auth.ts, check the schema directory directly
  if (!found) {
    const schemaDir = join(ROOT, 'lib/db/src/schema');
    try {
      const files = readdirSync(schemaDir).filter((f) => f.endsWith('.ts'));
      for (const f of files) {
        const content = readFile(`lib/db/src/schema/${f}`);
        if (content?.includes(doubleQuoted) || content?.includes(singleQuoted)) {
          found = true;
          break;
        }
      }
    } catch {
      // fallback: accept as unknown
    }
  }

  if (found) {
    pass(`Table "${tableName}" exists in schema (cited by ${citation})`);
  } else {
    fail(
      'Documented table not found in lib/db/src/schema/',
      `"${tableName}" — cited by ${citation}. Update docs if table was renamed/removed.`,
    );
  }
}

// ─── CHECK 8: Key route paths ─────────────────────────────────────────────────
// docs/API-SPEC.md §"Current Key Route Paths" lists representative path strings per route
// group. Verify each path appears as a quoted string literal in the named
// route handler file, catching renames/removals before they silently
// invalidate the spec document.

section('Key route paths — docs/API-SPEC.md current table vs route handler files');

/**
 * Parse the "## Current Key Route Paths" table from docs/API-SPEC.md.
 * Returns an array of { group, path, routeFile } objects, or null if the
 * section is not found.
 */
function parseKeyRoutePathsTable(mdText) {
  const sectionMarker = '## Current Key Route Paths';
  const idx = mdText.indexOf(sectionMarker);
  if (idx === -1) return null;
  const afterHeading = mdText.slice(idx + sectionMarker.length);
  // Stop at the next ## heading
  const nextH2 = afterHeading.match(/\n##\s/);
  const slice = nextH2 ? afterHeading.slice(0, nextH2.index) : afterHeading;

  const rows = [];
  for (const line of slice.split('\n')) {
    if (!line.startsWith('|')) continue;
    if (line.includes('---')) continue;
    if (/^\|\s*Group\s*\|/.test(line)) continue;

    const cols = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length < 3) continue;

    const pathMatch = cols[1].match(/`([^`]+)`/);
    const fileMatch = cols[2].match(/`([^`]+)`/);
    if (!pathMatch || !fileMatch) continue;

    rows.push({ group: cols[0], path: pathMatch[1], routeFile: fileMatch[1] });
  }
  return rows;
}

if (!apiSpec) {
  skip('Key route paths check', 'docs/API-SPEC.md not readable (see earlier checks)');
} else {
  const routePathRows = parseKeyRoutePathsTable(apiSpec);
  if (routePathRows === null) {
    fail(
      'Could not find "## Current Key Route Paths" section in docs/API-SPEC.md',
      'Add the section with a table of representative paths and their route files',
    );
  } else if (routePathRows.length === 0) {
    fail(
      'No rows parsed from "## Current Key Route Paths" table in docs/API-SPEC.md',
      'Table must contain at least one data row with path and route-file columns',
    );
  } else {
    const fileCache = new Map();

    for (const { group, path, routeFile } of routePathRows) {
      if (!fileCache.has(routeFile)) {
        fileCache.set(routeFile, readFile(routeFile));
      }
      const src = fileCache.get(routeFile);

      if (!src) {
        fail(
          `Route file listed in API-SPEC.md Key Route Paths not found on disk`,
          `${routeFile} (group: ${group}, path: ${path}) — update API-SPEC.md if the file was moved or renamed`,
        );
        continue;
      }

      // Match the path as a quoted string literal (single or double quotes).
      // The escaped pattern prevents partial matches — '/vessels' will not
      // match '/vessels/:id' because the quote must follow immediately.
      const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`['"]${escaped}['"]`);

      if (pattern.test(src)) {
        pass(`Route path present in handler: ${path}`, routeFile);
      } else {
        fail(
          'Documented route path not found as a string literal in route handler',
          `${path} (group: ${group}) — expected in ${routeFile}. ` +
            'Update API-SPEC.md if the path was renamed or removed.',
        );
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n✗  ${failures} claim(s) failed, ${passes} passed. See above for details.`);
  console.error(
    '   Update ACCESS-CONTROL-MATRIX.md, API-SPEC.md, or SECURITY-CHECKLIST.md to match the codebase.',
  );
} else {
  console.log(`\n✓  All ${passes} claims verified.`);
}

// Write GitHub Actions step summary when running in CI.
if (GH_SUMMARY) {
  addSummary('');
  addSummary(`**Result:** ${passes} passed, ${failures} failure(s)`);
  if (failures > 0) {
    addSummary('');
    addSummary(
      '> **' +
        failures +
        ' documented claim(s) no longer match the codebase.**\n' +
        '> Update API-SPEC.md, ACCESS-CONTROL-MATRIX.md, or SECURITY-CHECKLIST.md\n' +
        '> to match the current implementation, or revert the offending code change.',
    );
  }
  try {
    appendFileSync(GH_SUMMARY, `${summaryLines.join('\n')}\n`);
  } catch {
    // Non-fatal: step summary is best-effort
  }
}

process.exit(failures > 0 ? 1 : 0);
