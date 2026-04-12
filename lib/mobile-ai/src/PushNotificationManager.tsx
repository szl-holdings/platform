import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export interface NotificationConfig {
  accentColor: string;
  apiBaseUrl: string;
  appId: string;
  authToken?: string;
}

export interface AiNotification {
  id: string;
  title: string;
  body: string;
  category: string;
  actionLabel?: string;
  actionEndpoint?: string;
  timestamp: Date;
  priority: "low" | "medium" | "high" | "critical";
}

async function registerPushToken(
  apiBaseUrl: string,
  appId: string,
  pushToken: string,
  authToken?: string,
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  try {
    await fetch(`${apiBaseUrl}/notifications/register-token`, {
      method: "POST",
      headers,
      body: JSON.stringify({ pushToken, appId, platform: Platform.OS }),
    });
  } catch {}
}

async function executeNotificationAction(
  apiBaseUrl: string,
  endpoint: string,
  authToken?: string,
): Promise<{ success: boolean; message?: string }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  try {
    const resp = await fetch(`${apiBaseUrl}${endpoint}`, { method: "POST", headers });
    if (!resp.ok) return { success: false };
    const data = await resp.json() as { message?: string };
    return { success: true, message: data.message };
  } catch {
    return { success: false };
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(config: NotificationConfig) {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied">("unknown");
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener>>();
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener>>();

  const authTokenRef = useRef<string | undefined>(config.authToken);
  useEffect(() => { authTokenRef.current = config.authToken; }, [config.authToken]);

  const { apiBaseUrl, appId, accentColor } = config;

  useEffect(() => {
    async function setup() {
      if (!Device.isDevice) {
        setPermissionStatus("denied");
        return;
      }
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      setPermissionStatus(finalStatus === "granted" ? "granted" : "denied");
      if (finalStatus !== "granted") return;

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("ai-alerts", {
          name: "AI Intelligence Alerts",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: accentColor,
        });
        await Notifications.setNotificationChannelAsync("ai-workflows", {
          name: "AI Workflow Updates",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: "szl-holdings-platform",
      });
      setPushToken(token.data);
      await registerPushToken(apiBaseUrl, appId, token.data, authTokenRef.current);
    }
    setup().catch(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (actionId && data?.endpoint) {
        executeNotificationAction(apiBaseUrl, data.endpoint as string, authTokenRef.current).catch(() => {});
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [apiBaseUrl, appId, accentColor]);

  return { pushToken, permissionStatus };
}

export function PushNotificationOverlay({
  config,
  notifications,
  onDismiss,
  onAction,
}: {
  config: NotificationConfig;
  notifications: AiNotification[];
  onDismiss: (id: string) => void;
  onAction: (notif: AiNotification) => void;
}) {
  const accent = config.accentColor;
  if (notifications.length === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {notifications.slice(0, 3).map(notif => (
        <NotificationBanner
          key={notif.id}
          notif={notif}
          accent={accent}
          onDismiss={() => onDismiss(notif.id)}
          onAction={() => onAction(notif)}
        />
      ))}
    </View>
  );
}

function NotificationBanner({
  notif,
  accent,
  onDismiss,
  onAction,
}: {
  notif: AiNotification;
  accent: string;
  onDismiss: () => void;
  onAction: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    const autoHide = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(onDismiss);
    }, 6000);

    return () => clearTimeout(autoHide);
  }, []);

  const priorityColor = notif.priority === "critical" ? "#ef4444" : notif.priority === "high" ? "#f97316" : accent;

  return (
    <Animated.View style={[styles.banner, { borderColor: priorityColor + "40", transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <View style={[styles.bannerPriorityBar, { backgroundColor: priorityColor }]} />
      <View style={styles.bannerContent}>
        <View style={styles.bannerHeader}>
          <View style={[styles.bannerDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.bannerCategory, { color: priorityColor }]}>{notif.category}</Text>
          <Text style={styles.bannerTime}>
            {notif.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        <Text style={styles.bannerTitle}>{notif.title}</Text>
        <Text style={styles.bannerBody} numberOfLines={2}>{notif.body}</Text>
        {notif.actionLabel && (
          <View style={styles.bannerActions}>
            <TouchableOpacity onPress={onAction} style={[styles.bannerActionBtn, { borderColor: priorityColor + "60" }]}>
              <Text style={[styles.bannerActionText, { color: priorityColor }]}>{notif.actionLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDismiss} style={styles.bannerDismissBtn}>
              <Text style={styles.bannerDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
        {!notif.actionLabel && (
          <TouchableOpacity onPress={onDismiss} style={styles.bannerCloseBtn}>
            <Text style={styles.bannerDismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: Platform.OS === "ios" ? 50 : 20, left: 12, right: 12, gap: 8, zIndex: 999 },
  banner: { borderRadius: 12, borderWidth: 1, backgroundColor: "#0a0f1a", overflow: "hidden", flexDirection: "row", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  bannerPriorityBar: { width: 4 },
  bannerContent: { flex: 1, padding: 12 },
  bannerHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  bannerDot: { width: 6, height: 6, borderRadius: 3 },
  bannerCategory: { fontSize: 9, fontWeight: "700", letterSpacing: 1, flex: 1 },
  bannerTime: { fontSize: 9, color: "rgba(255,255,255,0.3)" },
  bannerTitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "600", marginBottom: 2 },
  bannerBody: { color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 16 },
  bannerActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  bannerActionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  bannerActionText: { fontSize: 11, fontWeight: "600" },
  bannerDismissBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  bannerDismissText: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  bannerCloseBtn: { position: "absolute", top: 8, right: 8 },
});
