import {
  usePushNotifications as _usePushNotifications,
  registerForPushNotificationsAsync,
  sendCriticalIncidentNotification,
} from './defense/usePushNotifications';

export { registerForPushNotificationsAsync, sendCriticalIncidentNotification };

export function usePushNotifications(_enabled?: boolean) {
  return _usePushNotifications();
}
