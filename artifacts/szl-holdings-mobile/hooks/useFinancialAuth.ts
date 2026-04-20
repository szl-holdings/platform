import { useBiometric } from '@szl-holdings/mobile-shared';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { hasPINSet } from '@/components/PINModal';

export function useFinancialAuth() {
  const { isEnabled: biometricEnabled } = useBiometric();

  const promptIfRequired = useCallback(
    async (
      isFinancialReauthEnabled: boolean,
      onAuthorized: () => void,
      onPINRequired: () => void,
    ): Promise<void> => {
      if (!isFinancialReauthEnabled) {
        onAuthorized();
        return;
      }

      if (Platform.OS === 'web') {
        onAuthorized();
        return;
      }

      const isBiometricSupported = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const pinSet = await hasPINSet();

      if (!biometricEnabled && !pinSet) {
        Alert.alert(
          'Authentication Required',
          'Financial actions require biometric or PIN authentication. Please configure your security settings before proceeding.',
          [{ text: 'OK' }],
        );
        return;
      }

      if (biometricEnabled && isBiometricSupported && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Financial action requires verification',
          cancelLabel: pinSet ? 'Use PIN' : 'Cancel',
          disableDeviceFallback: false,
        });
        if (result.success) {
          onAuthorized();
          return;
        }
        if (pinSet) {
          onPINRequired();
          return;
        }
        return;
      }

      if (pinSet) {
        onPINRequired();
        return;
      }

      Alert.alert(
        'Authentication Required',
        'Set up biometric or PIN in Security Settings before performing financial actions.',
      );
    },
    [biometricEnabled],
  );

  return { promptIfRequired };
}
