import { anthropic } from '@szl-holdings/ai-engine/providers/anthropic';
import { openai } from '@szl-holdings/ai-engine/providers/openai';
import { bodyShape } from '@szl-holdings/contracts/common';
import { db, intelligenceCacheTable, pool } from '@szl-holdings/db';
import { services } from '@szl-holdings/services';
import crypto from 'crypto';
import { eq, lt, sql } from 'drizzle-orm';
import express, { type IRouter, type RequestHandler, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';
import { z } from 'zod';
import {
  getAiModelById,
  getAiModels,
  getModelObservabilitySummary,
} from '../../lib/ai-model-observability';
import { handleRouteError, sendError, sendSuccess } from '../../lib/api-response';
import { logger } from '../../lib/logger';
import { getRegistrySummary } from '../../lib/model-registry';
import { redisGet, redisSet } from '../../lib/redis-client.js';
import { authMiddleware } from '../../middlewares/auth';

type AnthropicMessageParam = {
  role: 'user' | 'assistant';
  content: string | { type: string; text: string }[];
};

import { anyQuerySchema, listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import { aiRateLimit, fetchJson, getCached, intelRateLimit, type ThreatItem } from './shared';

const router = Router();

router.post(
  '/intelligence/ai/summarize',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      text: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        sendError(res, 'Text is required', 400);
        return;
      }
      const result = await services.huggingface.summarization(text);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to summarize text');
    }
  },
);

router.post(
  '/intelligence/ai/sentiment',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      text: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        sendError(res, 'Text is required', 400);
        return;
      }
      const result = await services.huggingface.sentimentAnalysis(text);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to analyze sentiment');
    }
  },
);

router.post(
  '/intelligence/ai/ner',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      text: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        sendError(res, 'Text is required', 400);
        return;
      }
      const result = await services.huggingface.namedEntityRecognition(text);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to extract entities');
    }
  },
);

router.post(
  '/intelligence/ai/classify',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      labels: z.unknown().optional(),
      text: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { text, labels } = req.body;
      if (!text || !labels) {
        sendError(res, 'Text and labels are required', 400);
        return;
      }
      const result = await services.huggingface.zeroShotClassification(text, labels);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to classify text');
    }
  },
);

router.post(
  '/intelligence/ai/translate',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      sourceLang: z.unknown().optional(),
      targetLang: z.unknown().optional(),
      text: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { text, sourceLang, targetLang } = req.body;
      if (!text) {
        sendError(res, 'Text is required', 400);
        return;
      }
      const result = await services.huggingface.translation(text, { sourceLang, targetLang });
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to translate text');
    }
  },
);

router.post(
  '/intelligence/ai/generate-image',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      prompt: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        sendError(res, 'Prompt is required', 400);
        return;
      }
      const result = await services.huggingface.imageGeneration(prompt);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate image');
    }
  },
);

router.post(
  '/intelligence/ai/chat',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      maxTokens: z.unknown().optional(),
      message: z.unknown().optional(),
      messages: z.unknown().optional(),
      sessionId: z.unknown().optional(),
      systemPrompt: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { sessionId, message, messages, systemPrompt, maxTokens } = req.body;
      const ownerId = req.user?.id;
      const sid = sessionId || crypto.randomUUID();

      if (messages && Array.isArray(messages)) {
        const lastUserMsg = [...messages]
          .reverse()
          .find((m: { role: string }) => m.role === 'user');
        if (!lastUserMsg) {
          sendError(res, 'No user message found in messages array', 400);
          return;
        }
        const systemMsg = messages.find((m: { role: string }) => m.role === 'system');
        const priorTurns = messages
          .filter((m: { role: string }) => m.role !== 'system')
          .slice(0, -1) as Array<{ role: string; content: string }>;
        services.huggingface.initSessionFromHistory(sid, priorTurns, {
          systemPrompt: systemMsg?.content,
          ownerId: ownerId !== undefined ? String(ownerId) : undefined,
        });
        const hfResult = await services.huggingface.chat(sid, lastUserMsg.content, {
          systemPrompt: systemMsg?.content,
          maxTokens,
          ownerId: ownerId !== undefined ? String(ownerId) : undefined,
        });
        sendSuccess(res, {
          content: hfResult.reply,
          model: hfResult.model,
          provider: 'huggingface',
          tier: hfResult.tier,
          sessionId: sid,
          usage: { promptTokens: 0, completionTokens: 0 },
        });
        return;
      }

      if (!message) {
        sendError(res, "Either 'message' (string) or 'messages' (array) is required", 400);
        return;
      }
      const result = await services.huggingface.chat(sid, message, {
        systemPrompt,
        maxTokens,
        ownerId: ownerId !== undefined ? String(ownerId) : undefined,
      });
      sendSuccess(res, {
        content: result.reply,
        model: result.model,
        provider: 'huggingface',
        tier: result.tier,
        sessionId: sid,
        usage: { promptTokens: 0, completionTokens: 0 },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate chat response');
    }
  },
);

