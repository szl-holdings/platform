import { Feather } from '@expo/vector-icons';
import { type AppNotification, useNotifications } from '@szl-holdings/mobile-shared';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { giColors, palette, giProductAccent } from '@/lib/gi-bridge';

const TYPE_ICONS: Record<AppNotification['type'], string> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'alert-circle',
  action_required: 'zap',
};

const TYPE_COLORS: Record<AppNotification['type'], string> = {
  info: palette.low,
  success: palette.success,
  warning: palette.high,
  error: palette.critical,
  action_required: giProductAccent.holdings,
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface NotificationRowProps {
  notification: AppNotification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  colors: ReturnType<typeof useColors>;
}

function NotificationRow({ notification, onMarkRead, onDelete, colors }: NotificationRowProps) {
  const icon = TYPE_ICONS[notification.type] ?? 'bell';
  const iconColor = TYPE_COLORS[notification.type] ?? colors.gold;

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      try {
        router.push(notification.actionUrl as any);
      } catch {
      }
    }
  }, [notification, onMarkRead]);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete(notification.id);
  }, [notification.id, onDelete]);

  return (
    <Pressable onPress={handlePress}>
      {({ pressed }) => (
        <View
          style={[
            styles.row,
            {
              borderBottomColor: colors.creamFaint,
              opacity: pressed ? 0.7 : 1,
              backgroundColor: notification.isRead ? 'transparent' : 'rgba(200,169,106,0.04)',
            },
          ]}
        >
          {!notification.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: colors.gold }]} />
          )}
          <View style={[styles.iconWrap, { borderColor: `${iconColor}33` }]}>
            <Feather name={icon as any} size={14} color={iconColor} />
          </View>
          <View style={styles.rowContent}>
            <Text
              style={[
                styles.rowTitle,
                {
                  color: notification.isRead ? colors.creamDim : colors.cream,
                  fontFamily: notification.isRead ? 'Inter_300Light' : 'Inter_400Regular',
                },
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text style={[styles.rowMessage, { color: colors.mutedForeground }]} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={[styles.rowTime, { color: colors.goldSubtle }]}>
              {formatTimeAgo(notification.createdAt)}
            </Text>
          </View>
          <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
            <Feather name="x" size={13} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

interface NotificationBellProps {
  size?: number;
}

export function NotificationBell({ size = 20 }: NotificationBellProps) {
  const colors = useColors();
  const { unreadCount } = useNotifications();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setModalVisible(true);
        }}
        style={styles.bellWrap}
        hitSlop={8}
      >
        <Feather name="bell" size={size} color={colors.cream} />
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.gold }]}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
          </View>
        )}
      </Pressable>

      <NotificationCenter visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View
          style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.creamFaint }]}
        >
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={18} color={colors.creamDim} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.cream }]}>Notifications</Text>
          {unreadCount > 0 ? (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                markAllRead();
              }}
              hitSlop={12}
            >
              <Text style={[styles.headerAction, { color: colors.gold }]}>Mark all read</Text>
            </Pressable>
          ) : (
            <Pressable onPress={refresh} hitSlop={12}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.goldSubtle} />
              ) : (
                <Feather name="refresh-cw" size={16} color={colors.goldSubtle} />
              )}
            </Pressable>
          )}
        </View>

        {unreadCount > 0 && (
          <View style={[styles.unreadBanner, { borderBottomColor: colors.creamFaint }]}>
            <View style={[styles.unreadDotLarge, { backgroundColor: colors.gold }]} />
            <Text style={[styles.unreadLabel, { color: colors.gold }]}>{unreadCount} unread</Text>
          </View>
        )}

        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
        >
          {isLoading && notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.goldSubtle} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyInner}>
              <Feather name="bell-off" size={32} color={colors.creamFaint} />
              <Text style={[styles.emptyTitle, { color: colors.creamDim }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Session reminders, document updates, and messages will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((notif) => (
              <NotificationRow
                key={notif.id}
                notification={notif}
                onMarkRead={markRead}
                onDelete={deleteNotification}
                colors={colors}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_500Medium',
    letterSpacing: 0.5,
  },
  headerAction: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  unreadDotLarge: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  unreadLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyInner: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'CormorantGaramond_400Regular',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_300Light',
    textAlign: 'center',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
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
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  rowMessage: {
    fontSize: 12,
    fontFamily: 'Inter_300Light',
    lineHeight: 17,
  },
  rowTime: {
    fontSize: 10,
    fontFamily: 'Inter_300Light',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  deleteBtn: {
    paddingTop: 2,
  },
  bellWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    color: giColors.bg.base,
  },
});
