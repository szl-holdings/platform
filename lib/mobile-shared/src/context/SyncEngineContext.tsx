import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const QUEUE_KEY = "mobile-shared:sync-queue-v2";
const CONFLICTS_KEY = "mobile-shared:sync-conflicts-v2";
const ETAG_CACHE_KEY = "mobile-shared:etag-cache-v1";
const MAX_QUEUE = 100;
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 60_000;
const RETRY_POLL_MS = 10_000;

export interface QueuedMutation {
  id: string;
  domain: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey: string;
  timestamp: number;
  retries: number;
  nextRetryAt: number;
  status: "pending" | "retrying" | "failed" | "conflict";
}

export interface ConflictInfo {
  id: string;
  mutation: QueuedMutation;
  serverVersion: unknown;
  clientVersion: unknown;
  conflictedAt: number;
}

export interface SyncEngineState {
  pending: number;
  syncing: boolean;
  lastSyncedAt: Date | null;
  conflicts: ConflictInfo[];
  failedCount: number;
}

export interface EnqueueOptions {
  domain: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

export interface SyncEngineContextValue extends SyncEngineState {
  domain: string;
  enqueue: (options: EnqueueOptions) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: "keep-mine" | "keep-theirs") => Promise<void>;
  dismissConflict: (conflictId: string) => Promise<void>;
  retryFailed: () => Promise<void>;
  isOnline: boolean;
}

export const SyncEngineContext = createContext<SyncEngineContextValue | null>(null);

async function getStorage(): Promise<{
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
} | null> {
  try {
    const mod = await import("@react-native-async-storage/async-storage");
    return mod.default;
  } catch {
    return null;
  }
}

