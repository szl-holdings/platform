import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const CACHE_KEYS = {
  signals: "lyte:cache:signals",
  incidents: "lyte:cache:incidents",
  actions: "lyte:cache:actions",
  health: "lyte:cache:health",
};

export async function cacheSet(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export async function cacheGetStale<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}
