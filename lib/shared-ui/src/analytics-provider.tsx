import { createContext, useContext, useCallback, useEffect, type ReactNode } from "react";

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

interface AnalyticsContextValue {
  track: (name: string, properties?: Record<string, unknown>) => void;
  page: (name: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  track: () => {},
  page: () => {},
  identify: () => {},
});

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext);
}

interface AnalyticsProviderProps {
  appName: string;
  children: ReactNode;
  enabled?: boolean;
}

const EVENT_QUEUE: AnalyticsEvent[] = [];
const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_BATCH_SIZE = 20;

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
    if (EVENT_QUEUE.length > FLUSH_BATCH_SIZE * 5) {
      EVENT_QUEUE.splice(0, EVENT_QUEUE.length - FLUSH_BATCH_SIZE * 5);
    }
  }
}

export function AnalyticsProvider({ appName, children, enabled = true }: AnalyticsProviderProps) {
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => flushEvents(appName), FLUSH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [appName, enabled]);

  const track = useCallback((name: string, properties?: Record<string, unknown>) => {
    if (!enabled) return;
    EVENT_QUEUE.push({ name, ...(properties !== undefined ? { properties } : {}), timestamp: Date.now() });
    if (EVENT_QUEUE.length >= FLUSH_BATCH_SIZE) {
      flushEvents(appName);
    }
  }, [appName, enabled]);

  const page = useCallback((name: string, properties?: Record<string, unknown>) => {
    track("page_view", { page: name, ...properties });
  }, [track]);

  const identify = useCallback((userId: string, traits?: Record<string, unknown>) => {
    track("identify", { userId, ...traits });
  }, [track]);

  return (
    <AnalyticsContext.Provider value={{ track, page, identify }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
