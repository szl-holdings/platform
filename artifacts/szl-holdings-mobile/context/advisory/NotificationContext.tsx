import React, { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

export interface AppNotification {
  id: number;
  userId: number;
  type: "info" | "success" | "warning" | "error" | "action_required";
  channel: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  deleteNotification: async () => {},
});

async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof window !== "undefined" ? window.localStorage.getItem("cj_auth_token") : null;
    }
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync("cj_auth_token");
  } catch {
    return null;
  }
}

async function apiCall(path: string, method = "GET", body?: unknown): Promise<Response> {
  const authToken = await getAuthToken();
  return fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await apiCall("/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data ?? json ?? []);
      }
    } catch (err) {
      console.warn("[notifications] Failed to fetch:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markRead = useCallback(async (id: number) => {
    try {
      const res = await apiCall(`/notifications/${id}/read`, "PATCH");
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
      }
    } catch (err) {
      console.warn("[notifications] Failed to mark read:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await apiCall("/notifications/read-all", "PATCH");
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
      }
    } catch (err) {
      console.warn("[notifications] Failed to mark all read:", err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      const res = await apiCall(`/notifications/${id}`, "DELETE");
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.warn("[notifications] Failed to delete:", err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isLoading, refresh, markRead, markAllRead, deleteNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
