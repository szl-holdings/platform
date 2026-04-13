import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { router, type Href } from "expo-router";
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
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return tokenData.data;
  } catch (err) {
    console.log("[Push] Could not get push token:", err);
    return null;
  }
}

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await apiPost("/api/alloy/push-token", { token, platform: Platform.OS });
    console.log("[Push] Token registered with backend");
  } catch (err) {
    console.warn("[Push] Failed to register token:", err);
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

export function usePushNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
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
        const data = response.notification.request.content.data as Record<string, unknown>;
        try {
          if (data?.type === "approval_request") {
            const workflowsHref: Href = { pathname: "/(tabs)/workflows" };
            router.push(workflowsHref);
          } else if (data?.type === "agent_complete" || data?.type === "workflow_failed") {
            const agentsHref: Href = { pathname: "/(tabs)/agents" };
            router.push(agentsHref);
          }
        } catch {
          console.warn("[Push] Navigation failed for:", data?.type);
        }
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
