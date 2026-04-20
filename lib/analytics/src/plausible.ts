import type { AnalyticsEventName, EventProperties } from './events';

export interface PlausibleConfig {
  domain?: string;
  trackLocalhost?: boolean;
  enabled?: boolean;
  debugMode?: boolean;
  fallbackToGtag?: boolean;
}

let _config: PlausibleConfig = {
  trackLocalhost: false,
  enabled: true,
  debugMode: false,
  fallbackToGtag: true,
};

export function configurePlausible(config: PlausibleConfig): void {
  _config = { ..._config, ...config };
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.')
  );
}

function hasPlausible(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as Record<string, unknown>)['plausible'] === 'function'
  );
}

function hasGtag(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as Record<string, unknown>)['gtag'] === 'function'
  );
}

export function trackEvent(
  eventName: AnalyticsEventName | string,
  properties?: EventProperties,
): void {
  if (typeof window === 'undefined') return;
  if (!_config.enabled) return;
  if (isLocalhost() && !_config.trackLocalhost) {
    if (_config.debugMode) {
      console.debug(`[analytics:plausible] Skipped (localhost): ${eventName}`, properties);
    }
    return;
  }

  if (_config.debugMode) {
    console.debug(`[analytics] ${eventName}`, properties);
  }

  if (hasPlausible()) {
    try {
      (window as unknown as Record<string, (...args: unknown[]) => void>)['plausible']!(eventName, {
        props: properties,
      });
    } catch (e) {
      console.warn('[analytics] Plausible error:', e);
    }
    return;
  }

  if (_config.fallbackToGtag && hasGtag()) {
    try {
      (window as unknown as Record<string, (...args: unknown[]) => void>)['gtag']!(
        'event',
        eventName,
        properties,
      );
    } catch (e) {
      console.warn('[analytics] gtag error:', e);
    }
    return;
  }

  if (_config.debugMode) {
    console.debug(`[analytics] No provider available for: ${eventName}`);
  }
}

export function trackPageView(properties?: { url?: string; referrer?: string }): void {
  trackEvent('page_view', {
    url: properties?.url ?? (typeof window !== 'undefined' ? window.location.href : undefined),
    referrer:
      properties?.referrer ?? (typeof document !== 'undefined' ? document.referrer : undefined),
  });
}
