import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { db, dosEmailCampaignsTable, dosDripSequencesTable, dosDripStepsTable, dosDripEnrollmentsTable, dosEmailPreferencesTable, dosCookieConsentsTable, dosAudienceSegmentsTable, dosLeadsTable } from "@szl-holdings/db";
import { eq, desc, and, gte, lte, inArray, count, sql, like } from "drizzle-orm";
import { authMiddleware, isElevatedUser } from "../middlewares/auth";
import { sendEmail } from "../lib/email";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();
const requireAuth = authMiddleware({ required: true });
const optionalAuth = authMiddleware({ required: false });

// Elevated access guard: requires admin/super_admin/exec/ops/compliance role
function requireElevated(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!isElevatedUser(req.user)) {
    res.status(403).json({ error: "Admin or elevated role required for this operation" });
    return;
  }
  next();
}

// ─── Audience Segments ────────────────────────────────────────────────────────

router.get("/segments", requireAuth, async (_req: Request, res: Response) => {
  const segments = await db.select().from(dosAudienceSegmentsTable).orderBy(desc(dosAudienceSegmentsTable.createdAt));
  return res.json(segments);
});

router.post("/segments", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const { name, description, filters } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });

  let memberCount = 0;
  try {
    memberCount = await computeSegmentCount(filters || {});
  } catch (err) {
    logger.warn({ err }, "Segment count computation failed — defaulting to 0");
  }

  const [segment] = await db.insert(dosAudienceSegmentsTable).values({
    name,
    description,
    filters: filters || {},
    memberCount,
  }).returning();
  return res.status(201).json(segment);
});

router.patch("/segments/:id", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  let memberCount: number | undefined;
  if (req.body.filters) {
    try {
      memberCount = await computeSegmentCount(req.body.filters);
    } catch (err) {
      logger.warn({ err }, "Segment count recomputation failed — keeping existing");
    }
  }
  const updateData: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
  if (memberCount !== undefined) updateData.memberCount = memberCount;

  const [seg] = await db.update(dosAudienceSegmentsTable).set(updateData).where(eq(dosAudienceSegmentsTable.id, id)).returning();
  if (!seg) return res.status(404).json({ error: "Segment not found" });
  return res.json(seg);
});

router.delete("/segments/:id", requireAuth, requireElevated, async (req: Request, res: Response) => {
  await db.delete(dosAudienceSegmentsTable).where(eq(dosAudienceSegmentsTable.id, Number(req.params.id)));
  return res.json({ success: true });
});

// ─── Email Campaigns ──────────────────────────────────────────────────────────

router.get("/email-campaigns", requireAuth, async (_req: Request, res: Response) => {
  const campaigns = await db.select().from(dosEmailCampaignsTable).orderBy(desc(dosEmailCampaignsTable.createdAt)).limit(100);
  return res.json(campaigns);
});

router.get("/email-campaigns/:id", requireAuth, async (req: Request, res: Response) => {
  const [c] = await db.select().from(dosEmailCampaignsTable).where(eq(dosEmailCampaignsTable.id, Number(req.params.id)));
  if (!c) return res.status(404).json({ error: "Campaign not found" });
  return res.json(c);
});

