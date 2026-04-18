import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

export interface ApiNotification {
  id: number;
  userId: number;
  type: "info" | "warning" | "error" | "success" | "action_required";
  channel: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface LiveNotification {
  id: string;
  appId: string;
  appName: string;
  title: string;
  message: string;
  level: "info" | "warning" | "critical";
  timestamp: Date;
  read: boolean;
  actionUrl?: string | null;
}

function typeToLevel(type: ApiNotification["type"]): LiveNotification["level"] {
  if (type === "error" || type === "action_required") return "critical";
  if (type === "warning") return "warning";
  return "info";
}

function apiToLive(n: ApiNotification, appName = "System"): LiveNotification {
  return {
    id: `api-${n.id}`,
    appId: "system",
    appName,
    title: n.title,
    message: n.message,
    level: typeToLevel(n.type),
    timestamp: new Date(n.createdAt),
    read: n.isRead,
    actionUrl: n.actionUrl,
  };
}

const WS_RECONNECT_BASE_MS = 2_000;
const WS_RECONNECT_MAX_MS = 30_000;
const WS_MAX_RECONNECT_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 30_000;

function getWebSocketUrl(): string {
  if (typeof window === "undefined") return "";
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${wsProtocol}://${window.location.host}/ws`;
}

export interface NotificationCenterState {
  notifications: LiveNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  isConnected: boolean;
}

export function useNotificationCenter(appName: string): NotificationCenterState {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const appNameRef = useRef(appName);
  appNameRef.current = appName;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchNotifications = useCallback(() => {
    return fetch("/api/notifications", { credentials: "include" })
      .then((r) => {
        if (!r.ok) return;
        return r.json();
      })
      .then((data: unknown) => {
        if (!mountedRef.current) return;
        if (data && typeof data === "object" && "data" in data) {
          const list = (data as { data: ApiNotification[] }).data;
          setNotifications(list.map((n) => apiToLive(n, appNameRef.current)));
        }
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications", { credentials: "include" })
      .then((r) => {
        if (!r.ok) return;
        return r.json();
      })
      .then((data: unknown) => {
        if (cancelled || !mountedRef.current) return;
        if (data && typeof data === "object" && "data" in data) {
          const list = (data as { data: ApiNotification[] }).data;
          setNotifications(list.map((n) => apiToLive(n, appName)));
        }
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
        toast.error("Unable to load notifications.");
      });
    return () => {
      cancelled = true;
    };
  }, [appName]);

  useEffect(() => {
    const poll = () => {
      fetch("/api/notifications/count", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: unknown) => {
          if (!mountedRef.current || data === null) return;
          const serverCount =
            data && typeof data === "object" && "unreadCount" in data
              ? Number((data as { unreadCount: number }).unreadCount)
              : 0;
          setNotifications((prev) => {
            const localCount = prev.filter((n) => !n.read).length;
            if (localCount !== serverCount) {
              void fetchNotifications();
            }
            return prev;
          });
        })
        .catch(() => {});
    };

    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectAttemptsRef.current >= WS_MAX_RECONNECT_ATTEMPTS) return;

    try {
      const url = getWebSocketUrl();
      if (!url) return;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        reconnectAttemptsRef.current = 0;
        ws.send(JSON.stringify({ type: "subscribe", channel: "notifications" }));
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            channel?: string;
            event?: string;
            data?: unknown;
          };
          if (msg.type === "message" && msg.channel === "notifications" && msg.event === "new_notification") {
            const raw = msg.data as {
              id?: number | string;
              type?: string;
              title?: string;
              message?: string;
              actionUrl?: string | null;
              action_url?: string | null;
              appId?: string;
              severity?: string;
              isRead?: boolean;
              is_read?: boolean;
              createdAt?: string;
              created_at?: string;
            };
            const liveLevel = (raw.severity as LiveNotification["level"]) || typeToLevel((raw.type as ApiNotification["type"]) || "info");
            const live: LiveNotification = {
              id: `ws-${raw.id ?? Date.now()}-${Math.random().toString(36).slice(2)}`,
              appId: raw.appId ?? "system",
              appName: raw.appId ? appName : (raw.appId ?? "System"),
              title: raw.title ?? "New Notification",
              message: raw.message ?? "",
              level: liveLevel,
              timestamp: new Date(raw.createdAt ?? raw.created_at ?? Date.now()),
              read: raw.isRead ?? raw.is_read ?? false,
              actionUrl: raw.actionUrl ?? raw.action_url ?? null,
            };
            setNotifications((prev) => {
              if (prev.some((n) => n.title === live.title && n.message === live.message && Math.abs(n.timestamp.getTime() - live.timestamp.getTime()) < 5000)) {
                return prev;
              }
              return [live, ...prev].slice(0, 50);
            });
          }
        } catch {
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;
        const delay = Math.min(WS_RECONNECT_BASE_MS * 2 ** reconnectAttemptsRef.current, WS_RECONNECT_MAX_MS);
        reconnectAttemptsRef.current++;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
    }
  }, [appName]);

  useEffect(() => {
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    if (id.startsWith("api-")) {
      const numId = parseInt(id.replace("api-", ""), 10);
      if (!isNaN(numId)) {
        fetch(`/api/notifications/${numId}/read`, { method: "PATCH", credentials: "include" }).catch((err) => {
          console.error("Failed to mark notification as read:", err);
          toast.error("Failed to mark notification as read.");
        });
      }
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    fetch("/api/notifications/read-all", { method: "PATCH", credentials: "include" }).catch((err) => {
      console.error("Failed to mark all notifications as read:", err);
      toast.error("Failed to mark all notifications as read.");
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, isConnected };
}
