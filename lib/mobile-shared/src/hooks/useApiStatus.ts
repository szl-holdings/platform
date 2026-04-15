import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

type ApiStatus = "checking" | "connected" | "degraded" | "offline";

export type SyncAwareStatus = ApiStatus | "syncing" | "pending" | "conflict";

export interface ApiStatusResult {
  status: ApiStatus;
  syncAwareStatus: SyncAwareStatus;
  isOffline: boolean;
  isDegraded: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflictCount: number;
  lastCheckedAt: Date | null;
  retry: () => void;
  setSyncState: (state: { isSyncing?: boolean; pendingCount?: number; conflictCount?: number }) => void;
}

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : null;

const CHECK_INTERVAL_MS = 30_000;
const DEGRADED_LATENCY_MS = 3_000;
const TIMEOUT_MS = 5_000;

async function checkApiHealth(): Promise<{ status: ApiStatus; latencyMs: number }> {
  if (!API_BASE) {
    return { status: "connected", latencyMs: 0 };
  }
  const endpoint = `${API_BASE}/api/health`;
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, { method: "GET", signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;
    if (!res.ok) return { status: "degraded", latencyMs };
    if (latencyMs > DEGRADED_LATENCY_MS) return { status: "degraded", latencyMs };
    return { status: "connected", latencyMs };
  } catch {
    clearTimeout(timeoutId);
    return { status: "offline", latencyMs: Date.now() - start };
  }
}

export function useApiStatus(): ApiStatusResult {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<ApiStatus>("checking");

  const runCheck = useCallback(async () => {
    const result = await checkApiHealth();
    const prev = prevStatusRef.current;
    prevStatusRef.current = result.status;
    setStatus(result.status);
    setLastCheckedAt(new Date());
    if (
      result.status === "connected" &&
      (prev === "offline" || prev === "degraded" || prev === "checking")
    ) {
      queryClient.invalidateQueries();
    }
  }, [queryClient]);

  const setSyncState = useCallback((state: { isSyncing?: boolean; pendingCount?: number; conflictCount?: number }) => {
    if (state.isSyncing !== undefined) setIsSyncing(state.isSyncing);
    if (state.pendingCount !== undefined) setPendingCount(state.pendingCount);
    if (state.conflictCount !== undefined) setConflictCount(state.conflictCount);
  }, []);

  useEffect(() => {
    runCheck();
    timerRef.current = setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runCheck]);

  const syncAwareStatus: SyncAwareStatus = (() => {
    if (status === "offline") return "offline";
    if (isSyncing) return "syncing";
    if (conflictCount > 0) return "conflict";
    if (pendingCount > 0) return "pending";
    return status;
  })();

  return {
    status,
    syncAwareStatus,
    isOffline: status === "offline",
    isDegraded: status === "degraded",
    isSyncing,
    pendingCount,
    conflictCount,
    lastCheckedAt,
    retry: runCheck,
    setSyncState,
  };
}