router.post("/email-campaigns", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const parsed = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).optional(),
    subjectLineA: z.string().min(1),
    subjectLineB: z.string().optional(),
    htmlBody: z.string().min(1),
    plainTextBody: z.string().optional(),
    fromName: z.string().optional(),
    fromEmail: z.string().email().optional(),
    segmentFilters: z.record(z.unknown()).optional(),
    scheduledAt: z.string().optional(),
    notes: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const data = parsed.data;
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-${Date.now()}`;

  const [campaign] = await db.insert(dosEmailCampaignsTable).values({
    name: data.name,
    slug,
    subjectLineA: data.subjectLineA,
    subjectLineB: data.subjectLineB,
    htmlBody: data.htmlBody,
    plainTextBody: data.plainTextBody,
    fromName: data.fromName || "SZL Holdings",
    fromEmail: data.fromEmail || "inquiries@szlholdings.com",
    segmentFilters: (data.segmentFilters || {}) as Record<string, unknown>,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    notes: data.notes,
  }).returning();
  return res.status(201).json(campaign);
});

router.patch("/email-campaigns/:id", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const [c] = await db.update(dosEmailCampaignsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosEmailCampaignsTable.id, Number(req.params.id))).returning();
  if (!c) return res.status(404).json({ error: "Campaign not found" });
  return res.json(c);
});

router.delete("/email-campaigns/:id", requireAuth, requireElevated, async (req: Request, res: Response) => {
  await db.delete(dosEmailCampaignsTable).where(eq(dosEmailCampaignsTable.id, Number(req.params.id)));
  return res.json({ success: true });
});

// Send campaign via SendGrid Marketing API (admin-only)
router.post("/email-campaigns/:id/send", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const [campaign] = await db.select().from(dosEmailCampaignsTable).where(eq(dosEmailCampaignsTable.id, Number(req.params.id)));
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  if (campaign.status === "sent") return res.status(400).json({ error: "Campaign already sent" });

  // Enforce scheduledAt: if in the future, mark as scheduled and return early
  if (campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date()) {
    const [scheduled] = await db.update(dosEmailCampaignsTable)
      .set({ status: "scheduled", updatedAt: new Date() })
      .where(eq(dosEmailCampaignsTable.id, campaign.id))
      .returning();
    return res.json({ success: true, scheduled: true, sendAt: campaign.scheduledAt, campaign: scheduled });
  }

  // Get leads matching segment filters
  const leads = await getSegmentLeads(campaign.segmentFilters as Record<string, unknown> || {});

  if (leads.length === 0) {
    return res.status(400).json({ error: "No leads match the segment filters" });
  }

  const sgApiKey = process.env.SENDGRID_API_KEY;

  // True A/B split: divide recipients in half — variant A gets first half, variant B gets second half
  // This allows comparative outcome tracking (open/click rates per variant via webhooks)
  const isAbTest = !!(campaign.subjectLineB);
  const midpoint = isAbTest ? Math.ceil(leads.length / 2) : leads.length;
  const groupA = leads.slice(0, midpoint);
  const groupB = isAbTest ? leads.slice(midpoint) : [];

  if (sgApiKey) {
    // Use SendGrid Marketing API — create two separate single-sends for true A/B comparison
    try {
      let sgIdA: string | undefined;
      let sgIdB: string | undefined;

      const resultA = await sendViaSendGridMarketing({ ...campaign, subjectLineA: campaign.subjectLineA }, groupA, sgApiKey);
      sgIdA = resultA.id;

      if (isAbTest && groupB.length > 0 && campaign.subjectLineB) {
        const resultB = await sendViaSendGridMarketing({ ...campaign, subjectLineA: campaign.subjectLineB }, groupB, sgApiKey);
        sgIdB = resultB.id;
      }

      const [updated] = await db.update(dosEmailCampaignsTable).set({
        status: "sent",
        sentAt: new Date(),
        recipientCount: leads.length,
        sendgridCampaignId: sgIdA,
        sendgridListId: sgIdB || null,
        updatedAt: new Date(),
      }).where(eq(dosEmailCampaignsTable.id, campaign.id)).returning();

      return res.json({
        success: true,
        campaign: updated,
        recipientCount: leads.length,
        abTest: isAbTest,
        variantARecipients: groupA.length,
        variantBRecipients: groupB.length,
        variantASendgridId: sgIdA,
        variantBSendgridId: sgIdB,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[email-campaigns] SendGrid Marketing API failed, falling back to individual sends:", message);
    }
  }

  // Fallback: send individually with true A/B split — group A gets subject A, group B gets subject B
  let sentCount = 0;
  for (const lead of groupA.slice(0, 50)) {
    try {
      await sendEmail({ to: lead.email, subject: campaign.subjectLineA, html: campaign.htmlBody, text: campaign.plainTextBody || "" });
      sentCount++;
    } catch {}
  }
  if (isAbTest && campaign.subjectLineB) {
    for (const lead of groupB.slice(0, 50)) {
      try {
        await sendEmail({ to: lead.email, subject: campaign.subjectLineB, html: campaign.htmlBody, text: campaign.plainTextBody || "" });
        sentCount++;
      } catch {}
    }
  }

  const [updated] = await db.update(dosEmailCampaignsTable).set({
    status: "sent",
    sentAt: new Date(),
    recipientCount: sentCount,
    updatedAt: new Date(),
  }).where(eq(dosEmailCampaignsTable.id, campaign.id)).returning();

  return res.json({
    success: true,
    campaign: updated,
    recipientCount: sentCount,
    abTest: isAbTest,
    variantARecipients: Math.min(groupA.length, 50),
    variantBRecipients: isAbTest ? Math.min(groupB.length, 50) : 0,
  });
});

// Process scheduled campaigns that are now due — called by a cron/job or admin
router.post("/email-campaigns/process-scheduled", requireAuth, requireElevated, async (_req: Request, res: Response) => {
  const now = new Date();
  const scheduled = await db.select().from(dosEmailCampaignsTable).where(
    and(
      eq(dosEmailCampaignsTable.status, "scheduled"),
      lte(dosEmailCampaignsTable.scheduledAt, now)
    )
  ).limit(20);

  let dispatched = 0;
  let errors = 0;

  for (const campaign of scheduled) {
    try {
      const leads = await getSegmentLeads(campaign.segmentFilters as Record<string, unknown> || {});
      if (leads.length === 0) {
        await db.update(dosEmailCampaignsTable).set({ status: "cancelled", updatedAt: now }).where(eq(dosEmailCampaignsTable.id, campaign.id));
        continue;
      }

      const isAbTest = !!(campaign.subjectLineB);
      const midpoint = isAbTest ? Math.ceil(leads.length / 2) : leads.length;
      const groupA = leads.slice(0, midpoint);
      const groupB = isAbTest ? leads.slice(midpoint) : [];

      const sgApiKey = process.env.SENDGRID_API_KEY;
      if (sgApiKey) {
        const resultA = await sendViaSendGridMarketing({ ...campaign, subjectLineA: campaign.subjectLineA }, groupA, sgApiKey);
        let sgIdB: string | undefined;
        if (isAbTest && groupB.length > 0 && campaign.subjectLineB) {
          const resultB = await sendViaSendGridMarketing({ ...campaign, subjectLineA: campaign.subjectLineB }, groupB, sgApiKey);
          sgIdB = resultB.id;
        }
        await db.update(dosEmailCampaignsTable).set({
          status: "sent",
          sentAt: now,
          recipientCount: leads.length,
          sendgridCampaignId: resultA.id,
          sendgridListId: sgIdB || null,
          updatedAt: now,
        }).where(eq(dosEmailCampaignsTable.id, campaign.id));
      } else {
        // SMTP fallback — limited to 50 per variant
        let sentCount = 0;
        for (const lead of groupA.slice(0, 50)) {
          try {
            await sendEmail({ to: lead.email, subject: campaign.subjectLineA, html: campaign.htmlBody, text: campaign.plainTextBody || "" });
            sentCount++;
          } catch (err) {
            logger.warn({ err, email: lead.email, campaignId: campaign.id }, "SMTP fallback send failed for variant A");
          }
        }
        if (isAbTest && campaign.subjectLineB) {
          for (const lead of groupB.slice(0, 50)) {
            try {
              await sendEmail({ to: lead.email, subject: campaign.subjectLineB, html: campaign.htmlBody, text: campaign.plainTextBody || "" });
              sentCount++;
            } catch (err) {
              logger.warn({ err, email: lead.email, campaignId: campaign.id }, "SMTP fallback send failed for variant B");
            }
          }
        }
        await db.update(dosEmailCampaignsTable).set({ status: "sent", sentAt: now, recipientCount: sentCount, updatedAt: now }).where(eq(dosEmailCampaignsTable.id, campaign.id));
      }
      dispatched++;
    } catch (err) {
      logger.error({ err, campaignId: campaign.id }, "Scheduled campaign dispatch failed");
      errors++;
    }
  }

  return res.json({ processed: scheduled.length, dispatched, errors });
});

// SendGrid webhook for tracking opens/clicks/bounces
// Secured with signature verification: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
// Fails CLOSED: if SENDGRID_WEBHOOK_SIGNATURE_KEY is not configured, all requests are rejected
router.post("/email-campaigns/webhooks/sendgrid", async (req: Request, res: Response) => {
  const webhookKey = process.env.SENDGRID_WEBHOOK_SIGNATURE_KEY;

  if (!webhookKey) {
    // Fail closed — never process unauthenticated webhook payloads
    return res.status(503).json({ error: "Webhook signature verification not configured" });
  }

  // Verify ECDSA/Ed25519 signature using SendGrid's public key
  try {
    const signature = req.headers["x-twilio-email-event-webhook-signature"] as string;
    const timestamp = req.headers["x-twilio-email-event-webhook-timestamp"] as string;

    if (!signature || !timestamp) {
      return res.status(403).json({ error: "Missing webhook signature headers" });
    }

    // Reconstruct the payload string: timestamp + raw body bytes (must use raw bytes, not re-serialized JSON)
    const rawBodyStr = (req as Request & { rawBody?: Buffer }).rawBody?.toString("utf-8") ?? JSON.stringify(req.body);
    const payload = timestamp + rawBodyStr;

    // Verify using Node crypto - SendGrid uses Ed25519
    // createPublicKey accepts a PEM string and Node infers the algorithm
    const pubKey = crypto.createPublicKey(webhookKey);
    const isValid = crypto.verify(
      null,
      Buffer.from(payload),
      pubKey,
      Buffer.from(signature, "base64")
    );

    if (!isValid) {
      return res.status(403).json({ error: "Invalid webhook signature" });
    }
  } catch {
    return res.status(403).json({ error: "Webhook signature verification failed" });
  }

  const events = req.body as Array<{
    event: string;
    campaign_id?: string;
    email?: string;
    timestamp?: number;
  }>;

  if (!Array.isArray(events)) return res.status(400).json({ error: "Expected array" });

  for (const evt of events) {
    const campaignId = evt.campaign_id;
    const email = evt.email;
    const evtTime = evt.timestamp ? new Date(evt.timestamp * 1000) : new Date();

    try {
      if (evt.event === "open") {
        if (campaignId) {
          // Match by sendgrid_campaign_id (variant A) OR sendgrid_list_id (variant B in A/B test)
          await db.execute(sql`UPDATE dos_email_campaigns SET open_count = open_count + 1 WHERE sendgrid_campaign_id = ${campaignId} OR sendgrid_list_id = ${campaignId}`);
        }
        // Update drip enrollment engagement state for conditional branching
        if (email) {
          await db.update(dosDripEnrollmentsTable)
            .set({ lastOpenedAt: evtTime })
            .where(and(eq(dosDripEnrollmentsTable.email, email), eq(dosDripEnrollmentsTable.status, "active")));
          // Update step open count — find the most recent step sent to this email in any active enrollment
          await db.execute(sql`
            UPDATE dos_drip_steps SET open_count = open_count + 1
            WHERE id IN (
              SELECT step_id FROM (
                SELECT ds.id as step_id
                FROM dos_drip_enrollments de
                JOIN dos_drip_steps ds ON ds.sequence_id = de.sequence_id AND ds.step_number = de.current_step
                WHERE de.email = ${email} AND de.status = 'active'
                LIMIT 1
              ) sub
            )
          `);
        }
      } else if (evt.event === "click") {
        if (campaignId) {
          await db.execute(sql`UPDATE dos_email_campaigns SET click_count = click_count + 1 WHERE sendgrid_campaign_id = ${campaignId} OR sendgrid_list_id = ${campaignId}`);
        }
        // Update drip enrollment engagement state for conditional branching
        if (email) {
          await db.update(dosDripEnrollmentsTable)
            .set({ lastClickedAt: evtTime })
            .where(and(eq(dosDripEnrollmentsTable.email, email), eq(dosDripEnrollmentsTable.status, "active")));
          await db.execute(sql`
            UPDATE dos_drip_steps SET click_count = click_count + 1
            WHERE id IN (
              SELECT step_id FROM (
                SELECT ds.id as step_id
                FROM dos_drip_enrollments de
                JOIN dos_drip_steps ds ON ds.sequence_id = de.sequence_id AND ds.step_number = de.current_step
                WHERE de.email = ${email} AND de.status = 'active'
                LIMIT 1
              ) sub
            )
          `);
        }
      } else if (evt.event === "bounce") {
        if (campaignId) await db.execute(sql`UPDATE dos_email_campaigns SET bounce_count = bounce_count + 1 WHERE sendgrid_campaign_id = ${campaignId} OR sendgrid_list_id = ${campaignId}`);
        if (email) {
          await db.update(dosDripEnrollmentsTable)
            .set({ status: "bounced" })
            .where(and(eq(dosDripEnrollmentsTable.email, email), eq(dosDripEnrollmentsTable.status, "active")));
        }
      } else if (evt.event === "unsubscribe" || evt.event === "group_unsubscribe") {
        if (campaignId) await db.execute(sql`UPDATE dos_email_campaigns SET unsubscribe_count = unsubscribe_count + 1 WHERE sendgrid_campaign_id = ${campaignId} OR sendgrid_list_id = ${campaignId}`);
        if (email) {
          await handleUnsubscribe(email);
          await db.update(dosDripEnrollmentsTable)
            .set({ status: "unsubscribed" })
            .where(and(eq(dosDripEnrollmentsTable.email, email), eq(dosDripEnrollmentsTable.status, "active")));
        }
      } else if (evt.event === "spamreport") {
        if (campaignId) await db.execute(sql`UPDATE dos_email_campaigns SET spam_count = spam_count + 1 WHERE sendgrid_campaign_id = ${campaignId} OR sendgrid_list_id = ${campaignId}`);
        if (email) {
          await handleUnsubscribe(email);
          await db.update(dosDripEnrollmentsTable)
            .set({ status: "unsubscribed" })
            .where(and(eq(dosDripEnrollmentsTable.email, email), eq(dosDripEnrollmentsTable.status, "active")));
        }
      }
    } catch {}
  }

  // Refresh rates after processing batch
  try {
    const uniqueCampaigns = [...new Set(events.map(e => e.campaign_id).filter(Boolean))];
    for (const id of uniqueCampaigns) {
      await db.execute(sql`
        UPDATE dos_email_campaigns
        SET
          open_rate = CASE WHEN recipient_count > 0 THEN ROUND((open_count::numeric / recipient_count) * 100, 2) ELSE 0 END,
          click_rate = CASE WHEN recipient_count > 0 THEN ROUND((click_count::numeric / recipient_count) * 100, 2) ELSE 0 END,
          updated_at = NOW()
        WHERE sendgrid_campaign_id = ${id} OR sendgrid_list_id = ${id}
      `);
    }
  } catch {}

  return res.json({ ok: true });
});

// ─── Drip Sequences ───────────────────────────────────────────────────────────

router.get("/drip-sequences", requireAuth, async (_req: Request, res: Response) => {
  const sequences = await db.select().from(dosDripSequencesTable).orderBy(desc(dosDripSequencesTable.createdAt));
  return res.json(sequences);
});

router.get("/drip-sequences/:id", requireAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [seq] = await db.select().from(dosDripSequencesTable).where(eq(dosDripSequencesTable.id, id));
  if (!seq) return res.status(404).json({ error: "Sequence not found" });
  const steps = await db.select().from(dosDripStepsTable).where(eq(dosDripStepsTable.sequenceId, id)).orderBy(dosDripStepsTable.stepNumber);
  return res.json({ ...seq, steps });
});

router.post("/drip-sequences", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const { steps, ...seqData } = req.body;
  const slug = seqData.slug || (seqData.name || "seq").toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-${Date.now()}`;
  const [seq] = await db.insert(dosDripSequencesTable).values({ ...seqData, slug }).returning();

  if (steps?.length) {
    await db.insert(dosDripStepsTable).values(
      steps.map((s: Record<string, unknown>, i: number) => ({ ...s, sequenceId: seq.id, stepNumber: i + 1 }))
    );
  }
  return res.status(201).json(seq);
});

