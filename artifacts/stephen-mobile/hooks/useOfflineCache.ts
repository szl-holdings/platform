import { useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CachedBriefing {
  id: string;
  title: string;
  summary: string;
  domain: string;
  cachedAt: number;
  isOffline?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number;
}

const DEFAULT_TTL = 24 * 60 * 60 * 1000;
const CONNECTIVITY_CHECK_URL = "https://1.1.1.1";
const CONNECTIVITY_INTERVAL_MS = 30000;
const PENDING_WRITES_FALLBACK_KEY = "offline_pending_writes";

interface PendingWrite {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  id: string;
}

type SqliteDb = {
  runAsync(sql: string, params?: unknown[]): Promise<void>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

let _db: SqliteDb | null = null;
let _dbReady = false;
let _dbPromise: Promise<void> | null = null;

async function openDb(): Promise<SqliteDb | null> {
  if (_dbReady) return _db;
  if (_dbPromise) {
    await _dbPromise;
    return _db;
  }
  _dbPromise = (async () => {
    try {
      const SQLite = await import("expo-sqlite" as string) as {
        openDatabaseSync?: (name: string) => SqliteDb;
        openDatabaseAsync?: (name: string) => Promise<SqliteDb>;
      };
      let db: SqliteDb | undefined;
      if (SQLite.openDatabaseSync) db = SQLite.openDatabaseSync("app_cache.db");
      else if (SQLite.openDatabaseAsync) db = await SQLite.openDatabaseAsync("app_cache.db");
      if (!db) throw new Error("no SQLite open method");
      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          cached_at INTEGER NOT NULL,
          ttl INTEGER NOT NULL
        );`
      );
      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS pending_writes (
          id TEXT PRIMARY KEY,
          url TEXT NOT NULL,
          method TEXT NOT NULL,
          headers TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );`
      );
      _db = db;
    } catch {
      _db = null;
    }
    _dbReady = true;
  })();
  await _dbPromise;
  return _db;
}

async function dbGet<T>(key: string): Promise<{ data: T; cachedAt: number; ttl: number } | null> {
  const db = await openDb();
  if (!db) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }
  try {
    const row = await db.getFirstAsync<{ data: string; cached_at: number; ttl: number }>(
      "SELECT data, cached_at, ttl FROM cache WHERE key = ?;", [key]
    );
    if (!row) return null;
    return { data: JSON.parse(row.data) as T, cachedAt: row.cached_at, ttl: row.ttl };
  } catch { return null; }
}

async function dbSet<T>(key: string, data: T, ttl: number): Promise<void> {
  const db = await openDb();
  if (!db) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now(), ttl }));
    } catch {}
    return;
  }
  try {
    await db.runAsync(
      "INSERT OR REPLACE INTO cache (key, data, cached_at, ttl) VALUES (?, ?, ?, ?);",
      [key, JSON.stringify(data), Date.now(), ttl]
    );
  } catch {}
}

async function dbDelete(key: string): Promise<void> {
  const db = await openDb();
  if (!db) {
    await AsyncStorage.removeItem(key);
    return;
  }
  try { await db.runAsync("DELETE FROM cache WHERE key = ?;", [key]); } catch {}
}

async function loadPendingWrites(): Promise<PendingWrite[]> {
  const db = await openDb();
  if (!db) {
    try {
      const raw = await AsyncStorage.getItem(PENDING_WRITES_FALLBACK_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  try {
    const rows = await db.getAllAsync<{
      id: string; url: string; method: string; headers: string; body: string;
    }>("SELECT id, url, method, headers, body FROM pending_writes ORDER BY created_at ASC;");
    return rows.map(r => ({ id: r.id, url: r.url, method: r.method, headers: JSON.parse(r.headers), body: r.body }));
  } catch { return []; }
}

async function savePendingWrite(write: PendingWrite): Promise<void> {
  const db = await openDb();
  if (!db) {
    try {
      const raw = await AsyncStorage.getItem(PENDING_WRITES_FALLBACK_KEY);
      const writes: PendingWrite[] = raw ? JSON.parse(raw) : [];
      writes.push(write);
      await AsyncStorage.setItem(PENDING_WRITES_FALLBACK_KEY, JSON.stringify(writes));
    } catch {}
    return;
  }
  try {
    await db.runAsync(
      "INSERT OR REPLACE INTO pending_writes (id, url, method, headers, body, created_at) VALUES (?, ?, ?, ?, ?, ?);",
      [write.id, write.url, write.method, JSON.stringify(write.headers), write.body, Date.now()]
    );
  } catch {}
}

async function removePendingWrite(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try { await db.runAsync("DELETE FROM pending_writes WHERE id = ?;", [id]); } catch {}
}

async function replayPendingWrites(): Promise<void> {
  const writes = await loadPendingWrites();
  if (writes.length === 0) return;
  for (const write of writes) {
    try {
      const res = await fetch(write.url, { method: write.method, headers: write.headers, body: write.body });
      if (res.ok) {
        await removePendingWrite(write.id);
      }
    } catch {}
  }
}

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(CONNECTIVITY_CHECK_URL, { method: "HEAD", signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkConnectivity().then(online => setIsOnline(online));
    intervalRef.current = setInterval(async () => {
      const online = await checkConnectivity();
      setIsOnline(prev => {
        if (!prev && online) {
          replayPendingWrites().catch(() => {});
        }
        return online;
      });
    }, CONNECTIVITY_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return isOnline;
}

export async function queueOfflineWrite(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string,
): Promise<void> {
  await savePendingWrite({
    url, method, headers, body,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });
}

export function useOfflineCache<T>(key: string, ttl = DEFAULT_TTL) {
  const [cached, setCached] = useState<T | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const isOnline = useConnectivity();

  useEffect(() => {
    setIsOffline(!isOnline);
  }, [isOnline]);

  const load = useCallback(async () => {
    try {
      const entry = await dbGet<T>(key);
      if (!entry) return null;
      if (Date.now() - entry.cachedAt > entry.ttl) return null;
      setCached(entry.data);
      setLastSynced(entry.cachedAt);
      return entry.data;
    } catch {
      return null;
    }
  }, [key]);

  const save = useCallback(async (data: T) => {
    try {
      await dbSet(key, data, ttl);
      setCached(data);
      setLastSynced(Date.now());
    } catch {}
  }, [key, ttl]);

  const clear = useCallback(async () => {
    await dbDelete(key);
    setCached(null);
    setLastSynced(null);
  }, [key]);

  const isExpired = useCallback(() => {
    if (!lastSynced) return true;
    return Date.now() - lastSynced > ttl;
  }, [lastSynced, ttl]);

  useEffect(() => {
    load();
  }, []);

  return { cached, isOffline, lastSynced, load, save, clear, isExpired };
}
