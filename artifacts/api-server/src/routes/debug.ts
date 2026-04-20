import * as Sentry from '@sentry/node';
import { type Request, type Response, Router } from 'express';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/debug/sentry-test', authMiddleware(), (req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    res
      .status(403)
      .json({ error: 'Test error endpoint is only available in non-production environments' });
    return;
  }

  const testError = new Error(
    `[Sentry Test] Deliberate test error triggered from /api/debug/sentry-test at ${new Date().toISOString()}`,
  );
  testError.name = 'SentryTestError';

  if (Sentry.isInitialized()) {
    Sentry.withScope((scope) => {
      scope.setTag('test', 'true');
      scope.setTag(
        'triggered_by',
        (req as Request & { user?: { id?: string } }).user?.id ?? 'anonymous',
      );
      scope.setExtra('endpoint', '/api/debug/sentry-test');
      scope.setExtra('timestamp', new Date().toISOString());
      scope.setLevel('error');
      Sentry.captureException(testError);
    });
    logger.warn('[sentry-test] Test error captured and forwarded to Sentry');
    res.status(200).json({
      status: 'captured',
      message: 'Test error successfully captured and sent to Sentry',
      sentryInitialized: true,
      dsn_configured: !!process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
      instructions:
        'Check your Sentry project dashboard — the error should appear within ~60 seconds.',
    });
  } else {
    logger.warn('[sentry-test] Sentry not initialized — SENTRY_DSN may not be set');
    res.status(200).json({
      status: 'not_captured',
      message: 'Sentry is not initialized. Make sure SENTRY_DSN is set.',
      sentryInitialized: false,
      dsn_configured: !!process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/debug/integrations', authMiddleware(), (_req: Request, res: Response) => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    res.status(403).json({
      error: 'Integration status endpoint is only available in non-production environments',
    });
    return;
  }

  res.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
    integrations: {
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live')
          ? 'live'
          : process.env.STRIPE_SECRET_KEY
            ? 'test'
            : 'not_configured',
        webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
        publishable_key_configured: !!process.env.STRIPE_PUBLISHABLE_KEY,
      },
      sentry: {
        server_configured: !!process.env.SENTRY_DSN,
        initialized: Sentry.isInitialized(),
        test_endpoint: '/api/debug/sentry-test',
      },
      posthog: {
        server_configured: !!process.env.POSTHOG_API_KEY,
        frontend_key_configured: !!process.env.VITE_POSTHOG_KEY,
      },
      amplitude: {
        server_configured: !!process.env.AMPLITUDE_API_KEY,
        frontend_key_configured: !!process.env.VITE_AMPLITUDE_API_KEY,
      },
      google_maps: {
        configured: !!process.env.GOOGLE_MAPS_API_KEY,
        usage:
          'satellite map proxy (/api/maps/static), geocoding (/api/maps/geocode), server-side only (key never exposed to browser)',
        static_map_endpoint:
          '/api/maps/static?center=LAT,LNG&zoom=15&size=600x400&maptype=satellite',
        geocode_endpoint: '/api/maps/geocode?address=ADDRESS',
        frontend_integration:
          'terra property walkthrough shows satellite imagery via /api/maps/static proxy',
      },
      mapbox: {
        frontend_token_configured: !!process.env.VITE_MAPBOX_TOKEN,
        usage: 'terra and vessels interactive vector maps',
      },
    },
  });
});

export default router;
