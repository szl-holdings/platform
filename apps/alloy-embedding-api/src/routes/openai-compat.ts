import { Router, type IRouter, type RequestHandler } from "express";
import type { Request, Response } from "express";
import { OpenAIEmbedRequestSchema } from "@workspace/aef-contracts";
import { embedTexts } from "@workspace/alloy-embed-worker";
import { logger } from "../middleware/logger.js";
import { randomUUID } from "crypto";
import { errorBudgetCounter } from "../middleware/prometheus.js";

export const openaiCompatRouter: IRouter = Router();

openaiCompatRouter.post("/v1/openai/embeddings", (async (req: Request, res: Response) => {
  const parseResult = OpenAIEmbedRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: { message: "Invalid request", type: "invalid_request_error", code: "invalid_request" },
    });
    return;
  }

  const body = parseResult.data;
  const traceId = req.traceId;
  const texts = Array.isArray(body.input) ? body.input : [body.input];

  const devHashMode = !process.env["SUBSTRATE_EMBED_URL"] && process.env["NODE_ENV"] !== "production";
  let vectors: number[][];
  try {
    vectors = await embedTexts(texts, {
      backendId: devHashMode ? "dev-hash" : "cpu-local",
      model: "aef-dev-hash",
      pooling: "mean",
      normalize: true,
    });
  } catch (err) {
    errorBudgetCounter.inc({ kind: "embed_error", tenant_id: req.tenantId as string ?? "unknown" });
    logger.error({ traceId, error: String(err) }, "OpenAI-compat embed failed");
    res.status(502).json({
      error: { message: String(err), type: "upstream_error", code: "backend_unavailable" },
    });
    return;
  }

  const totalTokens = texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0);

  res.status(200).json({
    object: "list",
    data: vectors.map((embedding, index) => ({
      object: "embedding",
      embedding,
      index,
    })),
    model: body.model,
    usage: {
      prompt_tokens: totalTokens,
      total_tokens: totalTokens,
    },
    "x-aef-trace-id": traceId,
  });

  logger.info({ traceId, inputCount: texts.length, requestId: randomUUID() }, "openai-compat embed completed");
}) as unknown as RequestHandler);
