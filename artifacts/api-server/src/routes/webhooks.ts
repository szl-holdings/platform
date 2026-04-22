import { bodyShape } from '@szl-holdings/contracts/common';
import crypto from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateExternalUrl, validateExternalUrlSync } from '../lib/ssrf-guard';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

function ssrfSafeUrl(url: string): boolean {
  const result = validateExternalUrlSync(url);
  return result.valid;
}

const webhookEndpointSchema = z.object({
  url: z.string().url('url must be a valid URL').refine(ssrfSafeUrl, {
    message:
      'Webhook URL targets a disallowed host — private, internal, or non-HTTPS addresses are not permitted',
  }),
  eventTypes: z
    .union([z.literal('*'), z.array(z.string())])
    .optional()
    .default('*'),
  description: z.string().optional(),
});

const webhookEndpointUpdateSchema = z.object({
  url: z
    .string()
    .url('url must be a valid URL')
    .refine(ssrfSafeUrl, {
      message:
        'Webhook URL targets a disallowed host — private, internal, or non-HTTPS addresses are not permitted',
    })
    .optional(),
  eventTypes: z.union([z.literal('*'), z.array(z.string())]).optional(),
  active: z.boolean().optional(),
  description: z.string().optional(),
});

const router: IRouter = Router();

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  eventTypes: string[] | '*';
  active: boolean;
  description?: string;
  createdAt: number;
  lastDeliveredAt?: number;
  failureCount: number;
}

interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed';
  statusCode?: number;
  attempt: number;
  deliveredAt?: number;
  error?: string;
}

const webhookEndpoints = new Map<string, WebhookEndpoint>();
const webhookDeliveries: WebhookDelivery[] = [];
const MAX_DELIVERIES = 500;

export const SZL_EVENT_TYPES = [
  'payment.succeeded',
  'payment.failed',
  'subscription.created',
  'subscription.updated',
  'subscription.cancelled',
  'alert.raised',
  'alert.resolved',
  'workflow.started',
  'workflow.completed',
  'workflow.failed',
  'user.created',
  'user.updated',
  'deal.created',
  'deal.updated',
  'vulnerability.detected',
  'vessel.anomaly',
  'health.degraded',
  'health.restored',
  'ingestion.completed',
  'api.error_spike',
  'decision.created',
  'decision.approved',
  'decision.executed',
  'decision.proved',
  'decision.outcome_recorded',
] as const;

export type SzlEventType = (typeof SZL_EVENT_TYPES)[number];

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

function signPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = `${timestamp}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return `t=${timestamp},v1=${sig}`;
}

export async function deliverWebhookEvent(
  eventType: string,
  payload: Record<string, unknown>,
  options: { correlationId?: string } = {},
): Promise<void> {
  const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const wrappedPayload = {
    id: eventId,
    type: eventType,
    created: Math.floor(Date.now() / 1000),
    data: payload,
    ...(options.correlationId ? { correlation_id: options.correlationId } : {}),
  };

  for (const endpoint of webhookEndpoints.values()) {
    if (!endpoint.active) continue;

    const eventMatches =
      endpoint.eventTypes === '*' ||
      (Array.isArray(endpoint.eventTypes) && endpoint.eventTypes.includes(eventType));

    if (!eventMatches) continue;

    const delivery: WebhookDelivery = {
      id: `del_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      endpointId: endpoint.id,
      eventType,
      payload: wrappedPayload,
      status: 'pending',
      attempt: 1,
    };

    webhookDeliveries.unshift(delivery);
    if (webhookDeliveries.length > MAX_DELIVERIES) {
      webhookDeliveries.length = MAX_DELIVERIES;
    }

    setImmediate(async () => {
      await attemptWebhookDelivery(delivery, endpoint);
    });
  }
}

