/**
 * Configuration helpers. Modeled on FlexTensor's `OffloadConfig` (Apache-2.0)
 * but using a plain TypeScript object instead of Pydantic.
 */

import type { FlexCacheConfig } from './types';

export function defaultConfig(): FlexCacheConfig {
  return {
    enabled: true,
    maxHotEntries: 64,
    maxWarmEntries: 256,
    discoveryIters: 1,
    profilingIters: 8,
    includePatterns: [],
    excludePatterns: [],
    strategy: 'adaptive',
    warmBackend: 'auto',
    ttlMs: undefined,
    estimateBytes: defaultEstimateBytes,
  };
}

export function mergeConfig(
  base: FlexCacheConfig,
  patch: Partial<FlexCacheConfig>,
): FlexCacheConfig {
  return { ...base, ...patch };
}

/**
 * Best-effort byte estimator. Strings are 2 bytes/char (UTF-16). For objects
 * we JSON-stringify; on failure (cycles, non-serialisable) we fall back to a
 * fixed estimate so the strategy still has something to work with.
 */
export function defaultEstimateBytes(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'string') return value.length * 2;
  if (typeof value === 'number') return 8;
  if (typeof value === 'boolean') return 4;
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (ArrayBuffer.isView(value)) return value.byteLength;
  try {
    return JSON.stringify(value).length * 2;
  } catch {
    return 1024;
  }
}

/**
 * Convert a glob-style pattern (`*`, `?`) into a RegExp. Conservative — only
 * those two metacharacters are honoured; everything else is escaped.
 */
export function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const expanded = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${expanded}$`);
}

export function matchesAny(key: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false;
  for (const p of patterns) {
    if (patternToRegExp(p).test(key)) return true;
  }
  return false;
}

/** Returns true if the key should be cached given include/exclude rules. */
export function isManagedKey(
  key: string,
  includePatterns: string[],
  excludePatterns: string[],
): boolean {
  if (matchesAny(key, excludePatterns)) return false;
  if (includePatterns.length === 0) return true;
  return matchesAny(key, includePatterns);
}
