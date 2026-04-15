import { Platform } from "react-native";
import {
  configurePushNotificationHandler,
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
} from "@szl-holdings/mobile-shared/notifications";
import { usePushNotificationsBase } from "@szl-holdings/mobile-shared/notifications";

configurePushNotificationHandler();

export { registerForPushNotificationsAsync, scheduleLocalNotification };

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    console.log("[Push] CORTEX token acquired:", token.slice(0, 20) + "...");
  } catch (err) {
    console.warn("[Push] Failed to register token:", err);
  }
}

export function usePushNotifications() {
  usePushNotificationsBase({
    onTokenAcquired: registerTokenWithBackend,
  });
}
