import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export interface LocalAlertOptions {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  seconds?: number;
}

export async function scheduleLocalAlert(options: LocalAlertOptions): Promise<string | null> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data ?? {},
        sound: true,
      },
      trigger:
        Platform.OS === "ios"
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: options.seconds ?? 1, repeats: false }
          : null,
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelAllAlerts(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
  }
}

export async function setupAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#38BDF8",
    });
    await Notifications.setNotificationChannelAsync("critical-alerts", {
      name: "Critical Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250, 250, 250],
      lightColor: "#EF4444",
      bypassDnd: true,
    });
  } catch {
  }
}
