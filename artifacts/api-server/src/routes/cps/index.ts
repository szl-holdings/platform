import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendCreated,
  sendNotFound,
  sendSuccess,
  sendError,
} from '../../lib/api-response.js';
import { validateBody } from '../../lib/validation.js';
import { bodyShape } from '@szl-holdings/contracts/common';
import { authMiddleware } from '../../middlewares/auth.js';
import {
  listPayloads,
  getPayload,
  listRuns,
  getRun,
  executePayloadRun,
  approveRun,
  rollbackRun,
  updatePayloadMaturity,
  listApprovals,
  registerPayload,
  canApproveAtTier,
  type CpsMaturityMode,
  type CpsPrincipal,
} from '../../lib/domain-services/cps/index.js';
import { FLAGSHIP_PAYLOADS } from '../../lib/domain-services/cps/payloads.js';
import { checkPayloadMaturityGate } from '../../jobs/adversary-emulation-loop.js';

for (const payload of FLAGSHIP_PAYLOADS) {
  registerPayload(payload);
}

function extractPrincipal(req: import('express').Request): CpsPrincipal {
  const user = req.user;
  return {
    id: String(user?.id ?? 'anonymous'),
    displayName: user?.displayName ?? 'Unknown',
    email: user?.email ?? null,
    roles: (user?.roles as string[]) ?? [],
  };
}

function extractTenantId(req: import('express').Request): string {
  return req.tenantOrgId?.toString() ?? req.user?.orgs?.[0]?.orgId?.toString() ?? 'default';
}

const router = Router();

router.get('/cps/payloads', authMiddleware(), async (_req, res) => {
  try {
    sendSuccess(res, listPayloads());
  } catch (err) {
    handleRouteError(res, err, 'Failed to list CPS payloads');
  }
});

router.get('/cps/payloads/:id', authMiddleware(), async (req, res) => {
  try {
    const payload = getPayload(req.params.id as string);
    if (!payload) {
      sendNotFound(res, 'CPS Payload');
      return;
    }
    sendSuccess(res, payload);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get CPS payload');
  }
});

const MATURITY_REQUIRED_ROLES: Record<string, string[]> = {
  shadow: ['analyst', 'operator', 'ops', 'supervisor', 'manager', 'admin', 'super_admin'],
  'supervised-auto': ['supervisor', 'manager', 'admin', 'super_admin'],
  autonomous: ['executive', 'ciso', 'admin', 'super_admin'],
};

router.patch(
  '/cps/payloads/:id/maturity',
  authMiddleware({ required: true }),
  validateBody(bodyShape({ mode: z.unknown() })),
  async (req, res) => {
    try {
      const { mode } = z.object({ mode: z.enum(['shadow', 'supervised-auto', 'autonomous']) }).parse(req.body);
      const principal = extractPrincipal(req);
      const allowedRoles = MATURITY_REQUIRED_ROLES[mode] ?? [];
      if (!principal.roles.some((r) => allowedRoles.includes(r))) {
        sendError(
          res,
          `Maturity escalation to '${mode}' requires one of: ${allowedRoles.join(', ')}`,
          403,
          'FORBIDDEN',
        );
        return;
      }

      const payloadId = req.params.id as string;
      const existing = getPayload(payloadId);
      if (!existing) {
        sendNotFound(res, 'CPS Payload');
        return;
      }

      const MATURITY_RANK: Record<string, number> = {
        shadow: 0,
        'supervised-auto': 1,
        autonomous: 2,
      };
      const currentRank = MATURITY_RANK[existing.defaultMaturityMode] ?? 0;
      const targetRank = MATURITY_RANK[mode] ?? 0;
      const isPromotion = targetRank > currentRank;

      if (isPromotion && (mode === 'supervised-auto' || mode === 'autonomous')) {
        const gate = await checkPayloadMaturityGate(payloadId);
        if (!gate.allowed) {
          sendError(
            res,
            `Payload '${payloadId}' cannot be promoted to '${mode}' — emulation scorecard gate failed. Blockers: ${gate.blockers.join('; ')}`,
            422,
            'MATURITY_GATE_BLOCKED',
            { gate },
          );
          return;
        }
      }

      const tenantId = extractTenantId(req);
      const payload = updatePayloadMaturity(payloadId, mode, tenantId);
      if (!payload) {
        sendNotFound(res, 'CPS Payload');
        return;
      }
      sendSuccess(res, payload);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update payload maturity');
    }
  },
);

