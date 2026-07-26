#!/usr/bin/env tsx
/**
 * Brand Drift CI Guard
 *
 * Scans all PUBLIC-FACING artifact source files for:
 *   1. Deprecated / renamed strings (sourced from registry.deprecatedStrings)
 *   2. Platform-count claims that contradict registry.metrics.platformCount
 *   3. Stale hardcoded metric claims that have been removed from the registry
 *
 * All brand constants are read directly from @szl-holdings/brand-registry —
 * there is no separate copy of deprecated strings or platform counts in this file.
 *
 * Exit codes:
 *   0  — no drift found
 *   1  — drift found (all violations are printed)
 *
 * Usage:
 *   pnpm brand:check
 *   pnpm brand:check:verbose
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registry } from '../packages/brand-registry/src/index.ts';
import {
  isFrontendPortablePath,
  isIgnoredPortablePath,
  type TrackedPortablePath,
  trackedPortablePath,
} from './brand-paths.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const verbose = process.argv.includes('--verbose');

// ---------------------------------------------------------------------------
// Brand constants — sourced directly from the registry (no hardcoding)
// ---------------------------------------------------------------------------
const _REGISTRY_VERSION = registry.version;
const PLATFORM_COUNT = parseInt(registry.metrics.platformCount.value, 10);

/**
 * Strings loaded from the registry that need special regex handling rather than
 * simple substring matching (to avoid false positives with similar words / APIs).
 */
const PATTERN_HANDLED = new Set(['Alloy Predict', 'Beacon']);

/**
 * Strings that must never appear in public-facing source.
 * Loaded from registry.deprecatedStrings — edit the registry, not this file.
 * Strings in PATTERN_HANDLED are excluded here and checked via DEPRECATED_PATTERNS.
 */
const DEPRECATED_STRINGS_SIMPLE: string[] = registry.deprecatedStrings.filter(
  (s) => !PATTERN_HANDLED.has(s),
);

const DEPRECATED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    // "Alloy Predict" but not "Alloy Predictive" (which is canonical).
    pattern: /\bAlloy Predict\b(?!ive)/g,
    reason: 'Deprecated string: "Alloy Predict" (use "Alloy" or "Alloy Intelligence")',
  },
  {
    // "Beacon" as a product name, but not navigator.sendBeacon or similar Web APIs,
    // and not cybersecurity domain terms like "C2 Beacon", "DNS Beacon",
    // "Cobalt Strike Beacon", or "Beacon interval" (malware C2 beaconing concepts).
    pattern:
      /(?<!send)(?<!\.)(?<!\w)(?<!C2 )(?<!DNS )(?<!Strike )(?<!APT29 )\bBeacon\b(?! interval)(?!\s*\()/g,
    reason: 'Deprecated product name: "Beacon" (canonical name is "Lyte")',
  },
];

/**
 * Deprecated strings that are only flagged in frontend artifact source trees
 * (files under artifacts/ but not api-server).
 * "INCA" was still used as an internal API route name in backend and lib/ packages.
 * These strings are loaded from the registry but applied more narrowly.
 */
const FRONTEND_ONLY_DEPRECATED = new Set(['INCA']);
const FRONTEND_DEPRECATED_STRINGS: string[] = registry.deprecatedStrings.filter(
  (s) => FRONTEND_ONLY_DEPRECATED.has(s) && !PATTERN_HANDLED.has(s),
);

/**
 * Re-filter DEPRECATED_STRINGS_SIMPLE to also exclude frontend-only strings.
 */
const UNIVERSAL_DEPRECATED_STRINGS: string[] = DEPRECATED_STRINGS_SIMPLE.filter(
  (s) => !FRONTEND_ONLY_DEPRECATED.has(s),
);

const STALE_METRIC_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /2\.1B\+\s*Sentiment Data Points/gi,
    reason: 'Stale metric: "2.1B+ Sentiment Data Points" is no longer a published claim.',
  },
  {
    pattern: /4[,.]800\+\s*workflows?\s*\/\s*day/gi,
    reason: 'Stale metric: "4,800+ workflows/day" is no longer a published claim.',
  },
  {
    pattern: /40%\s*lower cloud spend/gi,
    reason: 'Stale metric: "40% lower cloud spend" is no longer a published claim.',
  },
];

const PLATFORM_COUNT_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\b(five|seven|eight|nine|ten)\s+operating\s+companies?\b/gi,
    reason: `Platform count drift: registry says ${PLATFORM_COUNT} operating companies.`,
  },
  {
    pattern: /\b(five|seven|eight|nine|ten)\s+platforms?\b/gi,
    reason: `Platform count drift: registry says ${PLATFORM_COUNT} platforms.`,
  },
];

// ---------------------------------------------------------------------------
// File-system walker config
// ---------------------------------------------------------------------------
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);

