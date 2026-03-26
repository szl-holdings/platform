import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const isProduction = process.env.NODE_ENV === "production";

app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
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
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 86400,
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: (req) => req.path === "/api/health" || req.path === "/api/health/live" || req.path === "/api/health/ready",
});

app.use(apiLimiter);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
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
  });
});

app.get("/api/health/live", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health/ready", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
    checks: {
      server: "ok",
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
