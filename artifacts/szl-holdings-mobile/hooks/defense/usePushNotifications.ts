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
    onNotificationResponse: (response) => {
      // Server payloads use both `screen` (advisory hook convention) and
      // `deepLink` (escalation flow convention). Honor either so a
      // notification tap routes to the correct mobile screen — e.g.
      // `/(shell)/quick-actions` for high/critical approval pushes.
      const data = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      const target =
        (typeof data?.screen === 'string' ? data.screen : undefined) ??
        (typeof data?.deepLink === 'string' ? data.deepLink : undefined);
      if (!target) return;
      try {
        // Lazy require so the hook stays usable in test/SSR contexts where
        // expo-router may not be initialised.
        const { router } = require('expo-router') as {
          router: { push: (path: string) => void };
        };
        router.push(target);
      } catch {
        // Routing failures are non-fatal; user can navigate manually.
      }
    },
  });
}
