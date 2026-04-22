import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApiStatus } from '../hooks/useApiStatus';

interface Props {
  accentColor?: string;
  textColor?: string;
}

export function OfflineBanner({ accentColor = '#ef4444', textColor = '#fff' }: Props) {
  const { status, retry } = useApiStatus();
  const slideAnim = useRef(new Animated.Value(-48)).current;

  const visible = status === 'offline' || status === 'degraded';

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -48,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [visible, slideAnim]);

  const bannerColor = status === 'offline' ? accentColor : '#f59e0b';
  const label =
    status === 'offline'
      ? 'No connection — showing cached data'
      : 'Connection degraded — tap to retry';

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: bannerColor, transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: textColor }]} />
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
        <TouchableOpacity onPress={retry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.retryText, { color: textColor }]}>Retry</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
