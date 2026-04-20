import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface ScreenshotPreventionConfig {
  enabled: boolean;
  onAttempt?: () => void;
}

export function useScreenshotPrevention(config: ScreenshotPreventionConfig) {
  const { enabled, onAttempt } = config;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    async function apply() {
      try {
        if (enabled) {
          await ScreenCapture.preventScreenCaptureAsync();
        } else {
          await ScreenCapture.allowScreenCaptureAsync();
        }
      } catch {}
    }

    apply();

    return () => {
      if (Platform.OS !== 'web') {
        ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !onAttempt || Platform.OS === 'web') return;

    const sub = ScreenCapture.addScreenshotListener(() => {
      onAttempt();
    });

    return () => sub.remove();
  }, [enabled, onAttempt]);
}

const PROTECTED_WORKSPACES = new Set(['defense', 'portfolio', 'advisory']);

export function useWorkspaceScreenshotGuard(workspaceId: string) {
  const [policyOverride, setPolicyOverride] = useState<boolean | null>(null);
  const isProtectedByDefault = PROTECTED_WORKSPACES.has(workspaceId);
  const isEnabled = policyOverride !== null ? policyOverride : isProtectedByDefault;

  useScreenshotPrevention({ enabled: isEnabled });

  const setProtected = useCallback((val: boolean) => {
    setPolicyOverride(val);
  }, []);

  return { isProtected: isEnabled, isProtectedByDefault, setProtected };
}
