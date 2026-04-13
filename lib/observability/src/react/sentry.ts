import * as Sentry from "@sentry/react";

let sentryInitialized = false;

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
  if (sentryInitialized || typeof window === "undefined") return;
  sentryInitialized = true;

  const env: Record<string, string | undefined> =
    typeof import.meta !== "undefined" && (import.meta as Record<string, unknown>).env
      ? (import.meta as Record<string, Record<string, string | undefined>>).env
      : {};
  const dsn = config.dsn || env["VITE_SENTRY_DSN"];
  if (!dsn) {
    console.debug(`[${config.appSlug}] Sentry DSN not configured — error tracking in console-only mode`);
    setupGlobalHandlers(config.appSlug);
    return;
  }

  Sentry.init({
    dsn,
    environment: config.environment || env["MODE"] || "development",
    release: config.release || `${config.appSlug}@${env["VITE_APP_VERSION"] || "0.0.0"}`,
    sampleRate: config.sampleRate ?? 1.0,
    tracesSampleRate: config.tracesSampleRate ?? 0.2,
    replaysSessionSampleRate: config.replaysSessionSampleRate ?? 0.1,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate ?? 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    beforeSend(event) {
      if (env["DEV"]) {
        console.debug("[Sentry] Would send event:", event.event_id);
      }
      return event;
    },
  });

  Sentry.setTag("app", config.appSlug);
  setupGlobalHandlers(config.appSlug);
}

function setupGlobalHandlers(appSlug: string) {
  window.addEventListener("error", (event) => {
    const error = event.error || new Error(event.message);
    reportError(error, { source: "global_error_handler", app: appSlug });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    reportError(reason, { source: "unhandled_rejection", app: appSlug });
  });
}

export function reportError(error: Error, context?: Record<string, string>) {
  if (sentryInitialized && Sentry.isInitialized()) {
    Sentry.captureException(error, { tags: context });
  }
  console.error("[ErrorTracking]", error.message, context);
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
    Sentry.addBreadcrumb({ message, category, data, level: "info" });
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
