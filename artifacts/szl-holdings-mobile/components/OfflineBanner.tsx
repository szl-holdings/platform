import { Feather } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/lib/gi-bridge';

interface OfflineBannerProps {
  isOffline: boolean;
  queuedCount?: number;
}

export function OfflineBanner({ isOffline, queuedCount = 0 }: OfflineBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOffline) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOffline, translateY, opacity]);

  const message =
    queuedCount > 0
      ? `Offline — ${queuedCount} action${queuedCount !== 1 ? 's' : ''} queued for sync`
      : 'Offline — changes will sync when reconnected';

  return (
    <Animated.View
      style={[
        styles.banner,
        { paddingTop: insets.top + 4, transform: [{ translateY }], opacity },
      ]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <Feather name="wifi-off" size={13} color={palette.high} />
      <Text style={styles.text}>{message}</Text>
      <View style={styles.dot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(20,14,8,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: `${palette.high}40`,
  },
  text: {
    fontSize: 11,
    fontFamily: 'System',
    color: palette.high,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.high,
    opacity: 0.8,
  },
});