async function attemptWebhookDelivery(
  delivery: WebhookDelivery,
  endpoint: WebhookEndpoint,
  retryAttempt = 1,
): Promise<void> {
  // Re-validate URL with async DNS resolution before each delivery attempt.
  // Catches hostnames that resolve to internal/private addresses (DNS rebinding)
  // that sync validation at registration time cannot detect.
  const urlCheck = await validateExternalUrl(endpoint.url);
  if (!urlCheck.valid) {
    delivery.status = 'failed';
    delivery.error = `SSRF guard blocked delivery: ${urlCheck.reason}`;
    delivery.deliveredAt = Date.now();
    delivery.attempt = retryAttempt;
    endpoint.failureCount++;
    logger.error(
      { endpointId: endpoint.id, url: endpoint.url, reason: urlCheck.reason },
      'Webhook delivery blocked by SSRF guard (DNS-aware check)',
    );
    return;
  }

  const bodyStr = JSON.stringify(delivery.payload);
  const signature = signPayload(bodyStr, endpoint.secret);

  const maxRetries = 3;
  const retryDelays = [0, 30_000, 300_000];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SZL-Event': delivery.eventType,
        'X-SZL-Signature': signature,
        'X-SZL-Delivery': delivery.id,
        'User-Agent': 'SZL-Webhooks/1.0',
      },
      body: bodyStr,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    delivery.status = res.ok ? 'delivered' : 'failed';
    delivery.statusCode = res.status;
    delivery.deliveredAt = Date.now();
    delivery.attempt = retryAttempt;

    if (res.ok) {
      endpoint.lastDeliveredAt = Date.now();
      endpoint.failureCount = 0;
      logger.info(
        { endpointId: endpoint.id, eventType: delivery.eventType, deliveryId: delivery.id },
        'Webhook delivered',
      );
    } else {
      endpoint.failureCount++;
      logger.warn(
        { endpointId: endpoint.id, status: res.status, attempt: retryAttempt },
        'Webhook delivery failed',
      );

      if (retryAttempt < maxRetries) {
        const delay = retryDelays[retryAttempt] ?? 300_000;
        setTimeout(() => attemptWebhookDelivery(delivery, endpoint, retryAttempt + 1), delay);
      }
    }
  } catch (err) {
    delivery.status = 'failed';
    delivery.error = (err as Error).message;
    delivery.attempt = retryAttempt;
    endpoint.failureCount++;

    logger.error({ err, endpointId: endpoint.id, attempt: retryAttempt }, 'Webhook delivery error');

    if (retryAttempt < maxRetries) {
      const delay = retryDelays[retryAttempt] ?? 300_000;
      setTimeout(() => attemptWebhookDelivery(delivery, endpoint, retryAttempt + 1), delay);
    }
  }
}

router.get('/webhooks/endpoints', authMiddleware(), async (_req, res) => {
  try {
    const endpoints = Array.from(webhookEndpoints.values()).map((e) => ({
      id: e.id,
      url: e.url,
      eventTypes: e.eventTypes,
      active: e.active,
      description: e.description,
      createdAt: e.createdAt,
      lastDeliveredAt: e.lastDeliveredAt,
      failureCount: e.failureCount,
    }));
    sendSuccess(res, endpoints);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list webhook endpoints');
  }
});

