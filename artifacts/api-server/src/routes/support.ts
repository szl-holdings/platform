import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@szl-holdings/db";
import { supportTicketsTable, supportTicketCommentsTable } from "@szl-holdings/db";
import { authMiddleware, requireRole, type AuthenticatedUser } from "../middlewares/auth";
import { validateBody } from "../lib/validation";
import { z } from "zod";
import { eq, desc, and, inArray, isNull, or } from "drizzle-orm";
import { logger } from "../lib/logger";
import { randomBytes } from "crypto";
import {
  sendEmail,
  buildSupportTicketConfirmationEmail,
  buildSupportTicketAdminNotificationEmail,
  buildSupportTicketStatusUpdateEmail,
} from "../lib/email";

const SUPPORT_ADMIN_EMAIL = process.env.SUPPORT_ADMIN_EMAIL || process.env.SZL_INTERNAL_EMAIL || "support@szlholdings.com";

const router: IRouter = Router();

function generateTicketRef(): string {
  const prefix = "TKT";
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.roles.includes("super_admin");
}

function isGlobalAdmin(user: AuthenticatedUser): boolean {
  return user.roles.includes("admin") || user.roles.includes("founder_admin" as import("@szl-holdings/db").RoleName);
}

const TICKET_CATEGORIES = ["billing", "technical", "account", "feature_request", "security", "data_privacy", "other"] as const;
const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const TICKET_STATUSES = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"] as const;

const submitTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  category: z.enum(TICKET_CATEGORIES).default("other"),
  priority: z.enum(TICKET_PRIORITIES).default("medium"),
  submitterName: z.string().min(2).max(100),
  submitterEmail: z.string().email(),
});

const addCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  isInternal: z.boolean().optional().default(false),
});

const updateStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  assignedToId: z.number().int().positive().optional(),
  assignedToName: z.string().max(200).optional(),
});

const KB_ARTICLES = [
  {
    id: 1,
    slug: "getting-started-lyte",
    title: "Getting started with Lyte",
    category: "Getting Started",
    summary: "Learn how to connect your first data source and surface operational signals in Lyte.",
    body: "Lyte connects to your existing approval queues, task systems, and workflow tools. This guide walks through your first integration and signal configuration.",
    tags: ["lyte", "onboarding", "integrations"],
    viewCount: 142,
  },
  {
    id: 2,
    slug: "alloy-audit-trail",
    title: "Understanding the Alloy Proof Chain",
    category: "Governance",
    summary: "Every action in Alloy generates an immutable audit record. Learn how to view and export your proof chain.",
    body: "The Alloy Proof Chain records every action, approval, and inference with complete lineage. This article explains the data model, retention policy, and export options.",
    tags: ["alloy", "audit", "compliance"],
    viewCount: 98,
  },
  {
    id: 3,
    slug: "sso-setup",
    title: "Setting up SSO with Azure AD",
    category: "Authentication",
    summary: "Configure single sign-on using Azure Active Directory or any OIDC-compatible identity provider.",
    body: "SZL Holdings supports OpenID Connect (OIDC) with PKCE. This guide covers Azure AD configuration, SCIM provisioning setup, and role mapping.",
    tags: ["sso", "azure", "oidc", "security"],
    viewCount: 217,
  },
  {
    id: 4,
    slug: "billing-plans",
    title: "Understanding billing and plan limits",
    category: "Billing",
    summary: "Learn about plan tiers, seat limits, usage metering, and how to upgrade your subscription.",
    body: "Billing is metered per seat and per feature entitlement. This article explains how usage is calculated, how to view your current period, and how to upgrade.",
    tags: ["billing", "plans", "seats"],
    viewCount: 76,
  },
  {
    id: 5,
    slug: "data-export",
    title: "Exporting your data (GDPR / portability)",
    category: "Data & Privacy",
    summary: "Request a full export of your organization's data or submit a GDPR erasure request.",
    body: "Under GDPR and CCPA, you have the right to access, export, and delete your data. This article explains how to initiate an export or erasure request through the platform.",
    tags: ["gdpr", "ccpa", "data", "privacy", "export"],
    viewCount: 63,
  },
  {
    id: 6,
    slug: "webhook-setup",
    title: "Configuring outbound webhooks",
    category: "Integrations",
    summary: "Send real-time events to your systems using the SZL Holdings webhook system.",
    body: "Webhooks let you receive real-time notifications when key events occur in your workspace. This guide covers endpoint registration, signature verification, and retry behavior.",
    tags: ["webhooks", "integrations", "events"],
    viewCount: 54,
  },
];

router.get("/support/knowledge", (req: Request, res: Response) => {
  const { q, category } = req.query as { q?: string; category?: string };
  let articles = [...KB_ARTICLES];
  if (q) {
    const query = q.toLowerCase();
    articles = articles.filter(
      (a) => a.title.toLowerCase().includes(query) || a.summary.toLowerCase().includes(query) || a.tags.some((t) => t.includes(query))
    );
  }
  if (category) {
    articles = articles.filter((a) => a.category.toLowerCase() === category.toLowerCase());
  }
  res.json({ articles });
});

