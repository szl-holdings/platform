import type { NextFunction, Request, Response } from 'express';

interface TenantBucket {
  tokens: number;
  lastRefill: number;
}

const DEFAULT_RPM = Number(process.env['AEF_RATE_LIMIT_RPM'] ?? 300);
const WINDOW_MS = 60_000;

const buckets = new Map<string, TenantBucket>();

function refill(bucket: TenantBucket, maxTokens: number): void {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = (elapsed / WINDOW_MS) * maxTokens;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;
}

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
