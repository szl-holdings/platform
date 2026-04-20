import { bodyShape } from '@szl-holdings/contracts/common';
import { db, scheduledNotificationsTable } from '@szl-holdings/db';
import { and, eq, gte } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNoContent,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import type { PushMessagePayload } from '../lib/expo-push';
import { sendPushBroadcast, sendPushToApp, sendPushToUser } from '../lib/expo-push';
import { buildPushMessage, type NotificationTemplate } from '../lib/push-templates';
import {
  listQuerySchema,
  pushNotificationScheduleSchema,
  pushNotificationSendSchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

const VALID_TEMPLATES: NotificationTemplate[] = [
  'aegis_threat_alert',
  'aegis_incident_update',
  'aegis_system_health',
  'vessels_vessel_alert',
  'vessels_compliance_warning',
  'vessels_port_arrival',
  'terra_deal_update',
  'terra_listing_change',
  'terra_distress_signal',
  'carlota_session_reminder',
  'carlota_document_upload',
  'carlota_message',
  'lyte_kpi_alert',
  'lyte_escalation',
  'lyte_milestone',
  'szl_portfolio_alert',
  'szl_investor_update',
  'stephen_content_published',
  'stephen_venture_update',
];

router.post(
  '/push-notifications/send',
  authMiddleware(),
  requireRole('ops'),
  validateBody(pushNotificationSendSchema),
  async (req, res) => {
    try {
      const { target, userId, appId, template, vars, title, body, data } = req.body;

      let payload: PushMessagePayload;

      if (template) {
        if (!VALID_TEMPLATES.includes(template as NotificationTemplate)) {
          sendBadRequest(res, `Unknown template. Valid templates: ${VALID_TEMPLATES.join(', ')}`);
          return;
        }
        payload = buildPushMessage(template as NotificationTemplate, vars ?? {});
      } else {
        if (!title || !body) {
          sendBadRequest(res, 'Either template or both title and body are required');
          return;
        }
        payload = { title, body, data: data ?? {}, sound: 'default' };
      }

      let result;

      if (target === 'user') {
        if (!userId || typeof userId !== 'number') {
          sendBadRequest(res, 'userId is required for user-targeted push');
          return;
        }
        if (template && (!appId || typeof appId !== 'string')) {
          sendBadRequest(
            res,
            'appId is required for user-targeted push when using a template (needed for preference enforcement)',
          );
          return;
        }
        result = await sendPushToUser(userId, payload, {
          templateId: template ?? undefined,
          appId: appId ?? undefined,
        });
      } else if (target === 'app') {
        if (!appId || typeof appId !== 'string') {
          sendBadRequest(res, 'appId is required for app-targeted push');
          return;
        }
        result = await sendPushToApp(appId, payload, { templateId: template ?? undefined });
      } else {
        result = await sendPushBroadcast(payload, { templateId: template ?? undefined });
      }

      sendSuccess(res, {
        sent: result.sent,
        failed: result.failed,
        total: result.sent + result.failed,
        historyId: result.historyId,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to send push notification');
    }
  },
);

router.post(
  '/push-notifications/schedule',
  authMiddleware(),
  requireRole('ops'),
  validateBody(pushNotificationScheduleSchema),
  async (req, res) => {
    try {
      const { target, userId, appId, template, vars, title, body, data, sendAt } = req.body;

      const sendAtDate = new Date(sendAt);
      if (isNaN(sendAtDate.getTime()) || sendAtDate <= new Date()) {
        sendBadRequest(res, 'sendAt must be a valid future timestamp');
        return;
      }

      if (template && !VALID_TEMPLATES.includes(template as NotificationTemplate)) {
        sendBadRequest(res, `Unknown template. Valid templates: ${VALID_TEMPLATES.join(', ')}`);
        return;
      }

      if (!template && (!title || !body)) {
        sendBadRequest(res, 'Either template or both title and body are required');
        return;
      }

      if (target === 'user' && (!userId || typeof userId !== 'number')) {
        sendBadRequest(res, 'userId is required for user-targeted push');
        return;
      }

      if (target === 'user' && template && (!appId || typeof appId !== 'string')) {
        sendBadRequest(
          res,
          'appId is required for user-targeted scheduled push when using a template (needed for preference enforcement)',
        );
        return;
      }

      if (target === 'app' && (!appId || typeof appId !== 'string')) {
        sendBadRequest(res, 'appId is required for app-targeted push');
        return;
      }

      const [job] = await db
        .insert(scheduledNotificationsTable)
        .values({
          userId: userId ?? null,
          appId: appId ?? null,
          target,
          template: template ?? null,
          vars: vars ?? null,
          title: title ?? null,
          body: body ?? null,
          data: data ?? null,
          sendAt: sendAtDate,
          status: 'pending',
        })
        .returning();

      sendCreated(res, job);
    } catch (err) {
      handleRouteError(res, err, 'Failed to schedule push notification');
    }
  },
);

router.get(
  '/push-notifications/scheduled',
  authMiddleware(),
  requireRole('ops'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { status } = req.query as { status?: string };

      type ScheduledStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
      const validStatuses: ScheduledStatus[] = [
        'pending',
        'processing',
        'sent',
        'failed',
        'cancelled',
      ];
      const conditions = [];
      if (status && (validStatuses as string[]).includes(status)) {
        const typedStatus = status as ScheduledStatus;
        conditions.push(eq(scheduledNotificationsTable.status, typedStatus));
      } else {
        conditions.push(
          and(
            gte(scheduledNotificationsTable.sendAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
          )!,
        );
      }

      const jobs = await db
        .select()
        .from(scheduledNotificationsTable)
        .where(conditions.length === 1 ? conditions[0] : undefined)
        .limit(100);

      sendSuccess(res, jobs);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list scheduled notifications');
    }
  },
);

router.delete(
  '/push-notifications/scheduled/:id',
  validateBody(bodyShape({})),
  authMiddleware(),
  requireRole('ops'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        sendBadRequest(res, 'Invalid id');
        return;
      }

      const [existing] = await db
        .select()
        .from(scheduledNotificationsTable)
        .where(eq(scheduledNotificationsTable.id, id));

      if (!existing) {
        sendNotFound(res, 'Scheduled notification');
        return;
      }

      if (existing.status !== 'pending') {
        sendBadRequest(res, `Cannot cancel notification with status: ${existing.status}`);
        return;
      }

      await db
        .update(scheduledNotificationsTable)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(scheduledNotificationsTable.id, id));

      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to cancel scheduled notification');
    }
  },
);

router.get(
  '/push-notifications/templates',
  authMiddleware(),
  requireRole('ops'),
  async (req, res) => {
    sendSuccess(res, {
      templates: VALID_TEMPLATES,
      domains: {
        aegis: VALID_TEMPLATES.filter((t) => t.startsWith('aegis_')),
        vessels: VALID_TEMPLATES.filter((t) => t.startsWith('vessels_')),
        terra: VALID_TEMPLATES.filter((t) => t.startsWith('terra_')),
        carlota: VALID_TEMPLATES.filter((t) => t.startsWith('carlota_')),
        lyte: VALID_TEMPLATES.filter((t) => t.startsWith('lyte_')),
        szl: VALID_TEMPLATES.filter((t) => t.startsWith('szl_')),
        stephen: VALID_TEMPLATES.filter((t) => t.startsWith('stephen_')),
      },
    });
  },
);

export default router;
