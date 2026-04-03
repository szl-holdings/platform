import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

type ApiStatus = "checking" | "connected" | "degraded" | "offline";

interface ApiStatusResult {
  status: ApiStatus;
  isOffline: boolean;
  isDegraded: boolean;
  lastCheckedAt: Date | null;
  retry: () => void;
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

  useEffect(() => {
    runCheck();
    timerRef.current = setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runCheck]);

  return {
    status,
    isOffline: status === "offline",
    isDegraded: status === "degraded",
    lastCheckedAt,
    retry: runCheck,
  };
}
