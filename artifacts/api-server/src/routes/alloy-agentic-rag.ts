/**
 * Alloy Agentic RAG API routes.
 *
 * Exposes the unified Agentic RAG platform under /alloy/agentic-rag/*.
 * All routes reuse existing auth, rate-limiting, and policy-guard middleware.
 *
 * Security notes:
 *  - All routes require authentication via authMiddleware.
 *  - Run/trace retrieval is tenant-scoped: the requesting user must own the run.
 *    Any mismatch returns 404 (not 403) to avoid IDOR information leakage.
 *  - Streaming route enforces the same ownership on the stored result.
 *
 * Routes:
 *   POST   /alloy/agentic-rag/run           — run a full agentic RAG loop
 *   GET    /alloy/agentic-rag/runs/:id       — retrieve run result (owner only)
 *   GET    /alloy/agentic-rag/runs/:id/trace — retrieve full trace (owner only)
 *   POST   /alloy/agentic-rag/run/stream     — SSE streaming run
 *   GET    /alloy/agentic-rag/specialists    — list available specialists
 *   GET    /alloy/agentic-rag/mcp-classes    — list MCP server class descriptors
 */
import { type IRouter, Router, type Request, type Response } from 'express';
import { agenticRagRequestSchema } from '@szl-holdings/contracts/agentic-rag';
import { authMiddleware } from '../middlewares/auth';
import { aiInferenceLimiter } from '../middlewares/rate-limiters';
import { guardianPolicyCheck } from '../middlewares/guardian-policy';
import {
  handleRouteError,
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
} from '../lib/api-response';
import { logger } from '../lib/logger';

const router: IRouter = Router();

// ─── Tenant-scoped run store ──────────────────────────────────────────────────
//
// Each entry records both the run result and the user who triggered it.
// Retrieval endpoints enforce ownership so callers cannot read other users' runs
// (IDOR prevention). The in-memory store is appropriate for the current scope;
// production replacement is tracked in the Agentic RAG persistence follow-up task.
//
interface RunEntry {
  data: unknown;
  userId: string | undefined;
}
interface TraceEntry {
  data: unknown;
  userId: string | undefined;
}

const runStore = new Map<string, RunEntry>();
const traceStore = new Map<string, TraceEntry>();

function callerUserId(req: Request): string | undefined {
  return req.user?.id ? String(req.user.id) : undefined;
}

function authorizeRunAccess(store: Map<string, RunEntry | TraceEntry>, id: string, userId: string | undefined): boolean {
  const entry = store.get(id);
  if (!entry) return false;
  // If the stored run has no owner (legacy / anonymous), allow any authenticated caller.
  if (!entry.userId) return true;
  return entry.userId === userId;
}

// Lazy-load the aggregator to avoid slowing down api-server cold start.
async function getAggregator() {
  const { runAgenticRag } = await import('@szl/alloy-agentic-rag');
  return runAgenticRag;
}

// ─── POST /alloy/agentic-rag/run ─────────────────────────────────────────────

router.post(
  '/run',
  authMiddleware(),
  aiInferenceLimiter,
  guardianPolicyCheck(),
  async (req: Request, res: Response) => {
    try {
      const parsed = agenticRagRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendBadRequest(res, 'Invalid request body', parsed.error.flatten());
      }

      const userId = callerUserId(req);
      const request = parsed.data;
      const runAgenticRag = await getAggregator();
      logger.info({ query: request.query.slice(0, 80), policy: request.policy }, '[alloy-agentic-rag] run started');

      const { response, trace } = await runAgenticRag(request, userId);

      // Store with ownership for tenant-scoped retrieval
      runStore.set(response.runId, { data: response, userId });
      traceStore.set(response.runId, { data: trace, userId });

      logger.info(
        { runId: response.runId, durationMs: response.totalDurationMs, status: response.status },
        '[alloy-agentic-rag] run completed',
      );

      return sendCreated(res, response);
    } catch (err) {
      return handleRouteError(res, err, '[alloy-agentic-rag] run failed');
    }
  },
);

