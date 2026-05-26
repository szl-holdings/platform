/**
 * Shared rules for the org-intelligence "shipped signals" verdict and the
 * excluded-repo promotion probe.
 *
 * Single source of truth so the live audit
 * (`artifacts/api-server/src/routes/org-intelligence.ts`) and the GitHub-Actions
 * promotion probe (`scripts/check-excluded-repo-promotion.mjs`) can never drift.
 * If you change the OPERATIONAL threshold, the source-file extension regex, the
 * real-source-dir regex, or the EXCLUDED_REPOS list, both consumers must pick
 * up the change automatically — that is the whole point of this module.
 *
 * Plain ESM (.mjs) so it is consumable from both Node scripts and the
 * tsx/esbuild-bundled api-server route.
 */

/**
 * Slugs of public org repos that are suppressed from the audit board.
 * Re-promotion path: delete the slug from this set the moment the public repo
 * ships at least OPERATIONAL_THRESHOLD source files in real source dirs.
 */
export const EXCLUDED_REPOS = ['vsp-otel'];

/**
 * Number of source files (in real source dirs) required for the OPERATIONAL
 * verdict.
 */
export const OPERATIONAL_THRESHOLD = 3;

/**
 * Extensions that count as "source code" for the OPERATIONAL verdict.
 */
export const SOURCE_EXTS = /\.(ts|tsx|js|mjs|cjs|py|lean|rs|go|java)$/i;

/**
 * Path prefixes that count as "real source dirs" (i.e. not .github/ workflows
 * or top-level README scaffolding).
 */
export const REAL_SOURCE_DIRS = /^(src\/|runtime\/|agentic\/|packages\/|papers\/|runs\/|Lutar\/|skills\/)/;

/**
 * True iff the given tree-entry path counts as a source file in a real source
 * dir. Use this from both the audit route and the promotion probe so the
 * predicate is defined exactly once.
 *
 * @param {string} path
 * @returns {boolean}
 */
export function isRealSourceFile(path) {
  return SOURCE_EXTS.test(path) && REAL_SOURCE_DIRS.test(path);
}
