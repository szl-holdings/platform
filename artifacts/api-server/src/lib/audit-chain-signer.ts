/**
 * Audit Chain Hybrid Signing Service
 *
 * Produces and verifies hybrid (Ed25519 + ML-DSA-65) signatures over a
 * canonical, deterministic serialization of audit chain event payloads.
 *
 * The canonical payload covers the same fields used in the SHA-256 hash
 * chain (prevHash, action, actor, domain, actionType, entityId, createdAt)
 * plus the signing DID so signatures are bound to the identity layer.
 *
 * Verification classifies each row as:
 *   - hybrid_verified  — both signatures present, registry cross-check passed,
 *                        and both cryptographic signatures valid
 *   - legacy_unsigned  — no signature columns (pre-migration row)
 *   - broken           — signatures present but invalid, key_mismatch_registry,
 *                        or tampered payload
 *
 * Registry cross-check (G3/G4/G5):
 *   verifyAuditRow resolves the signing key (by keyId + signingDid) from the
 *   platform_keys registry and uses the registry-sourced public keys to verify
 *   the signature. Row-embedded public keys are compared against the registry;
 *   a mismatch returns broken:key_mismatch_registry. This prevents attacks
 *   where an adversary injects arbitrary public keys alongside forged signatures.
 *   If the keyId is absent or the registry is unavailable (DB down), verification
 *   falls back to row-embedded keys (non-fatal degradation, logged at WARN).
 */

import { db, platformKeysTable } from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import { hexToBytes } from '@noble/hashes/utils.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { getKeyCustodyProvider, type SignResult } from './key-custody';
import { getPlatformServiceDid } from './platform-did-registry';
import { logger } from './logger';

export type SignatureStatus = 'hybrid_verified' | 'legacy_unsigned' | 'broken';

export interface AuditEventSignPayload {
  prevHash: string;
  action: string;
  actor: string;
  domain: string;
  actionType: string;
  entityId: string;
  createdAt: string;
  signingDid: string;
}

export interface HybridSignatureResult {
  ed25519Sig: string;
  mldsa65Sig: string;
  sigPublicKeyEd25519: string;
  sigPublicKeyMldsa65: string;
  signingDid: string;
  keyId: string;
  schemeVersion: string;
}

export interface VerifyRowInput {
  ed25519Sig?: string | null;
  mldsa65Sig?: string | null;
  sigPublicKeyEd25519?: string | null;
  sigPublicKeyMldsa65?: string | null;
  signingDid?: string | null;
  keyId?: string | null;
  schemeVersion?: string | null;
  prevHash: string;
  action: string;
  actorLabel: string;
  domain: string;
  actionType: string;
  entityId?: string | null;
  createdAt: Date;
}

export interface VerifyRowResult {
  status: SignatureStatus;
  reason?: string;
  ed25519Valid?: boolean;
  mldsa65Valid?: boolean;
  signingDid?: string;
  registryCrossCheck?: 'passed' | 'failed' | 'skipped';
  lambdaReceipt?: LambdaReceipt;
}

/**
 * Lambda receipt — Ouroboros Thesis v3/v4 four-axis trust scalar for a single audit row.
 *
 * Each axis is in [0,1]; Λ = (C·H·R·F)^(1/4) with Egyptian-inspectable unit-fraction weights
 * (each weight = 1/4, a finite sum of distinct unit fractions per RMP 2/n discipline).
 *
 *   C — Cleanliness:    1 if hybrid_verified, 0.5 if legacy_unsigned (pre-migration), 0 if broken
 *   H — Horizon:        1 if signing metadata is fully present (no leak/silence), 0 otherwise
 *   R — Resonance:      mean of (ed25519Valid, mldsa65Valid) — Q-factor proxy for the 2-witness pair
 *   F — Reconciliation: 1 if registryCrossCheck=passed, 0.5 if skipped, 0 if failed
 *
 * Anchors: docs/ouroboros-v6/business/FORMULAS.md §Lutar Invariant; docs/ouroboros-v5/OUROBOROS_THESIS_V4.md §2.
 */
