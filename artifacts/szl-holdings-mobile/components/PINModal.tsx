import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { giProductAccent, giColors, giSpacing } from '@/lib/gi-bridge';

const PIN_STORE_KEY = 'cortex_pin_hash';
const PIN_ATTEMPTS_KEY = 'cortex_pin_attempts';
const PIN_LOCKOUT_KEY = 'cortex_pin_lockout_until';
const ACCENT = giProductAccent.lyte;
const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30_000;

type PINMode = 'verify' | 'setup';

interface PINModalProps {
  visible: boolean;
  mode: PINMode;
  title?: string;
  subtitle?: string;
  onSuccess: () => void;
  onCancel: () => void;
  onPINSet?: () => void;
}

async function hashPIN(pin: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `cortex_pin_v1:${pin}`,
  );
  return digest;
}

export async function setPIN(pin: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const hashed = await hashPIN(pin);
  await SecureStore.setItemAsync(PIN_STORE_KEY, hashed);
  await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, '0');
}

export async function verifyPIN(pin: string): Promise<boolean | 'locked'> {
  if (Platform.OS === 'web') return true;

  const lockoutUntilStr = await SecureStore.getItemAsync(PIN_LOCKOUT_KEY).catch(() => null);
  if (lockoutUntilStr) {
    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    if (Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      Alert.alert('Too many attempts', `Try again in ${remaining} seconds.`);
      return 'locked';
    }
    await SecureStore.deleteItemAsync(PIN_LOCKOUT_KEY).catch(() => {});
    await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, '0');
  }

  const stored = await SecureStore.getItemAsync(PIN_STORE_KEY);
  if (!stored) return false;

  const hashed = await hashPIN(pin);
  if (stored === hashed) {
    await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, '0');
    return true;
  }

  const attemptsStr = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY).catch(() => '0');
  const attempts = parseInt(attemptsStr ?? '0', 10) + 1;
  await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, attempts.toString());

  if (attempts >= MAX_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    await SecureStore.setItemAsync(PIN_LOCKOUT_KEY, lockoutUntil.toString());
    Alert.alert('Account Locked', `Too many failed attempts. Locked for 30 seconds.`);
    return 'locked';
  }

  return false;
}

export async function hasPINSet(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const stored = await SecureStore.getItemAsync(PIN_STORE_KEY);
  return stored !== null;
}

const KEYS: (string | null)[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', '⌫'];

function PINDot({ filled, accent }: { filled: boolean; accent: string }) {
  return (
    <View
      style={[
        styles.dot,
        filled ? { backgroundColor: accent, borderColor: accent } : { borderColor: `${accent}60` },
      ]}
    />
  );
}

export default function PINModal({
  visible,
  mode,
  title,
  subtitle,
  onSuccess,
  onCancel,
  onPINSet,
}: PINModalProps) {
  const colors = useColors();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setError('');
    }
  }, [visible]);

  const shake = useCallback(() => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleKey = useCallback(
    async (key: string) => {
      if (key === '⌫') {
        setError('');
        if (step === 'enter') {
          setPin((p) => p.slice(0, -1));
        } else {
          setConfirmPin((p) => p.slice(0, -1));
        }
        return;
      }

      const current = step === 'enter' ? pin : confirmPin;
      if (current.length >= PIN_LENGTH) return;
      const next = current + key;

      if (step === 'enter') {
        setPin(next);
        if (next.length === PIN_LENGTH) {
          if (mode === 'verify') {
            const result = await verifyPIN(next);
            if (result === true) {
              onSuccess();
              setPin('');
            } else if (result === 'locked') {
              setPin('');
            } else {
              shake();
              setError('Incorrect PIN. Try again.');
              setPin('');
            }
          } else {
            setStep('confirm');
          }
        }
      } else {
        setConfirmPin(next);
        if (next.length === PIN_LENGTH) {
          if (next === pin) {
            await setPIN(next);
            onPINSet?.();
            onSuccess();
          } else {
            shake();
            setError("PINs don't match. Try again.");
            setConfirmPin('');
          }
        }
      }
    },
    [pin, confirmPin, step, mode, onSuccess, onPINSet, shake],
  );

  const handleBiometric = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: false,
      });
      if (result.success) onSuccess();
    } catch {}
  }, [onSuccess]);

  const currentDisplay = step === 'enter' ? pin : confirmPin;
  const displayTitle =
    title ?? (mode === 'setup' ? (step === 'enter' ? 'Set New PIN' : 'Confirm PIN') : 'Enter PIN');

  const displaySubtitle =
    subtitle ??
    (mode === 'setup'
      ? step === 'enter'
        ? 'Choose a 6-digit PIN for financial actions'
        : 'Re-enter your PIN to confirm'
      : 'Financial re-authentication required');

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View
          style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.topRow}>
            <TouchableOpacity onPress={onCancel} style={styles.hitArea}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View
              style={[
                styles.lockCircle,
                { backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30` },
              ]}
            >
              <Feather name="lock" size={20} color={ACCENT} />
            </View>
            <View style={styles.hitArea} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{displayTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {displaySubtitle}
          </Text>

          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <PINDot key={i} filled={i < currentDisplay.length} accent={ACCENT} />
            ))}
          </Animated.View>

          {error ? <Text style={styles.errorText}>{error}</Text> : <View style={{ height: 18 }} />}

          <View style={styles.keypad}>
            {KEYS.map((key, i) => {
              if (key === null) return <View key={i} style={styles.keyPlaceholder} />;
              const isDelete = key === '⌫';
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.key, { backgroundColor: isDelete ? 'transparent' : colors.muted }]}
                  onPress={() => handleKey(key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.keyText,
                      { color: isDelete ? colors.mutedForeground : colors.foreground },
                    ]}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mode === 'verify' && (
            <TouchableOpacity
              style={[styles.biometricBtn, { borderColor: `${ACCENT}30` }]}
              onPress={handleBiometric}
            >
              <Feather name="cpu" size={14} color={ACCENT} />
              <Text style={[styles.biometricText, { color: ACCENT }]}>
                Use Face ID / Touch ID instead
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  hitArea: { padding: 4, width: 28 },
  lockCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 17 },
  dotsRow: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: giColors.accent.red,
    height: 18,
    textAlign: 'center',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: 8,
    justifyContent: 'center',
  },
  key: {
    width: 68,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPlaceholder: { width: 68, height: 52 },
  keyText: { fontSize: 20, fontFamily: 'Inter_500Medium' },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  biometricText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