router.get(
  '/intelligence/ai/chat/:sessionId/history',
  aiRateLimit,
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const requesterId: string = String(req.user?.id ?? '');
      const history = services.huggingface.getChatHistory(
        String(req.params.sessionId),
        requesterId,
      );
      sendSuccess(res, { sessionId: String(req.params.sessionId), messages: history });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get chat history');
    }
  },
);

router.delete(
  '/intelligence/ai/chat/:sessionId',
  validateBody(bodyShape({})),
  aiRateLimit,
  authMiddleware({ required: true }),
  async (req, res) => {
    try {
      const requesterId: string = String(req.user?.id ?? '');
      const cleared = services.huggingface.clearChatSession(
        String(req.params.sessionId),
        requesterId,
      );
      if (!cleared) {
        sendError(res, 'Session not found or access denied', 403);
        return;
      }
      sendSuccess(res, { sessionId: String(req.params.sessionId), cleared });
    } catch (err) {
      handleRouteError(res, err, 'Failed to clear chat session');
    }
  },
);

router.post(
  '/intelligence/ai/reason',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      maxTokens: z.unknown().optional(),
      prompt: z.unknown().optional(),
      steps: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { prompt, maxTokens, steps } = req.body;
      if (!prompt) {
        sendError(res, 'Prompt is required', 400);
        return;
      }
      const result = await services.huggingface.reasoning(prompt, {
        maxTokens,
        steps: steps ?? true,
      });
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate reasoning response');
    }
  },
);

router.post(
  '/intelligence/ai/transcribe',
  validateQuery(anyQuerySchema),
  express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '25mb' }),
  aiRateLimit,
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        sendError(
          res,
          'Audio data is required. Send raw audio bytes with Content-Type: audio/wav (or audio/mpeg, application/octet-stream). Max 25MB.',
          400,
        );
        return;
      }
      const language = (req.query as Record<string, string>).language;
      const result = await services.huggingface.transcription(req.body, { language });
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to transcribe audio');
    }
  },
);

router.post(
  '/intelligence/ai/embed',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      text: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        sendError(res, 'Text is required', 400);
        return;
      }
      const result = await services.huggingface.embedding(text);
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate embedding');
    }
  },
);

router.post(
  '/intelligence/ai/semantic-search',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      documents: z.unknown().optional(),
      query: z.unknown().optional(),
      topK: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { query, documents, topK } = req.body;
      if (!query || !documents || !Array.isArray(documents)) {
        sendError(res, 'Query and documents array are required', 400);
        return;
      }
      const results = await services.huggingface.semanticSearch(query, documents, { topK });
      sendSuccess(res, { query, results, totalDocuments: documents.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to perform semantic search');
    }
  },
);

router.post(
  '/intelligence/ai/analyze-document',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      classificationLabels: z.unknown().optional(),
      text: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { text, classificationLabels } = req.body;
      if (!text) {
        sendError(res, 'Text is required', 400);
        return;
      }
      const result = await services.huggingface.analyzeDocument(text, { classificationLabels });
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to analyze document');
    }
  },
);

router.get(
  '/intelligence/ai/stream',
  aiRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const prompt = (req.query.prompt as string) || '';
    if (!prompt) {
      sendError(res, 'Prompt query parameter is required', 400);
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    try {
      const maxTokens = parseInt(req.query.maxTokens as string) || 512;
      for await (const token of services.huggingface.streamTextGeneration(prompt, { maxTokens })) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    }
    res.end();
  },
);

router.get(
  '/intelligence/ai/health',
  intelRateLimit,
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const healthStatus = services.huggingface.getHealthStatus();
      const probe = (req.query as Record<string, string>).probe === 'true';
      if (probe) {
        const probeResults = await services.huggingface.probeModelAvailability();
        sendSuccess(res, { ...healthStatus, modelProbes: probeResults });
      } else {
        sendSuccess(res, healthStatus);
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to get AI health status');
    }
  },
);

router.post(
  '/intelligence/ai/chat/stream',
  aiRateLimit,
  authMiddleware(),
  validateBody(
    bodyShape({
      maxTokens: z.unknown().optional(),
      messages: z.unknown().optional(),
      model: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { messages, model, maxTokens } = req.body;
      if (!messages || !Array.isArray(messages)) {
        sendError(res, 'Messages array is required', 400);
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      let closed = false;
      req.on('close', () => {
        closed = true;
      });

      try {
        for await (const chunk of services.ai.streamChatCompletion(messages, {
          model,
          maxTokens,
        })) {
          if (closed) break;
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      } catch {
        if (!closed) {
          res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
        }
      }

      if (!closed) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to stream chat completion');
    }
  },
);

export function register(r: IRouter): void {
  r.use(router);
}
