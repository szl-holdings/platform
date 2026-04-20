import {
  usePushNotifications as _usePushNotifications,
  registerForPushNotificationsAsync,
  sendCriticalIncidentNotification,
} from './defense/usePushNotifications';

export { registerForPushNotificationsAsync, sendCriticalIncidentNotification };

export function usePushNotifications(enabled?: boolean) {
  return _usePushNotifications();
}
