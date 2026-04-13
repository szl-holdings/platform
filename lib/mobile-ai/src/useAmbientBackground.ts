import { useEffect, useCallback, useState } from "react";
import { Platform } from "react-native";

export type AlertSeverity = "info" | "low" | "medium" | "high" | "critical";
export type AlertDomain =
  | "maritime"
  | "defense"
  | "property"
  | "energy"
  | "advisory"
  | "executive"
  | "portfolio";

export interface AmbientAlert {
  id: string;
  title: string;
  body: string;
  severity: AlertSeverity;
  domain: AlertDomain;
  timestamp: string;
  data?: Record<string, string>;
}

export interface GeofenceZone {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  domain: AlertDomain;
  onEnterMessage?: string;
  onExitMessage?: string;
}

export interface AmbientBackgroundConfig {
  domain: AlertDomain;
  accentColor: string;
  geofences?: GeofenceZone[];
  briefingEnabled?: boolean;
  briefingTime?: { hour: number; minute: number };
  onAlert?: (alert: AmbientAlert) => void;
}

async function triggerHaptic(severity: AlertSeverity): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Haptics = await import("expo-haptics");
    switch (severity) {
      case "critical":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        await new Promise(r => setTimeout(r, 150));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "high":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "medium":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "low":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      default:
        await Haptics.selectionAsync();
        break;
    }
  } catch {}
}

async function scheduleLocalNotification(
  title: string,
  body: string,
  delaySeconds = 0,
  data?: Record<string, unknown>,
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const Notifications = await import("expo-notifications");

    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data ?? {},
      },
      trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
    });

    return id;
  } catch {
    return null;
  }
}

async function scheduleBriefingNotification(
  domain: string,
  type: "morning" | "evening",
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const title = type === "morning"
      ? `Good morning — ${domain.charAt(0).toUpperCase() + domain.slice(1)} briefing ready`
      : `Evening digest — ${domain.charAt(0).toUpperCase() + domain.slice(1)} day summary`;

    const body = type === "morning"
      ? "Your personalized intelligence briefing is ready. Tap to review."
      : "Your end-of-day digest is available. Review and acknowledge open signals.";

    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { domain, type: "briefing" } },
      trigger: null,
    });
  } catch {}
}

export function useAmbientBackground(config: AmbientBackgroundConfig) {
  const [pendingAlerts, setPendingAlerts] = useState<AmbientAlert[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<"granted" | "denied" | "undetermined">("undetermined");
  const [isMonitoring, setIsMonitoring] = useState(false);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    try {
      const Notifications = await import("expo-notifications");
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === "granted" ? "granted" : "denied");
      return status === "granted";
    } catch {
      return false;
    }
  }, []);

  const sendAlert = useCallback(async (alert: Omit<AmbientAlert, "id" | "timestamp">): Promise<void> => {
    const full: AmbientAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
    };

    setPendingAlerts(prev => [full, ...prev].slice(0, 50));
    config.onAlert?.(full);

    await Promise.all([
      triggerHaptic(alert.severity),
      scheduleLocalNotification(alert.title, alert.body, 0, alert.data as Record<string, unknown>),
    ]);
  }, [config]);

  const dismissAlert = useCallback((alertId: string) => {
    setPendingAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setPendingAlerts([]);
  }, []);

  const triggerBriefingNotification = useCallback(async () => {
    const hour = new Date().getHours();
    const type = hour >= 17 ? "evening" : "morning";
    await scheduleBriefingNotification(config.domain, type);
    await triggerHaptic("low");
  }, [config.domain]);

  const sendDomainAlert = useCallback(async (
    title: string,
    body: string,
    severity: AlertSeverity = "medium",
  ) => {
    await sendAlert({
      title,
      body,
      severity,
      domain: config.domain,
    });
  }, [config.domain, sendAlert]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    let sub: { remove: () => void } | null = null;

    const setup = async () => {
      const granted = await requestPermissions();
      setIsMonitoring(granted);

      if (!granted) return;

      try {
        const Notifications = await import("expo-notifications");
        sub = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as Record<string, string>;
          if (data?.type === "briefing") {
            triggerHaptic("low");
          }
        });
      } catch {}
    };

    setup();

    return () => {
      sub?.remove();
    };
  }, [requestPermissions, triggerBriefingNotification]);

  return {
    pendingAlerts,
    notificationPermission,
    isMonitoring,
    requestPermissions,
    sendAlert,
    sendDomainAlert,
    dismissAlert,
    clearAllAlerts,
    triggerBriefingNotification,
    triggerHaptic,
  };
}
