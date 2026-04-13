import { useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_STALENESS_MS = 5 * 60 * 1000;
const PENDING_WRITES_KEY = "szl_offline_pending_writes";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

export interface OfflineWrite {
  id: string;
  endpoint: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

export interface UseOfflineCacheOptions {
  maxStalenessMs?: number;
  fetchFn: () => Promise<unknown>;
  key: string;
  apiBaseUrl?: string;
  authToken?: string;
}

type SqliteDb = {
  runAsync(sql: string, params?: unknown[]): Promise<void>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

let _db: SqliteDb | null = null;
let _dbInitialized = false;
let _dbInitPromise: Promise<void> | null = null;

async function initDb(): Promise<void> {
  if (_dbInitialized) return;
  if (_dbInitPromise) return _dbInitPromise;
  _dbInitPromise = (async () => {
    try {
      const SQLite = await import("expo-sqlite" as string);
      const db = SQLite.openDatabaseSync
        ? SQLite.openDatabaseSync("intelligence_cache.db")
        : await SQLite.openDatabaseAsync?.("intelligence_cache.db");
      if (!db) throw new Error("No SQLite open method");
      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          version INTEGER NOT NULL DEFAULT 1
        );`
      );
      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS pending_writes (
          id TEXT PRIMARY KEY,
          endpoint TEXT NOT NULL,
          payload TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          retry_count INTEGER NOT NULL DEFAULT 0
        );`
      );
      _db = db as SqliteDb;
      _dbInitialized = true;
    } catch (err) {
      console.warn("[offline-cache] SQLite init failed — cache disabled:", err instanceof Error ? err.message : String(err));
      _dbInitialized = true;
    }
  })();
  return _dbInitPromise;
}

async function dbReadCache<T>(key: string): Promise<CacheEntry<T> | null> {
  await initDb();
  if (!_db) return null;
  try {
    const row = await _db.getFirstAsync<{ data: string; timestamp: number; version: number }>(
      "SELECT data, timestamp, version FROM cache WHERE key = ?;",
      [key]
    );
    if (!row) return null;
    return { data: JSON.parse(row.data) as T, timestamp: row.timestamp, version: row.version };
  } catch {
    return null;
  }
}

async function dbWriteCache<T>(key: string, entry: CacheEntry<T>): Promise<void> {
  await initDb();
  if (!_db) return;
  try {
    await _db.runAsync(
      "INSERT OR REPLACE INTO cache (key, data, timestamp, version) VALUES (?, ?, ?, ?);",
      [key, JSON.stringify(entry.data), entry.timestamp, entry.version]
    );
  } catch {}
}

async function dbDeleteCache(key: string): Promise<void> {
  await initDb();
  if (!_db) return;
  try {
    await _db.runAsync("DELETE FROM cache WHERE key = ?;", [key]);
  } catch {}
}

async function dbGetPendingWrites(): Promise<OfflineWrite[]> {
  await initDb();
  if (!_db) {
    try {
      const raw = await AsyncStorage.getItem(PENDING_WRITES_KEY);
      return raw ? JSON.parse(raw) as OfflineWrite[] : [];
    } catch { return []; }
  }
  try {
    const rows = await _db.getAllAsync<{ id: string; endpoint: string; payload: string; timestamp: number; retry_count: number }>(
      "SELECT id, endpoint, payload, timestamp, retry_count FROM pending_writes ORDER BY timestamp ASC;"
    );
    return rows.map(r => ({ id: r.id, endpoint: r.endpoint, payload: JSON.parse(r.payload), timestamp: r.timestamp, retryCount: r.retry_count }));
  } catch { return []; }
}

async function dbAddPendingWrite(write: OfflineWrite): Promise<void> {
  await initDb();
  if (!_db) {
    try {
      const raw = await AsyncStorage.getItem(PENDING_WRITES_KEY);
      const pending: OfflineWrite[] = raw ? JSON.parse(raw) : [];
      pending.push(write);
      await AsyncStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(pending));
    } catch {}
    return;
  }
  try {
    await _db.runAsync(
      "INSERT OR REPLACE INTO pending_writes (id, endpoint, payload, timestamp, retry_count) VALUES (?, ?, ?, ?, ?);",
      [write.id, write.endpoint, JSON.stringify(write.payload), write.timestamp, write.retryCount]
    );
  } catch {}
}

