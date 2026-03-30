import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { correlationMiddleware } from "./middlewares/correlation";
import { globalLimiter } from "./middlewares/rate-limiters";
import { telemetryMiddleware } from "./middlewares/telemetry";

const app: Express = express();

const isProduction = process.env.NODE_ENV === "production";

app.use(correlationMiddleware);

app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
}));

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : undefined;

if (isProduction && !allowedOrigins) {
  logger.warn("CORS_ORIGINS not set in production — CORS will reject cross-origin requests with credentials");
}

app.use(cors({
  origin: isProduction
    ? (allowedOrigins ?? false)
    : (allowedOrigins ?? true),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Correlation-Id"],
  exposedHeaders: ["X-Correlation-Id"],
  maxAge: 86400,
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const dbUrl = process.env.DATABASE_URL;
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "0.0.0",
    environment: process.env.NODE_ENV || "development",
    memory: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
    },
    node: process.version,
    services: {
      database: dbUrl ? "configured" : "not_configured",
      server: "ok",
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
      const { db } = await import("@workspace/db");
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

app.use("/api", router);

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
    message: isProduction && isServerError
      ? "An unexpected error occurred. Please try again later."
      : err.message,
    statusCode,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

export default app;
