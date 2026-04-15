/**
 * Virus scan stub — pipeline placeholder for future AV integration.
 *
 * This module provides a scan queue interface that is called during upload finalization.
 * Currently it logs a "pending" entry and returns immediately without performing any
 * actual scan. When a real AV service is integrated, replace `dispatchVirusScan` with
 * a call to the AV API or job queue.
 *
 * Scan states:
 *   - "pending"  — scan queued, not yet started (initial state, set by this stub)
 *   - "scanning" — scan in progress (set by future scanner)
 *   - "clean"    — no threats found (set by future scanner)
 *   - "infected" — threat detected (set by future scanner; file should be quarantined)
 *   - "error"    — scan failed (set by future scanner)
 *   - "skipped"  — scan not performed (e.g., object storage not configured)
 */

import { logger } from "./logger";

export type VirusScanStatus = "pending" | "scanning" | "clean" | "infected" | "error" | "skipped";

export interface VirusScanResult {
  fileId: number;
  objectPath: string;
  status: VirusScanStatus;
  queuedAt: string;
}

/**
 * Dispatch a virus scan job for a newly uploaded file.
 * Currently a stub — logs the intent and returns `pending` status immediately.
 *
 * Future integration: replace this with a call to your AV job queue or webhook.
 * The persisted scan status should be updated when the scanner reports back.
 */
export async function dispatchVirusScan(
  fileId: number,
  objectPath: string,
): Promise<VirusScanResult> {
  const queuedAt = new Date().toISOString();

  logger.info(
    { fileId, objectPath, scanStatus: "pending", queuedAt },
    "[virus-scan-stub] Virus scan queued — no scanner integration configured. Status: pending.",
  );

  return {
    fileId,
    objectPath,
    status: "pending",
    queuedAt,
  };
}
