import { db, dosSiteSettingsTable } from '@szl-holdings/db';
import { createHash } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { sendError, sendUnauthorized } from '../lib/api-response';

export async function dosApiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendUnauthorized(
      res,
      'Missing or invalid Authorization header. Use: Authorization: Bearer <key>',
    );
    return;
  }
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    sendUnauthorized(res, 'API key is empty');
    return;
  }
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  try {
    const rows = await db
      .select({ id: dosSiteSettingsTable.id, label: dosSiteSettingsTable.label })
      .from(dosSiteSettingsTable)
      .where(
        and(
          eq(dosSiteSettingsTable.category, 'integration'),
          eq(dosSiteSettingsTable.value, keyHash),
          sql`${dosSiteSettingsTable.key} LIKE 'apikey_%'`,
        ),
      )
      .limit(1);
    if (!rows.length) {
      sendUnauthorized(res, 'Invalid API key');
      return;
    }
    (req as any).dosApiKeyId = rows[0].id;
    (req as any).dosApiKeyName = rows[0].label;
    next();
  } catch (_err) {
    sendError(res, 'Authentication service error', 500, 'INTERNAL_ERROR');
  }
}
