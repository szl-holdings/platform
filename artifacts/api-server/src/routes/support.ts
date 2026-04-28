import {
  db,
  pool,
  supportCannedResponsesTable,
  supportKnowledgeArticlesTable,
  supportTicketCommentsTable,
  supportTicketsTable,
  tenantSettingsTable,
} from '@szl-holdings/db';
import { randomBytes } from 'node:crypto';
import { and, avg, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { sendBadRequest, sendError, sendForbidden, sendNotFound } from '../lib/api-response';
import {
  buildSupportTicketAdminNotificationEmail,
  buildSupportTicketConfirmationEmail,
  buildSupportTicketReplyEmail,
  buildSupportTicketStatusUpdateEmail,
  sendEmail,
} from '../lib/email';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { type AuthenticatedUser, authMiddleware, requireRole } from '../middlewares/auth';

const SUPPORT_ADMIN_EMAIL =
  process.env.SUPPORT_ADMIN_EMAIL || process.env.SZL_INTERNAL_EMAIL || 'support@szlholdings.com';

const SLA_POLICIES: Record<string, { responseHours: number; resolutionHours: number }> = {
  urgent: { responseHours: 1, resolutionHours: 4 },
  high: { responseHours: 4, resolutionHours: 24 },
  medium: { responseHours: 8, resolutionHours: 48 },
  low: { responseHours: 24, resolutionHours: 72 },
};

function computeSlaDeadlines(priority: string, createdAt: Date): { responseDeadline: Date; resolutionDeadline: Date } {
  const policy = SLA_POLICIES[priority] ?? SLA_POLICIES.medium;
  const responseDeadline = new Date(createdAt.getTime() + policy.responseHours * 3600 * 1000);
  const resolutionDeadline = new Date(createdAt.getTime() + policy.resolutionHours * 3600 * 1000);
  return { responseDeadline, resolutionDeadline };
}

const router: IRouter = Router();

pool
  .query(
    `ALTER TABLE support_tickets
       ADD COLUMN IF NOT EXISTS sla_response_deadline TIMESTAMP,
       ADD COLUMN IF NOT EXISTS sla_resolution_deadline TIMESTAMP,
       ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMP,
       ADD COLUMN IF NOT EXISTS sla_response_breached BOOLEAN NOT NULL DEFAULT FALSE,
       ADD COLUMN IF NOT EXISTS sla_resolution_breached BOOLEAN NOT NULL DEFAULT FALSE,
       ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP,
       ADD COLUMN IF NOT EXISTS escalation_count INTEGER NOT NULL DEFAULT 0,
       ADD COLUMN IF NOT EXISTS merged_into_id INTEGER,
       ADD COLUMN IF NOT EXISTS merged_at TIMESTAMP,
       ADD COLUMN IF NOT EXISTS csat_rating INTEGER,
       ADD COLUMN IF NOT EXISTS csat_comment TEXT,
       ADD COLUMN IF NOT EXISTS csat_request_sent_at TIMESTAMP,
       ADD COLUMN IF NOT EXISTS csat_responded_at TIMESTAMP`,
  )
  .catch((err: unknown) => {
    logger.warn({ err }, '[support] Failed to bootstrap SLA/CSAT columns on support_tickets');
  });

pool
  .query(
    `CREATE TABLE IF NOT EXISTS support_canned_responses (
       id SERIAL PRIMARY KEY,
       title TEXT NOT NULL,
       category TEXT NOT NULL DEFAULT 'general',
       body TEXT NOT NULL,
       tags TEXT[] NOT NULL DEFAULT '{}',
       usage_count INTEGER NOT NULL DEFAULT 0,
       created_by_id INTEGER,
       created_at TIMESTAMP NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMP NOT NULL DEFAULT NOW()
     )`,
  )
  .catch((err: unknown) => {
    logger.warn({ err }, '[support] Failed to bootstrap support_canned_responses table');
  });

function generateTicketRef(): string {
  const prefix = 'TKT';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.roles.includes('super_admin');
}

function isGlobalAdmin(user: AuthenticatedUser): boolean {
  return (
    user.roles.includes('admin') ||
    user.roles.includes('founder_admin' as import('@szl-holdings/db').RoleName)
  );
}

const TICKET_CATEGORIES = [
  'billing',
  'technical',
  'account',
  'feature_request',
  'security',
  'data_privacy',
  'other',
] as const;
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const TICKET_STATUSES = [
  'open',
  'in_progress',
  'waiting_on_customer',
  'resolved',
  'closed',
] as const;

const submitTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  category: z.enum(TICKET_CATEGORIES).default('other'),
  priority: z.enum(TICKET_PRIORITIES).default('medium'),
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

router.get(
  '/support/knowledge',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { q, category } = req.query as { q?: string; category?: string };

      const filters: ReturnType<typeof eq>[] = [
        eq(supportKnowledgeArticlesTable.isPublished, true),
      ];

      if (category) {
        filters.push(ilike(supportKnowledgeArticlesTable.category, category));
      }

      let articles = await db
        .select()
        .from(supportKnowledgeArticlesTable)
        .where(and(...filters))
        .orderBy(desc(supportKnowledgeArticlesTable.viewCount));

      if (q) {
        const query = q.toLowerCase();
        articles = articles.filter(
          (a) =>
            a.title.toLowerCase().includes(query) ||
            a.summary.toLowerCase().includes(query) ||
            a.tags.some((t) => t.toLowerCase().includes(query)),
        );
      }

      res.json({ articles });
    } catch (err) {
      logger.error({ err }, 'Failed to fetch KB articles');
      sendError(res, 'Failed to fetch knowledge base articles');
    }
  },
);

