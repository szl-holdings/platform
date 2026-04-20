import type { NextFunction, Request, Response } from 'express';

interface RateLimitState {
  count: number;
  windowStart: number;
}

const MAX_REQUESTS_PER_WINDOW = Number(process.env['AEF_RATE_LIMIT_RPM'] ?? 60);
const WINDOW_MS = 60_000;

const state = new Map<string, RateLimitState>();

function getTenantKey(req: Request): string {
  const tenantHeader = req.headers['x-tenant-id'];
  return typeof tenantHeader === 'string' ? tenantHeader : (req.ip ?? 'unknown');
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = getTenantKey(req);
  const now = Date.now();

  const existing = state.get(key);

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
