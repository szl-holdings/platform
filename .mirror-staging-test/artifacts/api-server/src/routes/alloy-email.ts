import { Router, type IRouter, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { pool } from "@workspace/db";
import { services } from "@workspace/services";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_email_triage (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      sender_name TEXT,
      recipient_email TEXT,
      body_text TEXT,
      body_html TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      category TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'pending',
      ai_summary TEXT,
      ai_intent TEXT,
      ai_priority_score INTEGER DEFAULT 50,
      auto_draft TEXT,
      draft_approved BOOLEAN DEFAULT FALSE,
      routed_to_workflow TEXT,
      routed_at TIMESTAMP,
      labels JSONB DEFAULT '[]',
      alloy_signal_id TEXT,
      metadata JSONB DEFAULT '{}',
      received_at TIMESTAMP NOT NULL DEFAULT NOW(),
      processed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS alloy_email_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      conditions JSONB NOT NULL DEFAULT '[]',
      action TEXT NOT NULL,
      action_params JSONB DEFAULT '{}',
      priority INTEGER NOT NULL DEFAULT 50,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

ensureTables().catch((err) => logger.warn({ err }, "alloy-email: table init failed"));

const EMAIL_INGEST_SECRET = process.env.ALLOY_EMAIL_INGEST_SECRET;

function verifyEmailSignature(req: Request): boolean {
  const signature = req.headers["x-alloy-email-signature"] as string | undefined;
  if (!signature) return false;
  if (!EMAIL_INGEST_SECRET) {
    logger.warn("alloy-email: ALLOY_EMAIL_INGEST_SECRET not configured — rejecting inbound email");
    return false;
  }
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody?.toString("utf-8") ?? JSON.stringify(req.body);
  const computed = `sha256=${createHmac("sha256", EMAIL_INGEST_SECRET).update(rawBody).digest("hex")}`;
  const computedBuf = Buffer.from(computed);
  const sigBuf = Buffer.from(signature);
  if (computedBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(computedBuf, sigBuf);
}

function scoreEmailPriority(subject: string, body: string, sender: string): number {
  const combined = `${subject} ${body} ${sender}`.toLowerCase();
  let score = 50;
  if (combined.includes("urgent") || combined.includes("asap") || combined.includes("critical")) score += 30;
  if (combined.includes("ceo") || combined.includes("executive") || combined.includes("investor")) score += 20;
  if (combined.includes("payment") || combined.includes("invoice") || combined.includes("contract")) score += 15;
  if (combined.includes("partnership") || combined.includes("acquisition") || combined.includes("strategic")) score += 15;
  if (combined.includes("support") || combined.includes("help") || combined.includes("issue")) score += 10;
  if (combined.includes("unsubscribe") || combined.includes("newsletter") || combined.includes("noreply")) score -= 30;
  if (combined.includes("spam") || combined.includes("click here") || combined.includes("buy now")) score -= 40;
  return Math.min(100, Math.max(0, score));
}

function detectCategory(subject: string, body: string): string {
  const combined = `${subject} ${body}`.toLowerCase();
  if (combined.includes("partnership") || combined.includes("collaboration") || combined.includes("joint venture")) return "partnership";
  if (combined.includes("support") || combined.includes("issue") || combined.includes("problem") || combined.includes("bug")) return "support";
  if (combined.includes("invoice") || combined.includes("billing") || combined.includes("payment")) return "billing";
  if (combined.includes("meeting") || combined.includes("schedule") || combined.includes("call") || combined.includes("demo")) return "meeting_request";
  if (combined.includes("follow up") || combined.includes("following up") || combined.includes("checking in")) return "follow_up";
  if (combined.includes("information") || combined.includes("question") || combined.includes("inquiry")) return "info_request";
  return "general";
}

function priorityFromScore(score: number): string {
  if (score >= 80) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

router.post("/alloy/email/ingest", async (req: Request, res: Response) => {
  try {
    if (!verifyEmailSignature(req)) {
      res.status(401).json({ error: "Missing or invalid x-alloy-email-signature" });
      return;
    }

    const { subject, senderEmail, senderName, recipientEmail, bodyText, bodyHtml, metadata } = req.body as {
      subject: string;
      senderEmail: string;
      senderName?: string;
      recipientEmail?: string;
      bodyText?: string;
      bodyHtml?: string;
      metadata?: Record<string, unknown>;
    };

    if (!subject || !senderEmail) {
      sendBadRequest(res, "subject and senderEmail are required");
      return;
    }

    const priorityScore = scoreEmailPriority(subject, bodyText ?? "", senderEmail);
    const category = detectCategory(subject, bodyText ?? "");
    const priority = priorityFromScore(priorityScore);

    let aiSummary: string | null = null;
    let aiIntent: string | null = null;

    try {
      const aiResult = await services.ai.chatCompletion([
        { role: "system", content: "You are an email triage assistant. Analyze this email and respond in JSON with: { summary: string (1 sentence), intent: string (what the sender wants), requires_response: boolean, suggested_action: string }. Be concise." },
        { role: "user", content: `From: ${senderName ?? senderEmail} <${senderEmail}>\nSubject: ${subject}\n\n${bodyText ?? bodyHtml ?? ""}` },
      ], { maxTokens: 300 });

      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { summary?: string; intent?: string };
        aiSummary = parsed.summary ?? null;
        aiIntent = parsed.intent ?? null;
      }
    } catch { }

    const id = `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let alloySignalId: string | null = null;
    if (priorityScore >= 65) {
      try {
        const sigResult = await pool.query(
          `INSERT INTO alloy_signals (source, source_type, title, summary, domain, severity, status, metadata, created_at, updated_at)
           VALUES ('email_ingest', 'external', $1, $2, 'email', $3, 'raw', $4, NOW(), NOW()) RETURNING id`,
          [
            `Email: ${subject}`,
            aiSummary ?? `From ${senderEmail}: ${subject}`,
            priority === "critical" ? "critical" : priority === "high" ? "high" : "medium",
            JSON.stringify({ emailId: id, senderEmail, category, priorityScore }),
          ],
        );
        alloySignalId = String(sigResult.rows[0]?.id ?? "");
      } catch (sigErr) {
        logger.warn({ err: sigErr }, "alloy-email: failed to create signal for high-priority email");
      }
    }

    await pool.query(
      `INSERT INTO alloy_email_triage (id, subject, sender_email, sender_name, recipient_email, body_text, body_html, priority, category, ai_summary, ai_intent, ai_priority_score, alloy_signal_id, status, metadata, received_at, processed_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending',$14,NOW(),NOW(),NOW(),NOW())`,
      [id, subject, senderEmail, senderName ?? null, recipientEmail ?? null, bodyText ?? null, bodyHtml ?? null,
       priority, category, aiSummary, aiIntent, priorityScore, alloySignalId, JSON.stringify(metadata ?? {})],
    );

    sendCreated(res, { id, priority, category, priorityScore, aiSummary, aiIntent, alloySignalId });
  } catch (err) {
    handleRouteError(res, err, "Failed to ingest email");
  }
});

router.get("/alloy/email/triage", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { status = "pending", priority, category, limit: limitStr = "50" } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(limitStr, 10), 200);

    let q = `SELECT * FROM alloy_email_triage WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;
    if (status !== "all") { q += ` AND status = $${idx++}`; params.push(status); }
    if (priority) { q += ` AND priority = $${idx++}`; params.push(priority); }
    if (category) { q += ` AND category = $${idx++}`; params.push(category); }
    q += ` ORDER BY ai_priority_score DESC, created_at DESC LIMIT $${idx}`;
    params.push(limit);

    const result = await pool.query(q, params);

    const counts = await pool.query(
      `SELECT priority, COUNT(*) as count FROM alloy_email_triage WHERE status = 'pending' GROUP BY priority`,
    );
    const priorityCounts: Record<string, number> = {};
    for (const row of counts.rows) priorityCounts[row.priority] = parseInt(row.count);

    sendSuccess(res, { emails: result.rows, total: result.rowCount, priorityCounts });
  } catch (err) {
    handleRouteError(res, err, "Failed to list email triage");
  }
});

router.get("/alloy/email/triage/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM alloy_email_triage WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) { sendError(res, "Email not found", 404); return; }
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    handleRouteError(res, err, "Failed to get email");
  }
});

router.post("/alloy/email/triage/:id/draft", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const emailResult = await pool.query(`SELECT * FROM alloy_email_triage WHERE id = $1`, [req.params.id]);
    if (!emailResult.rows[0]) { sendError(res, "Email not found", 404); return; }

    const email = emailResult.rows[0];
    const { tone = "professional", includeContext } = req.body as { tone?: string; includeContext?: string };

    const draft = await services.ai.chatCompletion([
      {
        role: "system",
        content: `You are an executive assistant drafting an email response. Write a ${tone} reply. Sign as "The Team". Keep it concise (150-250 words). Do not include Subject line, just the body.`,
      },
      {
        role: "user",
        content: `Draft a response to this email:\n\nFrom: ${email.sender_name ?? email.sender_email}\nSubject: ${email.subject}\n\nOriginal message: ${email.body_text ?? "(no text body)"}\n\nContext: ${email.ai_summary ?? "N/A"}\n${includeContext ? `\nAdditional context: ${includeContext}` : ""}`,
      },
    ], { maxTokens: 400 });

    await pool.query(`UPDATE alloy_email_triage SET auto_draft = $1, updated_at = NOW() WHERE id = $2`, [draft.content, req.params.id]);
    sendSuccess(res, { id: req.params.id, draft: draft.content, tone });
  } catch (err) {
    handleRouteError(res, err, "Failed to draft email response");
  }
});

router.post("/alloy/email/triage/:id/route", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const emailResult = await pool.query(`SELECT * FROM alloy_email_triage WHERE id = $1`, [req.params.id]);
    if (!emailResult.rows[0]) { sendError(res, "Email not found", 404); return; }

    const { targetWorkflow, notes } = req.body as { targetWorkflow: string; notes?: string };
    if (!targetWorkflow) { sendBadRequest(res, "targetWorkflow is required"); return; }

    await pool.query(
      `UPDATE alloy_email_triage SET status='routed', routed_to_workflow=$1, routed_at=NOW(), updated_at=NOW() WHERE id=$2`,
      [targetWorkflow, req.params.id],
    );

    sendSuccess(res, { id: req.params.id, routedTo: targetWorkflow, status: "routed", routedAt: new Date().toISOString(), notes });
  } catch (err) {
    handleRouteError(res, err, "Failed to route email to workflow");
  }
});

router.patch("/alloy/email/triage/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { status, priority, labels } = req.body as { status?: string; priority?: string; labels?: string[] };
    const updates: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];
    let idx = 1;
    if (status) { updates.push(`status = $${idx++}`); params.push(status); }
    if (priority) { updates.push(`priority = $${idx++}`); params.push(priority); }
    if (labels) { updates.push(`labels = $${idx++}`); params.push(JSON.stringify(labels)); }
    params.push(req.params.id);
    await pool.query(`UPDATE alloy_email_triage SET ${updates.join(", ")} WHERE id = $${idx}`, params);
    sendSuccess(res, { id: req.params.id, updated: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to update email");
  }
});

router.get("/alloy/email/rules", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM alloy_email_rules ORDER BY priority DESC`);
    sendSuccess(res, { rules: result.rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to list email rules");
  }
});

router.post("/alloy/email/rules", authMiddleware(), requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { name, description, conditions, action, actionParams, priority = 50 } = req.body as {
      name: string;
      description?: string;
      conditions: Array<{ field: string; operator: string; value: string }>;
      action: string;
      actionParams?: Record<string, unknown>;
      priority?: number;
    };
    if (!name || !conditions || !action) {
      sendBadRequest(res, "name, conditions, and action are required");
      return;
    }
    const id = `erule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await pool.query(
      `INSERT INTO alloy_email_rules (id, name, description, conditions, action, action_params, priority, is_enabled, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,NOW(),NOW())`,
      [id, name, description ?? null, JSON.stringify(conditions), action, JSON.stringify(actionParams ?? {}), priority],
    );
    sendCreated(res, { id, name, action, priority });
  } catch (err) {
    handleRouteError(res, err, "Failed to create email rule");
  }
});

router.get("/alloy/email/stats", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const [totalResult, byStatus, byCategory] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, AVG(ai_priority_score) as avg_score FROM alloy_email_triage`),
      pool.query(`SELECT status, COUNT(*) as count FROM alloy_email_triage GROUP BY status`),
      pool.query(`SELECT category, COUNT(*) as count FROM alloy_email_triage GROUP BY category ORDER BY count DESC LIMIT 5`),
    ]);
    sendSuccess(res, {
      total: parseInt(totalResult.rows[0]?.total ?? 0),
      avgPriorityScore: Math.round(parseFloat(totalResult.rows[0]?.avg_score ?? 0)),
      byStatus: Object.fromEntries(byStatus.rows.map(r => [r.status, parseInt(r.count)])),
      byCategory: Object.fromEntries(byCategory.rows.map(r => [r.category, parseInt(r.count)])),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get email stats");
  }
});

export default router;
