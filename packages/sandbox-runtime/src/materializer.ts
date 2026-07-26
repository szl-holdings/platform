/**
 * Sandbox Runtime — Manifest Materializer
 *
 * Takes a Manifest and creates a real workspace directory on the filesystem.
 * All paths are validated as workspace-relative; absolute paths and `..`
 * traversals are rejected. Git repos are cloned via `git clone --depth 1`.
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, normalize, relative, resolve as pathResolve } from 'node:path';
import { promisify } from 'node:util';
import type {
  Manifest,
  ManifestDirEntry,
  ManifestFileEntry,
  ManifestGitRepoEntry,
  ManifestLocalDirEntry,
  ManifestLocalFileEntry,
} from './types.js';

const execFileAsync = promisify(execFile);

export class PathTraversalError extends Error {
  constructor(path: string, workspaceRoot: string) {
    super(
      `Path traversal rejected: '${path}' escapes workspace root '${workspaceRoot}'. ` +
        'All paths must be workspace-relative without ".." or absolute segments.',
    );
    this.name = 'PathTraversalError';
  }
}

/**
 * Validate that `path` stays within `workspaceRoot` using lexical normalisation.
 * Throws PathTraversalError for absolute paths or `..` traversals.
 *
 * **For read/write operations on existing filesystem paths, prefer the async
 * `validateWorkspacePathSafe` which also resolves symlinks via realpath.**
 */
export function validateWorkspacePath(path: string, workspaceRoot: string): string {
  if (isAbsolute(path)) {
    throw new PathTraversalError(path, workspaceRoot);
  }
  const fullPath = normalize(join(workspaceRoot, path));
  const rel = relative(workspaceRoot, fullPath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new PathTraversalError(path, workspaceRoot);
  }
  return fullPath;
}

/**
 * Async, symlink-safe workspace path validator.
 *
 * Performs two containment checks:
 *  1. Lexical (same as `validateWorkspacePath`) — fast, catches `..` and
 *     absolute segments before any I/O.
 *  2. Realpath-based — resolves symlinks via `fs.realpath` on the closest
 *     existing ancestor, then verifies the canonical path is within
 *     `workspaceRoot`. This prevents symlink-based escape attacks where a
 *     cloned or copied workspace entry links outside the sandbox root.
 *
 * @returns The lexically-resolved absolute path (NOT the realpath, so callers
 *   can still create/write the path; the realpath check guards only against
 *   escape via existing symlinks).
 */
