import { Router } from "express";
import { requestTracing } from "./middleware/tracing.js";
import { requestLogger } from "./middleware/logger.js";
import { conditionalAuth } from "./middleware/auth.js";
import { tenantScoping } from "./middleware/tenant.js";
import { perTenantRateLimit } from "./middleware/rate-limit.js";
import { metricsMiddleware, metricsHandler } from "./middleware/prometheus.js";
import { embedRouter } from "./routes/embed.js";
import { rerankRouter } from "./routes/rerank.js";
import { hybridSearchRouter } from "./routes/hybrid-search.js";
import { ingestRouter } from "./routes/ingest.js";
import { indexOpsRouter } from "./routes/index-ops.js";
import { evalsRouter } from "./routes/evals.js";
import { openaiCompatRouter } from "./routes/openai-compat.js";
import { openApiSpec } from "./openapi/spec.js";

export function createAefRouter(): Router {
  const router = Router();

  router.use(requestTracing);
  router.use(metricsMiddleware);
  router.use(requestLogger);

  router.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "alloy-embedding-api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/metrics", metricsHandler);

  router.get("/docs", (_req, res) => {
    res.status(200).json(openApiSpec);
  });

  router.use(conditionalAuth);
  router.use(tenantScoping);
  router.use(perTenantRateLimit);

  router.use("/", embedRouter);
  router.use("/", rerankRouter);
  router.use("/", hybridSearchRouter);
  router.use("/", ingestRouter);
  router.use("/", indexOpsRouter);
  router.use("/", evalsRouter);
  router.use("/", openaiCompatRouter);

  return router;
}
