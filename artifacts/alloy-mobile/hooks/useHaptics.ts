import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export type HapticSeverity = "info" | "warning" | "critical" | "success" | "selection";

const isNative = Platform.OS !== "web";

export const useHaptics = () => {
  const trigger = async (severity: HapticSeverity) => {
    if (!isNative) return;
    switch (severity) {
      case "info":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "critical":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((r) => setTimeout(r, 120));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((r) => setTimeout(r, 80));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "selection":
        await Haptics.selectionAsync();
        break;
    }
  };

  const pulse = async () => {
    if (!isNative) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const doubleTap = async () => {
    if (!isNative) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const sustained = async () => {
    if (!isNative) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((r) => setTimeout(r, 60));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((r) => setTimeout(r, 60));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  return { trigger, pulse, doubleTap, sustained };
};