router.patch("/drip-sequences/:id", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const { steps, ...seqData } = req.body;
  const [seq] = await db.update(dosDripSequencesTable).set({ ...seqData, updatedAt: new Date() }).where(eq(dosDripSequencesTable.id, Number(req.params.id))).returning();
  if (!seq) return res.status(404).json({ error: "Sequence not found" });

  if (steps) {
    await db.delete(dosDripStepsTable).where(eq(dosDripStepsTable.sequenceId, seq.id));
    if (steps.length > 0) {
      await db.insert(dosDripStepsTable).values(
        steps.map((s: Record<string, unknown>, i: number) => ({ ...s, sequenceId: seq.id, stepNumber: i + 1 }))
      );
    }
  }
  return res.json(seq);
});

router.delete("/drip-sequences/:id", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await db.delete(dosDripEnrollmentsTable).where(eq(dosDripEnrollmentsTable.sequenceId, id));
  await db.delete(dosDripStepsTable).where(eq(dosDripStepsTable.sequenceId, id));
  await db.delete(dosDripSequencesTable).where(eq(dosDripSequencesTable.id, id));
  return res.json({ success: true });
});

// Enroll a lead in a drip sequence (admin-only — enrollment is an intentional marketing action)
router.post("/drip-sequences/:id/enroll", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const seqId = Number(req.params.id);
  const { email, leadId } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  const [seq] = await db.select().from(dosDripSequencesTable).where(eq(dosDripSequencesTable.id, seqId));
  if (!seq) return res.status(404).json({ error: "Sequence not found" });

  const [firstStep] = await db.select().from(dosDripStepsTable).where(eq(dosDripStepsTable.sequenceId, seqId)).orderBy(dosDripStepsTable.stepNumber).limit(1);
  const nextDue = firstStep ? addDays(new Date(), firstStep.delayDays, firstStep.delayHours) : new Date();

  const [enrollment] = await db.insert(dosDripEnrollmentsTable).values({
    sequenceId: seqId,
    email,
    leadId: leadId || null,
    currentStep: 0,
    status: "active",
    nextEmailDue: nextDue,
  }).returning();

  await db.update(dosDripSequencesTable).set({ totalEnrolled: sql`total_enrolled + 1` }).where(eq(dosDripSequencesTable.id, seqId));

  return res.status(201).json(enrollment);
});