router.get('/support/knowledge/:slug', async (req: Request, res: Response) => {
  try {
    const [article] = await db
      .select()
      .from(supportKnowledgeArticlesTable)
      .where(
        and(
          eq(supportKnowledgeArticlesTable.slug, req.params.slug as string),
          eq(supportKnowledgeArticlesTable.isPublished, true),
        ),
      )
      .limit(1);

    if (!article) {
      sendNotFound(res, 'Article');
      return;
    }

    await db
      .update(supportKnowledgeArticlesTable)
      .set({ viewCount: sql`${supportKnowledgeArticlesTable.viewCount} + 1` })
      .where(eq(supportKnowledgeArticlesTable.id, article.id));

    res.json({ article: { ...article, viewCount: article.viewCount + 1 } });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch KB article');
    sendError(res, 'Failed to fetch article');
  }
});

router.post(
  '/support/tickets',
  authMiddleware(),
  validateBody(submitTicketSchema),
  async (req: Request, res: Response) => {
    try {
      const { subject, description, category, priority, submitterName, submitterEmail } =
        req.body as z.infer<typeof submitTicketSchema>;
      const ticketRef = generateTicketRef();

      const user = req.user as AuthenticatedUser | undefined;
      const userId = user?.id ?? null;
      const orgId = user?.orgs?.[0]?.orgId ?? null;

      const privileged = user ? isGlobalAdmin(user) || isSuperAdmin(user) : false;
      if (
        user &&
        !privileged &&
        user.email &&
        user.email.toLowerCase() !== submitterEmail.toLowerCase()
      ) {
        sendForbidden(res, 'submitterEmail must match your account email address');
        return;
      }

      const now = new Date();
      const { responseDeadline, resolutionDeadline } = computeSlaDeadlines(priority, now);

      const [ticket] = await db
        .insert(supportTicketsTable)
        .values({
          ticketRef,
          orgId,
          userId,
          submitterName,
          submitterEmail,
          subject,
          description,
          category,
          priority,
          status: 'open',
          slaResponseDeadline: responseDeadline,
          slaResolutionDeadline: resolutionDeadline,
        })
        .returning();

      try {
        const agentResult = await pool.query<{
          agent_id: number;
          agent_name: string;
          open_count: number;
          category_expertise: number;
        }>(
          `SELECT
             u.id AS agent_id,
             u.display_name AS agent_name,
             COUNT(st.id)::int AS open_count,
             COUNT(st.id) FILTER (WHERE st.category = $1)::int AS category_expertise
           FROM users u
           INNER JOIN user_roles ur ON ur.user_id = u.id
           INNER JOIN roles r ON r.id = ur.role_id
           LEFT JOIN support_tickets st
             ON st.assigned_to_id = u.id
             AND st.status IN ('open', 'in_progress')
             AND st.merged_into_id IS NULL
           WHERE r.name IN ('ops', 'admin', 'super_admin')
           GROUP BY u.id, u.display_name
           ORDER BY open_count ASC, category_expertise DESC, u.id ASC
           LIMIT 1`,
          [category],
        );
        if (agentResult.rows.length > 0) {
          const agent = agentResult.rows[0];
          await db
            .update(supportTicketsTable)
            .set({ assignedToId: agent.agent_id, assignedToName: agent.agent_name, updatedAt: new Date() })
            .where(eq(supportTicketsTable.id, ticket.id));
          Object.assign(ticket, { assignedToId: agent.agent_id, assignedToName: agent.agent_name });
          logger.info(
            { ticketRef, assignedTo: agent.agent_name, openCount: agent.open_count, category },
            'Ticket auto-assigned via workload+category routing',
          );
        }
      } catch (routingErr) {
        logger.warn({ routingErr, ticketRef }, 'Smart routing skipped — no eligible agents');
      }

      logger.info({ ticketRef, category, priority }, 'Support ticket submitted');

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

      let adminEmail = SUPPORT_ADMIN_EMAIL;
      if (orgId !== null) {
        const [orgEmailSetting] = await db
          .select({ value: tenantSettingsTable.value })
          .from(tenantSettingsTable)
          .where(
            and(
              eq(tenantSettingsTable.orgId, orgId),
              eq(tenantSettingsTable.namespace, 'support'),
              eq(tenantSettingsTable.key, 'notification_email'),
            ),
          )
          .limit(1);
        if (orgEmailSetting?.value && typeof orgEmailSetting.value === 'string') {
          adminEmail = orgEmailSetting.value;
        }
      }

      const [confirmResult, adminResult] = await Promise.allSettled([
        sendEmail({
          to: submitterEmail,
          subject: `[${ticketRef}] Support request received — ${subject}`,
          html: confirmationHtml,
          text: `Hi ${submitterName},\n\nYour support ticket has been received.\n\nReference: ${ticketRef}\nSubject: ${subject}\n\nWe'll be in touch soon.`,
        }),
        sendEmail({
          to: adminEmail,
          subject: `[New Ticket] ${ticketRef} — ${subject}`,
          html: adminNotificationHtml,
          text: `New support ticket ${ticketRef} submitted by ${submitterName} <${submitterEmail}>.\n\nSubject: ${subject}\nCategory: ${category}\nPriority: ${priority}\n\n${description}`,
          replyTo: submitterEmail,
        }),
      ]);

      if (
        confirmResult.status === 'rejected' ||
        (confirmResult.status === 'fulfilled' && !confirmResult.value.success)
      ) {
        logger.warn(
          {
            ticketRef,
            err:
              confirmResult.status === 'rejected'
                ? confirmResult.reason
                : confirmResult.value.error,
          },
          'Failed to send ticket confirmation email',
        );
      }
      if (
        adminResult.status === 'rejected' ||
        (adminResult.status === 'fulfilled' && !adminResult.value.success)
      ) {
        logger.warn(
          {
            ticketRef,
            err: adminResult.status === 'rejected' ? adminResult.reason : adminResult.value.error,
          },
          'Failed to send admin notification email',
        );
      }

      res.status(201).json({ ticket });
    } catch (err) {
      logger.error({ err }, 'Failed to submit support ticket');
      sendError(res, 'Failed to submit ticket');
    }
  },
);

