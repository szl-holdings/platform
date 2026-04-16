import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { LRUCache } from "lru-cache";
import { logger } from "../lib/logger";
import { sendError } from "../lib/api-response";

interface IdempotencyRecord {
  key: string;
  method: string;
  path: string;
  bodyFingerprint: string;
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  createdAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000;
const store = new LRUCache<string, IdempotencyRecord>({ max: 5000 });

function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now - record.createdAt > TTL_MS) {
      store.delete(key);
    }
  }
}

setInterval(cleanupExpired, 60 * 60 * 1000).unref();

function fingerprintBody(body: unknown): string {
  if (body == null || (typeof body === "object" && Object.keys(body).length === 0)) return "empty";
  try {
    return createHash("sha256").update(JSON.stringify(body)).digest("hex");
  } catch {
    return "unparseable";
  }
}

function makeStoreKey(req: Request, idempotencyKey: string): string {
  const userId = (req.user?.id ?? "anon").toString();
  return `${userId}:${req.method}:${req.path}:${idempotencyKey}`;
}

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATION_METHODS.has(req.method)) {
    next();
    return;
  }

  const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;

  if (!idempotencyKey) {
    sendError(res, "X-Idempotency-Key header is required for this mutation endpoint", 400, "IDEMPOTENCY_KEY_REQUIRED");
    return;
  }

  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    sendError(res, "X-Idempotency-Key must be a string between 8 and 128 characters", 400, "INVALID_IDEMPOTENCY_KEY");
    return;
  }

  const requestFingerprint = fingerprintBody(req.body);
  const storeKey = makeStoreKey(req, idempotencyKey);
  const existing = store.get(storeKey);

  if (existing) {
    if (existing.bodyFingerprint !== requestFingerprint) {
      sendError(res, "The idempotency key was used with a different request body. Use a new key for a different request.", 409, "IDEMPOTENCY_BODY_MISMATCH");
      return;
    }

    logger.debug({ idempotencyKey, path: req.path }, "Idempotency replay");
    res.set("X-Idempotency-Replayed", "true");
    res.set("X-Idempotency-Created-At", new Date(existing.createdAt).toISOString());
    res.status(existing.statusCode).json(existing.body);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown): Response => {
    if (res.statusCode < 500 && idempotencyKey) {
      const responseHeaders: Record<string, string> = {};
      const correlationId = res.getHeader("X-Correlation-Id");
      if (correlationId) responseHeaders["X-Correlation-Id"] = String(correlationId);

      store.set(storeKey, {
        key: idempotencyKey,
        method: req.method,
        path: req.path,
        bodyFingerprint: requestFingerprint,
        statusCode: res.statusCode,
        body,
        headers: responseHeaders,
        createdAt: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
}

export function optionalIdempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = req.headers["x-idempotency-key"] as string | undefined;

  if (!idempotencyKey) {
    next();
    return;
  }

  if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    sendError(res, "X-Idempotency-Key must be a string between 8 and 128 characters", 400, "INVALID_IDEMPOTENCY_KEY");
    return;
  }

  const requestFingerprint = fingerprintBody(req.body);
  const storeKey = makeStoreKey(req, idempotencyKey);
  const existing = store.get(storeKey);

  if (existing) {
    if (existing.bodyFingerprint !== requestFingerprint) {
      sendError(res, "The idempotency key was used with a different request body. Use a new key for a different request.", 409, "IDEMPOTENCY_BODY_MISMATCH");
      return;
    }

    logger.debug({ idempotencyKey, path: req.path }, "Idempotency replay");
    res.set("X-Idempotency-Replayed", "true");
    res.set("X-Idempotency-Created-At", new Date(existing.createdAt).toISOString());
    res.status(existing.statusCode).json(existing.body);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown): Response => {
    if (res.statusCode < 500 && idempotencyKey) {
      const responseHeaders: Record<string, string> = {};
      store.set(storeKey, {
        key: idempotencyKey,
        method: req.method,
        path: req.path,
        bodyFingerprint: requestFingerprint,
        statusCode: res.statusCode,
        body,
        headers: responseHeaders,
        createdAt: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
}
