import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, AppState, type AppStateStatus } from "react-native";

export type TimeOfDay = "earlyMorning" | "morning" | "midday" | "afternoon" | "evening" | "night";

export interface LocationContext {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface ContextualSignal {
  key: string;
  label: string;
  relevance: number;
  domain: DomainKey;
  reason: string;
}

export type DomainKey =
  | "maritime"
  | "defense"
  | "property"
  | "energy"
  | "advisory"
  | "executive"
  | "portfolio";

export interface DomainRule {
  domain: DomainKey;
  proximityTriggers?: Array<{
    label: string;
    latRange: [number, number];
    lonRange: [number, number];
    relevance: number;
    reason: string;
  }>;
  morningBriefingEnabled?: boolean;
  eveningDigestEnabled?: boolean;
  keywordContext?: string[];
}

export interface AwarenessContext {
  timeOfDay: TimeOfDay;
  hourOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;
  location: LocationContext | null;
  networkState: "online" | "offline" | "unknown";
  activeSignals: ContextualSignal[];
  briefingWindow: "morning" | "evening" | "none";
  appState: AppStateStatus;
  lastUpdated: number;
}

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 4 && hour < 6) return "earlyMorning";
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 13) return "midday";
  if (hour >= 13 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getBriefingWindow(hour: number): "morning" | "evening" | "none" {
  if (hour >= 6 && hour < 10) return "morning";
  if (hour >= 18 && hour < 21) return "evening";
  return "none";
}

function isInRange(value: number, range: [number, number]): boolean {
  return value >= range[0] && value <= range[1];
}

async function tryGetLocation(): Promise<LocationContext | null> {
  if (Platform.OS === "web") return null;
  try {
    const Location = await import("expo-location");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? undefined,
      timestamp: pos.timestamp,
    };
  } catch {
    return null;
  }
}

async function tryCheckNetwork(): Promise<"online" | "offline" | "unknown"> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch("https://1.1.1.1", {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp.ok || resp.status < 500 ? "online" : "offline";
  } catch {
    return "offline";
  }
}

function evaluateSignals(
  location: LocationContext | null,
  rules: DomainRule[],
): ContextualSignal[] {
  const signals: ContextualSignal[] = [];

  for (const rule of rules) {
    if (location && rule.proximityTriggers) {
      for (const trigger of rule.proximityTriggers) {
        if (
          isInRange(location.latitude, trigger.latRange) &&
          isInRange(location.longitude, trigger.lonRange)
        ) {
          signals.push({
            key: `proximity-${rule.domain}-${trigger.label}`,
            label: trigger.label,
            relevance: trigger.relevance,
            domain: rule.domain,
            reason: trigger.reason,
          });
        }
      }
    }
  }

  return signals.sort((a, b) => b.relevance - a.relevance);
}

export function useContextualAwareness(domainRules: DomainRule[] = []) {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  const [context, setContext] = useState<AwarenessContext>({
    timeOfDay: getTimeOfDay(hour),
    hourOfDay: hour,
    dayOfWeek,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    location: null,
    networkState: "unknown",
    activeSignals: [],
    briefingWindow: getBriefingWindow(hour),
    appState: AppState.currentState,
    lastUpdated: Date.now(),
  });

  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const refresh = useCallback(async () => {
    const n = new Date();
    const h = n.getHours();
    const dow = n.getDay();
    const [location, networkState] = await Promise.all([
      tryGetLocation(),
      tryCheckNetwork(),
    ]);
    const signals = evaluateSignals(location, domainRules);
    setContext({
      timeOfDay: getTimeOfDay(h),
      hourOfDay: h,
      dayOfWeek: dow,
      isWeekend: dow === 0 || dow === 6,
      location,
      networkState,
      activeSignals: signals,
      briefingWindow: getBriefingWindow(h),
      appState: appStateRef.current,
      lastUpdated: Date.now(),
    });
  }, [domainRules]);

  useEffect(() => {
    refresh();

    refreshInterval.current = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000);

    const sub = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") {
        refresh();
      }
      setContext(prev => ({ ...prev, appState: nextState }));
    });

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      sub.remove();
    };
  }, [refresh]);

  return { context, refresh };
}
