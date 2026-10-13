import { isProductionRuntime } from '@workspace/aef-contracts';
import type { NextFunction, Request, Response } from 'express';

export const EVIDENCE_LEDGER_HOLD_CODE = 'EVIDENCE_LEDGER_DURABILITY_REQUIRED';

export interface EvidenceLedgerRuntimeAdmission {
  ready: boolean;
  promotionState: 'DEVELOPMENT' | 'EVALUATION_HOLD';
  backend: 'in-memory';
  durable: false;
  tamperEvident: false;
  detail: string;
  blockers: readonly string[];
}

const EVIDENCE_LEDGER_BLOCKERS = [
  'the default evidence ledger is process-local',
  'entries are not hash-chained or independently integrity-verified',
  'no durable production ledger backend is configured and probed',
] as const;

/**
 * No checked-in backend currently satisfies the production evidence contract.
 * In particular, the filesystem JSONL adapter is mutable and not hash-chained,
 * so an environment flag cannot promote it into an authoritative ledger.
 */
export function resolveEvidenceLedgerRuntimeAdmission(
  env: NodeJS.ProcessEnv = process.env,
): EvidenceLedgerRuntimeAdmission {
  const production = isProductionRuntime(env, ['AEF_ENV']);
  return {
    ready: !production,
    promotionState: production ? 'EVALUATION_HOLD' : 'DEVELOPMENT',
    backend: 'in-memory',
    durable: false,
    tamperEvident: false,
    detail: production
      ? 'Production evidence writes are held until a durable tamper-evident ledger exists'
      : 'Development-only process-local evidence ledger',
    blockers: EVIDENCE_LEDGER_BLOCKERS,
  };
}

/** Fail before inference/retrieval so a held request mints no evidence IDs. */
export function evidenceLedgerRuntimeAdmission(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const admission = resolveEvidenceLedgerRuntimeAdmission();
  if (admission.ready) {
    next();
    return;
  }
  res.status(503).json({
    error: admission.detail,
    code: EVIDENCE_LEDGER_HOLD_CODE,
    promotionState: admission.promotionState,
    durable: admission.durable,
    tamperEvident: admission.tamperEvident,
    blockers: admission.blockers,
  });
}
