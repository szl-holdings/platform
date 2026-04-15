import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("aegis-critical", {
    name: "Critical Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#6366F1",
    sound: "default",
    bypassDnd: true,
    description: "Critical threat alerts requiring immediate attention",
  });

  await Notifications.setNotificationChannelAsync("aegis-incidents", {
    name: "Incident Updates",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    lightColor: "#6366F1",
    sound: "default",
    description: "Incident status updates and assignments",
  });

  await Notifications.setNotificationChannelAsync("aegis-health", {
    name: "System Health",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 100],
    lightColor: "#6366F1",
    description: "System health and monitoring alerts",
  });
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  }
  return "/api";
}

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("aegis_auth_token");
    }
    const { default: SecureStore } = await import("expo-secure-store");
    return SecureStore.getItemAsync("aegis_auth_token");
  } catch {
    return null;
  }
}

async function registerTokenWithBackend(pushToken: string): Promise<void> {
  try {
    const apiBase = getApiBase();
    const authToken = await getToken();
    await fetch(`${apiBase}/push-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        token: pushToken,
        platform: Platform.OS,
      }),
    });
  } catch {
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  await setupAndroidNotificationChannels();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;
    await registerTokenWithBackend(pushToken);
    return pushToken;
  } catch {
    return null;
  }
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}