router.post(
  '/webhooks/endpoints',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = webhookEndpointSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(', '), 400);
      return;
    }
    try {
      const { url, eventTypes, description } = parsed.data;

      const id = `whe_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      const secret = generateWebhookSecret();

      const endpoint: WebhookEndpoint = {
        id,
        url,
        secret,
        eventTypes: eventTypes ?? '*',
        active: true,
        description,
        createdAt: Date.now(),
        failureCount: 0,
      };

      webhookEndpoints.set(id, endpoint);
      logger.info({ endpointId: id, url }, 'Webhook endpoint registered');

      res.status(201).json({
        success: true,
        data: {
          id,
          url,
          secret,
          eventTypes: endpoint.eventTypes,
          active: endpoint.active,
          description,
          createdAt: endpoint.createdAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create webhook endpoint');
    }
  },
);

router.patch(
  '/webhooks/endpoints/:id',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = webhookEndpointUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(', '), 400);
      return;
    }
    try {
      const endpoint = webhookEndpoints.get(String(req.params.id));
      if (!endpoint) {
        sendNotFound(res, 'Webhook endpoint');
        return;
      }

      const { url, eventTypes, active, description } = parsed.data;

      if (url !== undefined) endpoint.url = url;
      if (eventTypes !== undefined) endpoint.eventTypes = eventTypes;
      if (active !== undefined) endpoint.active = active;
      if (description !== undefined) endpoint.description = description;

      sendSuccess(res, {
        id: endpoint.id,
        url: endpoint.url,
        eventTypes: endpoint.eventTypes,
        active: endpoint.active,
        description: endpoint.description,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update webhook endpoint');
    }
  },
);

router.delete(
  '/webhooks/endpoints/:id',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      if (!webhookEndpoints.has(String(req.params.id))) {
        sendNotFound(res, 'Webhook endpoint');
        return;
      }
      webhookEndpoints.delete(String(req.params.id));
      res.status(204).send();
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete webhook endpoint');
    }
  },
);

router.post(
  '/webhooks/endpoints/:id/ping',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const endpoint = webhookEndpoints.get(String(req.params.id));
      if (!endpoint) {
        sendNotFound(res, 'Webhook endpoint');
        return;
      }

      const pingDelivery: WebhookDelivery = {
        id: `ping_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        endpointId: endpoint.id,
        eventType: 'ping',
        payload: {
          id: `ping_${Date.now()}`,
          type: 'ping',
          created: Math.floor(Date.now() / 1000),
          data: { message: 'SZL webhook ping test' },
        },
        status: 'pending',
        attempt: 1,
      };

      await attemptWebhookDelivery(pingDelivery, endpoint);

      sendSuccess(res, {
        delivered: pingDelivery.status === 'delivered',
        statusCode: pingDelivery.statusCode,
        error: pingDelivery.error,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to ping webhook endpoint');
    }
  },
);

router.get(
  '/webhooks/deliveries',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const endpointId = req.query.endpointId as string | undefined;
      const eventType = req.query.eventType as string | undefined;
      const limit = Math.min(parseInt((req.query.limit as string) ?? '50', 10), 200);

      let deliveries = webhookDeliveries;
      if (endpointId) {
        deliveries = deliveries.filter((d) => d.endpointId === endpointId);
      }
      if (eventType) {
        const prefix = eventType.endsWith('.*') ? eventType.slice(0, -2) : null;
        deliveries = deliveries.filter((d) =>
          prefix ? d.eventType.startsWith(`${prefix}.`) : d.eventType === eventType,
        );
      }

      sendSuccess(
        res,
        deliveries.slice(0, limit).map((d) => ({
          id: d.id,
          endpointId: d.endpointId,
          eventType: d.eventType,
          status: d.status,
          statusCode: d.statusCode,
          attempt: d.attempt,
          deliveredAt: d.deliveredAt,
          error: d.error,
        })),
      );
    } catch (err) {
      handleRouteError(res, err, 'Failed to list webhook deliveries');
    }
  },
);

router.post(
  '/webhooks',
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    const parsed = webhookEndpointSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(', '), 400);
      return;
    }
    try {
      const { url, eventTypes, description } = parsed.data;
      const id = `whe_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      const secret = generateWebhookSecret();
      const endpoint: WebhookEndpoint = {
        id,
        url,
        secret,
        eventTypes: eventTypes ?? '*',
        active: true,
        description,
        createdAt: Date.now(),
        failureCount: 0,
      };
      webhookEndpoints.set(id, endpoint);
      logger.info({ endpointId: id, url }, 'Webhook endpoint registered via POST /webhooks');
      res.status(201).json({
        success: true,
        data: {
          id,
          url,
          secret,
          eventTypes: endpoint.eventTypes,
          active: endpoint.active,
          description,
          createdAt: endpoint.createdAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create webhook endpoint');
    }
  },
);

router.get('/webhooks', authMiddleware(), async (_req, res) => {
  try {
    const endpoints = Array.from(webhookEndpoints.values()).map((e) => ({
      id: e.id,
      url: e.url,
      eventTypes: e.eventTypes,
      active: e.active,
      description: e.description,
      createdAt: e.createdAt,
      lastDeliveredAt: e.lastDeliveredAt,
      failureCount: e.failureCount,
    }));
    sendSuccess(res, endpoints);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list webhook endpoints');
  }
});

router.get('/webhooks/event-types', (_req, res) => {
  sendSuccess(res, { eventTypes: SZL_EVENT_TYPES });
});

export default router;
