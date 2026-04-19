import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications, type AppNotification } from "../context/NotificationContext";
import { formatInUserTimeZone } from "../format-time";
import { useUserPreferences } from "../hooks/useUserPreferences";

const TYPE_ICONS: Record<AppNotification["type"], string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✕",
  action_required: "⚡",
};

const TYPE_COLORS: Record<AppNotification["type"], string> = {
  info: "#6E9BD1",
  success: "#6BB88E",
  warning: "#D4A55B",
  error: "#C05050",
  action_required: "#C8A96A",
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return formatInUserTimeZone(dateStr, { year: "numeric", month: "short", day: "numeric" });
}

interface NotificationRowProps {
  notification: AppNotification;
  accentColor: string;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigate?: (url: string) => void;
}

function NotificationRow({
  notification,
  accentColor,
  onMarkRead,
  onDelete,
  onNavigate,
}: NotificationRowProps) {
  const iconText = TYPE_ICONS[notification.type] ?? "•";
  const iconColor = TYPE_COLORS[notification.type] ?? accentColor;

  const handlePress = useCallback(() => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl && onNavigate) {
      try {
        onNavigate(notification.actionUrl);
      } catch {
        console.warn("[NotificationCenter] Navigate failed:", notification.actionUrl);
      }
    }
  }, [notification, onMarkRead, onNavigate]);

  const handleDelete = useCallback(() => {
    onDelete(notification.id);
  }, [notification.id, onDelete]);

  return (
    <Pressable onPress={handlePress}>
      {({ pressed }) => (
        <View
          style={[
            styles.row,
            {
              opacity: pressed ? 0.75 : 1,
              backgroundColor: notification.isRead
                ? "transparent"
                : `${accentColor}08`,
            },
          ]}
        >
          {!notification.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />
          )}
          <View style={[styles.iconWrap, { borderColor: `${iconColor}33` }]}>
            <Text style={[styles.iconText, { color: iconColor }]}>{iconText}</Text>
          </View>
          <View style={styles.rowContent}>
            <Text
              style={[
                styles.rowTitle,
                { fontWeight: notification.isRead ? "400" : "600" },
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text style={styles.rowMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={[styles.rowTime, { color: `${accentColor}99` }]}>
              {formatTimeAgo(notification.createdAt)}
            </Text>
          </View>
          <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
            <Text style={styles.deleteText}>✕</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

export interface NotificationBellProps {
  size?: number;
  accentColor?: string;
  iconColor?: string;
}

export function NotificationBell({
  size = 20,
  accentColor = "#C8A96A",
  iconColor = "#E8EAF0",
}: NotificationBellProps) {
  const { unreadCount } = useNotifications();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={styles.bellWrap}
        hitSlop={8}
        accessibilityLabel="Notifications"
        accessibilityRole="button"
      >
        <Text style={[styles.bellIcon, { fontSize: size, color: iconColor }]}>🔔</Text>
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: accentColor }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : String(unreadCount)}
            </Text>
          </View>
        )}
      </Pressable>

      <NotificationCenterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        accentColor={accentColor}
      />
    </>
  );
}

export interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  accentColor?: string;
  backgroundColor?: string;
  onNavigate?: (url: string) => void;
}

export function NotificationCenterModal({
  visible,
  onClose,
  accentColor = "#C8A96A",
  backgroundColor = "#080B12",
  onNavigate,
}: NotificationCenterModalProps) {
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, isLoading, refresh, markRead, markAllRead, deleteNotification } =
    useNotifications();
  // Subscribe so the rendered timestamps refresh when the user changes time zone.
  useUserPreferences();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close" accessibilityRole="button">
            <Text style={styles.closeBtn}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <Pressable onPress={markAllRead} hitSlop={12}>
              <Text style={[styles.headerAction, { color: accentColor }]}>Mark all read</Text>
            </Pressable>
          ) : (
            <Pressable onPress={refresh} hitSlop={12}>
              {isLoading ? (
                <ActivityIndicator size="small" color={`${accentColor}80`} />
              ) : (
                <Text style={[styles.refreshBtn, { color: `${accentColor}80` }]}>↻</Text>
              )}
            </Pressable>
          )}
        </View>

        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <View style={[styles.unreadDotLarge, { backgroundColor: accentColor }]} />
            <Text style={[styles.unreadLabel, { color: accentColor }]}>
              {unreadCount} unread
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyContainer : undefined
          }
        >
          {isLoading && notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={`${accentColor}80`} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyInner}>
              <Text style={[styles.emptyIcon, { color: `${accentColor}44` }]}>🔕</Text>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Updates, alerts, and messages will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((notif) => (
              <NotificationRow
                key={notif.id}
                notification={notif}
                accentColor={accentColor}
                onMarkRead={markRead}
                onDelete={deleteNotification}
                onNavigate={onNavigate}
              />
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,234,240,0.06)",
  },
  headerTitle: {
    color: "#E8EAF0",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerAction: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  closeBtn: {
    color: "rgba(232,234,240,0.5)",
    fontSize: 16,
    fontWeight: "500",
  },
  refreshBtn: {
    fontSize: 18,
  },
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,234,240,0.06)",
  },
  unreadDotLarge: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  unreadLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyInner: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    color: "rgba(232,234,240,0.5)",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  emptySubtitle: {
    color: "rgba(232,234,240,0.3)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,234,240,0.06)",
    gap: 12,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    left: 8,
    top: 20,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: {
    fontSize: 13,
    fontWeight: "600",
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: "#E8EAF0",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  rowMessage: {
    color: "rgba(232,234,240,0.5)",
    fontSize: 12,
    lineHeight: 17,
  },
  rowTime: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  deleteBtn: {
    paddingTop: 2,
  },
  deleteText: {
    color: "rgba(232,234,240,0.25)",
    fontSize: 12,
  },
  bellWrap: {
    position: "relative",
  },
  bellIcon: {
    lineHeight: undefined,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#080B12",
  },
});