async function dbRemovePendingWrite(id: string): Promise<void> {
  await initDb();
  if (!_db) return;
  try {
    await _db.runAsync("DELETE FROM pending_writes WHERE id = ?;", [id]);
  } catch {}
}

async function dbUpdatePendingWriteRetry(id: string, retryCount: number): Promise<void> {
  await initDb();
  if (!_db) return;
  try {
    await _db.runAsync("UPDATE pending_writes SET retry_count = ? WHERE id = ?;", [retryCount, id]);
  } catch {}
}

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch("https://1.1.1.1/dns-query?name=google.com", {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp.ok || resp.status < 500;
  } catch {
    return false;
  }
}

export function useOfflineCache<T>(options: UseOfflineCacheOptions) {
  const { key, fetchFn, maxStalenessMs = DEFAULT_STALENESS_MS } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const syncInProgress = useRef(false);
  const connectivityInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const writeCache = useCallback(async (value: T): Promise<void> => {
    const entry: CacheEntry<T> = { data: value, timestamp: Date.now(), version: 1 };
    await dbWriteCache(key, entry);
  }, [key]);

  async function replayPendingWrites() {
    if (!options.apiBaseUrl) return;
    const pending = await dbGetPendingWrites();
    for (const write of pending) {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (options.authToken) headers["Authorization"] = `Bearer ${options.authToken}`;
        const resp = await fetch(`${options.apiBaseUrl}${write.endpoint}`, {
          method: "POST",
          headers,
          body: JSON.stringify(write.payload),
          signal: AbortSignal.timeout(10000),
        });
        if (resp.ok) {
          await dbRemovePendingWrite(write.id);
        } else if (write.retryCount < 3) {
          await dbUpdatePendingWriteRetry(write.id, write.retryCount + 1);
        } else {
          await dbRemovePendingWrite(write.id);
        }
      } catch {
        if (write.retryCount < 3) {
          await dbUpdatePendingWriteRetry(write.id, write.retryCount + 1);
        } else {
          await dbRemovePendingWrite(write.id);
        }
      }
    }
  }

  const triggerSync = useCallback(async () => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    try {
      const fresh = await fetchFn() as T;
      setData(fresh);
      setLastUpdated(new Date());
      setIsStale(false);
      await writeCache(fresh);
      await replayPendingWrites();
    } catch (err) {
      console.warn("[offline-cache] Background sync failed:", err instanceof Error ? err.message : String(err));
    } finally {
      syncInProgress.current = false;
    }
  }, [fetchFn, writeCache]);

  useEffect(() => {
    connectivityInterval.current = setInterval(async () => {
      const online = await checkConnectivity();
      setIsOffline(!online);
      if (online && isStale && !syncInProgress.current) {
        await triggerSync();
      }
    }, 30000);

    return () => {
      if (connectivityInterval.current) clearInterval(connectivityInterval.current);
    };
  }, [isStale, triggerSync]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const cached = await dbReadCache<T>(key);
    if (cached) {
      setData(cached.data);
      setLastUpdated(new Date(cached.timestamp));
      const stale = Date.now() - cached.timestamp > maxStalenessMs;
      setIsStale(stale);
    }

    const online = await checkConnectivity();
    setIsOffline(!online);

    if (online) {
      try {
        const fresh = await fetchFn() as T;
        setData(fresh);
        setLastUpdated(new Date());
        setIsStale(false);
        await writeCache(fresh);
      } catch {
        if (!cached) setData(null);
      }
    } else if (!cached) {
      setData(null);
    }
    setIsLoading(false);
  }, [key, writeCache, fetchFn, maxStalenessMs]);

  const queueOfflineWrite = useCallback(async (endpoint: string, payload: unknown): Promise<void> => {
    await dbAddPendingWrite({
      id: `write-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      endpoint,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }, []);

  const invalidate = useCallback(async () => {
    await dbDeleteCache(key);
    await loadData();
  }, [key, loadData]);

  const forceRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    isLoading,
    isOffline,
    isStale,
    lastUpdated,
    invalidate,
    forceRefresh,
    queueOfflineWrite,
  };
}

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const online = await checkConnectivity();
      if (!cancelled) setIsOnline(online);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { isOnline };
}