router.get(
  '/support/tickets',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
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
              ? or(
                  inArray(supportTicketsTable.orgId, adminOrgIds),
                  isNull(supportTicketsTable.orgId),
                )!
              : isNull(supportTicketsTable.orgId),
          );
        } else {
          filterParts.push(eq(supportTicketsTable.userId, user.id));
        }
      }

      if (status && TICKET_STATUSES.includes(status as (typeof TICKET_STATUSES)[number])) {
        filterParts.push(
          eq(supportTicketsTable.status, status as (typeof TICKET_STATUSES)[number]),
        );
      }

      if (category && TICKET_CATEGORIES.includes(category as (typeof TICKET_CATEGORIES)[number])) {
        filterParts.push(
          eq(supportTicketsTable.category, category as (typeof TICKET_CATEGORIES)[number]),
        );
      }

      const tickets = await db
        .select()
        .from(supportTicketsTable)
        .where(filterParts.length > 0 ? and(...filterParts) : undefined)
        .orderBy(desc(supportTicketsTable.createdAt))
        .limit(50);

      res.json({ tickets });
    } catch (err) {
      logger.error({ err }, 'Failed to fetch support tickets');
      sendError(res, 'Failed to fetch tickets');
    }
  },
);

router.get('/support/tickets/:id', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthenticatedUser;
    const ticketId = parseInt(req.params.id as string, 10);
    if (Number.isNaN(ticketId)) {
      sendBadRequest(res, 'Invalid ticket ID');
      return;
    }

    const globalAdmin = isGlobalAdmin(user);
    const superAdmin = isSuperAdmin(user);

    const [ticket] = await db
      .select()
      .from(supportTicketsTable)
      .where(eq(supportTicketsTable.id, ticketId))
      .limit(1);

    if (!ticket) {
      sendNotFound(res, 'Ticket');
      return;
    }

    if (!superAdmin) {
      if (globalAdmin) {
        const adminOrgIds = user.orgs.map((o) => o.orgId);
        const ticketOrgId = ticket.orgId;
        if (ticketOrgId !== null && !adminOrgIds.includes(ticketOrgId)) {
          sendForbidden(res, 'Access denied');
          return;
        }
      } else if (ticket.userId !== user.id) {
        sendForbidden(res, 'Access denied');
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
          : and(
              eq(supportTicketCommentsTable.ticketId, ticketId),
              eq(supportTicketCommentsTable.isInternal, false),
            ),
      )
      .orderBy(supportTicketCommentsTable.createdAt);

    res.json({ ticket, comments });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch ticket detail');
    sendError(res, 'Failed to fetch ticket');
  }
});