router.get("/support/knowledge/:slug", (req: Request, res: Response) => {
  const article = KB_ARTICLES.find((a) => a.slug === req.params["slug"]);
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json({ article });
});

router.post("/support/tickets", authMiddleware(), validateBody(submitTicketSchema), async (req: Request, res: Response) => {
  try {
    const { subject, description, category, priority, submitterName, submitterEmail } = req.body as z.infer<typeof submitTicketSchema>;
    const ticketRef = generateTicketRef();

    const user = req.user as AuthenticatedUser | undefined;
    const userId = user?.id ?? null;
    const orgId = user?.orgs?.[0]?.orgId ?? null;

    const privileged = user ? (isGlobalAdmin(user) || isSuperAdmin(user)) : false;
    if (user && !privileged && user.email && user.email.toLowerCase() !== submitterEmail.toLowerCase()) {
      res.status(403).json({ error: "submitterEmail must match your account email address" });
      return;
    }

    const [ticket] = await db.insert(supportTicketsTable).values({
      ticketRef,
      orgId,
      userId,
      submitterName,
      submitterEmail,
      subject,
      description,
      category,
      priority,
      status: "open",
    }).returning();

    logger.info({ ticketRef, category, priority }, "Support ticket submitted");

    const confirmationHtml = buildSupportTicketConfirmationEmail({
      submitterName,
      ticketRef,
      subject,
      category,
      priority,
    });
    const adminNotificationHtml = buildSupportTicketAdminNotificationEmail({
      ticketRef,
      submitterName,
      submitterEmail,
      subject,
      description,
      category,
      priority,
    });

    const [confirmResult, adminResult] = await Promise.allSettled([
      sendEmail({
        to: submitterEmail,
        subject: `[${ticketRef}] Support request received — ${subject}`,
        html: confirmationHtml,
        text: `Hi ${submitterName},\n\nYour support ticket has been received.\n\nReference: ${ticketRef}\nSubject: ${subject}\n\nWe'll be in touch soon.`,
      }),
      sendEmail({
        to: SUPPORT_ADMIN_EMAIL,
        subject: `[New Ticket] ${ticketRef} — ${subject}`,
        html: adminNotificationHtml,
        text: `New support ticket ${ticketRef} submitted by ${submitterName} <${submitterEmail}>.\n\nSubject: ${subject}\nCategory: ${category}\nPriority: ${priority}\n\n${description}`,
        replyTo: submitterEmail,
      }),
    ]);

    if (confirmResult.status === "rejected" || (confirmResult.status === "fulfilled" && !confirmResult.value.success)) {
      logger.warn({ ticketRef, err: confirmResult.status === "rejected" ? confirmResult.reason : confirmResult.value.error }, "Failed to send ticket confirmation email");
    }
    if (adminResult.status === "rejected" || (adminResult.status === "fulfilled" && !adminResult.value.success)) {
      logger.warn({ ticketRef, err: adminResult.status === "rejected" ? adminResult.reason : adminResult.value.error }, "Failed to send admin notification email");
    }

    res.status(201).json({ ticket });
  } catch (err) {
    logger.error({ err }, "Failed to submit support ticket");
    res.status(500).json({ error: "Failed to submit ticket" });
  }
});

