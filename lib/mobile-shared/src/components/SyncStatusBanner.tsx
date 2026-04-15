import React, { useContext, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SyncEngineContext } from "../context/SyncEngineContext";

interface Props {
  accentColor?: string;
  textColor?: string;
}

export function SyncStatusBanner({ accentColor = "#6366f1", textColor = "#fff" }: Props) {
  const ctx = useContext(SyncEngineContext);
  const slideAnim = useRef(new Animated.Value(-48)).current;

  const syncing = ctx?.syncing ?? false;
  const pending = ctx?.pending ?? 0;
  const conflicts = ctx?.conflicts?.length ?? 0;
  const failedCount = ctx?.failedCount ?? 0;
  const lastSyncedAt = ctx?.lastSyncedAt ?? null;

  const visible = syncing || pending > 0 || conflicts > 0 || failedCount > 0;

  let bannerColor = accentColor;
  let label = "";

  if (conflicts > 0) {
    bannerColor = "#ef4444";
    label = `${conflicts} conflict${conflicts === 1 ? "" : "s"} need resolution`;
  } else if (failedCount > 0) {
    bannerColor = "#f59e0b";
    label = `${failedCount} change${failedCount === 1 ? "" : "s"} failed to sync`;
  } else if (syncing) {
    bannerColor = accentColor;
    label = `Syncing ${pending} pending change${pending === 1 ? "" : "s"}…`;
  } else if (pending > 0) {
    bannerColor = "#64748b";
    label = `${pending} pending change${pending === 1 ? "" : "s"} — waiting for connection`;
  }

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -48,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [visible, slideAnim]);

  const handleRetry = () => {
    ctx?.retryFailed?.();
  };

  const showRetry = failedCount > 0 && !syncing;

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: bannerColor, transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={styles.row}>
        <PulsingDot color={textColor} active={syncing} />
        <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
        {showRetry && (
          <TouchableOpacity onPress={handleRetry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.actionText, { color: textColor }]}>Retry</Text>
          </TouchableOpacity>
        )}
        {lastSyncedAt && !syncing && !pending && !failedCount && !conflicts && (
          <Text style={[styles.timestampText, { color: textColor }]}>
            Synced
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function PulsingDot({ color, active }: { color: string; active: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      opacity.setValue(1);
    }
  }, [active, opacity]);

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: color, opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  timestampText: {
    fontSize: 11,
    opacity: 0.7,
  },
});
