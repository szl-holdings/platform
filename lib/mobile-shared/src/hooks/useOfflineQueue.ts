import { useEffect, useRef, useCallback, useState } from "react";
import { useApiStatus } from "./useApiStatus";

const QUEUE_KEY = "mobile-shared:offline-mutation-queue";
const MAX_QUEUE = 50;

export interface QueuedMutation {
  id: string;
  domain: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: unknown;
  timestamp: number;
  retries: number;
}

async function getStorage(): Promise<{ getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => Promise<void> } | null> {
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

async function replayMutations(
  queue: QueuedMutation[],
  getToken: () => Promise<string | null>
): Promise<QueuedMutation[]> {
  const failed: QueuedMutation[] = [];
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  for (const mutation of queue) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers,
        body: mutation.body !== undefined ? JSON.stringify(mutation.body) : undefined,
      });
      if (!res.ok && mutation.retries < 3) {
        failed.push({ ...mutation, retries: mutation.retries + 1 });
      }
    } catch {
      if (mutation.retries < 3) {
        failed.push({ ...mutation, retries: mutation.retries + 1 });
      }
    }
  }
  return failed;
}

interface UseOfflineQueueOptions {
  domain: string;
  getToken?: () => Promise<string | null>;
  onReplay?: (replayed: number) => void;
}

export function useOfflineQueue({
  domain,
  getToken = async () => null,
  onReplay,
}: UseOfflineQueueOptions) {
  const [queueLength, setQueueLength] = useState(0);
  const { isOffline } = useApiStatus();
  const wasOfflineRef = useRef(false);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const onReplayRef = useRef(onReplay);
  onReplayRef.current = onReplay;

  const refreshCount = useCallback(async () => {
    const q = await readQueue();
    setQueueLength(q.filter((m) => m.domain === domain).length);
  }, [domain]);

  const enqueue = useCallback(
    async (mutation: Omit<QueuedMutation, "id" | "timestamp" | "retries" | "domain">) => {
      const queue = await readQueue();
      if (queue.length >= MAX_QUEUE) return;
      const entry: QueuedMutation = {
        ...mutation,
        id: `${domain}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        domain,
        timestamp: Date.now(),
        retries: 0,
      };
      await writeQueue([...queue, entry]);
      setQueueLength((n) => n + 1);
    },
    [domain]
  );

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    const wasOffline = wasOfflineRef.current;
    wasOfflineRef.current = isOffline;

    if (!isOffline && wasOffline) {
      (async () => {
        const queue = await readQueue();
        const domainQueue = queue.filter((m) => m.domain === domain);
        const otherQueue = queue.filter((m) => m.domain !== domain);

        if (domainQueue.length > 0) {
          const failed = await replayMutations(domainQueue, getTokenRef.current);
          await writeQueue([...otherQueue, ...failed]);
          setQueueLength(failed.length);
          const replayed = domainQueue.length - failed.length;
          if (replayed > 0) onReplayRef.current?.(replayed);
        }
      })();
    }
  }, [isOffline, domain]);

  return { queueLength, enqueue, isOffline };
}