router.get('/cps/payloads/:id/maturity-gate', authMiddleware(), async (req, res) => {
  try {
    const gate = await checkPayloadMaturityGate(req.params.id as string);
    sendSuccess(res, gate);
  } catch (err) {
    handleRouteError(res, err, 'Failed to evaluate maturity gate');
  }
});

router.get('/cps/maturity-gates', authMiddleware(), async (_req, res) => {
  try {
    const payloads = listPayloads();
    const gates = await Promise.all(
      payloads.map(async (p) => {
        try {
          return await checkPayloadMaturityGate(p.id);
        } catch {
          return {
            payloadId: p.id,
            payloadName: p.name,
            allowed: false,
            compositeConfidence: null,
            detectionRate: null,
            requiredThreshold: 0.75,
            regressionInLastRun: false,
            blockers: ['Failed to evaluate emulation gate'],
            coverageGaps: [],
          };
        }
      }),
    );
    const byPayload: Record<string, (typeof gates)[number]> = {};
    for (const g of gates) byPayload[g.payloadId] = g;
    sendSuccess(res, { gates: byPayload });
  } catch (err) {
    handleRouteError(res, err, 'Failed to evaluate maturity gates');
  }
});

router.get('/cps/runs', authMiddleware(), async (req, res) => {
  try {
    const payloadId = req.query.payloadId as string | undefined;
    const status = req.query.status as string | undefined;
    const tenantId = extractTenantId(req);
    sendSuccess(res, await listRuns({ payloadId, status, tenantId }));
  } catch (err) {
    handleRouteError(res, err, 'Failed to list CPS runs');
  }
});

router.get('/cps/runs/:id', authMiddleware(), async (req, res) => {
  try {
    const tenantId = extractTenantId(req);
    const run = await getRun(req.params.id as string, tenantId);
    if (!run) {
      sendNotFound(res, 'CPS Run');
      return;
    }
    sendSuccess(res, run);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get CPS run');
  }
});

const RUN_EXECUTION_ROLES = ['analyst', 'operator', 'ops', 'supervisor', 'manager', 'executive', 'ciso', 'admin', 'super_admin'];

router.post(
  '/cps/runs',
  authMiddleware({ required: true }),
  validateBody(bodyShape({ payloadId: z.unknown(), maturityMode: z.unknown().optional() })),
  async (req, res) => {
    try {
      const { payloadId, maturityMode } = z
        .object({
          payloadId: z.string().min(1),
          maturityMode: z.enum(['shadow', 'supervised-auto', 'autonomous']).optional(),
        })
        .parse(req.body);
      const principal = extractPrincipal(req);

      if (!principal.roles.some((r) => RUN_EXECUTION_ROLES.includes(r))) {
        sendError(res, 'CPS run execution requires an operator, supervisor, or executive role', 403, 'FORBIDDEN');
        return;
      }

      if (maturityMode) {
        const allowedRoles = MATURITY_REQUIRED_ROLES[maturityMode] ?? [];
        if (!principal.roles.some((r) => allowedRoles.includes(r))) {
          sendError(
            res,
            `Executing in '${maturityMode}' mode requires one of: ${allowedRoles.join(', ')}`,
            403,
            'FORBIDDEN',
          );
          return;
        }

        if (maturityMode === 'supervised-auto' || maturityMode === 'autonomous') {
          const gate = await checkPayloadMaturityGate(payloadId);
          if (!gate.allowed) {
            sendError(
              res,
              `Payload '${payloadId}' does not meet the adversary emulation maturity gate for '${maturityMode}' mode. Blockers: ${gate.blockers.join('; ')}`,
              422,
              'MATURITY_GATE_BLOCKED',
            );
            return;
          }
        }
      }

      const tenantId = extractTenantId(req);
      const run = await executePayloadRun(
        payloadId,
        principal,
        maturityMode as CpsMaturityMode | undefined,
        tenantId,
      );
      sendCreated(res, run);
    } catch (err) {
      handleRouteError(res, err, 'Failed to execute CPS run');
    }
  },
);

