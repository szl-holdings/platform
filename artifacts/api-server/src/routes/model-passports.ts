/**
 * Model Passport Registry API
 *
 * Endpoints for the signed Model Passport lifecycle:
 *   POST   /model-passports            — register a new passport
 *   GET    /model-passports            — list passports (filter by lane, tier, state, tenant)
 *   GET    /model-passports/:id        — fetch one passport by id
 *   POST   /model-passports/:id/verify — re-verify signature + provenance hash live
 *   POST   /model-passports/resolve    — resolve best passport for given lane + budget + SLA + tenant
 *   PATCH  /model-passports/:id/state  — transition passport lifecycle state
 *   POST   /model-passports/seed       — (ops only) seed passports for current allow-listed models
 */

import { db, modelPassportsTable } from '@szl-holdings/db';
import {
  computeSignatureDigest,
  getSeedPassports,
  resolvePassport,
  validateSignedPassport,
  verifyAndSummarize,
  verifyPassportSignature,
} from '@szl-holdings/model-passport';
import type { SignedModelPassport } from '@szl-holdings/model-passport';
import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendCreated, sendError, sendNotFound, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

const PRIVILEGED_ROLES = new Set(['super_admin', 'admin', 'ops', 'operator']);
const APPROVER_ROLES = new Set(['super_admin', 'admin', 'approver']);

function isPrivileged(user?: AuthenticatedUser): boolean {
  return user?.roles?.some((r) => PRIVILEGED_ROLES.has(r)) ?? false;
}

function isApprover(user?: AuthenticatedUser): boolean {
  return user?.roles?.some((r) => APPROVER_ROLES.has(r)) ?? false;
}

const registerPassportSchema = z.object({
  signedJson: z.unknown(),
});

const listQuerySchema = z.object({
  lane: z.string().optional(),
  tier: z.string().optional(),
  state: z.string().optional(),
  tenantId: z.string().optional(),
  limit: z.string().optional(),
});

const stateTransitionSchema = z.object({
  state: z.enum(['draft', 'proposed', 'approved', 'active', 'deprecated', 'revoked']),
  reason: z.string().optional(),
});

const resolveQuerySchema = z.object({
  lane: z.enum(['classification', 'triage', 'reasoning', 'planning', 'tool_calling', 'vision_understanding', 'background_batch', 'extraction', 'summarization']),
  budgetUsdPerCall: z.number().positive().optional(),
  slaP95Ms: z.number().int().positive().optional(),
  tenantId: z.number().int().optional(),
  requiredCapabilities: z.array(z.string()).optional(),
});

function rowToSigned(row: typeof modelPassportsTable.$inferSelect): SignedModelPassport {
  return row.signedJson as SignedModelPassport;
}

