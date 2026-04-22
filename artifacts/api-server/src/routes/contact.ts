import { db, pool, supportTicketsTable } from '@szl-holdings/db';
import { createHmac } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { contactSubmitSchema, validateBody, validateQuery } from '../lib/validation';
import { adminGuard } from '../middlewares/admin-guard';
import { authMiddleware } from '../middlewares/auth';
import { encryptField } from '../middlewares/field-encryption';
import { publicSubmitLimiter } from '../middlewares/rate-limiters';

const router: IRouter = Router();

/**
 * Compute a deterministic HMAC-SHA256 hash of an email address.
 * This allows lookups for GDPR erasure without storing plaintext email.
 * Uses the same FIELD_ENCRYPTION_KEY as AES-256-GCM encryption.
 *
 * In production, this hard-fails if FIELD_ENCRYPTION_KEY is not set.
 * This is consistent with encryptField's production behavior and prevents
 * accidental use of the zero-key fallback in a live environment.
 */
function hashEmail(email: string): string {
  const rawKey = process.env.FIELD_ENCRYPTION_KEY;
  if (!rawKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FIELD_ENCRYPTION_KEY must be set in production — cannot compute email hash');
    }
    logger.warn(
      '[contact] FIELD_ENCRYPTION_KEY not set — using zero-key fallback (development only)',
    );
  }
  const key = rawKey ?? '0'.repeat(64);
  return createHmac('sha256', Buffer.from(key, 'hex'))
    .update(email.toLowerCase().trim())
    .digest('hex');
}

router.post(
  '/contact/submit',
  publicSubmitLimiter,
  validateBody(contactSubmitSchema),
  async (req: Request, res: Response) => {
    try {
      const { type, app, name, email, company, role, message, metadata } = req.body as z.infer<
        typeof contactSubmitSchema
      >;

      const sanitized = {
        type: type ?? 'general',
        app: app ?? 'unknown',
        name: encryptField(name, 'contact_pii'),
        email: encryptField(email, 'contact_pii'),
        emailHash: hashEmail(email),
        company: company ?? null,
        role: role ?? null,
        message: message ?? null,
        metadata: metadata ?? null,
      };

      const result = await pool.query(
        `INSERT INTO platform_contact_requests
        (type, app, name, email, email_hash, company, role, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
        [
          sanitized.type,
          sanitized.app,
          sanitized.name,
          sanitized.email,
          sanitized.emailHash,
          sanitized.company,
          sanitized.role,
          sanitized.message,
          sanitized.metadata ? JSON.stringify(sanitized.metadata) : null,
        ],
      );

      const row = result.rows[0];

      logger.info(
        { id: row.id, type: sanitized.type, app: sanitized.app },
        'Contact request submitted',
      );

      const ticketRef = `TKT-${Date.now().toString(36).toUpperCase()}`;
      try {
        await db.insert(supportTicketsTable).values({
          ticketRef,
          subject: `[Contact Form] ${type ?? 'General'} enquiry from ${name}`,
          description: message ?? `Contact form submission from ${name} (${email})`,
          category: 'other',
          priority: 'medium',
          status: 'open',
          submitterName: name,
          submitterEmail: email,
          userId: null,
          orgId: null,
        });
      } catch (fanoutErr) {
        logger.warn(
          { err: fanoutErr, contactId: row.id },
          'Failed to fan-out contact request to support ticket (non-fatal)',
        );
      }

      sendSuccess(
        res,
        {
          id: row.id,
          submittedAt: row.created_at,
          message: 'Your request has been received. We will be in touch within 1 business day.',
        },
        201,
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to submit contact request');
    }
  },
);

const contactListQuerySchema = z.object({
  app: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get(
  '/contact/requests',
  adminGuard,
  validateQuery(contactListQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { app, limit, offset } = req.query as unknown as z.infer<typeof contactListQuerySchema>;

      if (app) {
        const result = await pool.query(
          `SELECT id, type, app, company, role, message, status, created_at, updated_at
         FROM platform_contact_requests WHERE app = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
          [app, limit, offset],
        );
        const countResult = await pool.query(
          `SELECT COUNT(*)::int as total FROM platform_contact_requests WHERE app = $1`,
          [app],
        );
        sendSuccess(res, result.rows, 200, {
          total: countResult.rows[0]?.total ?? 0,
          limit,
          offset,
        });
      } else {
        const result = await pool.query(
          `SELECT id, type, app, company, role, message, status, created_at, updated_at
         FROM platform_contact_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset],
        );
        const countResult = await pool.query(
          `SELECT COUNT(*)::int as total FROM platform_contact_requests`,
          [],
        );
        sendSuccess(res, result.rows, 200, {
          total: countResult.rows[0]?.total ?? 0,
          limit,
          offset,
        });
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to list contact requests');
    }
  },
);

const submissionsQuerySchema = z.object({
  type: z.string().optional(),
  app: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get(
  '/contact/submissions',
  authMiddleware,
  adminGuard,
  validateQuery(submissionsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { type, app, limit, offset } = req.query as unknown as z.infer<
        typeof submissionsQuerySchema
      >;

      const conditions: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (type) {
        conditions.push(`type = $${idx++}`);
        params.push(type);
      }
      if (app) {
        conditions.push(`app = $${idx++}`);
        params.push(app);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      params.push(limit, offset);

      const result = await pool.query(
        `SELECT id, type, app, company, role, message, status, metadata, created_at, updated_at
       FROM platform_contact_requests ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
        params,
      );
      const countResult = await pool.query(
        `SELECT COUNT(*)::int as total FROM platform_contact_requests ${where}`,
        params.slice(0, -2),
      );
      sendSuccess(res, { submissions: result.rows }, 200, {
        total: countResult.rows[0]?.total ?? 0,
        limit,
        offset,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list diagnostic submissions');
    }
  },
);

export default router;
export { hashEmail };
