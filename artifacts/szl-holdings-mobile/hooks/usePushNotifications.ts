import { Platform } from "react-native";
import { getAuthToken, getApiBase } from "@/lib/apiClient";
import {
  configurePushNotificationHandler,
  registerForPushNotificationsAsync,
} from "@szl-holdings/mobile-shared/notifications";
import { usePushNotificationsBase } from "@szl-holdings/mobile-shared/notifications";

configurePushNotificationHandler();

export { registerForPushNotificationsAsync };

async function syncPushToken(pushToken: string): Promise<void> {
  const authToken = await getAuthToken();
  if (!authToken) return;
  try {
    await fetch(`${getApiBase()}/api/holdings/push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token: pushToken,
        platform: Platform.OS,
      }),
    });
  } catch {
  }
}

export function usePushNotifications(enabled: boolean) {
  usePushNotificationsBase({
    enabled,
    onTokenAcquired: syncPushToken,
  });
}
