import { usePushNotifications } from "@/hooks/advisory/usePushNotifications";
import { useEffect } from "react";
import { useNotifications } from "@/context/NotificationContext";

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
