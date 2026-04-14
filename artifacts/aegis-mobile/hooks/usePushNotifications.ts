import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { apiPost } from "@/lib/apiClient";

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
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Push] Permission not granted");
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (err) {
    console.log("[Push] Could not get push token:", err);
    return null;
  }
}

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await apiPost("/api/firestorm/push-token", { token, platform: Platform.OS });
    console.log("[Push] Token registered with backend");
  } catch (err) {
    console.warn("[Push] Failed to register token with backend:", err);
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  if (Platform.OS === "web") return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: true },
    trigger: null,
  });
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
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log("[Push] Expo push token acquired");
        registerTokenWithBackend(token).catch((err) => {
          console.warn("[Push] Background token registration failed:", err);
        });
      }
    }).catch((err) => {
      console.warn("[Push] registerForPushNotificationsAsync failed:", err);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Push] Notification received:", notification.request.content.title);
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log("[Push] Notification tapped:", data);
      },
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);
}
