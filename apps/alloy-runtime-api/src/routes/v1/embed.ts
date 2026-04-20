/**
 * AEEP v1 Embedding + Reranking Routes
 *
 * GET  /v1/embed         — generate embeddings for one or more texts
 * POST /v1/rerank        — cross-encoder reranking of candidate passages
 * POST /v1/openai/embeddings — OpenAI-compatible embedding endpoint (compat shim)
 *
 * In production, these delegate to the retrieval-core EmbeddingBackend registry.
 * Stubs return the correct response envelope so callers can be coded against
 * the contract immediately.
 */
import { Router, type IRouter } from "express";
import type { Request, Response } from "express";
import { z } from "zod";

const router: IRouter = Router();

const EmbedSchema = z.object({
  texts: z.array(z.string().min(1)).min(1).max(512),
  model: z.string().optional(),
  backend: z.string().optional(),
});

const RerankSchema = z.object({
  query: z.string().min(1),
  passages: z.array(z.string().min(1)).min(1).max(256),
  topN: z.number().int().positive().max(100).optional(),
  model: z.string().optional(),
});

const OpenAIEmbedSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.string().default("text-embedding-ada-002"),
  encoding_format: z.enum(["float", "base64"]).optional(),
});

router.post("/embed", (req: Request, res: Response): void => {
  const parse = EmbedSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed", issues: parse.error.issues });
    return;
  }

  const { texts, model, backend } = parse.data;
  const tenantId = req.tenantCtx?.tenantId ?? "default";

  res.status(200).json({
    tenantId,
    model: model ?? "dev-hash",
    backend: backend ?? "cpu-local",
    embeddings: texts.map((t) => ({ text: t, vector: [], dimensions: 0 })),
    note: "Embedding backend not yet wired — returns zero-dimension stubs. Connect retrieval-core EmbeddingBackend.",
  });
});

router.post("/rerank", (req: Request, res: Response): void => {
  const parse = RerankSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed", issues: parse.error.issues });
    return;
  }

  const { query, passages, topN, model } = parse.data;
  const tenantId = req.tenantCtx?.tenantId ?? "default";
  const limit = topN ?? passages.length;

  res.status(200).json({
    query,
    tenantId,
    model: model ?? "cross-encoder/ms-marco-MiniLM-L-6-v2",
    reranked: passages.slice(0, limit).map((text, i) => ({ rank: i + 1, text, score: 0 })),
    note: "Reranking backend not yet wired — returns original order with zero scores. Connect retrieval-core RerankPipeline.",
  });
});

router.post("/openai/embeddings", (req: Request, res: Response): void => {
  const parse = OpenAIEmbedSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed", issues: parse.error.issues });
    return;
  }

  const { input, model } = parse.data;
  const texts = Array.isArray(input) ? input : [input];

  res.status(200).json({
    object: "list",
    model,
    data: texts.map((_, i) => ({ object: "embedding", index: i, embedding: [] })),
    usage: { prompt_tokens: 0, total_tokens: 0 },
  });
});

export default router;
