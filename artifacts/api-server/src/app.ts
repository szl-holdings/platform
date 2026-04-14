import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { parse } from "yaml";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomBytes } from "crypto";
import router from "./routes";
import { logger } from "./lib/logger";
import { correlationMiddleware } from "./middlewares/correlation";
import { globalLimiter } from "./middlewares/rate-limiters";
import { telemetryMiddleware } from "./middlewares/telemetry";
import { authMiddleware } from "./middlewares/authMiddleware";
import { csrfMiddleware } from "./middlewares/csrf";
import { sessionRefreshPolicy } from "./middlewares/session-policy";

const app: Express = express();

app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(correlationMiddleware);

app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: isProduction ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "sameorigin" },
  dnsPrefetchControl: { allow: false },
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
}));

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  if (isProduction) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }
  next();
});

const rawCorsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : undefined;

if (isProduction && !rawCorsOrigins) {
  logger.warn("CORS_ORIGINS not set in production — CORS will reject cross-origin requests with credentials");
}

function originToPattern(origin: string): RegExp | string {
  if (origin.includes("*")) {
    const escaped = origin.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\\\*/g, ".*");
    return new RegExp(`^${escaped}$`);
  }
  return origin;
}

const corsOriginList = rawCorsOrigins?.map(originToPattern);

function corsOriginFn(
  requestOrigin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  if (!requestOrigin) return callback(null, true);
  if (!corsOriginList) return callback(null, !isProduction);
  const allowed = corsOriginList.some(pattern =>
    pattern instanceof RegExp ? pattern.test(requestOrigin) : pattern === requestOrigin
  );
  callback(null, allowed);
}

app.use(cors({
  origin: corsOriginFn,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Correlation-Id", "X-CSRF-Token"],
  exposedHeaders: ["X-Correlation-Id"],
  maxAge: 86400,
}));

app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));

app.use(globalLimiter);

app.use(telemetryMiddleware);

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as Request).correlationId || req.id,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
          correlationId: req.id,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  }),
);

app.use(cookieParser());
app.use(express.json({
  limit: "10mb",
  verify: (req: Request, _res, buf) => {
    (req as Request & { rawBody?: Buffer }).rawBody = buf;
  },
}));
app.use(express.urlencoded({
  extended: true,
  limit: "10mb",
  verify: (req: Request, _res, buf) => {
    if (!(req as Request & { rawBody?: Buffer }).rawBody) {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    }
  },
}));
app.use(csrfMiddleware);
app.use(authMiddleware);
app.use(sessionRefreshPolicy());

app.get("/api/health", async (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const dbUrl = process.env.DATABASE_URL;
  const uptimeSeconds = Math.floor(process.uptime());

  // Check database connectivity
  let dbStatus: "ok" | "degraded" | "not_configured" = dbUrl ? "ok" : "not_configured";
  let dbLatencyMs: number | null = null;
  if (dbUrl) {
    const dbStart = Date.now();
    try {
      const { db } = await import("@szl-holdings/db");
      const { sql } = await import("drizzle-orm");
      await Promise.race([
        db.execute(sql`SELECT 1`),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
      ]);
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbStatus = "degraded";
      dbLatencyMs = Date.now() - dbStart;
    }
  }

  // Check job queue
  let queueStatus: "ok" | "backpressure" | "unavailable" = "unavailable";
  let queueDepth = 0;
  try {
    const { jobQueue } = await import("./lib/job-queue.js");
    const stats = jobQueue.getStats();
    queueDepth = stats.pending + stats.running;
    queueStatus = queueDepth > 50 ? "backpressure" : "ok";
  } catch { /* job queue may not be initialized yet */ }

  const overallStatus = dbStatus === "degraded" ? "degraded" : "healthy";

  res.status(overallStatus === "healthy" ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    uptime_human: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
    version: process.env.npm_package_version || "0.0.0",
    environment: process.env.NODE_ENV || "development",
    node: process.version,
    memory: {
      heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMb: Math.round(memUsage.rss / 1024 / 1024),
      heapUsedPct: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    services: {
      server: { status: "ok" },
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      job_queue: { status: queueStatus, depth: queueDepth },
      storage: { status: process.env.OBJECT_STORAGE_BUCKET_ID ? "configured" : "demo" },
      auth: { status: process.env.SESSION_SECRET ? "configured" : "missing_secret" },
      ai: { status: (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.OPENAI_API_KEY) ? "configured" : "not_configured" },
    },
  });
});

app.get("/api/health/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health/ready", async (_req: Request, res: Response) => {
  const dbUrl = process.env.DATABASE_URL;
  let dbStatus = "not_configured";

  if (dbUrl) {
    try {
      const { db } = await import("@szl-holdings/db");
      const { sql } = await import("drizzle-orm");
      await Promise.race([
        db.execute(sql`SELECT 1`),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
      ]);
      dbStatus = "connected";
    } catch {
      dbStatus = "unreachable";
    }
  }

  const allOk = dbStatus !== "unreachable";

  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ready" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      server: "ok",
      database: dbStatus,
      uptime: process.uptime(),
    },
  });
});

