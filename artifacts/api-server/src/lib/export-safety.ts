/**
 * Export Safety Gate
 *
 * Uses the proof-chain's `exportSafetyState` to decide whether AI-tagged
 * content may be exported.  Content with no proof entry is allowed through
 * (untagged data is not AI-generated and therefore has no export restriction).
 *
 * States:
 *  'safe'           → pass
 *  'pending_review' → pass (not yet reviewed; allow while awaiting sign-off)
 *  'restricted'     → block with HTTP 403 and a link to the proof entry
 *  'blocked'        → block with HTTP 403 and a link to the proof entry
 */

import { db, proofChainTable } from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';
import type { Response } from 'express';
import { logger } from './logger';

export class ExportBlockedError extends Error {
  constructor(
    public readonly code: 'EXPORT_BLOCKED' | 'EXPORT_RESTRICTED',
    public readonly proofId: number,
    public readonly reason: string,
  ) {
    super(reason);
    this.name = 'ExportBlockedError';
  }
}

/**
 * Throws `ExportBlockedError` when the proof entry for `contentId/contentType`
 * has an `exportSafetyState` of 'blocked' or 'restricted'.
 *
 * Safe / missing proofs are silently allowed.
 */
export async function assertExportSafe(contentId: string, contentType: string): Promise<void> {
  const [proof] = await db
    .select({
      id: proofChainTable.id,
      exportSafetyState: proofChainTable.exportSafetyState,
    })
    .from(proofChainTable)
    .where(
      and(eq(proofChainTable.contentId, contentId), eq(proofChainTable.contentType, contentType)),
    )
    .orderBy(desc(proofChainTable.createdAt))
    .limit(1);

  if (!proof) return;

  if (proof.exportSafetyState === 'blocked') {
    throw new ExportBlockedError(
      'EXPORT_BLOCKED',
      proof.id,
      `Content "${contentType}:${contentId}" has been blocked from export by the proof-chain review process (proof #${proof.id}).`,
    );
  }

  if (proof.exportSafetyState === 'restricted') {
    throw new ExportBlockedError(
      'EXPORT_RESTRICTED',
      proof.id,
      `Content "${contentType}:${contentId}" is restricted from export pending proof-chain review (proof #${proof.id}).`,
    );
  }
}

/**
 * Convenience handler: if `assertExportSafe` throws an `ExportBlockedError`,
 * writes the appropriate 403 JSON response with a link to the proof entry and
 * returns `true` (caller should stop processing).
 * Returns `false` if the export is safe to proceed.
 */
export async function checkExportSafe(
  res: Response,
  contentId: string,
  contentType: string,
  apiBase = '/api',
): Promise<boolean> {
  try {
    await assertExportSafe(contentId, contentType);
    return false;
  } catch (err) {
    if (err instanceof ExportBlockedError) {
      res.status(403).json({
        success: false,
        code: err.code,
        error: err.message,
        proofChainEntry: `${apiBase}/proof-chain/${err.proofId}`,
        proofId: err.proofId,
      });
      return true;
    }
    // Unexpected error (DB unavailable, etc.) — fail-closed: block the export
    // to prevent untrusted content from leaving the system.
    logger.error(
      { err, contentId, contentType },
      'export-safety: proof lookup failed — blocking export (fail-closed)',
    );
    res.status(503).json({
      success: false,
      code: 'EXPORT_SAFETY_UNAVAILABLE',
      error: 'Export safety check could not be completed. Export is blocked until the proof-chain service is restored.',
    });
    return true;
  }
}
