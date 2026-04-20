const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

interface SentryContext {
  userId?: string;
  username?: string;
  email?: string;
  extra?: Record<string, unknown>;
}

let _ctx: SentryContext = {};

function parseDsn(dsn: string): { storeUrl: string; key: string } | null {
  try {
    const url = new URL(dsn);
    const key = url.username;
    const projectId = url.pathname.replace(/^\//, '');
    const host = url.hostname;
    const storeUrl = `https://${host}/api/${projectId}/store/`;
    return { storeUrl, key };
  } catch {
    return null;
  }
}

function buildEvent(
  level: 'error' | 'warning' | 'info',
  error: unknown,
  extra?: Record<string, unknown>,
): object {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const frames = (errorObj.stack ?? '')
    .split('\n')
    .slice(1)
    .map((line) => ({ filename: 'mobile', function: line.trim(), in_app: true }));

  return {
    event_id: Math.random().toString(36).slice(2).padEnd(32, '0'),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    release: 'szl-mobile@1.0.0',
    logger: 'mobile-sentry',
    exception: {
      values: [
        {
          type: errorObj.name || 'Error',
          value: errorObj.message,
          stacktrace: { frames },
        },
      ],
    },
    user: _ctx.userId ? { id: _ctx.userId, username: _ctx.username, email: _ctx.email } : undefined,
    tags: { app: 'szl-mobile', platform: 'expo' },
    extra: { ..._ctx.extra, ...extra },
    sdk: { name: 'szl.mobile.sentry.http', version: '1.0.0' },
  };
}

async function sendToSentry(event: object, key: string, storeUrl: string): Promise<void> {
  try {
    await fetch(storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}, sentry_client=szl-mobile/1.0.0`,
      },
      body: JSON.stringify(event),
    });
  } catch {}
}

export function isSentryEnabled(): boolean {
  return !!DSN && parseDsn(DSN) !== null;
}

export function setSentryUser(ctx: SentryContext): void {
  _ctx = ctx;
}

export function clearSentryUser(): void {
  _ctx = {};
}

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  if (!isSentryEnabled()) return;
  const parsed = parseDsn(DSN);
  if (!parsed) return;
  const event = buildEvent('error', error, extra);
  void sendToSentry(event, parsed.key, parsed.storeUrl);
}

export function captureMessage(
  message: string,
  level: 'error' | 'warning' | 'info' = 'info',
  extra?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) return;
  const parsed = parseDsn(DSN);
  if (!parsed) return;
  const event = buildEvent(level, new Error(message), extra);
  void sendToSentry(event, parsed.key, parsed.storeUrl);
}

export function initSentryGlobalHandlers(): void {
  if (!isSentryEnabled()) {
    console.debug('[sentry] Mobile Sentry disabled — set EXPO_PUBLIC_SENTRY_DSN to enable');
    return;
  }

  if (typeof ErrorUtils !== 'undefined') {
    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      captureException(error, { isFatal: isFatal ?? false, mechanism: 'global_error_handler' });
      previousHandler?.(error, isFatal);
    });
  }

  if (typeof globalThis !== 'undefined' && 'addEventListener' in globalThis) {
    (
      globalThis as typeof globalThis & {
        addEventListener?: (type: string, fn: (e: PromiseRejectionEvent) => void) => void;
      }
    ).addEventListener?.('unhandledrejection', (event: PromiseRejectionEvent) => {
      captureException(event.reason, { mechanism: 'unhandled_promise_rejection' });
    });
  }

  if (
    typeof global !== 'undefined' &&
    typeof (global as Record<string, unknown>).HermesInternal !== 'undefined'
  ) {
    const origTracked = (global as Record<string, unknown>).__trackAsyncError as
      | ((fn: unknown, err: unknown) => void)
      | undefined;
    (global as Record<string, unknown>).__trackAsyncError = (fn: unknown, err: unknown) => {
      captureException(err, { mechanism: 'hermes_async_error' });
      origTracked?.(fn, err);
    };
  }

  console.debug(
    '[sentry] Mobile Sentry HTTP reporter initialized — global errors + promise rejections captured',
  );
}
