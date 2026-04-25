import {
  db,
  supportKnowledgeArticlesTable,
  supportTicketCommentsTable,
  supportTicketsTable,
  tenantSettingsTable,
} from '@szl-holdings/db';
import { randomBytes } from 'node:crypto';
import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
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

const router: IRouter = Router();

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
        })
        .returning();

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

      await db
        .update(supportTicketsTable)
        .set({ updatedAt: new Date() })
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
      }

      res.json({ ticket });
    } catch (err) {
      logger.error({ err }, 'Failed to update ticket status');
      sendError(res, 'Failed to update ticket');
    }
  },
);

export default router;
