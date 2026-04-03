import { useState, useEffect, useRef, useCallback } from "react";

const WS_RECONNECT_BASE_MS = 1_000;
const WS_RECONNECT_MAX_MS = 30_000;
const WS_MAX_RECONNECT_ATTEMPTS = 10;

export interface RealtimeChannelOptions {
  onMessage?: (event: string, data: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

function getWebSocketUrl(): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const wsProtocol = base.startsWith("https") ? "wss" : "ws";
  const host = base.replace(/^https?:\/\//, "");
  return `${wsProtocol}://${host}/ws`;
}

export function useRealtimeChannel(
  channel: string,
  options: RealtimeChannelOptions = {},
) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (reconnectAttempts.current >= WS_MAX_RECONNECT_ATTEMPTS) return;

    try {
      const url = getWebSocketUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        ws.send(JSON.stringify({ type: "subscribe", channel }));
        setIsConnected(true);
        optionsRef.current.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            channel?: string;
            event?: string;
            data?: unknown;
          };

          if (msg.type === "ping") {
            ws.send(JSON.stringify({ type: "ping" }));
          } else if (msg.type === "message" && msg.channel === channel) {
            optionsRef.current.onMessage?.(msg.event ?? "unknown", msg.data);
          }
        } catch {
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        optionsRef.current.onDisconnect?.();
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      scheduleReconnect();
    }
  }, [channel]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= WS_MAX_RECONNECT_ATTEMPTS) return;
    const delay = Math.min(
      WS_RECONNECT_BASE_MS * 2 ** reconnectAttempts.current,
      WS_RECONNECT_MAX_MS,
    );
    reconnectAttempts.current++;
    reconnectTimer.current = setTimeout(connect, delay);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((event: string, data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "publish", channel, event, data }));
    }
  }, [channel]);

  return { isConnected, send };
}

export interface FeatureFlag {
  key: string;
  isEnabled: boolean;
  rolloutPercentage: number;
}

const flagCache = new Map<string, { value: boolean; fetchedAt: number }>();
const CACHE_TTL_MS = 60_000;

export function useFeatureFlag(flagKey: string, defaultValue = false): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const cached = flagCache.get(flagKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.value;
    }
    return defaultValue;
  });

  useEffect(() => {
    let cancelled = false;

    const cached = flagCache.get(flagKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setIsEnabled(cached.value);
      return;
    }

    const baseUrl = typeof window !== "undefined"
      ? window.location.origin
      : "";

    fetch(`${baseUrl}/api/feature-flags/check/${flagKey}`, {
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => (r.ok ? r.json() as Promise<{ isEnabled: boolean }> : null))
      .then((data) => {
        if (!cancelled && data) {
          const value = data.isEnabled;
          flagCache.set(flagKey, { value, fetchedAt: Date.now() });
          setIsEnabled(value);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [flagKey, defaultValue]);

  return isEnabled;
}
