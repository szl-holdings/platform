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
import { sendError, sendNotFound, sendUnauthorized } from "./lib/api-response";
import { correlationMiddleware } from "./middlewares/correlation";
import { globalLimiter } from "./middlewares/rate-limiters";
import { telemetryMiddleware } from "./middlewares/telemetry";
import { traceEmitMiddleware } from "./middlewares/trace-emit";
import { authMiddleware } from "./middlewares/authMiddleware";
import { globalAuthEnforcer } from "./middlewares/global-auth-enforcer";
import { csrfMiddleware } from "./middlewares/csrf";
import { sessionRefreshPolicy } from "./middlewares/session-policy";
import { apiVersionMiddleware } from "./middlewares/api-version";
import { etagMiddleware } from "./middlewares/optimistic-concurrency";
import { ENV_SPECS } from "./lib/startup-validation";
import { resolveRuntimeMode } from "@szl-holdings/config";

const app: Express = express();

app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(correlationMiddleware);
app.use(apiVersionMiddleware);

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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Correlation-Id", "X-Request-Id", "X-CSRF-Token", "X-Api-Version"],
  exposedHeaders: ["X-Correlation-Id", "X-Request-Id", "X-Api-Version", "X-Api-Versions-Supported", "Deprecation", "Sunset", "X-Api-Deprecated", "X-Api-Deprecation-Notice"],
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
app.use(traceEmitMiddleware);

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as Request).requestId || (req as Request).correlationId || req.id,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
          requestId: req.id,
          correlationId: (req.raw as Request).correlationId ?? req.id,
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
app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

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
    const { durableJobQueue } = await import("@szl-holdings/forge-runtime");
    const stats = await durableJobQueue.getStats();
    queueDepth = stats.pending + stats.running;
    queueStatus = queueDepth > 50 ? "backpressure" : "ok";
  } catch { /* job queue may not be initialized yet */ }

  const hasSessionSecret = !!process.env.SESSION_SECRET;
  const authOk = hasSessionSecret ? "ok" : "degraded";
  const overallStatus = dbStatus === "degraded" || authOk === "degraded" ? "degraded" : "healthy";

  const platformApps = [
    { slug: "szl-holdings", name: "SZL Holdings Dashboard", type: "command_surface" },
    { slug: "command", name: "Unified Command", type: "command_surface" },
    { slug: "aegis", name: "Aegis — Defense & Intelligence", type: "domain_pack" },
    { slug: "terra", name: "Terra — Real Estate Intelligence", type: "domain_pack" },
    { slug: "vessels", name: "Vessels — Maritime Intelligence", type: "domain_pack" },
    { slug: "carlota-jo", name: "Carlota Jo Consulting", type: "domain_pack" },
    { slug: "szl-holdings-mobile", name: "CORTEX — Mobile Command", type: "mobile" },
    { slug: "api-server", name: "API Server", type: "backend" },
  ];

  let runtimeMode: string;
  try {
    runtimeMode = resolveRuntimeMode();
  } catch {
    runtimeMode = process.env["NODE_ENV"] === "production" ? "production" : "local-dev";
  }

  res.status(overallStatus === "healthy" ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    uptime_human: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
    version: process.env.npm_package_version || "0.0.0",
    environment: process.env.NODE_ENV || "development",
    mode: runtimeMode,
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
      storage: { status: "ok", mode: process.env.OBJECT_STORAGE_BUCKET_ID ? "cloud" : "local" },
      auth: { status: authOk, mode: hasSessionSecret ? "configured" : "missing_secret" },
      ai: { status: "ok", mode: (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.OPENAI_API_KEY) ? "live" : "mock" },
    },
    platform: {
      apps: platformApps,
      totalApps: platformApps.length,
    },
  });
});

