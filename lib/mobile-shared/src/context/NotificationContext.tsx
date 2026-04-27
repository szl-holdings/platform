import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppState } from 'react-native';

export interface AppNotification {
  id: number;
  userId?: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'action_required';
  channel?: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
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

export interface NotificationProviderConfig {
  apiBase: string;
  getAuthToken?: () => Promise<string | null>;
  enabled?: boolean;
  pollInterval?: number;
}

export interface NotificationProviderProps extends NotificationProviderConfig {
  children: ReactNode;
}

async function defaultGetAuthToken(): Promise<string | null> {
  return null;
}

export function NotificationProvider({
  children,
  apiBase,
  getAuthToken = defaultGetAuthToken,
  enabled = true,
  pollInterval = 30_000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const makeRequest = useCallback(
    async (path: string, method = 'GET', body?: unknown): Promise<Response> => {
      const authToken = await getAuthToken();
      return fetch(`${apiBase}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    },
    [apiBase, getAuthToken],
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const res = await makeRequest('/notifications');
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data ?? json ?? []);
      }
    } catch (_err) {
    } finally {
      setIsLoading(false);
    }
  }, [enabled, makeRequest]);

  const markRead = useCallback(
    async (id: number) => {
      try {
        const res = await makeRequest(`/notifications/${id}/read`, 'PATCH');
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
            ),
          );
        }
      } catch (_err) {
      }
    },
    [makeRequest],
  );

  const markAllRead = useCallback(async () => {
    try {
      const res = await makeRequest('/notifications/read-all', 'PATCH');
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
        );
      }
    } catch (_err) {
    }
  }, [makeRequest]);

  const deleteNotification = useCallback(
    async (id: number) => {
      try {
        const res = await makeRequest(`/notifications/${id}`, 'DELETE');
        if (res.ok) {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }
      } catch (_err) {
      }
    },
    [makeRequest],
  );

  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(refresh, pollInterval);
    return () => clearInterval(interval);
  }, [enabled, pollInterval, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refresh();
      }
    });
    return () => subscription.remove();
  }, [enabled, refresh]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refresh,
        markRead,
        markAllRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext);
}
