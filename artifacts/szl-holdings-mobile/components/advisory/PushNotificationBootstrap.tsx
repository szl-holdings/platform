import { useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { usePushNotifications } from '@/hooks/advisory/usePushNotifications';

export function PushNotificationBootstrap() {
  const { notification } = usePushNotifications();
  const { refresh } = useNotifications();

  useEffect(() => {
    if (notification) {
      refresh();
    }
  }, [notification, refresh]);

  return null;
}
