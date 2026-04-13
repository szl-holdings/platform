import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { router, type Href } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
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

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}

export function usePushNotifications(enabled: boolean) {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const setupNotifications = useCallback(async () => {
    if (!enabled || Platform.OS === "web") return;

    await registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {}
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        const HOME_HREF: Href = { pathname: "/" };
        try {
          if (data?.type === "contact" || data?.type === "system") {
            router.push(HOME_HREF);
          }
        } catch {
          console.warn("[Push] Navigation failed for:", data?.type);
        }
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
