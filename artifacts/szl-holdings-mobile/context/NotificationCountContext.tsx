import React, { createContext, type ReactNode, useContext } from 'react';
import { useNotificationCount } from '@/hooks/useNotificationCount';

interface NotificationCountContextValue {
  unreadCount: number;
}

const NotificationCountContext = createContext<NotificationCountContextValue>({ unreadCount: 0 });

export function NotificationCountProvider({ children }: { children: ReactNode }) {
  const { unreadCount } = useNotificationCount();
  return (
    <NotificationCountContext.Provider value={{ unreadCount }}>
      {children}
    </NotificationCountContext.Provider>
  );
}

export function useNotificationCountContext(): NotificationCountContextValue {
  return useContext(NotificationCountContext);
}
