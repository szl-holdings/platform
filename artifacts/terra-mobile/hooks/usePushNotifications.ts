import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";
import { Platform } from "react-native";
import { useEffect, useRef, useState } from "react";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? "https://" + process.env.EXPO_PUBLIC_DOMAIN + "/api"
  : "/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

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
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setPushToken(token);
        registerTokenWithServer(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(n => {
      setNotification(n);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const PROPERTIES_HREF: Href = { pathname: "/(tabs)/properties" };
      const PIPELINE_HREF: Href = { pathname: "/(tabs)/pipeline" };
      if (data?.type === "distress_alert" || data?.type === "watchlist_update") {
        if (data?.propertyId) {
          const propertyHref: Href = { pathname: "/property/[id]", params: { id: String(data.propertyId) } };
          router.push(propertyHref);
        } else {
          router.push(PROPERTIES_HREF);
        }
      } else if (data?.type === "lead_activity") {
        router.push(PIPELINE_HREF);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { pushToken, notification };
}
