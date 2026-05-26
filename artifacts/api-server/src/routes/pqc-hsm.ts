/**
 * HSM custody routes — exposes HSM health, root-signing audit, fresh
 * attestation, intermediate roster, and disaster-recovery readiness.
 *
 * Mutating routes (`/pqc/ca/attest`, `/pqc/ca/disaster-recovery/rehearse`)
 * require an operator role. Read-only status is operator-only too: the
 * data reveals key references and provider identifiers that should not
 * leak to unauthenticated callers.
 */
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  getDefaultCA,
  getConfiguredHsmDriver,
  computeContentHash,
  HybridSigner,
} from '@szl-holdings/pqc-identity';
import type { HsmAttestation, HsmSigner } from '@szl-holdings/pqc-identity';
import { db, pqcHsmDrReadinessTable } from '@szl-holdings/db';
import {
  getHsmAuditSummary,
  getDrReadinessReport,
  listActiveIntermediates,
} from '../lib/pqc-hsm-store';

const router: IRouter = Router();

const ROOT_ISSUER = 'SZL Holdings Root CA v1';

function getRootSignerOrThrow(): HsmSigner {
  const ca = getDefaultCA();
  return ca.getRootSigner();
}

router.get(
  '/pqc/ca/hsm-status',
  authMiddleware(),
  requireRole('admin', 'operator'),
  async (_req: Request, res: Response) => {
    try {
      const ca = getDefaultCA();
      const driver = getConfiguredHsmDriver();
      const auditSummary = await getHsmAuditSummary(25);
      const intermediates = await listActiveIntermediates(ROOT_ISSUER);
      const dr = await getDrReadinessReport(ROOT_ISSUER);

      let signerHealth: { available: boolean; latencyMs: number | null; message?: string } = {
        available: false,
        latencyMs: null,
        message: 'root signer unavailable',
      };
      try {
        const signer = getRootSignerOrThrow();
        const h = await signer.health();
        signerHealth = { available: h.available, latencyMs: h.latencyMs, message: h.message };
      } catch (err) {
        signerHealth.message = err instanceof Error ? err.message : String(err);
      }

      sendSuccess(res, {
        driver,
        rootIssuer: ca.issuerName,
        rootPublicKeys: ca.rootPublicKeys,
        signerHealth,
        intermediates,
        audit: auditSummary,
        disasterRecovery: dr,
        configuredAt: Date.now(),
      });
    } catch (err) {
      handleRouteError(res, err, 'pqc-hsm-status');
    }
  },
);

router.post(
  '/pqc/ca/attest',
  authMiddleware(),
  requireRole('admin', 'operator'),
  async (req: Request, res: Response) => {
    try {
      const { challenge, requester } = (req.body ?? {}) as { challenge?: string; requester?: string };
      const ca = getDefaultCA();
      const signer = getRootSignerOrThrow();
      const issuedAt = Date.now();
      const statementBody = {
        statement: 'I currently control private key X',
        keyRef: signer.keyRef,
        issuer: ca.issuerName,
        publicKeys: ca.rootPublicKeys,
        challenge: challenge ?? null,
        issuedAt,
      };
      const statement = JSON.stringify(statementBody, Object.keys(statementBody).sort());
      const attestation: HsmAttestation = await signer.attest(statement, {
        requesterIdentity: requester ?? (req as Request & { user?: { id?: string } }).user?.id ?? 'operator',
        operation: 'attest',
        metadata: { challenge: challenge ?? null },
      });

      // Verifiable independently of this application: caller checks
      // attestation.signature against attestation.publicKeys.
      const verdict = HybridSigner.verifyString(statement, attestation.signature);

      sendSuccess(res, {
        attestation,
        statement,
        verifiable: verdict.valid,
        verificationHint: {
          algorithm: 'hybrid-v1 (Ed25519 + ML-DSA-65)',
          note: 'Reproduce by hashing the canonical statement and verifying with attestation.publicKeys.',
          statementHash: computeContentHash(statement),
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'pqc-hsm-attest');
    }
  },
);

router.get(
  '/pqc/ca/disaster-recovery/readiness',
  authMiddleware(),
  requireRole('admin', 'operator'),
  async (_req: Request, res: Response) => {
    try {
      const report = await getDrReadinessReport(ROOT_ISSUER);
      sendSuccess(res, report);
    } catch (err) {
      handleRouteError(res, err, 'pqc-hsm-dr-readiness');
    }
  },
);

router.post(
  '/pqc/ca/disaster-recovery/rehearse',
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as {
        rehearsalType?: 'backup-verify' | 'operator-roster' | 'recovery-rehearsal' | 'rotation-rehearsal';
        outcome?: 'passed' | 'failed' | 'degraded';
        operatorsPresent?: number;
        operatorsRequired?: number;
        notes?: string;
        metadata?: Record<string, unknown>;
      };

      if (!body.rehearsalType || !body.outcome) {
        sendError(res, 'rehearsalType and outcome are required', 400, 'BAD_REQUEST');
        return;
      }

      await db.insert(pqcHsmDrReadinessTable).values({
        issuer: ROOT_ISSUER,
        rehearsalType: body.rehearsalType,
        outcome: body.outcome,
        operatorsPresent: body.operatorsPresent ?? 0,
        operatorsRequired: body.operatorsRequired ?? 0,
        notes: body.notes ?? null,
        metadata: body.metadata ?? null,
      });

      const report = await getDrReadinessReport(ROOT_ISSUER);
      sendSuccess(res, { recorded: true, report });
    } catch (err) {
      handleRouteError(res, err, 'pqc-hsm-dr-rehearse');
    }
  },
);

router.get(
  '/pqc/ca/intermediates',
  authMiddleware(),
  requireRole('admin', 'operator'),
  async (_req: Request, res: Response) => {
    try {
      const intermediates = await listActiveIntermediates(ROOT_ISSUER);
      sendSuccess(res, { rootIssuer: ROOT_ISSUER, intermediates });
    } catch (err) {
      handleRouteError(res, err, 'pqc-hsm-intermediates');
    }
  },
);

export default router;