// Event-triggered drip enrollment — called when user performs a qualifying action
// Supported triggers: signup, demo_request, pricing_visit, contact_form
// Auth: requires internal agent token (ALLOY_INTERNAL_TOKEN) OR an elevated admin user
router.post("/drip-sequences/trigger", optionalAuth, async (req: Request, res: Response) => {
  const internalToken = process.env["ALLOY_INTERNAL_TOKEN"];
  const providedToken = req.headers["x-internal-token"] as string | undefined;
  const isInternalAgent = internalToken && providedToken === internalToken;
  const isElevated = req.user ? isElevatedUser(req.user) : false;

  if (!isInternalAgent && !isElevated) {
    return res.status(403).json({ error: "Forbidden: requires internal agent token or admin auth" });
  }

  const { event, email, leadId, metadata } = req.body;
  if (!event || !email) return res.status(400).json({ error: "event and email required" });

  // Find all active sequences whose trigger matches this event
  const sequences = await db.select().from(dosDripSequencesTable).where(
    and(
      eq(dosDripSequencesTable.triggerEvent, event),
      eq(dosDripSequencesTable.status, "active")
    )
  );

  const enrolled: number[] = [];
  const skipped: number[] = [];

  for (const seq of sequences) {
    // Skip if already enrolled and still active
    const [existing] = await db.select().from(dosDripEnrollmentsTable).where(
      and(
        eq(dosDripEnrollmentsTable.sequenceId, seq.id),
        eq(dosDripEnrollmentsTable.email, email),
        eq(dosDripEnrollmentsTable.status, "active")
      )
    );
    if (existing) { skipped.push(seq.id); continue; }

    // Check email opt-in preferences
    const [prefs] = await db.select().from(dosEmailPreferencesTable).where(eq(dosEmailPreferencesTable.email, email));
    if (prefs?.globalUnsubscribe || prefs?.marketingEmails === false) { skipped.push(seq.id); continue; }

    const [firstStep] = await db.select().from(dosDripStepsTable)
      .where(eq(dosDripStepsTable.sequenceId, seq.id))
      .orderBy(dosDripStepsTable.stepNumber)
      .limit(1);

    const nextDue = firstStep ? addDays(new Date(), firstStep.delayDays, firstStep.delayHours) : new Date();

    await db.insert(dosDripEnrollmentsTable).values({
      sequenceId: seq.id,
      email,
      leadId: leadId || null,
      currentStep: 0,
      status: "active",
      nextEmailDue: nextDue,
    });

    await db.update(dosDripSequencesTable)
      .set({ totalEnrolled: sql`total_enrolled + 1` })
      .where(eq(dosDripSequencesTable.id, seq.id));

    enrolled.push(seq.id);
  }

  return res.json({ ok: true, enrolled, skipped });
});

