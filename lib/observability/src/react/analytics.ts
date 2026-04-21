import * as amplitude from '@amplitude/analytics-browser';
import posthog from 'posthog-js';

const ANALYTICS_INIT_KEY = '__szl_analytics_initialized';

function isAnalyticsInitialized(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as Record<string, unknown>)[ANALYTICS_INIT_KEY];
}

function markAnalyticsInitialized(): void {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)[ANALYTICS_INIT_KEY] = true;
  }
}

export interface AnalyticsConfig {
  appSlug: string;
  posthogKey?: string;
  posthogHost?: string;
  amplitudeKey?: string;
}

function isValidPostHogKey(k: string | undefined): k is string {
  if (!k) return false;
  return /^ph[ckx]_[A-Za-z0-9]{20,}$/.test(k);
}

function isValidAmplitudeKey(k: string | undefined): k is string {
  if (!k) return false;
  return /^[a-f0-9]{32}$/i.test(k);
}

export function initAnalytics(config: AnalyticsConfig): void {
  if (isAnalyticsInitialized() || typeof window === 'undefined') return;
  markAnalyticsInitialized();

  const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
  const phKey = config.posthogKey || env.VITE_POSTHOG_KEY;
  const phHost = config.posthogHost || env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
  const ampKey = config.amplitudeKey || env.VITE_AMPLITUDE_API_KEY;

  if (phKey && !isValidPostHogKey(phKey)) {
    console.info(
      '[PostHog] VITE_POSTHOG_KEY appears to be a placeholder — product analytics disabled for',
      config.appSlug,
    );
  } else if (isValidPostHogKey(phKey)) {
    posthog.init(phKey, {
      api_host: phHost,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      persistence: 'localStorage+cookie',
      loaded: (ph) => {
        if (env.DEV) ph.debug();
        ph.register({ app: config.appSlug });
      },
    });
  } else {
    console.debug(
      '[PostHog] VITE_POSTHOG_KEY not set — product analytics disabled for',
      config.appSlug,
    );
  }

  if (ampKey && !isValidAmplitudeKey(ampKey)) {
    console.info(
      '[Amplitude] VITE_AMPLITUDE_API_KEY appears to be a placeholder — amplitude disabled for',
      config.appSlug,
    );
  } else if (isValidAmplitudeKey(ampKey)) {
    amplitude.init(ampKey, {
      defaultTracking: {
        pageViews: true,
        sessions: true,
        formInteractions: true,
        fileDownloads: true,
      },
      logLevel: env.DEV ? amplitude.Types.LogLevel.Warn : amplitude.Types.LogLevel.None,
    });
    amplitude.setGroup('app', config.appSlug);
  } else {
    console.debug(
      '[Amplitude] VITE_AMPLITUDE_API_KEY not set — amplitude disabled for',
      config.appSlug,
    );
  }
}

export interface AnalyticsUser {
  id: string;
  email?: string;
  name?: string;
  plan?: string;
}

export function identifyAnalyticsUser(user: AnalyticsUser): void {
  try {
    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      plan: user.plan,
    });
  } catch {
    /* noop if not initialized */
  }

  try {
    amplitude.setUserId(user.id);
    const identifyEvent = new amplitude.Identify();
    if (user.email) identifyEvent.set('email', user.email);
    if (user.name) identifyEvent.set('name', user.name);
    if (user.plan) identifyEvent.set('plan', user.plan);
    amplitude.identify(identifyEvent);
  } catch {
    /* noop if not initialized */
  }
}

export function resetAnalyticsUser(): void {
  try {
    posthog.reset();
  } catch {
    /* noop */
  }
  try {
    amplitude.reset();
  } catch {
    /* noop */
  }
}

export type CoreEventName =
  | 'page_view'
  | 'feature_used'
  | 'conversion'
  | 'cta_clicked'
  | 'form_submitted'
  | 'upgrade_clicked'
  | 'billing_portal_opened'
  | 'error_boundary_triggered'
  | 'search_performed'
  | 'export_triggered';

export function trackEvent(
  event: CoreEventName | string,
  properties?: Record<string, unknown>,
): void {
  try {
    posthog.capture(event, properties);
  } catch {
    /* noop */
  }
  try {
    amplitude.track(event, properties);
  } catch {
    /* noop */
  }
}
