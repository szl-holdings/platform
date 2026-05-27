/**
 * MeMo reflection-memory surface — read-side admission + receipt lookup.
 *
 * Mounted public-read alongside /api/putnam under the receipt-chain
 * discipline established by the Putnam harness and the synthesis doc at
 * `docs/research/memo-synthesis-2026.md`.
 *
 * Honesty rules (Doctrine V6):
 *   - We do not invent receipts. Admission emits an admitted/rejected
 *     receipt skeleton; the freshnessNonce and issuedAt are stamped here.
 *   - We do not bind any LLM here. The kit is dependency-free and pure.
 *   - The route surface is intentionally narrow: admit an envelope, look
 *     up a run by chain head. Orchestration is a separate concern.
 */
import { randomBytes } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import {
  admitExecutive,
  computeReceiptRef,
  RECEIPT_CLASSES,
  type AdmissionPolicy,
  type ExecutiveProtocolEnvelope,
} from '@szl-holdings/memo-reflection-kit';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const DEFAULT_POLICY: AdmissionPolicy = {
  maxStageBudget: 64,
  minStageBudget: 1,
  minAgreementFloor: 0.2,
  permittedExecutiveModels: ['claude-opus-4-7', 'claude-sonnet-4-6'],
  permittedMemoryModelRefs: [],
};

function nonce(): string {
  return randomBytes(8).toString('hex');
}

/**
 * GET /api/memo/receipts/classes
 *
 * Returns the canonical, ordered list of memo.*.v1 receipt classes this
 * platform may emit. Operators and downstream auditors can diff this
 * against the on-disk receipt corpus to detect schema drift.
 */
router.get('/receipts/classes', (_req: Request, res: Response) => {
  try {
    return sendSuccess(res, {
      receiptClasses: RECEIPT_CLASSES,
      synthesisDoc: 'docs/research/memo-synthesis-2026.md',
      kit: '@szl-holdings/memo-reflection-kit',
    });
  } catch (err) {
    return handleRouteError(res, err, 'memo.receipts.classes');
  }
});

/**
 * GET /api/memo/policy
 *
 * Returns the default admission policy. Operators may inspect the
 * current ceiling on stage budgets and the permitted executive-model
 * roster without admitting an envelope.
 */
router.get('/policy', (_req: Request, res: Response) => {
  try {
    return sendSuccess(res, { policy: DEFAULT_POLICY });
  } catch (err) {
    return handleRouteError(res, err, 'memo.policy');
  }
});

/**
 * POST /api/memo/executive/admit
 *
 * Admit a proposed ExecutiveProtocolEnvelope under the default policy.
 * Returns the admitted or rejected receipt body (with a freshnessNonce
 * and issuedAt stamped here) plus its content-addressed ref. The caller
 * is responsible for persisting and chaining the receipt downstream.
 */
router.post('/executive/admit', authMiddleware({ required: true }), async (req: Request, res: Response) => {
  try {
    const proposed = req.body?.envelope as ExecutiveProtocolEnvelope | undefined;
    // Tenant binding — authoritative ONLY, no caller-supplied fallback.
    // Pull from the canonical AuthenticatedUser.orgs[].orgId (the shape
    // every auth middleware produces — see packages/auth-shared/src/types.ts).
    // If the caller asked for a specific org via body.orgId, it must match
    // one they actually belong to; otherwise we refuse. No "unbound"
    // attribution — an admitted receipt with a fake tenant is worse than
    // no admission at all.
    const userOrgs = req.user?.orgs ?? [];
    // Reject malformed body.orgId rather than silently falling back. If
    // the key is present at all, it must be a number that matches a real
    // membership — otherwise we refuse. Absent key is fine and uses the
    // principal's first membership.
    const hasOrgIdKey =
      req.body !== null && typeof req.body === 'object' && 'orgId' in req.body;
    if (hasOrgIdKey && typeof req.body.orgId !== 'number') {
      return sendSuccess(res, {
        ok: false,
        error: 'tenant-binding-failed',
        explanation: `body.orgId must be a number when supplied (got ${typeof req.body.orgId})`,
      }, 403);
    }
    const requestedOrgId = hasOrgIdKey ? (req.body.orgId as number) : null;
    const boundOrg =
      requestedOrgId !== null
        ? userOrgs.find((o) => o.orgId === requestedOrgId) ?? null
        : userOrgs[0] ?? null;
    if (!boundOrg) {
      return sendSuccess(res, {
        ok: false,
        error: 'tenant-binding-failed',
        explanation:
          requestedOrgId !== null
            ? `principal is not a member of org ${requestedOrgId}`
            : 'principal has no org memberships — cannot authoritatively bind a tenant',
      }, 403);
    }
    const tenant = `org:${boundOrg.orgId}`;
    if (!proposed || typeof proposed !== 'object') {
      return sendSuccess(res, {
        ok: false,
        error: 'envelope-required',
        message: 'POST body must include `envelope: ExecutiveProtocolEnvelope`',
      });
    }
    const result = admitExecutive({
      proposed,
      policy: DEFAULT_POLICY,
      tenant,
    });
    const issuedAt = new Date().toISOString();
    if (result.ok) {
      const body = {
        ...result.admitted,
        freshnessNonce: nonce(),
        issuedAt,
      };
      const ref = await computeReceiptRef(body);
      return sendSuccess(res, { ok: true, ref, receipt: body });
    }
    const body = {
      ...result.rejected,
      freshnessNonce: nonce(),
      issuedAt,
    };
    const ref = await computeReceiptRef(body);
    return sendSuccess(res, { ok: false, ref, receipt: body });
  } catch (err) {
    return handleRouteError(res, err, 'memo.executive.admit');
  }
});

export default router;
