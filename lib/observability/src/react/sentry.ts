import * as Sentry from '@sentry/react';

const SENTRY_INIT_KEY = '__szl_sentry_initialized';

function isSentryInitialized(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as Record<string, unknown>)[SENTRY_INIT_KEY];
}

function markSentryInitialized(): void {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)[SENTRY_INIT_KEY] = true;
  }
}

function isValidSentryDsn(dsn: string | undefined): dsn is string {
  if (!dsn) return false;
  try {
    const u = new URL(dsn);
    if (!u.protocol.startsWith('http')) return false;
    if (!u.username) return false;
    if (!/sentry\.io|ingest\./i.test(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

interface SentryConfig {
  appSlug: string;
  dsn?: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

export function initSentry(config: SentryConfig) {
  if (isSentryInitialized() || typeof window === 'undefined') return;
  markSentryInitialized();

  const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
  const rawDsn = config.dsn || env.VITE_SENTRY_DSN;
  const dsn = rawDsn?.startsWith('https://') ? rawDsn : undefined;
  if (!dsn) {
    if (rawDsn) {
    } else {
    }
    setupGlobalHandlers(config.appSlug);
    return;
  }
  if (!isValidSentryDsn(dsn)) {
    setupGlobalHandlers(config.appSlug);
    return;
  }

  Sentry.init({
    dsn,
    environment: config.environment || env.MODE || 'development',
    release: config.release || `${config.appSlug}@${env.VITE_APP_VERSION || '0.0.0'}`,
    sampleRate: config.sampleRate ?? 1.0,
    tracesSampleRate: config.tracesSampleRate ?? 0.2,
    replaysSessionSampleRate: config.replaysSessionSampleRate ?? 0.1,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate ?? 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    beforeSend(event) {
      if (env.DEV) {
      }
      return event;
    },
  });

  Sentry.setTag('app', config.appSlug);
  setupGlobalHandlers(config.appSlug);
}

function setupGlobalHandlers(appSlug: string) {
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    reportError(error, { source: 'global_error_handler', app: appSlug });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    reportError(reason, { source: 'unhandled_rejection', app: appSlug });
  });
}

export function reportError(error: Error, context?: Record<string, string>) {
  if (isSentryInitialized() && Sentry.isInitialized()) {
    Sentry.captureException(error, (context !== undefined ? { tags: context } : {}));
  }
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  if (Sentry.isInitialized()) {
    Sentry.setUser(user);
  }
}

export function clearUser() {
  if (Sentry.isInitialized()) {
    Sentry.setUser(null);
  }
}

export function addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
  if (Sentry.isInitialized()) {
    Sentry.addBreadcrumb({
      message,
      ...(category !== undefined ? { category } : {}),
      ...(data !== undefined ? { data } : {}),
      level: 'info',
    });
  }
}

export function showUserFeedback() {
  if (Sentry.isInitialized()) {
    const eventId = Sentry.lastEventId();
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
  }
}

export { Sentry };
