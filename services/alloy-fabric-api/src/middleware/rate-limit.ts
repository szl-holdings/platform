import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

interface RateLimitState {
  count: number;
  windowStart: number;
}

const MAX_REQUESTS_PER_WINDOW = Number(process.env.AEF_RATE_LIMIT_RPM ?? 60);
const WINDOW_MS = 60_000;
const MAX_TRACKED_TENANTS = 4096;
if (!Number.isSafeInteger(MAX_REQUESTS_PER_WINDOW) || MAX_REQUESTS_PER_WINDOW <= 0) {
  throw new Error('AEF_RATE_LIMIT_RPM must be a positive safe integer');
}

/** A single process-wide bucket bounds request work and store cardinality. */
export function createGlobalRateLimit(limit = 6000) {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error('Global request limit must be a positive safe integer');
  }
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    keyGenerator: () => 'process',
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'rate_limit_exceeded' },
  });
}

const state = new Map<string, RateLimitState>();

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = String(
    res.locals.tenantId ?? res.locals.authenticatedTenantId ?? req.ip ?? 'unknown',
  );
  const now = Date.now();

  for (const [storedKey, entry] of state) {
    if (now - entry.windowStart >= WINDOW_MS) state.delete(storedKey);
  }
  const existing = state.get(key);
  if (!existing && state.size >= MAX_TRACKED_TENANTS) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ error: 'rate_limit_capacity_exceeded' });
    return;
  }

  if (!existing || now - existing.windowStart > WINDOW_MS) {
    state.set(key, { count: 1, windowStart: now });
    res.setHeader('x-ratelimit-limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('x-ratelimit-remaining', MAX_REQUESTS_PER_WINDOW - 1);
    next();
    return;
  }

  existing.count += 1;

  if (existing.count > MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `Rate limit of ${MAX_REQUESTS_PER_WINDOW} requests per minute exceeded for this tenant.`,
      retryAfterMs: WINDOW_MS - (now - existing.windowStart),
    });
    return;
  }

  res.setHeader('x-ratelimit-limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('x-ratelimit-remaining', MAX_REQUESTS_PER_WINDOW - existing.count);
  next();
}