router.post(
  '/support/tickets/:id/comments',
  authMiddleware(),
  validateBody(addCommentSchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const ticketId = parseInt(req.params.id as string, 10);
      if (Number.isNaN(ticketId)) {
        sendBadRequest(res, 'Invalid ticket ID');
        return;
      }

      const globalAdmin = isGlobalAdmin(user);
      const superAdmin = isSuperAdmin(user);
      const { body, isInternal } = req.body as z.infer<typeof addCommentSchema>;

      const [ticket] = await db
        .select()
        .from(supportTicketsTable)
        .where(eq(supportTicketsTable.id, ticketId))
        .limit(1);

      if (!ticket) {
        sendNotFound(res, 'Ticket');
        return;
      }

      if (!superAdmin) {
        if (globalAdmin) {
          const adminOrgIds = user.orgs.map((o) => o.orgId);
          if (ticket.orgId !== null && !adminOrgIds.includes(ticket.orgId)) {
            sendForbidden(res, 'Access denied');
            return;
          }
        } else if (ticket.userId !== user.id) {
          sendForbidden(res, 'Access denied');
          return;
        }
      }

      const isPrivileged = globalAdmin || superAdmin;
      const [comment] = await db
        .insert(supportTicketCommentsTable)
        .values({
          ticketId,
          authorId: user.id,
          authorName: user.displayName ?? user.email ?? 'Unknown',
          authorRole: isPrivileged ? 'agent' : 'customer',
          body,
          isInternal: isPrivileged ? (isInternal ?? false) : false,
        })
        .returning();

      const ticketUpdates: Record<string, unknown> = { updatedAt: new Date() };
      if (isPrivileged && !comment.isInternal && !(ticket as Record<string, unknown>).firstResponseAt) {
        ticketUpdates.firstResponseAt = new Date();
        if (ticket.status === 'open') {
          ticketUpdates.status = 'in_progress';
        }
      }

      await db
        .update(supportTicketsTable)
        .set(ticketUpdates as Partial<typeof supportTicketsTable.$inferInsert>)
        .where(eq(supportTicketsTable.id, ticketId));

      if (isPrivileged && !comment.isInternal) {
        const replyHtml = buildSupportTicketReplyEmail({
          submitterName: ticket.submitterName,
          ticketRef: ticket.ticketRef,
          subject: ticket.subject,
          replyBody: body,
          agentName: comment.authorName,
        });
        sendEmail({
          to: ticket.submitterEmail,
          subject: `[${ticket.ticketRef}] New reply on your support ticket`,
          html: replyHtml,
          text: `Hi ${ticket.submitterName},\n\nA support agent has replied to your ticket.\n\nReference: ${ticket.ticketRef}\nSubject: ${ticket.subject}\n\n${comment.authorName} wrote:\n${body}\n\nPlease log in to view and respond to your ticket.`,
        }).then((result) => {
          if (!result.success) {
            logger.warn(
              { ticketRef: ticket.ticketRef, err: result.error },
              'Failed to send support ticket reply notification email',
            );
          }
        }).catch((err) => {
          logger.warn(
            { ticketRef: ticket.ticketRef, err },
            'Failed to send support ticket reply notification email',
          );
        });
      }

      res.status(201).json({ comment });
    } catch (err) {
      logger.error({ err }, 'Failed to add comment');
      sendError(res, 'Failed to add comment');
    }
  },
);

