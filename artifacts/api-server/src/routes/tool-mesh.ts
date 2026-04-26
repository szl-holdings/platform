import { createDefaultSandboxPolicy } from '@szl-holdings/forge-runtime/sandbox';
import {
  CodeSandbox,
  defaultExecutor,
  defaultGateway,
  defaultToolRegistry,
} from '@workspace/tool-mesh';
import { type IRouter, Router } from 'express';
import { handleRouteError, sendError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

/**
 * Wire CodeSandbox to the registry's internal CatalogSearch so that
 * tools.search() inside sandboxed code sees the same indexed manifests
 * as the rest of the system.
 */
const codeSandbox = new CodeSandbox(
  defaultGateway,
  defaultToolRegistry.getCatalogSearch(),
  30_000,
  defaultExecutor,
);

/**
 * POST /tool-mesh/code/execute
 * Execute agent-generated JavaScript/TypeScript code in a sandboxed V8 context.
 * The sandbox has access to registered tool-mesh tools and BM25 catalog search.
 * Body: { code: string, policyOverrides?: Partial<ForgeSandboxPolicy>, domain?: string, timeoutMs?: number }
 */
router.post(
  '/tool-mesh/code/execute',
  authMiddleware(),
  tenantScope({ required: true }),
  async (req, res) => {
    try {
      const { code, policyOverrides, domain, timeoutMs } = req.body as {
        code?: unknown;
        policyOverrides?: Record<string, unknown>;
        domain?: string;
        timeoutMs?: number;
      };

      if (typeof code !== 'string' || code.trim().length === 0) {
        return sendError(res, 'Request body must include a non-empty `code` string.', 400, 'BAD_REQUEST');
      }

      const policy = createDefaultSandboxPolicy(
        (domain ?? 'custom') as Parameters<typeof createDefaultSandboxPolicy>[0],
        policyOverrides as Parameters<typeof createDefaultSandboxPolicy>[1],
      );

      const agentId = (req as { oidcUser?: { id: number } }).oidcUser
        ? `user:${(req as { oidcUser: { id: number } }).oidcUser.id}`
        : 'anonymous';

      const record = await codeSandbox.execute(code, policy, { agentId }, { timeoutMs });

      logger.info(
        {
          executionId: record.id,
          success: record.success,
          durationMs: record.durationMs,
          toolCalls: record.toolCalls.length,
          violations: record.violations.length,
        },
        'tool-mesh: code execution completed',
      );

      return sendSuccess(res, record);
    } catch (err) {
      return handleRouteError(res, err, 'Code execution failed');
    }
  },
);

/**
 * GET /tool-mesh/catalog/search
 * Return BM25-ranked tool manifests matching the query string.
 * Uses the registry's built-in catalog search (auto-synced on register/unregister).
 * Query params: q (required), limit (optional, default 10, max 50)
 */
router.get(
  '/tool-mesh/catalog/search',
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 10;
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 10;

      if (!query) {
        return sendError(res, 'Query parameter `q` is required.', 400, 'BAD_REQUEST');
      }

      const manifests = defaultToolRegistry.search(query, limit);
      const results = manifests.map((m) => ({ manifest: m }));

      return sendSuccess(res, { query, limit, total: results.length, results });
    } catch (err) {
      return handleRouteError(res, err, 'Catalog search failed');
    }
  },
);

/**
 * POST /tool-mesh/catalog/search
 * Return BM25-ranked tool manifests matching the query string (JSON body variant).
 * Body: { query: string, limit?: number }
 */
router.post(
  '/tool-mesh/catalog/search',
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const { query: queryRaw, limit: limitRaw } = req.body as {
        query?: unknown;
        limit?: unknown;
      };

      const query = typeof queryRaw === 'string' ? queryRaw.trim() : '';
      if (!query) {
        return sendError(res, 'Request body must include a non-empty `query` string.', 400, 'BAD_REQUEST');
      }

      const parsedLimit = typeof limitRaw === 'number' ? limitRaw : typeof limitRaw === 'string' ? parseInt(limitRaw, 10) : 10;
      const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 10;

      const manifests = defaultToolRegistry.search(query, limit);
      const results = manifests.map((m) => ({ manifest: m }));

      return sendSuccess(res, { query, limit, total: results.length, results });
    } catch (err) {
      return handleRouteError(res, err, 'Catalog search failed');
    }
  },
);

/**
 * GET /tool-mesh/catalog/list
 * List all registered tools with optional tag/tier/enabled filtering.
 * Query params: domain, tier, enabled (optional)
 */
router.get(
  '/tool-mesh/catalog/list',
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const { domain, tier, enabled } = req.query as Record<string, string | undefined>;
      const filter: { domainTag?: string; policyTier?: string; enabled?: boolean } = {};
      if (domain) filter.domainTag = domain;
      if (tier) filter.policyTier = tier;
      if (enabled !== undefined) filter.enabled = enabled === 'true';

      const manifests = defaultToolRegistry.list(filter);
      return sendSuccess(res, { total: manifests.length, manifests });
    } catch (err) {
      return handleRouteError(res, err, 'Catalog list failed');
    }
  },
);

export default router;
