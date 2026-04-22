import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useScreenshotGuard } from '@/context/ScreenshotGuardContext';
import { type WorkspaceDomain, useWorkspace } from '@/context/WorkspaceContext';

export function ScreenshotPolicyEnforcer() {
  const { activeWorkspace } = useWorkspace();
  const { isPolicyEnabled } = useScreenshotGuard();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const shouldProtect = isPolicyEnabled(activeWorkspace as WorkspaceDomain);

    if (shouldProtect) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    }
  }, [activeWorkspace, isPolicyEnabled]);

  return null;
}
