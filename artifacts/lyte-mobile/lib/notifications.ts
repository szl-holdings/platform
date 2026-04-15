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

  await Notifications.setNotificationChannelAsync("lyte-kpis", {
    name: "KPI Alerts",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#00D4FF",
    sound: "default",
    description: "KPI threshold breach alerts",
  });

  await Notifications.setNotificationChannelAsync("lyte-escalations", {
    name: "Escalations",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250, 250, 250],
    lightColor: "#00D4FF",
    sound: "default",
    bypassDnd: true,
    description: "Escalation requests requiring immediate action",
  });

  await Notifications.setNotificationChannelAsync("lyte-milestones", {
    name: "Milestones",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 100],
    lightColor: "#00D4FF",
    description: "Project milestone completion notifications",
  });
}

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  }
  return "/api";
}

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem("lyte_auth_token");
    }
    const { default: SecureStore } = await import("expo-secure-store");
    return SecureStore.getItemAsync("lyte_auth_token");
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
