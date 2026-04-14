import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { getAuthToken, getApiBase } from "@/lib/apiClient";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (Platform.OS === "web") return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

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
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const setupNotifications = useCallback(async () => {
    if (!enabled || Platform.OS === "web") return;

    const pushToken = await registerForPushNotificationsAsync();
    if (pushToken) {
      await syncPushToken(pushToken);
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
      }
    );
  }, [enabled]);

  useEffect(() => {
    setupNotifications();
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [setupNotifications]);
}
