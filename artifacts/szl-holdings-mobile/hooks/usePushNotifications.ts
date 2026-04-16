import { sendCriticalIncidentNotification, registerForPushNotificationsAsync, usePushNotifications as _usePushNotifications } from "./defense/usePushNotifications";

export { sendCriticalIncidentNotification, registerForPushNotificationsAsync };

export function usePushNotifications(enabled?: boolean) {
  return _usePushNotifications();
}
