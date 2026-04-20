import { useCallback, useEffect, useRef } from 'react';
import { createClientAnalytics } from '../analytics/event-sdk.js';
import type { TrackEventPayload } from '../analytics/types.js';

// ---------------------------------------------------------------------------
// React hook for client-side analytics event tracking
// ---------------------------------------------------------------------------

export interface UseAnalyticsEngineOptions {
  sourceApp: string;
  domain: string;
  apiBase?: string;
  enabled?: boolean;
  autoPageView?: boolean;
}

export interface AnalyticsEngineSDK {
  track: (
    eventName: string,
    properties?: Record<string, unknown>,
    overrides?: Partial<TrackEventPayload>,
  ) => void;
  page: (pageName: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  flush: () => Promise<void>;
}

export function useAnalyticsEngine({
  sourceApp,
  domain,
  apiBase = '/api',
  enabled = true,
  autoPageView = true,
}: UseAnalyticsEngineOptions): AnalyticsEngineSDK {
  const clientRef = useRef(createClientAnalytics({ sourceApp, domain, apiBase, enabled }));
  const lastPageRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;
    const client = clientRef.current;
    client.start();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        client.flush().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (autoPageView) {
      const currentPage = window.location.pathname;
      if (currentPage !== lastPageRef.current) {
        lastPageRef.current = currentPage;
        client.track('page_viewed', { path: currentPage, title: document.title });
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      client.stop();
    };
  }, [enabled, autoPageView]);

  const track = useCallback(
    (
      eventName: string,
      properties?: Record<string, unknown>,
      overrides?: Partial<TrackEventPayload>,
    ) => {
      if (!enabled) return;
      clientRef.current.track(eventName, properties, overrides);
    },
    [enabled],
  );

  const page = useCallback(
    (pageName: string, properties?: Record<string, unknown>) => {
      if (!enabled) return;
      clientRef.current.page(pageName, properties);
    },
    [enabled],
  );

  const identify = useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      if (!enabled) return;
      clientRef.current.identify(userId, traits);
    },
    [enabled],
  );

  const flush = useCallback(async () => {
    await clientRef.current.flush();
  }, []);

  return { track, page, identify, flush };
}

// ---------------------------------------------------------------------------
// Auto-capture data-track attributes (attach to document)
// ---------------------------------------------------------------------------

export function useAutoCapture(sourceApp: string, domain: string, enabled = true): void {
  const clientRef = useRef(createClientAnalytics({ sourceApp, domain, enabled }));

  useEffect(() => {
    if (!enabled) return;

    const client = clientRef.current;
    client.start();

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const trackable = target.closest('[data-track]');
      if (trackable) {
        const action = trackable.getAttribute('data-track') ?? 'element_clicked';
        const label =
          trackable.getAttribute('data-track-label') ?? trackable.textContent?.trim().slice(0, 60);
        client.track(action, { label, tag: trackable.tagName.toLowerCase() });
      }
    };

    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      const formId = form.id || form.getAttribute('name') || 'unknown_form';
      client.track('form_submitted', { formId });
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
      client.stop();
    };
  }, [enabled, sourceApp, domain]);
}
