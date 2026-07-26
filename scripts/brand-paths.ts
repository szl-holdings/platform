import { relative } from 'node:path';

export function normalizePortablePath(value: string): string {
  return value.replaceAll('\\', '/').normalize('NFC');
}

export function portableRelativePath(root: string, fullPath: string): string {
  return normalizePortablePath(relative(root, fullPath));
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
