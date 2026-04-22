import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { promptBiometric } from '@/context/BiometricLockContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  onUnlocked?: () => void;
}

export function BiometricLockScreen({ onUnlocked }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [unlocking, setUnlocking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failCount, setFailCount] = useState(0);

  const handleUnlock = async () => {
    setUnlocking(true);
    setFailed(false);
    const success = await promptBiometric('Authenticate to access the SOC command center');
    if (success) {
      onUnlocked?.();
    } else {
      setFailed(true);
      setFailCount((c) => c + 1);
    }
    setUnlocking(false);
  };

  const handlePasscode = async () => {
    if (Platform.OS === 'web') {
      onUnlocked?.();
      return;
    }
    setUnlocking(true);
    setFailed(false);
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enter device passcode to access the SOC command center',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    if (result.success) {
      onUnlocked?.();
    } else {
      setFailed(true);
    }
    setUnlocking(false);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.inner}>
        <View
          style={[
            styles.iconWrap,
            { borderColor: colors.amberBorder, backgroundColor: colors.amberDim },
          ]}
        >
          <Ionicons name="finger-print" size={48} color={colors.amber} />
        </View>

        <Text
          style={[styles.title, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}
        >
          AEGIS Locked
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
          ]}
        >
          Authenticate to access the SOC command center
        </Text>

        {failed && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: colors.redDim, borderColor: colors.redBorder },
            ]}
          >
            <Ionicons name="warning" size={14} color={colors.red} />
            <Text style={[styles.errorText, { color: colors.red, fontFamily: 'Inter_400Regular' }]}>
              {failCount >= 2
                ? 'Biometric not recognized. Use your device passcode to continue.'
                : 'Authentication failed — try again or use passcode.'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.unlockBtn,
            { backgroundColor: colors.amber, opacity: unlocking ? 0.7 : 1 },
          ]}
          onPress={handleUnlock}
          disabled={unlocking}
          activeOpacity={0.8}
          accessibilityLabel="Unlock with biometrics"
          accessibilityRole="button"
        >
          {unlocking ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <>
              <Ionicons name="finger-print" size={20} color={colors.background} />
              <Text
                style={[
                  styles.unlockText,
                  { color: colors.background, fontFamily: 'Inter_600SemiBold' },
                ]}
              >
                Unlock with Biometrics
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.passcodeBtn,
            {
              borderColor: colors.amberBorder,
              opacity: unlocking ? 0.5 : 1,
            },
          ]}
          onPress={handlePasscode}
          disabled={unlocking}
          activeOpacity={0.8}
          accessibilityLabel="Use device passcode"
          accessibilityRole="button"
        >
          <Ionicons name="keypad" size={16} color={colors.amber} />
          <Text
            style={[
              styles.passcodeText,
              { color: colors.amber, fontFamily: 'Inter_400Regular' },
            ]}
          >
            Use Passcode
          </Text>
        </TouchableOpacity>

        <View style={styles.secNote}>
          <Ionicons name="shield-checkmark" size={12} color={colors.mutedForeground} />
          <Text
            style={[
              styles.secNoteText,
              { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
            ]}
          >
            AEGIS · SOC Command Center
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 380, paddingHorizontal: 32, alignItems: 'center' },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, letterSpacing: 4, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
    marginBottom: 16,
  },
  errorText: { fontSize: 12, flex: 1, lineHeight: 17 },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 52,
    borderRadius: 12,
    marginBottom: 10,
  },
  unlockText: { fontSize: 15 },
  passcodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  passcodeText: { fontSize: 14 },
  secNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secNoteText: { fontSize: 11 },
});
