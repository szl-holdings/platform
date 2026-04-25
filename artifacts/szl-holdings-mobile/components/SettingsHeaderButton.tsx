import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationCountContext } from '@/context/NotificationCountContext';
import { useColors } from '@/hooks/useColors';
import { formatBadgeCount, shouldShowBadge } from './SettingsHeaderButton.logic';

export { formatBadgeCount, shouldShowBadge } from './SettingsHeaderButton.logic';

export function SettingsHeaderButton() {
  const { unreadCount } = useNotificationCountContext();
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={() => router.navigate('/(shell)/settings' as never)}
      style={[styles.btn, { borderColor: colors.border }]}
      accessibilityLabel="Settings"
      accessibilityRole="button"
    >
      <View style={styles.iconWrap}>
        <Feather name="settings" size={16} color={colors.mutedForeground} />
        {shouldShowBadge(unreadCount) && (
          <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.badgeText}>{formatBadgeCount(unreadCount)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Absolutely-positioned overlay variant of SettingsHeaderButton for use in
 * domain layouts that render the NativeTabLayout path (expo-router
 * unstable-native-tabs), where Expo Router's headerRight option is unavailable.
 * Place this inside the outer flex:1 View of the domain layout alongside
 * SpotlightFab, rendered only when isLiquidGlassAvailable() is true.
 */
export function SettingsHeaderOverlay() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[styles.overlay, { top: insets.top + 8, right: 12 }]}
      pointerEvents="box-none"
    >
      <SettingsHeaderButton />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  overlay: {
    position: 'absolute',
    zIndex: 100,
  },
});
