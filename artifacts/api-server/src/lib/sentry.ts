import * as Sentry from '@sentry/node';

let initialized = false;

export function initServerSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: `szl-api@${process.env.npm_package_version ?? '0.0.0'}`,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0.1'),
    integrations: [
      Sentry.httpIntegration({ breadcrumbs: true }),
      Sentry.expressIntegration(),
      Sentry.postgresIntegration(),
      Sentry.onUncaughtExceptionIntegration({ exitEvenIfOtherHandlersAreRegistered: false }),
      Sentry.onUnhandledRejectionIntegration({ mode: 'warn' }),
    ],
    ignoreErrors: ['ECONNRESET', 'EPIPE', 'ETIMEDOUT'],
    beforeSend(event) {
      if (event.request?.headers) {
        const sanitized = { ...event.request.headers };
        delete sanitized.authorization;
        delete sanitized.cookie;
        delete sanitized['x-internal-token'];
        event.request.headers = sanitized;
      }
      return event;
    },
  });
}

export function captureServerException(error: unknown, context?: Record<string, unknown>): void {
  if (Sentry.isInitialized()) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  }
}

export function addServerBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, unknown>,
): void {
  if (Sentry.isInitialized()) {
    Sentry.addBreadcrumb({ message, category, data, level: 'info' });
  }
}

export function flushSentry(timeoutMs = 2000): Promise<boolean> {
  if (Sentry.isInitialized()) {
    return Sentry.flush(timeoutMs);
  }
  return Promise.resolve(true);
}

export { Sentry };
