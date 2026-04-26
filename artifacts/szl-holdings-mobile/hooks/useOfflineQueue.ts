import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface QueueEntry {
  id: string;
  type: string;
  payload: unknown;
  queuedAt: number;
  retryCount: number;
  lastAttemptAt?: number;
}

export type FlushResult = { succeeded: string[]; failed: string[]; remaining: QueueEntry[] };

const STORAGE_KEY = 'szl:offline:action-queue';
const MAX_RETRIES = 5;
const POLL_INTERVAL_MS = 5000;

// Additional queue storage keys used by existing operational flows
// (mobile-shared sync engine, CORTEX approvals, defense tradecraft).
// The banner and flush watch all of them so users see the real total.
const LEGACY_QUEUE_KEYS = [
  'mobile-shared:offline-mutation-queue',
  'cortex:approval-offline-queue',
  'cortex:approval-comment-offline-queue',
  'cortex:approval-escalation-offline-queue',
  'defense:tradecraft-offline-queue',
] as const;

async function countLegacyQueues(): Promise<number> {
  let total = 0;
  for (const key of LEGACY_QUEUE_KEYS) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items)) total += items.length;
      }
    } catch {
      // ignore parse errors for individual queues
    }
  }
  return total;
}

async function readQueue(): Promise<QueueEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(entries: QueueEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Append a new action to the offline queue.
 * Safe to call from any component or hook — does not require the queue hook to be mounted.
 */
export async function enqueueOfflineAction(type: string, payload: unknown): Promise<string> {
  const entry: QueueEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    queuedAt: Date.now(),
    retryCount: 0,
  };
  const current = await readQueue();
  await writeQueue([...current, entry]);
  return entry.id;
}

/**
 * Remove a specific entry from the queue by id.
 */
export async function dequeueOfflineAction(id: string): Promise<void> {
  const current = await readQueue();
  await writeQueue(current.filter((e) => e.id !== id));
}

/**
 * Offline-first action queue hook backed by AsyncStorage.
 *
 * Provides:
 * - `queue`       — live reactive snapshot of pending actions
 * - `enqueue`     — add an action to the queue (persisted immediately)
 * - `flush`       — attempt to execute all queued actions; removes succeeded entries,
 *                   increments retryCount on failure, and drops entries exceeding MAX_RETRIES
 * - `clear`       — wipe the entire queue
 * - `refresh`     — manually re-read queue from storage
 *
 * The hook polls storage every POLL_INTERVAL_MS so multiple hook instances
 * across screens stay in sync without a shared state layer.
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [legacyCount, setLegacyCount] = useState(0);
  const [flushing, setFlushing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const [entries, legacy] = await Promise.all([readQueue(), countLegacyQueues()]);
    if (mountedRef.current) {
      setQueue(entries);
      setLegacyCount(legacy);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const enqueue = useCallback(async (type: string, payload: unknown): Promise<string> => {
    const id = await enqueueOfflineAction(type, payload);
    await refresh();
    return id;
  }, [refresh]);

  /**
   * Flush the queue using the provided executor.
   * executor(entry) should return a Promise that resolves on success or rejects on failure.
   */
  const flush = useCallback(async (
    executor: (entry: QueueEntry) => Promise<void>,
  ): Promise<FlushResult> => {
    if (flushing) return { succeeded: [], failed: [], remaining: queue };
    setFlushing(true);

    const current = await readQueue();
    const succeeded: string[] = [];
    const failed: string[] = [];
    const surviving: QueueEntry[] = [];

    for (const entry of current) {
      try {
        await executor(entry);
        succeeded.push(entry.id);
      } catch {
        const updated: QueueEntry = {
          ...entry,
          retryCount: entry.retryCount + 1,
          lastAttemptAt: Date.now(),
        };
        if (updated.retryCount <= MAX_RETRIES) {
          surviving.push(updated);
        } else {
          failed.push(entry.id);
        }
      }
    }

    await writeQueue(surviving);
    if (mountedRef.current) {
      setQueue(surviving);
      setFlushing(false);
    }

    return { succeeded, failed, remaining: surviving };
  }, [flushing, queue]);

  const clear = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    if (mountedRef.current) setQueue([]);
  }, []);

  return {
    queue,
    queueCount: queue.length,
    totalQueueCount: queue.length + legacyCount,
    legacyCount,
    flushing,
    enqueue,
    flush,
    clear,
    refresh,
  };
}
