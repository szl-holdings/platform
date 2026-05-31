import express, { type Application, type RequestHandler, type ErrorRequestHandler } from "express";
import cors from "cors";
import { requestTracing } from "./middleware/tracing.js";
import { requestLogger, logger } from "./middleware/logger.js";
import { conditionalAuth } from "./middleware/auth.js";
import { tenantScoping } from "./middleware/tenant.js";
import { perTenantRateLimit, globalRateLimit } from "./middleware/rate-limit.js";
import { metricsMiddleware, metricsHandler } from "./middleware/prometheus.js";
import { healthRouter } from "./routes/health.js";
import { embedRouter } from "./routes/embed.js";
import { rerankRouter } from "./routes/rerank.js";
import { hybridSearchRouter } from "./routes/hybrid-search.js";
import { ingestRouter } from "./routes/ingest.js";
import { indexOpsRouter } from "./routes/index-ops.js";
import { evalsRouter } from "./routes/evals.js";
import { openaiCompatRouter } from "./routes/openai-compat.js";
import { openApiSpec } from "./openapi/spec.js";

const PORT = Number(process.env.PORT ?? 8766);
const BASE_PATH = process.env.BASE_PATH ?? "/alloy-embedding-api";

const app: Application = express();

app.set("trust proxy", 1);

// CORS: explicit allowlist via CORS_ALLOWED_ORIGINS (comma-separated).
// Defaults to no cross-origin access; set the env var in production deployments.
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / non-browser requests have no Origin header — allow them.
      if (!origin) return callback(null, true);
      if (CORS_ALLOWED_ORIGINS.includes("*")) return callback(null, true);
      if (CORS_ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.use(requestTracing as RequestHandler);
app.use(metricsMiddleware as RequestHandler);
app.use(requestLogger as RequestHandler);

// Defense-in-depth: IP-scoped global limiter before any auth.
// Protects unauthenticated public endpoints (health/metrics/docs) and
// caps per-IP request volume independent of tenant identity.
app.use(globalRateLimit as RequestHandler);

app.get(`${BASE_PATH}/health`, (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "alloy-embedding-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Standard Kubernetes probe aliases (no BASE_PATH prefix — standard probe paths)
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/readyz", (_req, res) => {
  res.status(200).json({ ready: true });
});

app.get(`${BASE_PATH}/metrics`, metricsHandler as unknown as RequestHandler);
app.get(`${BASE_PATH}/docs`, (_req, res) => {
  res.status(200).json(openApiSpec);
});

app.use(conditionalAuth as RequestHandler);
app.use(tenantScoping as RequestHandler);
app.use(perTenantRateLimit as RequestHandler);

app.use(BASE_PATH, healthRouter);
app.use(BASE_PATH, embedRouter);
app.use(BASE_PATH, rerankRouter);
app.use(BASE_PATH, hybridSearchRouter);
app.use(BASE_PATH, ingestRouter);
app.use(BASE_PATH, indexOpsRouter);
app.use(BASE_PATH, evalsRouter);
app.use(BASE_PATH, openaiCompatRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ error: message }, "Unhandled error");
  res.status(500).json({ error: "Internal server error", detail: message });
}) as ErrorRequestHandler);

app.listen(PORT, "0.0.0.0", () => {
  logger.info({ port: PORT, basePath: BASE_PATH }, "Alloy Embedding Fabric API started");
});

export default app;
