import { getStepLog, type StepLogEntry } from '@workspace/agents-core/step-log';
import { createPromptEvalSuite, createToolEvalSuite } from '@workspace/agents-evals';
import {
  alertEscalationTool,
  budgetForecastTool,
  complianceCheckTool,
  fundTransferTool,
  portfolioSnapshotTool,
  type TypedTool,
  threatScanTool,
} from '@workspace/agents-tools';
import {
  getPendingApprovalRequests,
  resolvePendingApprovalRequest,
} from '@workspace/approvals-inbox';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';

// createToolEvalSuite accepts TypedTool<unknown, unknown>; the concrete tools
// have specific input/output generics that must be widened for the call.
const _asGenericTool = (t: unknown): TypedTool<unknown, unknown> =>
  t as TypedTool<unknown, unknown>;

const router: IRouter = Router();

/**
 * GET /agents/runs/:runId/step-log
 * Returns the structured StepLogEntry stream for a run, written by the
 * cognitive-runtime orchestrator via emitStepLog (agents-core/step-log).
 */
router.get('/agents/runs/:runId/step-log', authMiddleware(), (req: Request, res: Response) => {
  try {
    const runId = String(req.params['runId'] ?? '');
    const limitRaw = Number(req.query['limit'] ?? 200);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 1000) : 200;
    const sinceRaw = req.query['since'];
    const since = sinceRaw ? Number(sinceRaw) : 0;

    let entries: readonly StepLogEntry[] = getStepLog(runId);
    if (since > 0) entries = entries.filter((e) => e.timestamp > since);
    const tail = entries.slice(Math.max(0, entries.length - limit));
    sendSuccess(res, { runId, count: tail.length, entries: tail });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load step log');
  }
});

/**
 * GET /agents/approvals/pending
 * Returns pending approval requests written by ApprovalGate (approvals-inbox)
 * so the Guardian approval UI can poll a single source of truth.
 */
router.get('/agents/approvals/pending', authMiddleware(), (req: Request, res: Response) => {
  try {
    const runId = req.query['runId'] ? String(req.query['runId']) : undefined;
    const domain = req.query['domain'] ? String(req.query['domain']) : undefined;
    const filter: { runId?: string; domain?: string } = {};
    if (runId) filter.runId = runId;
    if (domain) filter.domain = domain;
    const pending = getPendingApprovalRequests(filter);
    sendSuccess(res, { count: pending.length, pending });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load pending approvals');
  }
});

/**
 * POST /agents/approvals/:runId/:stepId/resolve
 * Resolve a pending approval (approve / reject / escalate / timed_out).
 */
router.post(
  '/agents/approvals/:runId/:stepId/resolve',
  authMiddleware(),
  (req: Request, res: Response) => {
    try {
      const runId = String(req.params['runId'] ?? '');
      const stepId = String(req.params['stepId'] ?? '');
      const { verdict, resolvedBy, note } = req.body as {
        verdict?: 'approved' | 'rejected' | 'escalated';
        resolvedBy?: string;
        note?: string;
      };
      if (!verdict || !['approved', 'rejected', 'escalated'].includes(verdict)) {
        res
          .status(400)
          .json({ success: false, error: 'verdict must be one of approved|rejected|escalated' });
        return;
      }
      const actor = resolvedBy ?? (req.user?.id != null ? String(req.user.id) : 'system');
      const updated = resolvePendingApprovalRequest(runId, stepId, verdict, { actor, note });
      if (!updated) {
        res.status(404).json({ success: false, error: 'Pending approval not found' });
        return;
      }
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to resolve approval');
    }
  },
);

/**
 * GET /agents/evals/auto-suites
 * Returns auto-generated tool & prompt eval suites built via the agents-evals
 * suite builders. The Eval Console renders these alongside hand-authored
 * suites so reliability coverage stays in lockstep with the typed-tool registry.
 */
router.get('/agents/evals/auto-suites', authMiddleware(), (_req: Request, res: Response) => {
  try {
    const toolSuites = [
      createToolEvalSuite(_asGenericTool(threatScanTool), [
        {
          label: 'scan baseline asset',
          input: { assetId: 'asset-001' },
          groundTruth: { findingsCount: 0 },
        },
        {
          label: 'scan compromised asset',
          input: { assetId: 'asset-pwn' },
          groundTruth: { findingsCount: 1 },
        },
      ]),
      createToolEvalSuite(_asGenericTool(alertEscalationTool), [
        {
          label: 'p1 escalation',
          input: { alertId: 'alert-1', severity: 'critical' },
          groundTruth: { escalated: true },
        },
      ]),
      createToolEvalSuite(_asGenericTool(complianceCheckTool), [
        { label: 'soc2 baseline', input: { framework: 'SOC2' }, groundTruth: { passed: true } },
      ]),
      createToolEvalSuite(_asGenericTool(fundTransferTool), [
        {
          label: 'intra-fund transfer',
          input: { fromAccount: 'A', toAccount: 'B', amount: 1000 },
          groundTruth: { settled: true },
        },
      ]),
      createToolEvalSuite(_asGenericTool(portfolioSnapshotTool), [
        {
          label: 'snapshot pulse fund',
          input: { fundId: 'pulse-1' },
          groundTruth: { positions: 12 },
        },
      ]),
      createToolEvalSuite(_asGenericTool(budgetForecastTool), [
        { label: 'Q+1 forecast', input: { horizon: 'Q+1' }, groundTruth: { variance: 0.05 } },
      ]),
    ];

    const promptSuites = [
      createPromptEvalSuite({ id: 'agents.plan' }, [
        {
          label: 'decompose security incident',
          variables: { objective: 'contain ransomware spread' },
          groundTruth: { stepCount: 5 },
        },
      ]),
      createPromptEvalSuite({ id: 'agents.verify' }, [
        {
          label: 'verify clean tool output',
          variables: { stepOutput: 'ok' },
          groundTruth: { passed: true },
        },
      ]),
    ];

    sendSuccess(res, {
      toolSuites,
      promptSuites,
      totals: {
        tools: toolSuites.length,
        prompts: promptSuites.length,
        cases: [...toolSuites, ...promptSuites].reduce((n, s) => n + s.cases.length, 0),
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to build auto-suites');
  }
});

export default router;
