
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotificationBellProps {
  onPress?: () => void;
  count?: number;
  color?: string;
  size?: number;
}

export function NotificationBell({
  onPress,
  count = 0,
  color = '#e0f2fe',
  size = 24,
}: NotificationBellProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Text style={[styles.icon, { fontSize: size, color }]}>🔔</Text>
      {count > 0 && (
        <View style={styles.badge}>
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
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
