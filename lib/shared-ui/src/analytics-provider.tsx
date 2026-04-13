import { createContext, useContext, useCallback, useEffect, useRef, type ReactNode } from "react";

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
  sessionId?: string;
  visitorId?: string;
  path?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  deviceType?: string;
  browser?: string;
  timezone?: string;
  language?: string;
  scrollDepthPct?: number;
  clickCount?: number;
  pageDurationSeconds?: number;
}

interface AnalyticsContextValue {
  track: (name: string, properties?: Record<string, unknown>) => void;
  page: (name: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  sessionId: () => string;
  visitorId: () => string;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  track: () => {},
  page: () => {},
  identify: () => {},
  sessionId: () => "",
  visitorId: () => "",
});

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext);
}

interface AnalyticsProviderProps {
  appName: string;
  children: ReactNode;
  enabled?: boolean;
  onConversionEvent?: (eventName: string, properties?: Record<string, unknown>) => void;
}

const ANALYTICS_CONVERSION_EVENTS = new Set([
  "demo_requested", "demo_request", "contact_submitted", "form_submit", "checkout_completed",
]);

const EVENT_QUEUE: AnalyticsEvent[] = [];
const FLUSH_INTERVAL_MS = 5_000;
const FLUSH_BATCH_SIZE = 100;
const QUEUE_MAX_SIZE = FLUSH_BATCH_SIZE * 5;

function getUtmParams(): Record<string, string | undefined> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utmSource: p.get("utm_source") ?? undefined,
    utmMedium: p.get("utm_medium") ?? undefined,
    utmCampaign: p.get("utm_campaign") ?? undefined,
    utmTerm: p.get("utm_term") ?? undefined,
    utmContent: p.get("utm_content") ?? undefined,
  };
}

function detectDeviceType(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) return "mobile";
  if (/tablet|ipad/.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Opera")) return "Opera";
  return "Other";
}

function generateFingerprint(): string {
  if (typeof window === "undefined") return "server";
  const components = [
    navigator.userAgent,
    screen.width + "x" + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    screen.colorDepth,
  ].join("|");

  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "v_" + Math.abs(hash).toString(36);
}

function getOrCreateVisitorId(): string {
  if (typeof localStorage === "undefined") return generateFingerprint();
  const stored = localStorage.getItem("_vid");
  if (stored) return stored;
  const id = generateFingerprint();
  try { localStorage.setItem("_vid", id); } catch {}
  return id;
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId(): string {
  if (typeof sessionStorage === "undefined") return generateUUID();
  const stored = sessionStorage.getItem("_sid");
  if (stored && /^[0-9a-f-]{36}$/.test(stored)) return stored;
  const id = generateUUID();
  try { sessionStorage.setItem("_sid", id); } catch (e) {
    console.warn("[analytics] sessionStorage unavailable:", e);
  }
  return id;
}

let _cachedVisitorId = "";
let _cachedSessionId = "";

function getVisitorId(): string {
  if (!_cachedVisitorId) _cachedVisitorId = getOrCreateVisitorId();
  return _cachedVisitorId;
}

function getSessionId(): string {
  if (!_cachedSessionId) _cachedSessionId = getOrCreateSessionId();
  return _cachedSessionId;
}

async function flushEvents(appName: string): Promise<void> {
  if (EVENT_QUEUE.length === 0) return;
  const batch = EVENT_QUEUE.splice(0, FLUSH_BATCH_SIZE);
  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${baseUrl}/api/telemetry/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app: appName, events: batch }),
    });
    if (!res.ok) {
      EVENT_QUEUE.unshift(...batch);
    }
  } catch {
    EVENT_QUEUE.unshift(...batch);
    if (EVENT_QUEUE.length > QUEUE_MAX_SIZE) {
      EVENT_QUEUE.splice(0, EVENT_QUEUE.length - QUEUE_MAX_SIZE);
    }
  }
}

export function AnalyticsProvider({ appName, children, enabled = true, onConversionEvent }: AnalyticsProviderProps) {
  const pageEnterAt = useRef<number>(Date.now());
  const currentPath = useRef<string>(typeof window !== "undefined" ? window.location.pathname : "");
  const clickCountRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = () => { clickCountRef.current++; };
    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => flushEvents(appName), FLUSH_INTERVAL_MS);
    const handleUnload = () => { flushEvents(appName); };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [appName, enabled]);

  const enrichEvent = useCallback((name: string, properties?: Record<string, unknown>): AnalyticsEvent => {
    const utm = getUtmParams();
    return {
      name,
      properties,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      ...utm,
      viewportWidth: typeof window !== "undefined" ? window.innerWidth : undefined,
      viewportHeight: typeof window !== "undefined" ? window.innerHeight : undefined,
      deviceType: detectDeviceType(),
      browser: detectBrowser(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: typeof navigator !== "undefined" ? navigator.language : undefined,
    };
  }, []);

  const onConversionEventRef = useRef(onConversionEvent);
  useEffect(() => { onConversionEventRef.current = onConversionEvent; }, [onConversionEvent]);

  const track = useCallback((name: string, properties?: Record<string, unknown>) => {
    if (!enabled) return;
    const event = enrichEvent(name, properties);

    if (name === "page_view") {
      const now = Date.now();
      const durationSeconds = Math.round((now - pageEnterAt.current) / 1000);
      event.pageDurationSeconds = durationSeconds;
      event.clickCount = clickCountRef.current;
      pageEnterAt.current = now;
      clickCountRef.current = 0;
      currentPath.current = (properties?.path as string) || event.path || "";
    }

    if (ANALYTICS_CONVERSION_EVENTS.has(name) && onConversionEventRef.current) {
      onConversionEventRef.current(name, properties);
    }

    EVENT_QUEUE.push(event);
    if (EVENT_QUEUE.length >= FLUSH_BATCH_SIZE) {
      flushEvents(appName);
    }
  }, [appName, enabled, enrichEvent]);

  const page = useCallback((name: string, properties?: Record<string, unknown>) => {
    track("page_view", { page: name, ...properties });
  }, [track]);

  const identify = useCallback((userId: string, traits?: Record<string, unknown>) => {
    track("identify", { userId, ...traits });
  }, [track]);

  return (
    <AnalyticsContext.Provider value={{
      track,
      page,
      identify,
      sessionId: getSessionId,
      visitorId: getVisitorId,
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
