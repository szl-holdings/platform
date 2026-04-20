/**
 * Org-level storage quota enforcement for file uploads.
 *
 * Queries the filesTable to compute current org storage usage (sum of file sizes)
 * and compares it against the configurable per-org limit. If the org has exceeded
 * its quota, the presigned URL request is rejected before any GCS call is made.
 */

import { db, filesTable } from '@szl-holdings/db';
import { and, eq, isNotNull, sum } from 'drizzle-orm';

const DEFAULT_ORG_QUOTA_BYTES = parseInt(
  process.env.DEFAULT_ORG_STORAGE_QUOTA_BYTES ?? String(10 * 1024 * 1024 * 1024), // 10 GB
  10,
);

export interface QuotaCheckResult {
  allowed: boolean;
  currentUsageBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  reason?: string;
}

/**
 * Check whether an org has sufficient quota to store `requestedBytes` more data.
 *
 * @param orgId - The org whose quota should be checked. If null/undefined, quota is not enforced.
 * @param requestedBytes - The size of the incoming upload in bytes.
 * @param quotaOverrideBytes - Optional per-org quota override (e.g. loaded from org settings).
 *                             Falls back to DEFAULT_ORG_STORAGE_QUOTA_BYTES if not provided.
 */
export async function checkOrgStorageQuota(
  orgId: number | null | undefined,
  requestedBytes: number,
  quotaOverrideBytes?: number | null,
): Promise<QuotaCheckResult> {
  if (!orgId) {
    return {
      allowed: true,
      currentUsageBytes: 0,
      quotaBytes: DEFAULT_ORG_QUOTA_BYTES,
      remainingBytes: DEFAULT_ORG_QUOTA_BYTES,
    };
  }

  const quotaBytes = quotaOverrideBytes ?? DEFAULT_ORG_QUOTA_BYTES;

  const [row] = await db
    .select({ total: sum(filesTable.size) })
    .from(filesTable)
    .where(and(eq(filesTable.orgId, orgId), isNotNull(filesTable.size)));

  const currentUsageBytes = Number(row?.total ?? 0);
  const remainingBytes = Math.max(0, quotaBytes - currentUsageBytes);

  if (currentUsageBytes + requestedBytes > quotaBytes) {
    return {
      allowed: false,
      currentUsageBytes,
      quotaBytes,
      remainingBytes,
      reason: `Org storage quota exceeded. Current usage: ${formatBytes(currentUsageBytes)}, quota: ${formatBytes(quotaBytes)}, requested: ${formatBytes(requestedBytes)}.`,
    };
  }

  return {
    allowed: true,
    currentUsageBytes,
    quotaBytes,
    remainingBytes,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
