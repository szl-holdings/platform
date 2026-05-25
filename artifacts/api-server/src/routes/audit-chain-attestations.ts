/**
 * Audit-chain hybrid attestation routes.
 *
 * Surfaces:
 *   GET  /audit-chain/attestation/coverage             — coverage tile data (admin/ops)
 *   GET  /audit-chain/events/:id/verify                — public verification: legacy + hybrid
 *   GET  /audit-chain/attestation/quarantine           — quarantine list (admin)
 *   POST /audit-chain/attestation/quarantine/:id/decide — accept / known_bad / escalate (admin)
 *   POST /audit-chain/attestation/backfill/start       — kick a backfill pass (admin)
 *   GET  /audit-chain/attestation/checkpoint           — current backfill checkpoint state (admin)
 *
 * The backfill writes parallel attestation records — it never mutates
 * audit_chain_events. Failed-integrity rows land in quarantine for operator
 * review (see admin-only POST endpoint).
 */

import {
  auditChainEventsTable,
  db,
  proofChainAttestationCheckpointTable,
  proofChainAttestationQuarantineTable,
  proofChainHybridAttestationsTable,
} from '@szl-holdings/db';
import {
  ATTESTATION_SCHEME_VERSION,
  type AttestationSigner,
  buildAttestationPayload,
  getAttestationCoverage,
  getAttestationForEvent,
  runAttestationBackfill,
} from '@szl-holdings/proof-chain';
import { and, desc, eq } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import {
  handleRouteError,
  sendBadRequest,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { verifyAuditRow } from '../lib/audit-chain-signer';
import { getKeyCustodyProvider } from '../lib/key-custody';
import { getPlatformServiceDid } from '../lib/platform-did-registry';
import { logger } from '../lib/logger';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

/**
 * Build a signer using the existing platform key custody. For the
 * attestation authority we re-use the platform service DID — see task notes
 * §2 ("Attestation authority") for the rationale: this is intentionally a
 * platform-scoped signer so attestations are clearly distinguishable from
 * per-tenant signatures.
 */
function buildAttestationSigner(): AttestationSigner | null {
  const did = getPlatformServiceDid();
  if (!did) return null;
  const custody = getKeyCustodyProvider();
  return {
    async sign(canonicalBytes) {
      // Re-build the payload with the resolved DID injected. The library
      // signs the bytes the caller hands it, so we re-canonicalise here
      // with the attestingDid populated to prevent a payload/DID drift.
      const sig = await custody.sign(did, canonicalBytes);
      return {
        ed25519Sig: sig.ed25519Sig,
        mldsa65Sig: sig.mldsa65Sig,
        sigPublicKeyEd25519: sig.sigPublicKeyEd25519,
        sigPublicKeyMldsa65: sig.sigPublicKeyMldsa65,
        attestingDid: did,
        keyId: sig.keyId,
        schemeVersion: sig.schemeVersion ?? ATTESTATION_SCHEME_VERSION,
        certThumbprint: undefined,
      };
    },
  };
}

// ── Public verification — both legacy and hybrid attestation ────────────────
router.get(
  '/audit-chain/events/:id/verify',
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const id = Number(req.params['id']);
      if (!Number.isInteger(id) || id <= 0) {
        sendBadRequest(res, 'Invalid event id');
        return;
      }

      const [ev] = await db
        .select()
        .from(auditChainEventsTable)
        .where(eq(auditChainEventsTable.id, id))
        .limit(1);
      if (!ev) {
        sendNotFound(res, 'Audit chain event');
        return;
      }

      // Legacy verification path (hash chain + native hybrid columns if present).
      const legacy = await verifyAuditRow({
        ed25519Sig: ev.ed25519Sig,
        mldsa65Sig: ev.mldsa65Sig,
        sigPublicKeyEd25519: ev.sigPublicKeyEd25519,
        sigPublicKeyMldsa65: ev.sigPublicKeyMldsa65,
        signingDid: ev.signingDid,
        keyId: ev.keyId,
        schemeVersion: ev.schemeVersion,
        prevHash: ev.prevHash,
        action: ev.action,
        actorLabel: ev.actorLabel,
        domain: ev.domain,
        actionType: ev.actionType,
        entityId: ev.entityId,
        createdAt: ev.createdAt,
      });

      // Hybrid backward attestation (if attested).
      const attestation = await getAttestationForEvent(id);

      // If an attestation exists, re-verify its hybrid signature against the
      // canonical attestation payload so external auditors get a live verdict
      // — not just an attestation record lookup.
      let attestationVerdict:
        | {
            verified: boolean;
            reason?: string;
          }
        | null = null;
      if (attestation.attestation) {
        const a = attestation.attestation;
        const canonicalBytes = buildAttestationPayload({
          eventId: id,
          eventHash: ev.eventHash,
          prevHash: ev.prevHash,
          createdAt: ev.createdAt.toISOString(),
          attestingDid: a.attestingDid,
          attestedAt: a.attestedAt,
          schemeVersion: a.schemeVersion,
        });
        try {
          const { hexToBytes } = await import('@noble/hashes/utils.js');
          const { ed25519 } = await import('@noble/curves/ed25519.js');
          const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa.js');
          const edOk = ed25519.verify(
            hexToBytes(a.ed25519Sig),
            canonicalBytes,
            hexToBytes(a.sigPublicKeyEd25519),
          );
          const pqcOk = ml_dsa65.verify(
            hexToBytes(a.sigPublicKeyMldsa65),
            canonicalBytes,
            hexToBytes(a.mldsa65Sig),
          );
          attestationVerdict = {
            verified: edOk && pqcOk,
            reason: edOk && pqcOk ? undefined : !edOk ? 'ed25519_invalid' : 'mldsa65_invalid',
          };
        } catch (err) {
          attestationVerdict = { verified: false, reason: (err as Error).message };
        }
      }

      sendSuccess(res, {
        eventId: id,
        eventHash: ev.eventHash,
        legacyVerification: {
          status: legacy.status,
          reason: legacy.reason,
          registryCrossCheck: legacy.registryCrossCheck,
          ed25519Valid: legacy.ed25519Valid,
          mldsa65Valid: legacy.mldsa65Valid,
        },
        hybridAttestation: attestation.attestation
          ? {
              ...attestation.attestation,
              verified: attestationVerdict?.verified ?? false,
              reason: attestationVerdict?.reason,
            }
          : null,
        coverage: attestation.attestation ? 'hybrid_attested' : legacy.status === 'hybrid_verified' ? 'hybrid_native' : 'legacy_only',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to verify audit chain event');
    }
  },
);

// ── Coverage tile data ──────────────────────────────────────────────────────
router.get(
  '/audit-chain/attestation/coverage',
  authMiddleware({ required: false }),
  requireRole('ops', 'analyst', 'admin', 'compliance', 'super_admin'),
  async (_req, res) => {
    try {
      const coverage = await getAttestationCoverage();
      sendSuccess(res, coverage);
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute hybrid coverage');
    }
  },
);

// ── Quarantine list ─────────────────────────────────────────────────────────
router.get(
  '/audit-chain/attestation/quarantine',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'compliance'),
  async (req, res) => {
    try {
      const decision = (req.query['decision'] as string | undefined) ?? undefined;
      const limit = Math.min(200, Math.max(1, Number(req.query['limit'] ?? 50)));

      const conditions = decision
        ? [
            eq(
              proofChainAttestationQuarantineTable.decision,
              decision as 'pending' | 'accepted' | 'known_bad' | 'escalated',
            ),
          ]
        : [];

      const rows = await db
        .select()
        .from(proofChainAttestationQuarantineTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(proofChainAttestationQuarantineTable.quarantinedAt))
        .limit(limit);

      sendSuccess(res, { rows, count: rows.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list quarantined attestations');
    }
  },
);

// ── Quarantine decision ─────────────────────────────────────────────────────
router.post(
  '/audit-chain/attestation/quarantine/:id/decide',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  async (req, res) => {
    try {
      const id = Number(req.params['id']);
      if (!Number.isInteger(id) || id <= 0) {
        sendBadRequest(res, 'Invalid quarantine id');
        return;
      }
      const body = (req.body ?? {}) as { decision?: string; note?: string };
      const decision = body.decision;
      if (
        decision !== 'accepted' &&
        decision !== 'known_bad' &&
        decision !== 'escalated'
      ) {
        sendBadRequest(res, 'decision must be one of: accepted, known_bad, escalated');
        return;
      }
      if (decision === 'accepted' && !body.note) {
        sendBadRequest(res, 'A justification note is required when accepting a quarantined row');
        return;
      }

      const [updated] = await db
        .update(proofChainAttestationQuarantineTable)
        .set({
          decision,
          decisionNote: body.note ?? null,
          decidedBy: req.user?.id ?? null,
          decidedAt: new Date(),
        })
        .where(eq(proofChainAttestationQuarantineTable.id, id))
        .returning();

      if (!updated) {
        sendNotFound(res, 'Quarantine record');
        return;
      }

      logger.info(
        { id, decision, decidedBy: req.user?.id },
        '[attestation-quarantine] Decision recorded',
      );

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to record quarantine decision');
    }
  },
);

// ── Backfill trigger (admin) ────────────────────────────────────────────────
router.post(
  '/audit-chain/attestation/backfill/start',
  authMiddleware(),
  requireRole('admin', 'super_admin'),
  async (req, res) => {
    try {
      const signer = buildAttestationSigner();
      if (!signer) {
        res.status(503).json({
          ok: false,
          error: 'attestation_signer_unavailable',
          detail: 'Platform service DID not bootstrapped — retry after identity bootstrap',
        });
        return;
      }

      const body = (req.body ?? {}) as {
        workflowId?: string;
        chunkSize?: number;
        maxRows?: number;
      };

      const summary = await runAttestationBackfill(signer, {
        workflowId: body.workflowId,
        chunkSize: body.chunkSize,
        maxRows: body.maxRows ?? 5000,
      });
      sendSuccess(res, summary);
    } catch (err) {
      handleRouteError(res, err, 'Failed to run attestation backfill');
    }
  },
);

// ── Backfill checkpoint (admin) ─────────────────────────────────────────────
router.get(
  '/audit-chain/attestation/checkpoint',
  authMiddleware(),
  requireRole('admin', 'super_admin', 'compliance'),
  async (req, res) => {
    try {
      const workflowId =
        (req.query['workflowId'] as string | undefined) ?? 'proof-chain-backfill-default';
      const [row] = await db
        .select()
        .from(proofChainAttestationCheckpointTable)
        .where(eq(proofChainAttestationCheckpointTable.id, workflowId))
        .limit(1);
      if (!row) {
        sendSuccess(res, { workflowId, status: 'not_started' });
        return;
      }
      sendSuccess(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to load backfill checkpoint');
    }
  },
);

// ── Attestation lookup by event (auxiliary) ─────────────────────────────────
router.get(
  '/audit-chain/attestation/by-event/:id',
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const id = Number(req.params['id']);
      if (!Number.isInteger(id) || id <= 0) {
        sendBadRequest(res, 'Invalid event id');
        return;
      }
      const result = await getAttestationForEvent(id);
      if (!result.attestation) {
        sendNotFound(res, 'Attestation');
        return;
      }
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to look up attestation');
    }
  },
);

// ── Recent attestations list ────────────────────────────────────────────────
router.get(
  '/audit-chain/attestation/recent',
  authMiddleware({ required: false }),
  requireRole('admin', 'super_admin', 'ops', 'analyst', 'compliance'),
  async (req, res) => {
    try {
      const limit = Math.min(200, Math.max(1, Number(req.query['limit'] ?? 25)));
      const rows = await db
        .select()
        .from(proofChainHybridAttestationsTable)
        .orderBy(desc(proofChainHybridAttestationsTable.attestedAt))
        .limit(limit);
      sendSuccess(res, { rows, count: rows.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list recent attestations');
    }
  },
);

export default router;

// Expose the signer factory so the catch-up scheduler can reuse it without
// importing the route module (which would force express boot during cron).
export { buildAttestationSigner };