export async function validateWorkspacePathSafe(
  path: string,
  workspaceRoot: string,
): Promise<string> {
  // Step 1: Lexical check
  const fullPath = validateWorkspacePath(path, workspaceRoot);

  // Step 2: Realpath-based symlink containment check.
  // Walk up the directory tree until we find an existing ancestor, then resolve
  // its realpath and verify containment.
  let ancestor = fullPath;
  while (!existsSync(ancestor)) {
    const parent = pathResolve(ancestor, '..');
    if (parent === ancestor) break; // filesystem root — stop
    ancestor = parent;
  }
  try {
    const canonicalAncestor = await realpath(ancestor);
    const canonicalRoot = await realpath(workspaceRoot);
    const ancestorRel = relative(canonicalRoot, canonicalAncestor);
    if (ancestorRel.startsWith('..') || isAbsolute(ancestorRel)) {
      throw new PathTraversalError(path, workspaceRoot);
    }
  } catch (err) {
    if (err instanceof PathTraversalError) throw err;
    // realpath can fail if ancestor was just deleted in a race; treat as safe
    // since the lexical check already validated the path.
  }

  return fullPath;
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function materializeFile(entry: ManifestFileEntry, workspaceRoot: string): Promise<void> {
  const fullPath = validateWorkspacePath(entry.path, workspaceRoot);
  await ensureDir(dirname(fullPath));

  const encoding = entry.encoding ?? 'utf8';
  if (encoding === 'base64') {
    await writeFile(fullPath, Buffer.from(entry.content, 'base64'));
  } else {
    await writeFile(fullPath, entry.content, 'utf8');
  }
}

async function materializeDir(entry: ManifestDirEntry, workspaceRoot: string): Promise<void> {
  const fullPath = validateWorkspacePath(entry.path, workspaceRoot);
  await ensureDir(fullPath);

  if (entry.files) {
    for (const file of entry.files) {
      const nestedPath = join(entry.path, file.path);
      await materializeFile({ ...file, path: nestedPath }, workspaceRoot);
    }
  }
}

/**
 * Validate that `sourcePath` is within one of the `allowedSourceRoots`.
 * This prevents local_file/local_dir manifest entries from reading arbitrary
 * host files (e.g., /etc/passwd) in multi-tenant contexts.
 *
 * Throws if `allowedSourceRoots` is empty — callers must opt in explicitly.
 */
function validateSourcePath(sourcePath: string, allowedSourceRoots: string[]): void {
  if (allowedSourceRoots.length === 0) {
    throw new Error(
      `local_file/local_dir manifest entries are disabled: no allowedSourceRoots were configured. ` +
        `Pass an explicit allowedSourceRoots list to materializeManifest() to permit host file copies.`,
    );
  }
  const resolved = normalize(sourcePath);
  const isAllowed = allowedSourceRoots.some((root) => {
    const resolvedRoot = normalize(root);
    const rel = relative(resolvedRoot, resolved);
    return !rel.startsWith('..') && !isAbsolute(rel);
  });
  if (!isAllowed) {
    throw new Error(
      `Local source path '${sourcePath}' is outside the allowed source roots. ` +
        `Configure allowedSourceRoots to include the intended directory.`,
    );
  }
}

async function materializeLocalFile(
  entry: ManifestLocalFileEntry,
  workspaceRoot: string,
  allowedSourceRoots: string[],
): Promise<void> {
  validateSourcePath(entry.sourcePath, allowedSourceRoots);
  const fullPath = validateWorkspacePath(entry.path, workspaceRoot);
  await ensureDir(dirname(fullPath));
  await cp(entry.sourcePath, fullPath);
}

async function materializeLocalDir(
  entry: ManifestLocalDirEntry,
  workspaceRoot: string,
  allowedSourceRoots: string[],
): Promise<void> {
  validateSourcePath(entry.sourcePath, allowedSourceRoots);
  const fullPath = validateWorkspacePath(entry.path, workspaceRoot);
  await ensureDir(fullPath);
  await cp(entry.sourcePath, fullPath, { recursive: true });
}

/**
 * Validate a git URL: must use http/https/ssh/git schemes only.
 * Rejects file:// and other unsafe schemes that could read the local filesystem.
 */
export function validateGitUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid git URL: '${url}'`);
  }
  const allowed = new Set(['https:', 'http:', 'ssh:', 'git:']);
  if (!allowed.has(parsed.protocol)) {
    throw new Error(
      `Git URL scheme '${parsed.protocol}' is not permitted. Allowed: https, http, ssh, git.`,
    );
  }
}

/**
 * Validate a git ref (branch/tag/SHA): must be a safe identifier.
 * No shell special characters, path separators, or control characters.
 */
export function validateGitRef(ref: string): void {
  if (!/^[a-zA-Z0-9._\-/]+$/.test(ref)) {
    throw new Error(`Invalid git ref: '${ref}'. Refs must match [a-zA-Z0-9._\\-/]+.`);
  }
}

async function materializeGitRepo(
  entry: ManifestGitRepoEntry,
  workspaceRoot: string,
): Promise<void> {
  const fullPath = validateWorkspacePath(entry.path, workspaceRoot);
  await ensureDir(dirname(fullPath));

  validateGitUrl(entry.url);

  // Use execFile with an explicit arg array — never string interpolation —
  // to prevent shell injection via attacker-controlled url or ref values.
  const baseArgs = ['clone', '--depth', '1'];

  if (entry.ref) {
    validateGitRef(entry.ref);
    try {
      await execFileAsync('git', [...baseArgs, '--branch', entry.ref, '--', entry.url, fullPath], {
        timeout: 120_000,
      });
      return;
    } catch {
      // Ref may be a SHA rather than a branch — fall through to plain clone
    }
  }

  await execFileAsync('git', [...baseArgs, '--', entry.url, fullPath], { timeout: 120_000 });
}

export interface MaterializeOptions {
  /**
   * Allowed host directories from which `local_file` and `local_dir` manifest
   * entries may copy. Defaults to `[]` (no local copies allowed). Callers that
   * need to copy host files must opt in with an explicit allowlist — this
   * prevents untrusted manifests from reading arbitrary host filesystem paths
   * in multi-tenant deployments.
   */
  allowedSourceRoots?: string[];
}

/**
 * Materialize all entries in the manifest into the workspace directory.
 * Also writes environment variables to `.env` in the workspace root.
 *
 * @param manifest Workspace manifest to materialize.
 * @param workspaceRoot Absolute path to the target workspace directory.
 * @param options.allowedSourceRoots Host directories allowed for local_file/local_dir entries.
 */
export async function materializeManifest(
  manifest: Manifest,
  workspaceRoot: string,
  options: MaterializeOptions = {},
): Promise<void> {
  const allowedSourceRoots = options.allowedSourceRoots ?? [];

  await ensureDir(workspaceRoot);

  for (const entry of manifest.entries) {
    switch (entry.type) {
      case 'file':
        await materializeFile(entry, workspaceRoot);
        break;
      case 'dir':
        await materializeDir(entry, workspaceRoot);
        break;
      case 'local_file':
        await materializeLocalFile(entry, workspaceRoot, allowedSourceRoots);
        break;
      case 'local_dir':
        await materializeLocalDir(entry, workspaceRoot, allowedSourceRoots);
        break;
      case 'git_repo':
        await materializeGitRepo(entry, workspaceRoot);
        break;
      case 's3':
        // S3 mounts are schema-defined for forward compatibility but not
        // materialized by the Unix-local client.
        break;
    }
  }

  if (manifest.environment && Object.keys(manifest.environment).length > 0) {
    const envContent = Object.entries(manifest.environment)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
    await writeFile(join(workspaceRoot, '.env'), envContent, 'utf8');
  }

  if (manifest.outputDirs) {
    for (const dir of manifest.outputDirs) {
      const fullPath = validateWorkspacePath(dir, workspaceRoot);
      await ensureDir(fullPath);
    }
  }
}