const ROLLBACK_REQUIRED_ROLES = ['operator', 'ops', 'supervisor', 'manager', 'executive', 'ciso', 'admin', 'super_admin'];

router.post(
  '/cps/runs/:id/rollback',
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const principal = extractPrincipal(req);
      if (!principal.roles.some((r) => ROLLBACK_REQUIRED_ROLES.includes(r))) {
        sendError(
          res,
          'CPS rollback requires an operator, supervisor, or executive role',
          403,
          'FORBIDDEN',
        );
        return;
      }
      const tenantId = extractTenantId(req);
      const run = await rollbackRun(req.params.id as string, principal, tenantId);
      if (!run) {
        sendNotFound(res, 'CPS Run');
        return;
      }
      sendSuccess(res, run);
    } catch (err) {
      handleRouteError(res, err, 'Failed to rollback CPS run');
    }
  },
);

router.get('/cps/approvals', authMiddleware(), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const runId = req.query.runId as string | undefined;
    const tenantId = extractTenantId(req);
    sendSuccess(res, await listApprovals({ status, runId, tenantId }));
  } catch (err) {
    handleRouteError(res, err, 'Failed to list CPS approvals');
  }
});

router.post(
  '/cps/approvals/:id',
  authMiddleware({ required: true }),
  validateBody(bodyShape({ approved: z.unknown(), reason: z.unknown().optional() })),
  async (req, res) => {
    try {
      const { approved, reason } = z
        .object({ approved: z.boolean(), reason: z.string().optional() })
        .parse(req.body);
      const principal = extractPrincipal(req);
      const tenantId = extractTenantId(req);
      const run = await approveRun(
        req.params.id as string,
        principal,
        approved,
        reason,
        tenantId,
      );
      if (!run) {
        sendNotFound(res, 'CPS Approval');
        return;
      }
      sendSuccess(res, run);
    } catch (err) {
      handleRouteError(res, err, 'Failed to process CPS approval');
    }
  },
);

router.get('/cps/runs/:id/proof-bundle', authMiddleware(), async (req, res) => {
  try {
    const tenantId = extractTenantId(req);
    const run = await getRun(req.params.id as string, tenantId);
    if (!run) {
      sendNotFound(res, 'CPS Run');
      return;
    }
    if (!run.proofBundle) {
      sendError(res, 'Proof bundle not yet available for this run', 404, 'NOT_FOUND');
      return;
    }
    sendSuccess(res, run.proofBundle);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get proof bundle');
  }
});

router.get('/cps/executive/status', authMiddleware(), async (req, res) => {
  try {
    const tenantId = extractTenantId(req);
    const runs = await listRuns({ tenantId });
    const payloads = listPayloads();
    const pendingApprovals = await listApprovals({ status: 'pending', tenantId });
    const recentRuns = runs.slice(0, 20);

    const activeContainments = recentRuns.filter(
      (r) => r.status === 'acting' || r.status === 'awaiting-approval',
    );
    const completedLast24h = recentRuns.filter((r) => {
      if (!r.completedAt) return false;
      return Date.now() - new Date(r.completedAt).getTime() < 24 * 60 * 60 * 1000;
    });

    const byPayload = payloads.map((p) => {
      const payloadRuns = runs.filter((r) => r.payloadId === p.id);
      return {
        payloadId: p.id,
        payloadName: p.name,
        maturityMode: p.defaultMaturityMode,
        totalRuns: payloadRuns.length,
        completedRuns: payloadRuns.filter((r) => r.status === 'completed').length,
        failedRuns: payloadRuns.filter((r) => r.status === 'failed' || r.status === 'blocked').length,
        lastRunAt: payloadRuns[0]?.startedAt ?? null,
      };
    });

    sendSuccess(res, {
      summary: {
        totalPayloads: payloads.length,
        totalRuns: runs.length,
        activeContainments: activeContainments.length,
        pendingApprovals: pendingApprovals.length,
        completedLast24h: completedLast24h.length,
        rolledBack: runs.filter((r) => r.status === 'rolled-back').length,
      },
      pendingApprovals,
      activeContainments,
      byPayload,
      recentRuns: recentRuns.slice(0, 10),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get CPS executive status');
  }
});

export function register(parentRouter: IRouter): void {
  parentRouter.use(router);
}

export default router;
