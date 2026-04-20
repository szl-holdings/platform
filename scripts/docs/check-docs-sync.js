#!/usr/bin/env node

/**
 * check-docs-sync.js
 *
 * Compares key facts derived from the codebase against the values stated in
 * the canonical diligence documents. Prints warnings when they diverge.
 *
 * Checked dimensions:
 *   1. Route file count   — artifacts/api-server/src/routes/ vs API-SPEC.md
 *   2. DB schema file count — lib/db/src/schema/ vs DATA-MODEL.md
 *   3. DB table count (pgTable declarations) — lib/db/src/schema/ vs DATA-MODEL.md & ARCHITECTURE.md
 *   4. Product surfaces (artifact dirs)  — artifacts/ vs PRODUCT-SURFACES.md
 *
 * Tolerance bands (to avoid noise from trivial churn):
 *   Route file count  : ±10  — one-off route additions shouldn't immediately flag
 *   Schema file count : ±5   — tighter because each schema file is a domain boundary
 *   pgTable count     : ±20  — tables grow quickly; flag only meaningful drift
 *   Product surfaces  : exact match on dir names present in both sources
 *
 * Product-surface note:
 *   PRODUCT-SURFACES.md intentionally lists planned/roadmap surfaces (e.g., mobile
 *   variants like aegis-mobile, lyte-mobile) that don't have artifact dirs yet.
 *   Warnings for those are expected and are valuable signal: they remind the team to
 *   either build the surface or remove it from the doc. Likewise, new artifact dirs
 *   not yet in the doc should be added once they are ready for public visibility.
 *
 * CI integration:
 *   The .github/workflows/ci.yml "docs-sync-check" job runs this script with
 *   continue-on-error: true — it is advisory and never blocks the build.
 *   When GITHUB_STEP_SUMMARY is set (i.e. running in GitHub Actions), a Markdown
 *   summary is written to the job summary panel for easy triage.
 *
 * Always exits 0 (warn-only).
 */