export interface LambdaReceipt {
  C: number;
  H: number;
  R: number;
  F: number;
  lambda: number;
  axiomSet: 'lutar-v3-4axis';
}

export function computeLambdaReceipt(input: {
  status: SignatureStatus;
  ed25519Valid?: boolean;
  mldsa65Valid?: boolean;
  registryCrossCheck?: 'passed' | 'failed' | 'skipped';
  signingDid?: string | null;
  hasSigMetadata: boolean;
}): LambdaReceipt {
  const C =
    input.status === 'hybrid_verified' ? 1
      : input.status === 'legacy_unsigned' ? 0.5
        : 0;
  const H = input.hasSigMetadata || input.status === 'legacy_unsigned' ? 1 : 0;
  const R = input.status === 'legacy_unsigned'
    ? 0.5
    : ((input.ed25519Valid ? 1 : 0) + (input.mldsa65Valid ? 1 : 0)) / 2;
  const F =
    input.registryCrossCheck === 'passed' ? 1
      : input.registryCrossCheck === 'failed' ? 0
        : input.status === 'legacy_unsigned' ? 0.5
          : 0.5;
  // Geometric mean with equal Egyptian unit-fraction weights (1/4 each).
  // Zero-pinning axiom: any axis at 0 collapses lambda to 0.
  const lambda = (C === 0 || H === 0 || R === 0 || F === 0)
    ? 0
    : Math.pow(C * H * R * F, 1 / 4);
  return { C, H, R, F, lambda, axiomSet: 'lutar-v3-4axis' };
}

// ── Canonical payload ─────────────────────────────────────────────────────

export function buildCanonicalPayload(p: AuditEventSignPayload): Uint8Array {
  const json = JSON.stringify({
    prevHash: p.prevHash,
    action: p.action,
    actor: p.actor,
    domain: p.domain,
    actionType: p.actionType,
    entityId: p.entityId,
    createdAt: p.createdAt,
    signingDid: p.signingDid,
  });
  return new TextEncoder().encode(json);
}

export function buildCanonicalPayloadFromRow(row: VerifyRowInput, signingDid: string): Uint8Array {
  return buildCanonicalPayload({
    prevHash: row.prevHash,
    action: row.action,
    actor: row.actorLabel,
    domain: row.domain,
    actionType: row.actionType,
    entityId: row.entityId ?? '',
    createdAt: row.createdAt.toISOString(),
    signingDid,
  });
}

// ── Signing ───────────────────────────────────────────────────────────────

/**
 * Sign a new audit event. Returns null if the platform service DID has no
 * active key (only occurs during first-boot before bootstrap completes).
 */
export async function signAuditEvent(params: {
  prevHash: string;
  action: string;
  actorLabel: string;
  domain: string;
  actionType: string;
  entityId: string | null;
  createdAt: Date;
  actorDid?: string;
}): Promise<HybridSignatureResult | null> {
  const signingDid = params.actorDid ?? getPlatformServiceDid();
  if (!signingDid) {
    logger.debug('[audit-chain-signer] Platform service DID not yet bootstrapped — skipping signature');
    return null;
  }

  try {
    const custody = getKeyCustodyProvider();
    const canonicalBytes = buildCanonicalPayload({
      prevHash: params.prevHash,
      action: params.action,
      actor: params.actorLabel,
      domain: params.domain,
      actionType: params.actionType,
      entityId: params.entityId ?? '',
      createdAt: params.createdAt.toISOString(),
      signingDid,
    });

    const signResult: SignResult = await custody.sign(signingDid, canonicalBytes);

    return {
      ed25519Sig: signResult.ed25519Sig,
      mldsa65Sig: signResult.mldsa65Sig,
      sigPublicKeyEd25519: signResult.sigPublicKeyEd25519,
      sigPublicKeyMldsa65: signResult.sigPublicKeyMldsa65,
      signingDid,
      keyId: signResult.keyId,
      schemeVersion: signResult.schemeVersion,
    };
  } catch (err) {
    logger.error({ err, signingDid }, '[audit-chain-signer] Failed to sign audit event');
    return null;
  }
}

// ── Verification ──────────────────────────────────────────────────────────

