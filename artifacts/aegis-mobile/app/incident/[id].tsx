import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { useColors } from "@/hooks/useColors";
import { apiGet, apiPut } from "@/lib/apiClient";

interface IncidentDetail {
  id: number;
  title: string;
  description?: string;
  severity: string;
  status: string;
  assignedAnalyst?: string;
  attackTechnique?: string;
  detectedAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
}

interface IncidentUpdate {
  status?: string;
  severity?: string;
  resolvedAt?: string;
}

async function fetchIncident(id: string): Promise<IncidentDetail> {
  return apiGet<IncidentDetail>(`/api/firestorm/incidents/${id}`);
}

async function updateIncident(id: string, data: IncidentUpdate): Promise<IncidentDetail> {
  return apiPut<IncidentDetail>(`/api/firestorm/incidents/${id}`, data);
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#3B82F6",
};

const STATUS_ORDER = ["detection", "triage", "investigation", "containment", "remediation", "closed"];

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [updating, setUpdating] = useState(false);
  const [biometricPassed, setBiometricPassed] = useState(Platform.OS === "web");
  const [biometricChecking, setBiometricChecking] = useState(Platform.OS !== "web");

  useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) { setBiometricPassed(true); setBiometricChecking(false); return; }
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to access incident details",
          cancelLabel: "Cancel",
          fallbackLabel: "Use Passcode",
        });
        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setBiometricPassed(true);
        } else {
          router.back();
        }
      } catch {
        router.back();
      } finally {
        setBiometricChecking(false);
      }
    })();
  }, []);

  const { data: incident, isLoading, error } = useQuery({
    queryKey: ["aegis-incident", id],
    queryFn: () => fetchIncident(id!),
    enabled: !!id && biometricPassed,
  });

  const updateMut = useMutation({
    mutationFn: (data: IncidentUpdate) => updateIncident(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aegis-incidents"] });
      qc.invalidateQueries({ queryKey: ["aegis-incident", id] });
    },
  });

  const handleAdvance = () => {
    if (!incident) return;
    const idx = STATUS_ORDER.indexOf(incident.status);
    if (idx < STATUS_ORDER.length - 1) {
      const next = STATUS_ORDER[idx + 1];
      const updates: IncidentUpdate = { status: next };
      if (next === "closed") updates.resolvedAt = new Date().toISOString();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      updateMut.mutate(updates);
    }
  };

  const handleEscalate = () => {
    Alert.alert("Escalate to Critical", "This will escalate the incident to Critical severity.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Escalate",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          updateMut.mutate({ severity: "critical" });
        },
      },
    ]);
  };

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInsets = insets.bottom + (Platform.OS === "web" ? 34 : 0);
  const sevColor = incident ? (SEVERITY_COLORS[incident.severity] ?? colors.amber) : colors.amber;

  if (biometricChecking) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="finger-print" size={48} color={colors.amber} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_400Regular", fontSize: 13 }}>Authenticating…</Text>
      </View>
    );
  }

  if (!biometricPassed) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed" size={48} color={colors.red} />
        <Text style={{ color: colors.red, marginTop: 12, fontFamily: "Inter_500Medium" }}>Access Denied</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.amber} size="large" />
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.red }]}>Incident not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInsets + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "SpaceGrotesk_600SemiBold" }]} numberOfLines={1}>
          Incident #{id}
        </Text>
        <View style={[styles.sevPill, { backgroundColor: `${sevColor}20`, borderColor: `${sevColor}50` }]}>
          <Text style={[styles.sevPillText, { color: sevColor }]}>{incident.severity?.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInsets + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.incTitle, { color: colors.foreground, fontFamily: "SpaceGrotesk_700Bold" }]}>
          {incident.title}
        </Text>
        {incident.description && (
          <Text style={[styles.incDescription, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {incident.description}
          </Text>
        )}

        <View style={[styles.metaCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
          {[
            { label: "Status", value: incident.status, capitalize: true },
            { label: "Severity", value: incident.severity, capitalize: true },
            { label: "Analyst", value: incident.assignedAnalyst ?? "Unassigned" },
            { label: "Technique", value: incident.attackTechnique ?? "—", mono: true },
            { label: "Detected", value: incident.detectedAt ? new Date(incident.detectedAt).toLocaleString() : "—" },
            { label: "Updated", value: incident.updatedAt ? new Date(incident.updatedAt).toLocaleString() : "—" },
          ].map((row) => (
            <View key={row.label} style={[styles.metaRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metaKey, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{row.label}</Text>
              <Text style={[styles.metaValue, { color: row.label === "Severity" ? sevColor : colors.foreground, fontFamily: row.mono ? "Inter_500Medium" : "Inter_500Medium" }]}>
                {row.capitalize ? (row.value?.charAt(0).toUpperCase() + row.value?.slice(1)) : row.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>INCIDENT TIMELINE</Text>
        <View style={styles.timeline}>
          {STATUS_ORDER.map((status, idx) => {
            const currentIdx = STATUS_ORDER.indexOf(incident.status);
            const done = idx <= currentIdx;
            const current = idx === currentIdx;
            return (
              <View key={status} style={styles.timelineRow}>
                <View style={{ alignItems: "center", width: 24 }}>
                  <View style={[styles.timelineDot, {
                    backgroundColor: done ? (current ? sevColor : colors.emerald) : colors.border,
                    borderColor: current ? sevColor : done ? colors.emerald : colors.border,
                  }]} />
                  {idx < STATUS_ORDER.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: done && idx < currentIdx ? colors.emerald : colors.border }]} />
                  )}
                </View>
                <View style={{ flex: 1, paddingLeft: 10, paddingBottom: 16 }}>
                  <Text style={[styles.timelineStatus, {
                    color: current ? sevColor : done ? colors.foreground : colors.mutedForeground,
                    fontFamily: current ? "Inter_600SemiBold" : "Inter_400Regular",
                  }]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                  {current && <Text style={[styles.timelineCurrent, { color: sevColor }]}>Current Phase</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {incident.status !== "closed" && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.advanceBtn, { backgroundColor: colors.emeraldDim, borderColor: "rgba(16,185,129,0.25)", flex: 1 }]}
              onPress={handleAdvance}
              disabled={updateMut.isPending}
            >
              <Ionicons name="arrow-forward-circle" size={18} color={colors.emerald} />
              <Text style={[styles.actionBtnText, { color: colors.emerald }]}>Advance Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.advanceBtn, { backgroundColor: colors.redDim, borderColor: colors.redBorder }]}
              onPress={handleEscalate}
              disabled={updateMut.isPending || incident.severity === "critical"}
            >
              <Ionicons name="arrow-up-circle" size={18} color={colors.red} />
              <Text style={[styles.actionBtnText, { color: colors.red }]}>Escalate</Text>
            </TouchableOpacity>
          </View>
        )}

        {incident.status === "closed" && incident.resolvedAt && (
          <View style={[styles.resolvedBanner, { backgroundColor: colors.emeraldDim, borderColor: "rgba(16,185,129,0.25)" }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.emerald} />
            <Text style={[styles.resolvedText, { color: colors.emerald }]}>
              Resolved {new Date(incident.resolvedAt).toLocaleString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  errorText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 16 },
  sevPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  sevPillText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  incTitle: { fontSize: 20, lineHeight: 28, marginBottom: 10 },
  incDescription: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  metaCard: { borderRadius: 12, borderWidth: 1, marginBottom: 24, overflow: "hidden" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  metaKey: { fontSize: 12 },
  metaValue: { fontSize: 13, textAlign: "right", flex: 1, marginLeft: 12 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 },
  timeline: { marginBottom: 24 },
  timelineRow: { flexDirection: "row" },
  timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineStatus: { fontSize: 14 },
  timelineCurrent: { fontSize: 10, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 12 },
  advanceBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resolvedBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  resolvedText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
