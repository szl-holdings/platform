import AsyncStorage from "@react-native-async-storage/async-storage";

export const CACHE_KEYS = {
  INCIDENTS: "cache_incidents",
  FINDINGS: "cache_findings",
  SIGNALS: "cache_signals",
  VESSELS: "cache_vessels",
  FLEET_ALERTS: "cache_fleet_alerts",
  PROPERTIES: "cache_properties",
  PIPELINE: "cache_pipeline",
  PORTFOLIO: "cache_portfolio",
  LYTE_SIGNALS: "cache_lyte_signals",
  LYTE_INCIDENTS: "cache_lyte_incidents",
  ADVISORY_SESSIONS: "cache_advisory_sessions",
  ADVISORY_DOCUMENTS: "cache_advisory_documents",
  APPROVALS: "cache_approvals",
} as const;

export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS];

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
  }
}

export async function cacheGetStale<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}

export async function cacheGetFresh<T>(
  key: string,
  maxAgeMs = 5 * 60 * 1000
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > maxAgeMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function cacheClear(key?: string): Promise<void> {
  try {
    if (key) {
      await AsyncStorage.removeItem(key);
    } else {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => k.startsWith("cache_"));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
  }
}
