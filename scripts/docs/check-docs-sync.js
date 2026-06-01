#!/usr/bin/env node

/**
 * check-docs-sync.js
 *
 * Compares key facts derived from the codebase against the values stated in
 * the canonical diligence documents. Prints warnings when they diverge.
 *
 * Usage:
 *   node scripts/docs/check-docs-sync.js          # warn-only (default)
 *   node scripts/docs/check-docs-sync.js --fix    # rewrite drifted values in-place
 *
 * --fix mode:
 *   Rewrites all drifted numeric metric values directly in the doc files so
 *   that a subsequent check run produces zero warnings.  Product-surface lists
 *   are NOT auto-edited because PRODUCT-SURFACES.md intentionally includes
 *   planned/roadmap surfaces that have no artifact dir yet.
 *   docs/metrics-reference.md is also patched for the overlapping metrics
 *   (schema files, pgTable / database tables).
 *
 * Checked dimensions:
 *   1. Route file count   — artifacts/api-server/src/routes/ vs API-SPEC.md
 *   2. DB schema file count — lib/db/src/schema/ vs DATA-MODEL.md
 *   3. DB table count (pgTable declarations) — lib/db/src/schema/ vs DATA-MODEL.md & ARCHITECTURE.md
 *   4. Product surfaces (artifact dirs)  — artifacts/ vs PRODUCT-SURFACES.md
 *   5. Total endpoint count (router.* calls) — artifacts/api-server/src/routes/ vs API-SPEC.md
 *   6. GraphQL type count — artifacts/api-server/src/graphql/ vs API-SPEC.md
 *
 * Tolerance bands (to avoid noise from trivial churn):
 *   Route file count  : ±10  — one-off route additions shouldn't immediately flag
 *   Schema file count : ±5   — tighter because each schema file is a domain boundary
 *   pgTable count     : ±20  — tables grow quickly; flag only meaningful drift
 *   Product surfaces  : exact match on dir names present in both sources
 *   Endpoint count    : ±500 — endpoint numbers grow fast; flag only large drift
 *   GraphQL types     : ±30  — type count grows steadily; flag meaningful drift
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
 *   To auto-fix drift in CI, run: node scripts/docs/check-docs-sync.js --fix
 *   When GITHUB_STEP_SUMMARY is set (i.e. running in GitHub Actions), a Markdown
 *   summary is written to the job summary panel for easy triage.
 *
 * Always exits 0 (warn-only).
 */

import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

const FIX_MODE = process.argv.includes('--fix');
const HELP_MODE = process.argv.includes('--help') || process.argv.includes('-h');

if (HELP_MODE) {
  process.exit(0);
}