router.get("/support/tickets", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const { status, category } = req.query as { status?: string; category?: string };

    const globalAdmin = isGlobalAdmin(user);
    const superAdmin = isSuperAdmin(user);

    const filterParts: ReturnType<typeof eq>[] = [];

    if (!superAdmin) {
      if (globalAdmin) {
        const adminOrgIds = user.orgs.map((o) => o.orgId);
        filterParts.push(
          adminOrgIds.length > 0
            ? or(inArray(supportTicketsTable.orgId, adminOrgIds), isNull(supportTicketsTable.orgId))!
            : isNull(supportTicketsTable.orgId)
        );
      } else {
        filterParts.push(eq(supportTicketsTable.userId, user.id));
      }
    }

    if (status && TICKET_STATUSES.includes(status as typeof TICKET_STATUSES[number])) {
      filterParts.push(eq(supportTicketsTable.status, status as typeof TICKET_STATUSES[number]));
    }

    if (category && TICKET_CATEGORIES.includes(category as typeof TICKET_CATEGORIES[number])) {
      filterParts.push(eq(supportTicketsTable.category, category as typeof TICKET_CATEGORIES[number]));
    }

    const tickets = await db
      .select()
      .from(supportTicketsTable)
      .where(filterParts.length > 0 ? and(...filterParts) : undefined)
      .orderBy(desc(supportTicketsTable.createdAt))
      .limit(50);

    res.json({ tickets });
  } catch (err) {
    logger.error({ err }, "Failed to fetch support tickets");
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

router.get("/support/tickets/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const ticketId = parseInt(req.params["id"] as string);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const globalAdmin = isGlobalAdmin(user);
    const superAdmin = isSuperAdmin(user);

    const [ticket] = await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.id, ticketId)).limit(1);

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (!superAdmin) {
      if (globalAdmin) {
        const adminOrgIds = user.orgs.map((o) => o.orgId);
        const ticketOrgId = ticket.orgId;
        if (ticketOrgId !== null && !adminOrgIds.includes(ticketOrgId)) {
          res.status(403).json({ error: "Access denied" });
          return;
        }
      } else if (ticket.userId !== user.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    const isPrivileged = globalAdmin || superAdmin;
    const comments = await db
      .select()
      .from(supportTicketCommentsTable)
      .where(
        isPrivileged
          ? eq(supportTicketCommentsTable.ticketId, ticketId)
          : and(eq(supportTicketCommentsTable.ticketId, ticketId), eq(supportTicketCommentsTable.isInternal, false))
      )
      .orderBy(supportTicketCommentsTable.createdAt);

    res.json({ ticket, comments });
  } catch (err) {
    logger.error({ err }, "Failed to fetch ticket detail");
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

router.post("/support/tickets/:id/comments", authMiddleware(), validateBody(addCommentSchema), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const ticketId = parseInt(req.params["id"] as string);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const globalAdmin = isGlobalAdmin(user);
    const superAdmin = isSuperAdmin(user);
    const { body, isInternal } = req.body as z.infer<typeof addCommentSchema>;

    const [ticket] = await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.id, ticketId)).limit(1);

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (!superAdmin) {
      if (globalAdmin) {
        const adminOrgIds = user.orgs.map((o) => o.orgId);
        if (ticket.orgId !== null && !adminOrgIds.includes(ticket.orgId)) {
          res.status(403).json({ error: "Access denied" });
          return;
        }
      } else if (ticket.userId !== user.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    const isPrivileged = globalAdmin || superAdmin;
    const [comment] = await db.insert(supportTicketCommentsTable).values({
      ticketId,
      authorId: user.id,
      authorName: user.displayName ?? user.email ?? "Unknown",
      authorRole: isPrivileged ? "agent" : "customer",
      body,
      isInternal: isPrivileged ? (isInternal ?? false) : false,
    }).returning();

    await db.update(supportTicketsTable).set({ updatedAt: new Date() }).where(eq(supportTicketsTable.id, ticketId));

    res.status(201).json({ comment });
  } catch (err) {
    logger.error({ err }, "Failed to add comment");
    res.status(500).json({ error: "Failed to add comment" });
  }
});

router.patch("/support/tickets/:id/status", authMiddleware(), requireRole("admin"), validateBody(updateStatusSchema), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const ticketId = parseInt(req.params["id"] as string);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: "Invalid ticket ID" });
      return;
    }

    const [existing] = await db.select().from(supportTicketsTable).where(eq(supportTicketsTable.id, ticketId)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (!isSuperAdmin(user)) {
      const adminOrgIds = user.orgs.map((o) => o.orgId);
      if (existing.orgId !== null && !adminOrgIds.includes(existing.orgId)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    const { status, assignedToId, assignedToName } = req.body as z.infer<typeof updateStatusSchema>;

    const updates: Partial<typeof supportTicketsTable.$inferInsert> = { updatedAt: new Date() };
    if (status) {
      updates.status = status;
      if (status === "resolved") updates.resolvedAt = new Date();
      if (status === "closed") updates.closedAt = new Date();
    }
    if (assignedToId !== undefined) updates.assignedToId = assignedToId;
    if (assignedToName !== undefined) updates.assignedToName = assignedToName;

    const [ticket] = await db.update(supportTicketsTable).set(updates).where(eq(supportTicketsTable.id, ticketId)).returning();

    if (status && status !== existing.status) {
      const statusUpdateHtml = buildSupportTicketStatusUpdateEmail({
        submitterName: existing.submitterName,
        ticketRef: existing.ticketRef,
        subject: existing.subject,
        newStatus: status,
      });
      const emailResult = await sendEmail({
        to: existing.submitterEmail,
        subject: `[${existing.ticketRef}] Your ticket status has been updated`,
        html: statusUpdateHtml,
        text: `Hi ${existing.submitterName},\n\nYour support ticket ${existing.ticketRef} has been updated.\n\nNew status: ${status}\nSubject: ${existing.subject}\n\nThank you for your patience.`,
      });
      if (!emailResult.success) {
        logger.warn({ ticketRef: existing.ticketRef, status, err: emailResult.error }, "Failed to send ticket status update email");
      }
    }

    res.json({ ticket });
  } catch (err) {
    logger.error({ err }, "Failed to update ticket status");
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

export default router;
