import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Animated as RNAnimated,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export interface RedAlertIncident {
  id: number | string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  attackTechnique?: string;
  affectedAsset?: string;
  detectedAt?: string;
}

interface RedAlertOverlayProps {
  visible: boolean;
  incident: RedAlertIncident | null;
  onDismiss: () => void;
  onAcknowledge: () => void;
  onEscalate: () => void;
  onContain: () => void;
}

export function RedAlertOverlay({
  visible,
  incident,
  onDismiss,
  onAcknowledge,
  onEscalate,
  onContain,
}: RedAlertOverlayProps) {
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const glowAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    if (Platform.OS !== "web") {
      const triggerHaptic = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((r) => setTimeout(r, 100));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((r) => setTimeout(r, 80));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      };
      triggerHaptic();
    }

    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, { toValue: 1.08, duration: 500, useNativeDriver: true }),
        RNAnimated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    const glow = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glowAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
        RNAnimated.timing(glowAnim, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [visible]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(239,68,68,0.3)", "rgba(239,68,68,0.9)"],
  });

  if (!incident) return null;

  const timeAgo = incident.detectedAt
    ? (() => {
        const ms = Date.now() - new Date(incident.detectedAt).getTime();
        const mins = Math.floor(ms / 60000);
        return mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
      })()
    : "unknown";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <RNAnimated.View
          style={[
            styles.container,
            { transform: [{ scale: pulseAnim }], borderColor },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.alertBadge}>
              <Feather name="alert-octagon" size={18} color="#ef4444" />
              <Text style={styles.alertBadgeText}>RED ALERT</Text>
            </View>
            <Text style={styles.incidentId}>INC-{incident.id}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={3}>
              {incident.title}
            </Text>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Severity</Text>
                <Text style={[styles.metaValue, { color: "#ef4444" }]}>
                  {incident.severity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Detected</Text>
                <Text style={styles.metaValue}>{timeAgo}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={styles.metaValue}>{incident.status}</Text>
              </View>
            </View>

            {incident.attackTechnique && (
              <View style={styles.techniqueBox}>
                <Feather name="crosshair" size={12} color="#ef4444" />
                <Text style={styles.techniqueText}>{incident.attackTechnique}</Text>
              </View>
            )}

            {incident.affectedAsset && (
              <View style={styles.assetBox}>
                <Feather name="server" size={12} color="#f59e0b" />
                <Text style={styles.assetText}>{incident.affectedAsset}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, styles.acknowledgeBtn]}
              onPress={onAcknowledge}
            >
              <Feather name="eye" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Acknowledge</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.containBtn]}
              onPress={onContain}
            >
              <Feather name="shield" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Contain</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.escalateBtn]}
              onPress={onEscalate}
            >
              <Feather name="arrow-up" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Escalate</Text>
            </Pressable>
          </View>

          <Pressable style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>Dismiss alert</Text>
          </Pressable>
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: "#0f0a0a",
    overflow: "hidden",
    gap: 0,
  },
  header: {
    backgroundColor: "#ef444415",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239,68,68,0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertBadgeText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#ef4444",
    letterSpacing: 2,
  },
  incidentId: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(239,68,68,0.6)",
    letterSpacing: 1,
  },
  body: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    lineHeight: 26,
  },
  metaGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: { flex: 1, gap: 3 },
  metaLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.85)",
  },
  techniqueBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    padding: 10,
  },
  techniqueText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(239,68,68,0.8)",
  },
  assetBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    padding: 10,
  },
  assetText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(245,158,11,0.8)",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingTop: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  acknowledgeBtn: { backgroundColor: "#1d4ed8" },
  containBtn: { backgroundColor: "#b45309" },
  escalateBtn: { backgroundColor: "#991b1b" },
  actionBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  dismissBtn: {
    alignItems: "center",
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  dismissText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
  },
});
