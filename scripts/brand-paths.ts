import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface TrackedPortablePath {
  /** Exact path bytes decoded from Git output. Use only for filesystem access. */
  rawRelativePath: string;
  /** NFC/slash-normalized path. Use only for policy comparisons and reporting. */
  policyRelativePath: string;
  /** Filesystem path derived from the exact Git output, never from the normalized policy path. */
  absolutePath: string;
}

interface GitTextResult {
  error?: Error;
  status: number | null;
  stdout: string;
  stderr: string;
}

interface TrackedTextOptions {
  readText?: (path: string) => string;
  runGit?: (args: string[]) => GitTextResult;
}

function filesystemErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
  return String(error.code);
}

export function readTrackedPortableText(
  root: string,
  file: TrackedPortablePath,
  options: TrackedTextOptions = {},
): string {
  const readText = options.readText ?? ((path: string) => readFileSync(path, 'utf8'));
  try {
    return readText(file.absolutePath);
  } catch (error) {
    if (filesystemErrorCode(error) !== 'ENOENT') throw error;
  }

  const args = ['show', `:${file.rawRelativePath}`];
  const result =
    options.runGit?.(args) ??
    spawnSync(process.env.GIT_EXECUTABLE ?? 'git', args, {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
    });
  if (result.error) {
    throw new Error(`Unable to read "${file.rawRelativePath}" from the Git index: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `git show failed for "${file.rawRelativePath}": ${result.stderr.trim() || `exit ${result.status}`}`,
    );
  }
  return result.stdout;
}

export function normalizePortablePath(value: string): string {
  return value.replaceAll('\\', '/').normalize('NFC');
}

export function portableRelativePath(root: string, fullPath: string): string {
  return normalizePortablePath(relative(root, fullPath));
}

export function trackedPortablePath(root: string, rawRelativePath: string): TrackedPortablePath {
  return {
    rawRelativePath,
    policyRelativePath: normalizePortablePath(rawRelativePath),
    absolutePath: join(root, rawRelativePath),
  };
}

export function isIgnoredPortablePath(
  relativePath: string,
  ignoredPaths: ReadonlySet<string>,
  ignoredDirectoryNames: ReadonlySet<string>,
): boolean {
  const normalized = normalizePortablePath(relativePath);
  if (ignoredPaths.has(normalized)) return true;

  if (normalized.split('/').some((part) => ignoredDirectoryNames.has(part))) {
    return true;
  }

  for (const ignored of ignoredPaths) {
    if (normalized.startsWith(`${ignored}/`)) return true;
  }
  return false;
}

export function isFrontendPortablePath(relativePath: string): boolean {
  const normalized = normalizePortablePath(relativePath);
  return normalized.startsWith('artifacts/') && !normalized.startsWith('artifacts/api-server/');
}
