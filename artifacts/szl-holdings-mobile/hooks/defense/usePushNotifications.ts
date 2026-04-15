import { Platform } from "react-native";
import { apiPost } from "@/lib/apiClient";
import {
  configurePushNotificationHandler,
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
} from "@szl-holdings/mobile-shared/notifications";
import { usePushNotificationsBase } from "@szl-holdings/mobile-shared/notifications";
import { setupAndroidNotificationChannels } from "@/lib/notifications";

configurePushNotificationHandler();
setupAndroidNotificationChannels().catch(() => {});

export { registerForPushNotificationsAsync, scheduleLocalNotification };

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await apiPost("/api/push-tokens", {
      token,
      platform: Platform.OS,
      appId: "aegis-mobile",
    });
    console.log("[Push] Token registered with backend (aegis-mobile)");
  } catch (err) {
    console.warn("[Push] Failed to register token with backend:", err);
  }
}

export async function sendCriticalIncidentNotification(incidentTitle: string, severity: string) {
  if (Platform.OS === "web") return;
  await scheduleLocalNotification(
    `${severity.toUpperCase()} Incident`,
    incidentTitle,
    { type: "incident", severity },
  );
}

export function usePushNotifications() {
  usePushNotificationsBase({
    onTokenAcquired: registerTokenWithBackend,
  });
}