app.get("/api/health/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

async function handleReadiness(_req: Request, res: Response) {
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
}

app.get("/api/ready", handleReadiness);
app.get("/api/health/ready", handleReadiness);

app.get("/api/health/detailed", async (req: Request, res: Response) => {
  if (isProduction) {
    const internalToken = process.env.ALLOY_INTERNAL_TOKEN;
    const providedToken = req.headers["x-internal-token"] as string | undefined;
    let hasInternalAccess = false;
    if (internalToken && providedToken) {
      const a = Buffer.from(internalToken, "utf8");
      const b = Buffer.from(providedToken, "utf8");
      if (a.length === b.length) {
        const { timingSafeEqual } = await import("crypto");
        hasInternalAccess = timingSafeEqual(a, b);
      }
    }
    if (!hasInternalAccess && !req.isAuthenticated()) {
      sendUnauthorized(res, "Detailed health information is restricted to authenticated users");
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
    const { durableJobQueue } = await import("@szl-holdings/forge-runtime");
    const stats = await durableJobQueue.getStats();
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

let _swaggerDocument: Record<string, unknown> | null = null;

try {
  const specPath = join(__dirname, "../../../lib/api-spec/openapi.yaml");
  const specContent = readFileSync(specPath, "utf-8");
  _swaggerDocument = parse(specContent) as Record<string, unknown>;
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(_swaggerDocument, {
    customSiteTitle: "SZL Holdings API Docs",
    swaggerOptions: { persistAuthorization: true },
  }));
  app.get("/api/docs.json", (_req: Request, res: Response) => {
    res.json(_swaggerDocument);
  });
  app.get("/api/openapi", (_req: Request, res: Response) => {
    res.json(_swaggerDocument);
  });
  app.get("/api/openapi.json", (_req: Request, res: Response) => {
    res.json(_swaggerDocument);
  });
} catch (err) {
  logger.warn({ err }, "Failed to load OpenAPI spec — /api/docs will be unavailable");
}

app.get("/api/version", (_req: Request, res: Response) => {
  res.json({
    version: process.env.npm_package_version ?? "0.0.0",
    apiVersion: "2026-04-15",
    supportedApiVersions: ["2025-01-01", "2026-04-15"],
    deprecatedApiVersions: ["2025-01-01"],
    sunsetDates: { "2025-01-01": "2027-01-01" },
    environment: process.env.NODE_ENV ?? "development",
    build: {
      commitSha: process.env.COMMIT_SHA ?? null,
      builtAt: process.env.BUILD_TIMESTAMP ?? null,
      nodeVersion: process.version,
    },
    docs: "/api/docs",
    openapi: "/api/openapi",
    health: "/api/health",
  });
});

app.get("/api/env-registry", async (req: Request, res: Response) => {
  if (isProduction) {
    const internalToken = process.env.ALLOY_INTERNAL_TOKEN;
    const providedToken = req.headers["x-internal-token"] as string | undefined;
    let hasInternalAccess = false;
    if (internalToken && providedToken) {
      const a = Buffer.from(internalToken, "utf8");
      const b = Buffer.from(providedToken, "utf8");
      if (a.length === b.length) {
        const { timingSafeEqual } = await import("crypto");
        hasInternalAccess = timingSafeEqual(a, b);
      }
    }
    if (!hasInternalAccess && !req.isAuthenticated()) {
      sendUnauthorized(res, "Environment registry is restricted to authenticated or internal users in production");
      return;
    }
  }
  const groups = ENV_SPECS.reduce<Record<string, Array<{
    key: string;
    required: boolean;
    description: string;
    configured: boolean;
    hasDefault: boolean;
    sensitive: boolean;
  }>>>((acc, spec) => {
    const group = spec.group ?? "other";
    if (!acc[group]) acc[group] = [];
    acc[group].push({
      key: spec.key,
      required: spec.required,
      description: spec.description,
      configured: !!process.env[spec.key],
      hasDefault: !!spec.defaultValue,
      sensitive: !!spec.sensitive,
    });
    return acc;
  }, {});
  const totalVars = ENV_SPECS.length;
  const configuredVars = ENV_SPECS.filter(s => !!process.env[s.key]).length;
  res.json({
    registryVersion: "1.0",
    atlasSchemaVersion: process.env.ATLAS_SCHEMA_VERSION ?? "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
    summary: {
      total: totalVars,
      configured: configuredVars,
      unconfigured: totalVars - configuredVars,
      coveragePct: Math.round((configuredVars / totalVars) * 100),
    },
    groups,
  });
});

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

app.get("/api/cortex/command-feed", async (_req: Request, res: Response) => {
  try {
    const { fusionCortex } = await import("@szl-holdings/ai-engine");
    const alerts = fusionCortex.getAlerts({ status: ["active"], limit: 20 });
    const DOMAIN_META: Record<string, { label: string; icon: string; accent: string; route: string }> = {
      vessels:   { label: "Vessels",   icon: "⚓", accent: "#0ea5e9", route: "/(shell)/fleet" },
      firestorm: { label: "Aegis",     icon: "⬡", accent: "#ef4444", route: "/(shell)/defense" },
      terra:     { label: "Terra",     icon: "⬢", accent: "#22c55e", route: "/(shell)/properties" },
      lyte:      { label: "Lyte",      icon: "⚡", accent: "#f59e0b", route: "/(shell)/operations" },
      inca:      { label: "INCA",      icon: "◈", accent: "#8b5cf6", route: "/(shell)/advisory" },
      msp:       { label: "MSP",       icon: "◆", accent: "#6366f1", route: "/(shell)/operations" },
      prism:     { label: "PRISM",     icon: "⚖", accent: "#a855f7", route: "/(shell)/advisory" },
      szl:       { label: "Portfolio", icon: "◆", accent: "#c9a84c", route: "/(shell)/portfolio" },
    };
    const fmt = (d: Date) => {
      const diff = Math.max(0, Date.now() - d.getTime());
      const m = Math.floor(diff / 60000);
      if (m < 1) return "just now";
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      return `${Math.floor(h / 24)}d ago`;
    };
    const signals = alerts.map((a) => ({
      id: a.id,
      domain: a.affectedDomains[0] ?? "szl",
      severity: a.severity,
      title: a.title,
      source: "CORTEX Fusion",
      time: fmt(new Date(a.generatedAt)),
    }));
    const domainKeys = Object.keys(DOMAIN_META);
    const summaries = domainKeys.map((domain) => {
      const domainAlerts = alerts.filter((a) => a.affectedDomains.includes(domain));
      const critCount = domainAlerts.filter((a) => a.severity === "critical").length;
      const highCount = domainAlerts.filter((a) => a.severity === "high").length;
      const meta = DOMAIN_META[domain];
      const status: "operational" | "degraded" | "critical" =
        critCount > 0 ? "critical" : highCount > 0 ? "degraded" : "operational";
      return {
        domain,
        label: meta.label,
        icon: meta.icon,
        accent: meta.accent,
        activeCount: domainAlerts.length,
        criticalCount: critCount,
        status,
        route: meta.route,
      };
    });
    res.json({ signals, summaries });
  } catch (err) {
    res.status(500).json({ error: "Failed to load command feed", message: err instanceof Error ? err.message : String(err) });
  }
});

app.use("/api", etagMiddleware);
app.use(globalAuthEnforcer);
app.use("/api", router);

const nexusDist = join(__dirname, "../../mockup-sandbox/dist/public");
app.use("/nexus", express.static(nexusDist, { index: false }));
app.use("/nexus", (_req: Request, res: Response) => {
  res.sendFile(join(nexusDist, "index.html"));
});

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
    sendError(res, "GraphQL is still initializing", 503, "SERVICE_UNAVAILABLE");
  }
});

app.use((_req: Request, res: Response) => {
  sendNotFound(res, "The requested resource");
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

  const errorMessage = isServerError ? "Internal Server Error" : err.message;
  const errorCode = isServerError ? "INTERNAL_ERROR" : "CLIENT_ERROR";
  sendError(res, errorMessage, statusCode, errorCode);
});

export default app;
