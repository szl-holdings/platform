import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated as RNAnimated,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { usePushNotifications as useSharedPushNotifications } from "./PushNotificationManager";
import type { NotificationConfig } from "./PushNotificationManager";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerNotificationCategories(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync("ai-workflow", [
      {
        identifier: "approve",
        buttonTitle: "Approve",
        options: { opensAppToForeground: false, isDestructive: false, isAuthenticationRequired: true },
      },
      {
        identifier: "investigate",
        buttonTitle: "Investigate",
        options: { opensAppToForeground: true, isDestructive: false, isAuthenticationRequired: false },
      },
      {
        identifier: "dismiss",
        buttonTitle: "Dismiss",
        options: { opensAppToForeground: false, isDestructive: true, isAuthenticationRequired: false },
      },
    ]);
    await Notifications.setNotificationCategoryAsync("ai-alert", [
      {
        identifier: "investigate",
        buttonTitle: "View Details",
        options: { opensAppToForeground: true, isDestructive: false, isAuthenticationRequired: false },
      },
      {
        identifier: "dismiss",
        buttonTitle: "Dismiss",
        options: { opensAppToForeground: false, isDestructive: false, isAuthenticationRequired: false },
      },
    ]);
  } catch {}
}

registerNotificationCategories();

async function executeNotifAction(apiBase: string, endpoint: string, authToken: string | null, actionId?: string): Promise<void> {
  if (!endpoint) return;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  try {
    await fetch(`${apiBase}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: actionId ?? "execute", timestamp: Date.now() }),
    });
  } catch {}
}

export interface AINotification {
  id: string;
  title: string;
  body: string;
  type: "threat" | "deadline" | "signal" | "alert" | "briefing";
  severity: "critical" | "high" | "medium" | "low";
  actions: Array<{ id: string; label: string; style: "approve" | "investigate" | "dismiss" }>;
  agentSource?: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#6b7280",
};

const TYPE_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  threat: "alert-triangle",
  deadline: "clock",
  signal: "radio",
  alert: "bell",
  briefing: "file-text",
};

function NotificationCard({
  notif,
  accentColor,
  onAction,
  onDismiss,
}: {
  notif: AINotification;
  accentColor: string;
  onAction: (notifId: string, actionId: string) => void;
  onDismiss: (id: string) => void;
}) {
  const anim = useRef(new RNAnimated.Value(0)).current;
  const severityColor = SEVERITY_COLORS[notif.severity] ?? accentColor;
  const icon = TYPE_ICONS[notif.type] ?? "bell";

  useEffect(() => {
    RNAnimated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, []);

  const handleAction = (actionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onAction(notif.id, actionId);
  };

  return (
    <RNAnimated.View style={[cardStyles.card, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[cardStyles.accent, { backgroundColor: severityColor }]} />
      <View style={cardStyles.content}>
        <View style={cardStyles.header}>
          <Feather name={icon} size={14} color={severityColor} />
          <Text style={[cardStyles.title, { color: "#fff" }]} numberOfLines={1}>{notif.title}</Text>
          <TouchableOpacity onPress={() => onDismiss(notif.id)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Feather name="x" size={14} color="#888" />
          </TouchableOpacity>
        </View>
        {notif.agentSource && (
          <Text style={cardStyles.source}>{notif.agentSource}</Text>
        )}
        <Text style={cardStyles.body} numberOfLines={2}>{notif.body}</Text>
        {notif.actions.length > 0 && (
          <View style={cardStyles.actions}>
            {notif.actions.slice(0, 3).map(action => (
              <TouchableOpacity
                key={action.id}
                style={[
                  cardStyles.actionBtn,
                  action.style === "approve"
                    ? { backgroundColor: accentColor }
                    : action.style === "investigate"
                    ? { borderColor: accentColor, borderWidth: 1, backgroundColor: "transparent" }
                    : { backgroundColor: "rgba(255,255,255,0.08)" },
                ]}
                onPress={() => handleAction(action.id)}
              >
                <Text style={[cardStyles.actionLabel, action.style === "approve" ? { color: "#fff" } : { color: "#ccc" }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </RNAnimated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: 14, overflow: "hidden", marginBottom: 10, flexDirection: "row", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  accent: { width: 4 },
  content: { flex: 1, padding: 12, gap: 6 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 13, fontWeight: "700" },
  source: { fontSize: 10, color: "#666", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  body: { fontSize: 12, color: "#aaa", lineHeight: 17 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" },
  actionBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  actionLabel: { fontSize: 11, fontWeight: "600" },
});

export function useAppPushNotifications(accentColor: string, apiBase?: string, appId?: string, authToken?: string | null) {
  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const notifListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);
  const base = apiBase ?? "";
  const id = appId ?? "app";

  const authTokenRef = useRef<string | null>(authToken ?? null);
  useEffect(() => { authTokenRef.current = authToken ?? null; }, [authToken]);

  const sharedConfig = React.useMemo<NotificationConfig>(() => ({
    accentColor,
    apiBaseUrl: base,
    appId: id,
    authToken: authToken ?? undefined,
  }), [accentColor, base, id, authToken]);
  const { pushToken } = useSharedPushNotifications(sharedConfig);

  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as Record<string, unknown>;
      const aiNotif: AINotification = {
        id: notification.request.identifier,
        title: notification.request.content.title ?? "AI Alert",
        body: notification.request.content.body ?? "",
        type: (data["type"] as AINotification["type"]) ?? "alert",
        severity: (data["severity"] as AINotification["severity"]) ?? "medium",
        actions: (data["actions"] as AINotification["actions"]) ?? [{ id: "dismiss", label: "Dismiss", style: "dismiss" }],
        agentSource: data["agentSource"] as string | undefined,
        timestamp: Date.now(),
        payload: data,
      };
      setNotifications(prev => [aiNotif, ...prev.slice(0, 4)]);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const actionEndpoint = data["actionEndpoint"] as string | undefined;
      const actionId = (response.actionIdentifier !== "default" ? response.actionIdentifier : undefined)
        ?? (data["defaultAction"] as string | undefined)
        ?? "execute";
      if (actionEndpoint && base) {
        executeNotifAction(base, actionEndpoint, authTokenRef.current, actionId);
      }
      setNotifications(prev => prev.filter(n => n.id !== response.notification.request.identifier));
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [base, id]);

  const addNotification = (notif: AINotification) => {
    setNotifications(prev => [notif, ...prev.slice(0, 4)]);
  };

  const dismissNotification = (notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const handleAction = (notifId: string, actionId: string) => {
    const notif = notifications.find(n => n.id === notifId);
    if (notif?.payload?.["actionEndpoint"] && base) {
      executeNotifAction(base, notif.payload["actionEndpoint"] as string, authTokenRef.current, actionId);
    }
    if (actionId !== "investigate") {
      dismissNotification(notifId);
    }
  };

  return { notifications, addNotification, dismissNotification, handleAction, pushToken };
}

export function NotificationOverlay({ accentColor, notifications, onAction, onDismiss }: {
  accentColor: string;
  notifications: AINotification[];
  onAction: (notifId: string, actionId: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (notifications.length === 0) return null;
  return (
    <View style={overlayStyles.container} pointerEvents="box-none">
      {notifications.slice(0, 3).map(notif => (
        <NotificationCard
          key={notif.id}
          notif={notif}
          accentColor={accentColor}
          onAction={onAction}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 30,
    left: 12,
    right: 12,
    zIndex: 1000,
  },
});
