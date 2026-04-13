import { useEffect, type ReactNode } from "react";

interface AdPixelConfig {
  googleAdsId?: string;
  metaPixelId?: string;
  respectDnt?: boolean;
  consentGranted?: boolean;
}

interface AdPixelProviderProps extends AdPixelConfig {
  children: ReactNode;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    dataLayer?: unknown[];
  }
}

function hasDntEnabled(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.doNotTrack === "1" || (window as Window & { doNotTrack?: string }).doNotTrack === "1";
}

export function loadGoogleAds(googleAdsId: string) {
  if (typeof window === "undefined") return;
  if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", googleAdsId, { send_page_view: false });
}

export function loadMetaPixel(metaPixelId: string) {
  if (typeof window === "undefined") return;
  if (window.fbq) return;

  const n = function (...args: unknown[]) {
    (n as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] }).callMethod
      ? (n as unknown as { callMethod: (...a: unknown[]) => void }).callMethod(...args)
      : (n as unknown as { queue: unknown[] }).queue.push(args);
  };
  const fb = n as typeof n & { push: typeof n; loaded: boolean; version: string; queue: unknown[] };
  if (!window._fbq) window._fbq = fb;
  window.fbq = fb;
  fb.push = fb;
  fb.loaded = true;
  fb.version = "2.0";
  fb.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", metaPixelId);
  window.fbq("track", "PageView");
}

export function fireGoogleAdsConversion(conversionId: string, label?: string, value?: number, currency?: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "conversion", {
    send_to: label ? `${conversionId}/${label}` : conversionId,
    value: value,
    currency: currency ?? "USD",
  });
}

export function fireMetaPixelEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, params);
}

const CONVERSION_EVENT_MAP: Record<string, { metaEvent: string; googleEvent: string }> = {
  demo_requested: { metaEvent: "Lead", googleEvent: "conversion" },
  demo_request: { metaEvent: "Lead", googleEvent: "conversion" },
  contact_submitted: { metaEvent: "Lead", googleEvent: "conversion" },
  form_submit: { metaEvent: "Lead", googleEvent: "conversion" },
  checkout_completed: { metaEvent: "Purchase", googleEvent: "conversion" },
};

export function fireConversionEvent(
  eventName: string,
  googleAdsId?: string,
  params?: { value?: number; currency?: string }
) {
  const mapping = CONVERSION_EVENT_MAP[eventName];
  if (!mapping) return;

  if (window.fbq) {
    const metaParams: Record<string, unknown> = {};
    if (params?.value) metaParams.value = params.value;
    if (params?.currency) metaParams.currency = params.currency;
    window.fbq("track", mapping.metaEvent, Object.keys(metaParams).length ? metaParams : undefined);
  }

  if (window.gtag && googleAdsId) {
    window.gtag("event", mapping.googleEvent, {
      send_to: googleAdsId,
      value: params?.value,
      currency: params?.currency ?? "USD",
    });
  }
}

export function AdPixelProvider({
  children,
  googleAdsId,
  metaPixelId,
  respectDnt = true,
  consentGranted = true,
}: AdPixelProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (respectDnt && hasDntEnabled()) return;
    if (!consentGranted) return;

    if (googleAdsId) {
      loadGoogleAds(googleAdsId);
    }
    if (metaPixelId) {
      loadMetaPixel(metaPixelId);
    }
  }, [googleAdsId, metaPixelId, respectDnt, consentGranted]);

  return <>{children}</>;
}
