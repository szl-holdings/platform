import type { AnalyticsEventContext, TrackEventPayload } from './types.js';

// ---------------------------------------------------------------------------
// Server SDK — Express middleware for server-side event tracking
// ---------------------------------------------------------------------------

export interface ServerAnalyticsSDK {
  track: (event: TrackEventPayload) => Promise<void>;
  trackBatch: (events: TrackEventPayload[]) => Promise<void>;
  middleware: () => (req: unknown, res: unknown, next: () => void) => void;
}

export interface ServerAnalyticsOptions {
  sourceApp: string;
  domain: string;
  captureApiCalls?: boolean;
  excludePaths?: string[];
}

const SERVER_QUEUE: TrackEventPayload[] = [];
const SERVER_FLUSH_SIZE = 50;

export function createServerAnalyticsSDK(
  options: ServerAnalyticsOptions,
  persistFn: (events: TrackEventPayload[]) => Promise<void>,
): ServerAnalyticsSDK {
  const {
    sourceApp,
    domain,
    captureApiCalls = true,
    excludePaths = ['/health', '/metrics', '/api/health'],
  } = options;

  const flushServerQueue = async () => {
    if (SERVER_QUEUE.length === 0) return;
    const batch = SERVER_QUEUE.splice(0, SERVER_FLUSH_SIZE);
    try {
      await persistFn(batch);
    } catch {
      SERVER_QUEUE.unshift(...batch);
    }
  };

  setInterval(() => {
    flushServerQueue().catch(() => {});
  }, 5_000);

  const track = async (event: TrackEventPayload): Promise<void> => {
    SERVER_QUEUE.push({ ...event, serverSide: true, sourceApp, domain });
    if (SERVER_QUEUE.length >= SERVER_FLUSH_SIZE) {
      await flushServerQueue();
    }
  };

  const trackBatch = async (events: TrackEventPayload[]): Promise<void> => {
    for (const event of events) {
      SERVER_QUEUE.push({ ...event, serverSide: true, sourceApp, domain });
    }
    if (SERVER_QUEUE.length >= SERVER_FLUSH_SIZE) {
      await flushServerQueue();
    }
  };

  const middleware = () => {
    return (req: unknown, res: unknown, next: () => void) => {
      if (!captureApiCalls) {
        next();
        return;
      }
      const request = req as {
        method: string;
        path: string;
        url: string;
        user?: { id?: number };
        ip?: string;
      };
      const response = res as { statusCode: number; on: (event: string, cb: () => void) => void };
      const startTime = Date.now();

      if (excludePaths.some((p) => request.path?.startsWith(p))) {
        next();
        return;
      }

      response.on('finish', () => {
        const durationMs = Date.now() - startTime;
        SERVER_QUEUE.push({
          eventName: 'api_request',
          sourceApp,
          domain,
          serverSide: true,
          properties: {
            method: request.method,
            path: request.path,
            statusCode: response.statusCode,
            durationMs,
          },
          ...(request.user?.id ? { context: { userId: String(request.user.id) } } : {}),
          numericValue: durationMs,
          occurredAt: new Date(),
        });
      });

      next();
    };
  };

  return { track, trackBatch, middleware };
}

// ---------------------------------------------------------------------------
// Enrichment helpers
// ---------------------------------------------------------------------------

export function enrichServerEvent(
  event: TrackEventPayload,
  context: Partial<AnalyticsEventContext>,
): TrackEventPayload {
  return {
    ...event,
    context: { ...event.context, ...context },
  };
}

// ---------------------------------------------------------------------------
// Client-side event builder (framework-agnostic, no React deps)
// Used by non-React clients and vanilla JS environments
// ---------------------------------------------------------------------------

export interface ClientAnalyticsConfig {
  sourceApp: string;
  domain: string;
  apiBase?: string;
  enabled?: boolean;
}

const CLIENT_QUEUE: Array<TrackEventPayload & { queuedAt: number }> = [];
const FLUSH_INTERVAL_MS = 8_000;
const FLUSH_BATCH_SIZE = 25;
const MAX_QUEUE_SIZE = 200;

export function createClientAnalytics(config: ClientAnalyticsConfig) {
  const { sourceApp, domain, apiBase = '/api', enabled = true } = config;

  let _flushTimer: ReturnType<typeof setInterval> | null = null;

  function getSessionId(): string {
    const key = '__ame_sid';
    try {
      let sid = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) || null;
      if (!sid) {
        sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, sid);
      }
      return sid;
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
  }

  async function flush(): Promise<void> {
    if (CLIENT_QUEUE.length === 0) return;
    const batch = CLIENT_QUEUE.splice(0, FLUSH_BATCH_SIZE);
    try {
      const response = await fetch(`${apiBase}/analytics-engine/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        signal: AbortSignal.timeout(8_000),
        keepalive: true,
      });
      if (!response.ok) {
        CLIENT_QUEUE.unshift(...batch);
      }
    } catch {
      CLIENT_QUEUE.unshift(...batch);
      if (CLIENT_QUEUE.length > MAX_QUEUE_SIZE) {
        CLIENT_QUEUE.splice(0, CLIENT_QUEUE.length - MAX_QUEUE_SIZE);
      }
    }
  }

  function start(): void {
    if (_flushTimer) return;
    _flushTimer = setInterval(() => {
      flush().catch(() => {});
    }, FLUSH_INTERVAL_MS);
  }

  function stop(): void {
    if (_flushTimer) {
      clearInterval(_flushTimer);
      _flushTimer = null;
    }
  }

  function track(
    eventName: string,
    properties?: Record<string, unknown>,
    overrides?: Partial<TrackEventPayload>,
  ): void {
    if (!enabled) return;
    const sessionId = getSessionId();
    const event: TrackEventPayload & { queuedAt: number } = {
      eventName,
      sourceApp,
      domain,
      ...(properties !== undefined ? { properties } : {}),
      serverSide: false,
      context: {
        sessionId,
        ...(typeof window !== 'undefined' ? { url: window.location.href } : {}),
        ...(typeof document !== 'undefined' ? { referrer: document.referrer } : {}),
        ...(typeof navigator !== 'undefined' ? { userAgent: navigator.userAgent } : {}),
      },
      ...overrides,
      queuedAt: Date.now(),
    };
    if (CLIENT_QUEUE.length < MAX_QUEUE_SIZE) {
      CLIENT_QUEUE.push(event);
    }
  }

  function page(pageName: string, properties?: Record<string, unknown>): void {
    track('page_viewed', {
      pageName,
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      ...properties,
    });
  }

  function identify(userId: string, traits?: Record<string, unknown>): void {
    track('user_identified', traits, { context: { userId } });
  }

  return { track, page, identify, flush, start, stop };
}
