/**
 * PostgreSQL-backed Sliding-Window Rate Limiter
 *
 * Implements a true atomic sliding window algorithm backed by PostgreSQL.
 * Multi-instance safe: all server instances share rate-limit state via the shared DB.
 *
 * Atomicity: Each check+insert uses a dedicated pool client with:
 *   1. An advisory lock (pg_advisory_xact_lock) scoped to the (key, endpoint) pair
 *      — this serializes concurrent requests from the same user/IP for the same route
 *   2. COUNT(*) within the sliding window under the lock
 *   3. INSERT iff count < max, also under the lock
 *   4. DELETE expired rows for cleanup
 * The lock is automatically released on COMMIT/ROLLBACK.
 *
 * Fail policy (per-limiter via `failOpen`):
 * - failOpen: false (default) → 503 Service Unavailable on DB error.
 *   Use for authentication and mutating endpoints where bypass is a security risk.
 * - failOpen: true → permit request and log warning on DB error.
 *   Only appropriate for read endpoints where availability > strict enforcement.
 *
 * Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset,
 * X-RateLimit-Policy (includes ;sliding suffix per IETF draft-ietf-httpapi-ratelimit-headers)
 */

import { pool } from '@szl-holdings/db';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { sendError } from '../lib/api-response';
import { logger } from '../lib/logger';

interface SlidingWindowOptions {
  windowMs: number;
  max: number;
  endpointGroup: string;
  keyGenerator?: (req: Request) => string;
  message?: string | object;
  skip?: (req: Request) => boolean;
  failOpen?: boolean;
}

let tableEnsured = false;

async function ensureTable(client: any): Promise<void> {
  if (tableEnsured) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS rate_limit_log (
      id       bigserial    PRIMARY KEY,
      key      text         NOT NULL,
      endpoint text         NOT NULL,
      hit_at   timestamptz  NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS rate_limit_log_lookup_idx
      ON rate_limit_log (key, endpoint, hit_at)
  `);
  tableEnsured = true;
}

export function createSlidingWindowLimiter(opts: SlidingWindowOptions): RequestHandler {
  const {
    windowMs,
    max,
    endpointGroup,
    keyGenerator,
    message = { error: 'Too many requests. Please slow down.' },
    skip,
    failOpen = false,
  } = opts;

  const messageBody = typeof message === 'string' ? { error: message } : message;

  return async function slidingWindowLimiter(req: Request, res: Response, next: NextFunction) {
    if (skip?.(req)) return next();

    const key = keyGenerator
      ? keyGenerator(req)
      : (req as Request & { user?: { id?: string | number } }).user?.id != null
        ? `user:${(req as Request & { user?: { id?: string | number } }).user!.id}`
        : `ip:${req.ip ?? 'unknown'}`;

    const windowStart = new Date(Date.now() - windowMs).toISOString();
    const lockKey = `${key}:${endpointGroup}`;

    const client = await pool.connect().catch((err: Error) => {
      logger.error({ err, key, endpointGroup }, '[rate-limit] Pool connection failed');
      return null;
    });

    if (!client) {
      if (failOpen) return next();
      return (
        sendError(
          res,
          'Rate limiting service temporarily unavailable. Please retry shortly.',
          503,
          'SERVICE_UNAVAILABLE',
        ),
        undefined
      );
    }

    try {
      await client.query('BEGIN');
      await ensureTable(client);

      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockKey]);

      const { rows } = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM rate_limit_log
         WHERE key = $1 AND endpoint = $2 AND hit_at > $3`,
        [key, endpointGroup, windowStart],
      );

      const count = parseInt(rows[0]?.count ?? '0', 10);
      const remaining = Math.max(0, max - count);
      const resetAt = Math.floor((Date.now() + windowMs) / 1000);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetAt);
      res.setHeader('X-RateLimit-Policy', `${max};w=${Math.floor(windowMs / 1000)};sliding`);

      if (count >= max) {
        await client.query('COMMIT');
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
        const errorMessage =
          typeof messageBody === 'object' &&
          messageBody !== null &&
          'error' in (messageBody as object)
            ? String((messageBody as Record<string, unknown>)['error'])
            : String(messageBody);
        sendError(res, errorMessage, 429, 'RATE_LIMITED');
        return;
      }

      await client.query(`INSERT INTO rate_limit_log (key, endpoint) VALUES ($1, $2)`, [
        key,
        endpointGroup,
      ]);

      await client.query(
        `DELETE FROM rate_limit_log WHERE key = $1 AND endpoint = $2 AND hit_at <= $3`,
        [key, endpointGroup, windowStart],
      );

      await client.query('COMMIT');
      next();
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      logger.error(
        { err, key, endpointGroup, failOpen },
        '[rate-limit] Sliding-window DB check failed',
      );
      if (failOpen) {
        next();
      } else {
        sendError(
          res,
          'Rate limiting service temporarily unavailable. Please retry shortly.',
          503,
          'SERVICE_UNAVAILABLE',
        );
      }
    } finally {
      client.release();
    }
  };
}

const isProduction = process.env.NODE_ENV === 'production';

export const perUserApiSlidingLimiter = createSlidingWindowLimiter({
  windowMs: 60 * 1000,
  max: isProduction ? 100 : 500,
  endpointGroup: 'api-read',
  message: { error: 'API rate limit exceeded. Max 100 requests per minute per user.' },
  failOpen: true,
});

export const perUserWriteSlidingLimiter = createSlidingWindowLimiter({
  windowMs: 60 * 1000,
  max: isProduction ? 60 : 300,
  endpointGroup: 'api-write',
  message: { error: 'Write rate limit exceeded. Max 60 write operations per minute per user.' },
  failOpen: false,
});

export const strictAuthSlidingLimiter = createSlidingWindowLimiter({
  windowMs: 60 * 1000,
  max: isProduction ? 5 : 50,
  endpointGroup: 'auth-login',
  keyGenerator: (req) => `ip:${req.ip ?? 'unknown'}`,
  message: { error: 'Too many authentication attempts. Please wait 1 minute.' },
  skip: (req) => req.method === 'GET',
  failOpen: false,
});
