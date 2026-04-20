import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export type RealtimeConnectionStatus = 'connected' | 'reconnecting' | 'offline';

export interface RealtimeChannelMessage<T = unknown> {
  channel: string;
  event: string;
  data: T;
  timestamp: number;
  seq?: number;
}

export interface UseRealtimeChannelOptions {
  wsUrl?: string;
  token?: string;
  maxReconnectAttempts?: number;
  baseReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
  displayName?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface UseRealtimeChannelResult<T = unknown> {
  messages: RealtimeChannelMessage<T>[];
  lastMessage: RealtimeChannelMessage<T> | null;
  status: RealtimeConnectionStatus;
  isConnected: boolean;
  lastSeq: number;
  clearMessages: () => void;
}

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_BASE_DELAY_MS = 2_000;
const DEFAULT_MAX_DELAY_MS = 30_000;
const MAX_MESSAGES = 100;

export function useRealtimeChannel<T = unknown>(
  channel: string,
  options: UseRealtimeChannelOptions = {},
): UseRealtimeChannelResult<T> {
  const {
    wsUrl,
    token,
    maxReconnectAttempts = DEFAULT_MAX_ATTEMPTS,
    baseReconnectDelayMs = DEFAULT_BASE_DELAY_MS,
    maxReconnectDelayMs = DEFAULT_MAX_DELAY_MS,
    displayName,
    onConnect,
    onDisconnect,
  } = options;

  const [messages, setMessages] = useState<RealtimeChannelMessage<T>[]>([]);
  const [status, setStatus] = useState<RealtimeConnectionStatus>('offline');
  const [lastSeq, setLastSeq] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const channelRef = useRef(channel);
  const tokenRef = useRef(token);
  const lastSeqRef = useRef(0);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);

  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);
  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);

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

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    if (Platform.OS === 'web') return;

    if (attemptsRef.current >= maxReconnectAttempts) {
      setStatus('offline');
      onDisconnectRef.current?.();
      return;
    }

    if (!wsUrl) return;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        const subscribeMsg: Record<string, unknown> = {
          type: 'subscribe',
          channel: channelRef.current,
          sinceSeq: lastSeqRef.current,
        };
        if (tokenRef.current) subscribeMsg.token = tokenRef.current;
        if (displayName) subscribeMsg.displayName = displayName;
        ws.send(JSON.stringify(subscribeMsg));
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
          };

          if (parsed.type === 'connected') return;

          if (parsed.type === 'subscribed') {
            attemptsRef.current = 0;
            setStatus('connected');
            onConnectRef.current?.();
            if (parsed.missedMessages?.length) {
              for (const m of parsed.missedMessages) {
                pushMessage(m as RealtimeChannelMessage<T>);
              }
            }
            return;
          }

          if (parsed.type === 'catchup_response' && parsed.messages) {
            for (const m of parsed.messages) {
              pushMessage(m as RealtimeChannelMessage<T>);
            }
            return;
          }

          if (parsed.type === 'message' && parsed.channel === channelRef.current) {
            pushMessage({
              channel: parsed.channel,
              event: parsed.event ?? 'message',
              data: parsed.data as T,
              timestamp: parsed.timestamp ?? Date.now(),
              seq: parsed.seq,
            });
            return;
          }

          if (parsed.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus('reconnecting');
        onDisconnectRef.current?.();
        const delay = Math.min(
          baseReconnectDelayMs * 1.5 ** attemptsRef.current,
          maxReconnectDelayMs,
        );
        attemptsRef.current++;
        timerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setStatus('reconnecting');
      };
    } catch {
      const delay = Math.min(
        baseReconnectDelayMs * 1.5 ** attemptsRef.current,
        maxReconnectDelayMs,
      );
      attemptsRef.current++;
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    }
  }, [
    wsUrl,
    maxReconnectAttempts,
    baseReconnectDelayMs,
    maxReconnectDelayMs,
    displayName,
    pushMessage,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    attemptsRef.current = 0;
    lastSeqRef.current = 0;
    connect();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [channel, wsUrl, connect]);

  return {
    messages,
    lastMessage: messages[messages.length - 1] ?? null,
    status,
    isConnected: status === 'connected',
    lastSeq,
    clearMessages,
  };
}
