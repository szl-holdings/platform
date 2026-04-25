import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type SessionRevocationInfo,
  subscribeSessionRevocation,
} from '@/context/AuthContext';
import { giColors, giProductAccent } from '@/lib/gi-bridge';

const DISPLAY_DURATION_MS = 4000;
const SLIDE_DURATION_MS = 300;

export function SessionRevocationToast() {
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState<SessionRevocationInfo | null>(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (revocation: SessionRevocationInfo) => {
    setInfo(revocation);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: SLIDE_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: SLIDE_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start();

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(hide, DISPLAY_DURATION_MS);
  };

  const hide = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: SLIDE_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: SLIDE_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start(() => setInfo(null));
  };

  useEffect(() => {
    const unsubscribe = subscribeSessionRevocation(
      (revocation: SessionRevocationInfo | null) => {
        if (revocation) {
          show(revocation);
        }
      },
    );
    return () => {
      unsubscribe();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (!info) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable onPress={hide} style={styles.toast} accessibilityRole="alert">
        <View style={styles.accentBar} />
        <View style={styles.body}>
          <Text style={styles.label}>Session ended</Text>
          <Text style={styles.message}>{info.message}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2147483646,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: 'row',
    maxWidth: 540,
    width: '100%',
    backgroundColor: 'rgba(20,20,28,0.95)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 24 },
      default: {},
    }),
  },
  accentBar: {
    width: 3,
    backgroundColor: giProductAccent.holdings,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: giProductAccent.holdings,
  },
  message: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    color: giColors.text.primary,
    letterSpacing: 0.2,
  },
});
