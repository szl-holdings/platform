import {
  configurePushNotificationHandler,
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
  usePushNotificationsBase,
} from '@szl-holdings/mobile-shared/notifications';
import { Platform } from 'react-native';
import { apiPost } from '@/lib/apiClient';
import { setupAndroidNotificationChannels } from '@/lib/notifications';

configurePushNotificationHandler();
setupAndroidNotificationChannels().catch(() => {});

export { registerForPushNotificationsAsync, scheduleLocalNotification };

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await apiPost('/api/push-tokens', {
      token,
      platform: Platform.OS,
      appId: 'aegis-mobile',
    });
  } catch (_err) {
  }
}

export async function sendCriticalIncidentNotification(incidentTitle: string, severity: string) {
  if (Platform.OS === 'web') return;
  await scheduleLocalNotification(`${severity.toUpperCase()} Incident`, incidentTitle, {
    type: 'incident',
    severity,
  });
}

export function usePushNotifications() {
  usePushNotificationsBase({
    onTokenAcquired: registerTokenWithBackend,
  });
}