/**
 * Verify a single audit row.
 *
 * Security model (G3/G4/G5):
 * 1. Registry cross-check: resolve the signing key from platform_keys by
 *    (keyId, signingDid). Use registry-sourced public keys for verification.
 *    If the row-embedded public keys differ from the registry, return broken.
 * 2. Cryptographic verification: verify Ed25519 + ML-DSA-65 signatures against
 *    the canonical payload.
 * 3. If the registry is unavailable, fall back to row-embedded keys (non-fatal
 *    degradation — logged at WARN, registryCrossCheck='skipped').
 */
export async function verifyAuditRow(row: VerifyRowInput): Promise<VerifyRowResult> {
  const hasEd = !!(row.ed25519Sig);
  const hasPqc = !!(row.mldsa65Sig);

  // Fully unsigned (pre-DID migration row) — legitimate legacy entry
  if (!hasEd && !hasPqc) {
    const lr = computeLambdaReceipt({
      status: 'legacy_unsigned',
      hasSigMetadata: false,
      registryCrossCheck: 'skipped',
    });
    return { status: 'legacy_unsigned', lambdaReceipt: lr };
  }

  // Partial signature — exactly one algorithm signature present.
  // This is a tamper indicator: a valid hybrid row always has both signatures.
  // Classifying as broken (not legacy_unsigned) prevents tampered rows from
  // evading integrity checks by stripping one of the two signature columns.
  if (hasEd !== hasPqc) {
    const lr = computeLambdaReceipt({
      status: 'broken',
      ed25519Valid: false,
      mldsa65Valid: false,
      hasSigMetadata: false,
      registryCrossCheck: 'skipped',
    });
    return {
      status: 'broken',
      reason: 'partial_signature_tamper',
      ed25519Valid: false,
      mldsa65Valid: false,
      signingDid: row.signingDid ?? undefined,
      registryCrossCheck: 'skipped',
      lambdaReceipt: lr,
    };
  }

  // Both signatures present — proceed to metadata + cryptographic verification.
  if (!row.signingDid || !row.sigPublicKeyEd25519 || !row.sigPublicKeyMldsa65) {
    const lr = computeLambdaReceipt({
      status: 'broken',
      hasSigMetadata: false,
      registryCrossCheck: 'skipped',
    });
    return { status: 'broken', reason: 'signature_missing_metadata', lambdaReceipt: lr };
  }

  // ── Registry cross-check ──────────────────────────────────────────────────
  let verifyEd25519PublicKey = row.sigPublicKeyEd25519;
  let verifyMldsa65PublicKey = row.sigPublicKeyMldsa65;
  let registryCrossCheck: VerifyRowResult['registryCrossCheck'] = 'skipped';

  if (row.keyId) {
    try {
      const [keyRow] = await db
        .select({
          ed25519PublicKey: platformKeysTable.ed25519PublicKey,
          mldsa65PublicKey: platformKeysTable.mldsa65PublicKey,
        })
        .from(platformKeysTable)
        .where(
          and(
            eq(platformKeysTable.keyId, row.keyId),
            eq(platformKeysTable.did, row.signingDid),
          ),
        )
        .limit(1);

      if (keyRow) {
        const ed25519Match = keyRow.ed25519PublicKey === row.sigPublicKeyEd25519;
        const mldsa65Match = keyRow.mldsa65PublicKey === row.sigPublicKeyMldsa65;

        if (!ed25519Match || !mldsa65Match) {
          const lr = computeLambdaReceipt({
            status: 'broken',
            ed25519Valid: false,
            mldsa65Valid: false,
            registryCrossCheck: 'failed',
            hasSigMetadata: true,
          });
          return {
            status: 'broken',
            reason: 'key_mismatch_registry',
            ed25519Valid: false,
            mldsa65Valid: false,
            signingDid: row.signingDid,
            registryCrossCheck: 'failed',
            lambdaReceipt: lr,
          };
        }
        registryCrossCheck = 'passed';
        // Use registry-sourced keys (identical to row-embedded after cross-check passes)
        verifyEd25519PublicKey = keyRow.ed25519PublicKey;
        verifyMldsa65PublicKey = keyRow.mldsa65PublicKey;
      }
      // keyRow absent: keyId not yet in registry (row pre-dates DID registry migration)
      // Fall through using row-embedded keys; registryCrossCheck stays 'skipped'.
    } catch (err) {
      logger.warn(
        { err, signingDid: row.signingDid, keyId: row.keyId },
        '[audit-chain-signer] Registry cross-check unavailable (non-fatal) — using row-embedded keys',
      );
    }
  }

  // ── Cryptographic signature verification ──────────────────────────────────
  let ed25519Valid = false;
  let mldsa65Valid = false;
  let reason: string | undefined;

  try {
    const canonicalBytes = buildCanonicalPayloadFromRow(row, row.signingDid);

    try {
      const sigBytes = hexToBytes(row.ed25519Sig!);
      const pubBytes = hexToBytes(verifyEd25519PublicKey);
      ed25519Valid = ed25519.verify(sigBytes, canonicalBytes, pubBytes);
    } catch {
      ed25519Valid = false;
    }

    try {
      const sigBytes = hexToBytes(row.mldsa65Sig!);
      const pubBytes = hexToBytes(verifyMldsa65PublicKey);
      mldsa65Valid = ml_dsa65.verify(pubBytes, canonicalBytes, sigBytes);
    } catch {
      mldsa65Valid = false;
    }

    if (!ed25519Valid || !mldsa65Valid) {
      reason = !ed25519Valid && !mldsa65Valid
        ? 'both_signatures_invalid'
        : !ed25519Valid
          ? 'ed25519_invalid'
          : 'mldsa65_invalid';
    }
  } catch (_err) {
    const lr = computeLambdaReceipt({
      status: 'broken',
      ed25519Valid: false,
      mldsa65Valid: false,
      registryCrossCheck,
      hasSigMetadata: true,
    });
    return {
      status: 'broken',
      reason: 'verification_exception',
      ed25519Valid: false,
      mldsa65Valid: false,
      signingDid: row.signingDid,
      registryCrossCheck,
      lambdaReceipt: lr,
    };
  }

  const finalStatus: SignatureStatus = ed25519Valid && mldsa65Valid ? 'hybrid_verified' : 'broken';
  const lambdaReceipt = computeLambdaReceipt({
    status: finalStatus,
    ed25519Valid,
    mldsa65Valid,
    registryCrossCheck,
    hasSigMetadata: true,
  });
  return {
    status: finalStatus,
    reason,
    ed25519Valid,
    mldsa65Valid,
    signingDid: row.signingDid,
    registryCrossCheck,
    lambdaReceipt,
  };
}

