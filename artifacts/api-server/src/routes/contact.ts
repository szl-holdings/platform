import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool } from "@workspace/db";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";

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

router.post("/contact/submit", async (req: Request, res: Response) => {
  try {
    const {
      type = "general",
      app = "unknown",
      name,
      email,
      company,
      role,
      message,
      metadata,
    } = req.body as {
      type?: string;
      app?: string;
      name: string;
      email: string;
      company?: string;
      role?: string;
      message?: string;
      metadata?: Record<string, unknown>;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      sendBadRequest(res, "Name is required");
      return;
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      sendBadRequest(res, "A valid email address is required");
      return;
    }

    const sanitized = {
      type: String(type).slice(0, 64),
      app: String(app).slice(0, 64),
      name: String(name).trim().slice(0, 200),
      email: String(email).trim().toLowerCase().slice(0, 320),
      company: company ? String(company).trim().slice(0, 200) : null,
      role: role ? String(role).trim().slice(0, 200) : null,
      message: message ? String(message).trim().slice(0, 5000) : null,
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

router.get("/contact/requests", async (req: Request, res: Response) => {
  try {
    const app = req.query.app as string | undefined;
    const limit = Math.min(100, parseInt(String(req.query.limit ?? "50"), 10) || 50);
    const offset = Math.max(0, parseInt(String(req.query.offset ?? "0"), 10) || 0);

    const params: unknown[] = [limit, offset];
    let whereClause = "";
    if (app) {
      params.push(app);
      whereClause = `WHERE app = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT * FROM platform_contact_requests ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params,
    );

    const countResult = await pool.query(
      `SELECT COUNT(*)::int as total FROM platform_contact_requests ${whereClause}`,
      app ? [app] : [],
    );

    sendSuccess(res, result.rows, 200, {
      total: countResult.rows[0]?.total ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to list contact requests");
  }
});

export default router;
