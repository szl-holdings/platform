import { serverTelemetry } from '@szl-holdings/observability';
import { type Request, type Response, Router } from 'express';
import { logger } from '../lib/logger';
import { analyticsEventSchema, validateBody } from '../lib/validation';

const analyticsRouter = Router();

const ALLOWED_EVENTS = new Set([
  'user_signed_up',
  'user_logged_in',
  'user_login_failed',
  'user_logged_out',
  'session_expired',
  'dashboard_viewed',
  'page_viewed',
  'search_executed',
  'filter_applied',
  'signal_viewed',
  'signal_dismissed',
  'signal_escalated',
  'alert_acknowledged',
  'alert_config_changed',
  'action_created',
  'action_approved',
  'action_rejected',
  'workflow_started',
  'workflow_completed',
  'workflow_failed',
  'approval_decision',
  'subscription_started',
  'subscription_upgraded',
  'subscription_downgraded',
  'subscription_cancelled',
  'payment_succeeded',
  'payment_failed',
  'invoice_generated',
  'trial_started',
  'trial_converted',
  'contact_form_submitted',
  'demo_requested',
  'demo_scheduled',
  'demo_completed',
  'ai_inference_called',
  'ai_recommendation_shown',
  'ai_recommendation_acted_on',
  'ai_provider_failure',
  'tour_started',
  'tour_completed',
  'tour_skipped',
  'tour_step_viewed',
  'checklist_item_completed',
  'checklist_dismissed',
  'checklist_viewed',
  'help_tip_opened',
  'changelog_viewed',
]);

const ALLOWED_PLATFORMS = new Set([
  'lyte',
  'aegis',
  'terra',
  'vessels',
  'carlota_jo',
  'admin',
  'api',
  'szl',
]);

analyticsRouter.post(
  '/analytics/event',
  validateBody(analyticsEventSchema),
  (req: Request, res: Response) => {
    try {
      const { event, platform, timestamp, properties } = req.body;

      if (!ALLOWED_EVENTS.has(event)) {
        res.status(400).json({ error: 'unknown event type' });
        return;
      }

      const resolvedPlatform = platform && ALLOWED_PLATFORMS.has(platform) ? platform : 'unknown';

      const eventPayload = {
        type: event,
        metadata: {
          platform: resolvedPlatform,
          timestamp: timestamp ?? new Date().toISOString(),
          userId: (req as Request & { user?: { id?: number } }).user?.id,
          ...(properties && typeof properties === 'object' ? properties : {}),
        },
      };

      serverTelemetry.recordBusinessEvent(eventPayload);

      logger.debug({ event, platform: resolvedPlatform }, '[analytics] event recorded');

      res.status(202).json({ ok: true });
    } catch (err) {
      logger.warn({ err }, '[analytics] Failed to record event');
      res.status(500).json({ error: 'Failed to record event' });
    }
  },
);

analyticsRouter.get('/analytics/summary', (_req: Request, res: Response) => {
  try {
    const snapshot = serverTelemetry.getSnapshot();
    res.json({
      timestamp: new Date().toISOString(),
      businessEvents: snapshot.businessEvents,
      requestCount: snapshot.requestCount,
      errorRate: snapshot.errorRate,
      workflowCompletions: snapshot.workflowCompletions,
      jobFailures: snapshot.jobFailures,
    });
  } catch (err) {
    logger.warn({ err }, '[analytics] Failed to fetch summary');
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

export default analyticsRouter;
