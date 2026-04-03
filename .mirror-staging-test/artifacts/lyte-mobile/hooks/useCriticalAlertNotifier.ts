import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { LyteSignal, Severity } from "@/context/LyteContext";
import { NotificationPreferences } from "@/context/NotificationContext";

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

async function triggerHaptic(severity: Severity): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Haptics = await import("expo-haptics");
    if (severity === "critical") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (severity === "high") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch {}
}

async function scheduleNotification(title: string, body: string, severity: Severity): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await triggerHaptic(severity);
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {}
}

export function useCriticalAlertNotifier(
  signals: LyteSignal[],
  permissionGranted: boolean,
  preferences: NotificationPreferences
): void {
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!permissionGranted || !preferences.enabled) return;
    if (Platform.OS === "web") return;

    if (!initialized.current) {
      signals.forEach(s => seenIds.current.add(s.id));
      initialized.current = true;
      return;
    }

    signals.forEach(signal => {
      if (seenIds.current.has(signal.id)) return;
      seenIds.current.add(signal.id);

      const rank = SEVERITY_RANK[signal.severity] ?? 0;
      const wantsCritical = preferences.critical && signal.severity === "critical";
      const wantsHigh = preferences.high && signal.severity === "high";
      const wantsMedium = preferences.medium && signal.severity === "medium";

      if (!wantsCritical && !wantsHigh && !wantsMedium) return;
      if (["resolved", "dismissed"].includes(signal.status)) return;

      const sevLabel = signal.severity.toUpperCase();
      const notifTitle = `[${sevLabel}] ${signal.source}`;
      const notifBody = signal.title + (signal.recommendedAction ? ` — ${signal.recommendedAction}` : "");

      scheduleNotification(notifTitle, notifBody, signal.severity);
    });
  }, [signals, permissionGranted, preferences]);
}
