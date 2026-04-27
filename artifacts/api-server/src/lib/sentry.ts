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
      // --- Scrub sensitive request headers ---
      if (event.request?.headers) {
        const sanitized = { ...event.request.headers };
        const SCRUBBED_HEADERS = [
          'authorization',
          'cookie',
          'x-internal-token',
          'x-api-key',
          'x-csrf-token',
          'x-szl-correlation-id',
          'set-cookie',
          'proxy-authorization',
        ];
        for (const h of SCRUBBED_HEADERS) {
          if (h in sanitized) sanitized[h] = '[REDACTED]';
        }
        event.request.headers = sanitized;
      }

      // --- Scrub sensitive body fields ---
      if (event.request?.data && typeof event.request.data === 'object') {
        const SCRUBBED_BODY_KEYS = new Set([
          'password',
          'currentPassword',
          'newPassword',
          'token',
          'accessToken',
          'access_token',
          'refreshToken',
          'refresh_token',
          'idToken',
          'id_token',
          'apiKey',
          'api_key',
          'secret',
          'clientSecret',
          'client_secret',
          'sessionToken',
          'session_token',
          'privateKey',
          'private_key',
          'webhookSecret',
          'webhook_secret',
          'ssn',
          'creditCard',
          'credit_card',
          'cardNumber',
          'card_number',
          'cvv',
          'pin',
        ]);
        const scrubValue = (v: unknown): unknown => {
          if (v === null || typeof v !== 'object') return v;
          if (Array.isArray(v)) return v.map(scrubValue);
          return scrubObject(v as Record<string, unknown>);
        };
        const scrubObject = (obj: Record<string, unknown>): Record<string, unknown> => {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(obj)) {
            out[k] = SCRUBBED_BODY_KEYS.has(k) ? '[REDACTED]' : scrubValue(v);
          }
          return out;
        };
        event.request.data = scrubObject(event.request.data as Record<string, unknown>);
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
