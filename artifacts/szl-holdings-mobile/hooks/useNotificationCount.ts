import { useEffect, useRef, useState } from 'react';
import { apiFetch, getApiBase, getCachedAuthToken } from '@/lib/apiClient';

interface NotificationCountResult {
  unreadCount: number;
}

export function useNotificationCount(): NotificationCountResult {
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const deadRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const data = await apiFetch<
          { data?: Array<{ isRead: boolean }> } | Array<{ isRead: boolean }>
        >('/api/notifications?limit=50');
        const arr = Array.isArray(data)
          ? data
          : ((data as { data?: Array<{ isRead: boolean }> }).data ?? []);
        const count = arr.filter((n) => !n.isRead).length;
        if (mounted) setUnreadCount(count);
      } catch {
        // silently ignore
      }
    }

    void fetchCount();

    const pollInterval = setInterval(() => {
      void fetchCount();
    }, 60000);

    function connectWs() {
      if (deadRef.current) return;
      const base = getApiBase();
      if (!base) return;
      const wsUrl = base.replace(/^https?/, (p) => (p === 'https' ? 'wss' : 'ws')) + '/api/ws';
      const token = getCachedAuthToken();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        const subMsg: Record<string, string> = { type: 'subscribe', channel: 'notifications' };
        if (token) subMsg.token = token;
        ws.send(JSON.stringify(subMsg));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as { type: string; channel?: string };
          if (msg.type === 'message' && msg.channel === 'notifications') {
            void fetchCount();
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!deadRef.current) {
          reconnectTimerRef.current = setTimeout(connectWs, 5000);
        }
      };
    }

    connectWs();

    return () => {
      mounted = false;
      deadRef.current = true;
      clearInterval(pollInterval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { unreadCount };
}