router.patch(
  '/support/tickets/:id/status',
  authMiddleware(),
  requireRole('admin'),
  validateBody(updateStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const ticketId = parseInt(req.params.id as string, 10);
      if (Number.isNaN(ticketId)) {
        sendBadRequest(res, 'Invalid ticket ID');
        return;
      }

      const [existing] = await db
        .select()
        .from(supportTicketsTable)
        .where(eq(supportTicketsTable.id, ticketId))
        .limit(1);
      if (!existing) {
        sendNotFound(res, 'Ticket');
        return;
      }

      if (!isSuperAdmin(user)) {
        const adminOrgIds = user.orgs.map((o) => o.orgId);
        if (existing.orgId !== null && !adminOrgIds.includes(existing.orgId)) {
          sendForbidden(res, 'Access denied');
          return;
        }
      }

      const { status, assignedToId, assignedToName } = req.body as z.infer<
        typeof updateStatusSchema
      >;

      const updates: Partial<typeof supportTicketsTable.$inferInsert> = { updatedAt: new Date() };
      if (status) {
        updates.status = status;
        if (status === 'resolved') updates.resolvedAt = new Date();
        if (status === 'closed') updates.closedAt = new Date();
      }
      if (assignedToId !== undefined) updates.assignedToId = assignedToId;
      if (assignedToName !== undefined) updates.assignedToName = assignedToName;

      const [ticket] = await db
        .update(supportTicketsTable)
        .set(updates)
        .where(eq(supportTicketsTable.id, ticketId))
        .returning();

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
          logger.warn(
            { ticketRef: existing.ticketRef, status, err: emailResult.error },
            'Failed to send ticket status update email',
          );
        }

        if ((status === 'resolved' || status === 'closed') && !existing.csatRequestSentAt) {
          const csatLink = `https://szlholdings.com/support/csat?ticketId=${ticketId}&ref=${existing.ticketRef}`;
          const csatHtml = `<p>Hi ${existing.submitterName},</p><p>Your support ticket <strong>${existing.ticketRef}</strong> has been ${status}.</p><p>How would you rate your support experience? Please click a star to submit your rating:</p><p>${[1, 2, 3, 4, 5].map((s) => `<a href="${csatLink}&rating=${s}" style="text-decoration:none;font-size:24px;">${s <= 3 ? '⭐' : s === 4 ? '🌟' : '✨'}</a>`).join(' ')}</p><p>1 = Poor &nbsp;&nbsp; 5 = Excellent</p><p>Thank you for helping us improve!</p>`;
          const csatEmailResult = await sendEmail({
            to: existing.submitterEmail,
            subject: `[${existing.ticketRef}] How did we do? Please rate your support`,
            html: csatHtml,
            text: `Hi ${existing.submitterName},\n\nYour ticket ${existing.ticketRef} has been ${status}.\n\nPlease rate your experience: ${csatLink}&rating=5 (5=Excellent, 1=Poor)\n\nThank you!`,
          });
          if (csatEmailResult.success) {
            await pool.query(
              `UPDATE support_tickets SET csat_request_sent_at = NOW() WHERE id = $1`,
              [ticketId],
            );
            logger.info({ ticketRef: existing.ticketRef }, '[support/status] CSAT survey dispatched');
          } else {
            logger.warn({ ticketRef: existing.ticketRef, err: csatEmailResult.error }, '[support/status] CSAT survey email failed');
          }
        }
      }

      res.json({ ticket });
    } catch (err) {
      logger.error({ err }, 'Failed to update ticket status');
      sendError(res, 'Failed to update ticket');
    }
  },
);