// ─── GET /alloy/agentic-rag/runs/:id ─────────────────────────────────────────
// Tenant-scoped: returns 404 for runs owned by other users to prevent IDOR.

router.get('/runs/:id', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const runId = req.params['id']!;
    const userId = callerUserId(req);

    if (!authorizeRunAccess(runStore, runId, userId)) {
      return sendNotFound(res, `Run ${runId} not found`);
    }

    const entry = runStore.get(runId)!;
    return sendSuccess(res, entry.data);
  } catch (err) {
    return handleRouteError(res, err, '[alloy-agentic-rag] get run failed');
  }
});

// ─── GET /alloy/agentic-rag/runs/:id/trace ───────────────────────────────────
// Tenant-scoped: returns 404 for traces owned by other users to prevent IDOR.

router.get('/runs/:id/trace', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const runId = req.params['id']!;
    const userId = callerUserId(req);

    if (!authorizeRunAccess(traceStore, runId, userId)) {
      return sendNotFound(res, `Trace for run ${runId} not found`);
    }

    const entry = traceStore.get(runId)!;
    return sendSuccess(res, entry.data);
  } catch (err) {
    return handleRouteError(res, err, '[alloy-agentic-rag] get trace failed');
  }
});

// ─── POST /alloy/agentic-rag/run/stream ──────────────────────────────────────

router.post(
  '/run/stream',
  authMiddleware(),
  aiInferenceLimiter,
  guardianPolicyCheck(),
  async (req: Request, res: Response) => {
    try {
      const parsed = agenticRagRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendBadRequest(res, 'Invalid request body', parsed.error.flatten());
      }

      const userId = callerUserId(req);
      const request = parsed.data;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      function sendEvent(event: string, data: unknown): void {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }

      sendEvent('start', { message: 'Agentic RAG loop started', query: request.query.slice(0, 80) });

      const runAgenticRag = await getAggregator();
      const { response, trace } = await runAgenticRag(request, userId);

      // Store with ownership
      runStore.set(response.runId, { data: response, userId });
      traceStore.set(response.runId, { data: trace, userId });

      sendEvent('plan', { planId: response.plan.planId, plannerMode: response.plannerMode, steps: response.plan.steps.length });

      for (const mcpCall of trace.mcpCalls) {
        sendEvent('mcp_call', {
          specialist: mcpCall.specialistAgent,
          mcpClass: mcpCall.mcpClass,
          chunks: mcpCall.chunksReturned,
          success: mcpCall.success,
        });
      }

      sendEvent('evidence', { bundleId: response.evidence.bundleId, chunks: response.evidence.chunks.length });

      sendEvent('generation', {
        provider: response.generation.provider,
        model: response.generation.model,
        tokens: response.generation.totalTokens,
      });

      sendEvent('complete', response);
      res.end();
    } catch (err) {
      logger.error(err, '[alloy-agentic-rag] stream run failed');
      res.write(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`);
      res.end();
    }
  },
);

// ─── GET /alloy/agentic-rag/specialists ──────────────────────────────────────

router.get('/specialists', authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const { listSpecialists } = await import('@szl/alloy-agentic-rag');
    return sendSuccess(res, { specialists: listSpecialists() });
  } catch (err) {
    return handleRouteError(res, err, '[alloy-agentic-rag] list specialists failed');
  }
});

// ─── GET /alloy/agentic-rag/mcp-classes ──────────────────────────────────────

router.get('/mcp-classes', authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const { localDataMCP, searchEngineMCP, cloudEngineMCP } = await import('@szl/alloy-agentic-rag');
    return sendSuccess(res, {
      mcpClasses: [
        localDataMCP.descriptor,
        searchEngineMCP.descriptor,
        cloudEngineMCP.descriptor,
      ],
    });
  } catch (err) {
    return handleRouteError(res, err, '[alloy-agentic-rag] list mcp-classes failed');
  }
});

export default router;