const IGNORE_PATHS_EXACT = new Set([
  'node_modules',
  'dist',
  '.git',
  '.local',
  'coverage',
  '.playwright',
  'playwright-report',
  'packages/brand-registry',
  // Third-party adapters and cybersecurity-domain packages — contain external entity names
  // (e.g. "Beacon Capital Partners", "Cobalt Strike C2 Beacon") or legitimate security
  // terminology ("C2 Beacon", "DNS Beacon", beaconing malware concepts) that are NOT the
  // deprecated SZL product codename.
  'lib/services',
  // Sentra pages are cybersecurity domain simulation data — "Beacon" = malware C2 beacon.
  'artifacts/sentra/src/pages',
  // a11oy-runtime workcells include cybersecurity signal labels for demo data.
  'packages/a11oy-runtime/src/data',
  'artifacts/api-server/src/routes',
  'artifacts/api-server/src/lib',
  'artifacts/api-server/src/data',
  'artifacts/api-server/src/scripts',
  'artifacts/api-server/src/services',
  'scripts',
  'lib/ai-engine',
  'lib/cognitive-runtime',
  'lib/cognitive-observability',
  'lib/observability',
  'lib/reflection-engine',
  'lib/memory-fabric',
  'lib/planner',
  'lib/verifier',
  'lib/trace-graph',
  'lib/evals-core',
  'lib/eval-forge',
  'lib/eval-os',
  'lib/replay-core',
  'lib/self-model',
  'lib/skill-library',
  'lib/tool-registry',
  'lib/tool-mesh',
  'lib/prompt-registry',
  'lib/policy-engine',
  'lib/telemetry-standards',
  'lib/nvidia-adapters',
]);

const IGNORE_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  '.local',
  'coverage',
  'playwright-report',
]);

function trackedSourceFiles(): TrackedPortablePath[] {
  const gitExecutable = process.env.GIT_EXECUTABLE ?? 'git';
  const result = spawnSync(
    gitExecutable,
    ['ls-files', '-z', '--', 'artifacts', 'lib', 'packages'],
    {
      cwd: ROOT,
      encoding: 'utf8',
      windowsHide: true,
    },
  );
  if (result.error) {
    throw new Error(`Unable to enumerate tracked brand sources: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`git ls-files failed: ${result.stderr.trim() || `exit ${result.status}`}`);
  }

  return result.stdout
    .split('\0')
    .filter(Boolean)
    .map((rawPath) => trackedPortablePath(ROOT, rawPath))
    .filter((file) => SOURCE_EXTENSIONS.has(extname(file.policyRelativePath)))
    .filter(
      (file) =>
        !isIgnoredPortablePath(file.policyRelativePath, IGNORE_PATHS_EXACT, IGNORE_DIR_NAMES),
    );
}

// ---------------------------------------------------------------------------
// Scan one file
// ---------------------------------------------------------------------------
interface Violation {
  file: string;
  line: number;
  col: number;
  message: string;
}

function scanFile(file: TrackedPortablePath): Violation[] {
  const violations: Violation[] = [];
  const rel = file.policyRelativePath;
  const frontend = isFrontendPortablePath(rel);
  let content: string;
  try {
    content = readFileSync(file.absolutePath, 'utf8');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read tracked brand source "${file.rawRelativePath}": ${detail}`);
  }

  const lines = content.split('\n');

  function check(lineIdx: number, col: number, message: string) {
    violations.push({ file: rel, line: lineIdx + 1, col: col + 1, message });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const dep of UNIVERSAL_DEPRECATED_STRINGS) {
      const idx = line.indexOf(dep);
      if (idx !== -1) {
        check(i, idx, `Deprecated string: "${dep}"`);
      }
    }

    for (const { pattern, reason } of DEPRECATED_PATTERNS) {
      pattern.lastIndex = 0;
      const m = pattern.exec(line);
      if (m) check(i, m.index, reason);
    }

    if (frontend) {
      for (const dep of FRONTEND_DEPRECATED_STRINGS) {
        const idx = line.indexOf(dep);
        if (idx !== -1) {
          check(i, idx, `Deprecated string (frontend): "${dep}"`);
        }
      }
    }

    for (const { pattern, reason } of STALE_METRIC_PATTERNS) {
      pattern.lastIndex = 0;
      const m = pattern.exec(line);
      if (m) check(i, m.index, reason);
    }

    for (const { pattern, reason } of PLATFORM_COUNT_PATTERNS) {
      pattern.lastIndex = 0;
      const m = pattern.exec(line);
      if (m) check(i, m.index, reason);
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Archived / stub artifacts
// ---------------------------------------------------------------------------
// The following artifact directories exist in the repo but have no source
// files (no src/ subdirectory) — they are empty scaffolds or archived builds:
//   artifacts/imperium         — archived; dist-only, no src
//   artifacts/lyte-command-center — archived; dist-only, no src
// They are intentionally not excluded from the walk (they contribute zero
// files), so adding src/ to any of them will automatically be picked up.

const allFiles = trackedSourceFiles();

let totalViolations = 0;
const fileViolations: Array<{ violations: Violation[] }> = [];

for (const file of allFiles) {
  const vs = scanFile(file);
  if (vs.length > 0) {
    totalViolations += vs.length;
    fileViolations.push({ violations: vs });
  }
}

if (verbose) {
}

if (totalViolations === 0) {
  process.exit(0);
} else {
  for (const { violations } of fileViolations) {
    for (const v of violations) {
      // biome-ignore lint/suspicious/noConsole: CI must report the exact file and claim violation.
      console.error(`[brand:check] ${v.file}:${v.line}:${v.col} — ${v.message}`);
    }
  }
  process.exit(1);
}
