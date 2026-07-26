import { join, relative } from 'node:path';

export interface TrackedPortablePath {
  /** Exact path bytes decoded from Git output. Use only for filesystem access. */
  rawRelativePath: string;
  /** NFC/slash-normalized path. Use only for policy comparisons and reporting. */
  policyRelativePath: string;
  /** Filesystem path derived from the exact Git output, never from the normalized policy path. */
  absolutePath: string;
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
