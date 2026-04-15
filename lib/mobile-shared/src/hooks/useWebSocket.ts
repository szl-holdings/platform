import { useEffect, useRef, useCallback, useState } from "react";
import { Platform } from "react-native";

export type WsStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface WebSocketOptions<T> {
  url: string | null;
  channel: string;
  token?: string | null;
  onMessage?: (data: T) => void;
  onInvalidate?: () => void;
  enabled?: boolean;
  heartbeatMs?: number;
  reconnectMs?: number;
}

export interface WebSocketResult {
  status: WsStatus;
  send: (payload: unknown) => void;
  disconnect: () => void;
  reconnect: () => void;
}

interface WsEnvelope {
  type: string;
  channel?: string;
  event?: string;
  data?: unknown;
  clientId?: string;
  timestamp?: number;
  code?: string;
  message?: string;
}

export function useWebSocket<T = unknown>({
  url,
  channel,
  token,
  onMessage,
  onInvalidate,
  enabled = true,
  heartbeatMs = 25_000,
  reconnectMs = 5_000,
}: WebSocketOptions<T>): WebSocketResult {
  const [status, setStatus] = useState<WsStatus>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const onMessageRef = useRef(onMessage);
  const onInvalidateRef = useRef(onInvalidate);
  const tokenRef = useRef(token);

  onMessageRef.current = onMessage;
  onInvalidateRef.current = onInvalidate;
  tokenRef.current = token;

  const cleanup = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (wsRef.current) {
      const ws = wsRef.current;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.onopen = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled || !url) return;
    if (Platform.OS === "web") return;
    cleanup();
    setStatus("connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channel,
          token: tokenRef.current ?? undefined,
        })
      );
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, heartbeatMs);
    };

    ws.onmessage = (ev) => {
      if (!mountedRef.current) return;
      try {
        const envelope: WsEnvelope = JSON.parse(ev.data as string);
        if (envelope.type === "pong") return;
        if (envelope.type === "connected") return;
        if (envelope.type === "subscribed") return;
        if (envelope.data) {
          onMessageRef.current?.(envelope.data as T);
          onInvalidateRef.current?.();
        }
      } catch {}
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus("error");
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("disconnected");
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      reconnectRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, reconnectMs);
    };
  }, [url, channel, enabled, heartbeatMs, reconnectMs, cleanup]);

  const send = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const reconnect = useCallback(() => {
    cleanup();
    connect();
  }, [cleanup, connect]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled && url) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [url, enabled, connect, cleanup]);

  return { status, send, disconnect, reconnect };
}
