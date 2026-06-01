import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

interface TenantBucket {
  tokens: number;
  lastRefill: number;
}

const DEFAULT_RPM = Number(process.env.AEF_RATE_LIMIT_RPM ?? 300);
const WINDOW_MS = 60_000;

const buckets = new Map<string, TenantBucket>();

function refill(bucket: TenantBucket, maxTokens: number): void {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = (elapsed / WINDOW_MS) * maxTokens;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
}

/**
 * Tenant-scoped token-bucket limiter applied AFTER auth/tenant resolution.
 * Each tenant gets its own RPM budget.
 */
export function perTenantRateLimit(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.tenantId ?? 'default';
  const maxTokens = DEFAULT_RPM;

  let bucket = buckets.get(tenantId);
  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: Date.now() };
    buckets.set(tenantId, bucket);
  }

  refill(bucket, maxTokens);

  if (bucket.tokens < 1) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      detail: `Tenant '${tenantId}' exceeds ${maxTokens} requests per minute`,
      retryAfterMs: Math.ceil((1 / maxTokens) * WINDOW_MS),
    });
    return;
  }

  bucket.tokens -= 1;
  next();
}

/**
 * Defense-in-depth IP-scoped global limiter applied BEFORE auth.
 * Protects unauthenticated public endpoints (health, metrics, docs) and
 * caps total per-IP request volume independently of tenant identity.
 *
 * Tunables:
 *   AEF_GLOBAL_RATE_LIMIT_WINDOW_MS  default 60_000 (1 minute)
 *   AEF_GLOBAL_RATE_LIMIT_MAX        default 600 requests / window / IP
 */
export const globalRateLimit = rateLimit({
  windowMs: Number(process.env.AEF_GLOBAL_RATE_LIMIT_WINDOW_MS ?? 60_000),
  limit: Number(process.env.AEF_GLOBAL_RATE_LIMIT_MAX ?? 600),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded',
    detail: 'Too many requests from this IP. Retry after the window resets.',
  },
});