// Process drip sequences — send due emails (admin-only scheduled job)
router.post("/drip-sequences/process", requireAuth, requireElevated, async (_req: Request, res: Response) => {
  const now = new Date();
  const due = await db.select().from(dosDripEnrollmentsTable).where(
    and(
      eq(dosDripEnrollmentsTable.status, "active"),
      lte(dosDripEnrollmentsTable.nextEmailDue, now)
    )
  ).limit(50);

  let sent = 0;
  let errors = 0;

  for (const enrollment of due) {
    try {
      const nextStepNum = enrollment.currentStep + 1;
      const [step] = await db.select().from(dosDripStepsTable).where(
        and(
          eq(dosDripStepsTable.sequenceId, enrollment.sequenceId),
          eq(dosDripStepsTable.stepNumber, nextStepNum),
          eq(dosDripStepsTable.isActive, true)
        )
      );

      if (!step) {
        // Sequence complete
        await db.update(dosDripEnrollmentsTable).set({ status: "completed", completedAt: now }).where(eq(dosDripEnrollmentsTable.id, enrollment.id));
        await db.update(dosDripSequencesTable).set({ totalCompleted: sql`total_completed + 1` }).where(eq(dosDripSequencesTable.id, enrollment.sequenceId));
        continue;
      }

      // Check conditional logic
      const shouldSend = checkStepCondition(step.condition, enrollment);
      if (shouldSend) {
        // Check email preferences
        const [prefs] = await db.select().from(dosEmailPreferencesTable).where(eq(dosEmailPreferencesTable.email, enrollment.email));
        if (prefs?.globalUnsubscribe || prefs?.marketingEmails === false) {
          await db.update(dosDripEnrollmentsTable).set({ status: "unsubscribed" }).where(eq(dosDripEnrollmentsTable.id, enrollment.id));
          continue;
        }

        await sendEmail({ to: enrollment.email, subject: step.subjectLine, html: step.htmlBody, text: step.plainTextBody || "" });
        await db.execute(sql`UPDATE dos_drip_steps SET sent_count = sent_count + 1 WHERE id = ${step.id}`);
        sent++;
      }

      // Find next step
      const [nextStep] = await db.select().from(dosDripStepsTable).where(
        and(
          eq(dosDripStepsTable.sequenceId, enrollment.sequenceId),
          eq(dosDripStepsTable.stepNumber, nextStepNum + 1)
        )
      );

      const nextDue = nextStep ? addDays(now, nextStep.delayDays, nextStep.delayHours) : null;

      await db.update(dosDripEnrollmentsTable).set({
        currentStep: nextStepNum,
        lastEmailSentAt: now,
        nextEmailDue: nextDue || undefined,
        status: nextStep ? "active" : "completed",
        completedAt: nextStep ? undefined : now,
      }).where(eq(dosDripEnrollmentsTable.id, enrollment.id));

      if (!nextStep) {
        await db.update(dosDripSequencesTable).set({ totalCompleted: sql`total_completed + 1` }).where(eq(dosDripSequencesTable.id, enrollment.sequenceId));
      }
    } catch (err) {
      logger.error({ err, enrollmentId: enrollment.id, email: enrollment.email }, "Drip step dispatch failed");
      errors++;
    }
  }

  return res.json({ processed: due.length, sent, errors });
});

