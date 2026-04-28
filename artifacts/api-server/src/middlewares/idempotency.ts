import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../lib/api-response';
import { logger } from '../lib/logger';

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

function fingerprintBody(body: unknown): string {
  if (body == null || (typeof body === 'object' && Object.keys(body).length === 0)) return 'empty';
  try {
    return createHash('sha256').update(JSON.stringify(body)).digest('hex');
  } catch {
    return 'unparseable';
  }
}

function makeStoreKey(req: Request, idempotencyKey: string): string {
  const userId = (req.user?.id ?? 'anon').toString();
  return `${userId}:${req.method}:${req.path}:${idempotencyKey}`;
}

async function getRecord(storeKey: string): Promise<IdempotencyRecord | null> {
  try {
    const { pool } = await import('@szl-holdings/db');
    const result = await pool.query<{
      idempotency_key: string;
      method: string;
      path: string;
      body_fingerprint: string;
      status_code: number;
      body: unknown;
      headers: Record<string, string>;
      created_at: string;
    }>(
      `SELECT idempotency_key, method, path, body_fingerprint, status_code, body, headers, created_at
       FROM idempotency_records
       WHERE store_key = $1 AND expires_at > NOW()
       LIMIT 1`,
      [storeKey],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      key: row.idempotency_key,
      method: row.method,
      path: row.path,
      bodyFingerprint: row.body_fingerprint,
      statusCode: row.status_code,
      body: row.body,
      headers: row.headers ?? {},
      createdAt: Number(row.created_at),
    };
  } catch (err) {
    logger.warn({ err, storeKey }, '[idempotency] DB read failed — treating as cache miss');
    return null;
  }
}

async function setRecord(
  storeKey: string,
  idempotencyKey: string,
  req: Request,
  record: Omit<IdempotencyRecord, 'key'>,
): Promise<void> {
  try {
    const { pool } = await import('@szl-holdings/db');
    const userId = (req.user?.id ?? 'anon').toString();
    const expiresAt = new Date(record.createdAt + TTL_MS);
    await pool.query(
      `INSERT INTO idempotency_records
         (store_key, idempotency_key, user_id, method, path, body_fingerprint,
          status_code, body, headers, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (store_key) DO NOTHING`,
      [
        storeKey,
        idempotencyKey,
        userId,
        record.method,
        record.path,
        record.bodyFingerprint,
        record.statusCode,
        JSON.stringify(record.body),
        JSON.stringify(record.headers),
        record.createdAt,
        expiresAt.toISOString(),
      ],
    );
  } catch (err) {
    logger.warn({ err, storeKey }, '[idempotency] DB write failed — response not cached');
  }
}

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATION_METHODS.has(req.method)) {
    next();
    return;
  }

  const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

  if (!idempotencyKey) {
    sendError(
      res,
      'X-Idempotency-Key header is required for this mutation endpoint',
      400,
      'IDEMPOTENCY_KEY_REQUIRED',
    );
    return;
  }

  if (
    typeof idempotencyKey !== 'string' ||
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 128
  ) {
    sendError(
      res,
      'X-Idempotency-Key must be a string between 8 and 128 characters',
      400,
      'INVALID_IDEMPOTENCY_KEY',
    );
    return;
  }

  const requestFingerprint = fingerprintBody(req.body);
  const storeKey = makeStoreKey(req, idempotencyKey);

  getRecord(storeKey).then((existing) => {
    if (existing) {
      if (existing.bodyFingerprint !== requestFingerprint) {
        sendError(
          res,
          'The idempotency key was used with a different request body. Use a new key for a different request.',
          409,
          'IDEMPOTENCY_BODY_MISMATCH',
        );
        return;
      }

      logger.debug({ idempotencyKey, path: req.path }, 'Idempotency replay');
      res.set('X-Idempotency-Replayed', 'true');
      res.set('X-Idempotency-Created-At', new Date(existing.createdAt).toISOString());
      res.status(existing.statusCode).json(existing.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown): Response => {
      if (res.statusCode < 500 && idempotencyKey) {
        const responseHeaders: Record<string, string> = {};
        const correlationId = res.getHeader('X-Correlation-Id');
        if (correlationId) responseHeaders['X-Correlation-Id'] = String(correlationId);

        const record = {
          method: req.method,
          path: req.path,
          bodyFingerprint: requestFingerprint,
          statusCode: res.statusCode,
          body,
          headers: responseHeaders,
          createdAt: Date.now(),
        };
        void setRecord(storeKey, idempotencyKey, req, record);
      }
      return originalJson(body);
    };

    next();
  }).catch((err) => {
    logger.warn({ err }, '[idempotency] Unexpected error — passing through');
    next();
  });
}

export function optionalIdempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

  if (!idempotencyKey) {
    next();
    return;
  }

  if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    sendError(
      res,
      'X-Idempotency-Key must be a string between 8 and 128 characters',
      400,
      'INVALID_IDEMPOTENCY_KEY',
    );
    return;
  }

  const requestFingerprint = fingerprintBody(req.body);
  const storeKey = makeStoreKey(req, idempotencyKey);

  getRecord(storeKey).then((existing) => {
    if (existing) {
      if (existing.bodyFingerprint !== requestFingerprint) {
        sendError(
          res,
          'The idempotency key was used with a different request body. Use a new key for a different request.',
          409,
          'IDEMPOTENCY_BODY_MISMATCH',
        );
        return;
      }

      logger.debug({ idempotencyKey, path: req.path }, 'Idempotency replay');
      res.set('X-Idempotency-Replayed', 'true');
      res.set('X-Idempotency-Created-At', new Date(existing.createdAt).toISOString());
      res.status(existing.statusCode).json(existing.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown): Response => {
      if (res.statusCode < 500 && idempotencyKey) {
        const responseHeaders: Record<string, string> = {};
        const record = {
          method: req.method,
          path: req.path,
          bodyFingerprint: requestFingerprint,
          statusCode: res.statusCode,
          body,
          headers: responseHeaders,
          createdAt: Date.now(),
        };
        void setRecord(storeKey, idempotencyKey, req, record);
      }
      return originalJson(body);
    };

    next();
  }).catch((err) => {
    logger.warn({ err }, '[idempotency] Unexpected error — passing through');
    next();
  });
}

export async function cleanupExpiredIdempotencyRecords(): Promise<number> {
  try {
    const { pool } = await import('@szl-holdings/db');
    const result = await pool.query<{ count: string }>(
      `DELETE FROM idempotency_records WHERE expires_at <= NOW()`,
    );
    const count = result.rowCount ?? 0;
    if (count > 0) {
      logger.info({ count }, '[idempotency] Cleaned up expired records');
    }
    return count;
  } catch (err) {
    logger.warn({ err }, '[idempotency] Cleanup failed');
    return 0;
  }
}
