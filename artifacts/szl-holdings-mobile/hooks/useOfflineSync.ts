import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SyncStatus = "online" | "offline" | "syncing";

interface OfflineSyncOptions {
  namespace: string;
  syncFn?: () => Promise<void>;
}

export function useOfflineSync({ namespace, syncFn }: OfflineSyncOptions) {
  const [status, setStatus] = useState<SyncStatus>("online");
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const syncInProgress = useRef(false);

  const storageKey = `offline_queue_${namespace}`;

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      return navigator.onLine;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch("https://www.google.com/generate_204", {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loadPendingCount = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const queue = raw ? JSON.parse(raw) : [];
      setPendingCount(Array.isArray(queue) ? queue.length : 0);
    } catch {
      setPendingCount(0);
    }
  }, [storageKey]);

  const queueOperation = useCallback(
    async (operation: { type: string; data: unknown; timestamp: string }) => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        const queue = raw ? JSON.parse(raw) : [];
        queue.push(operation);
        await AsyncStorage.setItem(storageKey, JSON.stringify(queue));
        setPendingCount(queue.length);
      } catch {
        console.warn(`[OfflineSync] Failed to queue operation`);
      }
    },
    [storageKey]
  );

  const sync = useCallback(async () => {
    if (syncInProgress.current) return;
    const isOnline = await checkConnectivity();
    if (!isOnline) {
      setStatus("offline");
      return;
    }

    syncInProgress.current = true;
    setStatus("syncing");

    try {
      if (syncFn) {
        await syncFn();
      }

      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        await AsyncStorage.removeItem(storageKey);
        setPendingCount(0);
      }

      const now = new Date().toISOString();
      setLastSyncAt(now);
      await AsyncStorage.setItem(`last_sync_${namespace}`, now);
      setStatus("online");
    } catch {
      setStatus("offline");
    } finally {
      syncInProgress.current = false;
    }
  }, [checkConnectivity, syncFn, storageKey, namespace]);

  useEffect(() => {
    loadPendingCount();
    AsyncStorage.getItem(`last_sync_${namespace}`)
      .then((v) => {
        if (v) setLastSyncAt(v);
      })
      .catch(() => {});

    const checkStatus = async () => {
      const isOnline = await checkConnectivity();
      if (isOnline && pendingCount > 0) {
        sync();
      } else {
        setStatus(isOnline ? "online" : "offline");
      }
    };

    checkStatus();

    if (Platform.OS === "web") {
      const onOnline = () => sync();
      const onOffline = () => setStatus("offline");
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    } else {
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") checkStatus();
      });
      return () => sub.remove();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const isOnline = await checkConnectivity();
      if (isOnline && (status === "offline" || pendingCount > 0)) {
        sync();
      } else if (!isOnline && status !== "offline") {
        setStatus("offline");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [status, pendingCount]);

  return {
    status,
    isOffline: status === "offline",
    isSyncing: status === "syncing",
    pendingCount,
    lastSyncAt,
    queueOperation,
    sync,
  };
}
