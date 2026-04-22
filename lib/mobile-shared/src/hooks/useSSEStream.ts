import { useCallback, useEffect, useRef, useState } from 'react';

export type SSEConnectionStatus = 'connecting' | 'connected' | 'error' | 'reconnecting' | 'closed';

export interface SSEStreamOptions<T = unknown> {
  url: string;
  enabled?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  onEvent?: (eventType: string, data: T) => void;
}

export function useSSEStream<T = unknown>({
  url,
  enabled = true,
  reconnectDelay = 3000,
  maxReconnectAttempts = 5,
  onEvent,
}: SSEStreamOptions<T>) {
  const [status, setStatus] = useState<SSEConnectionStatus>('connecting');
  const [lastEvent, setLastEvent] = useState<{ type: string; data: T } | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  const posRef = useRef(0);
  const onEventRef = useRef(onEvent);

  enabledRef.current = enabled;
  onEventRef.current = onEvent;

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();
    if (!enabledRef.current) return;

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    posRef.current = 0;
    setStatus('connecting');

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Cache-Control', 'no-cache');

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED && xhr.status === 200) {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
      }
    };

    xhr.onprogress = () => {
      const newText = xhr.responseText.slice(posRef.current);
      posRef.current = xhr.responseText.length;
      if (!newText) return;

      const chunks = newText.split('\n\n');
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        let eventType = 'message';
        const dataLines: string[] = [];

        for (const line of chunk.split('\n')) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          }
        }

        if (dataLines.length > 0) {
          const rawData = dataLines.join('\n');
          try {
            const parsed = JSON.parse(rawData) as T;
            setLastEvent({ type: eventType, data: parsed });
            onEventRef.current?.(eventType, parsed);
          } catch {}
        }
      }
    };

    xhr.onerror = () => {
      setStatus('error');
      scheduleReconnectRef.current?.();
    };

    xhr.onload = () => {
      scheduleReconnectRef.current?.();
    };

    xhr.send();
  }, [url, cleanup]);

  const scheduleReconnectRef = useRef<(() => void) | null>(null);

  const scheduleReconnect = useCallback(() => {
    if (!enabledRef.current) return;
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setStatus('error');
      return;
    }
    reconnectAttemptsRef.current += 1;
    setStatus('reconnecting');
    const delay = Math.min(reconnectDelay * reconnectAttemptsRef.current, 30000);
    reconnectTimerRef.current = setTimeout(() => {
      if (enabledRef.current) connect();
    }, delay);
  }, [connect, maxReconnectAttempts, reconnectDelay]);

  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
  }, [scheduleReconnect]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      cleanup();
      setStatus('closed');
    }
    return cleanup;
  }, [enabled, connect, cleanup]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return { status, lastEvent, reconnect };
}
