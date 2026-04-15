import { useEffect } from "react";
import { Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useScreenshotGuard } from "@/context/ScreenshotGuardContext";
import type { WorkspaceDomain } from "@/context/WorkspaceContext";

export function ScreenshotPolicyEnforcer() {
  const { activeWorkspace } = useWorkspace();
  const { isPolicyEnabled } = useScreenshotGuard();

  useEffect(() => {
    if (Platform.OS === "web") return;

    const shouldProtect = isPolicyEnabled(activeWorkspace as WorkspaceDomain);

    if (shouldProtect) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    }
  }, [activeWorkspace, isPolicyEnabled]);

  return null;
}
