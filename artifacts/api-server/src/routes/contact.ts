import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool } from "@szl-holdings/db";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { authMiddleware } from "../middlewares/authMiddleware";
import { contactSubmitSchema, validateBody, validateQuery } from "../lib/validation";
import { z } from "zod";
import { publicSubmitLimiter } from "../middlewares/rate-limiters";

const router: IRouter = Router();

async function ensureContactTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_contact_requests (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'general',
      app TEXT NOT NULL DEFAULT 'unknown',
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      role TEXT,
      message TEXT,
      metadata JSONB,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_contact_requests_app ON platform_contact_requests(app);
    CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON platform_contact_requests(status);
    CREATE INDEX IF NOT EXISTS idx_contact_requests_created ON platform_contact_requests(created_at DESC);
  `);
}

ensureContactTable().catch((err) => {
  logger.warn({ err }, "Failed to ensure contact_requests table");
});

router.post("/contact/submit", publicSubmitLimiter, validateBody(contactSubmitSchema), async (req: Request, res: Response) => {
  try {
    const { type, app, name, email, company, role, message, metadata } = req.body as z.infer<typeof contactSubmitSchema>;

    const sanitized = {
      type: type ?? "general",
      app: app ?? "unknown",
      name,
      email,
      company: company ?? null,
      role: role ?? null,
      message: message ?? null,
      metadata: metadata ?? null,
    };

    const result = await pool.query(
      `INSERT INTO platform_contact_requests
        (type, app, name, email, company, role, message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [
        sanitized.type,
        sanitized.app,
        sanitized.name,
        sanitized.email,
        sanitized.company,
        sanitized.role,
        sanitized.message,
        sanitized.metadata ? JSON.stringify(sanitized.metadata) : null,
      ],
    );

    const row = result.rows[0];

    logger.info(
      { id: row.id, type: sanitized.type, app: sanitized.app, email: sanitized.email },
      "Contact request submitted",
    );

    sendSuccess(res, {
      id: row.id,
      submittedAt: row.created_at,
      message: "Your request has been received. We will be in touch within 1 business day.",
    }, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to submit contact request");
  }
});

const contactListQuerySchema = z.object({
  app: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get("/contact/requests", authMiddleware, validateQuery(contactListQuerySchema), async (req: Request, res: Response) => {
  try {
    const { app, limit, offset } = req.query as unknown as z.infer<typeof contactListQuerySchema>;

    if (app) {
      const result = await pool.query(
        `SELECT * FROM platform_contact_requests WHERE app = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
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
        `SELECT * FROM platform_contact_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
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
    handleRouteError(res, err, "Failed to list contact requests");
  }
});

export default router;
