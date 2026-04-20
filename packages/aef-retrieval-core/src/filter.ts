import type { BoostedHit } from './boost.js';
import type { FusedHit } from './fusion.js';

export type MetadataFilterValue = string | number | boolean | string[];

export type MetadataFilter = Record<string, MetadataFilterValue>;

function matchesFilter(metadata: Record<string, unknown>, filter: MetadataFilter): boolean {
  for (const [key, expected] of Object.entries(filter)) {
    const actual = metadata[key];

    if (Array.isArray(expected)) {
      if (!expected.includes(actual as string)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

export function applyMetadataFilter<T extends FusedHit | BoostedHit>(
  hits: T[],
  filter: MetadataFilter | undefined,
): T[] {
  if (!filter || Object.keys(filter).length === 0) return hits;
  return hits.filter((h) => matchesFilter(h.metadata, filter));
}

export function applyTenantFilter<T extends FusedHit | BoostedHit>(
  hits: T[],
  tenantId: string,
): T[] {
  return hits.filter((h) => {
    const hitTenant = h.metadata['tenantId'];
    return hitTenant === tenantId;
  });
}
