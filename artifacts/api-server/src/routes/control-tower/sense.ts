import { bodyShape } from '@szl-holdings/contracts/common';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendSuccess } from '../../lib/api-response';
import { agentEventBus } from '../../lib/event-bus';
import { listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import { requireRole } from '../../middlewares/auth';
import { buildSignalBusSnapshot } from './shared';

const router = Router();

router.get(
  '/control-tower/sense/signals',
  validateQuery(listQuerySchema),
  (req: Request, res: Response) => {
    try {
      const domain = req.query.domain as string | undefined;
      const severity = req.query.severity as string | undefined;
      const limit = Math.min(200, parseInt(String(req.query.limit ?? '50'), 10));
      let events = agentEventBus.getHistory({ limit: 200 });
      if (domain) events = events.filter((e) => e.sourceDomain === domain);
      if (severity) events = events.filter((e) => e.severity === severity);
      events = events.slice(0, limit);
      const snapshot = buildSignalBusSnapshot();
      sendSuccess(res, { layer: 'sense', snapshot, events, filteredCount: events.length });
    } catch (err) {
      handleRouteError(res, err, 'control-tower/sense/signals');
    }
  },
);

router.post(
  '/control-tower/sense/emit',
  requireRole('super_admin', 'ops', 'exec'),
  validateBody(
    bodyShape({
      correlationId: z.unknown().optional(),
      payload: z.unknown().optional(),
      severity: z.unknown().optional(),
      sourceAgent: z.unknown().optional(),
      sourceDomain: z.unknown().optional(),
      type: z.unknown().optional(),
    }),
  ),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { type, sourceAgent, sourceDomain, payload, severity, correlationId } = req.body as {
        type?: string;
        sourceAgent?: string;
        sourceDomain?: string;
        payload?: Record<string, unknown>;
        severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
        correlationId?: string;
      };
      if (!type || !sourceAgent || !sourceDomain) {
        sendBadRequest(res, 'type, sourceAgent, and sourceDomain are required');
        return;
      }
      const event = await agentEventBus.publish({
        type: type as Parameters<typeof agentEventBus.publish>[0]['type'],
        sourceAgent,
        sourceDomain,
        payload: payload ?? {},
        severity: severity ?? 'info',
        correlationId,
      });
      sendSuccess(res, { event, emittedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'control-tower/sense/emit');
    }
  },
);

router.get('/control-tower/sense/domain-snapshot', (_req: Request, res: Response) => {
  try {
    const signals: unknown[] = [];
    sendSuccess(res, {
      layer: 'sense',
      signals,
      totalSignals: signals.length,
      domains: ['firestorm', 'vessels', 'lyte', 'terra'],
      snapshotAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'control-tower/sense/domain-snapshot');
  }
});

export function register(r: IRouter): void {
  r.use(router);
}
