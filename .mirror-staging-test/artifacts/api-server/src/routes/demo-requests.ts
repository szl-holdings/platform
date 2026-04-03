import { Router, type IRouter } from "express";
import { z } from "zod";
import { db, holdingsInquiriesTable } from "@workspace/db";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";
import { sendEmail, buildInquiryAckEmail, buildLeadNotificationEmail, INTERNAL_EMAIL } from "../lib/email";
import { logger } from "../lib/logger";
import { desc, sql } from "drizzle-orm";

const router: IRouter = Router();

const demoRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Valid email is required"),
  company: z.string().min(1, "Company is required").max(200),
  fleetSize: z.string().optional(),
  message: z.string().optional(),
  product: z.string().optional().default("vessels"),
});

router.post("/demo-requests", async (req, res) => {
  const parsed = demoRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  const { name, email, company, fleetSize, message, product } = parsed.data;
  const subject = `Demo request — ${product ?? "Vessels"} — ${company}`;

  try {
    const [row] = await db.insert(holdingsInquiriesTable).values({
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      subject,
      message: [
        fleetSize ? `Fleet size: ${fleetSize}` : null,
        message || null,
      ].filter(Boolean).join("\n\n") || "Demo request (no additional context provided)",
    }).returning();

    sendSuccess(res, { id: row.id, submitted: true }, 201);

    setImmediate(async () => {
      try {
        await sendEmail({
          to: email.trim(),
          subject: `We received your demo request — ${product === "vessels" ? "Vessels" : "SZL Holdings"}`,
          html: buildInquiryAckEmail(name.trim(), subject),
        });
        await sendEmail({
          to: INTERNAL_EMAIL,
          subject: `New Demo Request: ${company.trim()} (${product ?? "Vessels"}) — ${name.trim()}`,
          html: buildLeadNotificationEmail({
            name: name.trim(),
            email: email.trim(),
            company: company.trim(),
            subject,
            message: [
              `Product: ${product ?? "Vessels"}`,
              fleetSize ? `Fleet size: ${fleetSize}` : null,
              message ? `Context: ${message}` : null,
            ].filter(Boolean).join("\n"),
          }),
          replyTo: email.trim(),
        });
      } catch (emailErr) {
        logger.warn({ err: emailErr }, "[demo-requests] Email send failed (non-blocking)");
      }
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to create demo request");
  }
});

router.get("/demo-requests", authMiddleware(), async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(String(req.query.limit ?? "50"), 10) || 50);
    const rows = await db.select().from(holdingsInquiriesTable)
      .orderBy(desc(holdingsInquiriesTable.createdAt))
      .limit(limit);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(holdingsInquiriesTable);
    sendSuccess(res, rows, 200, { total: count, limit });
  } catch (err) {
    handleRouteError(res, err, "Failed to list demo requests");
  }
});

export default router;
