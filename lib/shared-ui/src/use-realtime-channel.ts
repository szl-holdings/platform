import { useState, useEffect, useCallback, useRef } from "react";

export type RealtimeConnectionStatus = "connected" | "reconnecting" | "offline";
export type RealtimeTransport = "websocket" | "sse";

export interface RealtimeChannelMessage<T = unknown> {
  channel: string;
  event: string;
  data: T;
  timestamp: number;
  seq?: number;
}

export interface UseRealtimeChannelOptions {
  maxReconnectAttempts?: number;
  baseReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  token?: string;
  apiBaseUrl?: string;
  enableSseFallback?: boolean;
  displayName?: string;
  onConnect?: (transport: RealtimeTransport) => void;
  onDisconnect?: () => void;
}

export interface UseRealtimeChannelResult<T = unknown> {
  messages: RealtimeChannelMessage<T>[];
  lastMessage: RealtimeChannelMessage<T> | null;
  status: RealtimeConnectionStatus;
  isConnected: boolean;
  transport: RealtimeTransport | null;
  lastSeq: number;
  clearMessages: () => void;
}

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_BASE_DELAY_MS = 1_500;
const DEFAULT_MAX_DELAY_MS = 30_000;
const MAX_MESSAGES = 200;

const SENSITIVE_CHANNELS = new Set([
  "aegis-incidents",
  "aegis:alert-feed",
  "workflow-runs",
  "bookings",
  "lyte-metrics",
  "lyte:metrics-stream",
  "vessel-positions",
  "vessels:fleet-positions",
  "terra-signals",
  "nexus:intelligence-feed",
]);

