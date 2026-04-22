/**
 * Public anonymous ingest for the analytics engine.
 *
 * Mounted at the TOP of the /api router (before guardianPolicyCheck and the
 * data-services tenantScope guard) so the marketing sites can post conversion
 * funnel events without a session. The client (lib/analytics.ts on
 * szl-holdings) sanitises every property through a strict allow-list before
 * sending — no PII (email, name, message body) is forwarded.
 *
 * The matching public allow-list entries live in:
 *   - middlewares/csrf.ts  → "/api/analytics-engine/events"
 *   - middlewares/global-auth-enforcer.ts → "/api/analytics-engine/events"
 */

import { db } from '@szl-holdings/db';
import { analyticsEventsTable } from '@szl-holdings/db/schema';
import { randomBytes } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { logger } from '../lib/logger';

const router: IRouter = Router();

interface IngestPayload {
  eventName?: string;
  domain?: string;
  sourceApp?: string;
  properties?: Record<string, unknown>;
  dimensions?: Record<string, string>;
  numericValue?: number;
  occurredAt?: string;
  context?: {
    userId?: string;
    sessionId?: string;
    tenantId?: string;
    organizationId?: number;
    deviceType?: string;
    platform?: string;
    url?: string;
    country?: string;
  };
}

router.post('/analytics-engine/events', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as IngestPayload;
    const {
      eventName,
      domain,
      sourceApp,
      properties,
      dimensions,
      numericValue,
      occurredAt,
      context,
    } = body;

    if (!eventName || !domain || !sourceApp) {
      res.status(400).json({ error: 'eventName, domain, and sourceApp are required' });
      return;
    }

    const eventId = `evt_${randomBytes(12).toString('hex')}`;
    await db.insert(analyticsEventsTable).values({
      eventId,
      eventName,
      domain,
      sourceApp,
      sessionId: context?.sessionId,
      userId: context?.userId,
      organizationId: context?.organizationId,
      tenantId: context?.tenantId,
      deviceType: context?.deviceType,
      platform: context?.platform,
      url: context?.url,
      country: context?.country,
      properties: properties ?? {},
      dimensions: dimensions ?? {},
      numericValue,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      serverSide: false,
    });

    res.status(202).json({ ok: true, eventId });
  } catch (err) {
    logger.error({ err }, '[analytics-engine-public] Failed to ingest event');
    res.status(500).json({ error: 'Failed to record event' });
  }
});

router.post('/analytics-engine/events/batch', async (req: Request, res: Response) => {
  try {
    const { events } = (req.body ?? {}) as { events?: IngestPayload[] };
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'events array is required' });
      return;
    }

    const rows = events
      .filter((e) => e.eventName && e.domain && e.sourceApp)
      .map((e) => ({
        eventId: `evt_${randomBytes(12).toString('hex')}`,
        eventName: e.eventName!,
        domain: e.domain!,
        sourceApp: e.sourceApp!,
        sessionId: e.context?.sessionId,
        userId: e.context?.userId,
        organizationId: e.context?.organizationId,
        tenantId: e.context?.tenantId,
        deviceType: e.context?.deviceType,
        platform: e.context?.platform,
        url: e.context?.url,
        country: e.context?.country,
        properties: e.properties ?? {},
        dimensions: e.dimensions ?? {},
        numericValue: e.numericValue,
        occurredAt: e.occurredAt ? new Date(e.occurredAt) : new Date(),
        serverSide: false,
      }));

    if (rows.length > 0) {
      await db.insert(analyticsEventsTable).values(rows);
    }

    res.status(202).json({ ok: true, recorded: rows.length });
  } catch (err) {
    logger.error({ err }, '[analytics-engine-public] Failed to ingest batch events');
    res.status(500).json({ error: 'Failed to record events' });
  }
});

export default router;
