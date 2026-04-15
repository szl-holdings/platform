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
          ? { seconds: options.seconds ?? 1, repeats: false }
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
