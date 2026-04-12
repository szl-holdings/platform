import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

export interface Runbook {
  id: string;
  name: string;
  description: string;
  steps: string[];
  estimatedTime: string;
  severity: "critical" | "high" | "medium";
}

const DEFAULT_RUNBOOKS: Runbook[] = [
  {
    id: "srv-restart",
    name: "Service Restart",
    description: "Graceful restart of degraded microservice",
    estimatedTime: "~2 min",
    severity: "medium",
    steps: [
      "Drain active connections",
      "Stop service gracefully",
      "Clear ephemeral cache",
      "Start service with health check",
      "Verify endpoint response",
    ],
  },
  {
    id: "db-failover",
    name: "DB Failover",
    description: "Promote replica to primary",
    estimatedTime: "~5 min",
    severity: "critical",
    steps: [
      "Pause writes on primary",
      "Verify replica lag < 100ms",
      "Promote replica",
      "Update connection strings",
      "Resume writes and verify",
    ],
  },
  {
    id: "cache-flush",
    name: "Cache Flush",
    description: "Clear Redis cache for stale data",
    estimatedTime: "~30 sec",
    severity: "medium",
    steps: [
      "Identify affected cache keys",
      "FLUSHDB on target namespace",
      "Warm critical cache keys",
      "Verify hit rates normalized",
    ],
  },
  {
    id: "circuit-reset",
    name: "Circuit Breaker Reset",
    description: "Reset open circuit breakers",
    estimatedTime: "~1 min",
    severity: "high",
    steps: [
      "Check upstream dependencies",
      "Reset circuit breaker state",
      "Gradually allow traffic",
      "Monitor error rates",
    ],
  },
];

interface ShakeToRestartProps {
  visible: boolean;
  onClose: () => void;
  runbooks?: Runbook[];
}

export function ShakeToRestart({ visible, onClose, runbooks = DEFAULT_RUNBOOKS }: ShakeToRestartProps) {
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [executing, setExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setSelectedRunbook(null);
      setExecuting(false);
      setCurrentStep(0);
      setCompleted(false);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }

    RNAnimated.sequence([
      RNAnimated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const executeRunbook = useCallback(async (runbook: Runbook) => {
    setSelectedRunbook(runbook);
    setExecuting(true);
    setCurrentStep(0);
    setCompleted(false);
    progressAnim.setValue(0);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }

    for (let i = 0; i < runbook.steps.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, 1200));
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }

    setCompleted(true);
    setExecuting(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, []);

  const sevColor = {
    critical: "#ef4444",
    high: "#f59e0b",
    medium: "#22c55e",
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <RNAnimated.View
          style={[styles.panel, { transform: [{ translateX: shakeAnim }] }]}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Feather name="refresh-cw" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.title}>Shake to Restart</Text>
                <Text style={styles.subtitle}>Select a remediation runbook</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.4)" />
            </Pressable>
          </View>

          {!executing && !selectedRunbook && (
            <ScrollView contentContainerStyle={styles.runbookList} showsVerticalScrollIndicator={false}>
              {runbooks.map((rb) => (
                <Pressable
                  key={rb.id}
                  style={[styles.runbookCard, { borderColor: `${sevColor[rb.severity]}30` }]}
                  onPress={() => executeRunbook(rb)}
                >
                  <View style={styles.runbookTop}>
                    <Text style={styles.runbookName}>{rb.name}</Text>
                    <View style={[styles.sevBadge, { backgroundColor: `${sevColor[rb.severity]}20` }]}>
                      <Text style={[styles.sevText, { color: sevColor[rb.severity] }]}>
                        {rb.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.runbookDesc}>{rb.description}</Text>
                  <View style={styles.runbookBottom}>
                    <Feather name="clock" size={10} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.timeText}>{rb.estimatedTime}</Text>
                    <Text style={styles.stepsText}>{rb.steps.length} steps</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {(executing || completed) && selectedRunbook && (
            <View style={styles.executionView}>
              <Text style={styles.execTitle}>{selectedRunbook.name}</Text>

              {completed ? (
                <View style={styles.successView}>
                  <View style={styles.successIcon}>
                    <Feather name="check-circle" size={32} color="#22c55e" />
                  </View>
                  <Text style={styles.successText}>Runbook completed successfully</Text>
                  <Text style={styles.successSub}>All {selectedRunbook.steps.length} steps executed</Text>
                </View>
              ) : (
                <View style={styles.stepsView}>
                  {selectedRunbook.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={[
                        styles.stepDot,
                        i < currentStep && { backgroundColor: "#22c55e" },
                        i === currentStep && { backgroundColor: "#f59e0b" },
                        i > currentStep && { backgroundColor: "rgba(255,255,255,0.1)" },
                      ]} />
                      <Text style={[
                        styles.stepText,
                        i < currentStep && { color: "rgba(255,255,255,0.4)" },
                        i === currentStep && { color: "#fff" },
                        i > currentStep && { color: "rgba(255,255,255,0.25)" },
                      ]}>
                        {step}
                      </Text>
                      {i === currentStep && (
                        <View style={styles.spinner}>
                          <Feather name="loader" size={12} color="#f59e0b" />
                        </View>
                      )}
                      {i < currentStep && (
                        <Feather name="check" size={12} color="#22c55e" />
                      )}
                    </View>
                  ))}
                </View>
              )}

              {completed && (
                <Pressable style={styles.doneBtn} onPress={onClose}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </Pressable>
              )}
            </View>
          )}
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  panel: {
    maxHeight: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245,158,11,0.1)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  subtitle: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  runbookList: { padding: 16, gap: 10 },
  runbookCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  runbookTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  runbookName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sevText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  runbookDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
  runbookBottom: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)", flex: 1 },
  stepsText: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.3)" },
  executionView: { padding: 20, gap: 16 },
  execTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  stepsView: { gap: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  spinner: {},
  successView: { alignItems: "center", gap: 12, paddingVertical: 20 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(34,197,94,0.1)", alignItems: "center", justifyContent: "center" },
  successText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#22c55e" },
  successSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  doneBtn: { backgroundColor: "#22c55e", borderRadius: 12, padding: 14, alignItems: "center" },
  doneBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#000" },
});