// Enrollments for a sequence
router.get("/drip-sequences/:id/enrollments", requireAuth, async (req: Request, res: Response) => {
  const enrollments = await db.select().from(dosDripEnrollmentsTable).where(eq(dosDripEnrollmentsTable.sequenceId, Number(req.params.id))).orderBy(desc(dosDripEnrollmentsTable.enrolledAt)).limit(100);
  return res.json(enrollments);
});

// ─── Email Preferences (Privacy) ──────────────────────────────────────────────

router.get("/preferences/:token", async (req: Request, res: Response) => {
  const [prefs] = await db.select().from(dosEmailPreferencesTable).where(eq(dosEmailPreferencesTable.unsubscribeToken, req.params.token));
  if (!prefs) return res.status(404).json({ error: "Preferences not found" });
  return res.json(prefs);
});

router.patch("/preferences/:token", async (req: Request, res: Response) => {
  const [prefs] = await db.select().from(dosEmailPreferencesTable).where(eq(dosEmailPreferencesTable.unsubscribeToken, req.params.token));
  if (!prefs) return res.status(404).json({ error: "Preferences not found" });

  const allowed = ["marketingEmails", "newsletterEmails", "productUpdates", "researchReports", "frequency", "topics", "globalUnsubscribe"];
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  const [updated] = await db.update(dosEmailPreferencesTable).set(updates).where(eq(dosEmailPreferencesTable.id, prefs.id)).returning();
  return res.json(updated);
});

// Unsubscribe endpoint (one-click)
router.get("/unsubscribe/:token", async (req: Request, res: Response) => {
  const [prefs] = await db.select().from(dosEmailPreferencesTable).where(eq(dosEmailPreferencesTable.unsubscribeToken, req.params.token));
  if (!prefs) return res.status(404).json({ error: "Link not found" });

  await db.update(dosEmailPreferencesTable).set({ globalUnsubscribe: true, updatedAt: new Date() }).where(eq(dosEmailPreferencesTable.id, prefs.id));
  return res.json({ success: true, message: "Successfully unsubscribed" });
});

// Preferences lookup/create — admin only (reading PII by email; unsubscribeToken is never returned)
router.post("/preferences", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  const existing = await db.select().from(dosEmailPreferencesTable).where(eq(dosEmailPreferencesTable.email, email));
  if (existing.length > 0) {
    const prefs = existing[0];
    // Strip unsubscribeToken from admin lookup response
    const { unsubscribeToken: _tok, ...safePrefs } = prefs;
    return res.json({ ...safePrefs, hasUnsubscribeToken: !!_tok });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const [prefs] = await db.insert(dosEmailPreferencesTable).values({
    email,
    unsubscribeToken: token,
    gdprConsentGivenAt: new Date(),
    gdprConsentVersion: "1.0",
  }).returning();
  const { unsubscribeToken: _tok2, ...safePrefs } = prefs;
  return res.status(201).json({ ...safePrefs, hasUnsubscribeToken: !!_tok2 });
});