async function readQueue(): Promise<QueuedMutation[]> {
  try {
    const storage = await getStorage();
    if (!storage) return [];
    const raw = await storage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedMutation[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedMutation[]): Promise<void> {
  try {
    const storage = await getStorage();
    if (!storage) return;
    await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

async function readConflicts(): Promise<ConflictInfo[]> {
  try {
    const storage = await getStorage();
    if (!storage) return [];
    const raw = await storage.getItem(CONFLICTS_KEY);
    return raw ? (JSON.parse(raw) as ConflictInfo[]) : [];
  } catch {
    return [];
  }
}

async function writeConflicts(conflicts: ConflictInfo[]): Promise<void> {
  try {
    const storage = await getStorage();
    if (!storage) return;
    await storage.setItem(CONFLICTS_KEY, JSON.stringify(conflicts));
  } catch {}
}

async function readETagCache(): Promise<Record<string, string>> {
  try {
    const storage = await getStorage();
    if (!storage) return {};
    const raw = await storage.getItem(ETAG_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function writeETagCache(cache: Record<string, string>): Promise<void> {
  try {
    const storage = await getStorage();
    if (!storage) return;
    await storage.setItem(ETAG_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function captureETag(url: string, etag: string): Promise<void> {
  const cache = await readETagCache();
  cache[url] = etag;
  await writeETagCache(cache);
}

async function getStoredETag(url: string): Promise<string | undefined> {
  const cache = await readETagCache();
  return cache[url];
}

function calcBackoff(retries: number): number {
  const delay = Math.min(BASE_BACKOFF_MS * 2 ** retries, MAX_BACKOFF_MS);
  const jitter = Math.random() * 0.2 * delay;
  return Math.floor(delay + jitter);
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function stripConcurrencyHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  if (!headers) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== "if-match") {
      result[key] = value;
    }
  }
  return result;
}

export interface SyncEngineProviderProps {
  children: React.ReactNode;
  domain: string;
  getToken?: () => Promise<string | null>;
  onSyncComplete?: (replayed: number) => void;
  onConflict?: (conflict: ConflictInfo) => void;
}

export function SyncEngineProvider({
  children,
  domain,
  getToken = async () => null,
  onSyncComplete,
  onConflict,
}: SyncEngineProviderProps) {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const isSyncingRef = useRef(false);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const onSyncCompleteRef = useRef(onSyncComplete);
  onSyncCompleteRef.current = onSyncComplete;
  const onConflictRef = useRef(onConflict);
  onConflictRef.current = onConflict;

  const refreshCounts = useCallback(async () => {
    const queue = await readQueue();
    const domainQueue = queue.filter((m) => m.domain === domain);
    const pendingItems = domainQueue.filter(
      (m) => m.status === "pending" || m.status === "retrying"
    );
    const failedItems = domainQueue.filter((m) => m.status === "failed");
    setPending(pendingItems.length);
    setFailedCount(failedItems.length);
  }, [domain]);

  const enqueue = useCallback(
    async (options: EnqueueOptions) => {
      const queue = await readQueue();
      if (queue.length >= MAX_QUEUE) return;

      const idempotencyKey =
        options.idempotencyKey ??
        `${domain}-${options.method}-${options.url}-${generateId()}`;

      const existing = queue.find(
        (m) =>
          m.idempotencyKey === idempotencyKey &&
          m.domain === domain &&
          (m.status === "pending" || m.status === "retrying")
      );
      if (existing) return;

      const entry: QueuedMutation = {
        id: generateId(),
        domain: options.domain ?? domain,
        method: options.method,
        url: options.url,
        body: options.body,
        headers: options.headers,
        idempotencyKey,
        timestamp: Date.now(),
        retries: 0,
        nextRetryAt: 0,
        status: "pending",
      };

      await writeQueue([...queue, entry]);
      setPending((n) => n + 1);
    },
    [domain]
  );

  const drainQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncing(true);

    try {
      const token = await getTokenRef.current();
      const baseHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const now = Date.now();
      const queue = await readQueue();
      const eligibleQueue = queue.filter(
        (m) =>
          m.domain === domain &&
          (m.status === "pending" || m.status === "retrying") &&
          m.nextRetryAt <= now
      );
      const notEligible = queue.filter(
        (m) =>
          m.domain !== domain ||
          m.status === "failed" ||
          m.status === "conflict" ||
          m.nextRetryAt > now
      );

      if (eligibleQueue.length === 0) {
        setSyncing(false);
        isSyncingRef.current = false;
        return;
      }

      const remaining: QueuedMutation[] = [];
      const newConflicts: ConflictInfo[] = [];
      let successCount = 0;

      for (const mutation of eligibleQueue) {
        try {
          const storedETag = await getStoredETag(mutation.url);
          const concurrencyHeaders: Record<string, string> = {};
          if (storedETag && !mutation.headers?.["If-Match"] && !mutation.headers?.["if-match"]) {
            concurrencyHeaders["If-Match"] = storedETag;
          }

          const headers: Record<string, string> = {
            ...baseHeaders,
            ...concurrencyHeaders,
            ...mutation.headers,
            "X-Idempotency-Key": mutation.idempotencyKey,
          };

          const res = await fetch(mutation.url, {
            method: mutation.method,
            headers,
            body:
              mutation.body !== undefined ? JSON.stringify(mutation.body) : undefined,
          });

          if (res.ok || res.status === 204) {
            const responseETag = res.headers.get("etag");
            if (responseETag) {
              await captureETag(mutation.url, responseETag);
            }
            successCount++;
            continue;
          }

          const IS_CONFLICT = res.status === 409 || res.status === 412;
          if (IS_CONFLICT) {
            let responseData: unknown = null;
            try {
              responseData = await res.json();
            } catch {}

            const serverVersion =
              (responseData as Record<string, unknown>)?.serverVersion ?? responseData;
            const clientVersion =
              (responseData as Record<string, unknown>)?.clientVersion ?? mutation.body;

            const conflict: ConflictInfo = {
              id: generateId(),
              mutation,
              serverVersion,
              clientVersion,
              conflictedAt: Date.now(),
            };

            newConflicts.push(conflict);
            remaining.push({ ...mutation, status: "conflict" });
            onConflictRef.current?.(conflict);
            continue;
          }

          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            remaining.push({ ...mutation, status: "failed" });
            continue;
          }

          if (mutation.retries >= MAX_RETRIES) {
            remaining.push({ ...mutation, status: "failed" });
          } else {
            const backoff = calcBackoff(mutation.retries);
            remaining.push({
              ...mutation,
              retries: mutation.retries + 1,
              nextRetryAt: Date.now() + backoff,
              status: "retrying",
            });
          }
        } catch {
          if (mutation.retries >= MAX_RETRIES) {
            remaining.push({ ...mutation, status: "failed" });
          } else {
            const backoff = calcBackoff(mutation.retries);
            remaining.push({
              ...mutation,
              retries: mutation.retries + 1,
              nextRetryAt: Date.now() + backoff,
              status: "retrying",
            });
          }
        }
      }

      const updatedQueue = [...notEligible, ...remaining];
      await writeQueue(updatedQueue);

      const pendingCount = updatedQueue.filter(
        (m) => m.domain === domain && (m.status === "pending" || m.status === "retrying")
      ).length;
      const failedCount = updatedQueue.filter(
        (m) => m.domain === domain && m.status === "failed"
      ).length;

      setPending(pendingCount);
      setFailedCount(failedCount);

      if (newConflicts.length > 0) {
        setConflicts((prev) => {
          const merged = [...prev, ...newConflicts];
          writeConflicts(merged);
          return merged;
        });
      }

      if (successCount > 0) {
        setLastSyncedAt(new Date());
        onSyncCompleteRef.current?.(successCount);
      }
    } finally {
      setSyncing(false);
      isSyncingRef.current = false;
    }
  }, [domain]);

  const resolveConflict = useCallback(
    async (conflictId: string, resolution: "keep-mine" | "keep-theirs") => {
      const conflict = conflicts.find((c) => c.id === conflictId);
      if (!conflict) return;

      const queue = await readQueue();
      const withoutConflict = queue.filter(
        (m) => m.id !== conflict.mutation.id
      );

      if (resolution === "keep-mine") {
        const retryMutation: QueuedMutation = {
          ...conflict.mutation,
          status: "pending",
          retries: 0,
          nextRetryAt: 0,
          headers: stripConcurrencyHeaders(conflict.mutation.headers),
          idempotencyKey: `${conflict.mutation.idempotencyKey}-overwrite-${generateId()}`,
        };
        await writeQueue([...withoutConflict, retryMutation]);
        setPending((n) => n + 1);
      } else {
        await writeQueue(withoutConflict);
      }

      const updatedConflicts = conflicts.filter((c) => c.id !== conflictId);
      setConflicts(updatedConflicts);
      await writeConflicts(updatedConflicts);
    },
    [conflicts]
  );

  const dismissConflict = useCallback(async (conflictId: string) => {
    const existing = conflicts.find((c) => c.id === conflictId);
    const updatedConflicts = conflicts.filter((c) => c.id !== conflictId);
    setConflicts(updatedConflicts);
    await writeConflicts(updatedConflicts);

    if (existing) {
      const queue = await readQueue();
      const withoutOrphan = queue.filter((m) => m.id !== existing.mutation.id);
      await writeQueue(withoutOrphan);
      const pendingCount = withoutOrphan.filter(
        (m) => m.domain === domain && (m.status === "pending" || m.status === "retrying")
      ).length;
      const failedCnt = withoutOrphan.filter((m) => m.domain === domain && m.status === "failed").length;
      setPending(pendingCount);
      setFailedCount(failedCnt);
    }
  }, [conflicts, domain]);

  const retryFailed = useCallback(async () => {
    const queue = await readQueue();
    const updated = queue.map((m) => {
      if (m.domain === domain && m.status === "failed") {
        return {
          ...m,
          status: "pending" as const,
          retries: 0,
          nextRetryAt: 0,
          headers: stripConcurrencyHeaders(m.headers),
        };
      }
      return m;
    });
    await writeQueue(updated);
    await refreshCounts();
    await drainQueue();
  }, [domain, drainQueue, refreshCounts]);

  useEffect(() => {
    const init = async () => {
      await refreshCounts();
      const persisted = await readConflicts();
      if (persisted.length > 0) {
        setConflicts(persisted.filter((c) => c.mutation.domain === domain));
      }
    };
    init();
  }, [refreshCounts, domain]);

  useEffect(() => {
    let netinfoUnsubscribe: (() => void) | null = null;
    let retryIntervalId: ReturnType<typeof setInterval> | null = null;
    let fallbackIntervalId: ReturnType<typeof setInterval> | null = null;

    const setupNetInfo = async () => {
      try {
        const NetInfo = await import("@react-native-community/netinfo");

        netinfoUnsubscribe = NetInfo.default.addEventListener(
          (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
            const online = state.isConnected === true && state.isInternetReachable !== false;
            setIsOnline(online);
            if (online) {
              drainQueue();
            }
          }
        );

        const netState: { isConnected: boolean | null; isInternetReachable: boolean | null } =
          await NetInfo.default.fetch();
        const online = netState.isConnected === true && netState.isInternetReachable !== false;
        setIsOnline(online);
        if (online) {
          drainQueue();
        }
      } catch {
        drainQueue();
        fallbackIntervalId = setInterval(() => {
          drainQueue();
        }, 30_000);
      }

      retryIntervalId = setInterval(() => {
        drainQueue();
      }, RETRY_POLL_MS);
    };

    setupNetInfo();

    return () => {
      netinfoUnsubscribe?.();
      if (retryIntervalId) clearInterval(retryIntervalId);
      if (fallbackIntervalId) clearInterval(fallbackIntervalId);
    };
  }, [drainQueue]);

  const value: SyncEngineContextValue = {
    domain,
    pending,
    syncing,
    lastSyncedAt,
    conflicts,
    failedCount,
    isOnline,
    enqueue,
    resolveConflict,
    dismissConflict,
    retryFailed,
  };

  return (
    <SyncEngineContext.Provider value={value}>
      {children}
    </SyncEngineContext.Provider>
  );
}