app.get("/api/health/detailed", async (req: Request, res: Response) => {
  if (isProduction) {
    const internalToken = process.env.ALLOY_INTERNAL_TOKEN;
    const providedToken = req.headers["x-internal-token"];
    const hasInternalAccess = internalToken && providedToken === internalToken;
    if (!hasInternalAccess && !req.isAuthenticated()) {
      res.status(401).json({ error: "Authentication required", message: "Detailed health information is restricted." });
      return;
    }
  }
  const checks: Record<string, { status: string; latencyMs?: number; details?: string }> = {};

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const start = Date.now();
    try {
      const { db, pool } = await import("@szl-holdings/db");
      const { sql } = await import("drizzle-orm");
      await Promise.race([
        db.execute(sql`SELECT 1`),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
      ]);
      const poolDetails = pool
        ? `total=${pool.totalCount} idle=${pool.idleCount} waiting=${pool.waitingCount}`
        : undefined;
      checks["database"] = { status: "connected", latencyMs: Date.now() - start, details: poolDetails };
    } catch {
      checks["database"] = { status: "unreachable", latencyMs: Date.now() - start };
    }
  } else {
    checks["database"] = { status: "not_configured" };
  }

  try {
    const { jobQueue } = await import("./lib/job-queue.js");
    const stats = jobQueue.getStats();
    const queueDepth = stats.pending + stats.running;
    checks["job_queue"] = {
      status: queueDepth > 50 ? "backpressure" : "ok",
      details: `pending=${stats.pending} running=${stats.running} completed=${stats.completed} failed=${stats.failed}`,
    };
  } catch {
    checks["job_queue"] = { status: "unavailable" };
  }

  try {
    const { serverTelemetry } = await import("@szl-holdings/observability");
    const snapshot = serverTelemetry.getSnapshot();
    checks["telemetry"] = {
      status: snapshot.errorRate > 10 ? "elevated_errors" : "ok",
      details: `p95=${snapshot.p95Latency.toFixed(0)}ms error_rate=${snapshot.errorRate.toFixed(1)}% active_alerts=${snapshot.activeAlerts}`,
    };
  } catch {
    checks["telemetry"] = { status: "unavailable" };
  }

  const allStatuses = Object.values(checks).map((c) => c.status);
  const overallStatus =
    allStatuses.some((s) => s === "unreachable" || s === "unavailable") ? "degraded" :
    allStatuses.some((s) => s === "backpressure" || s === "elevated_errors") ? "warning" :
    "healthy";

  res.status(overallStatus === "degraded" ? 503 : 200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? "0.0.0",
    environment: process.env.NODE_ENV ?? "development",
    checks,
    memory: (() => {
      const m = process.memoryUsage();
      return {
        heapUsedMb: Math.round(m.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(m.heapTotal / 1024 / 1024),
        rssMb: Math.round(m.rss / 1024 / 1024),
      };
    })(),
  });
});

try {
  const specPath = join(__dirname, "../../../lib/api-spec/openapi.yaml");
  const specContent = readFileSync(specPath, "utf-8");
  const swaggerDocument = parse(specContent) as Record<string, unknown>;
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "SZL Holdings API Docs",
    swaggerOptions: { persistAuthorization: true },
  }));
  app.get("/api/docs.json", (_req: Request, res: Response) => {
    res.json(swaggerDocument);
  });
} catch (err) {
  logger.warn({ err }, "Failed to load OpenAPI spec — /api/docs will be unavailable");
}

app.get("/api/csrf-token", (req: Request, res: Response) => {
  let token = req.cookies?.["csrf_token"] as string | undefined;
  if (!token) {
    token = randomBytes(32).toString("hex");
    res.cookie("csrf_token", token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
  }
  res.json({ csrfToken: token });
});

app.use("/api", router);

let _graphqlHandler: ((req: Request, res: Response, next: import("express").NextFunction) => void) | null = null;

export function registerGraphQLHandler(
  handler: (req: Request, res: Response, next: import("express").NextFunction) => void,
): void {
  _graphqlHandler = handler;
}

app.use("/api/graphql", (req: Request, res: Response, next: import("express").NextFunction) => {
  if (_graphqlHandler) {
    _graphqlHandler(req, res, next);
  } else {
    res.status(503).json({ error: "GraphQL not ready", message: "GraphQL is still initializing" });
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist.",
    statusCode: 404,
  });
});

interface HttpError extends Error {
  statusCode?: number;
}

function isHttpError(err: Error): err is HttpError {
  return typeof (err as HttpError).statusCode === "number";
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = isHttpError(err) ? (err.statusCode ?? 500) : 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    logger.error({ err, statusCode }, "Unhandled server error");
  } else {
    logger.warn({ err, statusCode }, "Client error");
  }

  res.status(statusCode).json({
    error: isServerError ? "Internal Server Error" : err.message,
    message: isServerError
      ? "An unexpected error occurred. Please try again later."
      : err.message,
    statusCode,
  });
});

export default app;
