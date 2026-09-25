import { randomUUID } from 'node:crypto';
import { Router, type IRouter, type RequestHandler, type Request, type Response } from 'express';
import { OpenAIEmbedRequestSchema } from '@workspace/aef-contracts';
import { embedTextsWithReceipt } from '@workspace/alloy-embed-worker';
import { logger } from '../middleware/logger.js';
import { errorBudgetCounter } from '../middleware/prometheus.js';
import { EmbedderConfigurationError, getEmbedderSelection } from '../retrieval-store.js';

export const openaiCompatRouter: IRouter = Router();

openaiCompatRouter.post('/v1/openai/embeddings', (async (req: Request, res: Response) => {
  const parseResult = OpenAIEmbedRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: { message: 'Invalid request', type: 'invalid_request_error', code: 'invalid_request' },
    });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;
  const texts = Array.isArray(body.input) ? body.input : [body.input];

  let embedder;
  try {
    embedder = getEmbedderSelection();
  } catch (error) {
    if (error instanceof EmbedderConfigurationError) {
      res.status(503).json({
        error: {
          message: 'Embedding backend is not configured',
          type: 'upstream_error',
          code: error.code,
        },
      });
      return;
    }
    throw error;
  }

  const requestedModel = body.model === 'aef-default' ? embedder.model : body.model;
  if (requestedModel !== embedder.model) {
    res.status(409).json({
      error: {
        message: 'Requested model is not admitted',
        type: 'invalid_request_error',
        code: 'model_not_admitted',
      },
    });
    return;
  }

  const expectedDimensions = Number(process.env.VECTOR_DIM ?? (embedder.isReal ? 1024 : 384));
  if (body.dimensions !== undefined && body.dimensions !== expectedDimensions) {
    res.status(400).json({
      error: {
        message: `Requested dimensions must equal the admitted width ${expectedDimensions}`,
        type: 'invalid_request_error',
        code: 'dimensions_not_admitted',
      },
    });
    return;
  }
  if (body.encoding_format !== 'float') {
    res.status(400).json({
      error: {
        message: 'Only float embeddings are supported',
        type: 'invalid_request_error',
        code: 'encoding_format_not_supported',
      },
    });
    return;
  }

  let result;
  try {
    result = await embedTextsWithReceipt(texts, {
      backendId: embedder.backendId,
      model: embedder.model,
      pooling: 'mean',
      normalize: true,
    });
  } catch (error) {
    errorBudgetCounter.inc({ kind: 'embed_error', tenant_id: req.tenantId ?? 'unknown' });
    logger.error({ traceId, error: String(error) }, 'OpenAI-compatible embed failed');
    res.status(502).json({
      error: {
        message: 'Embedding backend unavailable',
        type: 'upstream_error',
        code: 'backend_unavailable',
      },
    });
    return;
  }

  const totalTokens = result.tokenCounts?.reduce((sum, count) => sum + count, 0) ??
    texts.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0);

  res.status(200).json({
    object: 'list',
    data: result.vectors.map((embedding, index) => ({ object: 'embedding', embedding, index })),
    model: result.model,
    usage: { prompt_tokens: totalTokens, total_tokens: totalTokens },
    'x-aef-trace-id': traceId,
    'x-aef-request-id': randomUUID(),
    'x-aef-execution': result.execution,
  });

  logger.info(
    {
      traceId,
      inputCount: texts.length,
      backendId: result.execution?.backendId ?? embedder.backendId,
      modelRevision: result.execution?.modelRevision ?? embedder.modelRevision,
    },
    'openai-compatible embed completed',
  );
}) as unknown as RequestHandler);
