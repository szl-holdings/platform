/**
 * Unified Hugging Face Hub API — /hf/hub/*
 *
 * Thin route layer that proxies all HF traffic through the shared ai-engine
 * provider/connector layer for centralized auth, retries, and telemetry:
 *   GET  /hf/hub/models              — search HF model hub
 *   GET  /hf/hub/models/:owner/:name — model card + metadata
 *   GET  /hf/hub/datasets            — search HF datasets hub
 *   GET  /hf/hub/datasets/:owner/:name — dataset info + row preview
 *   GET  /hf/hub/spaces              — search HF spaces
 *   GET  /hf/hub/spaces/:owner/:name — space metadata
 *   GET  /hf/hub/pinned              — list pinned items (tenant-scoped, DB-backed)
 *   POST /hf/hub/pinned              — pin an item (tenant-scoped, DB-backed)
 *   DELETE /hf/hub/pinned/:id        — unpin an item (tenant-scoped, DB-backed)
 *   POST /hf/hub/inference           — multimodal inference proxy (text / image / audio)
 *   GET  /hf/hub/status              — token health, quota, last sync
 *
 * HF_TOKEN is read from env and never exposed to frontends.
 * All Hub reads and inference route through @szl-holdings/ai-engine so
 * observability, fallback chains, and model routing are centralised.
 */

import { type IRouter, type Request, type RequestHandler, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { and, eq } from 'drizzle-orm';
import { db, hfPinnedItemsTable } from '@szl-holdings/db';
import {
  audioInference as hfAudioInference,
  chatCompletion as hfChatCompletion,
  chatCompletionWithFallback,
  checkTokenHealth,
  getDatasetDetail,
  getModelCard,
  getSpaceDetail,
  hfHasToken,
  type HFChatMessage,
  type RouteResult,
  searchDatasets,
  searchModels,
  searchSpaces,
} from '@szl-holdings/ai-engine';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';

const router: IRouter = Router();

const searchLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
  message: { error: 'Too many search requests. Try again in a minute.', code: 'RATE_LIMITED' },
}) as unknown as RequestHandler;

const inferenceLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
  message: { error: 'Inference rate limit exceeded. Try again shortly.', code: 'RATE_LIMITED' },
}) as unknown as RequestHandler;

function noTokenResponse(res: Response): void {
  res.status(503).json({
    error: 'HF_TOKEN not configured',
    code: 'HF_TOKEN_MISSING',
    message: 'Set HF_TOKEN or HUGGINGFACE_API_KEY to enable Hugging Face Hub features.',
  });
}

function getUserId(req: Request): string | undefined {
  const u = (req as unknown as { user?: { id?: string; userId?: string | number } }).user;
  if (!u) return undefined;
  return u.id ?? (u.userId != null ? String(u.userId) : undefined);
}

