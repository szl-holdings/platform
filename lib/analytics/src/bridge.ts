import { trackEvent as plausibleTrack } from "./plausible";
import type { ConsentCategories } from "./consent";

export interface BridgeConfig {
  appName: string;
  apiBaseUrl?: string;
  enableEventLake?: boolean;
  enablePlausible?: boolean;
  enableGA4?: boolean;
  getConsent?: () => ConsentCategories;
}

let _bridgeConfig: BridgeConfig | null = null;

export function configureBridge(config: BridgeConfig): void {
  _bridgeConfig = config;
}

export interface BridgeEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

export async function bridgeEvent(event: BridgeEvent): Promise<void> {
  const cfg = _bridgeConfig;
  if (!cfg) return;

  const consent = cfg.getConsent ? cfg.getConsent() : null;
  const analyticsConsented = !consent || consent.analytics;

  if (!analyticsConsented) return;

  const payload = {
    ...event,
    timestamp: event.timestamp || Date.now(),
    site: cfg.appName,
  };

  if (cfg.enableEventLake !== false) {
    try {
      const baseUrl = cfg.apiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
      fetch(`${baseUrl}/api/analytics/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [{
            event: event.name,
            properties: { site: cfg.appName, ...event.properties },
            timestamp: new Date(payload.timestamp).toISOString(),
          }],
        }),
      }).catch(() => {});
    } catch {}
  }

  if (cfg.enablePlausible !== false) {
    try {
      plausibleTrack(event.name, event.properties as Record<string, string | number | boolean | undefined>);
    } catch {}
  }

  if (cfg.enableGA4 !== false && typeof window !== "undefined") {
    try {
      const gtagFn = (window as unknown as Record<string, unknown>)["gtag"];
      if (typeof gtagFn === "function") {
        (gtagFn as (...args: unknown[]) => void)("event", event.name, event.properties);
      }
    } catch {}
  }
}
