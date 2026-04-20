import {
  configurePushNotificationHandler,
  registerForPushNotificationsAsync,
  usePushNotificationsBase,
} from '@szl-holdings/mobile-shared/notifications';
import { Platform } from 'react-native';

configurePushNotificationHandler({ shouldPlaySound: false });

export { registerForPushNotificationsAsync };

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  }
  return '/api';
}

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/push-tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        appId: 'stephen-mobile',
      }),
    });
  } catch {
    // Non-fatal: token registration failure should not crash the app
  }
}

export function usePushNotifications(enabled: boolean) {
  usePushNotificationsBase({
    enabled,
    onTokenAcquired: registerTokenWithBackend,
  });
}