function getWebSocketUrl(): string {
  if (typeof window === "undefined") return "";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws`;
}

function getSseUrl(channel: string, apiBaseUrl: string): string {
  const base = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  return `${base}/realtime/sse?channel=${encodeURIComponent(channel)}`;
}

async function fetchWsTicket(apiBaseUrl: string): Promise<string | undefined> {
  try {
    const base = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
    const res = await fetch(`${base}auth/ws-ticket`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return undefined;
    const body = (await res.json()) as { ticket?: string; data?: { ticket?: string } };
    return body.ticket ?? body.data?.ticket ?? undefined;
  } catch {
    return undefined;
  }
}

export function useRealtimeChannel<T = unknown>(
  channel: string,
  options: UseRealtimeChannelOptions = {},
): UseRealtimeChannelResult<T> {
  const {
    maxReconnectAttempts = DEFAULT_MAX_ATTEMPTS,
    baseReconnectDelayMs = DEFAULT_BASE_DELAY_MS,
    maxReconnectDelayMs = DEFAULT_MAX_DELAY_MS,
    token: optionToken,
    apiBaseUrl = "/api",
    enableSseFallback = true,
    displayName,
    onConnect,
    onDisconnect,
  } = options;

  const [messages, setMessages] = useState<RealtimeChannelMessage<T>[]>([]);
  const [status, setStatus] = useState<RealtimeConnectionStatus>("offline");
  const [transport, setTransport] = useState<RealtimeTransport | null>(null);
  const [lastSeq, setLastSeq] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const channelRef = useRef(channel);
  const tokenRef = useRef<string | undefined>(optionToken);
  const lastSeqRef = useRef(0);
  const wsFailedRef = useRef(false);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);
  useEffect(() => { channelRef.current = channel; }, [channel]);
  useEffect(() => { tokenRef.current = optionToken; }, [optionToken]);

  const isSensitive = SENSITIVE_CHANNELS.has(channel);

  const pushMessage = useCallback((msg: RealtimeChannelMessage<T>) => {
    if (msg.seq !== undefined && msg.seq > lastSeqRef.current) {
      lastSeqRef.current = msg.seq;
      setLastSeq(msg.seq);
    }
    setMessages((prev) => {
      const next = [...prev, msg];
      return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
    });
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const connectSse = useCallback(() => {
    if (!mountedRef.current) return;
    if (typeof EventSource === "undefined") return;

    const url = getSseUrl(channelRef.current, apiBaseUrl);
    const evtSource = new EventSource(url, { withCredentials: true });
    sseRef.current = evtSource;

    evtSource.addEventListener("connected", () => {
      if (!mountedRef.current) return;
      attemptsRef.current = 0;
      setStatus("connected");
      setTransport("sse");
      onConnectRef.current?.("sse");
    });

    evtSource.onmessage = (ev) => {
      if (!mountedRef.current) return;
      try {
        const raw = JSON.parse(ev.data as string) as {
          channel: string;
          event: string;
          data: T;
          timestamp: number;
          seq?: number;
        };
        if (raw.channel === channelRef.current) {
          pushMessage(raw);
        }
      } catch { /* ignore parse errors */ }
    };

    evtSource.onerror = () => {
      if (!mountedRef.current) return;
      setStatus("reconnecting");
      evtSource.close();
      sseRef.current = null;
      const delay = Math.min(
        baseReconnectDelayMs * Math.pow(1.5, attemptsRef.current),
        maxReconnectDelayMs,
      );
      attemptsRef.current++;
      if (attemptsRef.current < maxReconnectAttempts) {
        timerRef.current = setTimeout(() => {
          if (mountedRef.current) connectSse();
        }, delay);
      } else {
        setStatus("offline");
        onDisconnectRef.current?.();
      }
    };
  }, [apiBaseUrl, baseReconnectDelayMs, maxReconnectDelayMs, maxReconnectAttempts, pushMessage]);

  const connectWs = useCallback(() => {
    if (!mountedRef.current) return;
    if (attemptsRef.current >= maxReconnectAttempts) {
      if (enableSseFallback && !wsFailedRef.current) {
        wsFailedRef.current = true;
        attemptsRef.current = 0;
        connectSse();
      } else {
        setStatus("offline");
        onDisconnectRef.current?.();
      }
      return;
    }

    const url = getWebSocketUrl();
    if (!url) {
      if (enableSseFallback) connectSse();
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }

        const sendSubscribe = (tok?: string) => {
          const msg: Record<string, unknown> = {
            type: "subscribe",
            channel: channelRef.current,
            sinceSeq: lastSeqRef.current,
          };
          if (tok) msg.token = tok;
          if (displayName) msg.displayName = displayName;
          ws.send(JSON.stringify(msg));
        };

        if (isSensitive && apiBaseUrl) {
          fetchWsTicket(apiBaseUrl).then((ticket) => {
            if (ticket) tokenRef.current = ticket;
            if (mountedRef.current && ws.readyState === WebSocket.OPEN) {
              sendSubscribe(tokenRef.current);
            }
          });
        } else {
          sendSubscribe(tokenRef.current);
        }
      };

      ws.onmessage = (ev) => {
        if (!mountedRef.current) return;
        try {
          const parsed = JSON.parse(ev.data as string) as {
            type: string;
            channel?: string;
            event?: string;
            data?: T;
            timestamp?: number;
            seq?: number;
            missedMessages?: RealtimeChannelMessage<T>[];
            messages?: RealtimeChannelMessage<T>[];
            code?: string;
          };

          if (parsed.type === "connected") return;

          if (parsed.type === "subscribed") {
            attemptsRef.current = 0;
            setStatus("connected");
            setTransport("websocket");
            onConnectRef.current?.("websocket");
            if (parsed.missedMessages?.length) {
              for (const m of parsed.missedMessages) {
                pushMessage(m as RealtimeChannelMessage<T>);
              }
            }
            return;
          }

          if (parsed.type === "catchup_response" && parsed.messages) {
            for (const m of parsed.messages) {
              pushMessage(m as RealtimeChannelMessage<T>);
            }
            return;
          }

          if (parsed.type === "message" && parsed.channel === channelRef.current) {
            pushMessage({
              channel: parsed.channel,
              event: parsed.event ?? "message",
              data: parsed.data as T,
              timestamp: parsed.timestamp ?? Date.now(),
              ...(parsed.seq !== undefined ? { seq: parsed.seq } : {}),
            });
            return;
          }

          if (parsed.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          }

          if (parsed.type === "error" && parsed.code === "unauthorized") {
            tokenRef.current = undefined;
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus("reconnecting");
        onDisconnectRef.current?.();
        const delay = Math.min(
          baseReconnectDelayMs * Math.pow(1.5, attemptsRef.current),
          maxReconnectDelayMs,
        );
        attemptsRef.current++;
        timerRef.current = setTimeout(() => {
          if (mountedRef.current) connectWs();
        }, delay);
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setStatus("reconnecting");
      };
    } catch {
      const delay = Math.min(
        baseReconnectDelayMs * Math.pow(1.5, attemptsRef.current),
        maxReconnectDelayMs,
      );
      attemptsRef.current++;
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) connectWs();
      }, delay);
    }
  }, [
    maxReconnectAttempts,
    baseReconnectDelayMs,
    maxReconnectDelayMs,
    isSensitive,
    apiBaseUrl,
    displayName,
    enableSseFallback,
    connectSse,
    pushMessage,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    wsFailedRef.current = false;
    attemptsRef.current = 0;
    lastSeqRef.current = 0;

    connectWs();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [channel, connectWs]);

  return {
    messages,
    lastMessage: messages[messages.length - 1] ?? null,
    status,
    isConnected: status === "connected",
    transport,
    lastSeq,
    clearMessages,
  };
}