// Data export request — requires elevated admin auth (GDPR compliance operation, PII access)
router.post("/privacy/data-export", requireAuth, requireElevated, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  const [lead] = await db.select().from(dosLeadsTable).where(eq(dosLeadsTable.email, email));
  const [prefs] = await db.select().from(dosEmailPreferencesTable).where(eq(dosEmailPreferencesTable.email, email));

  if (prefs) {
    await db.update(dosEmailPreferencesTable).set({ dataExportRequestedAt: new Date(), updatedAt: new Date() }).where(eq(dosEmailPreferencesTable.email, email));
  }

  // Return data export
  const exportData = {
    requestedAt: new Date().toISOString(),
    email,
    leadProfile: lead ? {
      name: lead.name,
      email: lead.email,
      company: lead.company,
      source: lead.source,
      medium: lead.medium,
      stage: lead.stage,
      createdAt: lead.createdAt,
    } : null,
    emailPreferences: prefs ? {
      globalUnsubscribe: prefs.globalUnsubscribe,
      marketingEmails: prefs.marketingEmails,
      newsletterEmails: prefs.newsletterEmails,
      frequency: prefs.frequency,
      gdprConsentGivenAt: prefs.gdprConsentGivenAt,
    } : null,
    dataRetentionPolicy: "Lead and analytics data is retained for 3 years from last interaction. Email engagement data is retained for 2 years.",
  };

  return res.json(exportData);
});

// Data deletion request — requires admin auth OR a valid per-user unsubscribe token
router.post("/privacy/data-delete", optionalAuth, async (req: Request, res: Response) => {
  const { email, token } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  // Check if the caller is an elevated admin (admin/super_admin/exec/ops/compliance)
  const isAdmin = req.user ? isElevatedUser(req.user) : false;

  // Look up preferences to validate token
  const [prefs] = await db.select().from(dosEmailPreferencesTable).where(eq(dosEmailPreferencesTable.email, email));

  if (!isAdmin) {
    // Non-admin must supply a valid unsubscribe token
    if (!token) {
      return res.status(403).json({ error: "Authentication or unsubscribe token required for data deletion" });
    }
    if (!prefs || prefs.unsubscribeToken !== token) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
  }

  // Anonymize lead data (GDPR erasure)
  await db.update(dosLeadsTable).set({
    name: "[deleted]",
    company: null,
    message: null,
    updatedAt: new Date(),
  }).where(eq(dosLeadsTable.email, email));

  // Mark preferences as globally unsubscribed and deletion requested
  if (prefs) {
    await db.update(dosEmailPreferencesTable).set({
      globalUnsubscribe: true,
      marketingEmails: false,
      newsletterEmails: false,
      dataDeletionRequestedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(dosEmailPreferencesTable.email, email));
  }

  return res.json({ success: true, message: "Data deletion request processed. Personal data has been anonymized." });
});

// ─── Cookie Consent ───────────────────────────────────────────────────────────

router.post("/cookie-consent", async (req: Request, res: Response) => {
  const { sessionId, analyticsConsent, marketingConsent, functionalConsent } = req.body;
  const [consent] = await db.insert(dosCookieConsentsTable).values({
    sessionId: sessionId || null,
    analyticsConsent: analyticsConsent ?? false,
    marketingConsent: marketingConsent ?? false,
    functionalConsent: functionalConsent ?? true,
    userAgent: req.headers["user-agent"] || null,
  }).returning();
  return res.json(consent);
});

router.patch("/cookie-consent/:sessionId", async (req: Request, res: Response) => {
  const [consent] = await db.update(dosCookieConsentsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(dosCookieConsentsTable.sessionId, req.params.sessionId)).returning();
  if (!consent) return res.status(404).json({ error: "Consent record not found" });
  return res.json(consent);
});

// ─── Admin: Campaign Performance Dashboard ────────────────────────────────────

router.get("/campaign-dashboard", requireAuth, async (req: Request, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const campaigns = await db.select().from(dosEmailCampaignsTable)
    .where(gte(dosEmailCampaignsTable.createdAt, thirtyDaysAgo))
    .orderBy(desc(dosEmailCampaignsTable.sentAt))
    .limit(20);

  const sequences = await db.select().from(dosDripSequencesTable).limit(10);

  const totalSent = campaigns.reduce((s, c) => s + (c.recipientCount || 0), 0);
  const totalOpens = campaigns.reduce((s, c) => s + (c.openCount || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clickCount || 0), 0);
  const totalBounces = campaigns.reduce((s, c) => s + (c.bounceCount || 0), 0);
  const totalUnsubscribes = campaigns.reduce((s, c) => s + (c.unsubscribeCount || 0), 0);

  const avgOpenRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0.0";
  const avgClickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : "0.0";
  const avgBounceRate = totalSent > 0 ? ((totalBounces / totalSent) * 100).toFixed(1) : "0.0";
  const unsubRate = totalSent > 0 ? ((totalUnsubscribes / totalSent) * 100).toFixed(1) : "0.0";

  // Best send time analysis (hour of day with most opens in past campaigns)
  const sentCampaigns = campaigns.filter(c => c.sentAt);
  const hourCounts: Record<number, number> = {};
  for (const c of sentCampaigns) {
    if (c.sentAt) {
      const hour = new Date(c.sentAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + (c.openCount || 0);
    }
  }
  const bestSendHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

  return res.json({
    summary: {
      totalCampaigns: campaigns.length,
      totalSent,
      totalOpens,
      totalClicks,
      totalBounces,
      totalUnsubscribes,
      avgOpenRate,
      avgClickRate,
      avgBounceRate,
      unsubRate,
    },
    bestSendTime: bestSendHour ? `${bestSendHour[0]}:00 UTC` : null,
    campaigns: campaigns.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      sentAt: c.sentAt,
      recipientCount: c.recipientCount,
      openRate: c.openRate,
      clickRate: c.clickRate,
      bounceCount: c.bounceCount,
      unsubscribeCount: c.unsubscribeCount,
    })),
    sequences: sequences.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      triggerEvent: s.triggerEvent,
      totalEnrolled: s.totalEnrolled,
      totalCompleted: s.totalCompleted,
      completionRate: s.totalEnrolled > 0 ? ((s.totalCompleted / s.totalEnrolled) * 100).toFixed(1) : "0.0",
    })),
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function computeSegmentCount(filters: Record<string, unknown>): Promise<number> {
  const leads = await getSegmentLeads(filters);
  return leads.length;
}

