import { bodyShape } from '@szl-holdings/contracts/common';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

router.post(
  '/worldline/sources',
  authMiddleware(),
  requireRole('super_admin', 'admin', 'ops'),
  validateBody(
    bodyShape({
      confidenceBaseline: z.unknown().optional(),
      connectionConfig: z.unknown().optional(),
      description: z.unknown().optional(),
      domain: z.unknown().optional(),
      freshnessCadence: z.unknown().optional(),
      metadata: z.unknown().optional(),
      name: z.unknown().optional(),
      normalizationConfig: z.unknown().optional(),
      slug: z.unknown().optional(),
      sourceType: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const {
        slug,
        name,
        description,
        sourceType,
        domain,
        freshnessCadence,
        confidenceBaseline,
        connectionConfig,
        normalizationConfig,
        metadata,
      } = req.body as {
        slug?: string;
        name?: string;
        description?: string;
        sourceType?: string;
        domain?: string;
        freshnessCadence?: string;
        confidenceBaseline?: number;
        connectionConfig?: Record<string, unknown>;
        normalizationConfig?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      };

      if (!slug || !name || !sourceType || !domain) {
        sendBadRequest(res, 'slug, name, sourceType, and domain are required');
        return;
      }

      const { registerSource } = await import('@szl-holdings/worldline');
      const user = req.user;
      const orgId = user?.orgs?.[0]?.orgId ?? null;

      const source = await registerSource({
        orgId,
        slug,
        name,
        description,
        sourceType: sourceType as import('@szl-holdings/worldline').WorldlineSourceType,
        domain,
        freshnessCadence: freshnessCadence as
          | import('@szl-holdings/worldline').WorldlineFreshnessCadence
          | undefined,
        confidenceBaseline,
        connectionConfig,
        normalizationConfig,
        createdBy: user?.id ?? null,
        metadata,
      });

      sendCreated(res, source);
    } catch (err) {
      handleRouteError(res, err, 'Failed to register worldline source');
    }
  },
);

router.get(
  '/worldline/sources',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user;
      const isAdmin = user?.roles?.some((r) => ['super_admin', 'admin'].includes(r)) ?? false;
      const orgId = isAdmin ? undefined : (user?.orgs?.[0]?.orgId ?? undefined);
      const domain = req.query['domain'] as string | undefined;
      const status = req.query['status'] as string | undefined;
      const limit = Math.min(parseInt((req.query['limit'] as string) ?? '100', 10), 500);

      const { listSources } = await import('@szl-holdings/worldline');
      const results = await listSources({
        orgId,
        domain,
        status: status as import('@szl-holdings/worldline').WorldlineSourceStatus | undefined,
        limit,
      });

      sendSuccess(res, results);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list worldline sources');
    }
  },
);

router.get('/worldline/sources/:slug', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { slug } = req.params as { slug: string };
    const user = req.user;
    const orgId = user?.orgs?.[0]?.orgId ?? null;

    const { getSourceBySlug } = await import('@szl-holdings/worldline');
    const source = await getSourceBySlug(slug, orgId);
    if (!source) {
      sendNotFound(res, 'Worldline source');
      return;
    }

    sendSuccess(res, source);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get worldline source');
  }
});

router.get(
  '/worldline/sources/:slug/history',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.params as { slug: string };
      const user = req.user;
      const orgId = user?.orgs?.[0]?.orgId ?? null;
      const limit = Math.min(parseInt((req.query['limit'] as string) ?? '50', 10), 200);

      const { getSourceBySlug, getFetchHistory } = await import('@szl-holdings/worldline');
      const source = await getSourceBySlug(slug, orgId);
      if (!source) {
        sendNotFound(res, 'Worldline source');
        return;
      }

      const history = await getFetchHistory(source.id, limit);
      sendSuccess(res, history);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get fetch history');
    }
  },
);

router.post(
  '/worldline/sources/:slug/fetch',
  authMiddleware(),
  requireRole('super_admin', 'admin', 'ops'),
  validateBody(
    bodyShape({
      confidenceScore: z.unknown().optional(),
      errorMessage: z.unknown().optional(),
      latencyMs: z.unknown().optional(),
      recordsNormalized: z.unknown().optional(),
      recordsReceived: z.unknown().optional(),
      recordsRejected: z.unknown().optional(),
      status: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.params as { slug: string };
      const user = req.user;
      const orgId = user?.orgs?.[0]?.orgId ?? null;

      const { getSourceBySlug, recordFetch } = await import('@szl-holdings/worldline');
      const source = await getSourceBySlug(slug, orgId);
      if (!source) {
        sendNotFound(res, 'Worldline source');
        return;
      }

      const {
        status,
        recordsReceived,
        recordsNormalized,
        recordsRejected,
        latencyMs,
        errorMessage,
        confidenceScore,
      } = req.body as {
        status?: string;
        recordsReceived?: number;
        recordsNormalized?: number;
        recordsRejected?: number;
        latencyMs?: number;
        errorMessage?: string;
        confidenceScore?: number;
      };

      if (!status || !['success', 'partial', 'failed', 'skipped'].includes(status)) {
        sendBadRequest(res, 'status must be one of: success, partial, failed, skipped');
        return;
      }

      const log = await recordFetch(
        source.id,
        orgId,
        {
          status: status as 'success' | 'partial' | 'failed' | 'skipped',
          recordsReceived: recordsReceived ?? 0,
          recordsNormalized: recordsNormalized ?? 0,
          recordsRejected: recordsRejected ?? 0,
          latencyMs,
          errorMessage,
          confidenceScore,
        },
        (req as unknown as { correlationId?: string }).correlationId,
      );

      sendCreated(res, log);
    } catch (err) {
      handleRouteError(res, err, 'Failed to record fetch');
    }
  },
);

export default router;
