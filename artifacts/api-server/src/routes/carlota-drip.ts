import { randomBytes, randomUUID } from 'node:crypto';
import { and, desc, eq, sql, lte } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  db,
  carlotaDripSequencesTable,
  carlotaDripStepsTable,
  carlotaDripEnrollmentsTable,
  carlotaDripEngagementEventsTable,
} from '@szl-holdings/db';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import { sendEmail } from '../lib/email';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

const AUTH_PATHS = [
  '/booking/drip/sequences',
  '/booking/drip/enrollments',
  '/booking/drip/engagement',
  '/booking/drip/process',
];
router.use(AUTH_PATHS, authMiddleware());

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$/;

const createSequenceSchema = z.object({
  sequenceId: z.string().regex(SLUG_REGEX).optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  practiceArea: z.string().optional(),
  steps: z
    .array(
      z.object({
        delayDays: z.number().int().min(0).max(365),
        subject: z.string().min(1),
        bodyHtml: z.string().min(1),
        bodyText: z.string().optional(),
        ctaUrl: z.string().url().optional(),
        ctaLabel: z.string().optional(),
      }),
    )
    .min(1)
    .max(20),
});

router.post(
  '/booking/drip/sequences',
  validateBody(createSequenceSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof createSequenceSchema>;
      const sequenceId = body.sequenceId ?? randomUUID();

      await db.insert(carlotaDripSequencesTable).values({
        sequenceId,
        name: body.name,
        description: body.description ?? null,
        practiceArea: body.practiceArea ?? null,
        totalSteps: body.steps.length,
      });

      for (let i = 0; i < body.steps.length; i++) {
        const step = body.steps[i]!;
        await db.insert(carlotaDripStepsTable).values({
          stepId: randomUUID(),
          sequenceId,
          stepOrder: i + 1,
          delayDays: step.delayDays,
          subject: step.subject,
          bodyHtml: step.bodyHtml,
          bodyText: step.bodyText ?? null,
          ctaUrl: step.ctaUrl ?? null,
          ctaLabel: step.ctaLabel ?? null,
        });
      }

      const [created] = await db
        .select()
        .from(carlotaDripSequencesTable)
        .where(eq(carlotaDripSequencesTable.sequenceId, sequenceId));

      const steps = await db
        .select()
        .from(carlotaDripStepsTable)
        .where(eq(carlotaDripStepsTable.sequenceId, sequenceId))
        .orderBy(carlotaDripStepsTable.stepOrder);

      logger.info({ sequenceId, steps: body.steps.length }, '[carlota-drip] sequence created');
      sendCreated(res, { sequence: created, steps });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create drip sequence');
    }
  },
);

router.get('/booking/drip/sequences', async (_req: Request, res: Response) => {
  try {
    const sequences = await db
      .select()
      .from(carlotaDripSequencesTable)
      .orderBy(desc(carlotaDripSequencesTable.createdAt));

    sendSuccess(res, { sequences });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list drip sequences');
  }
});

