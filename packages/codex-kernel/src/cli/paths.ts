/**
 * Shared path resolution for the codex-kernel CLI binaries.
 *
 * Lives in its own module so `replay.ts` can import the strategy without
 * triggering `run.ts`'s top-level `main()` side-effect.
 */

import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
export const PACKAGE_ROOT = resolve(dirname(__filename), '../..');
export const REPO_ROOT = resolve(PACKAGE_ROOT, '../..');

/**
 * Single shared output-root resolution strategy. Both run and replay use this
 * so `pnpm codex:run` and `pnpm codex:replay` (without explicit args) always
 * agree on where the deliverables live, regardless of cwd.
 *
 * Resolution order:
 *   1. CODEX_OUTPUT_ROOT env var (absolute or cwd-relative; used by tests).
 *   2. REPO_ROOT (the canonical default — `<repo>/output/`).
 */
export function resolveOutputRoot(): string {
  const env_root = process.env.CODEX_OUTPUT_ROOT;
  if (env_root) return resolve(process.cwd(), env_root);
  return REPO_ROOT;
}

/**
 * Resolve a payload-supplied output path against `output_root`, refusing any
 * absolute path or any relative path that would escape the root via `..`.
 * This is the single confinement boundary for file writes — without it a
 * crafted payload could overwrite arbitrary files inside the runner's
 * permission boundary.
 */
export function confineOutput(output_root: string, rel: string): string {
  if (isAbsolute(rel)) {
    throw new Error(`output path '${rel}' must be relative to the output root`);
  }
  const resolved = resolve(output_root, rel);
  const within = relative(output_root, resolved);
  if (within.startsWith('..') || within.startsWith(`..${sep}`) || isAbsolute(within)) {
    throw new Error(
      `output path '${rel}' escapes output root '${output_root}' (resolved: ${resolved})`,
    );
  }
  return resolved;
}