router.get(
  '/support/knowledge/deflect',
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { q } = req.query as { q?: string };
      if (!q || q.trim().length < 3) {
        res.json({ articles: [], deflected: false });
        return;
      }

      const query = q.toLowerCase();
      const allArticles = await db
        .select()
        .from(supportKnowledgeArticlesTable)
        .where(eq(supportKnowledgeArticlesTable.isPublished, true))
        .orderBy(desc(supportKnowledgeArticlesTable.viewCount))
        .limit(100);

      const scored = allArticles
        .map((a) => {
          let score = 0;
          const titleMatch = a.title.toLowerCase().includes(query);
          const summaryMatch = a.summary.toLowerCase().includes(query);
          const tagMatch = a.tags.some((t) => t.toLowerCase().includes(query));
          if (titleMatch) score += 3;
          if (summaryMatch) score += 2;
          if (tagMatch) score += 1;
          return { article: a, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((x) => x.article);

      res.json({ articles: scored, deflected: scored.length > 0 });
    } catch (err) {
      logger.error({ err }, '[support/deflect] Failed to query deflection articles');
      sendError(res, 'Failed to query knowledge base');
    }
  },
);

router.post(
  '/support/knowledge/deflect/:slug/confirm',
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.params as { slug: string };
      const { ticketId } = req.body as { ticketId?: number };

      await db
        .update(supportKnowledgeArticlesTable)
        .set({ deflectionCount: sql`${supportKnowledgeArticlesTable.deflectionCount} + 1` })
        .where(eq(supportKnowledgeArticlesTable.slug, slug));

      if (ticketId && !Number.isNaN(ticketId)) {
        const user = req.user as AuthenticatedUser | undefined;
        if (!user) {
          return sendForbidden(res, 'Authentication required to auto-resolve a ticket');
        }

        const ticketCheck = await pool.query<{ id: number; user_id: number | null }>(
          `SELECT id, user_id FROM support_tickets WHERE id = $1 LIMIT 1`,
          [ticketId],
        );
        const ticket = ticketCheck.rows[0];
        if (!ticket) {
          return sendNotFound(res, 'Ticket not found');
        }
        const isOwner = ticket.user_id === user.id;
        const isAdmin = user.roles.some((r) => ['admin', 'super_admin'].includes(r));
        if (!isOwner && !isAdmin) {
          return sendForbidden(res, 'Not authorised to resolve this ticket');
        }

        await pool.query(
          `UPDATE support_tickets
           SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND status IN ('open', 'in_progress')`,
          [ticketId],
        );
        await pool.query(
          `INSERT INTO support_ticket_comments (ticket_id, author_name, author_role, body, is_internal)
           VALUES ($1, 'System', 'agent', $2, FALSE)`,
          [ticketId, `Ticket auto-resolved: customer confirmed that KB article "${slug}" answered their question.`],
        );
        logger.info({ ticketId, slug, userId: user.id }, '[support/deflect/confirm] Ticket auto-resolved via KB deflection');
        res.json({ success: true, deflected: true, ticketResolved: true });
        return;
      }

      res.json({ success: true, deflected: true, ticketResolved: false });
    } catch (err) {
      logger.error({ err }, '[support/deflect/confirm] Failed to record deflection');
      sendError(res, 'Failed to record deflection');
    }
  },
);

router.post(
  '/support/tickets/:id/csat',
  async (req: Request, res: Response) => {
    try {
      const ticketId = parseInt(req.params.id as string, 10);
      if (Number.isNaN(ticketId)) {
        sendBadRequest(res, 'Invalid ticket ID');
        return;
      }

      const { rating, comment, ref } = req.body as { rating?: number; comment?: string; ref?: string };
      if (!rating || rating < 1 || rating > 5) {
        sendBadRequest(res, 'Rating must be between 1 and 5');
        return;
      }

      const [ticket] = await db
        .select()
        .from(supportTicketsTable)
        .where(eq(supportTicketsTable.id, ticketId))
        .limit(1);

      if (!ticket) {
        sendNotFound(res, 'Ticket');
        return;
      }

      if (ref && ticket.ticketRef !== ref) {
        sendForbidden(res, 'Invalid survey token');
        return;
      }

      const user = req.user as AuthenticatedUser | undefined;
      if (!ref && user && ticket.userId !== user.id && !isSuperAdmin(user) && !isGlobalAdmin(user)) {
        sendForbidden(res, 'Access denied');
        return;
      }

      if (!ref && !user) {
        sendForbidden(res, 'Authentication required');
        return;
      }

      await pool.query(
        `UPDATE support_tickets SET csat_rating = $1, csat_comment = $2, csat_responded_at = NOW() WHERE id = $3`,
        [rating, comment ?? null, ticketId],
      );

      logger.info({ ticketId, rating }, '[support/csat] CSAT rating submitted');
      res.json({ success: true, rating, comment });
    } catch (err) {
      logger.error({ err }, '[support/csat] Failed to submit CSAT rating');
      sendError(res, 'Failed to submit CSAT rating');
    }
  },
);

