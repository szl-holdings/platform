import { useState, useEffect, useCallback, useRef } from "react";

export type RealtimeConnectionStatus = "connected" | "reconnecting" | "offline";

export interface RealtimeChannelMessage<T = unknown> {
  channel: string;
  event: string;
  data: T;
  timestamp: number;
}

export interface UseRealtimeChannelOptions {
  maxReconnectAttempts?: number;
  baseReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  token?: string;
  apiBaseUrl?: string;
}

export interface UseRealtimeChannelResult<T = unknown> {
  messages: RealtimeChannelMessage<T>[];
  lastMessage: RealtimeChannelMessage<T> | null;
  status: RealtimeConnectionStatus;
  isConnected: boolean;
  clearMessages: () => void;
}

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_BASE_DELAY_MS = 1_500;
const DEFAULT_MAX_DELAY_MS = 30_000;
const MAX_MESSAGES = 100;

const SENSITIVE_CHANNELS = new Set([
  "aegis-incidents",
  "workflow-runs",
  "bookings",
  "lyte-metrics",
  "vessel-positions",
  "terra-signals",
]);

function getWebSocketUrl(): string {
  if (typeof window === "undefined") return "";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws`;
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
  } = options;

  const [messages, setMessages] = useState<RealtimeChannelMessage<T>[]>([]);
  const [status, setStatus] = useState<RealtimeConnectionStatus>("offline");
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const channelRef = useRef(channel);
  const tokenRef = useRef<string | undefined>(optionToken);
  const subscribedRef = useRef(false);

  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  useEffect(() => {
    tokenRef.current = optionToken;
  }, [optionToken]);

  const isSensitive = SENSITIVE_CHANNELS.has(channel);


  function connect() {
    if (!mountedRef.current) return;
    if (attemptsRef.current >= maxReconnectAttempts) {
      setStatus("offline");
      return;
    }

    const url = getWebSocketUrl();
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      subscribedRef.current = false;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }

        const sendSubscribe = (tok?: string) => {
          const subscribeMsg: Record<string, unknown> = {
            type: "subscribe",
            channel: channelRef.current,
          };
          if (tok) subscribeMsg.token = tok;
          ws.send(JSON.stringify(subscribeMsg));
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

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            channel?: string;
            event?: string;
            data?: T;
            timestamp?: number;
            code?: string;
            message?: string;
          };

          if (msg.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            return;
          }

          if (msg.type === "subscribed" && msg.channel === channelRef.current) {
            subscribedRef.current = true;
            attemptsRef.current = 0;
            setStatus("connected");
            return;
          }

          if (msg.type === "error") {
            if (msg.code === "unauthorized") {
              tokenRef.current = undefined;
              ws.onclose = null;
              ws.close();
              wsRef.current = null;
              subscribedRef.current = false;
              setStatus("reconnecting");
              const delay = Math.min(
                baseReconnectDelayMs * 2 ** attemptsRef.current,
                maxReconnectDelayMs,
              );
              attemptsRef.current++;
              timerRef.current = setTimeout(() => {
                if (mountedRef.current) connect();
              }, delay);
            }
            return;
          }

          if (
            msg.type === "message" &&
            msg.channel === channelRef.current &&
            msg.event
          ) {
            const channelMsg: RealtimeChannelMessage<T> = {
              channel: msg.channel,
              event: msg.event,
              data: msg.data as T,
              timestamp: msg.timestamp ?? Date.now(),
            };
            setMessages((prev) => [channelMsg, ...prev].slice(0, MAX_MESSAGES));
          }
        } catch {
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        wsRef.current = null;
        subscribedRef.current = false;
        setStatus("reconnecting");
        const delay = Math.min(
          baseReconnectDelayMs * 2 ** attemptsRef.current,
          maxReconnectDelayMs,
        );
        attemptsRef.current++;
        timerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setStatus("offline");
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && subscribedRef.current) {
      const tok = tokenRef.current;
      const subscribeMsg: Record<string, unknown> = { type: "subscribe", channel };
      if (tok) subscribeMsg.token = tok;
      wsRef.current.send(JSON.stringify(subscribeMsg));
      subscribedRef.current = false;
    }
  }, [channel]);

  const clearMessages = useCallback(() => setMessages([]), []);
  const lastMessage = messages[0] ?? null;

  return {
    messages,
    lastMessage,
    status,
    isConnected: status === "connected",
    clearMessages,
  };
}