async function getSegmentLeads(filters: Record<string, unknown>): Promise<typeof dosLeadsTable.$inferSelect[]> {
  // Always exclude globally unsubscribed and marketing-opted-out users (GDPR/CAN-SPAM compliance)
  const optedOutEmails = await db.select({ email: dosEmailPreferencesTable.email })
    .from(dosEmailPreferencesTable)
    .where(sql`(global_unsubscribe = true OR marketing_emails = false)`);
  const blocklist = new Set(optedOutEmails.map(r => r.email));

  let query = db.select().from(dosLeadsTable);
  const conditions = [];

  if (filters.stage && Array.isArray(filters.stage) && filters.stage.length > 0) {
    conditions.push(inArray(dosLeadsTable.stage, filters.stage as string[]));
  }
  if (filters.interestArea && Array.isArray(filters.interestArea) && filters.interestArea.length > 0) {
    conditions.push(inArray(dosLeadsTable.interestArea as typeof dosLeadsTable.interestArea, filters.interestArea as string[]));
  }
  if (filters.source && Array.isArray(filters.source) && filters.source.length > 0) {
    conditions.push(inArray(dosLeadsTable.source as typeof dosLeadsTable.source, filters.source as string[]));
  }
  if (typeof filters.scoreMin === "number") {
    conditions.push(gte(dosLeadsTable.score, filters.scoreMin));
  }
  if (typeof filters.scoreMax === "number") {
    conditions.push(lte(dosLeadsTable.score, filters.scoreMax));
  }

  const rows = conditions.length > 0
    ? await query.where(and(...conditions)).limit(2000)
    : await query.limit(2000);

  // Filter out opted-out leads after query (blocklist is typically small)
  return rows.filter(l => !blocklist.has(l.email));
}

async function sendViaSendGridMarketing(
  campaign: typeof dosEmailCampaignsTable.$inferSelect,
  leads: typeof dosLeadsTable.$inferSelect[],
  apiKey: string
): Promise<{ id: string }> {
  // Create contact list
  const contacts = leads.map(l => ({ email: l.email, first_name: l.name || "", last_name: "" }));

  const listRes = await fetch("https://api.sendgrid.com/v3/marketing/lists", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Campaign: ${campaign.name} ${Date.now()}` }),
  });
  if (!listRes.ok) throw new Error(`SG list create failed: ${listRes.status}`);
  const listData = await listRes.json() as { id: string };
  const listId = listData.id;

  // Add contacts to list
  await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
    method: "PUT",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ list_ids: [listId], contacts }),
  });

  // Create single send campaign
  const sgCampaign = {
    name: campaign.name,
    subject: campaign.subjectLineA,
    send_to: { list_ids: [listId] },
    email_config: {
      subject: campaign.subjectLineA,
      html_content: campaign.htmlBody,
      plain_content: campaign.plainTextBody || "",
      sender_id: 1, // Default sender
    },
  };

  const campaignRes = await fetch("https://api.sendgrid.com/v3/marketing/singlesends", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(sgCampaign),
  });
  if (!campaignRes.ok) {
    const err = await campaignRes.text();
    throw new Error(`SG campaign create failed: ${campaignRes.status} ${err}`);
  }
  const campaignData = await campaignRes.json() as { id: string };

  // Schedule: use campaign.scheduledAt if in the future, otherwise send immediately
  const sendAt = campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date()
    ? new Date(campaign.scheduledAt).toISOString()
    : "now";

  await fetch(`https://api.sendgrid.com/v3/marketing/singlesends/${campaignData.id}/schedule`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ send_at: sendAt }),
  });

  return { id: campaignData.id };
}

function addDays(date: Date, days: number, hours = 0): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d;
}

function checkStepCondition(
  condition: string,
  enrollment: typeof dosDripEnrollmentsTable.$inferSelect
): boolean {
  switch (condition) {
    case "always": return true;
    case "opened_previous": return !!enrollment.lastOpenedAt;
    case "clicked_previous": return !!enrollment.lastClickedAt;
    case "not_opened_previous": return !enrollment.lastOpenedAt;
    case "not_clicked_previous": return !enrollment.lastClickedAt;
    default: return true;
  }
}

async function handleUnsubscribe(email: string): Promise<void> {
  const existing = await db.select().from(dosEmailPreferencesTable).where(eq(dosEmailPreferencesTable.email, email));
  if (existing.length > 0) {
    await db.update(dosEmailPreferencesTable).set({ globalUnsubscribe: true, marketingEmails: false, updatedAt: new Date() }).where(eq(dosEmailPreferencesTable.email, email));
  } else {
    const token = crypto.randomBytes(32).toString("hex");
    await db.insert(dosEmailPreferencesTable).values({
      email,
      globalUnsubscribe: true,
      marketingEmails: false,
      unsubscribeToken: token,
    });
  }
}

export default router;