async function getActivePassportsForTenant(tenantId?: number): Promise<SignedModelPassport[]> {
  const rows = await db
    .select()
    .from(modelPassportsTable)
    .where(eq(modelPassportsTable.state, 'active'));

  return rows
    .filter((r) => !tenantId || r.tenantId === tenantId || r.tenantId === null)
    .map(rowToSigned);
}

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendBadRequest(res, 'Invalid query parameters');
      return;
    }
    const { lane, tier, state, tenantId, limit } = parsed.data;

    let query = db.select().from(modelPassportsTable).$dynamic();

    const conditions = [];
    if (state) conditions.push(eq(modelPassportsTable.state, state as string));
    if (tier) conditions.push(eq(modelPassportsTable.quantTier, tier));
    if (tenantId) conditions.push(eq(modelPassportsTable.tenantId, parseInt(tenantId, 10)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.limit(parseInt(limit ?? '100', 10));

    let passports = rows.map((r) => ({
      id: r.id,
      displayName: r.displayName,
      provider: r.provider,
      providerModelId: r.providerModelId,
      quantTier: r.quantTier,
      lanes: r.lanes as string[],
      state: r.state,
      tenantId: r.tenantId,
      costPer1kTokensUsd: r.costPer1kTokensUsd,
      p50LatencyMs: r.p50LatencyMs,
      p95LatencyMs: r.p95LatencyMs,
      evalPassRate: r.evalPassRate,
      autonomyTier: r.autonomyTier,
      signatureDigest: computeSignatureDigest(r.signature),
      provenanceHash: r.provenanceHash,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    if (lane) {
      passports = passports.filter((p) => (p.lanes as string[]).includes(lane));
    }

    sendSuccess(res, passports, 200, { total: passports.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list model passports');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    sendSuccess(res, {
      ...row,
      signatureDigest: computeSignatureDigest(row.signature),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch model passport');
  }
});

router.post('/resolve', validateBody(resolveQuerySchema), async (req, res) => {
  try {
    const query = req.body as z.infer<typeof resolveQuerySchema>;
    const actingTenantId = req.user?.orgs?.[0]?.orgId ?? undefined;

    const store = {
      listActive: async () => getActivePassportsForTenant(actingTenantId ?? query.tenantId),
      getById: async (id: string) => {
        const [row] = await db
          .select()
          .from(modelPassportsTable)
          .where(and(eq(modelPassportsTable.id, id), eq(modelPassportsTable.state, 'active')))
          .limit(1);
        return row ? rowToSigned(row) : null;
      },
    };

    const result = await resolvePassport(query as Parameters<typeof resolvePassport>[0], store);
    if (!result) {
      sendSuccess(res, { resolved: false, reason: 'No matching active passport found for the given criteria' });
      return;
    }

    sendSuccess(res, {
      resolved: true,
      passportId: result.passportId,
      signatureDigest: result.signatureDigest,
      displayName: result.passport.passport.identity.displayName,
      model: result.passport.passport.identity.providerModelId,
      provider: result.passport.passport.identity.provider,
      quantTier: result.passport.passport.quantProfile.tier,
      costPer1kTokensUsd: result.passport.passport.costProfile.costPer1kTokensUsd,
      p95LatencyMs: result.passport.passport.costProfile.p95LatencyMs,
      evalPassRate: result.passport.passport.costProfile.evalPassRate,
      autonomyTier: result.passport.passport.policyEnvelope.autonomyTier,
      downgradeLadder: result.downgradeLadder,
      passport: result.passport,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to resolve model passport');
  }
});

router.post('/:id/verify', async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    const signed = rowToSigned(row);
    const result = verifyAndSummarize(signed);
    const signatureDigest = computeSignatureDigest(row.signature);

    sendSuccess(res, {
      passportId: row.id,
      signatureDigest,
      provenanceHash: row.provenanceHash,
      ...result,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to verify model passport');
  }
});

router.post('/', async (req, res) => {
  if (!isPrivileged(req.user)) {
    sendError(res, 'Insufficient privileges — passport registration requires ops or admin role', 403);
    return;
  }

  try {
    const bodyParsed = registerPassportSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      sendBadRequest(res, 'Invalid request body', bodyParsed.error.flatten());
      return;
    }

    // Full schema validation via the shared model-passport package.
    // This enforces all structural, enum, and range constraints defined in
    // the canonical schema — including nested quant profile, capability surface,
    // policy envelope, and provenance fields.
    const passportValidation = validateSignedPassport(bodyParsed.data.signedJson);
    if (!passportValidation.success) {
      sendBadRequest(res, 'Passport schema validation failed', passportValidation.error.flatten());
      return;
    }

    const signedJson = passportValidation.data as SignedModelPassport;
    const passport = signedJson.passport;

    const { signatureOk, hashOk } = verifyPassportSignature(signedJson);

    if (!signatureOk || !hashOk) {
      sendBadRequest(res, 'Passport signature or provenance hash verification failed — all registered passports must carry a valid Ed25519 signature');
      return;
    }

    const id = passport.identity.id;
    const signatureDigest = computeSignatureDigest(signedJson.signature);
    const lanes = passport.capabilitySurface.lanes;

    await db.insert(modelPassportsTable).values({
      id,
      tenantId: passport.tenantId ?? null,
      displayName: passport.identity.displayName,
      version: passport.identity.version,
      provider: passport.identity.provider,
      providerModelId: passport.identity.providerModelId,
      quantTier: passport.quantProfile.tier,
      lanes: lanes,
      state: passport.state,
      signedJson: signedJson as unknown as Record<string, unknown>,
      signature: signedJson.signature,
      signerPublicKey: signedJson.signerPublicKey,
      provenanceHash: signedJson.provenanceHash,
      downgradeTo: passport.downgradeTo,
      costPer1kTokensUsd: String(passport.costProfile.costPer1kTokensUsd),
      p50LatencyMs: passport.costProfile.p50LatencyMs,
      p95LatencyMs: passport.costProfile.p95LatencyMs,
      evalPassRate: String(passport.costProfile.evalPassRate),
      autonomyTier: passport.policyEnvelope.autonomyTier,
      approvals: passport.approvals as unknown as Record<string, unknown>[],
    }).onConflictDoUpdate({
      target: modelPassportsTable.id,
      set: {
        displayName: passport.identity.displayName,
        state: passport.state,
        signedJson: signedJson as unknown as Record<string, unknown>,
        signature: signedJson.signature,
        provenanceHash: signedJson.provenanceHash,
        updatedAt: new Date(),
      },
    });

    logger.info({ passportId: id, signatureDigest }, 'Model passport registered');
    sendCreated(res, { id, signatureDigest, provenanceHash: signedJson.provenanceHash });
  } catch (err) {
    handleRouteError(res, err, 'Failed to register model passport');
  }
});

router.patch('/:id/state', validateBody(stateTransitionSchema), async (req, res) => {
  const { state: newState, reason } = req.body as z.infer<typeof stateTransitionSchema>;

  if (!isPrivileged(req.user)) {
    sendError(res, 'Insufficient privileges — state transitions require ops or admin role', 403);
    return;
  }

  // ── Covenant Policy gate ───────────────────────────────────────────────────
  // Transitions to 'active' (enables live routing) and 'revoked' (hard-removes
  // from routing) are high-risk actions that require Covenant Policy evaluation.
  // The engine either PERMITS the transition immediately, or creates an approval
  // request that must be resolved before the state changes. Non-high-risk
  // transitions (draft → proposed → approved → deprecated) proceed directly.
  const HIGH_RISK_TRANSITIONS = new Set(['active', 'revoked']);

  try {
    const [row] = await db
      .select()
      .from(modelPassportsTable)
      .where(eq(modelPassportsTable.id, req.params.id!))
      .limit(1);

    if (!row) {
      sendNotFound(res, 'Passport not found');
      return;
    }

    if (HIGH_RISK_TRANSITIONS.has(newState)) {
      const { covenantEngine, createApprovalRequest } = await import('@szl-holdings/covenant-policy');
      const userId = typeof req.user?.userId === 'number' ? req.user.userId : null;
      const userRole = (req.user?.roles?.[0] as string | undefined) ?? undefined;

      // Covenant evaluation — permit/deny/escalate for all callers.
      const decision = covenantEngine.evaluate({
        subject: {
          roles: (req.user?.roles ?? []) as string[],
          userId: String(req.user?.userId ?? ''),
          tenantId: String(row.tenantId ?? ''),
          attributes: {},
        },
        resource: {
          type: 'model_passport',
          id: req.params.id!,
          domain: null,
          actionClass: `state_transition.${newState}`,
          attributes: { fromState: row.state, toState: newState },
        },
        action: 'model_passport.transition',
        context: { reason },
      });

      if (decision.effect === 'deny') {
        sendError(res, decision.reason ?? `Covenant policy denied state transition to '${newState}'`, 403);
        return;
      }

      if (decision.effect === 'escalate' || !isApprover(req.user)) {
        const approval = await createApprovalRequest({
          orgId: typeof row.tenantId === 'number' ? row.tenantId : null,
          resourceType: 'model_passport.state',
          resourceId: req.params.id!,
          title: `Passport state transition to '${newState}': ${row.displayName}`,
          description: reason ?? `Operator requested transition from '${row.state}' to '${newState}'`,
          actionClass: 'model_governance',
          priority: newState === 'revoked' ? 'critical' : 'high',
          requestedById: userId,
          requestedByRole: userRole,
          requiredApproverRole: 'approver',
          correlationId: req.params.id,
          serviceAttribution: 'model-passport.state-transition',
          payload: {
            passportId: req.params.id,
            fromState: row.state,
            toState: newState,
            reason,
            covenantDecision: decision.effect,
          },
        });

        sendSuccess(res, {
          id: req.params.id,
          status: 'pending_approval',
          approvalRequestId: approval.id,
          message: `Transition to '${newState}' requires approval. Approval request #${approval.id} created.`,
        });
        return;
      }
      // permit + isApprover — fall through to execute.
    }

    const updateData: Partial<typeof modelPassportsTable.$inferInsert> = {
      state: newState,
      updatedAt: new Date(),
    };

    if (newState === 'revoked') {
      updateData.revokedAt = new Date();
      updateData.revokedBy = String(req.user?.userId ?? 'unknown');
      updateData.revocationReason = reason ?? 'Revoked by approver';
    }

    await db
      .update(modelPassportsTable)
      .set(updateData)
      .where(eq(modelPassportsTable.id, req.params.id!));

    logger.info(
      { passportId: req.params.id, fromState: row.state, toState: newState, reason },
      'Passport state transitioned',
    );
    sendSuccess(res, { id: req.params.id, state: newState, updatedAt: updateData.updatedAt });
  } catch (err) {
    handleRouteError(res, err, 'Failed to transition passport state');
  }
});

router.post('/seed', requireRole('admin'), async (req, res) => {
  try {
    const seeds = getSeedPassports();
    const results: Array<{ id: string; status: 'inserted' | 'skipped' | 'error'; error?: string }> = [];

    for (const signed of seeds) {
      const passport = signed.passport;
      const id = passport.identity.id;

      try {
        await db.insert(modelPassportsTable).values({
          id,
          tenantId: passport.tenantId ?? null,
          displayName: passport.identity.displayName,
          version: passport.identity.version,
          provider: passport.identity.provider,
          providerModelId: passport.identity.providerModelId,
          quantTier: passport.quantProfile.tier,
          lanes: passport.capabilitySurface.lanes,
          state: passport.state,
          signedJson: signed as unknown as Record<string, unknown>,
          signature: signed.signature,
          signerPublicKey: signed.signerPublicKey,
          provenanceHash: signed.provenanceHash,
          downgradeTo: passport.downgradeTo,
          costPer1kTokensUsd: String(passport.costProfile.costPer1kTokensUsd),
          p50LatencyMs: passport.costProfile.p50LatencyMs,
          p95LatencyMs: passport.costProfile.p95LatencyMs,
          evalPassRate: String(passport.costProfile.evalPassRate),
          autonomyTier: passport.policyEnvelope.autonomyTier,
          approvals: passport.approvals as unknown as Record<string, unknown>[],
        }).onConflictDoNothing();
        results.push({ id, status: 'inserted' });
      } catch (err) {
        results.push({ id, status: 'error', error: err instanceof Error ? err.message : String(err) });
      }
    }

    logger.info({ count: results.filter((r) => r.status === 'inserted').length }, 'Seed passports registered');
    sendSuccess(res, { seeded: results.filter((r) => r.status === 'inserted').length, results });
  } catch (err) {
    handleRouteError(res, err, 'Failed to seed passports');
  }
});

export default router;