router.get('/booking/drip/sequences/:sequenceId', async (req: Request, res: Response) => {
  try {
    const { sequenceId } = req.params;
    const [sequence] = await db
      .select()
      .from(carlotaDripSequencesTable)
      .where(eq(carlotaDripSequencesTable.sequenceId, sequenceId!));

    if (!sequence) {
      sendNotFound(res, 'Drip sequence');
      return;
    }

    const steps = await db
      .select()
      .from(carlotaDripStepsTable)
      .where(eq(carlotaDripStepsTable.sequenceId, sequenceId!))
      .orderBy(carlotaDripStepsTable.stepOrder);

    const enrollments = await db
      .select()
      .from(carlotaDripEnrollmentsTable)
      .where(eq(carlotaDripEnrollmentsTable.sequenceId, sequenceId!))
      .orderBy(desc(carlotaDripEnrollmentsTable.enrolledAt));

    const engagementStats = await db
      .select({
        eventType: carlotaDripEngagementEventsTable.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(carlotaDripEngagementEventsTable)
      .where(
        eq(
          carlotaDripEngagementEventsTable.enrollmentId,
          sql`ANY(SELECT enrollment_id FROM carlota_drip_enrollments WHERE sequence_id = ${sequenceId})`,
        ),
      )
      .groupBy(carlotaDripEngagementEventsTable.eventType);

    sendSuccess(res, { sequence, steps, enrollments, engagementStats });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get drip sequence');
  }
});

router.patch('/booking/drip/sequences/:sequenceId/status', async (req: Request, res: Response) => {
  try {
    const { sequenceId } = req.params;
    const { status } = req.body as { status: string };

    if (!['draft', 'active', 'paused', 'archived'].includes(status)) {
      sendBadRequest(res, 'Invalid status');
      return;
    }

    const updated = await db
      .update(carlotaDripSequencesTable)
      .set({ status: status as 'draft' | 'active' | 'paused' | 'archived', updatedAt: new Date() })
      .where(eq(carlotaDripSequencesTable.sequenceId, sequenceId!))
      .returning();

    if (updated.length === 0) {
      sendNotFound(res, 'Drip sequence');
      return;
    }
    sendSuccess(res, { sequence: updated[0] });
  } catch (err) {
    handleRouteError(res, err, 'Failed to update sequence status');
  }
});

const enrollSchema = z.object({
  sequenceId: z.string(),
  contactEmail: z.string().email(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.post(
  '/booking/drip/enrollments',
  validateBody(enrollSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof enrollSchema>;

      const [sequence] = await db
        .select()
        .from(carlotaDripSequencesTable)
        .where(eq(carlotaDripSequencesTable.sequenceId, body.sequenceId));

      if (!sequence) {
        sendNotFound(res, 'Drip sequence');
        return;
      }

      if (sequence.status !== 'active') {
        sendBadRequest(res, 'Sequence is not active');
        return;
      }

      const existing = await db
        .select()
        .from(carlotaDripEnrollmentsTable)
        .where(
          and(
            eq(carlotaDripEnrollmentsTable.sequenceId, body.sequenceId),
            eq(carlotaDripEnrollmentsTable.contactEmail, body.contactEmail),
          ),
        );

      if (existing.length > 0 && existing[0]!.status === 'active') {
        sendBadRequest(res, 'Contact is already enrolled in this sequence');
        return;
      }

      const firstStep = await db
        .select()
        .from(carlotaDripStepsTable)
        .where(
          and(
            eq(carlotaDripStepsTable.sequenceId, body.sequenceId),
            eq(carlotaDripStepsTable.stepOrder, 1),
          ),
        )
        .limit(1);

      const nextSendAt = firstStep[0]
        ? new Date(Date.now() + firstStep[0].delayDays * 86_400_000)
        : new Date();

      const enrollmentId = randomUUID();
      const unsubscribeToken = randomBytes(24).toString('hex');

      await db.insert(carlotaDripEnrollmentsTable).values({
        enrollmentId,
        sequenceId: body.sequenceId,
        contactEmail: body.contactEmail,
        contactName: body.contactName ?? null,
        contactPhone: body.contactPhone ?? null,
        unsubscribeToken,
        metadata: (body.metadata as Record<string, unknown>) ?? null,
        currentStepOrder: 0,
        nextSendAt,
      });

      await db
        .update(carlotaDripSequencesTable)
        .set({
          totalEnrolled: sql`${carlotaDripSequencesTable.totalEnrolled} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(carlotaDripSequencesTable.sequenceId, body.sequenceId));

      logger.info({ enrollmentId, sequenceId: body.sequenceId }, '[carlota-drip] contact enrolled');
      sendCreated(res, { enrollmentId, unsubscribeToken });
    } catch (err) {
      handleRouteError(res, err, 'Failed to enroll contact');
    }
  },
);

router.get('/booking/drip/unsubscribe', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).send('Missing token');
      return;
    }

    const [enrollment] = await db
      .select()
      .from(carlotaDripEnrollmentsTable)
      .where(eq(carlotaDripEnrollmentsTable.unsubscribeToken, token));

    if (!enrollment) {
      res.status(404).send('Subscription not found');
      return;
    }

    await db
      .update(carlotaDripEnrollmentsTable)
      .set({ status: 'unsubscribed', updatedAt: new Date() })
      .where(eq(carlotaDripEnrollmentsTable.enrollmentId, enrollment.enrollmentId));

    await db.insert(carlotaDripEngagementEventsTable).values({
      enrollmentId: enrollment.enrollmentId,
      stepId: 'unsubscribe',
      eventType: 'unsubscribed',
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Unsubscribed</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0b0d;color:#fff;">
        <h2>You have been unsubscribed</h2>
        <p style="color:rgba(255,255,255,0.6);">You will no longer receive emails from this sequence.</p>
      </body>
      </html>
    `);
  } catch (err) {
    handleRouteError(res, err, 'Failed to unsubscribe');
  }
});

router.get('/booking/drip/pixel/open', async (req: Request, res: Response) => {
  try {
    const enrollmentId = req.query.eid as string;
    const stepId = req.query.sid as string;
    if (enrollmentId && stepId) {
      await db.insert(carlotaDripEngagementEventsTable).values({
        enrollmentId,
        stepId,
        eventType: 'opened',
        metadata: { userAgent: req.headers['user-agent'] ?? null, ip: req.ip },
      });
    }
  } catch {
    // fire-and-forget
  }
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
});

router.get('/booking/drip/pixel/click', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  try {
    const enrollmentId = req.query.eid as string;
    const stepId = req.query.sid as string;
    if (enrollmentId && stepId) {
      await db.insert(carlotaDripEngagementEventsTable).values({
        enrollmentId,
        stepId,
        eventType: 'clicked',
        metadata: { url, userAgent: req.headers['user-agent'] ?? null },
      });
    }
  } catch {
    // fire-and-forget
  }
  if (url) {
    res.redirect(302, url);
  } else {
    res.status(204).end();
  }
});

router.post(
  '/booking/drip/checkout-enroll',
  authMiddleware(),
  validateBody(
    z.object({
      sequenceId: z.string().min(1),
      contactEmail: z.string().email(),
      contactName: z.string().optional(),
      stripeSessionId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { sequenceId, contactEmail, contactName, stripeSessionId, metadata } = req.body as {
        sequenceId: string;
        contactEmail: string;
        contactName?: string;
        stripeSessionId?: string;
        metadata?: Record<string, unknown>;
      };

      const [seq] = await db
        .select()
        .from(carlotaDripSequencesTable)
        .where(eq(carlotaDripSequencesTable.sequenceId, sequenceId));

      if (!seq) {
        sendNotFound(res, 'Drip sequence');
        return;
      }

      const existing = await db
        .select()
        .from(carlotaDripEnrollmentsTable)
        .where(
          and(
            eq(carlotaDripEnrollmentsTable.sequenceId, sequenceId),
            eq(carlotaDripEnrollmentsTable.contactEmail, contactEmail),
            eq(carlotaDripEnrollmentsTable.status, 'active'),
          ),
        );

      if (existing.length > 0) {
        sendSuccess(res, { enrollment: existing[0], alreadyEnrolled: true });
        return;
      }

      const enrollmentId = randomUUID();
      const unsubscribeToken = randomBytes(24).toString('hex');
      const [firstStep] = await db
        .select()
        .from(carlotaDripStepsTable)
        .where(
          and(
            eq(carlotaDripStepsTable.sequenceId, sequenceId),
            eq(carlotaDripStepsTable.stepOrder, 1),
          ),
        );

      const nextSendAt = firstStep ? new Date(Date.now() + firstStep.delayDays * 86_400_000) : null;

      await db.insert(carlotaDripEnrollmentsTable).values({
        enrollmentId,
        sequenceId,
        contactEmail,
        contactName: contactName ?? null,
        unsubscribeToken,
        currentStepOrder: 0,
        nextSendAt,
        metadata: {
          ...metadata,
          source: 'stripe_checkout',
          stripeSessionId: stripeSessionId ?? null,
        },
      });

      await db
        .update(carlotaDripSequencesTable)
        .set({
          totalEnrolled: sql`${carlotaDripSequencesTable.totalEnrolled} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(carlotaDripSequencesTable.sequenceId, sequenceId));

      const [enrollment] = await db
        .select()
        .from(carlotaDripEnrollmentsTable)
        .where(eq(carlotaDripEnrollmentsTable.enrollmentId, enrollmentId));

      logger.info(
        { enrollmentId, contactEmail, sequenceId, stripeSessionId },
        '[carlota-drip] checkout enrollment',
      );
      sendCreated(res, { enrollment });
    } catch (err) {
      handleRouteError(res, err, 'Failed to enroll from checkout');
    }
  },
);

router.get('/booking/drip/engagement', async (req: Request, res: Response) => {
  try {
    const sequenceId = req.query.sequenceId as string | undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? '100'), 10), 500);

    let events;
    if (sequenceId) {
      events = await db
        .select()
        .from(carlotaDripEngagementEventsTable)
        .where(
          eq(
            carlotaDripEngagementEventsTable.enrollmentId,
            sql`ANY(SELECT enrollment_id FROM carlota_drip_enrollments WHERE sequence_id = ${sequenceId})`,
          ),
        )
        .orderBy(desc(carlotaDripEngagementEventsTable.createdAt))
        .limit(limit);
    } else {
      events = await db
        .select()
        .from(carlotaDripEngagementEventsTable)
        .orderBy(desc(carlotaDripEngagementEventsTable.createdAt))
        .limit(limit);
    }

    sendSuccess(res, { events });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list engagement events');
  }
});

router.post('/booking/drip/process', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const pending = await db
      .select()
      .from(carlotaDripEnrollmentsTable)
      .where(
        and(
          eq(carlotaDripEnrollmentsTable.status, 'active'),
          lte(carlotaDripEnrollmentsTable.nextSendAt, now),
        ),
      )
      .limit(100);

    let processed = 0;
    let errors = 0;

    for (const enrollment of pending) {
      const nextStepOrder = enrollment.currentStepOrder + 1;

      const [step] = await db
        .select()
        .from(carlotaDripStepsTable)
        .where(
          and(
            eq(carlotaDripStepsTable.sequenceId, enrollment.sequenceId),
            eq(carlotaDripStepsTable.stepOrder, nextStepOrder),
          ),
        );

      if (!step) {
        await db
          .update(carlotaDripEnrollmentsTable)
          .set({
            status: 'completed',
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(carlotaDripEnrollmentsTable.enrollmentId, enrollment.enrollmentId));
        continue;
      }

      const origin = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'http://localhost:5201';
      const unsubscribeUrl = `${origin}/api/booking/drip/unsubscribe?token=${encodeURIComponent(enrollment.unsubscribeToken)}`;

      const openPixelUrl = `${origin}/api/booking/drip/pixel/open?eid=${encodeURIComponent(enrollment.enrollmentId)}&sid=${encodeURIComponent(step.stepId)}`;

      let bodyWithTracking = step.bodyHtml;
      if (step.ctaUrl) {
        const clickUrl = `${origin}/api/booking/drip/pixel/click?eid=${encodeURIComponent(enrollment.enrollmentId)}&sid=${encodeURIComponent(step.stepId)}&url=${encodeURIComponent(step.ctaUrl)}`;
        bodyWithTracking = bodyWithTracking.replace(
          new RegExp(`href=["']${step.ctaUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g'),
          `href="${clickUrl}"`,
        );
      }

      const htmlWithUnsub = `${bodyWithTracking}
        <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
          <a href="${unsubscribeUrl}" style="font-size:11px;color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe</a>
        </div>
        <img src="${openPixelUrl}" width="1" height="1" alt="" style="display:none;" />`;

      try {
        await sendEmail({
          to: enrollment.contactEmail,
          subject: step.subject,
          html: htmlWithUnsub,
          text: step.bodyText ?? '',
        });

        await db.insert(carlotaDripEngagementEventsTable).values({
          enrollmentId: enrollment.enrollmentId,
          stepId: step.stepId,
          eventType: 'sent',
        });

        const nextStep = await db
          .select()
          .from(carlotaDripStepsTable)
          .where(
            and(
              eq(carlotaDripStepsTable.sequenceId, enrollment.sequenceId),
              eq(carlotaDripStepsTable.stepOrder, nextStepOrder + 1),
            ),
          )
          .limit(1);

        const nextSendAt = nextStep[0]
          ? new Date(now.getTime() + nextStep[0].delayDays * 86_400_000)
          : null;

        await db
          .update(carlotaDripEnrollmentsTable)
          .set({
            currentStepOrder: nextStepOrder,
            lastSentAt: now,
            nextSendAt,
            status: nextStep[0] ? 'active' : 'completed',
            completedAt: nextStep[0] ? null : now,
            updatedAt: now,
          })
          .where(eq(carlotaDripEnrollmentsTable.enrollmentId, enrollment.enrollmentId));

        processed++;
      } catch (err) {
        logger.error({ err, enrollmentId: enrollment.enrollmentId }, '[carlota-drip] send failed');
        await db.insert(carlotaDripEngagementEventsTable).values({
          enrollmentId: enrollment.enrollmentId,
          stepId: step.stepId,
          eventType: 'bounced',
          metadata: { error: String(err) },
        });
        errors++;
      }
    }

    logger.info({ processed, errors, pending: pending.length }, '[carlota-drip] batch processed');
    sendSuccess(res, { processed, errors, pending: pending.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to process drip queue');
  }
});

export default router;