// ─── tolerance bands ──────────────────────────────────────────────────────────
// Adjust these if the codebase grows at a pace that creates too much noise.
const TOLERANCE = {
  routeFiles: 10, // flag if stated count differs by more than this many files
  schemaFiles: 5, // tighter — each schema file represents a domain boundary
  pgTables: 20, // tables grow quickly; flag only meaningful drift
  endpointCount: 500, // endpoint numbers grow fast; flag only large drift
  graphqlTypes: 30, // type count grows steadily; flag meaningful drift
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function readDoc(name) {
  try {
    return readFileSync(join(ROOT, name), 'utf8');
  } catch {
    return '';
  }
}

function writeDoc(name, content) {
  const fullPath = join(ROOT, name);
  if (!existsSync(fullPath)) return false;
  try {
    writeFileSync(fullPath, content, 'utf8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Replace the first occurrence of `numericPattern` in `content` with `liveValue`.
 *
 * `numericPattern` must be a regex string with exactly TWO capture groups:
 *   - group 1: the text immediately before the number (preserved verbatim)
 *   - group 2: the text immediately after the number (preserved verbatim)
 * The number between the two groups is replaced with `liveValue`.
 *
 * Example:
 *   patchNumber(content, '(Route files\\s*\\|\\s*)(\\d[\\d,+]*)(...)', 150)
 */
function patchNumber(content, numericPattern, liveValue) {
  const re = new RegExp(numericPattern, 'i');
  return content.replace(re, (_match, pre, _old, post) => pre + String(liveValue) + post);
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

function countEndpoints() {
  try {
    const out = execSync(
      'grep -r "router\\.\\(get\\|post\\|put\\|patch\\|delete\\)" artifacts/api-server/src/routes/ --include="*.ts" | wc -l',
      { cwd: ROOT, encoding: 'utf8' },
    );
    return parseInt(out.trim(), 10);
  } catch {
    return null;
  }
}

function countGraphqlTypes() {
  try {
    const out = execSync(
      'grep -rE "^\\s*(type|input|enum|interface)\\s+[A-Z][A-Za-z0-9_]*(\\s|\\{)" artifacts/api-server/src/graphql/ --include="*.ts" | wc -l',
      { cwd: ROOT, encoding: 'utf8' },
    );
    return parseInt(out.trim(), 10);
  } catch {
    return null;
  }
}

// Extract the first integer that follows `label` within ~120 chars.
// Used to pull stated numbers from markdown text.
function extractNumber(text, label, flags) {
  const re = new RegExp(`${label}[^\\d]{0,80}?([\\d,]+)`, flags || 'i');
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
const endpointCount = countEndpoints();
const graphqlTypeCount = countGraphqlTypes();

const live = {
  routeFileCount: routeFiles.length,
  schemaFileCount: schemaFiles.length,
  pgTableCount,
  artifactDirs: artifactDirs.slice().sort(),
  endpointCount,
  graphqlTypeCount,
};

// ─── gather doc-stated facts ──────────────────────────────────────────────────

let apiSpec = readDoc('API-SPEC.md');
let dataModel = readDoc('DATA-MODEL.md');
let architecture = readDoc('ARCHITECTURE.md');
const productSurfaces = readDoc('PRODUCT-SURFACES.md');
let metricsRef = readDoc('docs/metrics-reference.md');

// Route file count: API-SPEC.md table row "Route files | 140+ …"
const docRouteFileCount = extractNumber(apiSpec, 'Route files\\s*\\|\\s*');

// Total endpoint count: API-SPEC.md table row "Total endpoints | 2,300 …"
const docEndpointCount = extractNumber(apiSpec, 'Total endpoints\\s*\\|\\s*');

// GraphQL type count: API-SPEC.md table row "GraphQL types | 120 …"
const docGraphqlTypeCount = extractNumber(apiSpec, 'GraphQL types\\s*\\|\\s*');

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
let fixes = 0;

function pass(label, detail) {
  passes++;
  summary(`| \u2705 Pass | ${label} | ${detail || ''} |`);
}

function warn(label, detail) {
  warnings++;
  summary(`| \u26a0\ufe0f Warn | ${label} | ${detail || ''} |`);
}

function fixed(label, detail) {
  fixes++;
  summary(`| \u270e Fix | ${label} | ${detail || ''} |`);
}

function info(_label) {
}

const _modeLabel = FIX_MODE ? ' [--fix]' : '';

summary(`## Canonical Docs Sync Check${FIX_MODE ? ' (--fix mode)' : ''}`);
summary('');
summary('| Status | Check | Detail |');
summary('|--------|-------|--------|');
if (docRouteFileCount === null) {
  warn('Could not parse route file count from API-SPEC.md');
} else {
  const diff = Math.abs(live.routeFileCount - docRouteFileCount);
  if (diff > TOLERANCE.routeFiles) {
    if (FIX_MODE) {
      // Pattern: prefix group = "Route files | ", number group = digits/commas, suffix group = rest
      const patched = patchNumber(
        apiSpec,
        '(Route files\\s*\\|\\s*)([\\d,+]+)()',
        live.routeFileCount,
      );
      if (patched !== apiSpec && writeDoc('API-SPEC.md', patched)) {
        apiSpec = patched;
        fixed(
          'Route file count updated in API-SPEC.md',
          `${docRouteFileCount} \u2192 ${live.routeFileCount}`,
        );
      } else {
        warn(
          'Route file count mismatch (could not auto-fix)',
          `API-SPEC.md states ${docRouteFileCount}, codebase has ${live.routeFileCount}`,
        );
      }
    } else {
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
      info(`Run with --fix to update API-SPEC.md route file count to ${live.routeFileCount}`);
    }
  } else {
    pass(
      'Route file count roughly matches',
      `doc: ${docRouteFileCount}, actual: ${live.routeFileCount}`,
    );
  }
}
if (docSchemaFileCount === null) {
  warn('Could not parse schema file count from DATA-MODEL.md');
} else {
  const diff = Math.abs(live.schemaFileCount - docSchemaFileCount);
  if (diff > TOLERANCE.schemaFiles) {
    if (FIX_MODE) {
      // Pattern: number is BEFORE "schema files"
      const patched = patchNumber(
        dataModel,
        '()(\\d[\\d,]*)( schema files)',
        live.schemaFileCount,
      );
      if (patched !== dataModel && writeDoc('DATA-MODEL.md', patched)) {
        dataModel = patched;
        fixed(
          'Schema file count updated in DATA-MODEL.md',
          `${docSchemaFileCount} \u2192 ${live.schemaFileCount}`,
        );
      } else {
        warn(
          'Schema file count mismatch (could not auto-fix)',
          `DATA-MODEL.md states ${docSchemaFileCount}, codebase has ${live.schemaFileCount}`,
        );
      }
      // Also patch docs/metrics-reference.md if it has the same metric
      const docMetricsSchemaCount = extractNumber(metricsRef, '\\*\\*Schema files\\*\\*\\s*\\|\\s*');
      if (docMetricsSchemaCount !== null && docMetricsSchemaCount !== live.schemaFileCount) {
        const patchedMetrics = patchNumber(
          metricsRef,
          '(\\*\\*Schema files\\*\\*\\s*\\|\\s*)([\\d,]+)()',
          live.schemaFileCount,
        );
        if (patchedMetrics !== metricsRef && writeDoc('docs/metrics-reference.md', patchedMetrics)) {
          metricsRef = patchedMetrics;
          fixed(
            'Schema file count updated in docs/metrics-reference.md',
            `${docMetricsSchemaCount} \u2192 ${live.schemaFileCount}`,
          );
        }
      }
    } else {
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
      info(`Run with --fix to update DATA-MODEL.md schema file count to ${live.schemaFileCount}`);
    }
  } else {
    pass(
      'Schema file count roughly matches',
      `doc: ${docSchemaFileCount}, actual: ${live.schemaFileCount}`,
    );
  }
}
if (live.pgTableCount === null) {
  warn('Could not count pgTable declarations (grep failed)');
} else {
  if (docPgTableCountDataModel !== null) {
    const diff = Math.abs(live.pgTableCount - docPgTableCountDataModel);
    if (diff > TOLERANCE.pgTables) {
      if (FIX_MODE) {
        // Pattern: number is BEFORE "`pgTable` declarations"
        const patched = patchNumber(
          dataModel,
          '()(\\d[\\d,]*)( `pgTable` declarations)',
          live.pgTableCount,
        );
        if (patched !== dataModel && writeDoc('DATA-MODEL.md', patched)) {
          dataModel = patched;
          fixed(
            'pgTable count updated in DATA-MODEL.md',
            `${docPgTableCountDataModel} \u2192 ${live.pgTableCount}`,
          );
        } else {
          warn(
            'Table count mismatch in DATA-MODEL.md (could not auto-fix)',
            `states ${docPgTableCountDataModel} pgTable declarations, codebase has ${live.pgTableCount}`,
          );
        }
        // Also patch docs/metrics-reference.md "Database tables" row
        const docMetricsTableCount = extractNumber(metricsRef, '\\*\\*Database tables\\*\\*\\s*\\|\\s*');
        if (docMetricsTableCount !== null && docMetricsTableCount !== live.pgTableCount) {
          const patchedMetrics = patchNumber(
            metricsRef,
            '(\\*\\*Database tables\\*\\*\\s*\\|\\s*)([\\d,]+)()',
            live.pgTableCount,
          );
          if (patchedMetrics !== metricsRef && writeDoc('docs/metrics-reference.md', patchedMetrics)) {
            metricsRef = patchedMetrics;
            fixed(
              'Database table count updated in docs/metrics-reference.md',
              `${docMetricsTableCount} \u2192 ${live.pgTableCount}`,
            );
          }
        }
      } else {
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
          'Run with --fix to update DATA-MODEL.md table counts to reflect ' +
            live.pgTableCount +
            ' total pgTable declarations',
        );
      }
    } else {
      pass(
        'DATA-MODEL.md table count roughly matches',
        `doc: ${docPgTableCountDataModel}, actual: ${live.pgTableCount}`,
      );
    }
  } else {
    warn('Could not parse pgTable count from DATA-MODEL.md');
  }

  if (docPgTableCountArch !== null) {
    const diff = Math.abs(live.pgTableCount - docPgTableCountArch);
    if (diff > TOLERANCE.pgTables) {
      if (FIX_MODE) {
        // Pattern: number is BEFORE " tables"
        const patched = patchNumber(
          architecture,
          '()(\\d[\\d,]*)( tables)',
          live.pgTableCount,
        );
        if (patched !== architecture && writeDoc('ARCHITECTURE.md', patched)) {
          architecture = patched;
          fixed(
            'Table count updated in ARCHITECTURE.md',
            `${docPgTableCountArch} \u2192 ${live.pgTableCount}`,
          );
        } else {
          warn(
            'Table count mismatch in ARCHITECTURE.md (could not auto-fix)',
            `states ${docPgTableCountArch} tables, codebase has ${live.pgTableCount}`,
          );
        }
      } else {
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
        info(`Run with --fix to update ARCHITECTURE.md table count to ${live.pgTableCount}`);
      }
    } else {
      pass(
        'ARCHITECTURE.md table count roughly matches',
        `doc: ${docPgTableCountArch}, actual: ${live.pgTableCount}`,
      );
    }
  }
}
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
    if (FIX_MODE) {
      info('(product-surface list not auto-edited — planned entries must be preserved manually)');
    }
  }
  if (inCodeNotDoc.length > 0) {
    warn('New artifact dirs not yet mentioned in PRODUCT-SURFACES.md', inCodeNotDoc.join(', '));
    info('Consider adding these surfaces to PRODUCT-SURFACES.md once they are production-ready');
    if (FIX_MODE) {
      info('(product-surface list not auto-edited — review new surfaces before publishing)');
    }
  }
  if (inDocNotCode.length === 0 && inCodeNotDoc.length === 0) {
    pass('All artifact dirs are reflected in PRODUCT-SURFACES.md');
  }
  info(
    `Artifact dirs in codebase (${live.artifactDirs.length}): ${live.artifactDirs.join(', ')}`,
  );
  info(
    'Artifact refs in PRODUCT-SURFACES.md (' +
      docArtifactRefs.length +
      '): ' +
      docArtifactRefs.join(', '),
  );
}
if (live.endpointCount === null) {
  warn('Could not count endpoint declarations (grep failed)');
} else if (docEndpointCount === null) {
  warn('Could not parse total endpoint count from API-SPEC.md');
} else {
  const diff = Math.abs(live.endpointCount - docEndpointCount);
  if (diff > TOLERANCE.endpointCount) {
    warn(
      'Total endpoint count mismatch',
      'API-SPEC.md states ' +
        docEndpointCount +
        ', codebase has ' +
        live.endpointCount +
        ' (' +
        (live.endpointCount > docEndpointCount ? '+' : '') +
        (live.endpointCount - docEndpointCount) +
        ')',
    );
    info(`Update API-SPEC.md total endpoint count to ${live.endpointCount}`);
  } else {
    pass(
      'Total endpoint count roughly matches',
      `doc: ${docEndpointCount}, actual: ${live.endpointCount}`,
    );
  }
}
if (live.graphqlTypeCount === null) {
  warn('Could not count GraphQL type definitions (grep failed)');
} else if (docGraphqlTypeCount === null) {
  warn('Could not parse GraphQL type count from API-SPEC.md');
} else {
  const diff = Math.abs(live.graphqlTypeCount - docGraphqlTypeCount);
  if (diff > TOLERANCE.graphqlTypes) {
    warn(
      'GraphQL type count mismatch',
      'API-SPEC.md states ' +
        docGraphqlTypeCount +
        ', codebase has ' +
        live.graphqlTypeCount +
        ' (' +
        (live.graphqlTypeCount > docGraphqlTypeCount ? '+' : '') +
        (live.graphqlTypeCount - docGraphqlTypeCount) +
        ')',
    );
    info(`Update API-SPEC.md GraphQL type count to ${live.graphqlTypeCount}`);
  } else {
    pass(
      'GraphQL type count roughly matches',
      `doc: ${docGraphqlTypeCount}, actual: ${live.graphqlTypeCount}`,
    );
  }
}
const resultParts = [`${passes} check(s) passed`, `${warnings} warning(s) raised`];
if (FIX_MODE) resultParts.push(`${fixes} fix(es) applied`);

if (FIX_MODE && fixes > 0) {
}
if (warnings > 0) {
  if (!FIX_MODE) {
  }
} else {
  if (FIX_MODE && fixes > 0) {
  } else {
  }
}

// Write GitHub Actions step summary when running in CI.
if (GH_SUMMARY) {
  summary('');
  const summaryResult = resultParts.join(', ');
  summary(`**Result:** ${summaryResult}`);
  if (warnings > 0) {
    summary('');
    summary('> The canonical docs appear to be out of sync with the codebase.');
    if (!FIX_MODE) {
      summary('> Run `node scripts/docs/check-docs-sync.js --fix` to auto-correct numeric values.');
      summary('> Product-surface lists must be reviewed and updated manually.');
    } else {
      summary('> Update the remaining `.md` files to resolve warnings. This check is advisory.');
    }
  }
  try {
    appendFileSync(GH_SUMMARY, `${summaryLines.join('\n')}\n`);
  } catch {
    // Non-fatal: step summary is best-effort
  }
}

// Always exit 0 — this is a warn-only check.
process.exit(0);