// ── Rollout flag ──────────────────────────────────────────────────────────

export type AuditChainRollout = 'warn' | 'enforce';

export function getAuditChainRollout(): AuditChainRollout {
  const v = process.env.AUDIT_CHAIN_ROLLOUT;
  if (v === 'enforce') return 'enforce';
  return 'warn';
}

/**
 * Handle a signing failure according to the rollout flag.
 * - warn:    log an error, increment audit_chain_signing_failure counter, return false
 * - enforce: throw, causing the originating request to fail closed (503)
 */
export function handleSigningFailure(
  err: Error | null,
  context: Record<string, unknown>,
): { shouldAbort: boolean } {
  const mode = getAuditChainRollout();
  const msg = err?.message ?? 'signing_failure';

  logger.error(
    { ...context, err: msg, rolloutMode: mode },
    '[audit-chain-signer] Signing failure',
  );

  // G8: Increment telemetry counter so dashboards/alerts can track signing
  // degradation rate independently of log volume.
  try {
    // Use process-level counter via global to avoid circular deps on observability pkg.
    // Exposed at /api/health/detailed under audit_chain.signing_failures.
    const g = globalThis as Record<string, unknown>;
    g.__auditChainSigningFailures = ((g.__auditChainSigningFailures as number) ?? 0) + 1;
  } catch {
    // Non-fatal — counter is best-effort.
  }

  if (mode === 'enforce') {
    return { shouldAbort: true };
  }
  return { shouldAbort: false };
}
