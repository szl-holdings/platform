import type { IRouter } from "express";
import { db } from "@szl-holdings/db";
import { contactSubmissionsTable, leadStatusTable, supportKnowledgeArticlesTable } from "@szl-holdings/db";
import { eq, desc, sql, ilike, or, and } from "drizzle-orm";
import { z } from "zod";
import { validateBody } from "../../lib/validation.js";
import { sendError, sendNotFound, sendBadRequest } from "../../lib/api-response.js";
import { sendEmail, buildTicketStatusEmail } from "../../lib/email.js";
import { logger } from "../../lib/logger.js";

const SUPPORT_NOTIFICATIONS_ENABLED = process.env.SUPPORT_EMAIL_NOTIFICATIONS !== "false";

const updateStatusSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "closed", "lost"]).optional(),
  ownerUserId: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
  notify: z.boolean().optional(),
});

const kbArticleSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  title: z.string().min(1).max(300),
  category: z.string().min(1).max(100),
  summary: z.string().min(1).max(1000),
  body: z.string().min(1).max(50000),
  tags: z.array(z.string().max(50)).max(20).default([]),
  isPublished: z.boolean().default(true),
});

const kbArticleUpdateSchema = kbArticleSchema.partial();

const replySchema = z.object({
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(10000),
});

function buildSupportReplyEmail(
  name: string,
  body: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SZL Holdings</title>
<style>
  body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e7eb; }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .logo-mark { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #7c3aed); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
  .logo-mark span { color: white; font-weight: 700; font-size: 12px; }
  .logo-text { font-size: 15px; font-weight: 600; color: #111827; }
  h2 { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px; }
  p { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 16px; }
  .body-block { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 16px 0; font-size: 14px; color: #1f2937; line-height: 1.7; white-space: pre-wrap; }
  .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
  .footer { font-size: 11px; color: #9ca3af; line-height: 1.6; margin-top: 24px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="logo">
      <div class="logo-mark"><span>SZL</span></div>
      <span class="logo-text">SZL Holdings</span>
    </div>
    <h2>Re: Your Inquiry</h2>
    <p>Hello ${name},</p>
    <div class="body-block">${body.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</div>
    <div class="divider"></div>
    <div class="footer">
      <p>SZL Holdings · Washington, D.C. · London · Singapore</p>
      <p>This is a reply to your inquiry. You can respond directly to this email.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

function buildCsvRow(cells: string[]): string {
  return cells.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",");
}

export function register(router: IRouter): void {
  router.get("/admin/support-queue", async (req, res) => {
    try {
      const includeResolved = req.query.includeResolved === "true";
      const format = req.query.format as string | undefined;
      const search = req.query.search as string | undefined;
      const statusFilter = req.query.status as string | undefined;
      const limitParam = parseInt(req.query.limit as string ?? "100", 10);
      const limit = format === "csv" ? 5000 : Math.min(isNaN(limitParam) ? 100 : limitParam, 500);

      const conditions = [];
      if (!includeResolved) conditions.push(eq(contactSubmissionsTable.status, "open"));
      if (search) {
        conditions.push(
          or(
            ilike(contactSubmissionsTable.fullName, `%${search}%`),
            ilike(contactSubmissionsTable.email, `%${search}%`),
            ilike(contactSubmissionsTable.formKey, `%${search}%`),
          )!
        );
      }
      if (statusFilter && statusFilter !== "all") {
        conditions.push(eq(leadStatusTable.status, statusFilter as "new" | "contacted" | "qualified" | "closed" | "lost"));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: contactSubmissionsTable.id,
          formKey: contactSubmissionsTable.formKey,
          fullName: contactSubmissionsTable.fullName,
          email: contactSubmissionsTable.email,
          company: contactSubmissionsTable.company,
          message: contactSubmissionsTable.message,
          preferredTimeline: contactSubmissionsTable.preferredTimeline,
          submissionStatus: contactSubmissionsTable.status,
          resolvedAt: contactSubmissionsTable.resolvedAt,
          createdAt: contactSubmissionsTable.createdAt,
          leadStatusId: leadStatusTable.id,
          status: leadStatusTable.status,
          notes: leadStatusTable.notes,
          ownerUserId: leadStatusTable.ownerUserId,
        })
        .from(contactSubmissionsTable)
        .leftJoin(leadStatusTable, eq(leadStatusTable.contactSubmissionId, contactSubmissionsTable.id))
        .where(whereClause)
        .orderBy(desc(contactSubmissionsTable.createdAt))
        .limit(limit);

      const tickets = rows.map((r) => ({
        id: r.id,
        formKey: r.formKey,
        fullName: r.fullName,
        email: r.email,
        company: r.company,
        message: r.message,
        preferredTimeline: r.preferredTimeline,
        submissionStatus: r.submissionStatus,
        resolvedAt: r.resolvedAt,
        createdAt: r.createdAt,
        leadStatusId: r.leadStatusId,
        status: r.status ?? "new",
        notes: r.notes,
        ownerUserId: r.ownerUserId,
      }));

      if (format === "csv") {
        const header = buildCsvRow(["ID", "Name", "Email", "Form", "Company", "Status", "Submission Status", "Message", "Notes", "Owner User ID", "Submitted At", "Resolved At"]);
        const body = tickets.map((t) =>
          buildCsvRow([
            String(t.id),
            t.fullName,
            t.email,
            t.formKey,
            t.company ?? "",
            t.status,
            t.submissionStatus ?? "",
            (t.message ?? "").replace(/\r?\n/g, " "),
            (t.notes ?? "").replace(/\r?\n/g, " "),
            t.ownerUserId != null ? String(t.ownerUserId) : "",
            t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
            t.resolvedAt instanceof Date ? t.resolvedAt.toISOString() : (t.resolvedAt ?? ""),
          ])
        );
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="support-queue.csv"');
        res.send([header, ...body].join("\r\n"));
        return;
      }

      const [{ total }, [{ openTotal }]] = await Promise.all([
        db.select({ total: sql<number>`count(*)::int` }).from(contactSubmissionsTable).then(r => r[0]),
        db.select({ openTotal: sql<number>`count(*)::int` }).from(contactSubmissionsTable).where(eq(contactSubmissionsTable.status, "open")),
      ]);

      res.json({ tickets, total, openTotal });
    } catch (err) {
      logger.error({ err }, "[admin/support-queue] GET failed");
      sendError(res, "Failed to fetch support queue", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/support-queue/:id/status", validateBody(updateStatusSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid ticket ID"); return; }

      const [submission] = await db
        .select()
        .from(contactSubmissionsTable)
        .where(eq(contactSubmissionsTable.id, id));

      if (!submission) { sendNotFound(res, "Ticket"); return; }

      const { status, ownerUserId, notes, notify } = req.body as {
        status?: string;
        ownerUserId?: number;
        notes?: string;
        notify?: boolean;
      };

      const [existingLead] = await db
        .select()
        .from(leadStatusTable)
        .where(eq(leadStatusTable.contactSubmissionId, id));

      const previousStatus = existingLead?.status;

      let leadRow;
      if (existingLead) {
        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (status !== undefined) updateData.status = status;
        if (ownerUserId !== undefined) updateData.ownerUserId = ownerUserId;
        if (notes !== undefined) updateData.notes = notes;
        [leadRow] = await db
          .update(leadStatusTable)
          .set(updateData)
          .where(eq(leadStatusTable.id, existingLead.id))
          .returning();
      } else {
        [leadRow] = await db
          .insert(leadStatusTable)
          .values({
            contactSubmissionId: id,
            status: (status as "new" | "contacted" | "qualified" | "closed" | "lost") ?? "new",
            ownerUserId: ownerUserId ?? null,
            notes: notes ?? null,
          })
          .returning();
      }

      const shouldNotify = notify !== undefined ? notify : SUPPORT_NOTIFICATIONS_ENABLED;
      const statusChanged = status !== undefined && status !== previousStatus;
      const notesAdded = notes !== undefined && notes !== (existingLead?.notes ?? null);

      if (shouldNotify && (statusChanged || notesAdded) && leadRow) {
        const emailPayload = buildTicketStatusEmail({
          name: submission.fullName,
          previousStatus: previousStatus ?? undefined,
          newStatus: leadRow.status,
          notes: notesAdded ? notes : null,
          ticketId: id,
        });

        sendEmail({
          to: submission.email,
          subject: emailPayload.subject,
          html: emailPayload.html,
          text: emailPayload.text,
          replyTo: "inquiries@szlholdings.com",
        }).then((result) => {
          if (result.success) {
            logger.info({ id, provider: result.provider }, "[admin/support-queue] Status notification email sent");
          } else {
            logger.warn({ id, error: result.error }, "[admin/support-queue] Status notification email failed");
          }
        }).catch((err) => {
          logger.error({ err, id }, "[admin/support-queue] Status notification email threw unexpectedly");
        });
      }

      res.json({ success: true, leadStatus: leadRow, notificationQueued: shouldNotify && (statusChanged || notesAdded) });
    } catch (err) {
      logger.error({ err }, "[admin/support-queue] POST status failed");
      sendError(res, "Failed to update ticket status", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/support-queue/:id/resolve", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid ticket ID"); return; }

      const [updated] = await db
        .update(contactSubmissionsTable)
        .set({ status: "resolved", resolvedAt: new Date() })
        .where(eq(contactSubmissionsTable.id, id))
        .returning();

      if (!updated) { sendNotFound(res, "Ticket"); return; }

      res.json({ success: true, ticket: updated });
    } catch (err) {
      logger.error({ err }, "[admin/support-queue] POST resolve failed");
      sendError(res, "Failed to resolve ticket", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/support-queue/:id/reopen", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid ticket ID"); return; }

      const [updated] = await db
        .update(contactSubmissionsTable)
        .set({ status: "open", resolvedAt: null })
        .where(eq(contactSubmissionsTable.id, id))
        .returning();

      if (!updated) { sendNotFound(res, "Ticket"); return; }

      res.json({ success: true, ticket: updated });
    } catch (err) {
      logger.error({ err }, "[admin/support-queue] POST reopen failed");
      sendError(res, "Failed to reopen ticket", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/support-queue/:id/reply", validateBody(replySchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid ticket ID"); return; }

      const [submission] = await db
        .select()
        .from(contactSubmissionsTable)
        .where(eq(contactSubmissionsTable.id, id));

      if (!submission) { sendNotFound(res, "Ticket"); return; }

      const { subject, body } = req.body as { subject: string; body: string };

      const emailResult = await sendEmail({
        to: submission.email,
        subject,
        html: buildSupportReplyEmail(submission.fullName, body),
        text: body,
        replyTo: "inquiries@szlholdings.com",
      });

      if (!emailResult.success) {
        logger.warn({ id, error: emailResult.error }, "[admin/support-queue] Reply email failed");
        res.json({ success: false, sent: false, error: emailResult.error });
        return;
      }

      res.json({ success: true, sent: true, messageId: emailResult.messageId, provider: emailResult.provider });
    } catch (err) {
      logger.error({ err }, "[admin/support-queue] POST reply failed");
      sendError(res, "Failed to send reply", 500, "INTERNAL_ERROR");
    }
  });

  router.get("/admin/kb-articles", async (_req, res) => {
    try {
      const articles = await db
        .select()
        .from(supportKnowledgeArticlesTable)
        .orderBy(desc(supportKnowledgeArticlesTable.updatedAt));
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(supportKnowledgeArticlesTable);
      res.json({ articles, total });
    } catch (err) {
      logger.error({ err }, "[admin/kb-articles] GET failed");
      sendError(res, "Failed to fetch KB articles", 500, "INTERNAL_ERROR");
    }
  });

  router.post("/admin/kb-articles", validateBody(kbArticleSchema), async (req, res) => {
    try {
      const data = req.body as z.infer<typeof kbArticleSchema>;
      const [article] = await db
        .insert(supportKnowledgeArticlesTable)
        .values(data)
        .returning();
      logger.info({ slug: article.slug }, "[admin/kb-articles] Article created");
      res.status(201).json({ article });
    } catch (err: unknown) {
      const pgError = err as { code?: string };
      if (pgError?.code === "23505") {
        sendBadRequest(res, "An article with that slug already exists");
        return;
      }
      logger.error({ err }, "[admin/kb-articles] POST failed");
      sendError(res, "Failed to create KB article", 500, "INTERNAL_ERROR");
    }
  });

  router.patch("/admin/kb-articles/:id", validateBody(kbArticleUpdateSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid article ID"); return; }

      const data = req.body as z.infer<typeof kbArticleUpdateSchema>;
      if (Object.keys(data).length === 0) {
        sendBadRequest(res, "No fields to update");
        return;
      }

      const [article] = await db
        .update(supportKnowledgeArticlesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(supportKnowledgeArticlesTable.id, id))
        .returning();

      if (!article) { sendNotFound(res, "KB article"); return; }

      logger.info({ id, slug: article.slug }, "[admin/kb-articles] Article updated");
      res.json({ article });
    } catch (err: unknown) {
      const pgError = err as { code?: string };
      if (pgError?.code === "23505") {
        sendBadRequest(res, "An article with that slug already exists");
        return;
      }
      logger.error({ err }, "[admin/kb-articles] PATCH failed");
      sendError(res, "Failed to update KB article", 500, "INTERNAL_ERROR");
    }
  });

  router.delete("/admin/kb-articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid article ID"); return; }

      const [article] = await db
        .update(supportKnowledgeArticlesTable)
        .set({ isPublished: false, updatedAt: new Date() })
        .where(eq(supportKnowledgeArticlesTable.id, id))
        .returning();

      if (!article) { sendNotFound(res, "KB article"); return; }

      logger.info({ id, slug: article.slug }, "[admin/kb-articles] Article archived");
      res.json({ success: true, article });
    } catch (err) {
      logger.error({ err }, "[admin/kb-articles] DELETE failed");
      sendError(res, "Failed to archive KB article", 500, "INTERNAL_ERROR");
    }
  });
}
