import { useEffect, useRef, useState } from 'react';
import { apiFetch, getApiBase, getCachedAuthToken } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

interface NotificationCountResult {
  unreadCount: number;
}

type NotificationResponseShape =
  | { data?: Array<{ isRead: boolean }> }
  | Array<{ isRead: boolean }>;

export function parseNotificationsResponse(
  data: NotificationResponseShape,
): number {
  const arr = Array.isArray(data)
    ? data
    : ((data as { data?: Array<{ isRead: boolean }> }).data ?? []);
  return arr.filter((n) => !n.isRead).length;
}

export interface ParsedWsMessage {
  type: string;
  channel?: string;
  event?: string;
  data?: { userId?: string | number };
}

export function parseWsMessage(raw: string): ParsedWsMessage | null {
  try {
    return JSON.parse(raw) as ParsedWsMessage;
  } catch {
    return null;
  }
}

export function isNotificationChannelMessage(raw: string): boolean {
  const msg = parseWsMessage(raw);
  return msg !== null && msg.type === 'message' && msg.channel === 'notifications';
}

export function shouldRefetchForMessage(
  msg: ParsedWsMessage,
  currentUserId: string | number | undefined,
): boolean {
  if (msg.type !== 'message' || msg.channel !== 'notifications') return false;
  if (msg.event === 'notifications_read') {
    return (
      currentUserId != null &&
      String(msg.data?.userId) === String(currentUserId)
    );
  }
  return true;
}

export function buildWsUrl(apiBase: string): string {
  return `${apiBase.replace(/^https?/, (p) => (p === 'https' ? 'wss' : 'ws'))}/api/ws`;
}

export function buildSubscribePayload(
  token: string | null,
): Record<string, string> {
  const msg: Record<string, string> = {
    type: 'subscribe',
    channel: 'notifications',
  };
  if (token) msg.token = token;
  return msg;
}

export const POLL_INTERVAL_MS = 60_000;
export const RECONNECT_DELAY_MS = 5_000;

export interface NotificationEffectRefs {
  setUnreadCount: (count: number) => void;
  userIdRef: { current: string | number | undefined };
  wsRef: { current: WebSocket | null };
  deadRef: { current: boolean };
  reconnectTimerRef: { current: ReturnType<typeof setTimeout> | null };
}

export function startNotificationEffect(
  refs: NotificationEffectRefs,
): () => void {
  let mounted = true;

  async function fetchCount() {
    try {
      const data = await apiFetch<NotificationResponseShape>(
        '/api/notifications?limit=50',
      );
      const count = parseNotificationsResponse(data);
      if (mounted) refs.setUnreadCount(count);
    } catch {
      // silently ignore
    }
  }

  void fetchCount();

  const pollInterval = setInterval(() => {
    void fetchCount();
  }, POLL_INTERVAL_MS);

  function connectWs() {
    if (refs.deadRef.current) return;
    const base = getApiBase();
    if (!base) return;
    const wsUrl = buildWsUrl(base);
    const token = getCachedAuthToken();
    const ws = new WebSocket(wsUrl);
    refs.wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify(buildSubscribePayload(token)));
    };

    ws.onmessage = (ev) => {
      const msg = parseWsMessage(ev.data as string);
      if (msg && shouldRefetchForMessage(msg, refs.userIdRef.current)) {
        void fetchCount();
      }
    };

    ws.onclose = () => {
      refs.wsRef.current = null;
      if (!refs.deadRef.current) {
        refs.reconnectTimerRef.current = setTimeout(
          connectWs,
          RECONNECT_DELAY_MS,
        );
      }
    };
  }

  connectWs();

  return () => {
    mounted = false;
    refs.deadRef.current = true;
    clearInterval(pollInterval);
    if (refs.reconnectTimerRef.current)
      clearTimeout(refs.reconnectTimerRef.current);
    refs.wsRef.current?.close();
  };
}

export function useNotificationCount(): NotificationCountResult {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;
  const wsRef = useRef<WebSocket | null>(null);
  const deadRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () =>
      startNotificationEffect({
        setUnreadCount,
        userIdRef,
        wsRef,
        deadRef,
        reconnectTimerRef,
      }),
    [],
  );

  return { unreadCount };
}
