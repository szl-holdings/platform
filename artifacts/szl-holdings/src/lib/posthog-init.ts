import posthog from 'posthog-js';

let initialized = false;

export function initPostHog(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const host =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

  if (!key || key === 'phc_YOUR_PROJECT_API_KEY') {
    if (import.meta.env.DEV) {
      console.info(
        '[analytics] VITE_POSTHOG_KEY not set — PostHog disabled. Events will only log to console.',
      );
    }
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: true,
    disable_surveys: true,
    persistence: 'localStorage+cookie',
    cross_subdomain_cookie: false,
    secure_cookie: true,
    respect_dnt: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    before_send: (event) => {
      if (!event) return event;
      const PII_KEYS = new Set([
        'email',
        'first_name',
        'last_name',
        'name',
        'full_name',
        'phone',
        'phone_number',
        'address',
        'ip',
        '$ip',
      ]);
      if (event.properties && typeof event.properties === 'object') {
        for (const k of Object.keys(event.properties)) {
          if (PII_KEYS.has(k.toLowerCase())) {
            delete event.properties[k];
          }
        }
      }
      return event;
    },
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.debug();
      }
    },
  });

  initialized = true;
}

export function isPostHogInitialized(): boolean {
  return initialized;
}