import { execSync } from 'child_process';
import { appendFileSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

// ─── tolerance bands ──────────────────────────────────────────────────────────
// Adjust these if the codebase grows at a pace that creates too much noise.
const TOLERANCE = {
  routeFiles: 10, // flag if stated count differs by more than this many files
  schemaFiles: 5, // tighter — each schema file represents a domain boundary
  pgTables: 20, // tables grow quickly; flag only meaningful drift
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function readDoc(name) {
  try {
    return readFileSync(join(ROOT, name), 'utf8');
  } catch {
    return '';
  }
}

function listTsFiles(dir) {
  try {
    return readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.ts'));
  } catch {
    return [];
  }
}

function listDirs(dir) {
  try {
    const base = join(ROOT, dir);
    return readdirSync(base).filter((f) => {
      try {
        return statSync(join(base, f)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function countPgTables() {
  try {
    const out = execSync('grep -r "= pgTable" lib/db/src/schema/ --include="*.ts" | wc -l', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return parseInt(out.trim(), 10);
  } catch {
    return null;
  }
}

// Extract the first integer that follows `label` within ~120 chars.
// Used to pull stated numbers from markdown text.
function extractNumber(text, label, flags) {
  const re = new RegExp(label + '[^\\d]{0,80}?([\\d,]+)', flags || 'i');
  const m = text.match(re);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

// Write a line to the GitHub Actions step summary (no-op outside of CI).
const GH_SUMMARY = process.env.GITHUB_STEP_SUMMARY || null;
const summaryLines = [];
function summary(line) {
  summaryLines.push(line);
}

// ─── gather live codebase facts ───────────────────────────────────────────────

const routeFiles = listTsFiles('artifacts/api-server/src/routes');
const schemaFiles = listTsFiles('lib/db/src/schema');
const pgTableCount = countPgTables();
const artifactDirs = listDirs('artifacts');

const live = {
  routeFileCount: routeFiles.length,
  schemaFileCount: schemaFiles.length,
  pgTableCount,
  artifactDirs: artifactDirs.slice().sort(),
};

// ─── gather doc-stated facts ──────────────────────────────────────────────────

const apiSpec = readDoc('API-SPEC.md');
const dataModel = readDoc('DATA-MODEL.md');
const architecture = readDoc('ARCHITECTURE.md');
const productSurfaces = readDoc('PRODUCT-SURFACES.md');

// Route file count: API-SPEC.md table row "Route files | 140+ …"
const docRouteFileCount = extractNumber(apiSpec, 'Route files\\s*\\|\\s*');

// Schema file count: DATA-MODEL.md header "112 schema files"
const docSchemaFileCount = extractNumber(dataModel, '(\\d+) schema files');

// pgTable count: DATA-MODEL.md "685 `pgTable` declarations"; ARCHITECTURE.md "644 tables"
const docPgTableCountDataModel = extractNumber(dataModel, '(\\d+) `pgTable` declarations');
const docPgTableCountArch = extractNumber(architecture, '(\\d+) tables');

// Product surfaces: top-level artifact dir names from `artifacts/<name>` backtick
// references in PRODUCT-SURFACES.md. Only single-segment paths are matched so
// sub-paths like `artifacts/api-server/src/routes/…` are ignored.
const artifactPattern = /`artifacts\/([^`/\s]+)`/g;
const docArtifactRefs = [];
let artifactMatch;
while ((artifactMatch = artifactPattern.exec(productSurfaces)) !== null) {
  if (!docArtifactRefs.includes(artifactMatch[1])) {
    docArtifactRefs.push(artifactMatch[1]);
  }
}
docArtifactRefs.sort();

// ─── compare and report ───────────────────────────────────────────────────────

let warnings = 0;
let passes = 0;

function pass(label, detail) {
  passes++;
  console.log('  \u2713  ' + label + (detail ? '  (' + detail + ')' : ''));
  summary('| \u2705 Pass | ' + label + ' | ' + (detail || '') + ' |');
}

function warn(label, detail) {
  warnings++;
  console.warn('  \u26a0  ' + label + (detail ? '  \u2014 ' + detail : ''));
  summary('| \u26a0\ufe0f Warn | ' + label + ' | ' + (detail || '') + ' |');
}

function info(label) {
  console.log('     ' + label);
}

console.log('\n\u2554' + '\u2550'.repeat(62) + '\u2557');
console.log('\u2551            Canonical Docs Sync Check                        \u2551');
console.log('\u255a' + '\u2550'.repeat(62) + '\u255d\n');

summary('## Canonical Docs Sync Check');
summary('');
summary('| Status | Check | Detail |');
summary('|--------|-------|--------|');

// 1. Route file count
console.log('[ Route files \u2014 API-SPEC.md vs artifacts/api-server/src/routes/ ]');
if (docRouteFileCount === null) {
  warn('Could not parse route file count from API-SPEC.md');
} else {
  const diff = Math.abs(live.routeFileCount - docRouteFileCount);
  if (diff > TOLERANCE.routeFiles) {
    warn(
      'Route file count mismatch',
      'API-SPEC.md states ' +
        docRouteFileCount +
        ', codebase has ' +
        live.routeFileCount +
        ' (+' +
        (live.routeFileCount - docRouteFileCount) +
        ')',
    );
    info('Update API-SPEC.md route file count to ' + live.routeFileCount);
  } else {
    pass(
      'Route file count roughly matches',
      'doc: ' + docRouteFileCount + ', actual: ' + live.routeFileCount,
    );
  }
}
console.log();

// 2. Schema file count
console.log('[ Schema files \u2014 DATA-MODEL.md vs lib/db/src/schema/ ]');
if (docSchemaFileCount === null) {
  warn('Could not parse schema file count from DATA-MODEL.md');
} else {
  const diff = Math.abs(live.schemaFileCount - docSchemaFileCount);
  if (diff > TOLERANCE.schemaFiles) {
    warn(
      'Schema file count mismatch',
      'DATA-MODEL.md states ' +
        docSchemaFileCount +
        ', codebase has ' +
        live.schemaFileCount +
        ' (+' +
        (live.schemaFileCount - docSchemaFileCount) +
        ')',
    );
    info('Update DATA-MODEL.md schema file count to ' + live.schemaFileCount);
  } else {
    pass(
      'Schema file count roughly matches',
      'doc: ' + docSchemaFileCount + ', actual: ' + live.schemaFileCount,
    );
  }
}
console.log();

// 3. pgTable count
console.log(
  '[ pgTable declarations \u2014 DATA-MODEL.md & ARCHITECTURE.md vs lib/db/src/schema/ ]',
);
if (live.pgTableCount === null) {
  warn('Could not count pgTable declarations (grep failed)');
} else {
  if (docPgTableCountDataModel !== null) {
    const diff = Math.abs(live.pgTableCount - docPgTableCountDataModel);
    if (diff > TOLERANCE.pgTables) {
      warn(
        'Table count mismatch in DATA-MODEL.md',
        'states ' +
          docPgTableCountDataModel +
          ' pgTable declarations, codebase has ' +
          live.pgTableCount +
          ' (+' +
          (live.pgTableCount - docPgTableCountDataModel) +
          ')',
      );
      info(
        'Update DATA-MODEL.md table counts to reflect ' +
          live.pgTableCount +
          ' total pgTable declarations',
      );
    } else {
      pass(
        'DATA-MODEL.md table count roughly matches',
        'doc: ' + docPgTableCountDataModel + ', actual: ' + live.pgTableCount,
      );
    }
  } else {
    warn('Could not parse pgTable count from DATA-MODEL.md');
  }

  if (docPgTableCountArch !== null) {
    const diff = Math.abs(live.pgTableCount - docPgTableCountArch);
    if (diff > TOLERANCE.pgTables) {
      warn(
        'Table count mismatch in ARCHITECTURE.md',
        'states ' +
          docPgTableCountArch +
          ' tables, codebase has ' +
          live.pgTableCount +
          ' (+' +
          (live.pgTableCount - docPgTableCountArch) +
          ')',
      );
      info('Update ARCHITECTURE.md table count to ' + live.pgTableCount);
    } else {
      pass(
        'ARCHITECTURE.md table count roughly matches',
        'doc: ' + docPgTableCountArch + ', actual: ' + live.pgTableCount,
      );
    }
  }
}
console.log();

// 4. Product surfaces
// Note: PRODUCT-SURFACES.md intentionally lists planned (not-yet-built) surfaces such
// as mobile variants (aegis-mobile, lyte-mobile, etc.). Warnings for those are expected
// until the surfaces are built. Conversely, new artifact dirs not yet in the doc should
// be added once the surface is ready for public visibility.
console.log('[ Product surfaces \u2014 PRODUCT-SURFACES.md vs artifacts/ directory ]');
if (docArtifactRefs.length === 0) {
  warn('No artifact references found in PRODUCT-SURFACES.md (no `artifacts/<name>` patterns)');
} else {
  const inDocNotCode = docArtifactRefs.filter((d) => !live.artifactDirs.includes(d));
  const inCodeNotDoc = live.artifactDirs.filter((a) => !docArtifactRefs.includes(a));

  if (inDocNotCode.length > 0) {
    warn(
      'PRODUCT-SURFACES.md references artifact dirs that do not exist in codebase (may be planned/roadmap)',
      inDocNotCode.join(', '),
    );
    info('If planned: leave as-is. If removed: delete from PRODUCT-SURFACES.md.');
  }
  if (inCodeNotDoc.length > 0) {
    warn('New artifact dirs not yet mentioned in PRODUCT-SURFACES.md', inCodeNotDoc.join(', '));
    info('Consider adding these surfaces to PRODUCT-SURFACES.md once they are production-ready');
  }
  if (inDocNotCode.length === 0 && inCodeNotDoc.length === 0) {
    pass('All artifact dirs are reflected in PRODUCT-SURFACES.md');
  }

  console.log();
  info(
    'Artifact dirs in codebase (' + live.artifactDirs.length + '): ' + live.artifactDirs.join(', '),
  );
  info(
    'Artifact refs in PRODUCT-SURFACES.md (' +
      docArtifactRefs.length +
      '): ' +
      docArtifactRefs.join(', '),
  );
}
console.log();

// ─── summary ──────────────────────────────────────────────────────────────────

console.log('\u2501'.repeat(66));
console.log('  Result: ' + passes + ' check(s) passed, ' + warnings + ' warning(s) raised');
if (warnings > 0) {
  console.log('\n  The canonical docs appear to be out of sync with the codebase.');
  console.log('  Please update the relevant .md files to match current reality.');
  console.log('  This check is advisory \u2014 it does not fail the build.\n');
} else {
  console.log('\n  All checked doc facts are consistent with the codebase.\n');
}

// Write GitHub Actions step summary when running in CI.
if (GH_SUMMARY) {
  summary('');
  summary('**Result:** ' + passes + ' passed, ' + warnings + ' warning(s)');
  if (warnings > 0) {
    summary('');
    summary('> The canonical docs appear to be out of sync with the codebase.');
    summary('> Update the relevant `.md` files to resolve warnings. This check is advisory.');
  }
  try {
    appendFileSync(GH_SUMMARY, summaryLines.join('\n') + '\n');
  } catch {
    // Non-fatal: step summary is best-effort
  }
}

// Always exit 0 — this is a warn-only check.
process.exit(0);