function getOrgId(req: Request): string | undefined {
  const u = (req as unknown as { user?: { orgId?: string } }).user;
  return u?.orgId ?? undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model search — delegated to ai-engine hub client
// ─────────────────────────────────────────────────────────────────────────────

router.get('/hf/hub/models', searchLimit, async (req: Request, res: Response) => {
  if (!hfHasToken()) return noTokenResponse(res);

  const {
    search = '',
    task,
    license,
    limit = '20',
    page = '0',
    sort = 'downloads',
  } = req.query as Record<string, string>;

  try {
    const limitNum = Number(limit);
    const pageNum = Number(page);

    const models = await searchModels({
      search,
      task,
      license,
      limit: limitNum,
      page: pageNum,
      sort,
    });

    return sendSuccess(res, {
      models,
      page: pageNum,
      limit: limitNum,
      hasMore: models.length === limitNum,
    });
  } catch (err) {
    handleRouteError(res, err, 'HF model search failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Model card / metadata — delegated to ai-engine hub client
// ─────────────────────────────────────────────────────────────────────────────

router.get('/hf/hub/models/:owner/:name', searchLimit, async (req: Request, res: Response) => {
  if (!hfHasToken()) return noTokenResponse(res);

  const { owner, name } = req.params;
  const modelId = `${owner}/${name}`;

  try {
    const card = await getModelCard(modelId);
    return sendSuccess(res, { modelId, ...card });
  } catch (err) {
    handleRouteError(res, err, 'HF model card fetch failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Dataset search — delegated to ai-engine hub client
// ─────────────────────────────────────────────────────────────────────────────

router.get('/hf/hub/datasets', searchLimit, async (req: Request, res: Response) => {
  if (!hfHasToken()) return noTokenResponse(res);

  const { search = '', limit = '20', page = '0', sort = 'downloads' } = req.query as Record<
    string,
    string
  >;

  try {
    const limitNum = Number(limit);
    const pageNum = Number(page);

    const datasets = await searchDatasets({ search, limit: limitNum, page: pageNum, sort });

    return sendSuccess(res, {
      datasets,
      page: pageNum,
      limit: limitNum,
      hasMore: datasets.length === limitNum,
    });
  } catch (err) {
    handleRouteError(res, err, 'HF dataset search failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Dataset info + row preview — delegated to ai-engine hub client
// ─────────────────────────────────────────────────────────────────────────────

router.get('/hf/hub/datasets/:owner/:name', searchLimit, async (req: Request, res: Response) => {
  if (!hfHasToken()) return noTokenResponse(res);

  const { owner, name } = req.params;
  const dataset = `${owner}/${name}`;

  try {
    const detail = await getDatasetDetail(dataset);
    return sendSuccess(res, { dataset, ...detail });
  } catch (err) {
    handleRouteError(res, err, 'HF dataset detail fetch failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Space search — delegated to ai-engine hub client
// ─────────────────────────────────────────────────────────────────────────────

router.get('/hf/hub/spaces', searchLimit, async (req: Request, res: Response) => {
  if (!hfHasToken()) return noTokenResponse(res);

  const { search = '', limit = '20', page = '0', sort = 'likes' } = req.query as Record<
    string,
    string
  >;

  try {
    const limitNum = Number(limit);
    const pageNum = Number(page);

    const spaces = await searchSpaces({ search, limit: limitNum, page: pageNum, sort });

    return sendSuccess(res, {
      spaces,
      page: pageNum,
      limit: limitNum,
      hasMore: spaces.length === limitNum,
    });
  } catch (err) {
    handleRouteError(res, err, 'HF space search failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Space metadata — delegated to ai-engine hub client
// ─────────────────────────────────────────────────────────────────────────────

router.get('/hf/hub/spaces/:owner/:name', searchLimit, async (req: Request, res: Response) => {
  if (!hfHasToken()) return noTokenResponse(res);

  const { owner, name } = req.params;
  const spaceId = `${owner}/${name}`;

  try {
    const detail = await getSpaceDetail(spaceId);
    return sendSuccess(res, { spaceId, ...detail });
  } catch (err) {
    handleRouteError(res, err, 'HF space detail fetch failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Pinned item registry — DB-backed, tenant-scoped CRUD
// ─────────────────────────────────────────────────────────────────────────────

type PinnedKind = 'model' | 'dataset' | 'space';

router.get('/hf/hub/pinned', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to view pinned items' });
  }

  const { kind } = req.query as { kind?: PinnedKind };

  try {
    const conditions = [eq(hfPinnedItemsTable.userId, userId)];
    if (kind) conditions.push(eq(hfPinnedItemsTable.kind, kind));

    const items = await db
      .select()
      .from(hfPinnedItemsTable)
      .where(and(...conditions));

    sendSuccess(res, { items, total: items.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch pinned items');
  }
});

router.post('/hf/hub/pinned', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to pin items' });
  }

  const { kind, hfId, name, description, task, downloads, likes } = req.body as {
    kind?: PinnedKind;
    hfId?: string;
    name?: string;
    description?: string;
    task?: string;
    downloads?: number;
    likes?: number;
  };

  if (!kind || !hfId || !name) {
    return sendBadRequest(res, "'kind', 'hfId', and 'name' are required");
  }
  if (!['model', 'dataset', 'space'].includes(kind)) {
    return sendBadRequest(res, "'kind' must be 'model', 'dataset', or 'space'");
  }

  try {
    const existing = await db
      .select()
      .from(hfPinnedItemsTable)
      .where(
        and(
          eq(hfPinnedItemsTable.userId, userId),
          eq(hfPinnedItemsTable.kind, kind),
          eq(hfPinnedItemsTable.hfId, hfId),
        ),
      );

    if (existing.length > 0) {
      return sendSuccess(res, { item: existing[0], alreadyPinned: true });
    }

    const orgId = getOrgId(req);
    const id = `pin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const [item] = await db
      .insert(hfPinnedItemsTable)
      .values({
        id,
        userId,
        orgId: orgId ?? null,
        kind,
        hfId,
        name,
        description: description ?? null,
        task: task ?? null,
        downloads: downloads ?? null,
        likes: likes ?? null,
      })
      .returning();

    logger.info({ kind, hfId, userId }, '[hf-hub] item pinned');
    return sendSuccess(res, { item }, 201);
  } catch (err) {
    handleRouteError(res, err, 'Failed to pin item');
  }
});

router.delete('/hf/hub/pinned/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to unpin items' });
  }

  const { id } = req.params;

  try {
    const existing = await db
      .select()
      .from(hfPinnedItemsTable)
      .where(
        and(
          eq(hfPinnedItemsTable.id, id),
          eq(hfPinnedItemsTable.userId, userId),
        ),
      );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Pinned item not found', id });
    }

    await db
      .delete(hfPinnedItemsTable)
      .where(
        and(
          eq(hfPinnedItemsTable.id, id),
          eq(hfPinnedItemsTable.userId, userId),
        ),
      );

    sendSuccess(res, { deleted: true, id });
  } catch (err) {
    handleRouteError(res, err, 'Failed to unpin item');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Multimodal inference proxy — routes through ai-engine HF client
// ─────────────────────────────────────────────────────────────────────────────

type InferenceModality = 'text' | 'image' | 'audio';

interface InferenceRequestBody {
  modelId?: string;
  input?: string;
  modality?: InferenceModality;
  maxTokens?: number;
  compareModelId?: string;
}

function buildRoute(modelId: string, maxTokens = 512): RouteResult {
  return {
    model: modelId,
    role: 'inference',
    provider: 'huggingface',
    maxTokens,
    temperature: 0.7,
    structuredOutput: false,
  };
}

async function runTextInference(
  modelId: string,
  input: string,
  maxTokens = 512,
): Promise<{ output: string; latencyMs: number }> {
  const route = buildRoute(modelId, maxTokens);
  const messages: HFChatMessage[] = [{ role: 'user', content: input }];

  const result = await chatCompletionWithFallback(messages, route);
  return { output: result.content, latencyMs: result.latencyMs };
}

async function runImageInference(
  modelId: string,
  imageBase64: string,
): Promise<{ output: string; latencyMs: number }> {
  const route = buildRoute(modelId);
  const dataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

  const messages: HFChatMessage[] = [
    {
      role: 'user',
      content: JSON.stringify([
        { type: 'image_url', image_url: { url: dataUrl } },
        { type: 'text', text: 'Describe this image in detail.' },
      ]),
    },
  ];

  const result = await hfChatCompletion(messages, route);
  return { output: result.content, latencyMs: result.latencyMs };
}

async function runAudioInference(
  modelId: string,
  audioBase64: string,
): Promise<{ output: string; latencyMs: number }> {
  const audioBuffer = Buffer.from(audioBase64.replace(/^data:[^;]+;base64,/, ''), 'base64');

  const result = await hfAudioInference(audioBuffer, modelId, { contentType: 'audio/wav' });
  return { output: result.text, latencyMs: result.latencyMs };
}

router.post('/hf/hub/inference', inferenceLimit, async (req: Request, res: Response) => {
  if (!hfHasToken()) return noTokenResponse(res);

  const { modelId, input, modality = 'text', maxTokens = 512, compareModelId } =
    req.body as InferenceRequestBody;

  if (!modelId) return sendBadRequest(res, "'modelId' is required");
  if (!input) return sendBadRequest(res, "'input' is required");

  try {
    const runInference = async (mid: string) => {
      switch (modality) {
        case 'image':
          return runImageInference(mid, input);
        case 'audio':
          return runAudioInference(mid, input);
        default:
          return runTextInference(mid, input, maxTokens);
      }
    };

    const [primary, compare] = await Promise.allSettled([
      runInference(modelId),
      compareModelId ? runInference(compareModelId) : Promise.resolve(null),
    ]);

    logger.info(
      {
        modelId,
        compareModelId,
        modality,
        latencyMs: primary.status === 'fulfilled' ? primary.value?.latencyMs : null,
      },
      '[hf-hub] inference completed',
    );

    return sendSuccess(res, {
      modelId,
      modality,
      primary:
        primary.status === 'fulfilled'
          ? primary.value
          : { output: null, latencyMs: null, error: primary.reason?.message },
      compare:
        compareModelId
          ? compare.status === 'fulfilled'
            ? { modelId: compareModelId, ...(compare.value ?? {}) }
            : { modelId: compareModelId, output: null, latencyMs: null, error: (compare as PromiseRejectedResult).reason?.message }
          : null,
    });
  } catch (err) {
    handleRouteError(res, err, 'HF inference failed');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Token health & quota status — delegated to ai-engine hub client
// ─────────────────────────────────────────────────────────────────────────────

router.get('/hf/hub/status', async (req: Request, res: Response) => {
  const lastChecked = new Date().toISOString();

  if (!hfHasToken()) {
    return sendSuccess(res, {
      tokenPresent: false,
      tokenValid: false,
      status: 'unconfigured' as const,
      username: undefined,
      inferenceReachable: false,
      pinnedModels: 0,
      pinnedDatasets: 0,
      pinnedSpaces: 0,
      lastChecked,
      message: 'Set HF_TOKEN or HUGGINGFACE_API_KEY to enable Hugging Face features.',
    });
  }

  const userId = getUserId(req);

  const [health, pinnedCounts] = await Promise.allSettled([
    checkTokenHealth(),
    userId
      ? db
          .select()
          .from(hfPinnedItemsTable)
          .where(eq(hfPinnedItemsTable.userId, userId))
          .then((rows) => ({
            models: rows.filter((r) => r.kind === 'model').length,
            datasets: rows.filter((r) => r.kind === 'dataset').length,
            spaces: rows.filter((r) => r.kind === 'space').length,
          }))
      : Promise.resolve({ models: 0, datasets: 0, spaces: 0 }),
  ]);

  const h = health.status === 'fulfilled' ? health.value : null;
  const tokenValid = h?.tokenValid ?? false;
  const inferenceReachable = h?.inferenceReachable ?? false;

  const pinned =
    pinnedCounts.status === 'fulfilled'
      ? pinnedCounts.value
      : { models: 0, datasets: 0, spaces: 0 };

  let status: 'healthy' | 'degraded' | 'auth_error' | 'unconfigured';
  if (!tokenValid) {
    status = 'auth_error';
  } else if (!inferenceReachable) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return sendSuccess(res, {
    tokenPresent: true,
    tokenValid,
    status,
    username: h?.username,
    inferenceReachable,
    pinnedModels: pinned.models,
    pinnedDatasets: pinned.datasets,
    pinnedSpaces: pinned.spaces,
    lastChecked,
    user: h ? { name: h.username, type: h.userType } : null,
    inference: { reachable: inferenceReachable },
    subsystems: {
      hubApi: tokenValid,
      inference: inferenceReachable,
      mcpProxy: true,
      connector: true,
      embeddings: true,
      autoTrain: false,
    },
  });
});

export default router;