router.get(
  '/support/analytics',
  authMiddleware(),
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

      const [totalsResult, byCategoryResult, byPriorityResult, agentPerfResult, avgResResult] =
        await Promise.all([
          pool.query<{
            total: number;
            open: number;
            in_progress: number;
            resolved: number;
            closed: number;
            breached_response: number;
            breached_resolution: number;
            breached_any: number;
            avg_csat: number | null;
            csat_responses: number;
          }>(
            `SELECT
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status = 'open')::int AS open,
               COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
               COUNT(*) FILTER (WHERE status = 'resolved' OR status = 'closed')::int AS resolved,
               COUNT(*) FILTER (WHERE status = 'closed')::int AS closed,
               COUNT(*) FILTER (WHERE sla_response_breached = TRUE)::int AS breached_response,
               COUNT(*) FILTER (WHERE sla_resolution_breached = TRUE)::int AS breached_resolution,
               COUNT(*) FILTER (WHERE sla_response_breached = TRUE OR sla_resolution_breached = TRUE)::int AS breached_any,
               ROUND(AVG(csat_rating)::numeric, 2) AS avg_csat,
               COUNT(csat_rating)::int AS csat_responses
             FROM support_tickets WHERE created_at >= $1`,
            [since],
          ),
          pool.query<{ category: string; total: number; open: number }>(
            `SELECT category,
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE status = 'open' OR status = 'in_progress')::int AS open
             FROM support_tickets WHERE created_at >= $1
             GROUP BY category ORDER BY total DESC`,
            [since],
          ),
          pool.query<{ priority: string; total: number }>(
            `SELECT priority, COUNT(*)::int AS total FROM support_tickets WHERE created_at >= $1
             GROUP BY priority ORDER BY total DESC`,
            [since],
          ),
          pool.query<{ assigned_to_name: string; open: number; resolved: number; avg_csat: number | null; avg_response_hrs: number | null }>(
            `SELECT assigned_to_name,
                    COUNT(*) FILTER (WHERE status = 'open' OR status = 'in_progress')::int AS open,
                    COUNT(*) FILTER (WHERE status = 'resolved' OR status = 'closed')::int AS resolved,
                    ROUND(AVG(csat_rating)::numeric, 2) AS avg_csat,
                    ROUND(EXTRACT(EPOCH FROM AVG(first_response_at - created_at)) / 3600, 2) AS avg_response_hrs
             FROM support_tickets WHERE assigned_to_name IS NOT NULL AND created_at >= $1
             GROUP BY assigned_to_name ORDER BY resolved DESC`,
            [since],
          ),
          pool.query<{ avg_hrs: number | null }>(
            `SELECT ROUND(EXTRACT(EPOCH FROM AVG(resolved_at - created_at)) / 3600, 2) AS avg_hrs
             FROM support_tickets WHERE resolved_at IS NOT NULL AND created_at >= $1`,
            [since],
          ),
        ]);

      const totals = totalsResult.rows[0];
      const slaComplianceRate =
        totals.total > 0
          ? Math.round(((totals.total - totals.breached_any) / totals.total) * 100)
          : 100;

      res.json({
        period: { from: since.toISOString(), to: new Date().toISOString() },
        totals,
        slaComplianceRate,
        avgResolutionHrs: avgResResult.rows[0]?.avg_hrs ?? null,
        byCategory: byCategoryResult.rows,
        byPriority: byPriorityResult.rows,
        agentPerformance: agentPerfResult.rows,
      });
    } catch (err) {
      logger.error({ err }, '[support/analytics] Failed to compute analytics');
      sendError(res, 'Failed to compute analytics');
    }
  },
);

export const SLA_POLICIES_EXPORT = SLA_POLICIES;
export { computeSlaDeadlines };

export default router;
