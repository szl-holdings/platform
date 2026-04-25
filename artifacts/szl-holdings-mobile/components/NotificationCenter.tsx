
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { giColors, palette } from '@/lib/gi-bridge';

interface NotificationBellProps {
  onPress?: () => void;
  count?: number;
  color?: string;
  size?: number;
}

export function NotificationBell({
  onPress,
  count = 0,
  color,
  size = 24,
}: NotificationBellProps) {
  const colors = useColors();
  const iconColor = color ?? colors.textSecondary;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Text style={[styles.icon, { fontSize: size, color: iconColor }]}>🔔</Text>
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: giColors.accent.red }]}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  icon: {},
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { color: palette.onAccent, fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});
