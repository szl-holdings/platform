import React, { useCallback } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export interface SwipeableCardProps {
  children: React.ReactNode;
  onApprove?: () => void;
  onDismiss?: () => void;
  onEscalate?: () => void;
  approveLabel?: string;
  dismissLabel?: string;
  approveColor?: string;
  dismissColor?: string;
  escalateColor?: string;
  threshold?: number;
  style?: object;
}

const THRESHOLD = 80;

export function SwipeableCard({
  children,
  onApprove,
  onDismiss,
  onEscalate,
  approveLabel = "Approve",
  dismissLabel = "Dismiss",
  approveColor = "#22c55e",
  dismissColor = "#ef4444",
  escalateColor = "#f59e0b",
  style,
}: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const hapticFn = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  }, []);

  const hapticHeavy = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const tx = event.translationX;

      if (tx > THRESHOLD && onApprove) {
        runOnJS(hapticFn)();
        opacity.value = withTiming(0, { duration: 200 });
        translateX.value = withSpring(400);
        runOnJS(onApprove)();
      } else if (tx < -THRESHOLD && onDismiss) {
        runOnJS(hapticFn)();
        opacity.value = withTiming(0, { duration: 200 });
        translateX.value = withSpring(-400);
        runOnJS(onDismiss)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(600)
    .onStart(() => {
      if (onEscalate) {
        runOnJS(hapticHeavy)();
        runOnJS(onEscalate)();
      }
    });

  const composed = Gesture.Simultaneous(panGesture, longPressGesture);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const approveOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(translateX.value / THRESHOLD, 0), 1),
  }));

  const dismissOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(-translateX.value / THRESHOLD, 0), 1),
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.actionLeft, { backgroundColor: approveColor }, approveOpacity]}>
        <Feather name="check" size={20} color="#fff" />
        <Text style={styles.actionLabel}>{approveLabel}</Text>
      </Animated.View>

      <Animated.View style={[styles.actionRight, { backgroundColor: dismissColor }, dismissOpacity]}>
        <Feather name="x" size={20} color="#fff" />
        <Text style={styles.actionLabel}>{dismissLabel}</Text>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.card, animStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
  },
  card: {
    zIndex: 2,
  },
  actionLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "40%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    zIndex: 1,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  actionRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "40%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    zIndex: 1,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
