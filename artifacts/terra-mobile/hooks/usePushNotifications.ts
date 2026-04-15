import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useState } from "react";
import { configurePushNotificationHandler } from "@szl-holdings/mobile-shared/notifications";
import { usePushNotificationsBase } from "@szl-holdings/mobile-shared/notifications";
import { setupAndroidNotificationChannels } from "@/lib/notifications";

configurePushNotificationHandler();
setupAndroidNotificationChannels().catch(() => {});

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? "https://" + process.env.EXPO_PUBLIC_DOMAIN + "/api"
  : "/api";

async function registerTokenWithServer(token: string): Promise<void> {
  try {
    await fetch(API_BASE + "/terra/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        subscriptions: ["distress_alerts", "watchlist_updates", "lead_activity"],
      }),
    });
  } catch {
    // Non-fatal: push registration failure should not crash the app
  }
}

export function usePushNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  usePushNotificationsBase({
    onTokenAcquired: async (token) => {
      setPushToken(token);
      await registerTokenWithServer(token);
    },
    onNotificationReceived: (n) => {
      setNotification(n);
    },
  });

  return { pushToken, notification };
}
