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

const AUTH_TOKEN_KEY = "terra_auth_token";

async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_KEY)
        : null;
    }
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function registerTokenWithServer(token: string): Promise<void> {
  try {
    const authToken = await getAuthToken();
    if (!authToken) return;
    await fetch(API_BASE + "/push-tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        appId: "terra-mobile",
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
